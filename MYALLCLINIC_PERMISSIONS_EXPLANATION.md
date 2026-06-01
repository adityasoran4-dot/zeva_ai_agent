# `/clinic/myallClinic` - Agent and Admin Level Permissions Explanation

This document highlights all the code and functions through which agent and admin level permissions work in the `/clinic/myallClinic` page.

---

## 📋 Table of Contents
1. [Frontend Permission Flow](#frontend-permission-flow)
2. [Backend API Permission Flow](#backend-api-permission-flow)
3. [Key Permission Functions](#key-permission-functions)
4. [Permission Check Points](#permission-check-points)

---

## 🔐 Frontend Permission Flow

### **File: `ZEVA/pages/clinic/myallClinic.tsx`**

#### **1. Permission State Management** (Lines 1026-1032)
```typescript
// Permission state
const [permissions, setPermissions] = useState({
  canRead: false,
  canUpdate: false,
  canDelete: false,
});
const [permissionsLoaded, setPermissionsLoaded] = useState(false);
```

#### **2. Token Priority and Authentication Headers** (Lines 29-56)
```typescript
const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    try {
      const value =
        window.localStorage.getItem(key) ||
        window.sessionStorage.getItem(key);
      if (value) return value;
    } catch (error) {
      console.warn(`Unable to read ${key} from storage`, error);
    }
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};
```

#### **3. User Role Detection** (Lines 1089-1108)
```typescript
// Helper to get user role from token
const getUserRole = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    for (const key of TOKEN_PRIORITY) {
      const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role || null;
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    console.error("Error getting user role:", error);
  }
  return null;
};
```

#### **4. Permission Fetching Logic** (Lines 1110-1285)

**For Clinic and Doctor Roles** (Lines 1127-1196):
```typescript
// For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
if (userRole === "clinic" || userRole === "doctor") {
  try {
    const res = await axios.get("/api/clinic/sidebar-permissions", {
      headers: authHeaders,
    });
    
    if (res.data.success) {
      // Check if permissions array exists and is not null
      // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
      if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
        // No admin restrictions set yet - default to full access for backward compatibility
        setPermissions({
          canRead: true,
          canUpdate: true,
          canDelete: true,
        });
      } else {
        // Admin has set permissions - check the clinic_health_center module
        const modulePermission = res.data.permissions.find((p: any) => {
          if (!p?.module) return false;
          // Check for clinic_health_center module
          if (p.module === "clinic_health_center") return true;
          if (p.module === "health_center") return true;
          return false;
        });

        if (modulePermission) {
          const actions = modulePermission.actions || {};
          
          // Check if "all" is true, which grants all permissions
          const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
          const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
          const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
          const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

          setPermissions({
            canRead: moduleAll || moduleRead,
            canUpdate: moduleAll || moduleUpdate,
            canDelete: moduleAll || moduleDelete,
          });
        } else {
          // Module permission not found in the permissions array - default to read-only
          setPermissions({
            canRead: true, // Clinic/doctor can always read their own data
            canUpdate: false,
            canDelete: false,
          });
        }
      }
    }
  } catch (err: any) {
    console.error("Error fetching clinic sidebar permissions:", err);
    // On error, default to full access (backward compatibility)
    setPermissions({
      canRead: true,
      canUpdate: true,
      canDelete: true,
    });
  }
}
```

**For Agent, Staff, and DoctorStaff Roles** (Lines 1198-1262):
```typescript
// For agents, staff, and doctorStaff, fetch from /api/agent/permissions
if (["agent", "staff", "doctorStaff"].includes(userRole || "")) {
  let permissionsData = null;
  try {
    // Get agentId from token
    const token = getStoredToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const agentId = payload.userId || payload.id;
      
      if (agentId) {
        const res = await axios.get(`/api/agent/permissions?agentId=${agentId}`, {
          headers: authHeaders,
        });
        
        if (res.data.success && res.data.data) {
          permissionsData = res.data.data;
        }
      }
    }
  } catch (err: any) {
    console.error("Error fetching agent permissions:", err);
  }

  if (permissionsData && permissionsData.permissions) {
    const modulePermission = permissionsData.permissions.find((p: any) => {
      if (!p?.module) return false;
      if (p.module === "health_center") return true;
      if (p.module === "clinic_health_center") return true;
      if (p.module.startsWith("clinic_") && p.module.slice(7) === "health_center") {
        return true;
      }
      return false;
    });

    if (modulePermission) {
      const actions = modulePermission.actions || {};
      
      // Module-level "all" grants all permissions
      const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
      const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
      const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
      const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

      setPermissions({
        canRead: moduleAll || moduleRead,
        canUpdate: moduleAll || moduleUpdate,
        canDelete: moduleAll || moduleDelete,
      });
    } else {
      // No permissions found for this module, default to false
      setPermissions({
        canRead: false,
        canUpdate: false,
        canDelete: false,
      });
    }
  } else {
    // API failed or no permissions data, default to false
    setPermissions({
      canRead: false,
      canUpdate: false,
      canDelete: false,
    });
  }
}
```

#### **5. Data Fetching with Permission Checks** (Lines 1287-1360)
```typescript
useEffect(() => {
  const fetchClinics = async () => {
    // Wait for permissions to load
    if (!permissionsLoaded) return;

    const userRole = getUserRole();
    
    // ✅ Check read permission for all roles (including clinic and doctor with admin-level permissions)
    if (!permissions.canRead) {
      setClinics([]);
      setLoading(false);
      return;
    }

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setLoading(false);
        return;
      }

      // Use axios with error handling that prevents Next.js error overlay
      const res = await axios.get("/api/clinics/myallClinic", {
        headers: authHeaders,
        // Suppress error overlay for 403 errors
        validateStatus: (status) => status === 200 || status === 403,
      });
      
      // Check if response is 403
      if (res.status === 403) {
        // Handle 403 silently - this is expected when permissions are not granted
        // But only update permissions for agent/doctorStaff roles, not clinic/doctor
        if (userRole !== "clinic" && userRole !== "doctor") {
          setPermissions(prev => ({
            ...prev,
            canRead: false,
          }));
        }
        setClinics([]);
        setLoading(false);
        return;
      }
      
      setClinics(
        Array.isArray(res.data.clinics) ? res.data.clinics : [res.data.clinic]
      );
    } catch (err: any) {
      // Only catch non-403 errors here
      console.error("Error fetching clinics:", err);
      if (err.response?.status !== 403) {
        toast.error("Failed to fetch clinic information. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  fetchClinics();
}, [permissionsLoaded, permissions.canRead]);
```

#### **6. Edit Action Permission Checks** (Lines 1436-1462)
```typescript
const handleEdit = (clinic: unknown) => {
  // Check permission before allowing edit
  if (!permissions.canUpdate) {
    toast.error("You do not have permission to update clinic information");
    return;
  }

  setIsEditing(true);
  setEditingClinicId((clinic as Clinic)._id);
  setEditForm({
    ...(clinic as Clinic),
    treatments: (clinic as Clinic).treatments || [],
    servicesName: (clinic as Clinic).servicesName || [],
  });
};

const handleEditFromHeader = () => {
  // Check permission before allowing edit
  if (!permissions.canUpdate) {
    toast.error("You do not have permission to update clinic information");
    return;
  }

  if (clinics.length > 0) {
    handleEdit(clinics[0]); // Edit the first clinic if available
  }
};
```

#### **7. UI Rendering Based on Permissions** (Lines 144-152, 778, 1760-1773, 2124-2157)
```typescript
// Edit button visibility (Line 144)
{hasClinic && !isEditing && canUpdate && (
  <button
    onClick={onEditClick}
    className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm hover:shadow-md text-sm"
  >
    <Edit3 className="w-4 h-4" />
    <span>Edit Profile</span>
  </button>
)}

// Access denied message (Lines 1760-1773)
if (permissionsLoaded && !permissions.canRead) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-300 max-w-md w-full text-center">
        <div className="text-red-500 mb-4">
          <X className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to view clinic information.
        </p>
        <p className="text-sm text-gray-500">
          Please contact your administrator to request access to the Manage Health Center module.
        </p>
      </div>
    </div>
  );
}
```

---

## 🔒 Backend API Permission Flow

### **File: `ZEVA/pages/api/clinic/sidebar-permissions.js`** (For Clinic/Doctor Roles)

This API is called by the frontend to fetch permissions for clinic and doctor roles.

#### **1. Authentication and Role Check** (Lines 18-27)
```javascript
// Get the logged-in clinic user
const me = await getUserFromReq(req);
if (!me) {
  return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
}

// Only clinic, agent, doctor, doctorStaff can fetch clinic navigation
if (!['clinic', 'agent', 'doctor', 'doctorStaff'].includes(me.role)) {
  return res.status(403).json({ success: false, message: 'Access denied. Clinic role or agent with clinic permissions required' });
}
```

#### **2. Clinic Resolution** (Lines 29-38)
```javascript
let clinic = null;
if (me.role === 'clinic') {
  clinic = await Clinic.findOne({ owner: me._id });
} else if (me.clinicId) {
  clinic = await Clinic.findById(me.clinicId);
}

if (!clinic) {
  return res.status(404).json({ success: false, message: 'Clinic not found for this user' });
}
```

#### **3. Clinic Approval Check** (Lines 40-54)
```javascript
// Check if clinic is approved
if (!clinic.isApproved) {
  return res.status(403).json({ 
    success: false, 
    message: 'Clinic account not approved. Please wait for admin approval.' 
  });
}

// Check if clinic is declined
if (clinic.declined) {
  return res.status(403).json({ 
    success: false, 
    message: 'Clinic account has been declined' 
  });
}
```

#### **4. Permission Retrieval** (Lines 56-100)
```javascript
// Get clinic permissions
const clinicPermission = await ClinicPermission.findOne({ clinicId: clinic._id });

// If no permissions exist, return all navigation items (clinic sees everything until admin restricts)
if (!clinicPermission || !clinicPermission.permissions || clinicPermission.permissions.length === 0) {
  return res.status(200).json({
    success: true,
    permissions: null,  // ← This null value indicates no admin restrictions
    navigationItems: navigationItems.map(item => ({
      _id: item._id,
      label: item.label,
      path: transformPath(item.path),
      icon: item.icon,
      description: item.description,
      order: item.order,
      moduleKey: item.moduleKey,
      subModules: (item.subModules || []).map(subModule => ({
        ...subModule,
        path: transformPath(subModule.path)
      }))
    })),
    clinicId: clinic._id.toString()
  });
}
```

#### **5. Permission Map Building** (Lines 102-123)
```javascript
// Build permission map for quick lookup
const permissionMap = {};
clinicPermission.permissions.forEach(perm => {
  const moduleKey = perm.module;
  const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
  const moduleKeyWithPrefix = `clinic_${moduleKeyWithoutPrefix}`;
  
  const permissionData = {
    moduleActions: perm.actions,
    subModules: {}
  };
  
  permissionMap[moduleKey] = permissionData;
  permissionMap[moduleKeyWithoutPrefix] = permissionData;
  permissionMap[moduleKeyWithPrefix] = permissionData;
  
  if (perm.subModules && perm.subModules.length > 0) {
    perm.subModules.forEach(subModule => {
      permissionData.subModules[subModule.name] = subModule.actions;
    });
  }
});
```

#### **6. Return Permissions** (Lines 193-198)
```javascript
return res.status(200).json({
  success: true,
  permissions: clinicPermission.permissions,  // ← Array of permission objects
  navigationItems: filteredNavigationItems,
  clinicId: clinic._id.toString()
});
```

**Key Points:**
- Returns `permissions: null` if no admin restrictions are set (full access)
- Returns `permissions: [...]` array if admin has set restrictions
- Frontend checks for `clinic_health_center` or `health_center` module in this array

---

### **File: `ZEVA/pages/api/agent/permissions.js`** (For Agent/Staff/DoctorStaff Roles)

This API is called by the frontend to fetch permissions for agent, staff, and doctorStaff roles.

#### **1. Authentication and Role Check** (Lines 10-18)
```javascript
const me = await getUserFromReq(req);
if (!me) {
  return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
}

// Allow admin, clinic, doctor, staff, doctorStaff, and agent roles
if (!requireRole(me, ['admin', 'clinic', 'doctor', 'staff', 'doctorStaff', 'agent'])) {
  return res.status(403).json({ success: false, message: 'Access denied' });
}
```

#### **2. Agent ID Validation** (Lines 22-32)
```javascript
const { agentId } = req.query;

if (!agentId) {
  return res.status(400).json({ success: false, message: 'Agent ID is required' });
}

// Verify agent exists and user has permission to view it
const agent = await User.findById(agentId);
if (!agent || !['agent', 'doctorStaff'].includes(agent.role)) {
  return res.status(404).json({ success: false, message: 'Agent not found' });
}
```

#### **3. Permission Access Control** (Lines 34-83)
```javascript
// Check if user has permission to view this agent's permissions
if (me.role === 'admin') {
  // Admin can only view agents they created
  if (agent.createdBy?.toString() !== me._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
} else if (me.role === 'clinic') {
  // Clinic can view agents from their clinic or agents they created
  // ... clinic-specific checks
} else if (me.role === 'doctor') {
  // Doctor can view agents from their clinic or agents they created
  // ... doctor-specific checks
} else if (me.role === 'staff' || me.role === 'doctorStaff') {
  // Staff and doctorStaff can view agents from their clinic or agents they created
  // ... staff-specific checks
} else if (me.role === 'agent') {
  // Agents can view only their own permissions
  if (agent._id.toString() !== me._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
}
```

#### **4. Return Agent Permissions** (Lines 85-91)
```javascript
// Get agent permissions
const permissions = await AgentPermission.findOne({ agentId }).populate('grantedBy', 'name email');

return res.status(200).json({ 
  success: true, 
  data: permissions || null  // ← Contains permissions array with module keys and actions
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    agentId: ObjectId,
    permissions: [
      {
        module: "health_center" | "clinic_health_center",
        actions: {
          all: boolean,
          read: boolean,
          update: boolean,
          delete: boolean,
          // ... other actions
        },
        subModules: [...]
      }
    ],
    isActive: boolean,
    grantedBy: {...}
  }
}
```

---

### **File: `ZEVA/pages/api/clinics/myallClinic.js`**

#### **1. Authentication Check** (Lines 14-18)
```javascript
const me = await getUserFromReq(req);
if (!me) {
  return res.status(401).json({ success: false, message: "Unauthorized" });
}
```

**Function Used:** `getUserFromReq(req)` from `ZEVA/pages/api/lead-ms/auth.js`
- Extracts JWT token from `Authorization` header
- Verifies token using `JWT_SECRET`
- Returns user object from database

#### **2. Role-Based Access Control** (Lines 20-23)
```javascript
// Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
  return res.status(403).json({ success: false, message: "Access denied" });
}
```

#### **3. Clinic ID Resolution** (Lines 25-51)
```javascript
// ✅ Resolve clinicId correctly
let clinicId;
let clinic = null;

if (me.role === "clinic") {
  clinic = await Clinic.findOne({ owner: me._id }).select("_id");
  if (!clinic) {
    return res.status(404).json({ success: false, message: "Clinic not found for this user" });
  }
  clinicId = clinic._id;
} else if (me.role === "admin") {
  // Admin users need to provide clinicId in query or use their own clinic if linked
  // For now, if admin has clinicId, use it; otherwise return error
  if (me.clinicId) {
    clinicId = me.clinicId;
  } else {
    // Admin without clinicId - try to find any clinic (fallback)
    // In practice, admin should have clinicId or query param
    return res.status(400).json({ success: false, message: "Admin must be linked to a clinic or provide clinicId" });
  }
} else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
  // For agent, doctor, doctorStaff, and staff, use their clinicId
  if (!me.clinicId) {
    return res.status(403).json({ success: false, message: "User not linked to a clinic" });
  }
  clinicId = me.clinicId;
}
```

#### **4. Agent Permission Check** (Lines 53-69)
```javascript
// ✅ Check permission for reading clinic (only for agent, doctorStaff roles)
// Clinic, doctor, and staff roles have full access by default, admin bypasses
if (me.role !== "admin" && clinicId && ["agent", "doctorStaff"].includes(me.role)) {
  const { checkAgentPermission } = await import("../agent/permissions-helper");
  const result = await checkAgentPermission(
    me._id,
    "clinic_health_center",
    "read"
  );

  if (!result.hasPermission) {
    return res.status(403).json({
      success: false,
      message: result.error || "You do not have permission to view clinic information"
    });
  }
}
```

**Function Used:** `checkAgentPermission()` from `ZEVA/pages/api/agent/permissions-helper.js`
- Checks if agent has permission for module `"clinic_health_center"` with action `"read"`
- Returns `{ hasPermission: boolean, error: string | null }`

---

## 🔑 Key Permission Functions

### **1. `getUserFromReq(req)` - `ZEVA/pages/api/lead-ms/auth.js`**
```javascript
export async function getUserFromReq(req) {
  try {
    await dbConnect();
  } catch (dbError) {
    console.error("Database connection error in getUserFromReq:", dbError);
    return null;
  }

  try { 
    const auth = req.headers.authorization || "";
    
    if (!auth) {
      return null;
    }

    const token = auth?.toLowerCase().startsWith("bearer ")
      ? auth.slice(7)
      : null;
    
    if (!token) {
      return null;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables");
      return null;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle different token formats:
    // Admin uses 'id', others use 'userId'
    const userId = payload?.userId || payload?.id;
    if (!userId) {
      return null;
    }

    const user = await User.findById(userId);
    return user || null;
  } catch (e) {
    // Don't log JWT errors as they're expected for invalid tokens
    if (e.name !== 'JsonWebTokenError' && e.name !== 'TokenExpiredError') {
      console.error("Auth error in getUserFromReq:", e.message);
    }
    return null;
  }
}
```

### **2. `requireRole(user, roles)` - `ZEVA/pages/api/lead-ms/auth.js`**
```javascript
export function requireRole(user, roles = []) {
  if (!user) return false;
  if (!roles.length) return true;
  return roles.includes(user.role);
}
```

### **3. `checkAgentPermission(agentId, moduleKey, action, subModuleName)` - `ZEVA/pages/api/agent/permissions-helper.js`**
```javascript
export async function checkAgentPermission(agentId, moduleKey, action, subModuleName = null) {
  await dbConnect();

  if (!agentId) {
    return { hasPermission: false, error: "Agent ID is required" };
  }

  try {
    // Find agent permissions
    const agentPermission = await AgentPermission.findOne({
      agentId,
      isActive: true
    }).lean();

    // If no permissions found, deny access
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return { hasPermission: false, error: "No permissions found for this agent" };
    }

    // Handle module key matching (with or without role prefix)
    const moduleCandidates = Array.from(
      new Set([
        moduleKey,
        moduleKey?.replace(/^(admin|clinic|doctor)_/, ''), // Remove role prefix
        moduleKey ? `admin_${moduleKey}` : null,
        moduleKey ? `clinic_${moduleKey}` : null,
        moduleKey ? `doctor_${moduleKey}` : null,
      ].filter(Boolean))
    );

    // Find the module permission using any of the candidate keys
    const modulePermission = agentPermission.permissions.find(
      (p) => {
        const permModule = p.module || '';
        return moduleCandidates.some(candidate => 
          permModule === candidate || 
          permModule.replace(/^(admin|clinic|doctor)_/, '') === candidate.replace(/^(admin|clinic|doctor)_/, '')
        );
      }
    );

    if (!modulePermission) {
      return { hasPermission: false, error: `Module ${moduleKey} not found in agent permissions` };
    }

    // Check module-level "all" permission first
    const hasAllPermission = modulePermission.actions?.all === true || 
                             modulePermission.actions?.all === "true" ||
                             String(modulePermission.actions?.all).toLowerCase() === "true";
    
    if (hasAllPermission) {
      return { hasPermission: true, error: null };
    }

    // Check specific action
    const hasSpecificAction = modulePermission.actions?.[action] === true || 
                               modulePermission.actions?.[action] === "true" ||
                               String(modulePermission.actions?.[action]).toLowerCase() === "true";
    
    if (hasSpecificAction) {
      return { hasPermission: true, error: null };
    }

    return { hasPermission: false, error: `Permission denied: ${action} action not allowed for module ${moduleKey}` };
  } catch (error) {
    console.error("Error checking agent permission:", error);
    return { hasPermission: false, error: "Error checking permissions" };
  }
}
```

---

## 🎯 Permission Check Points

### **Frontend Checks:**
1. **Initial Permission Fetch** (Lines 1110-1285)
   - Fetches permissions based on user role
   - Clinic/Doctor: `/api/clinic/sidebar-permissions`
   - Agent/Staff/DoctorStaff: `/api/agent/permissions`

2. **Read Permission Check** (Lines 1294-1299, 1370-1374)
   - Blocks data fetching if `canRead` is false
   - Shows access denied message

3. **Update Permission Check** (Lines 1437-1441, 1453-1457, 1642-1645)
   - Blocks edit actions if `canUpdate` is false
   - Shows error toast message

4. **UI Rendering** (Lines 144, 778, 1760-1773, 2124-2157)
   - Hides edit buttons if `canUpdate` is false
   - Shows access denied message if `canRead` is false

### **Backend Checks:**
1. **Authentication** (Line 15)
   - Verifies JWT token via `getUserFromReq()`

2. **Role Validation** (Lines 20-23)
   - Checks if user role is in allowed list

3. **Clinic ID Resolution** (Lines 25-51)
   - Resolves clinic ID based on user role

4. **Agent Permission Check** (Lines 53-69)
   - For agent/doctorStaff roles, checks `clinic_health_center` module with `read` action
   - Admin, clinic, doctor, and staff bypass this check

---

## 📊 Permission Flow Diagram

```
User Request
    ↓
Frontend: withClinicAuth HOC (checks token, role)
    ↓
Frontend: getUserRole() - extracts role from token
    ↓
Frontend: fetchPermissions() - based on role:
    ├─ Clinic/Doctor → /api/clinic/sidebar-permissions
    └─ Agent/Staff/DoctorStaff → /api/agent/permissions
    ↓
Frontend: Check permissions.canRead
    ↓
Frontend: Call /api/clinics/myallClinic
    ↓
Backend: getUserFromReq() - verify token, get user
    ↓
Backend: Check role in allowed list
    ↓
Backend: Resolve clinicId based on role
    ↓
Backend: For agent/doctorStaff → checkAgentPermission()
    ├─ Module: "clinic_health_center"
    └─ Action: "read"
    ↓
Backend: Return clinic data or 403 error
    ↓
Frontend: Render UI based on permissions
    ├─ canRead: false → Show access denied
    ├─ canUpdate: false → Hide edit buttons
    └─ canUpdate: true → Show edit buttons
```

---

## 🔍 Module Key Used

The permission system uses the module key **`"clinic_health_center"`** or **`"health_center"`** for this page.

This module key is checked in:
- Frontend: Lines 1146-1151, 1223-1231
- Backend: Line 59

---

## 📝 Summary

**Admin Level:**
- Admin role bypasses all permission checks
- Admin can access if linked to a clinic (`me.clinicId`)

**Agent Level:**
- Agent role requires explicit permission check via `checkAgentPermission()`
- Module: `"clinic_health_center"`
- Actions checked: `read`, `update`, `delete`
- If `actions.all === true`, grants all permissions

**Clinic/Doctor Level:**
- Fetches permissions from `/api/clinic/sidebar-permissions`
- If no admin restrictions set, defaults to full access
- If admin restrictions exist, checks `clinic_health_center` module

**Staff/DoctorStaff Level:**
- Similar to agent level
- Fetches from `/api/agent/permissions`
- Requires explicit permissions

---

## 📍 Quick Reference - Key Code Locations

### **Frontend (`ZEVA/pages/clinic/myallClinic.tsx`)**
- **Permission State:** Lines 1026-1032
- **Token Priority:** Lines 29-36
- **getAuthHeaders():** Lines 53-56
- **getUserRole():** Lines 1089-1108
- **Permission Fetching (Clinic/Doctor):** Lines 1127-1196
- **Permission Fetching (Agent/Staff/DoctorStaff):** Lines 1198-1262
- **Read Permission Check:** Lines 1294-1299, 1370-1374
- **Update Permission Check:** Lines 1437-1441, 1453-1457, 1642-1645
- **UI Access Denied:** Lines 1760-1773
- **Edit Button Visibility:** Lines 144-152, 778

### **Backend APIs**
- **`/api/clinics/myallClinic.js`:**
  - Authentication: Line 15
  - Role Check: Lines 20-23
  - Clinic ID Resolution: Lines 25-51
  - Agent Permission Check: Lines 53-69

- **`/api/clinic/sidebar-permissions.js`:**
  - Authentication: Line 19
  - Role Check: Lines 24-27
  - Clinic Resolution: Lines 29-38
  - Permission Retrieval: Lines 56-100
  - Permission Map: Lines 102-123

- **`/api/agent/permissions.js`:**
  - Authentication: Line 10
  - Role Check: Lines 15-18
  - Agent Validation: Lines 22-32
  - Access Control: Lines 34-83
  - Return Permissions: Lines 85-91

### **Helper Functions**
- **`getUserFromReq()`:** `ZEVA/pages/api/lead-ms/auth.js` Lines 6-52
- **`requireRole()`:** `ZEVA/pages/api/lead-ms/auth.js` Lines 62-66
- **`checkAgentPermission()`:** `ZEVA/pages/api/agent/permissions-helper.js` Lines 14-130

### **HOC (Higher Order Component)**
- **`withClinicAuth`:** `ZEVA/components/withClinicAuth.tsx`
  - Token Check: Lines 16-24
  - Role Verification: Lines 87-96
  - Allowed Roles: Line 89 (`['clinic', 'agent', 'doctor', 'doctorStaff', 'staff']`)

