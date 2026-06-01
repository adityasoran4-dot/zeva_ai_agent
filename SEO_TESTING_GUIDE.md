# SEO System Testing Guide

## 🚀 Quick Testing Steps

### Step-by-Step Visual Testing

#### **Test 1: Verify SEO Pipeline Runs on Approval**

1. **Open Terminal** - Keep it visible to see logs
2. **Register a Clinic**:
   - Go to `/clinic/register-clinic`
   - Fill all fields (name, address, treatments, photos, pricing)
   - Submit
3. **Approve the Clinic**:
   - Go to `/admin/AdminClinicApproval`
   - Find your clinic → Click "Approve"
4. **Watch Terminal** - You should see:
   ```
   🔄 Generating slug for clinic: [Name] (ID: ...)
   ✅ Slug generated successfully: [slug]
   🚀 Running SEO pipeline for clinic: [id]
   🔍 [SEO] Step 1: Deciding indexing...
   🤖 [SEO] Step 2: Generating robots meta...
   📝 [SEO] Step 3: Generating meta tags...
   🔗 [SEO] Step 4: Resolving canonical URL...
   🔎 [SEO] Step 5: Checking duplicates...
   🗺️ [SEO] Step 6: Updating sitemap...
   📡 [SEO] Step 7: Pinging search engines...
   ✅ [SEO] Pipeline completed successfully
   ```

#### **Test 2: Check Database**

**Option A: MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database
3. Go to `clinics` collection
4. Find your clinic
5. Verify:
   - ✅ `slug`: "your-clinic-name"
   - ✅ `slugLocked`: true
   - ✅ `isApproved`: true

**Option B: MongoDB Shell**
```javascript
use your_database_name
db.clinics.findOne({ name: "Your Clinic Name" })
// Check: slug, slugLocked, isApproved
```

#### **Test 3: Check Sitemap Files**

1. **Navigate to project folder**:
   ```bash
   cd ZEVA/public
   ```

2. **Check if files exist**:
   - `sitemap-clinics.xml`
   - `sitemap-doctors.xml`
   - `sitemap.xml`

3. **Open `sitemap-clinics.xml`** - Should contain:
   ```xml
   <url>
     <loc>https://zeva360.com/clinics/your-clinic-slug</loc>
     <lastmod>2026-01-09T...</lastmod>
     <changefreq>weekly</changefreq>
     <priority>0.9</priority>
   </url>
   ```

4. **Browser Test**:
   - Start your dev server: `npm run dev`
   - Visit: `http://localhost:3000/sitemap-clinics.xml`
   - Should see XML formatted sitemap

#### **Test 4: Test SEO Meta API**

1. **Get Clinic ID** from database
2. **Call API**:
   ```bash
   # In browser or Postman
   GET http://localhost:3000/api/seo/meta/clinic/[CLINIC_ID]
   ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "meta": {
       "title": "Clinic Name in City",
       "description": "Clinic Name offers...",
       "keywords": ["clinic", "city", "treatment"],
       "robots": "index, follow",
       "canonical": "https://zeva360.com/clinics/clinic-slug",
       "og": {
         "title": "...",
         "description": "...",
         "image": "..."
       }
     },
     "headings": {
       "h1": "Clinic Name",
       "h2": ["Our Treatments", "Location & Contact"]
     },
     "indexing": {
       "shouldIndex": true,
       "priority": "high",
       "warnings": []
     }
   }
   ```

#### **Test 5: Verify Frontend URLs**

1. **Clinic Search Page** (`/clinic/findclinic`):
   - Search for clinics
   - Click "View Details" on any clinic
   - **Check URL bar** - Should be: `/clinics/[slug]` NOT `/clinics/[id]`
   - Example: `/clinics/abc-clinic` ✅ (not `/clinics/507f1f77bcf86cd799439011`)

2. **Doctor Search Page** (`/doctor/search`):
   - Search for doctors
   - Click "View Details"
   - **Check URL bar** - Should be: `/doctor/[slug]`

#### **Test 6: Browser DevTools Check**

1. **Open Clinic Page**: `/clinics/[slug]`
2. **Open DevTools** (F12)
3. **Go to "Network" tab**
4. **Refresh page**
5. **Check Response Headers** (if API returns meta tags)
6. **Go to "Elements" tab**
7. **Search for** `<head>` section
8. **Verify** (if meta tags are added):
   - `<meta name="robots" content="...">`
   - `<link rel="canonical" href="...">`
   - `<title>...</title>`

#### **Test 7: Test Redirect (Old URLs)**

1. **Get old ObjectId** from database
2. **Visit**: `http://localhost:3000/clinics/[OLD_OBJECT_ID]`
3. **Should redirect** to: `/clinics/[slug]`
4. **Check Network tab**:
   - Status: 301 or 302 (redirect)
   - Location header: `/clinics/[slug]`

---

## Quick Testing Checklist

### ✅ Test 1: Clinic Approval & SEO Pipeline

**Steps:**
1. Register a new clinic at `/clinic/register-clinic`
   - Fill all required fields (name, address, treatments, photos, pricing)
   - Submit the form

2. Approve the clinic at `/admin/AdminClinicApproval`
   - Find your clinic in the list
   - Click "Approve"

3. **Check Terminal Logs** - You should see:
   ```
   🔄 Generating slug for clinic: [Clinic Name] (ID: ...)
   ✅ Slug generated successfully: [slug-name]
   🚀 Running SEO pipeline for clinic: [clinic-id]
   🔍 [SEO] Step 1: Deciding indexing for clinic [clinic-id]
   🤖 [SEO] Step 2: Generating robots meta for clinic [clinic-id]
   📝 [SEO] Step 3: Generating meta tags for clinic [clinic-id]
   🔗 [SEO] Step 4: Resolving canonical URL for clinic [clinic-id]
   🔎 [SEO] Step 5: Checking duplicates for clinic [clinic-id]
   🗺️ [SEO] Step 6: Updating sitemap for clinic [clinic-id]
   📡 [SEO] Step 7: Pinging search engines for clinic [clinic-id]
   ✅ [SEO] Pipeline completed for clinic [clinic-id]
   ✅ SEO pipeline completed successfully
   ```

4. **Check Database** (MongoDB):
   ```javascript
   db.clinics.findOne({ name: "Your Clinic Name" })
   // Should show:
   // - slug: "your-clinic-name"
   // - slugLocked: true
   // - isApproved: true
   ```

5. **Check Sitemap Files**:
   - Open `public/sitemap-clinics.xml` in your editor
   - Should contain your clinic's URL
   - Open `public/sitemap.xml` - should reference clinics sitemap

6. **Test Frontend Page**:
   - Go to `/clinics/[your-slug]` (e.g., `/clinics/your-clinic-name`)
   - Open browser DevTools → Network tab
   - Check page source (View → Developer → View Source)
   - Look for:
     ```html
     <meta name="robots" content="index, follow">
     <link rel="canonical" href="https://zeva360.com/clinics/your-clinic-name">
     <title>Your Clinic Name in City</title>
     <meta name="description" content="Your Clinic Name offers...">
     ```

---

### ✅ Test 2: Doctor Approval & SEO Pipeline

**Steps:**
1. Register a new doctor at `/doctor/doctor-register`
   - Fill all required fields (name, degree, experience, address, treatments, resume)
   - Submit the form

2. Approve the doctor at `/admin/approve-doctors`
   - Find your doctor in the list
   - Click "Approve"

3. **Check Terminal Logs** - Similar to clinic logs:
   ```
   🔄 Generating slug for doctor: [Doctor Name] (Profile ID: ...)
   ✅ Slug generated successfully: [slug-name]
   🚀 Running SEO pipeline for doctor: [doctor-id]
   ✅ [SEO] Pipeline completed for doctor [doctor-id]
   ```

4. **Check Database**:
   ```javascript
   db.doctorprofiles.findOne({ _id: ObjectId("...") })
   // Should show:
   // - slug: "dr-doctor-name"
   // - slugLocked: true
   
   db.users.findOne({ _id: ObjectId("...") })
   // Should show:
   // - isApproved: true
   ```

5. **Test Frontend Page**:
   - Go to `/doctor/[your-slug]` (e.g., `/doctor/dr-doctor-name`)
   - Check meta tags in page source

---

### ✅ Test 3: Verify Meta Tags in Browser

**Method 1: View Page Source**
1. Open clinic/doctor page
2. Right-click → "View Page Source"
3. Search for:
   - `<meta name="robots"`
   - `<link rel="canonical"`
   - `<title>`
   - `<meta name="description"`

**Method 2: Browser DevTools**
1. Open DevTools (F12)
2. Go to "Elements" tab
3. Find `<head>` section
4. Verify all meta tags are present

**Method 3: SEO Testing Tools**
- Use browser extensions:
  - SEO META in 1 CLICK
  - Meta SEO Inspector
- Or online tools:
  - https://www.opengraph.xyz/
  - https://metatags.io/

---

### ✅ Test 4: Check Sitemap Files

**Location**: `public/sitemap-clinics.xml` and `public/sitemap-doctors.xml`

**Manual Check:**
```bash
# Navigate to project root
cd ZEVA

# View clinics sitemap
cat public/sitemap-clinics.xml

# View doctors sitemap
cat public/sitemap-doctors.xml

# View main sitemap index
cat public/sitemap.xml
```

**Expected Content:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zeva360.com/clinics/your-clinic-slug</loc>
    <lastmod>2026-01-09T10:45:46.560Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

**Browser Check:**
- Visit: `http://localhost:3000/sitemap-clinics.xml`
- Should see XML formatted sitemap
- All approved clinics with slugs should be listed

---

### ✅ Test 5: Verify Canonical URLs

**Test Steps:**
1. Open clinic page: `/clinics/[slug]`
2. Check page source for:
   ```html
   <link rel="canonical" href="https://zeva360.com/clinics/clinic-slug">
   ```

3. Test old URL redirect:
   - Visit: `/clinics/[old-object-id]`
   - Should redirect to: `/clinics/[slug]`
   - Check Network tab → Status: 301 or 302 redirect

---

### ✅ Test 6: Robots Meta Tags

**Test Different Scenarios:**

**Scenario A: Complete Profile (Should Index)**
- Clinic/Doctor with all fields filled
- Expected: `<meta name="robots" content="index, follow">`

**Scenario B: Incomplete Profile (Should Not Index)**
- Create clinic without photos or treatments
- Approve it
- Expected: `<meta name="robots" content="noindex, nofollow">`

**How to Test:**
1. Create incomplete clinic (missing photos/treatments)
2. Approve it
3. Check page source for robots meta tag
4. Should show `noindex, nofollow`

---

### ✅ Test 7: Duplicate Detection

**Test Steps:**
1. Create Clinic A: "ABC Clinic" in "New Delhi"
2. Approve Clinic A
3. Create Clinic B: "ABC Clinic" in "New Delhi" (same name)
4. Approve Clinic B
5. Check terminal logs:
   ```
   🔎 [SEO] Step 5: Checking duplicates for clinic [clinic-id]
   ⚠️ Potential duplicate clinic name detected
   ```

6. Check SEO result in logs:
   - Should show `warnings: ["Potential duplicate clinic name detected"]`
   - Priority might be lowered

---

### ✅ Test 8: Search Engine Ping

**Check Terminal Logs After Approval:**
```
📡 [SEO] Step 7: Pinging search engines for clinic [clinic-id]
✅ Google ping successful: https://zeva360.com/sitemap.xml
✅ Bing ping successful: https://zeva360.com/sitemap.xml
✅ [SEO] Search engines pinged successfully
```

**Note**: In development, pings might fail (expected). In production, they should succeed.

---

### ✅ Test 9: Frontend Integration

**Clinic Search Page** (`/clinic/findclinic`):
1. Search for clinics
2. Click "View Details" on any clinic card
3. Should navigate to: `/clinics/[slug]` (not `/clinics/[id]`)
4. Check browser URL bar

**Doctor Search Page** (`/doctor/search`):
1. Search for doctors
2. Click "View Details" on any doctor card
3. Should navigate to: `/doctor/[slug]` (not `/doctor/[id]`)
4. Check browser URL bar

---

### ✅ Test 10: API Endpoints

**Test SEO Decision API** (if you create one):
```bash
# Check indexing decision
curl http://localhost:3000/api/seo/decision?type=clinic&id=[clinic-id]

# Expected response:
{
  "shouldIndex": true,
  "reason": "Profile complete and unique",
  "priority": "high",
  "warnings": []
}
```

---

## Common Issues & Solutions

### Issue 1: No SEO logs in terminal
**Solution**: Check if approval API is calling `runSEOPipeline`

### Issue 2: Sitemap files not created
**Solution**: 
- Check `public/` directory exists
- Check file permissions
- Look for errors in terminal

### Issue 3: Meta tags not showing
**Solution**:
- Verify page is using Next.js `<Head>` component
- Check if meta tags are being passed to frontend
- Clear browser cache

### Issue 4: Canonical URL wrong
**Solution**:
- Check `NEXT_PUBLIC_BASE_URL` environment variable
- Verify slug exists and is locked

### Issue 5: Robots meta shows "noindex" for complete profiles
**Solution**:
- Check `isApproved` status in database
- Verify `slugLocked` is true
- Check profile completeness logic

---

## Quick Test Script

Create a test file: `test-seo.js`

```javascript
const { runSEOPipeline } = require('./lib/seo/SEOOrchestrator');

async function testSEO() {
  const clinicId = 'YOUR_CLINIC_ID_HERE';
  
  console.log('Testing SEO pipeline...');
  const result = await runSEOPipeline('clinic', clinicId);
  
  console.log('\n=== SEO Result ===');
  console.log('Success:', result.success);
  console.log('Should Index:', result.indexing?.shouldIndex);
  console.log('Robots:', result.robots?.content);
  console.log('Title:', result.meta?.title);
  console.log('Canonical:', result.canonical);
  console.log('Errors:', result.errors);
}

testSEO().catch(console.error);
```

Run: `node test-seo.js`

---

## Visual Testing Checklist

- [ ] Clinic approval shows SEO logs in terminal
- [ ] Doctor approval shows SEO logs in terminal
- [ ] Sitemap files exist in `public/` directory
- [ ] Sitemap XML is valid and accessible
- [ ] Clinic page shows correct meta tags
- [ ] Doctor page shows correct meta tags
- [ ] Canonical URLs point to slug-based URLs
- [ ] Old ObjectId URLs redirect to slug URLs
- [ ] Robots meta tag is present and correct
- [ ] Search pages link to slug URLs (not ObjectId)

---

## Production Testing

Before going live:
1. Set `NEXT_PUBLIC_BASE_URL` to production URL
2. Test sitemap accessibility: `https://yourdomain.com/sitemap.xml`
3. Submit sitemap to Google Search Console
4. Monitor search engine ping responses
5. Check Google Search Console for indexing status

