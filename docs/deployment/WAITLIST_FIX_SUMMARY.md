# Waitlist 500 Error - Fixed

## Problem
```
TypeError: log_event() missing 1 required positional argument: 'event'
```

## Root Cause
The `log_event()` function requires `logger` as the first argument, but the waitlist code was calling it incorrectly:

**Wrong:**
```python
log_event("waitlist.subscribe.duplicate", cid=cid, email=email, ip=client_ip)
log_event("waitlist.subscribe.success", cid=cid, email=email, ip=client_ip)
```

**Correct:**
```python
log_event(logger, "waitlist.subscribe.duplicate", cid=cid, email=email, ip=client_ip)
log_event(logger, "waitlist.subscribe.success", cid=cid, email=email, ip=client_ip)
```

## Fix Applied
✅ Updated both `log_event()` calls in `/waitlist/subscribe` endpoint to include `logger` as first argument
✅ Added better error logging for debugging

## Deployment
The fix is being deployed. After deployment completes (5-10 minutes), the waitlist form should work correctly.

## Testing
After deployment:
1. Go to `https://www.goalsguild.com`
2. Submit waitlist form
3. Should see success message (no 500 error)

## Files Changed
- `backend/services/user-service/app/main.py`
  - Line 494: Fixed `log_event()` call for duplicate email
  - Line 528: Fixed `log_event()` call for success















