# Bundle Offer Manual Selection Fix - User Click Takes Priority

## Problem

When multiple bundle offers are available (e.g., "Ani 262" and "Birthday-offer"), the **auto-matching logic** was selecting one bundle as `matchedBundleOffer`, but when the user **manually clicked** on a different bundle offer, the `matchedBundleOffer` state was **NOT being updated**.

### Example Scenario:

1. **Birthday-offer** (doctor-based) auto-matches first → `matchedBundleOffer = Birthday-offer`
2. User clicks on **Ani 262** (service-based) → Only `appliedOfferIds` is updated
3. **Result:** 
   - Ani 262 shows as "Applied" ✅
   - But `matchedBundleOffer` is still Birthday-offer ❌
   - Free session calculation uses Birthday-offer's logic ❌

## Root Cause

The offer button click handler (line ~4940) only updated:
- `appliedOfferIds` - which offers are applied
- But **NOT** `matchedBundleOffer` - which bundle's free sessions to use

The `matchedBundleOffer` was only set by the **auto-matching useEffect**, which ran based on internal logic, not user selection.

## Solution

When a user **manually clicks** on a bundle offer, we now:

### 1. **Setting the Bundle as Matched**
```typescript
if (offer.offerType === 'bundle') {
  console.log(`[BundleManual] User manually applied bundle "${offer.title}" - setting as matchedBundleOffer`);
  setMatchedBundleOffer(offer); // ✅ User's choice takes priority
}
```

### 2. **Recalculating Free Sessions**
We recalculate the free sessions for the **clicked bundle**:
- Match selected treatments to the bundle's `serviceIds` or `doctorIds`
- Sort eligible treatments by price (ascending)
- Select lowest-priced treatments as free sessions based on `freeQty`
- Update `bundleFreeSessions`, `bundleFreeSessionCount`, and `bundleFreeSessionMap`

### 3. **Clearing on Deselection**
When user removes a bundle offer:
```typescript
if (offer.offerType === 'bundle' && matchedBundleOffer?._id === offer._id) {
  setMatchedBundleOffer(null);
  setBundleFreeSessions([]);
  setBundleFreeSessionCount(0);
  setBundleFreeSessionMap(new Map());
}
```

## How It Works Now

### Scenario: User Selects Ayurveda + SKIN CARE

**Before Fix:**
1. Birthday-offer auto-matches → `matchedBundleOffer = Birthday-offer`
2. User clicks Ani 262 → `appliedOfferIds = ["...Ani262"]`
3. ❌ `matchedBundleOffer` still Birthday-offer
4. ❌ Free session calculation wrong

**After Fix:**
1. Birthday-offer auto-matches → `matchedBundleOffer = Birthday-offer`
2. User clicks Ani 262 → **TRIGGERS:**
   - ✅ `setMatchedBundleOffer(Ani262)`
   - ✅ Recalculates free sessions for Ani 262
   - ✅ `setBundleFreeSessions(["SKIN CARE"])`
   - ✅ `setBundleFreeSessionMap({"skin care": 1})`
3. ✅ Free session displays correctly!

## Console Logs Added

### When User Clicks on a Bundle:
```
[BundleManual] User manually applied bundle "Ani 262" - setting as matchedBundleOffer
[BundleManual] Calculated free sessions for "Ani 262": ["SKIN CARE"]
```

### When User Removes a Bundle:
```
[BundleManual] Removing bundle offer "Ani 262" - clearing matchedBundleOffer
```

## Key Features

1. **User Choice Priority:** Whichever bundle the user clicks is applied
2. **No Preference Logic:** No "service-based vs doctor-based" preference - pure user selection
3. **Accurate Recalculation:** Free sessions are recalculated for the clicked bundle
4. **Clean Removal:** Deselecting a bundle clears all related state
5. **Works for Both Types:** Handles both `serviceIds` and `doctorIds` based bundles

## Files Modified

- `ZEVA/components/AppointmentBillingModal.tsx`
  - Updated offer button click handler (line ~4940-5020)
  - Added manual bundle selection logic
  - Added free session recalculation on user click
  - Added cleanup on bundle removal

## Testing Checklist

- [ ] Select treatments matching multiple bundles
- [ ] Click on Ani 262 bundle
- [ ] Verify console shows: `[BundleManual] User manually applied bundle "Ani 262"`
- [ ] Verify console shows: `[BundleManual] Calculated free sessions for "Ani 262": [...]`
- [ ] Verify billing summary shows free session for Ani 262
- [ ] Click on different bundle (e.g., Birthday-offer)
- [ ] Verify the newly clicked bundle becomes active
- [ ] Remove bundle by clicking "Applied" button
- [ ] Verify bundle state is cleared

## Notes

- This fix ensures **user intent** is respected - whichever bundle they click is the one that gets applied
- The auto-matching useEffect still runs in the background, but manual clicks take priority
- Both service-based and doctor-based bundles work identically with this fix
