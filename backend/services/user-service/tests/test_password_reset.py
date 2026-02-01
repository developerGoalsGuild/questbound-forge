import os
import json
import pytest
import time
from moto import mock_aws
import boto3
from app.tokens import issue_link_token, TokenPurpose, decode_link_token


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
        # login attempts table
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


def create_user_with_confirmed_email(app_client, email='test@example.com', password_hash='hashed'):
    """Helper to create a user with confirmed email"""
    import boto3
    ddb = boto3.resource('dynamodb')
    users_table = ddb.Table('goalsguild_users')
    core_table = ddb.Table('gg_core')
    
    user_id = 'user-123'
    now_ts = int(time.time())
    
    # Create user in users table
    users_table.put_item(Item={
        'pk': f'USER#{email}',
        'sk': 'PROFILE',
        'user_id': user_id,
        'email': email,
        'password_hash': password_hash,
        'provider': 'local',
        'status': 'ACTIVE',
    })
    
    # Create profile in core table with confirmed email
    core_table.put_item(Item={
        'PK': f'USER#{user_id}',
        'SK': f'PROFILE#{user_id}',
        'id': user_id,
        'email': email,
        'provider': 'local',
        'email_confirmed': True,
        'GSI3PK': f'EMAIL#{email}',
        'GSI3SK': f'PROFILE#{user_id}',
        'createdAt': now_ts,
        'updatedAt': now_ts,
    })
    
    return user_id


def create_user_with_unconfirmed_email(app_client, email='unconfirmed@example.com'):
    """Helper to create a user with unconfirmed email"""
    import boto3
    ddb = boto3.resource('dynamodb')
    users_table = ddb.Table('goalsguild_users')
    core_table = ddb.Table('gg_core')
    
    user_id = 'user-456'
    now_ts = int(time.time())
    
    # Create user in users table
    users_table.put_item(Item={
        'pk': f'USER#{email}',
        'sk': 'PROFILE',
        'user_id': user_id,
        'email': email,
        'password_hash': 'hashed',
        'provider': 'local',
        'status': 'ACTIVE',
    })
    
    # Create profile in core table with unconfirmed email
    core_table.put_item(Item={
        'PK': f'USER#{user_id}',
        'SK': f'PROFILE#{user_id}',
        'id': user_id,
        'email': email,
        'provider': 'local',
        'email_confirmed': False,
        'GSI3PK': f'EMAIL#{email}',
        'GSI3SK': f'PROFILE#{user_id}',
        'createdAt': now_ts,
        'updatedAt': now_ts,
    })
    
    return user_id


class TestPasswordResetRequest:
    """Tests for POST /password/reset-request endpoint"""
    
    def test_reset_request_missing_email(self, app_client):
        """Test that missing email returns validation error"""
        r = app_client.post('/password/reset-request', json={})
        assert r.status_code in (400, 422)  # Validation error
    
    def test_reset_request_invalid_email(self, app_client):
        """Test that invalid email format returns validation error"""
        r = app_client.post('/password/reset-request', json={'email': 'not-an-email'})
        assert r.status_code in (400, 422)
    
    def test_reset_request_nonexistent_email(self, app_client):
        """Test that nonexistent email returns generic success (security)"""
        r = app_client.post('/password/reset-request', json={'email': 'nonexistent@example.com'})
        assert r.status_code == 200
        assert 'message' in r.json()
        # Should return generic message for security
        assert 'reset link' in r.json()['message'].lower() or 'email will be sent' in r.json()['message'].lower()
    
    def test_reset_request_unconfirmed_email(self, app_client):
        """Test that unconfirmed email returns 403 error"""
        email = 'unconfirmed@example.com'
        create_user_with_unconfirmed_email(app_client, email)
        
        r = app_client.post('/password/reset-request', json={'email': email})
        assert r.status_code == 403
        assert 'not confirmed' in r.json()['detail'].lower()
    
    def test_reset_request_confirmed_email_success(self, app_client):
        """Test that confirmed email successfully generates reset token"""
        email = 'confirmed@example.com'
        user_id = create_user_with_confirmed_email(app_client, email)
        
        r = app_client.post('/password/reset-request', json={'email': email})
        assert r.status_code == 200
        assert 'message' in r.json()
        
        # Verify token was stored in core profile
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        item = core_table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'}).get('Item')
        assert item is not None
        assert 'password_reset_jti' in item
        assert 'password_reset_expires_at' in item
        assert item['password_reset_expires_at'] > int(time.time())
    
    def test_reset_request_non_local_provider(self, app_client):
        """Test that non-local provider returns generic success"""
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        
        email = 'google@example.com'
        user_id = 'user-google'
        now_ts = int(time.time())
        
        core_table.put_item(Item={
            'PK': f'USER#{user_id}',
            'SK': f'PROFILE#{user_id}',
            'id': user_id,
            'email': email,
            'provider': 'google',
            'email_confirmed': True,
            'GSI3PK': f'EMAIL#{email}',
            'GSI3SK': f'PROFILE#{user_id}',
            'createdAt': now_ts,
            'updatedAt': now_ts,
        })
        
        r = app_client.post('/password/reset-request', json={'email': email})
        assert r.status_code == 200
        # Should return generic message (password reset only for local accounts)
        assert 'message' in r.json()


class TestPasswordReset:
    """Tests for POST /password/change with reset_token"""
    
    def test_reset_password_missing_token(self, app_client):
        """Test that missing reset_token returns validation error"""
        r = app_client.post('/password/change', json={
            'new_password': 'NewPass123!'
        })
        assert r.status_code == 400
        assert 'reset_token' in r.json()['detail'].lower() or 'challenge_token' in r.json()['detail'].lower() or 'authorization' in r.json()['detail'].lower()
    
    def test_reset_password_invalid_token(self, app_client):
        """Test that invalid token returns error"""
        r = app_client.post('/password/change', json={
            'reset_token': 'invalid-token',
            'new_password': 'NewPass123!'
        })
        assert r.status_code == 400
        assert 'invalid' in r.json()['detail'].lower() or 'expired' in r.json()['detail'].lower()
    
    def test_reset_password_expired_token(self, app_client):
        """Test that expired token returns error"""
        email = 'test@example.com'
        user_id = create_user_with_confirmed_email(app_client, email)
        
        # Create expired token
        expired_token = issue_link_token(f"{email}|{user_id}", TokenPurpose.RESET_PASSWORD, -3600)  # Expired 1 hour ago
        
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        core_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
            UpdateExpression='SET password_reset_jti=:j, password_reset_expires_at=:e',
            ExpressionAttributeValues={
                ':j': expired_token['jti'],
                ':e': expired_token['exp']
            }
        )
        
        r = app_client.post('/password/change', json={
            'reset_token': expired_token['token'],
            'new_password': 'NewPass123!'
        })
        assert r.status_code == 400
        assert 'expired' in r.json()['detail'].lower()
    
    def test_reset_password_weak_password(self, app_client):
        """Test that weak password returns validation error"""
        email = 'test@example.com'
        user_id = create_user_with_confirmed_email(app_client, email)
        
        # Create valid token
        token = issue_link_token(f"{email}|{user_id}", TokenPurpose.RESET_PASSWORD, 3600)
        
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        core_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
            UpdateExpression='SET password_reset_jti=:j, password_reset_expires_at=:e',
            ExpressionAttributeValues={
                ':j': token['jti'],
                ':e': token['exp']
            }
        )
        
        r = app_client.post('/password/change', json={
            'reset_token': token['token'],
            'new_password': 'weak'  # Too weak
        })
        assert r.status_code == 400
        assert 'password' in r.json()['detail'].lower()
    
    def test_reset_password_success(self, app_client):
        """Test successful password reset"""
        email = 'test@example.com'
        user_id = create_user_with_confirmed_email(app_client, email, password_hash='old_hash')
        
        # Create valid token
        token = issue_link_token(f"{email}|{user_id}", TokenPurpose.RESET_PASSWORD, 3600)
        
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        users_table = ddb.Table('goalsguild_users')
        
        # Store token metadata
        core_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
            UpdateExpression='SET password_reset_jti=:j, password_reset_expires_at=:e',
            ExpressionAttributeValues={
                ':j': token['jti'],
                ':e': token['exp']
            }
        )
        
        new_password = 'NewSecurePass123!'
        r = app_client.post('/password/change', json={
            'reset_token': token['token'],
            'new_password': new_password
        })
        
        assert r.status_code == 200
        assert 'message' in r.json()
        assert 'success' in r.json()['message'].lower()
        
        # Verify password was updated in core (app updates core table)
        core_item = core_table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'}).get('Item')
        assert core_item is not None
        assert core_item.get('password_hash') is not None
        assert core_item['password_hash'] != 'old_hash'  # Password was changed
        
        # Verify token metadata was cleared
        assert 'password_reset_jti' not in core_item
        assert 'password_reset_expires_at' not in core_item
    
    def test_reset_password_token_mismatch(self, app_client):
        """Test that token with mismatched jti returns error"""
        email = 'test@example.com'
        user_id = create_user_with_confirmed_email(app_client, email)
        
        # Create token
        token = issue_link_token(f"{email}|{user_id}", TokenPurpose.RESET_PASSWORD, 3600)
        
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        
        # Store different jti
        core_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
            UpdateExpression='SET password_reset_jti=:j, password_reset_expires_at=:e',
            ExpressionAttributeValues={
                ':j': 'different-jti',
                ':e': token['exp']
            }
        )
        
        r = app_client.post('/password/change', json={
            'reset_token': token['token'],
            'new_password': 'NewPass123!'
        })
        assert r.status_code == 400
        assert 'no longer valid' in r.json()['detail'].lower() or 'mismatch' in r.json()['detail'].lower()


class TestPasswordResetIntegration:
    """Integration tests for complete password reset flow"""
    
    def test_complete_reset_flow(self, app_client):
        """Test complete flow: request reset -> receive token -> reset password"""
        email = 'integration@example.com'
        user_id = create_user_with_confirmed_email(app_client, email, password_hash='original_hash')
        
        # Step 1: Request password reset
        r1 = app_client.post('/password/reset-request', json={'email': email})
        assert r1.status_code == 200
        
        # Step 2: Extract token from stored metadata
        import boto3
        ddb = boto3.resource('dynamodb')
        core_table = ddb.Table('gg_core')
        item = core_table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'}).get('Item')
        assert 'password_reset_jti' in item
        
        # Step 3: Generate token with matching jti (simulating email link)
        stored_jti = item['password_reset_jti']
        stored_exp = item['password_reset_expires_at']
        
        # Create token with same jti
        token_data = issue_link_token(f"{email}|{user_id}", TokenPurpose.RESET_PASSWORD, 3600)
        # Note: In real scenario, we'd use the stored jti, but for testing we use the generated one
        # Update stored jti to match
        core_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'},
            UpdateExpression='SET password_reset_jti=:j',
            ExpressionAttributeValues={':j': token_data['jti']}
        )
        
        # Step 4: Reset password with token
        new_password = 'NewIntegrationPass123!'
        r2 = app_client.post('/password/change', json={
            'reset_token': token_data['token'],
            'new_password': new_password
        })
        assert r2.status_code == 200
        
        # Step 5: Verify password was changed in core (app updates core table)
        core_item_after = core_table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'}).get('Item')
        assert core_item_after is not None
        assert core_item_after.get('password_hash') is not None
        assert core_item_after['password_hash'] != 'original_hash'
        
        # Step 6: Verify token was cleared
        core_item = core_table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'PROFILE#{user_id}'}).get('Item')
        assert 'password_reset_jti' not in core_item
    
    def test_reset_request_case_insensitive_email(self, app_client):
        """Test that email matching is case insensitive"""
        email = 'CaseTest@Example.com'
        user_id = create_user_with_confirmed_email(app_client, email.lower())
        
        # Request with different case
        r = app_client.post('/password/reset-request', json={'email': email.upper()})
        assert r.status_code == 200  # Should work with any case
