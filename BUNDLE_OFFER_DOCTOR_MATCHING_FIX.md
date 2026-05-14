# Bundle Offer Doctor ID Matching & Immediate Free Session Fix

## Issue Description
Bundle offers configured with `doctorIds` (e.g., "Birthday-offer" for Dr. Disha) had two problems:

### Problem 1: Doctor ID Matching Not Working
Bundle offers were not being applied when treatments were selected for appointments with the matching doctor, even though the appointment doctor matched the offer's doctor IDs.

**Offer Configuration:**
- **Offer Type**: `bundle`
- **Doctor IDs**: `["691ea8fc93a5402fa4dd4d74"]` (Dr. Disha)
- **Buy Qty**: 2
- **Free Qty**: 1
- **Service IDs**: `[]` (empty - no specific services)

### Problem 2: Free Session Not Showing in Current Billing
Even when the bundle offer was applied, the free session was not showing with price ₹0.00 in the current billing. The treatment list showed the free session at ₹0.00, but the Billing Summary didn't reflect the immediate discount.

## Root Cause

### Root Cause 1: Missing Doctor ID Check
The bundle matching logic in `AppointmentBillingModal.tsx` (lines 1766-1810) only checked for:
1. **serviceIds match** - If offer has specific services
2. **applyOnAllServices flag** - If offer applies to all services

It **did NOT check for `doctorIds` match**, which is why doctor-specific bundle offers were not being applied.

### Root Cause 2: Free Sessions Only from Previous Billings
The treatment selection logic only checked `availableFreeSessions` (from previous billings) to determine if a treatment should be priced at ₹0.00. It did NOT check `bundleFreeSessions` from the **current matched bundle offer**, so free sessions earned in the current billing were not getting the price set to 0 immediately.

## Solution Implemented

### Fix 1: Doctor ID Matching (Priority-Based Bundle Matching)
Added **Priority 1** check for doctor ID matching in the bundle offer matching logic:

#### Logic Flow (NEW):
1. **PRIORITY 1 - Doctor Match** (NEW):
   - Check if offer has `doctorIds` array
   - Check if appointment's `doctorId` matches any ID in the offer's `doctorIds`
   - If matched: **ALL paid treatments become eligible** for the bundle
   - This allows any service selected for that doctor to qualify for the bundle

2. **PRIORITY 2 - Service Match** (existing, only if doctor match didn't apply):
   - Check if offer has `serviceIds` array
   - Check if any selected treatments match the offer's services
   - If matched: Only matching treatments become eligible

3. **PRIORITY 3 - All Services** (existing, only if no doctor/service match):
   - Check if `applyOnAllServices` flag is true
   - If true: ALL paid treatments become eligible

### Fix 2: Immediate Free Session Price Adjustment
Updated treatment selection logic to check BOTH:
1. `availableFreeSessions` - Free sessions from **previous** billings
2. `bundleFreeSessions` - Free sessions from **current** matched bundle offer

If a treatment matches either, its price is immediately set to ₹0.00 in the current billing.

#### Code Changes
**File**: `ZEVA/components/AppointmentBillingModal.tsx`

**Location 1**: Lines 1766-1826 (bundle matching useEffect)

**Changes**:
- Added doctor ID matching logic before service ID checking
- Updated conditional checks to prevent duplicate matching
- Enhanced console logging to show match type (DOCTOR/SERVICE/ALL_SERVICES)

**Location 2**: Lines 2961-2985 (handleTreatmentToggle function)

**Changes**:
- Added check for `bundleFreeSessions` from current matched bundle
- Treatment price set to 0 if it matches current bundle's free sessions
- Updated to check both previous and current free sessions

**Location 3**: Lines 3909-3930 (filteredTreatments logic)

**Changes**:
- Added check for current bundle free sessions when filtering treatments
- Ensures free sessions from current bundle are shown even if already billed

### Key Implementation Details:
```typescript
// PRIORITY 1: Check if offer is for specific doctor(s)
if (offer.doctorIds && Array.isArray(offer.doctorIds) && offer.doctorIds.length > 0 && appointment?.doctorId) {
  const appointmentDoctorId = String(appointment.doctorId);
  const isDoctorMatched = offer.doctorIds.some(docId => String(docId) === appointmentDoctorId);
  
  if (isDoctorMatched) {
    console.log(`[BundleMatching] Bundle "${offer.title}" matched by DOCTOR: ${appointment.doctorName} (${appointmentDoctorId})`);
    hasBundleServicesSelected = true;
    // All paid treatments are eligible for this doctor-specific bundle
    eligibleTreatments.push(...paidTreatments.flatMap(t => Array(t.quantity).fill(t)));
  }
}
```

## Expected Behavior After Fix

### Scenario 1: Doctor-Specific Bundle (Birthday-offer for Dr. Disha)
- **Offer Config**: `doctorIds: ["691ea8fc..."]`, `buyQty: 2`, `freeQty: 1`, `serviceIds: []`
- **Appointment**: Doctor = Dr. Disha
- **Selected Treatments**: Shirodhara (₹584) + Nasya (584)
- **Result**: 
  - ✅ Bundle "Birthday-offer" automatically applies
  - ✅ Nasya (lowest-priced) shows as FREE (₹0.00) immediately
  - ✅ Billing Summary shows "Bundle Offer Applied" with free session details
  - ✅ Total amount = ₹584.00 (only Shirodhara charged)
  - ✅ Free session stored in `offerFreeSession` for future tracking

### Scenario 2: Service-Specific Bundle (Existing behavior preserved)
- **Offer Config**: `doctorIds: []`, `serviceIds: ["nasya", "oxygen"]`, `buyQty: 2`, `freeQty: 1`
- **Appointment**: Any doctor
- **Selected Treatments**: Nasya + OXYGENeo
- **Result**: ✅ Bundle applies (existing behavior unchanged)

### Scenario 3: All Services Bundle (Existing behavior preserved)
- **Offer Config**: `doctorIds: []`, `serviceIds: []`, `applyOnAllServices: true`, `buyQty: 2`, `freeQty: 1`
- **Appointment**: Any doctor
- **Selected Treatments**: Any 2+ treatments
- **Result**: ✅ Bundle applies (existing behavior unchanged)

## Testing Checklist
- [ ] Open billing modal for appointment with Dr. Disha
- [ ] Select 2+ treatments (e.g., Shirodhara + Nasya)
- [ ] Verify "Birthday-offer" bundle appears in Payment Details section
- [ ] Verify "Applied" badge shows on the bundle offer
- [ ] Verify Nasya shows price as ₹0.00 in treatment list
- [ ] Verify billing summary shows "Bundle Offer Applied" green box
- [ ] Verify billing summary text says "Applied immediately!" (not "Redeem on next visit")
- [ ] Verify total amount is reduced correctly (only paid treatments charged)
- [ ] Test with different doctor (non-matching) - bundle should NOT apply
- [ ] Test with service-specific bundle - existing behavior should work
- [ ] Check browser console logs for `[BundleMatching]` messages
- [ ] After creating billing, verify free session appears in patient's billing history

## Debug Logs
Enable debug logging by setting:
```typescript
const ENABLE_BILLING_DEBUG_LOGS = true;
```

Look for console messages:
```
[BundleMatching] Bundle "Birthday-offer" matched by DOCTOR: Disha (691ea8fc...)
[BundleMatching] Bundle "Birthday-offer": 2 eligible treatments from 2 paid treatments (need 2), Match type: DOCTOR, Eligible: true
[BundleMatching] Bundle "Birthday-offer" MATCHED! Free sessions: ["Nasya"]
[FreeSession] Treatment "Nasya" added as FREE session
```

## Related Files
- `ZEVA/components/AppointmentBillingModal.tsx` - Bundle matching logic (modified)
- `ZEVA/pages/api/clinic/create-patient-registration.js` - Billing creation API (no changes needed)
- `ZEVA/models/Billing.js` - Billing model schema (no changes needed)

## Notes
- This fix aligns bundle offer behavior with regular offer behavior (which already supported doctorIds)
- The priority system ensures no conflicts between doctor/service/all-services matching
- **Immediate Mode**: Free sessions from current bundle are applied immediately (price = 0) in the same billing
- Free sessions are correctly tracked in `offerFreeSession` and `usedFreeSessions` fields for future redemption tracking
- Billing summary now shows "Applied immediately!" for current bundle free sessions
- The fix maintains backward compatibility - existing service-specific and all-services bundles continue to work as before
- Both treatment selection and Smart Recommendations respect the current bundle's free sessions
