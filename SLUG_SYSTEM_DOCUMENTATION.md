# Slug System Documentation

## 📋 Overview

This document explains the **Central Slug Service** implementation for the Zeva360 platform. The slug system provides SEO-friendly URLs for clinics and other entities, ensuring permanent, shareable links that improve search engine visibility and user experience.

## 🏗️ Architecture

### Central Slug Service (Entity-Agnostic, Rule-Driven)

The system follows a **"One slug engine, One service, Zero duplicated APIs"** approach:

- **One slug engine**: `lib/slugService.js` - Central service handling all slug operations
- **One service**: Unified API for all entity types (clinic, doctor, blog, job, etc.)
- **Zero duplicated APIs**: No duplicate slug generation logic across the codebase

## 🔄 Project Flow

1. **Clinic owner registers** through `/clinic/register-clinic`
2. **Admin reviews** through `/admin/AdminClinicApproval`
3. **Admin approves** through `/admin/AdminClinicApproval` → calls `/api/admin/update-approve`
4. **Slug Generator API runs** automatically during approval
5. **Slug stored & locked** in Clinic document
6. **Clinic visible on website** with slug-based URL
7. **User searches & clicks** through `/clinic/findclinic` and clicks "View Details" button
8. **Slug-based page loads** at `/clinics/[slug]`
9. **Old URLs → redirected** automatically to new slug-based URLs

## 📁 File Structure & Purpose

### Core Service Files

#### 1. `lib/slugService.js`
**Purpose**: Central slug generation and management service

**Key Functions**:
- `generateSlug(entityType, entityId, options)` - Generate unique slug for an entity
- `lockSlug(entityType, entityId, slug)` - Lock a slug to prevent changes
- `generateAndLockSlug(entityType, entityId, options)` - Generate and lock in one operation
- `findBySlug(entityType, slug)` - Find entity by slug
- `getEntityRoute(entityType, slug)` - Get route URL for an entity
- `validateSlug(slug)` - Validate slug format
- `getEntityRule(entityType)` - Get configuration for entity type

**Entity Rules Configuration**:
- Defines slug field names, lock fields, source fields per entity type
- Configures approval requirements
- Sets route prefixes for each entity type

**How to Test**:
```javascript
const { generateAndLockSlug, findBySlug } = require('./lib/slugService');

// Generate slug for a clinic
const clinic = await generateAndLockSlug('clinic', 'clinic_id_here');

// Find clinic by slug
const foundClinic = await findBySlug('clinic', 'clinic-name-slug');
```

#### 2. `lib/utils.ts`
**Purpose**: Utility functions for slug generation

**Key Functions**:
- `slugify(text)` - Convert text to URL-friendly slug
- `generateUniqueSlug(baseSlug, checkExists)` - Generate unique slug with collision handling

**How to Test**:
```javascript
const { slugify } = require('./lib/utils');

const slug = slugify("Dr. John's Clinic & Hospital");
// Returns: "dr-johns-clinic-hospital"
```

### API Endpoints

#### 3. `pages/api/slug/generate.js`
**Purpose**: Central API endpoint for generating slugs for any entity type

**Endpoint**: `POST /api/slug/generate`

**Request Body**:
```json
{
  "entityType": "clinic",
  "entityId": "clinic_id_here",
  "customText": "optional custom text",
  "forceRegenerate": false
}
```

**Response**:
```json
{
  "success": true,
  "slug": "clinic-name-slug",
  "entityType": "clinic",
  "entityId": "clinic_id_here",
  "locked": true,
  "message": "Slug generated and locked successfully"
}
```

**How to Test**:
```bash
curl -X POST http://localhost:3000/api/slug/generate \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "clinic",
    "entityId": "your_clinic_id"
  }'
```

#### 4. `pages/api/admin/update-approve.js`
**Purpose**: Admin approval endpoint that automatically generates slugs

**Endpoint**: `POST /api/admin/update-approve`

**Request Body**:
```json
{
  "clinicId": "clinic_id_here"
}
```

**What It Does**:
1. Validates user permissions
2. Fetches clinic before update
3. **Automatically generates and locks slug** using central slug service
4. Updates clinic with `isApproved: true` and `slugLocked: true`

**How to Test**:
- Go to `/admin/AdminClinicApproval`
- Click "Approve" on a clinic
- Check database: clinic should have `slug` and `slugLocked: true`

#### 5. `pages/api/clinics/by-slug/[slug].js`
**Purpose**: Fetch clinic by slug (primary endpoint for public pages)

**Endpoint**: `GET /api/clinics/by-slug/[slug]`

**Example**: `GET /api/clinics/by-slug/dr-johns-clinic`

**Response**:
```json
{
  "success": true,
  "clinic": {
    "_id": "...",
    "name": "Dr. John's Clinic",
    "slug": "dr-johns-clinic",
    "slugLocked": true,
    ...
  }
}
```

**How to Test**:
```bash
curl http://localhost:3000/api/clinics/by-slug/dr-johns-clinic
```

#### 6. `pages/api/clinics/redirect/[id].js`
**Purpose**: Redirect old ObjectId-based URLs to slug-based URLs

**Endpoint**: `GET /api/clinics/redirect/[id]`

**What It Does**:
1. Checks if ID is ObjectId or slug
2. If ObjectId: Finds clinic, generates slug if needed, redirects to slug URL
3. If slug: Redirects to proper route
4. Returns 301 (Permanent Redirect) for SEO

**How to Test**:
```bash
# Old URL (ObjectId)
curl -I http://localhost:3000/api/clinics/redirect/507f1f77bcf86cd799439011

# Should redirect to:
# Location: /clinics/clinic-name-slug
```

### Frontend Files

#### 7. `pages/clinics/[id].tsx`
**Purpose**: Clinic detail page that supports both slug and ObjectId routing

**What It Does**:
1. Checks if URL parameter is slug or ObjectId
2. If ObjectId: Fetches clinic, checks for slug, redirects if slug exists
3. If slug: Fetches clinic directly by slug
4. Displays clinic information

**How to Test**:
- Visit `/clinics/dr-johns-clinic` (slug-based)
- Visit `/clinics/507f1f77bcf86cd799439011` (ObjectId - should redirect)

#### 8. `pages/clinic/findclinic.jsx`
**Purpose**: Clinic search page that uses slug-based links

**What Changed**:
- Updated "View Details" links to use `clinic.slug` instead of `textToSlug(clinic.name)`
- Falls back to ObjectId if slug not available

**How to Test**:
- Search for clinics
- Click "View Details"
- Should navigate to `/clinics/[slug]` instead of `/clinics/[text-slug]?c=[id]`

### Scripts

#### 9. `scripts/backfill-clinic-slugs.js`
**Purpose**: One-time script to generate slugs for existing approved clinics

**Usage**:
```bash
# Dry run (see what would be done)
node scripts/backfill-clinic-slugs.js --dry-run

# Actually generate slugs
node scripts/backfill-clinic-slugs.js

# Force regeneration (not recommended)
node scripts/backfill-clinic-slugs.js --force
```

**What It Does**:
1. Finds all approved clinics without slugs
2. Generates and locks slugs for each
3. Reports success/error counts

**How to Test**:
```bash
# First, check what would be done
node scripts/backfill-clinic-slugs.js --dry-run

# Then run it for real
node scripts/backfill-clinic-slugs.js
```

## 🧪 Testing Guide

### 1. Test Slug Generation on Approval

**Steps**:
1. Register a new clinic (or use existing unapproved clinic)
2. Go to `/admin/AdminClinicApproval`
3. Click "Approve" on a clinic
4. Check database: Clinic should have `slug` and `slugLocked: true`

**Expected Result**:
- Clinic approved
- Slug generated (e.g., "clinic-name")
- Slug locked (`slugLocked: true`)

### 2. Test Slug-Based Fetch

**Steps**:
1. Get a clinic slug from database
2. Visit `/clinics/[slug]` (e.g., `/clinics/dr-johns-clinic`)
3. Page should load clinic information

**Expected Result**:
- Clinic page loads successfully
- URL shows slug, not ObjectId

### 3. Test Redirect from Old URLs

**Steps**:
1. Get an old ObjectId-based URL (e.g., `/clinics/507f1f77bcf86cd799439011`)
2. Visit the URL
3. Should redirect to slug-based URL

**Expected Result**:
- Browser redirects to `/clinics/[slug]`
- 301 redirect (permanent) for SEO

### 4. Test Backfill Script

**Steps**:
1. Run dry-run first: `node scripts/backfill-clinic-slugs.js --dry-run`
2. Review output
3. Run actual script: `node scripts/backfill-clinic-slugs.js`
4. Check database: All approved clinics should have slugs

**Expected Result**:
- Script reports number of clinics processed
- All approved clinics have slugs
- No errors

### 5. Test Find Clinic Links

**Steps**:
1. Go to `/clinic/findclinic`
2. Search for clinics
3. Click "View Details" on a clinic
4. Should navigate to slug-based URL

**Expected Result**:
- Link uses `/clinics/[slug]` format
- Not `/clinics/[text-slug]?c=[id]`

## 🔍 Troubleshooting

### Issue: Slug not generated on approval

**Check**:
1. Is clinic approved? (`isApproved: true`)
2. Check server logs for errors
3. Verify `lib/slugService.js` is imported correctly
4. Check database: Does clinic have `name` field?

**Solution**:
- Ensure clinic has a `name` field
- Check server logs for specific error
- Manually generate slug: `POST /api/slug/generate`

### Issue: Redirect not working

**Check**:
1. Does clinic have a slug?
2. Is `slugLocked: true`?
3. Check redirect API logs

**Solution**:
- Run backfill script if slug missing
- Check redirect API endpoint is accessible
- Verify clinic is approved

### Issue: Slug collision (duplicate slug)

**Check**:
- Slug service should handle this automatically
- Appends `-1`, `-2`, etc. for duplicates

**Solution**:
- This is handled automatically
- Check `generateUniqueSlug` function in `lib/utils.ts`

### Issue: Old URLs still showing ObjectId

**Check**:
1. Is clinic approved?
2. Does clinic have slug?
3. Is `slugLocked: true`?

**Solution**:
- Run backfill script
- Ensure approval process generates slug
- Check `findclinic.jsx` uses `clinic.slug`

## 📊 Database Schema

### Clinic Model Fields

```javascript
{
  slug: {
    type: String,
    unique: true,
    sparse: true,  // Only unique when exists
    index: true
  },
  slugLocked: {
    type: Boolean,
    default: false  // Lock slug once approved
  }
}
```

**Important**:
- `sparse: true` allows multiple clinics without slugs (for pending approvals)
- `index: true` enables fast lookups by slug
- `slugLocked: true` prevents slug changes after approval

## 🚀 Deployment Checklist

- [ ] Run backfill script: `node scripts/backfill-clinic-slugs.js`
- [ ] Test slug generation on approval
- [ ] Test slug-based fetch: `/api/clinics/by-slug/[slug]`
- [ ] Test redirect: `/api/clinics/redirect/[id]`
- [ ] Test clinic detail page: `/clinics/[slug]`
- [ ] Test find clinic links use slugs
- [ ] Verify database indexes are created
- [ ] Check server logs for errors

## 📝 Notes

- **Slug Format**: Lowercase, alphanumeric, hyphens only (e.g., `dr-johns-clinic`)
- **Uniqueness**: Handled automatically with counter suffix (e.g., `clinic-name-1`)
- **Locking**: Once locked, slug cannot be changed (SEO stability)
- **Backward Compatibility**: Old ObjectId URLs redirect to slug URLs
- **Entity-Agnostic**: Same service works for clinics, doctors, blogs, jobs, etc.

## 🔗 Related Files

- `models/Clinic.js` - Clinic model with slug fields
- `lib/database.js` - Database connection
- `pages/api/clinics/[id].js` - ObjectId-based clinic API (still used internally)

---

**Last Updated**: 2024
**Version**: 1.0.0

