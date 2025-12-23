# Checking Waitlist 500 Error

## Quick Check Commands

### 1. Check Lambda Function Name
```powershell
aws lambda list-functions --query "Functions[?contains(FunctionName, 'user')].FunctionName" --output table
```

### 2. Get Recent Logs (Replace FUNCTION_NAME)
```powershell
aws logs tail /aws/lambda/FUNCTION_NAME --since 10m --format short
```

### 3. Filter for Waitlist Errors
```powershell
aws logs filter-log-events `
  --log-group-name "/aws/lambda/FUNCTION_NAME" `
  --start-time $([int64]((Get-Date).AddMinutes(-10).ToUniversalTime() - (Get-Date "1970-01-01")).TotalSeconds)000 `
  --filter-pattern "waitlist" `
  --query "events[*].message" `
  --output text
```

## Common Causes of 500 Error

1. **DynamoDB Table Not Found**
   - Check if `gg_core` table exists
   - Verify table name in SSM: `/goalsguild/user-service/env_vars`

2. **DynamoDB Permissions**
   - Lambda execution role needs `dynamodb:PutItem` on `gg_core` table
   - Check IAM role permissions

3. **Table Name Configuration**
   - SSM parameter should have `CORE_TABLE = "gg_core"`
   - Code looks for `CORE_TABLE` first, then `GG_CORE_TABLE`

4. **Code Not Deployed**
   - Verify Lambda function has latest code
   - Check deployment timestamp

## Manual CloudWatch Check

1. Go to AWS Console → CloudWatch → Log Groups
2. Find `/aws/lambda/goalsguild_user_service_dev` (or similar)
3. Click on latest log stream
4. Look for errors containing "waitlist" or "ERROR"

## Code Changes Made

Added better error logging to identify the exact issue:
- Logs table name being used
- Logs DynamoDB error codes
- Logs exception types

## Next Steps

1. Deploy updated code with better logging
2. Check CloudWatch logs after deployment
3. Verify DynamoDB table exists and Lambda has permissions














