# Waitlist Configuration Guide

## Overview
The waitlist form requires API Gateway URL and API Key to be configured to submit emails to the backend.

## Configuration Methods

### Method 1: Script Tag (Recommended for Static Sites)
Add this script tag in the `<head>` section of `index.html`:

```html
<script>
    window.GOALSGUILD_CONFIG = {
        apiBaseUrl: 'https://YOUR_API_GATEWAY_URL.execute-api.us-east-1.amazonaws.com/prod',
        apiKey: 'YOUR_API_GATEWAY_KEY'
    };
</script>
```

### Method 2: Environment Variables (For Build Tools)
If using a build tool that supports environment variables:

```bash
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_URL.execute-api.us-east-1.amazonaws.com/prod
VITE_API_GATEWAY_KEY=YOUR_API_GATEWAY_KEY
```

## Getting API Gateway URL and Key

### From Terraform Outputs
```bash
cd backend/infra/terraform2
terraform output api_gateway_url
terraform output api_key_value
```

### From AWS Console
1. Go to API Gateway → Your API → Stages → prod
2. Copy the Invoke URL
3. Go to API Keys → Select your key → Copy the key value

## Security Notes

- **API Key**: The API key is required but will be visible in the browser. This is acceptable for public endpoints with rate limiting.
- **Rate Limiting**: The waitlist endpoint has strict rate limits:
  - **API Gateway**: 2 requests per second, burst of 5
  - **Application**: 5 requests per minute per IP address
- **CORS**: Ensure your API Gateway allows CORS from your landing page domain.

## Testing

After configuration, test the waitlist form:
1. Open browser console
2. Submit the form
3. Check for any errors
4. Verify the email is stored in DynamoDB (`gg_core` table with `PK: WAITLIST#email`)

## Troubleshooting

### "API key is required" error
- Ensure `window.GOALSGUILD_CONFIG.apiKey` is set
- Check that the API key is valid in API Gateway

### "Too many requests" error
- Wait 60 seconds and try again
- Rate limit: 5 requests per minute per IP

### CORS errors
- Verify API Gateway CORS settings allow your domain
- Check browser console for specific CORS error details

### Network errors
- Verify API Gateway URL is correct
- Check API Gateway stage is deployed
- Ensure Lambda function is deployed and has correct permissions
















