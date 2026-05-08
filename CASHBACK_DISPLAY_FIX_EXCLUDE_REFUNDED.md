# Cashback Display Fix - Exclude Refunded Billings

## 🐛 Problem Identified

After revoking cashback through the refund process, the patient profile page was still showing the **old cashback amount** because it wasn't filtering out refunded billings from the calculation.

### Example:
```
Patient had 2 cashback billings:
- Billing #1: cashbackAmount = 100 (earned)
- Billing #2: cashbackAmount = 100 (earned)
Total displayed: $200

User refunds Billing #1:
- cashbackRevoked: 100
- Billing #1 marked as isOfferRefunded: true

 OLD BEHAVIOR: Patient profile still shows $200 (includes refunded billing)
✅ NEW BEHAVIOR: Patient profile shows $100 (excludes refunded billing)
```

## 🔧 What Was Fixed

### 1. **patient-profile-view.tsx** - Patient Profile Page

#### Before (WRONG):
```typescript
// Find all billings with valid cashback
const cashbackBillings = billings.filter((billing: any) => {
  if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
    return false;
  }
  // ... check expiry
  return isValid;
});

// Calculate total USED cashback (from ALL billings)
const totalCashbackUsed = billings.reduce((sum: number, billing: any) => {
  return sum + (billing.cashbackWalletUsed || 0);
}, 0);
```

#### After (CORRECT):
```typescript
// Find all billings with valid cashback (excluding refunded ones)
const cashbackBillings = billings.filter((billing: any) => {
  // Skip refunded billings
  if (billing.isOfferRefunded) {
    console.log('[CashbackProfile] Skipping refunded billing:', billing.invoiceNumber);
    return false;
  }
  
  if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
    return false;
  }
  // ... check expiry
  return isValid;
});

// Calculate total USED cashback (from non-refunded billings only)
const totalCashbackUsed = billings
  .filter((billing: any) => !billing.isOfferRefunded)  // Exclude refunded
  .reduce((sum: number, billing: any) => {
    return sum + (billing.cashbackWalletUsed || 0);
  }, 0);
```

### 2. **AppointmentBillingModal.tsx** - Billing Modal Cashback Selector

#### Before (WRONG):
```typescript
const cashbackEarnedBillings = (response.data.billings || []).filter((billing: any) => {
  if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
    return false;
  }
  // ... check expiry
});

const totalCashbackUsed = (response.data.billings || []).reduce((sum: number, billing: any) => {
  return sum + (billing.cashbackWalletUsed || 0);
}, 0);
```

#### After (CORRECT):
```typescript
const cashbackEarnedBillings = (response.data.billings || []).filter((billing: any) => {
  // Skip refunded billings
  if (billing.isOfferRefunded) {
    return false;
  }
  
  if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
    return false;
  }
  // ... check expiry
});

const totalCashbackUsed = (response.data.billings || [])
  .filter((billing: any) => !billing.isOfferRefunded)  // Exclude refunded
  .reduce((sum: number, billing: any) => {
    return sum + (billing.cashbackWalletUsed || 0);
  }, 0);
```

##  Impact

### Patient Profile Page
- ✅ Cashback balance now correctly excludes refunded billings
- ✅ Shows only active, non-refunded cashback amounts
- ✅ Available cashback calculation is accurate

### Appointment Billing Modal
- ✅ Cashback selector only shows non-refunded cashback offers
- ✅ Available cashback amount is calculated correctly
- ✅ Users cannot use cashback that has been revoked

## 🎯 Cashback Calculation Flow

### Complete Flow:
```
1. Create billing with cashback offer
   → cashbackAmount: 100
   → isOfferRefunded: false
   → Wallet: +100

2. Create another billing with cashback offer
   → cashbackAmount: 100
   → isOfferRefunded: false
   → Wallet: +100 (total: 200)

3. Patient Profile shows: $200 cashback ✅

4. Refund first billing
   → isOfferRefunded: true (set on billing #1)
   → Wallet: -100 (revoked)
   → Wallet: 100

5. Patient Profile now shows: $100 cashback ✅
   (billing #1 is excluded from calculation)
```

## ✅ Verification Checklist

- [x] Patient profile excludes refunded billings from cashback calculation
- [x] Patient profile excludes refunded billings from cashback used calculation
- [x] AppointmentBillingModal excludes refunded billings from cashback calculation
- [x] AppointmentBillingModal excludes refunded billings from cashback used calculation
- [x] Available cashback = Earned (non-refunded) - Used (non-refunded)
- [x] Console logs show which billings are being skipped
- [x] Cashback selector only shows valid, non-refunded offers

## 📝 Technical Details

### Fields Used:
- `isOfferRefunded`: Boolean flag set when billing is refunded
- `isCashbackApplied`: Boolean flag indicating cashback was applied
- `cashbackAmount`: Amount of cashback earned
- `cashbackWalletUsed`: Amount of cashback used from wallet
- `cashbackEndDate`: Expiry date for cashback validity

### Filtering Logic:
```typescript
// Filter out refunded billings first
if (billing.isOfferRefunded) {
  return false;  // Skip this billing
}

// Then check if it's a cashback billing
if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
  return false;
}

// Then check expiry
if (billing.cashbackEndDate) {
  const endDate = new Date(billing.cashbackEndDate);
  return endDate >= today;
}
```

## 🔄 Related Fixes

This fix works in conjunction with:
1. **offer-refund.js** - Sets `isOfferRefunded: true` and revokes cashback from wallet
2. **offer-track-report.js** - Shows refunded status in the report
3. **OfferTrackReport.tsx** - Displays refund information and warnings

All components now consistently handle refunded billings!
