# Performance Configuration Guide

This document describes the performance optimization features available in the GoalsGuild infrastructure and how to configure them through Terraform variables.

## Available Performance Features

### 1. API Gateway Caching
- **Feature**: Caches API responses at the API Gateway level
- **Benefits**: Reduces Lambda invocations and improves response times
- **Configuration**: Enabled by default in staging and production

### 2. AppSync Resolver Caching
- **Feature**: Caches GraphQL resolver responses
- **Benefits**: Reduces DynamoDB queries and improves GraphQL performance
- **Configuration**: Configurable TTL per environment

### 3. WAF (Web Application Firewall)
- **Feature**: Protects API Gateway from common attacks
- **Benefits**: Security and DDoS protection
- **Configuration**: Optional, can be enabled per environment

### 4. HTTP Keep-Alive
- **Feature**: Maintains persistent connections to AWS services
- **Benefits**: Reduces connection overhead in Lambda functions
- **Configuration**: Enabled by default in all Lambda functions

## Environment Configurations

### Development (`dev.tfvars`)
```hcl
# Performance optimization controls
enable_api_gateway_waf = false
enable_appsync_caching = false
appsync_cache_ttl_seconds = 300
```
- **WAF**: Disabled for faster development
- **AppSync Caching**: Disabled for real-time testing
- **API Gateway Caching**: Enabled (5 minutes)

### Staging (`staging.tfvars`)
```hcl
# Performance optimization controls - ENABLED for staging
enable_api_gateway_waf = true
enable_appsync_caching = true
appsync_cache_ttl_seconds = 300  # 5 minutes cache
```
- **WAF**: Enabled for security testing
- **AppSync Caching**: Enabled (5 minutes)
- **API Gateway Caching**: Enabled (5 minutes)

### Production (`prod.tfvars`)
```hcl
# Performance optimization controls - ENABLED for production
enable_api_gateway_waf = true
enable_appsync_caching = true
appsync_cache_ttl_seconds = 600  # 10 minutes cache for production
```
- **WAF**: Enabled for security
- **AppSync Caching**: Enabled (10 minutes)
- **API Gateway Caching**: Enabled (5 minutes)

## Cache TTL Recommendations

### AppSync Cache TTL
- **Development**: 0-300 seconds (disabled or short for testing)
- **Staging**: 300 seconds (5 minutes for testing)
- **Production**: 600-1800 seconds (10-30 minutes for performance)

### API Gateway Cache TTL
- **Quest List**: 300 seconds (5 minutes)
- **Quest Analytics**: 600 seconds (10 minutes)
- **Quest Templates**: 900 seconds (15 minutes)
- **User Profile**: 300 seconds (5 minutes)

## Performance Impact

### Expected Improvements
- **API Response Time**: 20-50% reduction
- **Lambda Invocations**: 30-70% reduction
- **DynamoDB Read Units**: 40-80% reduction
- **Cost Reduction**: 20-40% for high-traffic scenarios

### Monitoring
- CloudWatch metrics for cache hit rates
- Lambda invocation counts
- DynamoDB read capacity utilization
- API Gateway response times

## Configuration Variables

### API Gateway Module Variables
```hcl
variable "enable_api_gateway_waf" {
  type        = bool
  default     = false
  description = "Enable WAF for API Gateway"
}

variable "enable_appsync_caching" {
  type        = bool
  default     = false
  description = "Enable AppSync resolver caching"
}

variable "appsync_cache_ttl_seconds" {
  type        = number
  default     = 300
  description = "AppSync cache TTL in seconds"
}
```

### AppSync Stack Variables
```hcl
variable "enable_appsync_caching" {
  type        = bool
  default     = false
  description = "Enable AppSync resolver caching"
}

variable "appsync_cache_ttl_seconds" {
  type        = number
  default     = 300
  description = "AppSync cache TTL in seconds"
}
```

## Deployment

### Deploy with Performance Features
```bash
# Deploy staging with all features enabled
terraform plan -var-file="environments/staging.tfvars"
terraform apply -var-file="environments/staging.tfvars"

# Deploy production with all features enabled
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

### Deploy Development (Features Disabled)
```bash
# Deploy development with features disabled
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"
```

## Troubleshooting

### Cache Not Working
1. Check if caching is enabled in the environment tfvars
2. Verify the cache TTL is set correctly
3. Check CloudWatch logs for cache-related errors

### WAF Blocking Requests
1. Check WAF logs in CloudWatch
2. Review WAF rules and adjust if needed
3. Temporarily disable WAF for testing

### Performance Issues
1. Monitor cache hit rates in CloudWatch
2. Adjust cache TTL based on data freshness requirements
3. Check Lambda cold start metrics

## Best Practices

1. **Start Conservative**: Begin with shorter cache TTLs and increase based on monitoring
2. **Monitor Closely**: Watch cache hit rates and data freshness
3. **Test Thoroughly**: Verify caching behavior in staging before production
4. **Document Changes**: Keep track of cache TTL changes and their impact
5. **Regular Review**: Periodically review and optimize cache settings

## Security Considerations

1. **WAF Rules**: Regularly update WAF rules for new threats
2. **Cache Security**: Ensure sensitive data is not cached inappropriately
3. **Access Control**: Verify that cached data respects user permissions
4. **Audit Logging**: Monitor cache access patterns for anomalies
