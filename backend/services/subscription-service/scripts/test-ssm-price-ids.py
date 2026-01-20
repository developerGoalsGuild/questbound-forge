#!/usr/bin/env python3
"""
Test script to verify subscription service reads Price IDs from SSM Parameter Store.

Usage:
    python scripts/test-ssm-price-ids.py
    python scripts/test-ssm-price-ids.py --region us-east-2
"""

import sys
import os
import argparse

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.settings import Settings
from app.stripe_client import StripeClient

def test_ssm_price_ids(region: str = None):
    """Test if Settings reads Price IDs from SSM."""
    
    print("🔍 Testing SSM Price ID Configuration")
    print("=" * 50)
    print()
    
    # Set region if provided
    if region:
        os.environ['AWS_DEFAULT_REGION'] = region
        print(f"📍 Using AWS region: {region}")
    else:
        print(f"📍 Using default AWS region (from AWS config)")
    print()
    
    # Check AWS credentials
    try:
        import boto3
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS credentials configured")
        print(f"   Account: {identity.get('Account')}")
        print(f"   User/Role: {identity.get('Arn', '').split('/')[-1]}")
        print()
    except Exception as e:
        print(f"❌ AWS credentials not configured: {e}")
        print("   Please run: aws configure")
        return False
    
    # Initialize Settings
    print("📝 Initializing Settings...")
    try:
        settings = Settings()
        print("✅ Settings initialized")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize Settings: {e}")
        return False
    
    # Check Price IDs
    print("🔍 Checking Price IDs from SSM...")
    print()
    
    price_ids = {
        'INITIATE': settings.stripe_price_id_initiate,
        'JOURNEYMAN': settings.stripe_price_id_journeyman,
        'SAGE': settings.stripe_price_id_sage,
        'GUILDMASTER': settings.stripe_price_id_guildmaster,
    }
    
    all_found = True
    for tier, price_id in price_ids.items():
        if price_id:
            print(f"  ✅ {tier:12} = {price_id}")
        else:
            print(f"  ⚠️  {tier:12} = (not set)")
            all_found = False
    
    print()
    
    # Verify SSM directly
    print("🔍 Verifying SSM Parameters directly...")
    print()
    
    try:
        import boto3
        ssm = boto3.client('ssm')
        ssm_params = {
            'INITIATE': '/goalsguild/subscription-service/STRIPE_PRICE_ID_INITIATE',
            'JOURNEYMAN': '/goalsguild/subscription-service/STRIPE_PRICE_ID_JOURNEYMAN',
            'SAGE': '/goalsguild/subscription-service/STRIPE_PRICE_ID_SAGE',
            'GUILDMASTER': '/goalsguild/subscription-service/STRIPE_PRICE_ID_GUILDMASTER',
        }
        
        for tier, param_path in ssm_params.items():
            try:
                response = ssm.get_parameter(Name=param_path)
                ssm_value = response['Parameter']['Value']
                settings_value = price_ids[tier]
                
                if ssm_value == settings_value:
                    print(f"  ✅ {tier:12} - SSM matches Settings: {ssm_value}")
                else:
                    print(f"  ⚠️  {tier:12} - SSM: {ssm_value}, Settings: {settings_value}")
            except ssm.exceptions.ParameterNotFound:
                print(f"  ❌ {tier:12} - Parameter not found in SSM")
            except Exception as e:
                print(f"  ❌ {tier:12} - Error: {e}")
    except Exception as e:
        print(f"  ❌ Error accessing SSM: {e}")
    
    print()
    
    # Test StripeClient initialization
    print("🔍 Testing StripeClient initialization...")
    print()
    
    try:
        # Check if we have Stripe secret key (needed for real Stripe, not mock)
        if settings.stripe_secret_key:
            print(f"  ✅ Stripe Secret Key: {'*' * 20}...{settings.stripe_secret_key[-4:]}")
            print(f"  ℹ️  Will use real Stripe API (not mock)")
        else:
            print(f"  ⚠️  Stripe Secret Key: Not set")
            print(f"  ℹ️  Will use mock Stripe (dev mode)")
        
        print()
        
        # Initialize StripeClient
        stripe_client = StripeClient(settings)
        print(f"  ✅ StripeClient initialized")
        print(f"  ℹ️  Mock mode: {stripe_client.is_mock}")
        print()
        
        # Check price_ids dictionary
        print("  📋 Price IDs in StripeClient:")
        for tier, price_id in stripe_client.price_ids.items():
            if price_id:
                print(f"     ✅ {tier:12} = {price_id}")
            else:
                print(f"     ⚠️  {tier:12} = (not set)")
        
        print()
        
        # Verify SAGE price ID specifically
        if stripe_client.price_ids.get('SAGE'):
            print(f"  ✅ SAGE Price ID is available: {stripe_client.price_ids['SAGE']}")
            print(f"  ✅ Ready to create checkout sessions for SAGE tier")
        else:
            print(f"  ⚠️  SAGE Price ID is not set")
            print(f"  ⚠️  Cannot create checkout sessions for SAGE tier")
        
    except Exception as e:
        print(f"  ❌ Failed to initialize StripeClient: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    print("=" * 50)
    
    # Summary
    if stripe_client.price_ids.get('SAGE'):
        print("✅ SUCCESS: Subscription service is reading Price IDs from SSM!")
        print()
        print("📋 Summary:")
        print(f"   - SAGE Price ID: {stripe_client.price_ids['SAGE']}")
        print(f"   - Source: SSM Parameter Store")
        print(f"   - Ready to use in checkout sessions")
        return True
    else:
        print("⚠️  WARNING: SAGE Price ID not found")
        print()
        print("📋 Troubleshooting:")
        print("   1. Verify SSM parameter exists:")
        print("      aws ssm get-parameter --name \"/goalsguild/subscription-service/STRIPE_PRICE_ID_SAGE\" --region us-east-2")
        print("   2. Check AWS credentials are configured")
        print("   3. Verify the service has permission to read SSM parameters")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Test if subscription service reads Price IDs from SSM'
    )
    parser.add_argument(
        '--region',
        type=str,
        default=None,
        help='AWS region (default: from AWS config)'
    )
    
    args = parser.parse_args()
    
    success = test_ssm_price_ids(region=args.region)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
