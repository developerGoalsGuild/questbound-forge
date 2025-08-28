# Lambda Module

This module provisions an AWS Lambda function using a container image.

## Usage

```hcl
module "lambda_function" {
  source        = "./modules/lambda"
  function_name = "goalsguild_user_service"
  image_uri     = var.user_service_image_uri
  role_arn      = module.network.lambda_exec_role_arn
  timeout       = 10
  memory_size   = 512
  environment   = var.environment
  tags          = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}
```

## Inputs

| Name          | Type          | Description                          |
|---------------|---------------|------------------------------------|
| function_name | string        | Name of the Lambda function         |
| image_uri     | string        | ECR image URI for the Lambda container |
| role_arn      | string        | ARN of the IAM role for Lambda execution |
| timeout       | number        | Timeout in seconds (default 10)     |
| memory_size   | number        | Memory size in MB (default 512)     |
| environment   | string        | Deployment environment (dev/prod)   |
| tags          | map(string)   | Tags to apply to the Lambda function |

## Outputs

| Name          | Description                |
|---------------|----------------------------|
| function_name | Name of the Lambda function |
