# DynamoDB Module

This module provisions a DynamoDB table with PAY_PER_REQUEST billing mode.

## Usage

```hcl
module "dynamodb_users" {
  source         = "./modules/dynamodb"
  table_name     = "goalsguild_users"
  hash_key       = "user_id"
  attribute_name = "user_id"
  attribute_type = "S"
  environment    = var.environment
  tags           = {
    Environment = var.environment
    Project     = "goalsguild"
  }
}
```

## Inputs

| Name           | Type        | Description                          |
|----------------|-------------|------------------------------------|
| table_name     | string      | Name of the DynamoDB table          |
| hash_key       | string      | Hash key attribute name             |
| attribute_name | string      | Name of the attribute for the hash key |
| attribute_type | string      | Type of the attribute (S, N, B)     |
| environment    | string      | Deployment environment (dev/prod)   |
| tags           | map(string) | Tags to apply to the DynamoDB table |

## Outputs

| Name       | Description               |
|------------|---------------------------|
| table_name | Name of the DynamoDB table |
