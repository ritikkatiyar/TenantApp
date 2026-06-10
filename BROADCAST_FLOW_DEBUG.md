# Broadcast Flow Debug Guide

## Problem
Clicking "Broadcast Notice" button does not fire the API request to the backend.

## Solution: Check Console Logs

### Step 1: Open Developer Console
- **Web**: Press `F12` or `Ctrl+Shift+I`
- **Mobile (Expo)**: Shake device or open Expo DevTools → View logs

### Step 2: Click "Broadcast Notice" Button
Look for these logs in order:

```
[Broadcast] Desktop broadcast button pressed for property: {propertyId} {propertyName}
```
- ✅ If you see this → Button click is working
- ❌ If not → Button is not being triggered (UI issue)

### Step 3: Check Modal Opening
After button click, look for:
```
[Broadcast] Modal should now be visible
```
- ✅ See modal appear on screen
- ❌ No modal? Check React Native Modal compatibility

### Step 4: Fill Form & Click "BROADCAST NOW"
Fill in:
- **Title**: e.g., "Water shut-off notice"
- **Content**: e.g., "Water supply will be shut down on June 15"
- Leave Category, Severity, Target as defaults

Click the blue "BROADCAST NOW" button. Look for:

```
[Broadcast] handleSendBroadcast called
[Broadcast] selectedProperty: {propertyId} hasToken: true
[Broadcast] Validation passed, starting send...
[Broadcast] Payload: {...}
[Broadcast] Calling createAnnouncement...
```

### Step 5: Check API Call
Look for:
```
[Announcement API] createAnnouncement called with: {...}
[API Request] POST /api/v1/announcements
[API] POST /api/v1/announcements -> http://localhost:8080/api/v1/announcements
[API] Response status: 201
[Announcement API] Success: {...}
[Broadcast] Success!
```

### Success Indicators
✅ All logs appear in order
✅ Alert shows "Announcement broadcasted successfully!"
✅ Modal closes
✅ Form resets

---

## Common Issues & Solutions

### Issue: Button click not logged
**Solution**: Check if button wrapper has correct `onPress` handler
```
Ensure: <TouchableOpacity ... onPress={() => { console.log(...); setSelectedPropertyForBroadcast(item); }}
```

### Issue: Modal doesn't appear after button click
**Solution**: 
- React Native Modal may not work on web
- Check `selectedPropertyForBroadcast` state is actually set
- Try: `console.log('[Modal State]', selectedPropertyForBroadcast)`

### Issue: Form submitted but no API logs
**Solution**:
- Check if `accessToken` is valid: `console.log('[Auth]', accessToken)`
- Verify payload is valid before submission
- Check browser DevTools Network tab → POST request may be failing

### Issue: API Response status 400/401/500
**Solution**:
- Look for error message in logs: `[API ERROR]`
- Check backend logs at: `backend/logs/dev/`
- Verify token is not expired

---

## Quick Debug Commands

Run these in browser console (F12):

```javascript
// Check if window has fetch
console.log('[ENV] Fetch available:', typeof fetch);

// Force a test API call
fetch('http://localhost:8080/api/v1/announcements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    propertyId: 'test-property-id',
    title: 'Test',
    content: 'Test content',
    category: 'GENERAL',
    severity: 'INFO',
    targetType: 'PROPERTY'
  })
}).then(r => r.json()).then(d => console.log('[TEST]', d));
```

---

## Backend Verification

If frontend logs look good but backend doesn't receive the request:

### 1. Check backend is running
```bash
cd backend
mvn spring-boot:run
```

### 2. Check logs for incoming request
```bash
tail -f backend/logs/dev/application.log | grep "POST /api/v1/announcements"
```

### 3. Verify endpoint exists
```bash
curl -X POST http://localhost:8080/api/v1/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"propertyId":"...","title":"Test","content":"Test","category":"GENERAL","severity":"INFO","targetType":"PROPERTY"}'
```

---

## Next Steps After Debugging

1. **Note the exact log outputs** from console
2. **Share the logs** with the team
3. **Check error messages** carefully
4. If API call succeeds (201 status), check database:
   ```sql
   SELECT * FROM announcement_tbl ORDER BY created_at DESC LIMIT 1;
   ```
