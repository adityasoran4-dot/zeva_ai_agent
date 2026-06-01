# Mock Data for New Clinic Users - Implementation Guide

## Overview
This feature displays realistic mock/sample data on the clinic dashboard for newly registered users during their first 2 days. This helps new users understand how the system works by seeing sample data across all dashboard sections (cards, graphs, and other components) instead of empty or zero states.

## Key Features

### 1. **Automatic Detection**
- Uses the `registeredAt` field in the Clinic model to identify new users
- Only applies to users registered after this feature was implemented
- Legacy users (with `registeredAt: null`) are not affected

### 2. **Smart Switching**
- Shows mock data for the first 2 days after registration
- **Automatically switches to real data** as soon as the user creates:
  - Appointments
  - Leads
  - Patients
- No manual intervention required

### 3. **Realistic Mock Data**
The following data types are generated with realistic values:
- **Dashboard Stats**: Reviews, enquiries, appointments, leads, treatments, rooms, departments, packages, offers, patients, jobs
- **Daily Stats**: Booked, enquiry, discharge, arrived, consultation, cancelled, etc.
- **Appointment Charts**: Weekly/monthly appointment trends
- **Lead Statistics**: Source breakdown and status distribution
- **Membership Data**: Active/expired memberships and revenue
- **Commission Details**: Total/pending/paid commission with trends
- **Patient Demographics**: Gender distribution, visit frequency, top patients
- **Financial Reports**: Revenue trends, payment methods, doctor revenue, top services
- **Top 5 Services & Packages**: Most booked services and purchased packages
- **Offer Status**: Active, expired, claimed, draft offers breakdown
- **Doctor Performance**: Appointments per doctor, revenue per doctor, leaderboard
- **Room Utilization**: Room usage statistics and percentages
- **Cancellation & No-Show Reports**: Cancelled appointments, no-shows, trends
- **Billing Stats**: Top packages and services by revenue

### 4. **User-Friendly Indicator**
- A blue banner at the top of the dashboard informs users they're viewing sample data
- Banner can be dismissed by the user
- Clear messaging encourages users to start creating real data

## Implementation Details

### Files Modified/Created

#### 1. **New File: `lib/mockDataGenerator.ts`**
Utility functions for generating mock data:
- `generateMockDashboardStats()` - Main dashboard statistics
- `generateMockDailyStats()` - Daily activity statistics
- `generateMockAppointmentStats(filter)` - Appointment chart data
- `generateMockLeadStats()` - Lead source and status data
- `generateMockMembershipStats()` - Membership statistics
- `generateMockCommissionData()` - Commission details
- `generateMockPatientDemographics()` - Patient analytics
- `generateMockFinancialData()` - Financial reports
- `generateMockBillingStats()` - Top 5 packages and services
- `generateMockDoctorPerformance()` - Doctor performance metrics
- `generateMockRoomUtilization()` - Room utilization statistics
- `generateMockCancellationReports()` - Cancellation and no-show reports
- `generateMockOfferStats()` - Offer status breakdown
- `isNewClinicInMockPeriod(registeredAt)` - Check if within 2-day period
- `hasRealActivity(stats)` - Check if user has real data

#### 2. **Modified: `pages/api/clinics/dashboardStats.js`**
- Added check for `registeredAt` field
- Queries for real activity (appointments, leads, patients)
- Returns mock data if within 2 days AND no real activity
- Includes `isMockData: true` flag in response

#### 3. **Modified: `pages/api/clinics/dailyAppointmentStats.js`**
- Same logic as dashboardStats
- Checks for real activity on the requested date
- Returns mock daily stats if needed

#### 4. **Modified: `pages/api/clinics/appointmentStats.js`**
- Checks for real appointment data based on filter (today/week/month/overall)
- Returns mock appointment chart data if needed

#### 5. **Modified: `pages/api/clinics/leadStats.js`**
- Checks for real lead data based on filter
- Returns mock lead source and status data if needed

#### 6. **Modified: `pages/api/clinics/membershipStats.js`**
- Checks for real membership data
- Returns mock membership statistics if needed

#### 7. **Modified: `pages/api/clinics/billingStats.js`**
- Checks for real billing data (packages and services)
- Returns mock top 5 packages and services data if needed

#### 8. **Modified: `pages/api/clinics/offerStats.js`**
- Checks for real offer data
- Returns mock offer status breakdown if needed

#### 9. **Modified: `pages/api/clinics/doctor-performance.js`**
- Checks for real appointment data per doctor
- Returns mock doctor performance metrics including:
  - Appointments per doctor
  - Revenue per doctor
  - Leaderboard data

#### 10. **Modified: `pages/api/clinics/roomUtilization.js`**
- Checks for real room booking data
- Returns mock room utilization statistics if needed

#### 11. **Modified: `pages/api/clinics/cancellation-reports.js`**
- Checks for real cancellation/no-show data
- Returns mock cancellation reports including:
  - Cancelled appointments list
  - No-show appointments list
  - Cancellation trend charts

#### 7. **Modified: `pages/clinic/clinic-dashboard.tsx`**
- Added `isShowingMockData` state
- Detects `isMockData` flag from API responses
- Displays mock data banner when applicable
- Banner can be dismissed by user

## How It Works

### Registration Flow
1. User registers clinic via `/clinic/register-clinic.tsx`
2. Backend creates clinic record with `registeredAt: new Date()`
3. User is auto-logged in and redirected to dashboard
4. Dashboard fetches data from various stats APIs

### Data Fetching Flow
1. Dashboard calls stats APIs (dashboardStats, dailyAppointmentStats, etc.)
2. Each API checks:
   ```javascript
   const isInMockPeriod = isNewClinicInMockPeriod(clinic.registeredAt);
   ```
3. If within 2 days, API checks for real activity:
   ```javascript
   const hasRealData = appointmentCount > 0 || leadCount > 0 || patientCount > 0;
   ```
4. If no real data, API returns mock data with `isMockData: true` flag
5. Frontend detects flag and shows banner

### Switching to Real Data
- As soon as user creates their first appointment, lead, or patient
- Next API call will detect real data
- Dashboard automatically switches to showing real data
- Banner disappears

## Time Period Logic

```javascript
const isNewClinicInMockPeriod = (registeredAt: Date | null | undefined): boolean => {
  if (!registeredAt) {
    return false; // Legacy users don't get mock data
  }

  const now = new Date();
  const registrationDate = new Date(registeredAt);
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  
  const timeSinceRegistration = now.getTime() - registrationDate.getTime();
  
  return timeSinceRegistration < twoDaysInMs;
};
```

## Mock Data Ranges

All mock data uses realistic ranges to give new users a proper understanding:

| Metric | Min | Max |
|--------|-----|-----|
| Total Reviews | 3 | 12 |
| Total Enquiries | 5 | 20 |
| Total Appointments | 8 | 25 |
| Total Leads | 10 | 30 |
| Total Patients | 15 | 50 |
| Total Jobs | 1 | 5 |
| Total Packages | 2 | 8 |
| Total Offers | 3 | 10 |

## Testing

### Test Scenario 1: New User Registration
1. Register a new clinic
2. Login and navigate to dashboard
3. Verify:
   - Mock data banner is displayed
   - Dashboard shows non-zero values
   - Console shows: "📊 Returning mock dashboard stats for new clinic"
   - API response includes `isMockData: true`

### Test Scenario 2: Creating Real Data
1. While viewing mock data, create a new appointment
2. Refresh dashboard
3. Verify:
   - Banner disappears
   - Real data is shown (appointment count = 1)
   - Console shows real data being fetched

### Test Scenario 3: Legacy Users
1. Login with an existing clinic account (registered before this feature)
2. Verify:
   - No mock data banner
   - Real data is shown (even if zero)
   - `registeredAt` field is null or older than 2 days

### Test Scenario 4: After 2 Days
1. Wait 2 days (or manually change `registeredAt` to 3 days ago)
2. Login to dashboard
3. Verify:
   - No mock data (even if no activity)
   - Real data shown (zeros if no activity)

## API Response Format

### Mock Data Response
```json
{
  "success": true,
  "stats": {
    "totalReviews": 8,
    "totalEnquiries": 15,
    "totalAppointments": 18,
    ...
  },
  "isMockData": true,
  "message": "Showing sample data for new clinic - start adding real data to see actual stats!"
}
```

### Real Data Response
```json
{
  "success": true,
  "stats": {
    "totalReviews": 0,
    "totalEnquiries": 0,
    "totalAppointments": 1,
    ...
  },
  "isMockData": false
}
```

## Important Notes

### ✅ What This Feature Does
- Shows mock data for first 2 days to new users
- Automatically switches to real data when user starts using the system
- Only affects newly registered clinics (with `registeredAt` field)
- Provides helpful banner explaining sample data

### ❌ What This Feature Does NOT Do
- Does NOT affect existing/legacy users
- Does NOT modify any data in the database
- Does NOT prevent real data from being created
- Does NOT persist mock data anywhere
- Does NOT interfere with any existing functionality

### 🔒 Data Integrity
- Mock data is generated on-the-fly (not stored)
- Real data is never modified or deleted
- Each API call independently checks for real data
- No caching of mock data

## Future Enhancements (Optional)

1. **Customizable Mock Data**: Allow admin to configure mock data ranges
2. **Tutorial Mode**: Add interactive tooltips explaining each dashboard section
3. **Progressive Disclosure**: Gradually reduce mock data as user adds real data
4. **Analytics**: Track how quickly new users start creating real data
5. **Regional Customization**: Adjust mock data based on clinic location/type

## Troubleshooting

### Mock data not showing for new user
- Check if `registeredAt` field is set in Clinic document
- Verify `registeredAt` is within last 2 days
- Check browser console for mock data logs
- Verify API is returning `isMockData: true`

### Mock data not switching to real data
- Check if real data was created (appointments, leads, patients)
- Refresh the dashboard page
- Check API response for `isMockData` flag
- Verify database has real records

### Legacy users seeing mock data
- Check if `registeredAt` is accidentally set for old users
- Should be `null` for users registered before this feature
- Run migration to set `registeredAt: null` for legacy users if needed

## Migration for Existing Users

For existing users registered before this feature:

```javascript
// Set registeredAt to null for all existing clinics
db.clinics.updateMany(
  { registeredAt: { $exists: false } },
  { $set: { registeredAt: null } }
);
```

This ensures legacy users don't accidentally get mock data.

## Support

For issues or questions about this feature:
1. Check console logs for mock data indicators (📊 emoji)
2. Verify `registeredAt` field in Clinic model
3. Test with a fresh registration to see full flow
4. Review API responses for `isMockData` flag
