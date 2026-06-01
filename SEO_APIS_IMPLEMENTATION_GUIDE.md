# SEO Control APIs - Complete Implementation Guide

## 📋 Overview

This guide explains each SEO API and how to implement them in your existing Next.js project structure. These APIs will centralize all SEO logic and ensure consistent, search-engine-friendly URLs and metadata.

---

## 🏗️ Project Structure Recommendation

Based on your existing API structure (`ZEVA/pages/api/`), create a new folder:

```
ZEVA/pages/api/seo/
├── slug/
│   ├── generate.js          # 1️⃣ Slug Generation API
│   └── validate.js           # 2️⃣ Slug Validation API
├── indexing/
│   └── decision.js           # 3️⃣ Indexing Decision API
├── meta/
│   ├── robots.js             # 4️⃣ Robots Meta API
│   ├── tags.js               # 5️⃣ Meta Tag Generator API
│   └── headings.js           # 6️⃣ H1/Heading Generator API
├── canonical/
│   └── resolve.js            # 7️⃣ Canonical Resolver API
├── duplicate/
│   └── detect.js             # 8️⃣ Duplicate Content Detector API
├── sitemap/
│   ├── generate.js           # 9️⃣ Sitemap Generator API
│   └── ping.js               # 🔟 Sitemap Ping API
├── rules/
│   ├── page-creation.js      # Page Creation Rule API
│   └── seo-lock.js           # SEO Lock API
└── utils/
    └── seo-helpers.js        # Shared SEO utility functions
```

---

## 📚 API Explanations & Implementation

### 1️⃣ Slug Generation API
**Purpose:** Create unique, clean, collision-proof URLs

**What it does:**
- Converts titles/names into URL-friendly slugs (e.g., "Best Dental Clinic" → "best-dental-clinic")
- Handles duplicates by appending numbers (e.g., "best-dental-clinic-2")
- Supports multiple languages
- Once published, slugs never change (SEO lock)

**When to use:**
- Creating new blogs, clinics, doctors, treatments, jobs
- Before publishing any content

**Implementation:**

```javascript
// ZEVA/pages/api/seo/slug/generate.js
import dbConnect from '../../../../lib/database';
import Blog from '../../../../models/Blog';
import Clinic from '../../../../models/Clinic';
import JobPosting from '../../../../models/JobPosting';
// ... other models

// Helper function to create slug from text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')        // Remove non-word chars
    .replace(/\-\-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-+/, '')              // Remove leading hyphens
    .replace(/-+$/, '');             // Remove trailing hyphens
}

// Check if slug exists in database
async function checkSlugExists(slug, contentType, excludeId = null) {
  let Model;
  let query = { slug };
  
  switch (contentType) {
    case 'blog':
      Model = Blog;
      query.status = 'published'; // Only check published blogs
      break;
    case 'clinic':
      Model = Clinic;
      break;
    case 'job':
      Model = JobPosting;
      query.status = 'active';
      break;
    // Add more content types as needed
    default:
      return false;
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const exists = await Model.findOne(query);
  return !!exists;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { text, contentType, existingId = null, language = 'en' } = req.body;

    if (!text || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'text and contentType are required'
      });
    }

    // Generate base slug
    let baseSlug = slugify(text);
    
    // Language prefix (optional, for future multi-language support)
    if (language !== 'en') {
      baseSlug = `${language}-${baseSlug}`;
    }

    // Check if slug exists
    let finalSlug = baseSlug;
    let counter = 1;
    
    while (await checkSlugExists(finalSlug, contentType, existingId)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return res.status(200).json({
      success: true,
      slug: finalSlug,
      original: text,
      contentType
    });

  } catch (error) {
    console.error('Slug generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
```

**Usage Example:**
```javascript
// Frontend call
const response = await fetch('/api/seo/slug/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Best Dental Clinic in Dubai',
    contentType: 'clinic'
  })
});
const { slug } = await response.json();
// Result: "best-dental-clinic-in-dubai"
```

---

### 2️⃣ Slug Validation API
**Purpose:** Validate slugs before publishing to prevent broken/duplicate URLs

**What it does:**
- Checks if slug is valid format
- Verifies no duplicates exist
- Ensures slug follows SEO best practices
- Returns suggestions if invalid

**Implementation:**

```javascript
// ZEVA/pages/api/seo/slug/validate.js
import dbConnect from '../../../../lib/database';
import Blog from '../../../../models/Blog';
import Clinic from '../../../../models/Clinic';
// ... other models

function isValidSlug(slug) {
  // Must be lowercase, alphanumeric with hyphens only
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}

async function checkSlugExists(slug, contentType, excludeId = null) {
  // Same logic as generate.js
  // ... (reuse from generate.js or create shared utility)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { slug, contentType, existingId = null } = req.body;

    if (!slug || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'slug and contentType are required'
      });
    }

    // Validate format
    if (!isValidSlug(slug)) {
      return res.status(200).json({
        success: true,
        valid: false,
        reason: 'Invalid format. Use lowercase letters, numbers, and hyphens only.',
        suggestions: [slugify(slug)] // Suggest corrected version
      });
    }

    // Check for duplicates
    const exists = await checkSlugExists(slug, contentType, existingId);
    
    if (exists) {
      return res.status(200).json({
        success: true,
        valid: false,
        reason: 'Slug already exists',
        exists: true
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      slug
    });

  } catch (error) {
    console.error('Slug validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 3️⃣ Indexing Decision API
**Purpose:** Central brain that decides if content should be indexed (index/noindex)

**What it checks:**
- Profile completeness (clinic has all required fields)
- Paid vs free accounts (free might be noindex)
- Duplicate content detection
- Thin content blocking (too little content)
- Draft/unpublished content

**Implementation:**

```javascript
// ZEVA/pages/api/seo/indexing/decision.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';
import User from '../../../../models/Users';

// Check if clinic profile is complete
async function isClinicComplete(clinicId) {
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return false;

  const requiredFields = [
    'name', 'address', 'location', 
    'treatments', 'timings', 'photos'
  ];

  return requiredFields.every(field => {
    const value = clinic[field];
    if (Array.isArray(value)) return value.length > 0;
    return value && value.toString().trim().length > 0;
  });
}

// Check if content is thin (too little content)
function isThinContent(content, minLength = 200) {
  if (!content) return true;
  // Remove HTML tags for length check
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  return textContent.length < minLength;
}

// Check if user has paid account
async function isPaidAccount(userId) {
  const user = await User.findById(userId).select('subscriptionType');
  // Adjust based on your subscription model
  return user?.subscriptionType === 'premium' || user?.subscriptionType === 'paid';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId, userId } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let shouldIndex = true;
    const reasons = [];

    switch (contentType) {
      case 'clinic':
        const clinic = await Clinic.findById(contentId);
        if (!clinic) {
          return res.status(404).json({ success: false, message: 'Clinic not found' });
        }

        // Check completeness
        if (!(await isClinicComplete(contentId))) {
          shouldIndex = false;
          reasons.push('Incomplete profile');
        }

        // Check if paid (optional - adjust based on your business logic)
        if (clinic.owner && !(await isPaidAccount(clinic.owner))) {
          // Free accounts might be noindex (adjust based on your needs)
          // shouldIndex = false;
          // reasons.push('Free account');
        }

        // Check if approved
        if (clinic.status !== 'approved') {
          shouldIndex = false;
          reasons.push('Not approved');
        }
        break;

      case 'blog':
        const blog = await Blog.findById(contentId);
        if (!blog) {
          return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        // Check if published
        if (blog.status !== 'published') {
          shouldIndex = false;
          reasons.push('Not published');
        }

        // Check for thin content
        if (isThinContent(blog.content)) {
          shouldIndex = false;
          reasons.push('Thin content');
        }
        break;

      case 'job':
        // Similar logic for jobs
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported contentType'
        });
    }

    return res.status(200).json({
      success: true,
      shouldIndex,
      index: shouldIndex ? 'index' : 'noindex',
      reasons: reasons.length > 0 ? reasons : ['All checks passed']
    });

  } catch (error) {
    console.error('Indexing decision error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 4️⃣ Robots Meta API
**Purpose:** Generate consistent meta robots tags

**What it does:**
- Returns robots meta tag based on indexing decision
- Handles follow/nofollow, index/noindex
- Consistent across all pages

**Implementation:**

```javascript
// ZEVA/pages/api/seo/meta/robots.js
import dbConnect from '../../../../lib/database';
// Import indexing decision logic

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    // Get indexing decision (reuse logic from indexing/decision.js)
    const indexingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/seo/indexing/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, contentId })
    });
    
    const { shouldIndex } = await indexingResponse.json();

    // Build robots meta tag
    const robots = shouldIndex ? 'index, follow' : 'noindex, nofollow';

    return res.status(200).json({
      success: true,
      robots,
      metaTag: `<meta name="robots" content="${robots}" />`
    });

  } catch (error) {
    console.error('Robots meta error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 5️⃣ Meta Tag Generator API
**Purpose:** Generate dynamic, SEO-optimized titles and descriptions

**What it does:**
- Creates title tags (max 60 chars)
- Creates meta descriptions (max 160 chars)
- Uses templates for consistency
- Prevents over-optimization
- Keyword-safe

**Implementation:**

```javascript
// ZEVA/pages/api/seo/meta/tags.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';
import JobPosting from '../../../../models/JobPosting';

function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength 
    ? text.substring(0, maxLength - 3) + '...' 
    : text;
}

function generateTitle(contentType, data) {
  const templates = {
    clinic: `${data.name} - ${data.city || 'Clinic'} | ZEVA`,
    blog: `${data.title} | ZEVA Blog`,
    job: `${data.title} - ${data.location || ''} | Careers at ZEVA`,
    doctor: `Dr. ${data.name} - ${data.specialization || 'Doctor'} | ZEVA`
  };

  const title = templates[contentType] || data.title || 'ZEVA';
  return truncate(title, 60);
}

function generateDescription(contentType, data) {
  let description = '';

  switch (contentType) {
    case 'clinic':
      description = `${data.name} offers ${data.treatments?.slice(0, 3).join(', ') || 'healthcare services'} in ${data.city || data.address || ''}. Book your appointment today.`;
      break;
    case 'blog':
      // Extract first 160 chars from content (strip HTML)
      const textContent = (data.content || '').replace(/<[^>]*>/g, '').trim();
      description = textContent || data.title || 'Read more on ZEVA blog.';
      break;
    case 'job':
      description = `Apply for ${data.title} position${data.location ? ` in ${data.location}` : ''}. ${data.description || 'Join our team!'}`;
      break;
    default:
      description = data.description || 'ZEVA - Your health partner';
  }

  return truncate(description, 160);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let data;
    switch (contentType) {
      case 'clinic':
        data = await Clinic.findById(contentId);
        break;
      case 'blog':
        data = await Blog.findById(contentId);
        break;
      case 'job':
        data = await JobPosting.findById(contentId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported contentType'
        });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const title = generateTitle(contentType, data);
    const description = generateDescription(contentType, data);

    return res.status(200).json({
      success: true,
      title,
      description,
      metaTags: {
        title: `<title>${title}</title>`,
        description: `<meta name="description" content="${description}" />`,
        ogTitle: `<meta property="og:title" content="${title}" />`,
        ogDescription: `<meta property="og:description" content="${description}" />`
      }
    });

  } catch (error) {
    console.error('Meta tags error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 6️⃣ H1/Heading Generator API
**Purpose:** Prevent duplicate H1s and structure headings properly

**What it does:**
- Returns structured H1/H2 plan
- Ensures only one H1 per page
- Provides heading hierarchy

**Implementation:**

```javascript
// ZEVA/pages/api/seo/meta/headings.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';

function generateHeadings(contentType, data) {
  const headings = {
    h1: '',
    h2: []
  };

  switch (contentType) {
    case 'clinic':
      headings.h1 = data.name || 'Clinic';
      headings.h2 = [
        'About Us',
        'Services & Treatments',
        'Location & Contact'
      ];
      break;
    case 'blog':
      headings.h1 = data.title || 'Blog Post';
      // Extract H2s from content if available
      const h2Matches = (data.content || '').match(/<h2[^>]*>(.*?)<\/h2>/gi);
      if (h2Matches) {
        headings.h2 = h2Matches.map(h2 => 
          h2.replace(/<[^>]*>/g, '').trim()
        );
      }
      break;
    default:
      headings.h1 = data.title || data.name || 'Page';
  }

  return headings;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let data;
    switch (contentType) {
      case 'clinic':
        data = await Clinic.findById(contentId);
        break;
      case 'blog':
        data = await Blog.findById(contentId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported contentType'
        });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const headings = generateHeadings(contentType, data);

    return res.status(200).json({
      success: true,
      headings,
      html: {
        h1: `<h1>${headings.h1}</h1>`,
        h2: headings.h2.map(h2 => `<h2>${h2}</h2>`)
      }
    });

  } catch (error) {
    console.error('Headings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 7️⃣ Canonical Resolver API
**Purpose:** Resolve canonical URLs to prevent duplicate content issues

**What it does:**
- Returns canonical URL for any page
- Handles multiple URLs pointing to same content
- Prevents SEO dilution

**Implementation:**

```javascript
// ZEVA/pages/api/seo/canonical/resolve.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';

function getCanonicalUrl(contentType, contentId, slug) {
  const paths = {
    clinic: `/clinics/${slug}`,
    blog: `/blogs/${slug}`,
    job: `/job-details/${slug}`,
    doctor: `/doctors/${slug}`
  };

  const path = paths[contentType] || `/${contentType}/${slug}`;
  return `${BASE_URL}${path}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId, slug } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    // If slug not provided, fetch from database
    let finalSlug = slug;
    if (!finalSlug) {
      let data;
      switch (contentType) {
        case 'clinic':
          data = await Clinic.findById(contentId).select('slug');
          finalSlug = data?.slug;
          break;
        case 'blog':
          data = await Blog.findById(contentId).select('paramlink');
          finalSlug = data?.paramlink;
          break;
      }
    }

    if (!finalSlug) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or slug missing'
      });
    }

    const canonicalUrl = getCanonicalUrl(contentType, contentId, finalSlug);

    return res.status(200).json({
      success: true,
      canonicalUrl,
      metaTag: `<link rel="canonical" href="${canonicalUrl}" />`
    });

  } catch (error) {
    console.error('Canonical resolve error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 8️⃣ Duplicate Content Detector API
**Purpose:** Detect duplicate content to prevent SEO dilution

**What it checks:**
- Similar content (text similarity)
- Same clinic with multiple URLs
- Area/city duplication

**Implementation:**

```javascript
// ZEVA/pages/api/seo/duplicate/detect.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';
import stringSimilarity from 'string-similarity'; // npm install string-similarity

// Calculate text similarity (0-1, where 1 is identical)
function calculateSimilarity(text1, text2) {
  // Remove HTML and normalize
  const clean1 = (text1 || '').replace(/<[^>]*>/g, '').trim().toLowerCase();
  const clean2 = (text2 || '').replace(/<[^>]*>/g, '').trim().toLowerCase();
  
  if (!clean1 || !clean2) return 0;
  
  return stringSimilarity.compareTwoStrings(clean1, clean2);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId, threshold = 0.8 } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let currentContent;
    let Model;
    let contentField;

    switch (contentType) {
      case 'blog':
        Model = Blog;
        contentField = 'content';
        currentContent = await Blog.findById(contentId);
        break;
      case 'clinic':
        Model = Clinic;
        contentField = 'description'; // Adjust based on your model
        currentContent = await Clinic.findById(contentId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported contentType'
        });
    }

    if (!currentContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const currentText = currentContent[contentField] || '';
    const duplicates = [];

    // Check for similar content
    const allContent = await Model.find({
      _id: { $ne: contentId },
      status: contentType === 'blog' ? 'published' : { $exists: true }
    }).select(`${contentField} name title slug`);

    for (const item of allContent) {
      const similarity = calculateSimilarity(currentText, item[contentField] || '');
      
      if (similarity >= threshold) {
        duplicates.push({
          id: item._id,
          title: item.title || item.name,
          slug: item.slug || item.paramlink,
          similarity: Math.round(similarity * 100),
          type: 'content_similarity'
        });
      }
    }

    // For clinics: Check for same clinic with multiple URLs
    if (contentType === 'clinic') {
      const sameNameClinics = await Clinic.find({
        _id: { $ne: contentId },
        name: currentContent.name,
        address: currentContent.address
      }).select('slug');

      if (sameNameClinics.length > 0) {
        duplicates.push({
          type: 'same_clinic_multiple_urls',
          count: sameNameClinics.length,
          slugs: sameNameClinics.map(c => c.slug)
        });
      }
    }

    return res.status(200).json({
      success: true,
      hasDuplicates: duplicates.length > 0,
      duplicates,
      count: duplicates.length
    });

  } catch (error) {
    console.error('Duplicate detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### 9️⃣ Sitemap Generator API
**Purpose:** Auto-generate and update sitemaps

**What it does:**
- Generates sitemaps for: clinics, doctors, treatments, blogs, jobs
- Includes only indexable pages (uses Indexing Decision API)
- Auto-refreshes daily (via cron)

**Implementation:**

```javascript
// ZEVA/pages/api/seo/sitemap/generate.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';
import JobPosting from '../../../../models/JobPosting';
import Doctor from '../../../../models/Doctor'; // Adjust based on your model

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';

async function shouldIndex(contentType, contentId) {
  // Call indexing decision API internally
  // Or reuse the logic directly
  // For simplicity, here's a basic check:
  return true; // Implement full logic from indexing/decision.js
}

function generateSitemapEntry(url, lastmod, changefreq = 'weekly', priority = 0.7) {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { type = 'all' } = req.query; // 'clinics', 'blogs', 'jobs', 'all'

    const urls = [];

    // Generate clinics sitemap
    if (type === 'all' || type === 'clinics') {
      const clinics = await Clinic.find({ status: 'approved' }).select('slug updatedAt');
      
      for (const clinic of clinics) {
        if (await shouldIndex('clinic', clinic._id)) {
          urls.push(generateSitemapEntry(
            `${BASE_URL}/clinics/${clinic.slug}`,
            clinic.updatedAt.toISOString().split('T')[0],
            'monthly',
            0.8
          ));
        }
      }
    }

    // Generate blogs sitemap
    if (type === 'all' || type === 'blogs') {
      const blogs = await Blog.find({ status: 'published' }).select('paramlink updatedAt');
      
      for (const blog of blogs) {
        if (await shouldIndex('blog', blog._id)) {
          urls.push(generateSitemapEntry(
            `${BASE_URL}/blogs/${blog.paramlink}`,
            blog.updatedAt.toISOString().split('T')[0],
            'weekly',
            0.7
          ));
        }
      }
    }

    // Generate jobs sitemap
    if (type === 'all' || type === 'jobs') {
      const jobs = await JobPosting.find({ status: 'active' }).select('slug updatedAt');
      
      for (const job of jobs) {
        if (await shouldIndex('job', job._id)) {
          urls.push(generateSitemapEntry(
            `${BASE_URL}/job-details/${job.slug}`,
            job.updatedAt.toISOString().split('T')[0],
            'weekly',
            0.6
          ));
        }
      }
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    // Set proper content type
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(sitemap);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

**Setup Cron Job (Optional):**
```javascript
// ZEVA/pages/api/cron/generate-sitemap.js
// This can be called daily via Vercel Cron or external service
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Trigger sitemap generation
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seo/sitemap/generate?type=all`);
  
  return res.status(200).json({ success: true, message: 'Sitemap generated' });
}
```

---

### 🔟 Sitemap Ping API
**Purpose:** Notify Google/Bing when sitemap updates

**What it does:**
- Pings search engines after new content is published
- Triggers after: new clinic, new blog, major update

**Implementation:**

```javascript
// ZEVA/pages/api/seo/sitemap/ping.js
const GOOGLE_PING_URL = 'https://www.google.com/ping?sitemap=';
const BING_PING_URL = 'https://www.bing.com/ping?sitemap=';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { sitemapUrl } = req.body;

    if (!sitemapUrl) {
      return res.status(400).json({
        success: false,
        message: 'sitemapUrl is required'
      });
    }

    const results = [];

    // Ping Google
    try {
      const googleResponse = await fetch(`${GOOGLE_PING_URL}${encodeURIComponent(sitemapUrl)}`);
      results.push({
        engine: 'Google',
        success: googleResponse.ok,
        status: googleResponse.status
      });
    } catch (error) {
      results.push({
        engine: 'Google',
        success: false,
        error: error.message
      });
    }

    // Ping Bing
    try {
      const bingResponse = await fetch(`${BING_PING_URL}${encodeURIComponent(sitemapUrl)}`);
      results.push({
        engine: 'Bing',
        success: bingResponse.ok,
        status: bingResponse.status
      });
    } catch (error) {
      results.push({
        engine: 'Bing',
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Sitemap ping error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

**Usage:** Call this after publishing content:
```javascript
// After creating/publishing content
await fetch('/api/seo/sitemap/ping', {
  method: 'POST',
  body: JSON.stringify({
    sitemapUrl: 'https://zeva360.com/sitemap.xml'
  })
});
```

---

### Page Creation Rule API
**Purpose:** Decide if a page should exist

**What it checks:**
- Is content complete enough?
- Does it meet quality standards?
- Should it be accessible publicly?

**Implementation:**

```javascript
// ZEVA/pages/api/seo/rules/page-creation.js
import dbConnect from '../../../../lib/database';
import Clinic from '../../../../models/Clinic';
import Blog from '../../../../models/Blog';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let shouldCreate = true;
    const reasons = [];

    switch (contentType) {
      case 'clinic':
        const clinic = await Clinic.findById(contentId);
        if (!clinic) {
          return res.status(404).json({ success: false, message: 'Clinic not found' });
        }

        if (clinic.status !== 'approved') {
          shouldCreate = false;
          reasons.push('Clinic not approved');
        }

        if (!clinic.slug) {
          shouldCreate = false;
          reasons.push('Missing slug');
        }
        break;

      case 'blog':
        const blog = await Blog.findById(contentId);
        if (!blog) {
          return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (blog.status !== 'published') {
          shouldCreate = false;
          reasons.push('Blog not published');
        }

        if (!blog.paramlink) {
          shouldCreate = false;
          reasons.push('Missing slug');
        }
        break;
    }

    return res.status(200).json({
      success: true,
      shouldCreate,
      reasons: reasons.length > 0 ? reasons : ['All checks passed']
    });

  } catch (error) {
    console.error('Page creation rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

### SEO Lock API
**Purpose:** Freeze URLs once live (prevent changes)

**What it does:**
- Locks slug once content is published
- Prevents accidental URL changes
- Maintains SEO value

**Implementation:**

```javascript
// ZEVA/pages/api/seo/rules/seo-lock.js
import dbConnect from '../../../../lib/database';
import Blog from '../../../../models/Blog';
import Clinic from '../../../../models/Clinic';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { contentType, contentId, newSlug } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentType and contentId are required'
      });
    }

    let isLocked = false;
    let currentSlug = '';

    switch (contentType) {
      case 'blog':
        const blog = await Blog.findById(contentId);
        if (!blog) {
          return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        currentSlug = blog.paramlink;
        
        // Lock if published
        if (blog.status === 'published') {
          isLocked = true;
          
          // Check if trying to change slug
          if (newSlug && newSlug !== currentSlug) {
            return res.status(403).json({
              success: false,
              locked: true,
              message: 'Cannot change slug of published blog. URL is locked for SEO.',
              currentSlug
            });
          }
        }
        break;

      case 'clinic':
        const clinic = await Clinic.findById(contentId);
        if (!clinic) {
          return res.status(404).json({ success: false, message: 'Clinic not found' });
        }

        currentSlug = clinic.slug;
        
        // Lock if approved and has been live for X days (optional)
        if (clinic.status === 'approved' && clinic.slug) {
          isLocked = true;
          
          if (newSlug && newSlug !== currentSlug) {
            return res.status(403).json({
              success: false,
              locked: true,
              message: 'Cannot change slug of approved clinic. URL is locked for SEO.',
              currentSlug
            });
          }
        }
        break;
    }

    return res.status(200).json({
      success: true,
      locked: isLocked,
      currentSlug,
      message: isLocked 
        ? 'URL is locked and cannot be changed' 
        : 'URL can be changed'
    });

  } catch (error) {
    console.error('SEO lock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

---

## 🔧 Integration Steps

### Step 1: Create Shared Utilities
Create `ZEVA/pages/api/seo/utils/seo-helpers.js` with reusable functions:

```javascript
// Shared SEO helper functions
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength 
    ? text.substring(0, maxLength - 3) + '...' 
    : text;
}

// ... other shared utilities
```

### Step 2: Update Models
Add `slug` field to your models if not already present:

```javascript
// Example: Update Blog model
const BlogSchema = new mongoose.Schema({
  // ... existing fields
  slug: { 
    type: String, 
    unique: true, 
    sparse: true, // Only unique when exists
    index: true 
  },
  seoLocked: { type: Boolean, default: false }, // Lock slug once published
  // ... rest of schema
});
```

### Step 3: Integrate in Content Creation
Update your content creation APIs to use SEO APIs:

```javascript
// Example: Update blog creation API
// In ZEVA/pages/api/blog/create.js

// Before creating blog:
// 1. Generate slug
const slugRes = await fetch('/api/seo/slug/generate', {
  method: 'POST',
  body: JSON.stringify({
    text: title,
    contentType: 'blog'
  })
});
const { slug } = await slugRes.json();

// 2. Validate slug
const validateRes = await fetch('/api/seo/slug/validate', {
  method: 'POST',
  body: JSON.stringify({
    slug,
    contentType: 'blog'
  })
});

// 3. Create blog with slug
const blog = await Blog.create({
  title,
  content,
  paramlink: slug, // or slug field
  // ... rest
});
```

### Step 4: Add to Frontend Pages
Use SEO APIs in your page components:

```javascript
// Example: In a clinic page
export async function getServerSideProps({ params }) {
  const { slug } = params;
  
  // Fetch clinic
  const clinic = await Clinic.findOne({ slug });
  
  // Get SEO data
  const [metaRes, canonicalRes, robotsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seo/meta/tags?contentType=clinic&contentId=${clinic._id}`),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seo/canonical/resolve?contentType=clinic&contentId=${clinic._id}&slug=${slug}`),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seo/meta/robots?contentType=clinic&contentId=${clinic._id}`)
  ]);
  
  const meta = await metaRes.json();
  const canonical = await canonicalRes.json();
  const robots = await robotsRes.json();
  
  return {
    props: {
      clinic,
      seo: {
        title: meta.title,
        description: meta.description,
        canonical: canonical.canonicalUrl,
        robots: robots.robots
      }
    }
  };
}
```

---

## 📦 Required NPM Packages

```bash
npm install string-similarity
```

---

## 🎯 Best Practices

1. **Always generate slugs before publishing**
2. **Validate slugs before saving**
3. **Lock slugs once published** (SEO Lock API)
4. **Use canonical URLs** on all pages
5. **Check indexing decision** before including in sitemap
6. **Ping search engines** after major updates
7. **Run duplicate detection** periodically
8. **Regenerate sitemaps** daily via cron

---

## 🔄 Workflow Example

**Creating a new blog:**
1. User enters title → Frontend calls `/api/seo/slug/generate`
2. Frontend validates slug → `/api/seo/slug/validate`
3. User saves as draft → Blog created with slug
4. User publishes → Check `/api/seo/indexing/decision`
5. If indexable → Add to sitemap, ping search engines
6. Slug is now locked → `/api/seo/rules/seo-lock` prevents changes

---

## 📝 Notes

- Adjust model names and fields based on your actual schema
- Add authentication/authorization as needed (similar to your existing APIs)
- Consider caching SEO data for performance
- Monitor duplicate content regularly
- Keep sitemaps updated automatically

---

This guide provides the foundation for implementing all SEO control APIs in your project. Adapt the code to match your exact database models and business logic.


