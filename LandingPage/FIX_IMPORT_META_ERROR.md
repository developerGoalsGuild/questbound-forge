# Fix: import.meta Error

## Problem
The error `Uncaught SyntaxError: Cannot use 'import.meta' outside a module` occurs because the browser is loading a cached version of `main.js` that still contains `import.meta` references.

## Solution Applied
✅ **Fixed**: Removed all `import.meta` references from `LandingPage/src/js/main.js`
✅ **Fixed**: Code now only uses `window.GOALSGUILD_CONFIG` (no Vite-specific code)

## Current Code Status
The file `LandingPage/src/js/main.js` is now fixed and contains NO `import.meta` references.

## Deployment Required

The fix is in the source files but needs to be deployed to S3. You have two options:

### Option 1: Quick Deploy (Recommended)
```powershell
cd LandingPage\scripts
.\deploy-fix.ps1
```

This will:
- Upload the fixed `main.js` to S3
- Upload `index.html` to S3
- Invalidate CloudFront cache for these files

### Option 2: Full Deploy
```powershell
cd LandingPage\scripts
.\deploy-landing-page.ps1 -Env dev -SkipInit
```

### Option 3: Manual Deploy
```powershell
# Get bucket name
cd LandingPage\terraform
$bucket = terraform output -raw s3_bucket_name
$cfId = terraform output -raw cloudfront_distribution_id

# Upload files
aws s3 cp ..\src\js\main.js s3://$bucket/js/main.js --cache-control "no-cache"
aws s3 cp ..\src\index.html s3://$bucket/index.html --cache-control "no-cache"

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id $cfId --paths "/js/main.js" "/index.html"
```

## After Deployment

1. **Clear browser cache**:
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) for hard refresh
   - Or clear browser cache manually

2. **Wait 1-2 minutes** for CloudFront cache to clear

3. **Test the form**:
   - Open browser console (F12)
   - Submit the waitlist form
   - Check for console logs (should see "Waitlist form initialized", "Form submitted", etc.)
   - No more `import.meta` errors!

## Verification

After deployment, check the browser console. You should see:
- ✅ `"Waitlist form initialized"` (no errors)
- ✅ `"Form submitted"` when you submit
- ✅ `"API Configuration: ..."` showing the config
- ✅ `"Making request to: ..."` showing the endpoint

## If Error Persists

1. **Check you're viewing the deployed version** (not local file://)
2. **Hard refresh**: `Ctrl+Shift+R` or `Ctrl+F5`
3. **Check browser console** for the actual error line number
4. **Verify the deployed file**: Check S3 to ensure `main.js` was uploaded
5. **Check CloudFront invalidation status** in AWS Console

## Code Changes Made

**Before (causing error):**
```javascript
const apiBaseUrl = window.GOALSGUILD_CONFIG?.apiBaseUrl || 
                  import.meta?.env?.VITE_API_BASE_URL ||  // ❌ This causes error
                  'https://api.goalsguild.com';
```

**After (fixed):**
```javascript
const apiBaseUrl = window.GOALSGUILD_CONFIG?.apiBaseUrl;  // ✅ Only uses window config
const apiKey = window.GOALSGUILD_CONFIG?.apiKey;
```














