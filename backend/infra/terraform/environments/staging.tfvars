# Staging environment tfvars
environment                 = "staging"
enable_appsync_api_key      = true

# WAF enabled in monitor mode with logging
enable_appsync_waf          = true
waf_enforce                 = false
enable_appsync_waf_logging  = true
enable_waf_logging_stream   = true