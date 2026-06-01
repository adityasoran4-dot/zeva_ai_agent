# Slug System Quick Start Guide

## 🚀 Quick Setup

### 1. Run Backfill Script (One-Time)

Generate slugs for existing approved clinics:

```bash
# Dry run first (see what will happen)
node scripts/backfill-clinic-slugs.js --dry-run

# Actually generate slugs
node scripts/backfill-clinic-slugs.js
```

### 2. Test Slug Generation

**Test Approval Flow**:
1. Go to `/admin/AdminClinicApproval`
2. Approve a clinic
3. Check database: Clinic should have `slug` and `slugLocked: true`

**Test API Directly**:
```bash
curl -X POST http://localhost:3000/api/slug/generate \
  -H "Content-Type: application/json" \
  -d '{"entityType": "clinic", "entityId": "your_clinic_id"}'
```

### 3. Test Slug-Based URLs

**Test Clinic Page**:
- Visit `/clinics/[slug]` (e.g., `/clinics/dr-johns-clinic`)
- Should load clinic information

**Test Redirect**:
- Visit old URL: `/clinics/[objectId]`
- Should redirect to `/clinics/[slug]`

**Test Search Links**:
- Go to `/clinic/findclinic`
- Search for clinics
- Click "View Details"
- Should navigate to slug-based URL

## ✅ Verification Checklist

- [ ] Backfill script runs without errors
- [ ] New clinic approvals generate slugs automatically
- [ ] `/clinics/[slug]` loads clinic pages
- [ ] Old ObjectId URLs redirect to slug URLs
- [ ] Find clinic page uses slug-based links
- [ ] Database shows `slug` and `slugLocked: true` for approved clinics

## 🔧 Common Issues

### Slug Not Generated
- **Check**: Is clinic approved? (`isApproved: true`)
- **Fix**: Run backfill script or manually call `/api/slug/generate`

### Redirect Not Working
- **Check**: Does clinic have slug? Is `slugLocked: true`?
- **Fix**: Run backfill script

### Links Still Using ObjectId
- **Check**: Is `clinic.slug` included in API responses?
- **Fix**: Verify `/api/clinics/nearby` includes `slug` field

## 📚 Full Documentation

See `SLUG_SYSTEM_DOCUMENTATION.md` for complete details.

