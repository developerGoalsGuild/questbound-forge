# Dev environment tfvars
environment                 = "dev"
enable_appsync_api_key      = true

# WAF disabled in dev
enable_appsync_waf          = false
waf_enforce                 = false
enable_appsync_waf_logging  = false
enable_waf_logging_stream   = false
log_level                   =  "DEBUG"
auth_log_enabled            = true
