# Agent Permissions System Guide

This guide explains how to implement and use the agent permissions system in the application.

## Overview

The agent permissions system allows admins, clinics, and doctors to grant granular CRUD (Create, Read, Update, Delete) permissions to agents for specific modules and submodules. Permissions are stored in the `AgentPermission` model and checked both on the frontend and backend.

## Permission Structure

### Module-Level Permissions
Each module can have the following actions:
- `all`: Grants all permissions (create, read, update, delete, print, export, approve)
- `create`: Permission to create new records
- `read`: Permission to view/list records
- `update`: Permission to edit existing records
- `delete`: Permission to delete records
- `print`: Permission to print records
- `export`: Permission to export records
- `approve`: Permission to approve/decline records

### Submodule-Level Permissions
Submodules inherit permissions from the module level, but can also have their own specific permissions. The permission hierarchy is:
1. Module-level `all` → Grants all submodule permissions
2. Module-level specific action → Grants that action for all submodules
3. Submodule-level `all` → Grants all actions for that submodule
4. Submodule-level specific action → Grants only that action for that submodule

## Backend Implementation

### 1. Using Permission Helper in API Endpoints

```javascript
// pages/api/example/example-endpoint.js
import { checkAgentPermission } from "../agent/permissions-helper";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();
  
  const me = await getUserFromReq(req);
  if (!me || !['agent', 'doctorStaff'].includes(me.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Check permission for module-level action
  const { hasPermission, error } = await checkAgentPermission(
    me._id,        // agentId
    "lead",        // moduleKey
    "delete",      // action: "create", "read", "update", "delete", "approve", etc.
    null           // subModuleName (optional, null for module-level)
  );

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: error || "Permission denied"
    });
  }

  // Proceed with the operation...
}
```

### 2. Checking Submodule Permissions

```javascript
// Check permission for a specific submodule
const { hasPermission } = await checkAgentPermission(
  me._id,
  "lead",           // moduleKey
  "create",          // action
  "Create Lead"      // subModuleName
);
```

### 3. Getting Full Module Permissions

```javascript
import { getAgentModulePermissions } from "../agent/permissions-helper";

const { permissions, error } = await getAgentModulePermissions(
  me._id,
  "lead"  // moduleKey
);

if (permissions) {
  // permissions.actions contains module-level actions
  // permissions.subModules contains submodule permissions
}
```

## Frontend Implementation

### 1. Using the useAgentPermissions Hook

```javascript
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

function MyComponent() {
  // Get permissions for a module
  const { permissions, loading, error } = useAgentPermissions("lead");
  
  // Get permissions for a specific submodule
  const { permissions: createPermissions } = useAgentPermissions("lead", "Create Lead");

  // Check specific permissions
  if (permissions.canCreate) {
    // Show create button
  }
  
  if (permissions.canDelete) {
    // Show delete button
  }
  
  if (permissions.canApprove) {
    // Show approve button
  }
  
  if (permissions.canAll) {
    // Show all operations
  }
}
```

### 2. Conditional UI Rendering

```javascript
function LeadsPage() {
  const { permissions } = useAgentPermissions("lead");

  return (
    <div>
      {/* Only show create button if permission granted */}
      {(permissions.canCreate || permissions.canAll) && (
        <button onClick={handleCreate}>Create Lead</button>
      )}

      {/* Only show delete button if permission granted */}
      {(permissions.canDelete || permissions.canAll) && (
        <button onClick={handleDelete}>Delete</button>
      )}

      {/* Only show approve button if permission granted */}
      {(permissions.canApprove || permissions.canAll) && (
        <button onClick={handleApprove}>Approve</button>
      )}

      {/* Only show data if read permission granted */}
      {(permissions.canRead || permissions.canAll) && (
        <div>
          {/* Lead list */}
        </div>
      )}
    </div>
  );
}
```

### 3. Permission Denied Screen

```javascript
function MyPage() {
  const { permissions, loading } = useAgentPermissions("lead", "Create Lead");

  // Show permission denied if no create permission
  if (!loading && !permissions.canCreate && !permissions.canAll) {
    return (
      <div className="permission-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to create leads.</p>
      </div>
    );
  }

  return (
    // Your page content
  );
}
```

## API Endpoints

### Check Permission
```
GET /api/agent/check-permission?moduleKey=lead&action=delete&subModuleName=Create Lead
```
Returns: `{ success: true, hasPermission: boolean }`

### Get Module Permissions
```
GET /api/agent/get-module-permissions?moduleKey=lead
```
Returns: `{ success: true, permissions: { actions: {...}, subModules: [...] } }`

### Sidebar Permissions
```
GET /api/agent/sidebar-permissions
```
Returns: `{ success: true, navigationItems: [...], permissions: [...] }`

## Permission Flow

1. **Admin/Clinic/Doctor grants permissions** via `AgentPermissionModal`
2. **Permissions are saved** to `AgentPermission` model
3. **Agent sidebar** filters navigation items based on `read`/`all` permissions
4. **Frontend pages** check permissions using `useAgentPermissions` hook
5. **Backend APIs** verify permissions using `checkAgentPermission` helper
6. **UI elements** are conditionally rendered based on permissions

## Examples

### Example 1: Create Lead Page
```javascript
// pages/agent/create-lead.jsx
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

function CreateLeadPage() {
  const { permissions, loading } = useAgentPermissions("lead", "Create Lead");

  if (!loading && !permissions.canCreate && !permissions.canAll) {
    return <PermissionDenied />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canCreate && !permissions.canAll) {
      alert("Permission denied");
      return;
    }
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Example 2: Delete Lead API
```javascript
// pages/api/lead-ms/lead-delete-agent.js
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  const me = await getUserFromReq(req);
  
  const { hasPermission } = await checkAgentPermission(
    me._id,
    "lead",
    "delete"
  );

  if (!hasPermission) {
    return res.status(403).json({ success: false, message: "Permission denied" });
  }

  // Delete lead...
}
```

### Example 3: Approve Lead
```javascript
// Frontend
const { permissions } = useAgentPermissions("lead");

const approveLead = async (leadId) => {
  if (!permissions.canApprove && !permissions.canAll) {
    alert("Permission denied");
    return;
  }
  // Call API...
};

// Backend
const { hasPermission } = await checkAgentPermission(
  me._id,
  "lead",
  "approve"
);
```

## Best Practices

1. **Always check permissions on both frontend and backend** - Frontend for UX, backend for security
2. **Use module-level `all` permission** for full access
3. **Use submodule permissions** for granular control
4. **Show permission denied messages** clearly to users
5. **Log permission denials** for security auditing
6. **Cache permissions** on frontend to reduce API calls
7. **Re-check permissions** on route changes if needed

## Troubleshooting

### Permission not working?
1. Check if permissions are saved in `AgentPermission` model
2. Verify moduleKey matches exactly (case-sensitive)
3. Check if `isActive: true` in AgentPermission
4. Verify agent's `createdBy` field is set correctly

### Submodule permission not working?
1. Ensure submodule name matches exactly (case-sensitive)
2. Check if module-level `all` is enabled (it grants all submodule permissions)
3. Verify submodule exists in navigation items

### API permission check failing?
1. Verify agent token is valid
2. Check if agent role is 'agent' or 'doctorStaff'
3. Ensure `checkAgentPermission` is called with correct parameters
4. Check console logs for permission errors

