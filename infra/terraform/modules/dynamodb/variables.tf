variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "hash_key" {
  description = "Hash key attribute name for the DynamoDB table"
  type        = string
}

variable "attribute_name" {
  description = "Name of the attribute for the hash key"
  type        = string
}

variable "attribute_type" {
  description = "Type of the attribute for the hash key (S, N, B)"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the DynamoDB table"
  type        = map(string)
  default     = {}
}
