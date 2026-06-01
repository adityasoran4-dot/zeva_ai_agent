# Script to add Purchase Returns submodule to Clinic Stock module

This script will call the API to add the `clinic_stock_purchase_return` submodule to the `clinic_stock` parent module.

## API Endpoint
**POST** `/api/admin/navigation/add-stock-purchase-return-submodule`

## Requirements
- Must be authenticated as an **admin** user
- The `clinic_stock` module must exist in the database

## What it does
1. Finds the `clinic_stock` module (moduleKey: `clinic_stock`, role: `clinic`)
2. Checks if `clinic_stock_purchase_return` submodule already exists
3. If not exists, adds the new submodule with:
   - name: "Purchase Returns"
   - path: "/clinic/stocks/purchase-returns"
   - icon: "↩️"
   - order: 13
   - moduleKey: "clinic_stock_purchase_return"

## How to run

### Option 1: Using curl (from browser dev tools or terminal)
```bash
curl -X POST http://localhost:3000/api/admin/navigation/add-stock-purchase-return-submodule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Option 2: Using the browser
1. Login as admin
2. Open browser dev tools (F12)
3. Go to Console tab
4. Run:
```javascript
fetch('/api/admin/navigation/add-stock-purchase-return-submodule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Option 3: Direct database insertion (if API authentication is an issue)
If you have direct MongoDB access, you can run:
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

## Expected Response
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

## Note
The purchase-returns page already exists at `/pages/clinic/stocks/purchase-returns/`. This API only adds the navigation entry to make it visible in the sidebar.
