# SEO System - Quick Test Guide

## ⚡ 5-Minute Test

### 1️⃣ Approve a Clinic & Watch Terminal

```bash
# 1. Register clinic at /clinic/register-clinic
# 2. Approve at /admin/AdminClinicApproval
# 3. Watch terminal for:
```

**Expected Output:**
```
✅ Slug generated successfully: clinic-name
🚀 Running SEO pipeline for clinic: [id]
✅ [SEO] Pipeline completed successfully
```

### 2️⃣ Check Database

```javascript
// In MongoDB Compass or shell
db.clinics.findOne({ name: "Your Clinic" })
// Verify: slug exists, slugLocked: true
```

### 3️⃣ Check Sitemap

```bash
# File location
ZEVA/public/sitemap-clinics.xml

# Or visit in browser
http://localhost:3000/sitemap-clinics.xml
```

### 4️⃣ Test API

```bash
# Replace [ID] with actual clinic ID
curl http://localhost:3000/api/seo/meta/clinic/[ID]
```

### 5️⃣ Check Frontend URL

- Go to `/clinic/findclinic`
- Click "View Details"
- URL should be `/clinics/[slug]` not `/clinics/[id]`

---

## ✅ Success Indicators

- [ ] Terminal shows SEO pipeline logs
- [ ] Database has `slug` and `slugLocked: true`
- [ ] Sitemap file exists and contains clinic URL
- [ ] API returns meta tags JSON
- [ ] Frontend uses slug URLs

---

## ❌ Troubleshooting

**No logs?** → Check approval API integration
**No slug?** → Check clinic approval status
**No sitemap?** → Check `public/` directory permissions
**API error?** → Check entity exists and is approved

