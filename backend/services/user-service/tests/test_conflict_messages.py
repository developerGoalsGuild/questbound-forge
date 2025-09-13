import os
import json
import pytest
from moto import mock_aws
import boto3


@pytest.fixture(scope='function')
def app_client(monkeypatch):
    os.environ['AWS_DEFAULT_REGION'] = os.environ.get('AWS_DEFAULT_REGION', 'us-east-2')
    with mock_aws():
        # SSM env
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

        # DDB tables
        ddb = boto3.client('dynamodb')
        ddb.create_table(
            TableName='goalsguild_users',
            KeySchema=[{'AttributeName':'pk','KeyType':'HASH'}, {'AttributeName':'sk','KeyType':'RANGE'}],
            AttributeDefinitions=[{'AttributeName':'pk','AttributeType':'S'}, {'AttributeName':'sk','AttributeType':'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        ddb.create_table(
            TableName='goalsguild_login_attempts',
            KeySchema=[{'AttributeName':'pk','KeyType':'HASH'}, {'AttributeName':'ts','KeyType':'RANGE'}],
            AttributeDefinitions=[{'AttributeName':'pk','AttributeType':'S'}, {'AttributeName':'ts','AttributeType':'N'}],
            BillingMode='PAY_PER_REQUEST'
        )
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

        # Build app client
        import importlib
        main = importlib.import_module('app.main')
        from fastapi.testclient import TestClient
        monkeypatch.setattr(main, 'send_email', lambda *a, **k: None)
        client = TestClient(main.app)
        yield client


def test_email_conflict_returns_code_and_field(app_client):
    # Seed an email lock
    d = boto3.resource('dynamodb').Table('gg_core')
    d.put_item(Item={'PK': 'EMAIL#taken@example.com', 'SK': 'UNIQUE#USER', 'type': 'EmailUnique'})

    r = app_client.post('/users/signup', json={
        'provider': 'local',
        'email': 'taken@example.com',
        'fullName': 'User',
        'password': 'Aa1!aaaa',
        'country': 'US'
    })
    assert r.status_code == 409
    det = r.json().get('detail')
    assert det.get('code') == 'EMAIL_TAKEN'
    assert det.get('field') == 'email'


def test_nickname_conflict_returns_code_and_field(app_client):
    # Seed a nickname lock
    d = boto3.resource('dynamodb').Table('gg_core')
    d.put_item(Item={'PK': 'NICK#dupe', 'SK': 'UNIQUE#USER', 'type': 'NicknameUnique'})

    r = app_client.post('/users/signup', json={
        'provider': 'local',
        'email': 'unique@example.com',
        'fullName': 'User',
        'password': 'Aa1!aaaa',
        'country': 'US',
        'nickname': 'dupe'
    })
    assert r.status_code == 409
    det = r.json().get('detail')
    assert det.get('code') == 'NICKNAME_TAKEN'
    assert det.get('field') == 'nickname'

