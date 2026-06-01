# Slug Generator API Implementation

## 📋 Overview

This document explains the slug generator API implementation for clinics, following the project flow where slugs are generated automatically when a clinic is approved by an admin.

## 🔄 Project Flow

1. **Clinic owner registers** through `/clinic/register-clinic`
2. **Admin reviews** through `/admin/AdminClinicApproval`
3. **Admin approves** through `/admin/AdminClinicApproval` → calls `/api/admin/update-approve`
4. **Slug Generator API runs** automatically during approval
5. **Slug stored & locked** in Clinic document
6. **Clinic visible on website** with slug-based URL
7. **User searches & clicks** through `/clinic/findclinic` and clicks "View Details"
8. **Slug-based page loads** (to be implemented in next phase)
9. **Old URLs → redirected** (to be implemented in next phase)

## 🏗️ Implementation Details

### 1. Clinic Model Updates (`models/Clinic.js`)

Added two new fields to the Clinic schema:

```javascript
slug: { 
  type: String, 
  unique: true, 
  sparse: true, // Only unique when exists
  index: true 
},
slugLocked: { type: Boolean, default: false }, // Lock slug once approved
```

**Why:**
- `slug`: Stores the SEO-friendly URL identifier
- `slugLocked`: Prevents slug changes after approval (SEO stability)
- `sparse: true`: Allows multiple clinics without slugs (for pending approvals)
- `index: true`: Fast lookups by slug

### 2. Slug Utility Functions (`lib/utils.ts`)

Added two utility functions:

#### `slugify(text: string): string`
Converts text to URL-friendly slug:
- Lowercases text
- Removes special characters
- Replaces spaces with hyphens
- Removes leading/trailing hyphens

#### `generateUniqueSlug(baseSlug: string, checkExists: Function): Promise<string>`
Generates unique slug by appending counter if duplicate exists:
- Checks for existing slugs
- Appends `-1`, `-2`, etc. if duplicate found
- Safety limit of 1000 attempts

### 3. Slug Generator API (`pages/api/clinics/generate-slug.js`)

**Endpoint:** `POST /api/clinics/generate-slug`

**Purpose:** Standalone API for generating slugs (useful for manual regeneration or testing)

**Request Body:**
```json
{
  "clinicId": "clinic_id_here",
  "clinicName": "Clinic Name Here"
}
```

**Response:**
```json
{
  "success": true,
  "slug": "clinic-name-here",
  "message": "Slug generated and locked successfully",
  "clinic": {
    "_id": "...",
    "name": "...",
    "slug": "...",
    "slugLocked": true
  }
}
```

**Features:**
- Checks if slug already exists and is locked (returns existing)
- Generates unique slug from clinic name
- Locks slug after generation
- Handles edge cases (empty names, duplicates)

### 4. Approval API Integration (`pages/api/admin/update-approve.js`)

**Updated Flow:**
1. Validates user permissions (admin/agent)
2. Fetches clinic before update
3. **Generates slug if not already locked**
4. Updates clinic with:
   - `isApproved: true`
   - `declined: false`
   - `slug: generated_slug` (if new)
   - `slugLocked: true` (if new)

**Key Logic:**
```javascript
// Generate slug if not already locked
let slug = clinicBeforeUpdate.slug;
if (!clinicBeforeUpdate.slug || !clinicBeforeUpdate.slugLocked) {
  if (clinicBeforeUpdate.name) {
    const baseSlug = slugify(clinicBeforeUpdate.name);
    if (baseSlug) {
      slug = await generateUniqueSlug(baseSlug, checkSlugExists);
    }
  }
}
```

## ✅ Features

### Slug Generation
- ✅ Automatic generation on approval
- ✅ Unique slug handling (appends counter for duplicates)
- ✅ SEO-friendly format (lowercase, hyphens, no special chars)
- ✅ Lock mechanism prevents changes after approval

### Safety & Validation
- ✅ Checks for existing locked slugs before generating
- ✅ Prevents overwriting locked slugs
- ✅ Handles edge cases (empty names, missing clinics)
- ✅ Error handling and logging

### Database
- ✅ Indexed slug field for fast lookups
- ✅ Sparse unique index (allows nulls)
- ✅ Locked flag prevents accidental changes

## 🔜 Next Steps (Future Implementation)

### Phase 2: Slug-based Fetching
- Update `/api/clinics/[id].js` to support slug lookups
- Update `/clinics/[id].tsx` to use slug instead of ID in URL
- Maintain backward compatibility with ID-based URLs

### Phase 3: URL Redirects
- Implement redirect from old ID-based URLs to slug-based URLs
- Update `findclinic.jsx` to use slug in "View Details" links
- Add 301 redirects for SEO

### Phase 4: Backfill Script
- Create script to generate slugs for existing approved clinics
- Run one-time migration for clinics without slugs

## 🧪 Testing

### Test Cases

1. **New Clinic Approval**
   - Approve clinic → slug should be generated
   - Slug should be locked
   - Slug should be unique

2. **Duplicate Clinic Names**
   - Approve "Best Clinic" → slug: "best-clinic"
   - Approve another "Best Clinic" → slug: "best-clinic-1"
   - Approve third "Best Clinic" → slug: "best-clinic-2"

3. **Already Locked Slug**
   - Approve clinic with existing locked slug → should not regenerate
   - Should return existing slug

4. **Special Characters**
   - "Dr. Smith's Clinic & Wellness" → "dr-smiths-clinic-wellness"
   - "Clinic #1" → "clinic-1"

5. **Edge Cases**
   - Empty clinic name → should handle gracefully
   - Very long names → should truncate appropriately
   - Non-existent clinic ID → should return 404

## 📝 Usage Examples

### Manual Slug Generation (via API)
```javascript
const response = await fetch('/api/clinics/generate-slug', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicId: '507f1f77bcf86cd799439011',
    clinicName: 'Best Dental Clinic'
  })
});

const { slug } = await response.json();
// Result: "best-dental-clinic"
```

### Automatic (via Approval)
```javascript
// When admin approves clinic, slug is automatically generated
const response = await fetch('/api/admin/update-approve', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    clinicId: '507f1f77bcf86cd799439011'
  })
});

const { clinic } = await response.json();
// clinic.slug = "best-dental-clinic"
// clinic.slugLocked = true
```

## 🔍 Database Queries

### Find Clinic by Slug
```javascript
const clinic = await Clinic.findOne({ 
  slug: 'best-dental-clinic',
  slugLocked: true 
});
```

### Find All Approved Clinics with Slugs
```javascript
const clinics = await Clinic.find({ 
  isApproved: true,
  slug: { $exists: true, $ne: null },
  slugLocked: true
});
```

## 🚨 Important Notes

1. **Slug Locking**: Once `slugLocked` is `true`, the slug should never change (SEO stability)
2. **Uniqueness**: Only checks against locked slugs to avoid conflicts with pending clinics
3. **Indexing**: Slug field is indexed for fast lookups
4. **Backward Compatibility**: Old ID-based URLs will still work (to be handled in Phase 2)

## 📚 Related Files

- `models/Clinic.js` - Clinic schema with slug fields
- `lib/utils.ts` - Slug utility functions
- `pages/api/clinics/generate-slug.js` - Standalone slug generator API
- `pages/api/admin/update-approve.js` - Approval API with slug generation
- `pages/clinic/findclinic.jsx` - Clinic search page (to be updated)
- `pages/clinics/[id].tsx` - Clinic detail page (to be updated)

