# Prod environment tfvars
environment                 = "prod"
enable_appsync_api_key      = true

# WAF enabled in monitor mode with logging
enable_appsync_waf          = true
waf_enforce                 = false
enable_appsync_waf_logging  = true
# Use auto-provisioned Firehose->S3 for logs
enable_waf_logging_stream   = true
log_level                   =  "ERROR"
user_log_enabled            = false
quest_log_enabled           = false
