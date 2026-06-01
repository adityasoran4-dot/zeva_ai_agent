# User Packages - Troubleshooting Guide

## Issue: Data Not Showing in UI

You have data in your database but it's not appearing in the UI. Here are the steps to diagnose and fix this:

### Step 1: Check Browser Console Logs

Open the page `/clinic/userpackages` and press F12 to open Developer Tools. Look at the Console tab for:

1. **Token Detection**
   ```
   Found token in clinicToken: eyJhbGciOiJIUzI1NiIs...
   Decoded token - clinicId: 68909b31faa98f63e97e3d1b
   ```

2. **API Request Logs**
   ```
   Fetching packages with status: approved search: 
   API Response: {success: true, packages: Array(2)}
   ```

### Step 2: Verify Clinic ID Match

The most common issue is a **clinicId mismatch**. Your database shows:
```
clinicId: "68909b31faa98f63e97e3d1b"
```

Check if your authenticated user's token has the same clinicId:

1. Go to the debug page: `/clinic/debug-userpackages`
2. Look at the "Decoded Token" section
3. Check if `clinicId` matches `68909b31faa98f63e97e3d1b`

### Step 3: Common Issues & Solutions

#### Issue A: No Token Found
**Symptoms:**
- Console shows: "No authentication token found"
- Page shows error message

**Solution:**
1. Log out and log back in
2. Make sure you're logging in as a clinic user
3. Check localStorage for tokens:
   ```javascript
   // Run in browser console
   console.log('clinicToken:', localStorage.getItem('clinicToken'));
   ```

#### Issue B: Clinic ID Mismatch
**Symptoms:**
- Token exists but clinicId doesn't match
- API returns empty array

**Solution:**
Your user might be associated with a different clinic. You need to either:
1. Update the user's clinicId in the database to match `68909b31faa98f63e97e3d1b`
2. Or use a user account that belongs to the correct clinic

#### Issue C: Approval Status Filter
**Symptoms:**
- Approved tab shows nothing, but you see pending packages

**Solution:**
Make sure you're checking the correct tab:
- Pending packages → Click "Pending Approval" tab
- Approved packages → Click "Approved Packages" tab

### Step 4: Manual Database Check

Run this query in your MongoDB to verify data:

```javascript
// Check all user packages for your clinic
db.userpackages.find({ 
  clinicId: ObjectId("68909b31faa98f63e97e3d1b") 
}).toArray();

// Check specifically approved packages
db.userpackages.find({ 
  clinicId: ObjectId("68909b31faa98f63e97e3d1b"),
  approvalStatus: "approved"
}).toArray();

// Check pending packages
db.userpackages.find({ 
  clinicId: ObjectId("68909b31faa98f63e97e3d1b"),
  approvalStatus: "pending"
}).toArray();
```

### Step 5: Test API Directly

You can test the API endpoint directly:

```bash
# Get approved packages
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:3000/api/clinic/user-packages?status=approved"

# Get pending packages
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:3000/api/clinic/user-packages?status=pending"
```

### Step 6: Check Server Logs

Look at your Next.js server console for these logs:

```
Fetching packages for clinicId: 68909b31faa98f63e97e3d1b
Status filter: approved
Query: {"clinicId":"68909b31faa98f63e97e3d1b","approvalStatus":"approved"}
Found packages: 2
```

If you see "Found packages: 0", the query isn't matching any documents.

### Quick Fix Options

#### Option 1: Remove Status Filter Temporarily
Edit `/pages/api/clinic/user-packages.js` line 29-31:

```javascript
// Comment out the status filter temporarily
// if (status && ['pending', 'approved', 'rejected'].includes(status)) {
//   query.approvalStatus = status;
// }
```

This will return ALL packages regardless of approval status.

#### Option 2: Use Debug Page
Visit `/clinic/debug-userpackages` to see:
- What token is being used
- What clinicId your token has
- What packages are returned from API

#### Option 3: Check Patient Data
Your packages reference patientId `69c7773112dccbf09fc455f8`. Make sure this patient exists:

```javascript
// In MongoDB
db.patientregistrations.findOne({ 
  _id: ObjectId("69c7773112dccbf09fc455f8") 
});
```

### Expected Behavior

When everything works correctly:

1. ✅ Page loads without errors
2. ✅ Console shows token with correct clinicId
3. ✅ API returns packages array with your data
4. ✅ Cards display on the page
5. ✅ Tab badges show correct counts (e.g., "Pending (0)" and "Approved (2)")

### Still Not Working?

If you've tried all the above and still don't see data:

1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Re-login to the application**

3. **Check if UserPackage model has the correct clinicId field:**
   - Open MongoDB
   - Run: `db.userpackages.findOne()`
   - Verify `clinicId` field exists and is an ObjectId

4. **Verify the API route is working:**
   - Check Network tab in browser DevTools
   - Look for requests to `/api/clinic/user-packages`
   - Check the response status and body

### Contact Information

If none of these steps work, provide the following information when asking for help:

1. Browser console logs (full output)
2. Network tab request/response for the API call
3. Output from debug page (`/clinic/debug-userpackages`)
4. Your clinicId from the database
5. Sample package document from MongoDB
