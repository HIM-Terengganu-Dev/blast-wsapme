# MessageInfo Endpoint Findings

## Test Results with `/v1/messageInfo`

**Endpoint:** `https://api.wsapme.com/v1/messageInfo`

**Test Results:** ✅ Endpoint responds (HTTP 200), but returns **USER DATA**, not message status

### Response from `/v1/messageInfo`

```json
{
  "success": true,
  "message": "User data retrieved",
  "data": {
    "id": "6169",
    "username": "HIMWELLNESS SDN BHD",
    "email": "himwellness@wsapme.com",
    "phone": "601158587480",
    // ... user account information
  },
  "status": true
}
```

**Problem:** This endpoint returns **user/account data**, not **message status data**.

## Conclusion

`/v1/messageInfo` appears to be for **user information**, not message status checking.

We need to find the correct endpoint for message status, or the request format might be different.

## Possible Solutions

1. **Different Endpoint Path**
   - Maybe `/api/messageInfo` (without v1)?
   - Maybe `/v1/message/status` or similar?
   - Maybe `/v1/messages/{messageId}` or similar?

2. **Different Request Format**
   - Maybe the request payload structure is different?
   - Maybe it needs different parameters?

3. **Webhooks Only**
   - Status might only be available via webhooks
   - No query endpoint exists for status

4. **Check Documentation**
   - Verify correct endpoint for message status
   - Check if there's a status endpoint we haven't tried

## Next Steps

1. Check WSAPME documentation for correct status endpoint
2. Try other endpoint variations
3. Test webhooks with `redirect_url` in v1 sendMessage
4. Contact WSAPME support about status endpoint

