variable "table_name" {
    description = "DynamoDB table name"
    type        = string
}

variable "enable_streams" {
    description = "Enable DynamoDB streams"
    type        = bool
    default     = true
}

variable "prevent_destroy" {
    description = "Prevent accidental table destruction"
    type        = bool
    default     = true
}

variable "tags" {
    description = "Resource tags"
    type        = map(string)
    default     = {}
}
