import os
import json
import pytest
from moto import mock_aws
import boto3


@pytest.fixture(scope='function')
def app_client(monkeypatch):
    os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
    os.environ['AWS_REGION'] = os.environ['AWS_DEFAULT_REGION']
    with mock_aws():
        # Create mock SSM params used by settings
        ssm = boto3.client('ssm')
        env_vars = {
            'JWT_ISSUER': 'https://auth.local',
            'JWT_AUDIENCE': 'api://default',
            'COGNITO_REGION': 'us-east-2',
            'SES_SENDER_EMAIL': 'no-reply@example.com',
            'APP_BASE_URL': 'http://localhost:5050',
            'DYNAMODB_USERS_TABLE': 'goalsguild_users',
            'CORE_TABLE': 'gg_core',
            'LOGIN_ATTEMPTS_TABLE': 'goalsguild_login_attempts',
            'APPSYNC_SUBSCRIPTION_KEY': 'test-sub-key',
            'APPSYNC_SUBSCRIPTION_KEY_EXPIRES_AT': '2099-01-01T00:00:00Z',
            'APPSYNC_AVAILABILITY_KEY': 'test-availability-key',
            'APPSYNC_AVAILABILITY_KEY_EXPIRES_AT': '2099-01-01T00:00:00Z'
        }
        ssm.put_parameter(Name='/goalsguild/user-service/env_vars', Type='String', Value=json.dumps(env_vars))
        ssm.put_parameter(Name='/goalsguild/user-service/JWT_SECRET', Type='SecureString', Value='secret')
        ssm.put_parameter(Name='/goalsguild/user-service/email_token_secret', Type='SecureString', Value='emailsecret')

        # Create mock DynamoDB tables
        ddb = boto3.client('dynamodb')
        # users table
        ddb.create_table(
            TableName='goalsguild_users',
            KeySchema=[{'AttributeName':'pk','KeyType':'HASH'}, {'AttributeName':'sk','KeyType':'RANGE'}],
            AttributeDefinitions=[{'AttributeName':'pk','AttributeType':'S'}, {'AttributeName':'sk','AttributeType':'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        # login attempts table (used by login flow)
        ddb.create_table(
            TableName='goalsguild_login_attempts',
            KeySchema=[{'AttributeName':'pk','KeyType':'HASH'}, {'AttributeName':'ts','KeyType':'RANGE'}],
            AttributeDefinitions=[{'AttributeName':'pk','AttributeType':'S'}, {'AttributeName':'ts','AttributeType':'N'}],
            BillingMode='PAY_PER_REQUEST'
        )
        # gg_core table with GSIs
        ddb.create_table(
            TableName='gg_core',
            KeySchema=[{'AttributeName':'PK','KeyType':'HASH'}, {'AttributeName':'SK','KeyType':'RANGE'}],
            AttributeDefinitions=[
                {'AttributeName':'PK','AttributeType':'S'},
                {'AttributeName':'SK','AttributeType':'S'},
                {'AttributeName':'GSI1PK','AttributeType':'S'},
                {'AttributeName':'GSI1SK','AttributeType':'S'},
                {'AttributeName':'GSI2PK','AttributeType':'S'},
                {'AttributeName':'GSI2SK','AttributeType':'S'},
                {'AttributeName':'GSI3PK','AttributeType':'S'},
                {'AttributeName':'GSI3SK','AttributeType':'S'},
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName':'GSI1',
                    'KeySchema':[{'AttributeName':'GSI1PK','KeyType':'HASH'},{'AttributeName':'GSI1SK','KeyType':'RANGE'}],
                    'Projection':{'ProjectionType':'ALL'}
                },
                {
                    'IndexName':'GSI2',
                    'KeySchema':[{'AttributeName':'GSI2PK','KeyType':'HASH'},{'AttributeName':'GSI2SK','KeyType':'RANGE'}],
                    'Projection':{'ProjectionType':'ALL'}
                },
                {
                    'IndexName':'GSI3',
                    'KeySchema':[{'AttributeName':'GSI3PK','KeyType':'HASH'},{'AttributeName':'GSI3SK','KeyType':'RANGE'}],
                    'Projection':{'ProjectionType':'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )

        # Avoid sending emails during tests
        import importlib
        main = importlib.import_module('app.main')
        from fastapi.testclient import TestClient
        monkeypatch.setattr(main, 'send_email', lambda *a, **k: None)
        client = TestClient(main.app)
        yield client


def test_health_ok(app_client):
    r = app_client.get('/health')
    assert r.status_code == 200
    assert r.json().get('ok') is True


def test_signup_missing_email(app_client):
    payload = {
        'provider': 'local',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 400


def test_signup_invalid_country(app_client):
    payload = {
        'provider': 'local',
        'email': 'user@example.com',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa',
        'country': 'ZZ'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 400


def test_signup_too_recent_birthdate(app_client):
    payload = {
        'provider': 'local',
        'email': 'user2@example.com',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa',
        'country': 'US',
        'birthDate': '2099-01-01'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 400


def test_signup_ok_and_duplicate_email_lock(app_client):
    payload = {
        'provider': 'local',
        'email': 'uniq@example.com',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa',
        'country': 'US'
    }
    r1 = app_client.post('/users/signup', json=payload)
    assert r1.status_code == 200
    r2 = app_client.post('/users/signup', json=payload)
    assert r2.status_code in (200, 409)


def test_login_requires_confirmation_and_then_succeeds(app_client):
    import boto3
    from passlib.context import CryptContext
    # Signup first
    email = 'flow@example.com'
    password = 'Aa1!aaaa'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Flow User',
        'password': password,
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Attempt login before confirmation → 403
    r_forbidden = app_client.post('/users/login', json={'email': email, 'password': password})
    assert r_forbidden.status_code == 403

    # Mark email as confirmed in gg_core profile
    import boto3
    c = boto3.client('dynamodb')
    q = c.query(TableName='gg_core', IndexName='GSI3',
                KeyConditionExpression='#p = :v',
                ExpressionAttributeNames={'#p': 'GSI3PK'},
                ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}})
    it = q['Items'][0]
    pk = it['PK']['S']; sk = it['SK']['S']
    tbl = boto3.resource('dynamodb').Table('gg_core')
    tbl.update_item(Key={'PK': pk, 'SK': sk},
                    UpdateExpression='SET email_confirmed=:t',
                    ExpressionAttributeValues={':t': True})

    # Now login should succeed
    r_ok = app_client.post('/users/login', json={'email': email, 'password': password})


def test_signup_writes_core_profile_with_gsis(app_client):
    import boto3
    email = 'gsis@example.com'
    nickname = 'nick123'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'GSIs User',
        'password': 'Aa1!aaaa',
        'country': 'US',
        'nickname': nickname,
        'tags': ['a','b']
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    ddb = boto3.client('dynamodb')
    # Query by GSI3 (email)
    q = ddb.query(
        TableName='gg_core',
        IndexName='GSI3',
        KeyConditionExpression='#p = :v',
        ExpressionAttributeNames={'#p': 'GSI3PK'},
        ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}}
    )
    items = q.get('Items', [])
    assert len(items) == 1
    it = items[0]
    # Basic keys present
    assert it['PK']['S'].startswith('USER#')
    assert it['SK']['S'].startswith('PROFILE#')
    # GSIs set
    assert it['GSI1PK']['S'] == it['PK']['S']
    assert it['GSI1SK']['S'].startswith('ENTITY#User#')
    assert it['GSI2PK']['S'] == f'NICK#{nickname}'
    assert it['GSI3PK']['S'] == f'EMAIL#{email}'


def test_signup_duplicate_nickname_conflict(app_client):
    payload1 = {
        'provider': 'local',
        'email': 'n1@example.com',
        'fullName': 'User 1',
        'password': 'Aa1!aaaa',
        'country': 'US',
        'nickname': 'sameNick'
    }
    payload2 = {
        'provider': 'local',
        'email': 'n2@example.com',
        'fullName': 'User 2',
        'password': 'Aa1!aaaa',
        'country': 'US',
        'nickname': 'sameNick'
    }
    r1 = app_client.post('/users/signup', json=payload1)
    assert r1.status_code == 200
    r2 = app_client.post('/users/signup', json=payload2)
    assert r2.status_code in (409, 500)


def test_google_signup_creates_core_profile_and_lock(app_client, monkeypatch):
    import importlib, boto3
    main = importlib.import_module('app.main')

    # Mock Google exchange and JWT verification
    monkeypatch.setattr(main, 'exchange_auth_code_for_tokens', lambda code, redirect_uri: {
        'access_token': 'at', 'id_token': 'id', 'refresh_token': 'rt', 'expires_in': 3600
    })
    monkeypatch.setattr(main, 'verify_cognito_jwt', lambda id_token: {
        'email': 'guser@example.com', 'sub': 'google-sub-123', 'name': 'G User'
    })

    payload = {
        'provider': 'google',
        'authorization_code': 'abc',
        'redirect_uri': 'http://localhost/callback'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    ddb = boto3.client('dynamodb')
    # Verify email lock exists
    lock = ddb.get_item(TableName='gg_core', Key={
        'PK': {'S': 'EMAIL#guser@example.com'}, 'SK': {'S': 'UNIQUE#USER'}
    })
    assert 'Item' in lock

    # Verify profile via GSI3
    q = ddb.query(
        TableName='gg_core', IndexName='GSI3',
        KeyConditionExpression='#p = :v',
        ExpressionAttributeNames={'#p': 'GSI3PK'},
        ExpressionAttributeValues={':v': {'S': 'EMAIL#guser@example.com'}}
    )
    items = q.get('Items', [])
    assert len(items) == 1
    it = items[0]
    assert it['PK']['S'] == 'USER#google-sub-123'
    assert it['SK']['S'] == 'PROFILE#google-sub-123'
    assert it['GSI1PK']['S'] == 'USER#google-sub-123'
    assert it['GSI1SK']['S'].startswith('ENTITY#User#')


def test_health_ok(app_client):
    r = app_client.get('/health')
    assert r.status_code == 200
    assert r.json().get('ok') is True


def test_login_missing_fields(app_client):
    # Test missing email
    r = app_client.post('/users/login', json={'password': 'test'})
    assert r.status_code == 422

    # Test missing password
    r = app_client.post('/users/login', json={'email': 'test@example.com'})
    assert r.status_code == 422


def test_login_invalid_credentials(app_client):
    # First signup a user
    email = 'login-test@example.com'
    password = 'Aa1!aaaa'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Login Test',
        'password': password,
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Try login with wrong password
    r = app_client.post('/users/login', json={'email': email, 'password': 'wrong'})
    assert r.status_code == 401
    assert 'Invalid credentials' in r.json()['detail']

    # Try login with non-existent email
    r = app_client.post('/users/login', json={'email': 'nonexistent@example.com', 'password': 'test'})
    assert r.status_code == 401


def test_login_success_after_confirmation(app_client):
    import boto3
    # Signup first
    email = 'confirmed-login@example.com'
    password = 'Aa1!aaaa'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Confirmed Login',
        'password': password,
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Mark email as confirmed
    c = boto3.client('dynamodb')
    q = c.query(TableName='gg_core', IndexName='GSI3',
                KeyConditionExpression='#p = :v',
                ExpressionAttributeNames={'#p': 'GSI3PK'},
                ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}})
    it = q['Items'][0]
    pk = it['PK']['S']; sk = it['SK']['S']
    tbl = boto3.resource('dynamodb').Table('gg_core')
    tbl.update_item(Key={'PK': pk, 'SK': sk},
                    UpdateExpression='SET email_confirmed=:t',
                    ExpressionAttributeValues={':t': True})

    # Now login should succeed
    r = app_client.post('/users/login', json={'email': email, 'password': password})
    assert r.status_code == 200
    response_data = r.json()
    assert 'access_token' in response_data
    assert 'expires_in' in response_data


def test_confirm_email_invalid_token(app_client):
    r = app_client.get('/users/confirm-email?token=invalid')
    assert r.status_code == 400
    assert 'Invalid or expired token' in r.json()['detail']


def test_confirm_email_success(app_client):
    import boto3
    from app.tokens import issue_link_token, TokenPurpose

    # First create a user
    email = 'confirm-test@example.com'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Confirm Test',
        'password': 'Aa1!aaaa',
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Get user ID
    c = boto3.client('dynamodb')
    q = c.query(TableName='gg_core', IndexName='GSI3',
                KeyConditionExpression='#p = :v',
                ExpressionAttributeNames={'#p': 'GSI3PK'},
                ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}})
    user_id = q['Items'][0]['PK']['S'].replace('USER#', '')

    # Generate confirmation token
    token = issue_link_token(user_id, TokenPurpose.CONFIRM_EMAIL)

    # Confirm email
    r = app_client.get(f'/users/confirm-email?token={token}')
    assert r.status_code == 200
    assert r.json()['email_confirmed'] is True

    # Verify in database
    tbl = boto3.resource('dynamodb').Table('gg_core')
    response = tbl.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'})
    item = response['Item']
    assert item['email_confirmed'] is True


def test_password_change_invalid_token(app_client):
    payload = {
        'token': 'invalid',
        'new_password': 'NewAa1!aaaa'
    }
    r = app_client.post('/password/change', json=payload)
    assert r.status_code == 400


def test_password_change_success(app_client):
    import boto3
    from app.tokens import issue_link_token, TokenPurpose

    # First create and confirm a user
    email = 'password-change@example.com'
    old_password = 'Aa1!aaaa'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Password Change',
        'password': old_password,
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Get user ID and confirm email
    c = boto3.client('dynamodb')
    q = c.query(TableName='gg_core', IndexName='GSI3',
                KeyConditionExpression='#p = :v',
                ExpressionAttributeNames={'#p': 'GSI3PK'},
                ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}})
    user_id = q['Items'][0]['PK']['S'].replace('USER#', '')

    # Confirm email
    tbl = boto3.resource('dynamodb').Table('gg_core')
    tbl.update_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
                    UpdateExpression='SET email_confirmed=:t',
                    ExpressionAttributeValues={':t': True})

    # Generate password change token
    token = issue_link_token(user_id, TokenPurpose.CHANGE_PASSWORD)

    # Change password
    new_password = 'NewAa1!aaaa'
    payload = {
        'token': token,
        'new_password': new_password
    }
    r = app_client.post('/password/change', json=payload)
    assert r.status_code == 200

    # Verify login with new password works
    r = app_client.post('/users/login', json={'email': email, 'password': new_password})
    assert r.status_code == 200


def test_temp_password_invalid_email(app_client):
    payload = {'email': 'nonexistent@example.com'}
    r = app_client.post('/password/temp', json=payload)
    assert r.status_code == 404


def test_temp_password_success(app_client):
    # First create a user
    email = 'temp-password@example.com'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Temp Password',
        'password': 'Aa1!aaaa',
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Request temp password
    payload = {'email': email}
    r = app_client.post('/password/temp', json=payload)
    assert r.status_code == 200


def test_auth_renew_invalid_token(app_client):
    r = app_client.post('/auth/renew', json={'access_token': 'invalid'})
    assert r.status_code == 401


def test_auth_renew_success(app_client):
    import boto3
    from app.security import issue_local_jwt

    # First create and confirm a user
    email = 'renew-test@example.com'
    password = 'Aa1!aaaa'
    payload = {
        'provider': 'local',
        'email': email,
        'fullName': 'Renew Test',
        'password': password,
        'country': 'US'
    }
    r = app_client.post('/users/signup', json=payload)
    assert r.status_code == 200

    # Get user ID and confirm email
    c = boto3.client('dynamodb')
    q = c.query(TableName='gg_core', IndexName='GSI3',
                KeyConditionExpression='#p = :v',
                ExpressionAttributeNames={'#p': 'GSI3PK'},
                ExpressionAttributeValues={':v': {'S': f'EMAIL#{email}'}})
    user_id = q['Items'][0]['PK']['S'].replace('USER#', '')

    # Confirm email
    tbl = boto3.resource('dynamodb').Table('gg_core')
    tbl.update_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
                    UpdateExpression='SET email_confirmed=:t',
                    ExpressionAttributeValues={':t': True})

    # Login to get initial token
    r = app_client.post('/users/login', json={'email': email, 'password': password})
    assert r.status_code == 200
    initial_token = r.json()['access_token']

    # Renew token
    r = app_client.post('/auth/renew', json={'access_token': initial_token})
    assert r.status_code == 200
    renewed_response = r.json()
    assert 'access_token' in renewed_response
    assert renewed_response['access_token'] != initial_token  # Should be a new token
