# Waitlist Form Debugging Guide

## Issue: Form Not Calling Endpoint

If the waitlist form is not calling the API endpoint, follow these debugging steps:

## Quick Checks

### 1. Verify JavaScript is Loaded

Open browser console (F12) and check:
- No JavaScript errors
- Look for: `"Waitlist form initialized"` message
- Check if `window.GOALSGUILD_CONFIG` exists:
  ```javascript
  console.log(window.GOALSGUILD_CONFIG);
  ```

### 2. Verify Form Exists

In browser console:
```javascript
document.getElementById('waitlistForm');
```
Should return the form element, not `null`.

### 3. Verify Configuration

Check that the config is set correctly:
```javascript
console.log(window.GOALSGUILD_CONFIG);
// Should show:
// {
//   apiBaseUrl: 'https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1',
//   apiKey: 'f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i'
// }
```

### 4. Test Form Submission

In browser console, manually trigger form submission:
```javascript
const form = document.getElementById('waitlistForm');
const event = new Event('submit', { bubbles: true, cancelable: true });
form.dispatchEvent(event);
```

Watch console for:
- `"Form submitted"`
- `"Email submitted: ..."`
- `"API Configuration: ..."`
- `"Making request to: ..."`
- `"Response received: ..."`

## Common Issues

### Issue 1: JavaScript Not Loading

**Symptoms:**
- No console logs appear
- Form submits but nothing happens

**Solution:**
- Check browser console for script loading errors
- Verify `js/main.js` file exists and is accessible
- Check file path is correct: `<script src="js/main.js"></script>`

### Issue 2: Config Not Set

**Symptoms:**
- Console shows: `"API Base URL not configured!"` or `"API Gateway key not configured!"`

**Solution:**
- Verify the config script is in `index.html` before the closing `</head>` tag
- Check that `window.GOALSGUILD_CONFIG` is defined:
  ```html
  <script>
      window.GOALSGUILD_CONFIG = {
          apiBaseUrl: 'https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1',
          apiKey: 'f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i'
      };
  </script>
  ```

### Issue 3: CORS Error

**Symptoms:**
- Console shows: `"Access to fetch at ... has been blocked by CORS policy"`

**Solution:**
- Check API Gateway CORS configuration
- Verify the landing page domain is in allowed origins
- Check browser network tab for CORS preflight (OPTIONS) request

### Issue 4: Network Error

**Symptoms:**
- Console shows: `"Network error. Please check your connection and try again."`
- Network tab shows failed request

**Solution:**
- Check API Gateway endpoint is accessible
- Verify API Gateway is deployed and active
- Test endpoint directly with curl or Postman

### Issue 5: Form Not Found

**Symptoms:**
- Console shows: `"Waitlist form not found! Looking for element with id='waitlistForm'"`

**Solution:**
- Verify form has `id="waitlistForm"`:
  ```html
  <form class="waitlist-form" id="waitlistForm">
  ```
- Check form exists in DOM before script runs
- Verify script is loaded after DOM is ready

## Testing the Endpoint Directly

### Using PowerShell

```powershell
cd LandingPage\scripts
.\test-waitlist-endpoint.ps1
```

### Using curl

```bash
curl -X POST https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/waitlist/subscribe \
  -H "Content-Type: application/json" \
  -H "x-api-key: f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i" \
  -d '{"email":"test@example.com"}'
```

### Using Browser Console

```javascript
fetch('https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/waitlist/subscribe', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i'
    },
    body: JSON.stringify({ email: 'test@example.com' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit the form
4. Look for request to `/waitlist/subscribe`
5. Check:
   - Request URL is correct
   - Request method is POST
   - Headers include `x-api-key`
   - Request payload has email
   - Response status code
   - Response body

## Step-by-Step Debugging

1. **Open browser console** (F12 → Console tab)
2. **Reload page** and check for errors
3. **Check config exists:**
   ```javascript
   console.log(window.GOALSGUILD_CONFIG);
   ```
4. **Check form exists:**
   ```javascript
   console.log(document.getElementById('waitlistForm'));
   ```
5. **Submit form** and watch console logs
6. **Check Network tab** for the API request
7. **Review response** in Network tab

## Expected Console Output

When form is submitted successfully, you should see:

```
Waitlist form initialized
Form submitted
Email submitted: user@example.com
API Configuration: { apiBaseUrl: '...', hasApiKey: true, ... }
Making request to: https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1/waitlist/subscribe
Response received: { status: 200, statusText: 'OK' }
```

## Fixes Applied

1. ✅ Removed Vite-specific code (`import.meta.env`)
2. ✅ Added comprehensive console logging
3. ✅ Added better error messages
4. ✅ Added validation for API config
5. ✅ Added network error handling

## Next Steps

If the form still doesn't work after checking all above:

1. **Check API Gateway logs** in CloudWatch
2. **Verify Lambda function** is receiving requests
3. **Check API Gateway CORS** configuration
4. **Verify API key** is valid and active
5. **Check DynamoDB permissions** for Lambda function














