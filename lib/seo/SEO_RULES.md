# SEO Rules Documentation

## Overview

This document outlines the SEO rules and guidelines implemented in the Zeva360 SEO system.

## Table of Contents

1. [Indexing Rules](#indexing-rules)
2. [Meta Tag Rules](#meta-tag-rules)
3. [Canonical URL Rules](#canonical-url-rules)
4. [Slug Rules](#slug-rules)
5. [Robots Meta Rules](#robots-meta-rules)
6. [Content Quality Rules](#content-quality-rules)
7. [Sitemap Rules](#sitemap-rules)

---

## Indexing Rules

### When to Index

An entity should be indexed (`index`) when:

1. **Approval Status**
   - Clinic: `isApproved === true`
   - Doctor: `user.isApproved === true`
   - Job: `status === 'approved'`
   - Blog: `status === 'published'`

2. **Slug Requirements**
   - Slug must exist and be locked (`slugLocked === true`)
   - For blogs: `paramlink` must exist and be locked

3. **Profile Completeness**
   - **Clinic**: Must have `name`, `address`, `location`, `photos` (at least 1), `treatments` (at least 1), and `pricing`
   - **Doctor**: Must have `degree`, `experience`, `address`, `location`, `treatments` (at least 1), `resumeUrl`, and user `name`/`email`
   - **Job**: Must have `jobTitle`, `companyName`, `location`, `description`, `department`, `jobType`, and `salary`
   - **Blog**: Must have `title` (min 10 chars) and `content` (min 100 chars)

4. **Content Quality**
   - No duplicate content detected
   - Content is not "thin" (has sufficient detail)

### When NOT to Index

An entity should NOT be indexed (`noindex`) when:

1. Not approved/published
2. Slug missing or not locked
3. Profile incomplete
4. Duplicate content detected AND thin content
5. Error occurred during indexing decision

---

## Meta Tag Rules

### Title Tag

- **Length**: 50-60 characters (optimal)
- **Minimum**: 30 characters
- **Maximum**: 60 characters (will be truncated)
- **Format**: `[Entity Name] in [Location]` or `[Entity Name] - [Additional Info]`

### Description Tag

- **Length**: 150-160 characters (optimal)
- **Minimum**: 120 characters
- **Maximum**: 160 characters (will be truncated)
- **Content**: Should include entity name, key features, and location

### Keywords Tag

- **Optional** but recommended
- Should include entity name, location, and relevant terms
- Maximum 10 keywords
- No keyword stuffing

### Open Graph Tags

- **Optional** but recommended for social media sharing
- `og:title`: Same as meta title
- `og:description`: Same as meta description
- `og:image`: First photo/image from entity

---

## Canonical URL Rules

### Canonical URL Format

1. **Clinic**: `/clinics/[slug]` (if slug exists and locked)
2. **Doctor**: `/doctor/[slug]` (if slug exists and locked)
3. **Job**: `/job-details/[slug]` (if slug exists and locked)
4. **Blog**: `/blogs/[paramlink]` (if paramlink exists)

### Fallback

- If slug not available, use ObjectId: `/clinics/[id]`
- Should rarely happen if slug generation is working correctly

### Requirements

- Slug must exist and be locked before canonical URL is set
- No duplicate canonical URLs allowed
- Canonical URL should be absolute (include base URL)

---

## Slug Rules

### Slug Generation

1. **Source Text**:
   - Clinic: `[name] [city]`
   - Doctor: `[name] [city]`
   - Job: `[title] [location]`
   - Blog: `[title]` (with sequential numbering for duplicates)

2. **Format**:
   - Lowercase
   - Alphanumeric and hyphens only
   - No special characters
   - No consecutive hyphens
   - No leading/trailing hyphens

3. **Uniqueness**:
   - Must be unique per entity type
   - Sequential numbering for blogs: `title-2`, `title-3`, etc.
   - City/location appended for clinics/doctors/jobs

4. **Locking**:
   - Slug is locked (`slugLocked: true`) after approval/publishing
   - Locked slugs cannot be changed (prevents SEO issues)

### Validation

- Slug must match regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Minimum length: 3 characters
- Maximum length: 100 characters

---

## Robots Meta Rules

### Robots Meta Tag Content

Based on indexing decision:

1. **Should Index**:
   - `content="index, follow"`
   - Allows search engines to index and follow links

2. **Should NOT Index**:
   - `content="noindex, nofollow"`
   - Prevents search engines from indexing and following links

### Additional Options

- `nosnippet`: Prevent showing snippets in search results
- `noarchive`: Prevent archiving the page
- `max-snippet`: Limit snippet length

---

## Content Quality Rules

### Duplicate Content Detection

- Uses Levenshtein distance algorithm
- Similarity threshold: 80%+
- Checks against other entities of same type
- Blocks indexing if duplicate AND thin content

### Thin Content Detection

**Clinic**:
- Missing `servicesName` or empty array
- Less than 2 treatments
- No photos

**Doctor**:
- No treatments
- Experience < 1 year
- No photos

**Job**:
- Description < 50 characters

**Blog**:
- Content < 100 characters
- Title < 10 characters

---

## Sitemap Rules

### Sitemap Generation

1. **Inclusion Criteria**:
   - Entity must be approved/published
   - Slug must exist and be locked
   - Entity should be indexed (`shouldIndex === true`)

2. **Sitemap Files**:
   - `clinics.xml`: All approved clinics with locked slugs
   - `doctors.xml`: All approved doctors with locked slugs
   - `jobs.xml`: All approved jobs with locked slugs
   - `blogs.xml`: All published blogs with locked slugs

3. **Sitemap Entry Format**:
   ```xml
   <url>
     <loc>https://zeva360.com/[path]</loc>
     <lastmod>YYYY-MM-DD</lastmod>
     <changefreq>weekly</changefreq>
     <priority>0.8</priority>
   </url>
   ```

4. **Sitemap Ping**:
   - Ping Google and Bing after sitemap update
   - Notify search engines of changes

---

## Best Practices

1. **Always generate and lock slugs** before publishing
2. **Complete all required fields** before approval
3. **Use descriptive titles and descriptions** for meta tags
4. **Ensure canonical URLs** point to slug-based URLs
5. **Monitor SEO health** using `/api/seo/health-check`
6. **Fix critical issues** before publishing
7. **Keep content unique** and avoid duplicates
8. **Add sufficient content** to avoid thin content warnings

---

## Error Handling

- All SEO operations should handle errors gracefully
- Non-fatal errors should be logged but not block publishing
- Critical errors (missing slug, duplicate canonical) should block indexing
- SEO health check API should return detailed error information

---

## Version History

- **v1.0** (2024): Initial SEO rules implementation
  - Indexing decision service
  - Meta tag generation
  - Canonical URL resolution
  - Slug generation and locking
  - Sitemap generation
  - SEO health checks
