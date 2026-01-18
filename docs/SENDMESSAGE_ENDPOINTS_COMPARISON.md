# SendMessage Endpoints Comparison

## Endpoints

1. **`/v1/sendMessage`** - (Unknown/Not documented)
2. **`/v1/sendMessage2`** - (Currently used in our code)

## Current Usage

We're currently using **`/v1/sendMessage2`** in `lib/wsapme.ts`:
```typescript
const endpoint = `${WSAPME_API_BASE}/v1/sendMessage2`;
```

## Possible Differences

### Version Differences
- **`sendMessage`** - Might be the original/v1 endpoint
- **`sendMessage2`** - Might be an updated/v2 endpoint with improvements

### Feature Differences
- Different response formats
- Different capabilities (e.g., `sendMessage2` might support additional features)
- Different request formats

### Legacy vs New
- `sendMessage` - Legacy/older version
- `sendMessage2` - Current/recommended version

## To Determine the Difference

### Option 1: Check Documentation
- Review WSAPME API documentation for both endpoints
- Check if `/v1/sendMessage` is deprecated

### Option 2: Test Both Endpoints
1. Try calling `/v1/sendMessage` with the same request
2. Compare the responses
3. See if they work the same or differently

### Option 3: Contact WSAPME Support
- Ask about the difference between the two endpoints
- Confirm which one should be used

## Recommendation

**Continue using `/v1/sendMessage2`** since:
- It's working in our code
- The "2" suggests it might be an updated version
- It matches what you initially specified

If needed, we can test both endpoints to see the actual difference.

