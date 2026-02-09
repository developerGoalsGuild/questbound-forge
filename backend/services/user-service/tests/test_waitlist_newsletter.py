import os
import json
import pytest
from moto import mock_aws
import boto3
import time


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

        # Avoid sending emails and rate limiting during tests
        import importlib
        main = importlib.import_module('app.main')
        from fastapi.testclient import TestClient
        monkeypatch.setattr(main, 'send_email', lambda *a, **k: None)
        monkeypatch.setattr(main, '_enforce_waitlist_rate_limit', lambda *a, **k: None)
        client = TestClient(main.app)
        yield client


# Waitlist Tests
def test_waitlist_subscribe_success(app_client):
    """Test successful waitlist subscription"""
    response = app_client.post(
        '/waitlist/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['subscribed'] is True
    assert data['email'] == 'test@example.com'
    assert 'message' in data


def test_waitlist_subscribe_duplicate(app_client):
    """Test duplicate waitlist subscription"""
    # First subscription
    app_client.post(
        '/waitlist/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    # Second subscription (duplicate)
    response = app_client.post(
        '/waitlist/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['subscribed'] is True
    assert 'already subscribed' in data['message'].lower()


def test_waitlist_subscribe_missing_api_key(app_client):
    """Test waitlist subscription without API key"""
    response = app_client.post(
        '/waitlist/subscribe',
        json={'email': 'test@example.com'}
    )
    
    assert response.status_code == 403
    assert 'API key' in response.json()['detail']


def test_waitlist_subscribe_invalid_email(app_client):
    """Test waitlist subscription with invalid email"""
    response = app_client.post(
        '/waitlist/subscribe',
        json={'email': 'invalid-email'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code in (400, 422)  # Validation error (API may return 400 or 422)


def test_waitlist_subscribe_cors_preflight(app_client):
    """Test CORS preflight request for waitlist"""
    response = app_client.options(
        '/waitlist/subscribe',
        headers={'Origin': 'https://example.com'}
    )
    
    assert response.status_code == 200
    assert 'Access-Control-Allow-Origin' in response.headers
    assert 'Access-Control-Allow-Methods' in response.headers


# Newsletter Tests
def test_newsletter_subscribe_success(app_client):
    """Test successful newsletter subscription"""
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': 'test@example.com', 'source': 'footer'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['subscribed'] is True
    assert data['email'] == 'test@example.com'
    assert 'message' in data


def test_newsletter_subscribe_default_source(app_client):
    """Test newsletter subscription with default source"""
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['subscribed'] is True


def test_newsletter_subscribe_duplicate(app_client):
    """Test duplicate newsletter subscription"""
    # First subscription
    app_client.post(
        '/newsletter/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    # Second subscription (duplicate)
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': 'test@example.com'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['subscribed'] is True
    assert 'already subscribed' in data['message'].lower()


def test_newsletter_subscribe_missing_api_key(app_client):
    """Test newsletter subscription without API key"""
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': 'test@example.com'}
    )
    
    assert response.status_code == 403
    assert 'API key' in response.json()['detail']


def test_newsletter_subscribe_invalid_email(app_client):
    """Test newsletter subscription with invalid email"""
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': 'invalid-email'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code in (400, 422)  # Validation error (API may return 400 or 422)


def test_newsletter_subscribe_cors_preflight(app_client):
    """Test CORS preflight request for newsletter"""
    response = app_client.options(
        '/newsletter/subscribe',
        headers={'Origin': 'https://example.com'}
    )
    
    assert response.status_code == 200
    assert 'Access-Control-Allow-Origin' in response.headers
    assert 'Access-Control-Allow-Methods' in response.headers


def test_newsletter_stored_in_dynamodb(app_client):
    """Test that newsletter subscription is stored in DynamoDB"""
    email = 'test@example.com'
    
    response = app_client.post(
        '/newsletter/subscribe',
        json={'email': email, 'source': 'footer'},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    
    # Verify data in DynamoDB
    ddb = boto3.resource('dynamodb', region_name='us-east-2')
    table = ddb.Table('gg_core')
    
    item = table.get_item(
        Key={
            'PK': f'NEWSLETTER#{email}',
            'SK': 'SUBSCRIPTION#NEWSLETTER'
        }
    )
    
    assert 'Item' in item
    assert item['Item']['email'] == email
    assert item['Item']['type'] == 'Newsletter'
    assert item['Item']['status'] == 'subscribed'
    assert item['Item']['source'] == 'footer'
    assert 'GSI1PK' in item['Item']
    assert item['Item']['GSI1PK'] == 'NEWSLETTER#ALL'


def test_waitlist_stored_in_dynamodb(app_client):
    """Test that waitlist subscription is stored in DynamoDB"""
    email = 'test@example.com'
    
    response = app_client.post(
        '/waitlist/subscribe',
        json={'email': email},
        headers={'x-api-key': 'test-api-key'}
    )
    
    assert response.status_code == 200
    
    # Verify data in DynamoDB
    ddb = boto3.resource('dynamodb', region_name='us-east-2')
    table = ddb.Table('gg_core')
    
    item = table.get_item(
        Key={
            'PK': f'WAITLIST#{email}',
            'SK': 'SUBSCRIPTION#WAITLIST'
        }
    )
    
    assert 'Item' in item
    assert item['Item']['email'] == email
    assert item['Item']['type'] == 'Waitlist'
    assert item['Item']['status'] == 'subscribed'
    assert item['Item']['source'] == 'landing_page'
    assert 'GSI1PK' in item['Item']
    assert item['Item']['GSI1PK'] == 'WAITLIST#ALL'
