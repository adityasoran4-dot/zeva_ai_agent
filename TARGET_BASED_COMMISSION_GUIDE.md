# Target-Based Commission Implementation Guide

## Overview
The system now supports **Target-Based Commission** calculation for doctors and staff members. This allows commission to be earned only after a staff member exceeds their target amount.

## Features Implemented

### 1. Commission Model Updates
**File**: `models/Commission.js`

Added new fields to track target-based commission:
- `targetAmount`: The target threshold that must be exceeded
- `cumulativeAchieved`: Running total of all paid amounts for this staff member
- `isAboveTarget`: Boolean flag indicating if the target has been crossed

### 2. Commission Calculator Helper
**File**: `lib/commissionCalculator.js`

New utility functions:
- `calculateTargetBasedCommission()`: Calculates commission based on target thresholds
- `calculateFlatCommission()`: Handles traditional flat percentage commission
- `calculateCommissionForStaff()`: Main entry point that determines the correct calculation method

#### Target-Based Commission Logic:
1. **Below Target**: No commission is earned until cumulative paid amount reaches the target
2. **Crossing Target**: Commission is calculated only on the amount that exceeds the target
3. **Above Target**: Once target is crossed, all future payments earn full commission

**Example**:
- Target Amount: ₹50,000
- Commission %: 10%
- Scenario 1: Paid ₹30,000 → Commission = ₹0 (below target)
- Scenario 2: Paid ₹60,000 → Commission = ₹1,000 (10% of ₹10,000 above target)
- Scenario 3: Already crossed target, paid ₹20,000 → Commission = ₹2,000 (10% of full amount)

### 3. Billing API Integration
**File**: `pages/api/clinic/create-patient-registration.js`

The billing creation endpoint now:
- Automatically detects the staff member's commission type from their profile
- Calculates commission using the new helper function
- Stores all target-tracking fields in the commission record
- Supports both flat and target-based commission types

### 4. Commission Summary API
**File**: `pages/api/clinic/commissions/summary.js`

Enhanced to show target progress:
- `commissionType`: Shows the type of commission (flat/target_based)
- `targetAmount`: The target threshold
- `targetProgress`: Percentage of target achieved
- `isAboveTarget`: Whether the staff has crossed their target

### 5. Agent Profile Setup
**File**: `models/AgentProfile.js` & `pages/clinic/create-agent.jsx`

Profile fields for commission configuration:
- `commissionType`: Choose between flat, after_deduction, target_based, target_plus_expense
- `commissionPercentage`: The percentage to apply
- `baseSalary`: Used to calculate target amount
- `targetMultiplier`: Multiplier (1x-10x) applied to baseSalary to get targetAmount
- `targetAmount`: Auto-calculated as baseSalary × targetMultiplier

## How to Use

### Setting Up Target-Based Commission for a Staff Member

1. **Navigate to**: Clinic → Create Agent (or Doctor Staff)
2. **Click** the three-dot menu next to a staff member
3. **Select** "Profile"
4. **Configure Commission**:
   - Set **Base Salary**: e.g., ₹50,000
   - Choose **Commission Type**: Select "Target based"
   - Set **Commission Percentage**: e.g., 10%
   - Choose **Target Multiplier**: e.g., 2x (results in target of ₹100,000)
   - **Target Amount** will auto-calculate (₹50,000 × 2 = ₹100,000)
5. **Save** the profile

### Billing and Commission Calculation

When you create a billing record via **Clinic → All Appointments → Billing**:

1. The system checks if the staff has a profile with commission settings
2. If **commission type is "target_based"**:
   - Fetches all previous commission records to calculate cumulative achieved amount
   - Determines if target has been crossed
   - Calculates commission only on amount above target (if applicable)
3. Commission record is automatically created with:
   - Calculated commission amount
   - Current cumulative achieved amount
   - Target crossing status

### Viewing Commission Reports

**Clinic → Commission Tracker**:
- Switch to **Doctor/Staff** tab
- View commission summaries for each staff member
- For target-based staff, you'll see:
  - Total earned commission
  - Total paid amount (achievement)
  - Target amount
  - Progress percentage
  - Target crossed status

## Database Schema

### Commission Model Fields
```javascript
{
  clinicId: ObjectId,
  source: "staff", // or "referral"
  staffId: ObjectId,
  commissionType: "target_based", // or "flat", etc.
  appointmentId: ObjectId,
  patientId: ObjectId,
  billingId: ObjectId,
  commissionPercent: Number,
  amountPaid: Number,
  commissionAmount: Number,
  invoicedDate: Date,
  // Target-based specific fields
  targetAmount: Number,
  cumulativeAchieved: Number,
  isAboveTarget: Boolean
}
```

### AgentProfile Fields
```javascript
{
  userId: ObjectId,
  baseSalary: Number,
  commissionType: "target_based",
  commissionPercentage: Number,
  targetMultiplier: Number,
  targetAmount: Number
}
```

## Testing the Implementation

### Test Case 1: Below Target
1. Create staff with target ₹100,000 and 10% commission
2. Create billing with paid amount ₹50,000
3. **Expected**: Commission = ₹0, cumulative = ₹50,000

### Test Case 2: Crossing Target
1. Same staff (cumulative already ₹50,000)
2. Create billing with paid amount ₹60,000
3. **Expected**: Commission = ₹1,000 (10% of ₹10,000 excess), cumulative = ₹110,000

### Test Case 3: Above Target
1. Same staff (cumulative already ₹110,000)
2. Create billing with paid amount ₹20,000
3. **Expected**: Commission = ₹2,000 (10% of full ₹20,000), cumulative = ₹130,000

## API Endpoints

### Calculate Commission (Internal)
The commission calculation happens automatically during billing creation.

**POST** `/api/clinic/create-patient-registration`
- Creates billing and calculates commission based on staff profile

### View Commission Summary
**GET** `/api/clinic/commissions/summary?source=staff`
- Returns list of staff with commission details
- Includes target progress for target-based commission

### View Individual Staff Commission
**GET** `/api/clinic/commissions/by-person?personId={staffId}&source=staff`
- Returns detailed commission records for a specific staff member

## Notes

- Commission is calculated based only on the **Paid Amount**, not the total billing amount
- The cumulative achieved amount is tracked per staff member per clinic
- Target amounts can be updated in the staff profile at any time
- Historical commission records remain unchanged when target is modified
- The system supports multiple commission types simultaneously for different staff members

## Future Enhancements

Potential additions:
1. Reset target period (monthly/quarterly/yearly)
2. Progressive commission rates (different % for different tiers)
3. Commission withdrawal tracking
4. Target achievement notifications
5. Commission reports and analytics
