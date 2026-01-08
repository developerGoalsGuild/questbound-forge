#!/usr/bin/env python3
"""
Quick fix for guild rankings DynamoDB reserved keyword issue.
This script updates the Lambda function code directly.
"""

import boto3
import json
import zipfile
import io
import os

def create_zip_with_fix():
    """Create a zip file with the fixed guild_db.py"""
    
    # Read the fixed guild_db.py file
    with open('backend/services/guild-service/app/db/guild_db.py', 'r') as f:
        guild_db_content = f.read()
    
    # Create a zip file in memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add the fixed guild_db.py
        zip_file.writestr('app/db/guild_db.py', guild_db_content)
        
        # Add other necessary files (minimal set)
        zip_file.writestr('app/__init__.py', '')
        zip_file.writestr('app/db/__init__.py', '')
        
        # Add a simple main.py that just imports the fixed module
        main_content = '''
from app.db.guild_db import get_guild_rankings
print("Fixed guild_db module loaded successfully")
'''
        zip_file.writestr('app/main.py', main_content)
    
    zip_buffer.seek(0)
    return zip_buffer.getvalue()

def update_lambda_function():
    """Update the Lambda function with the fixed code"""
    
    # Initialize AWS clients
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    # Create the zip file with the fix
    zip_content = create_zip_with_fix()
    
    try:
        # Update the function code
        response = lambda_client.update_function_code(
            FunctionName='goalsguild_guild_service_dev',
            ZipFile=zip_content
        )
        
        print(f"✅ Lambda function updated successfully!")
        print(f"Function ARN: {response['FunctionArn']}")
        print(f"Last Modified: {response['LastModified']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating Lambda function: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing guild rankings DynamoDB reserved keyword issue...")
    
    # Change to the project root directory
    os.chdir('C:\\Projetos\\GoalsGuild\\questbound-forge')
    
    success = update_lambda_function()
    
    if success:
        print("🎉 Fix applied successfully! The guild rankings endpoint should now work.")
    else:
        print("💥 Fix failed. Please check the error messages above.")
