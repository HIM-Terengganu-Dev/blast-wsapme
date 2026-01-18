# Testing Guide

## Pre-Testing Checklist

Before testing the WSAPME API integration, ensure:

- [ ] Development server is running (`npm run dev`)
- [ ] `.env` file contains valid `WSAPME_USER_TOKEN`
- [ ] WSAPME device (ID: 5850) is **online** and connected
- [ ] Device has authorization to send messages
- [ ] Test phone number `+60189026292` is accessible

---

## Testing Without Device (Mock Endpoints)

### Test 1: Mock Blast Data

**Purpose:** Verify funnel chart displays correctly with mock data.

**Steps:**
1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Page should load and show funnel chart with mock data
3. Verify all 5 stages are displayed: Sent, Received, Read, Replied, Closed

**Expected Result:**
- Funnel chart displays correctly
- All stages show counts and percentages
- Drop-off percentages are visible

**Test via API:**
```bash
curl http://localhost:3000/api/test-mock?type=blast
```

---

### Test 2: Mock Send Message

**Purpose:** Test send message flow without device.

**Steps:**
1. Open browser console
2. Run:
   ```javascript
   fetch('/api/test-mock?type=send')
     .then(r => r.json())
     .then(console.log);
   ```

**Expected Result:**
- Returns mock message ID
- Response structure matches expected format

---

### Test 3: Mock Message Status

**Purpose:** Test message status check without device.

**Steps:**
1. Open browser console
2. Run:
   ```javascript
   fetch('/api/test-mock?type=status')
     .then(r => r.json())
     .then(console.log);
   ```

**Expected Result:**
- Returns mock status data
- Includes status code (2) and message details

---

## Testing With Device Online

### 1. Basic Send Message Test

**Objective:** Verify message can be sent successfully.

**Steps:**
1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click the **"Test Send Message"** button
3. Wait for send operation to complete
4. Check the result card:
   - ✓ Green card = Success
   - ✗ Red card = Failure

**Expected Result:**
- Send result shows success
- Message ID is returned
- Message status is automatically checked
- Message appears on WhatsApp for `+60189026292`

**What to Document:**
- Response structure from WSAPME
- Message ID format
- Any errors encountered

---

### 2. Message Status Code Testing

**Objective:** Understand what each status code means.

**Steps:**
1. Send a message (Step 1 above)
2. Note the `messageId` from the response
3. Check the message status card on the page
4. Document the status code and its meaning

**Status Codes to Test:**
- `status: 0` - Unknown (test if appears)
- `status: 1` - Unknown (test if appears)
- `status: 2` - Possible meanings: sent, delivered, read
- `status: 3` - Unknown (test if appears)

**Test Different Scenarios:**
1. **Immediately after send** - Check status right after sending
2. **After delivery** - Wait and check status after message is delivered
3. **After read** - Check status after recipient reads the message
4. **After reply** - Check status if recipient replies

**Expected Results:**
Create a mapping table:

| Status Code | Meaning | When It Occurs | Funnel Stage |
|-------------|---------|----------------|--------------|
| ? | ? | ? | ? |

**Document in:** `docs/STATUS_CODES.md` (create when testing)

---

### 3. Custom Message Testing

**Objective:** Test sending custom messages.

**Steps:**
1. Open browser console
2. Run:
   ```javascript
   fetch('/api/test-send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       message: 'Custom test message' 
     })
   })
   .then(r => r.json())
   .then(console.log);
   ```

**Test Cases:**
- Short message (10 characters)
- Long message (500+ characters)
- Message with special characters
- Message with emojis
- Message with line breaks

**Expected Results:**
- All message types send successfully
- Message ID returned in all cases
- No truncation or formatting issues

---

### 4. Error Scenario Testing

**Objective:** Verify error handling works correctly.

#### Test 4.1: Invalid Token

**Steps:**
1. Temporarily modify `.env` with invalid token
2. Try to send message
3. Restore correct token

**Expected:**
- Error message: "Unauthorised Token"
- Error card displayed in UI
- No crash or unexpected behavior

#### Test 4.2: Device Offline

**Steps:**
1. Disconnect device in WSAPME
2. Try to send message

**Expected:**
- Appropriate error message
- Error handling works correctly

#### Test 4.3: Wrong Phone Number (Safety Check)

**Steps:**
1. Temporarily modify `lib/wsapme.ts` to allow different number
2. Try to send to different number
3. Verify safety check prevents it (restore code)

**Expected:**
- Safety validation works
- Only allowed phone number can be used

---

### 5. Message Info Endpoint Testing

**Objective:** Verify message info endpoint works with various message IDs.

**Steps:**
1. Send multiple test messages
2. Capture message IDs
3. Test message info for each:
   ```javascript
   fetch('/api/test-message-info', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       messageId: 'MESSAGE_ID_HERE' 
     })
   })
   .then(r => r.json())
   .then(console.log);
   ```

**Test Cases:**
- Valid message ID
- Invalid message ID
- Message ID from different device
- Message ID that doesn't exist

**Expected Results:**
- Valid IDs return status data
- Invalid IDs return appropriate errors
- Response structure is consistent

---

### 6. Bulk Status Checking

**Objective:** Determine if bulk status checking is possible.

**Current Understanding:**
- `/api/messageInfo` appears to be single-message only
- May need to make multiple calls for bulk status

**Test Steps:**
1. Send 5 test messages
2. Capture all message IDs
3. Check status for each individually
4. Document time taken and any patterns

**Questions to Answer:**
- Can we query multiple messages in one request?
- Is there a bulk status endpoint?
- What's the performance of multiple single requests?
- Should we implement parallel requests or sequential?

**Expected Outcomes:**
- Understand limitations of current API
- Determine best approach for bulk status checking
- Document any rate limiting encountered

---

### 7. Response Time Testing

**Objective:** Measure API response times.

**Steps:**
1. Measure time for send message
2. Measure time for message info
3. Test multiple requests in sequence
4. Test multiple requests in parallel

**Tools:**
```javascript
// Browser console
console.time('sendMessage');
const result = await fetch('/api/test-send', { /* ... */ });
console.timeEnd('sendMessage');
```

**Document:**
- Average send time: _____ ms
- Average status check time: _____ ms
- Parallel request handling: _____ (works/doesn't work)

---

## Test Data Collection Template

Use this template to document test results:

```markdown
### Test: [Test Name]
**Date:** [Date]
**Device Status:** Online/Offline
**Token:** Valid/Invalid

**Steps:**
1. [Step 1]
2. [Step 2]

**Request:**
```json
{
  // Request payload
}
```

**Response:**
```json
{
  // Response payload
}
```

**Status Code:** [Code]
**Status Meaning:** [Interpretation]

**Notes:**
- [Any observations]
- [Issues encountered]
- [Questions for further testing]
```

---

## Post-Testing Tasks

After completing all tests:

1. **Update API Documentation:**
   - Document status code meanings
   - Update response examples
   - Add error scenarios

2. **Update Type Definitions:**
   - Add proper types for status codes
   - Update response interfaces

3. **Implement Status Mapping:**
   - Map status codes to funnel stages
   - Update `/api/blast-data` to use real data

4. **Performance Optimization:**
   - Implement caching if needed
   - Optimize bulk status checking
   - Add rate limiting if necessary

---

## Troubleshooting

### Issue: Message sends but status check fails

**Possible Causes:**
- Message ID format incorrect
- JID format incorrect
- Timing issue (message not yet processed)

**Solutions:**
- Verify message ID from send response
- Check JID formatting (should include @s.whatsapp.net)
- Add delay before status check if needed

---

### Issue: Status code doesn't change

**Possible Causes:**
- Status updates are delayed
- Need to poll for status updates
- Status code may not update in real-time

**Solutions:**
- Implement polling mechanism
- Check WSAPME webhook capabilities
- Test with delays between checks

---

### Issue: Device appears offline but is actually online

**Possible Causes:**
- Token expired or invalid
- Device ID incorrect
- API endpoint issue

**Solutions:**
- Verify token in WSAPME dashboard
- Check device ID (should be 5850)
- Test with WSAPME API directly (curl/Postman)

---

## Testing Status

**Current Status:** ⏳ Waiting for device to come online

**Completed Tests (Mock):**
- [x] Mock blast data endpoint
- [x] Mock send message endpoint
- [x] Mock message status endpoint
- [x] Frontend UI with mock data

**Pending Tests (Real API):**
- [ ] Send message functionality
- [ ] Message status checking
- [ ] Status code mapping
- [ ] Error handling
- [ ] Bulk operations

---

**Note:** This testing guide will be updated as tests are completed and new insights are discovered.

