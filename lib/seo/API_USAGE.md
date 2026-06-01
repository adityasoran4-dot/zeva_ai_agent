# SEO API Usage Notes

## Overview

This document provides usage examples and notes for the SEO API endpoints and services.

## Table of Contents

1. [SEO Health Check API](#seo-health-check-api)
2. [SEO Services](#seo-services)
3. [Performance Hooks](#performance-hooks)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

---

## SEO Health Check API

### Endpoint

```
GET /api/seo/health-check
```

### Query Parameters

- `entityType` (required): `'clinic' | 'doctor' | 'job' | 'blog'`
- `entityId` (required for single check): Entity ID string
- `entityIds` (optional for batch check): Array of entity IDs

### Single Entity Check

```typescript
// Example: Check SEO health for a clinic
const response = await fetch('/api/seo/health-check?entityType=clinic&entityId=123456789');
const data = await response.json();

console.log(data.health.overallHealth); // 'healthy' | 'warning' | 'critical'
console.log(data.health.score); // 0-100
console.log(data.health.issues); // Array of SEO issues
console.log(data.health.recommendations); // Array of recommendations
```

### Batch Check

```typescript
// Example: Check SEO health for multiple clinics
const response = await fetch(
  '/api/seo/health-check?entityType=clinic&entityIds=123&entityIds=456&entityIds=789'
);
const data = await response.json();

console.log(data.results); // Array of health flags
console.log(data.count); // Number of results
```

### Response Format

```typescript
{
  success: true,
  health: {
    entityType: 'clinic',
    entityId: '123456789',
    overallHealth: 'healthy' | 'warning' | 'critical',
    score: 85,
    issues: [
      {
        type: 'missing_meta' | 'canonical_conflict' | 'indexing_violation' | ...,
        severity: 'critical' | 'warning' | 'info',
        message: 'Issue description',
        field: 'title',
        expected: 'Expected value',
        actual: 'Actual value',
        fix: 'How to fix'
      }
    ],
    recommendations: [
      'Fix missing meta title',
      'Resolve canonical URL conflict'
    ],
    lastChecked: '2024-01-01T00:00:00.000Z'
  }
}
```

### Caching

- Health check results are cached for 5 minutes
- Cache key includes entity type and ID
- Use `X-Cache: HIT` header to see if response was cached

---

## SEO Services

### Indexing Decision Service

```typescript
import { decideIndexing } from '@/lib/seo/IndexingService';

const decision = await decideIndexing('clinic', clinicId);

console.log(decision.shouldIndex); // true | false
console.log(decision.reason); // 'Profile complete and unique'
console.log(decision.priority); // 'high' | 'medium' | 'low'
console.log(decision.warnings); // Array of warnings
```

### Meta Tag Generation

```typescript
import { generateMeta } from '@/lib/seo/MetaService';
import { decideIndexing } from '@/lib/seo/IndexingService';

const decision = await decideIndexing('clinic', clinicId);
const meta = await generateMeta('clinic', clinic, decision);

console.log(meta.title); // 'Clinic Name in City'
console.log(meta.description); // 'Clinic description...'
console.log(meta.keywords); // ['keyword1', 'keyword2', ...]
```

### Canonical URL Resolution

```typescript
import { getCanonicalUrl } from '@/lib/seo/CanonicalService';

const canonicalUrl = getCanonicalUrl('clinic', clinic);
console.log(canonicalUrl); // 'https://zeva360.com/clinics/clinic-slug'
```

### SEO Pipeline

```typescript
import { runSEOPipeline } from '@/lib/seo/SEOOrchestrator';

const result = await runSEOPipeline('clinic', clinicId, clinic, user);

console.log(result.success); // true | false
console.log(result.indexing); // Indexing decision
console.log(result.robots); // Robots meta
console.log(result.meta); // Meta tags
console.log(result.canonical); // Canonical URL
console.log(result.sitemapUpdated); // true | false
```

---

## Performance Hooks

### Image Validation

```typescript
import { validateImageSize } from '@/lib/seo/PerformanceHooks';

const result = validateImageSize(
  'https://example.com/image.jpg',
  500, // maxSizeKB
  2000, // maxWidth
  2000, // maxHeight
  ['jpg', 'jpeg', 'png', 'webp'] // allowedFormats
);

console.log(result.valid); // true | false
console.log(result.errors); // Array of errors
console.log(result.warnings); // Array of warnings
```

### Pagination Validation

```typescript
import { validatePagination, getPaginationMeta } from '@/lib/seo/PerformanceHooks';

// In API route handler
const pagination = validatePagination(req, {
  maxLimit: 100,
  defaultLimit: 20
});

console.log(pagination.page); // Current page
console.log(pagination.limit); // Items per page

// After fetching data
const meta = getPaginationMeta(pagination.page, pagination.limit, totalItems);
console.log(meta.hasNext); // true | false
console.log(meta.hasPrev); // true | false
console.log(meta.totalPages); // Total number of pages
```

### API Caching

```typescript
import { getCachedData, setCachedData, invalidateCache } from '@/lib/seo/PerformanceHooks';

// Get cached data
const cached = getCachedData<MyDataType>('cache-key');
if (cached) {
  return cached;
}

// Set cache
setCachedData('cache-key', data, 300); // Cache for 5 minutes

// Invalidate cache
invalidateCache('cache-key');
```

### Cache Middleware

```typescript
import { withCache } from '@/lib/seo/PerformanceHooks';

export default withCache(async (req, res) => {
  // Your handler logic
  res.json({ data: '...' });
}, {
  key: 'my-api-cache',
  ttl: 300, // 5 minutes
  tags: ['tag1', 'tag2']
});
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/seo/PerformanceHooks';

const result = checkRateLimit(
  'user-ip-or-id',
  100, // maxRequests
  60000 // windowMs (1 minute)
);

if (!result.allowed) {
  return res.status(429).json({ message: 'Rate limit exceeded' });
}

res.setHeader('X-RateLimit-Remaining', result.remaining);
res.setHeader('X-RateLimit-Reset', result.resetTime);
```

---

## Error Handling

### SEO Health Check Errors

```typescript
try {
  const health = await checkSEOHealth('clinic', clinicId);
  // Handle health check results
} catch (error) {
  console.error('SEO health check failed:', error);
  // Health check returns critical status with error details
}
```

### SEO Pipeline Errors

```typescript
const result = await runSEOPipeline('clinic', clinicId);

if (!result.success) {
  console.error('SEO pipeline errors:', result.errors);
  // Handle errors - they are non-fatal
}
```

### Service Errors

All SEO services handle errors gracefully:
- Missing entities return appropriate error messages
- Invalid data returns validation errors
- Database errors are caught and logged

---

## Best Practices

### 1. Check SEO Health Before Publishing

```typescript
// Before publishing/approving an entity
const health = await checkSEOHealth('clinic', clinicId);

if (health.overallHealth === 'critical') {
  // Fix critical issues before publishing
  console.error('Critical SEO issues:', health.issues);
  return;
}

// Proceed with publishing
```

### 2. Run SEO Pipeline After Approval

```typescript
// After approving/publishing an entity
const seoResult = await runSEOPipeline('clinic', clinicId, clinic, user);

if (seoResult.success) {
  console.log('SEO setup completed successfully');
} else {
  console.warn('SEO setup completed with warnings:', seoResult.errors);
}
```

### 3. Use Caching for Expensive Operations

```typescript
// Cache SEO health checks
const cacheKey = `seo-health-${entityType}-${entityId}`;
let health = getCachedData<SEOHealthFlags>(cacheKey);

if (!health) {
  health = await checkSEOHealth(entityType, entityId);
  setCachedData(cacheKey, health, 300); // Cache for 5 minutes
}
```

### 4. Validate Images Before Upload

```typescript
// Before saving image URLs
const validation = validateImageSize(imageUrl, 500, 2000, 2000);

if (!validation.valid) {
  console.error('Image validation failed:', validation.errors);
  return;
}

if (validation.warnings.length > 0) {
  console.warn('Image validation warnings:', validation.warnings);
}
```

### 5. Implement Rate Limiting

```typescript
// In API routes
const rateLimit = checkRateLimit(req.headers['x-forwarded-for'] || 'unknown');

if (!rateLimit.allowed) {
  return res.status(429).json({
    message: 'Rate limit exceeded',
    resetTime: rateLimit.resetTime
  });
}
```

### 6. Monitor SEO Health Regularly

```typescript
// Scheduled job to check SEO health
async function checkAllEntities() {
  const clinics = await Clinic.find({ isApproved: true });
  
  for (const clinic of clinics) {
    const health = await checkSEOHealth('clinic', clinic._id);
    
    if (health.overallHealth === 'critical') {
      // Send alert or log critical issues
      console.error(`Critical SEO issues for clinic ${clinic._id}:`, health.issues);
    }
  }
}
```

---

## Performance Considerations

1. **Caching**: Use caching for expensive operations (health checks, meta generation)
2. **Batch Operations**: Use batch health checks for multiple entities
3. **Pagination**: Always paginate large result sets
4. **Rate Limiting**: Implement rate limiting for public APIs
5. **Image Optimization**: Validate and optimize images before storing

---

## Troubleshooting

### Health Check Returns Critical Status

1. Check entity exists and is valid
2. Verify slug is generated and locked
3. Check required fields are present
4. Review error messages in `issues` array

### SEO Pipeline Fails

1. Check entity data completeness
2. Verify database connection
3. Review error logs
4. Check service dependencies

### Cache Not Working

1. Verify cache key is correct
2. Check TTL is not expired
3. Ensure cache is not cleared prematurely
4. Check for memory limits (in-memory cache)

---

## Support

For issues or questions:
1. Check SEO health using `/api/seo/health-check`
2. Review error logs
3. Check SEO rules documentation
4. Contact development team
