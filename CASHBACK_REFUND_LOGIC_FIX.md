# Cashback Refund Logic Fix

## 🐛 Problem Identified

The refund logic had a **critical bug** when handling cashback offers:

### ❌ **Wrong Behavior (Before Fix)**
When refunding a billing where cashback was **EARNED**:
```
Billing: isCashbackApplied=true, cashbackAmount=100
Action: Refund clicked
Result: +100 added to wallet (WRONG! ❌)
```

This was **doubling** the cashback instead of revoking it!

### ✅ **Correct Behavior (After Fix)**
When refunding a billing where cashback was **EARNED**:
```
Billing: isCashbackApplied=true, cashbackAmount=100
Action: Refund clicked
Result: -100 deducted from wallet (CORRECT! ✅)
```

This **revokes** the cashback that was earned.

## 🔧 What Was Fixed

### 1. **offer-refund.js** - Backend Logic

#### Before (WRONG):
```javascript
// Handle Cashback Earned - Refund to Patient Wallet
if (billing.isCashbackApplied && billing.cashbackAmount > 0) {
  const refundAmount = billing.cashbackAmount;
  patient.walletBalance = (patient.walletBalance || 0) + refundAmount; // ❌ Adding!
  patient.walletTransactions.push({
    type: 'credit', // ❌ Credit!
    description: `Cashback refund for invoice...`
  });
}
```

#### After (CORRECT):
```javascript
// Handle Cashback Earned - REVOKE/REMOVE from Patient Wallet
if (billing.isCashbackApplied && billing.cashbackAmount > 0) {
  const revokeAmount = billing.cashbackAmount;
  const currentWalletBalance = patient.walletBalance || 0;
  const newWalletBalance = Math.max(0, currentWalletBalance - revokeAmount); // ✅ Deducting!
  
  patient.walletBalance = newWalletBalance;
  patient.walletTransactions.push({
    amount: revokeAmount,
    type: 'debit',  // ✅ Debit (removing cashback)
    offerName: 'Cashback Revoked',
    description: `Cashback revoked due to refund of invoice...`
  });
}
```

### 2. **API Response** - Enhanced Clarity

Added summary to make it clear what action was taken:
```json
{
  "success": true,
  "data": {
    "cashbackRevoked": 100,        // NEW: Cashback that was revoked
    "cashbackRestored": 0,         // NEW: Cashback that was restored
    "summary": {
      "cashbackAction": "REVOKED", // NEW: Clear action type
      "cashbackAmount": 100
    }
  }
}
```

### 3. **OfferTrackReport.tsx** - Frontend UI

#### Refund Modal Warning:
```tsx
{selectedBilling.cashbackEarned > 0 && (
  <li className="text-red-600">
    ⚠️ Cashback earned: {currency(selectedBilling.cashbackEarned)} will be REVOKED from wallet
  </li>
)}
{selectedBilling.cashbackWalletUsed > 0 && (
  <li className="text-green-600">
    ✓ Cashback wallet usage: {currency(selectedBilling.cashbackWalletUsed)} will be RESTORED to wallet
  </li>
)}
```

#### Success Message:
```tsx
if (summary.cashbackAction === 'REVOKED') {
  successMsg += ` ${currency(summary.cashbackAmount)} cashback revoked from wallet.`;
} else if (summary.cashbackAction === 'RESTORED') {
  successMsg += ` ${currency(summary.cashbackAmount)} cashback restored to wallet.`;
}
```

## 📊 Complete Cashback Lifecycle

### Scenario 1: Earn Cashback
```
Step 1: Create billing with cashback offer
  → cashbackAmount: 100 added to wallet
  → walletBalance: +100
  
Step 2: Refund the billing
  → cashbackAmount: 100 REVOKED from wallet
  → walletBalance: -100 (back to original)
```

### Scenario 2: Use Cashback
```
Step 1: Create billing #1 with cashback offer
  → cashbackAmount: 100 earned
  → walletBalance: +100

Step 2: Create billing #2, use cashback from wallet
  → cashbackWalletUsed: 100
  → walletBalance: -100 (back to 0)

Step 3: Refund billing #2
  → cashbackWalletUsed: 100 RESTORED to wallet
  → walletBalance: +100 (cashback is back!)
```

## 🎯 Key Rules

| Action | Billing Field | Effect on Wallet | Transaction Type |
|--------|--------------|------------------|------------------|
| Earn cashback | `cashbackAmount > 0` | +Amount | Credit |
| Use cashback | `cashbackWalletUsed > 0` | -Amount | Debit |
| **Refund earned cashback** | `isCashbackApplied && cashbackAmount > 0` | **-Amount (REVOKE)** | **Debit** ✅ |
| **Refund used cashback** | `cashbackWalletUsed > 0` | **+Amount (RESTORE)** | **Credit** ✅ |

## ✅ Testing Checklist

- [x] Refund billing with earned cashback → wallet balance decreases
- [x] Refund billing with used cashback → wallet balance increases
- [x] Refund modal shows "REVOKED" for earned cashback
- [x] Refund modal shows "RESTORED" for used cashback
- [x] Success message clearly states what happened
- [x] Wallet transaction recorded with correct type (debit/credit)
- [x] API response includes summary of cashback action

## 📝 Notes

- **cashbackRevoked**: Amount removed from wallet (when refunding earned cashback)
- **cashbackRestored**: Amount added back to wallet (when refunding used cashback)
- Wallet balance is protected with `Math.max(0, ...)` to prevent negative balances
- All wallet transactions are logged for audit trail
- Free sessions follow similar logic (remove granted, restore used)
