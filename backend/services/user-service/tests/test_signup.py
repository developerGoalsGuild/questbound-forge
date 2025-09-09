import os
import json
import pytest
from moto import mock_aws
import boto3


@pytest.fixture(scope='function')
def app_client(monkeypatch):
    os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
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
            'LOGIN_ATTEMPTS_TABLE': 'goalsguild_login_attempts'
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
    r = app_client.post('/signup', json=payload)
    assert r.status_code == 400


def test_signup_invalid_country(app_client):
    payload = {
        'provider': 'local',
        'email': 'user@example.com',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa',
        'country': 'ZZ'
    }
    r = app_client.post('/signup', json=payload)
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
    r = app_client.post('/signup', json=payload)
    assert r.status_code == 400


def test_signup_ok_and_duplicate_email_lock(app_client):
    payload = {
        'provider': 'local',
        'email': 'uniq@example.com',
        'fullName': 'Test User',
        'password': 'Aa1!aaaa',
        'country': 'US'
    }
    r1 = app_client.post('/signup', json=payload)
    assert r1.status_code == 200
    r2 = app_client.post('/signup', json=payload)
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
    r = app_client.post('/signup', json=payload)
    assert r.status_code == 200

    # Attempt login before confirmation → 403
    r_forbidden = app_client.post('/login', json={'email': email, 'password': password})
    assert r_forbidden.status_code == 403

    # Mark email as confirmed in users table
    ddb = boto3.resource('dynamodb')
    tbl = ddb.Table('goalsguild_users')
    tbl.update_item(
        Key={'pk': f'USER#{email}', 'sk': 'PROFILE'},
        UpdateExpression='SET email_confirmed=:t',
        ExpressionAttributeValues={':t': True}
    )

    # Now login should succeed
    r_ok = app_client.post('/login', json={'email': email, 'password': password})
    assert r_ok.status_code == 200
    body = r_ok.json()
    assert 'access_token' in body
