# CloudFront Free Tier Configuration Fix

## Problem
CloudFront distribution cannot use free tier because it uses:
- ❌ Legacy `forwarded_values` (not available in free tier)
- ❌ Legacy `min_ttl`, `default_ttl`, `max_ttl` (not available in free tier)
- ❌ 6 cache behaviors (free tier limit is 5)

## Solution Applied

### 1. Replaced Legacy Forwarded Values with Modern Cache Policies
- **Before**: Using `forwarded_values` block
- **After**: Using AWS managed cache policies (`cache_policy_id`)
- **Policy Used**: `Managed-CachingOptimized` (ID: `658327ea-f89d-4fab-a63d-7e88639e58f6`)
  - Caches everything
  - Respects origin cache headers
  - No query strings or cookies forwarded
  - Long TTL for static assets

### 2. Removed Legacy TTL Settings
- **Removed**: `min_ttl`, `default_ttl`, `max_ttl` (now handled by cache policy)
- **Result**: Free tier compatible

### 3. Reduced Cache Behaviors from 6 to 5
- **Before**: 1 default + 5 ordered behaviors (6 total)
  - Default
  - *.css
  - *.js
  - *.png
  - *.jpg
  - *.svg
- **After**: 1 default + 4 ordered behaviors (5 total)
  - Default
  - *.css
  - *.js
  - *.{png,jpg,jpeg,svg,webp,gif} (combined images)

## AWS Managed Cache Policies Used

### CachingOptimized Policy
- **ID**: `658327ea-f89d-4fab-a63d-7e88639e58f6`
- **Description**: Optimized for caching static content
- **Query Strings**: None forwarded
- **Cookies**: None forwarded
- **Headers**: Only Accept, Accept-Language, Origin
- **TTL**: Respects origin cache headers, defaults to 86400 seconds (1 day)

## Deployment

After applying this change:

```powershell
cd LandingPage\terraform
terraform plan -var-file=environments\dev.tfvars
terraform apply -var-file=environments\dev.tfvars
```

## Verification

After deployment, check CloudFront console:
1. Go to your distribution
2. Check "Billing" section
3. Should show "Free tier" instead of "Pay as you go"

## Benefits

✅ **Free Tier Compatible**: No pay-as-you-go charges
✅ **Modern Configuration**: Uses latest CloudFront features
✅ **Better Performance**: Managed policies are optimized
✅ **Simpler Maintenance**: Less configuration to manage

## Cache Behavior Summary

| Behavior | Path Pattern | Cache Policy | Purpose |
|----------|-------------|--------------|---------|
| Default | * (all other) | CachingOptimized | HTML, other files |
| CSS | *.css | CachingOptimized | Stylesheets |
| JS | *.js | CachingOptimized | JavaScript |
| Images | *.{png,jpg,svg,webp,gif} | CachingOptimized | All images |

**Total: 4 ordered + 1 default = 5 behaviors** ✅

## Notes

- Image cache behaviors were combined using pattern matching: `*.{png,jpg,jpeg,svg,webp,gif}`
- All behaviors use the same cache policy for simplicity
- Cache policy respects origin cache headers, so S3 metadata still controls caching
- Free tier includes 1TB data transfer and 10,000,000 HTTP/HTTPS requests per month














