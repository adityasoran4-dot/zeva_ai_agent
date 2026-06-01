# SEO System Documentation

## Overview

A comprehensive, entity-agnostic SEO system that automatically handles indexing decisions, meta tags, canonical URLs, sitemaps, and search engine notifications.

## Architecture

### Flow Diagram

```
Admin approves clinic/doctor
        ↓
SlugService.generateAndLockSlug
        ↓
SEOOrchestrator.runSEOPipeline
        ↓
├── IndexingService.decide
├── RobotsService.getRobotsMeta
├── MetaService.generate
├── CanonicalService.resolve
├── DuplicateService.checkDuplicates
├── SitemapService.update
└── SitemapPingService.ping
```

## Services

### 1. IndexingService.ts
**Purpose**: Central brain for index/noindex logic

**Rules**:
- Profile completeness check
- Approval status verification
- Slug existence and lock status
- Duplicate detection
- Thin content blocking

**Output**: `IndexingDecision` with `shouldIndex`, `reason`, `priority`, and `warnings`

### 2. RobotsService.ts
**Purpose**: Consistent meta robots tags

**Logic**:
- `shouldIndex: false` → `noindex, nofollow`
- `priority: high` → `index, follow`
- `priority: medium` → `index, nofollow` (if warnings exist)
- `priority: low` → `noindex, nofollow`

### 3. MetaService.ts
**Purpose**: Dynamic, SEO-optimized titles/descriptions

**Features**:
- Template-driven generation
- Keyword-safe (no over-optimization)
- Title max 60 chars
- Description max 160 chars
- Automatic keyword extraction

### 4. HeadingService.ts
**Purpose**: Prevent duplicate H1s

**Output**: Structured heading plan with H1, H2, and H3 tags

### 5. CanonicalService.ts
**Purpose**: Kill duplicate URLs

**Logic**:
- Prefers slug-based URLs when available
- Falls back to ObjectId URLs
- Ensures canonical URLs point to locked slugs

### 6. DuplicateService.ts
**Purpose**: Prevent SEO dilution

**Checks**:
- Similar content (Levenshtein distance)
- Same clinic/doctor multiple URLs
- Area/city duplication

**Output**: `DuplicateCheck` with confidence level and similar entities

### 7. SitemapService.ts
**Purpose**: Auto-update sitemaps

**Features**:
- Includes only indexable pages
- Auto-refresh on entity approval
- Separate sitemaps for clinics and doctors
- Main sitemap index

**Files Generated**:
- `public/sitemap-clinics.xml`
- `public/sitemap-doctors.xml`
- `public/sitemap.xml`

### 8. SitemapPingService.ts
**Purpose**: Notify Google/Bing of sitemap updates

**Services**:
- Google Ping: `https://www.google.com/ping?sitemap=`
- Bing Ping: `https://www.bing.com/ping?sitemap=`

### 9. SEOOrchestrator.ts
**Purpose**: Orchestrate all SEO services in sequence

**Functions**:
- `runSEOPipeline()`: Full SEO pipeline
- `quickSEOCheck()`: Lightweight check (no sitemap/ping)

## Integration

### Clinic Approval Flow

**File**: `pages/api/admin/update-approve.js`

```javascript
// After slug generation
const seoResult = await runSEOPipeline('clinic', clinicId.toString(), finalClinic);
```

### Doctor Approval Flow

**File**: `pages/api/admin/action.js`

```javascript
// After slug generation
const seoResult = await runSEOPipeline('doctor', doctorProfile._id.toString(), refreshedProfile, updatedUser);
```

## Usage Examples

### Check Indexing Status

```typescript
import { decideIndexing } from '@/lib/seo/IndexingService';

const decision = await decideIndexing('clinic', clinicId);
console.log(decision.shouldIndex); // true/false
console.log(decision.reason); // "Profile complete and unique"
```

### Generate Meta Tags

```typescript
import { generateMeta } from '@/lib/seo/MetaService';
import { decideIndexing } from '@/lib/seo/IndexingService';

const decision = await decideIndexing('clinic', clinicId);
const meta = await generateMeta('clinic', clinic, decision);
console.log(meta.title); // "Clinic Name in City"
console.log(meta.description); // "Clinic Name offers..."
```

### Get Canonical URL

```typescript
import { getCanonicalUrl } from '@/lib/seo/CanonicalService';

const canonicalUrl = getCanonicalUrl('clinic', clinic);
console.log(canonicalUrl); // "https://zeva360.com/clinics/clinic-slug"
```

### Check for Duplicates

```typescript
import { checkDuplicates } from '@/lib/seo/DuplicateService';

const duplicateCheck = await checkDuplicates('clinic', clinic);
if (duplicateCheck.isDuplicate) {
  console.log(`Duplicate detected: ${duplicateCheck.reason}`);
}
```

### Update Sitemaps

```typescript
import { updateSitemaps } from '@/lib/seo/SitemapService';

const result = await updateSitemaps();
console.log(result.success); // true
console.log(result.files); // ["sitemap-clinics.xml", "sitemap-doctors.xml", "sitemap.xml"]
```

### Ping Search Engines

```typescript
import { pingAll } from '@/lib/seo/SitemapPingService';

const results = await pingAll();
results.forEach(result => {
  console.log(`${result.service}: ${result.success ? 'Success' : 'Failed'}`);
});
```

## Testing

### Test Clinic Approval

1. Register a clinic through `/clinic/register-clinic`
2. Approve through `/admin/AdminClinicApproval`
3. Check terminal logs for SEO pipeline execution
4. Verify sitemap files in `public/` directory
5. Check database for slug and slugLocked fields

### Test Doctor Approval

1. Register a doctor through `/doctor/doctor-register`
2. Approve through `/admin/approve-doctors`
3. Check terminal logs for SEO pipeline execution
4. Verify sitemap files updated
5. Check database for slug and slugLocked fields

### Manual Sitemap Update

```bash
# Run via API or script
node -e "
const { updateSitemaps } = require('./lib/seo/SitemapService');
updateSitemaps().then(result => console.log(result));
"
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_BASE_URL=https://zeva360.com
```

### Sitemap Settings

- **Location**: `public/sitemap*.xml`
- **Update Frequency**: On entity approval
- **Ping Frequency**: After sitemap update

## Error Handling

All SEO services are **non-fatal** - errors are logged but don't block the approval process:

```javascript
try {
  const seoResult = await runSEOPipeline('clinic', clinicId);
} catch (error) {
  // Logged but doesn't block approval
  console.error("SEO pipeline error (non-fatal):", error.message);
}
```

## Performance Considerations

- **Sitemap Generation**: Runs asynchronously
- **Search Engine Pings**: Non-blocking (fire and forget)
- **Duplicate Checks**: Limited to 10 results
- **Indexing Decisions**: Cached per entity

## Future Enhancements

- [ ] Cache indexing decisions
- [ ] Batch sitemap updates
- [ ] Scheduled sitemap refresh (daily cron)
- [ ] SEO analytics tracking
- [ ] Custom meta tag templates per entity type

