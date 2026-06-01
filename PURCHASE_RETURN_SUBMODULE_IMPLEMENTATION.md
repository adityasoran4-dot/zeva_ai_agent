# Purchase Returns Submodule Implementation Summary

## Overview
This implementation adds a new submodule `clinic_stock_purchase_return` to the parent `clinic_stock` module in the navigation system.

## What Was Created

### 1. API Endpoint
**File:** `pages/api/admin/navigation/add-stock-purchase-return-submodule.js`

**Purpose:** REST API to add the Purchase Returns submodule to the clinic_stock navigation module

**Endpoint:** `POST /api/admin/navigation/add-stock-purchase-return-submodule`

**Authentication:** Admin role required

**Functionality:**
- Finds the `clinic_stock` module (moduleKey: `clinic_stock`, role: `clinic`)
- Checks if the submodule already exists (prevents duplicates)
- Adds the new submodule with the following details:
  ```javascript
  {
    name: 'Purchase Returns',
    path: '/clinic/stocks/purchase-returns',
    icon: '↩️',
    order: 13,
    moduleKey: 'clinic_stock_purchase_return'
  }
  ```

### 2. Database Migration Script
**File:** `scripts/add-purchase-return-submodule.js`

**Purpose:** Direct database script to add the submodule (alternative to API)

**How to run:**
```bash
cd ZEVA
node scripts/add-purchase-return-submodule.js
```

**Requirements:**
- MongoDB connection string in `.env` file
- Node.js with mongoose and dotenv packages installed

### 3. Route Mapping Update
**File:** `pages/staff/[slug].tsx`

**Change:** Added route mapping for the purchase-returns page
```typescript
"clinic-stocks-purchase-returns": () =>
  import("../clinic/stocks/purchase-returns"),
```

This ensures the page can be accessed through the staff navigation system.

### 4. Documentation
**File:** `scripts/add-purchase-return-submodule.md`

**Purpose:** Comprehensive guide on how to execute the submodule insertion

## How to Execute

### Option 1: Using the API (Recommended)
1. Start your development server: `npm run dev`
2. Login as an admin user
3. Make a POST request to:
   ```
   http://localhost:3000/api/admin/navigation/add-stock-purchase-return-submodule
   ```
4. Include authentication token in the request header

**Example using browser console:**
```javascript
fetch('/api/admin/navigation/add-stock-purchase-return-submodule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Option 2: Using the Database Script
```bash
cd c:\Users\ADMIN\Documents\zeva360\ZEVA
node scripts/add-purchase-return-submodule.js
```

### Option 3: Direct MongoDB Query
If you have MongoDB access, run this query:
```javascript
db.clinicnavigationitems.updateOne(
  { moduleKey: "clinic_stock", role: "clinic" },
  { 
    $push: { 
      subModules: {
        name: "Purchase Returns",
        path: "/clinic/stocks/purchase-returns",
        icon: "↩️",
        order: 13,
        moduleKey: "clinic_stock_purchase_return"
      }
    }
  }
)
```

## Expected Result

After execution, the `clinic_stock` module will have 14 submodules (was 13):

0. UOM (`clinic_stock_uom`)
1. Stock Locations (`clinic_stock_locations`)
2. Suppliers (`clinic_stock_suppliers`)
3. Purchase Requests (`clinic_stock_purchase_requests`)
4. Purchase Orders (`clinic_stock_purchase_orders`)
5. GRN (`clinic_stock_grn`)
6. Purchase Invoices (`clinic_stock_purchase_invoices`)
7. **Purchase Returns (`clinic_stock_purchase_return`)** ← NEW
8. Stock Qty Adjustment (`clinic_stock_stock_qty_adjustment`)
9. Material Consumptions (`clinic_stock_material_consumptions`)
10. Direct Stock Transfer (`clinic_stock_direct_stock_transfer`)
11. Stock Transfer Requests (`clinic_stock_stock_transfer_requests`)
12. Transfer Stock (`clinic_stock_transfer_stock`)
13. Allocated Stock Items (`clinic_stock_allocated_stock_items`)

## API Response Example

**Success:**
```json
{
  "success": true,
  "message": "Purchase Returns submodule added successfully",
  "data": {
    "name": "Purchase Returns",
    "path": "/clinic/stocks/purchase-returns",
    "icon": "↩️",
    "order": 13,
    "moduleKey": "clinic_stock_purchase_return"
  },
  "totalSubModules": 14
}
```

**Already Exists:**
```json
{
  "success": true,
  "message": "Submodule already exists",
  "data": {
    "name": "Purchase Returns",
    "path": "/clinic/stocks/purchase-returns",
    "icon": "↩️",
    "order": 13,
    "moduleKey": "clinic_stock_purchase_return"
  }
}
```

## Files Modified/Created

### Created:
1. ✅ `pages/api/admin/navigation/add-stock-purchase-return-submodule.js` - API endpoint
2. ✅ `scripts/add-purchase-return-submodule.js` - Database migration script
3. ✅ `scripts/add-purchase-return-submodule.md` - Documentation
4. ✅ `PURCHASE_RETURN_SUBMODULE_IMPLEMENTATION.md` - This summary

### Modified:
1. ✅ `pages/staff/[slug].tsx` - Added route mapping for purchase-returns

## Next Steps

After adding the submodule:

1. **Verify in Database:** Check that the submodule was added correctly
   ```javascript
   db.clinicnavigationitems.findOne(
     { moduleKey: "clinic_stock", role: "clinic" },
     { subModules: 1 }
   )
   ```

2. **Test the UI:** Login as a clinic user and verify:
   - Stock menu appears in sidebar
   - Purchase Returns submenu is visible
   - Clicking it navigates to `/clinic/stocks/purchase-returns`

3. **Permission Setup:** If you need to add permissions for this submodule:
   - Update the clinic permission system
   - Add `clinic_stock_purchase_return` to the permission module keys
   - Configure read/create/update/delete permissions as needed

## Notes

- The purchase-returns page already exists at `pages/clinic/stocks/purchase-returns/`
- This implementation only adds the navigation entry to make it visible in the sidebar
- The order number (13) places it after Purchase Invoices in the submenu list
- The icon (↩️) represents the "return" action visually
- The moduleKey follows the naming convention: `clinic_stock_purchase_return`

## Troubleshooting

### Issue: "Clinic Stock module not found"
**Solution:** Verify the module exists in the database:
```javascript
db.clinicnavigationitems.findOne({ moduleKey: "clinic_stock", role: "clinic" })
```

### Issue: "Submodule already exists"
**Solution:** This is not an error. The submodule was already added. Check the database to verify.

### Issue: API returns 401/403
**Solution:** Ensure you're logged in as an admin user and the token is valid.

### Issue: Script fails to connect to MongoDB
**Solution:** Check that `.env` file has the correct `MONGODB_URI` value.

## Database Reference

**Parent Module ID:** `6992d3a52ba69f1e1d712e68`
**Module Key:** `clinic_stock`
**Role:** `clinic`
**Label:** `Stock`
**Path:** `` (empty - parent module)
**Icon:** `📦`
**Description:** `Manage stock and inventory`
