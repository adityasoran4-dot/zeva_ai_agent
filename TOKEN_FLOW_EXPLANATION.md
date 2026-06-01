# Complete Token Flow: Admin vs Agent Access

## 🎯 Overview

The same page (`/admin/create-agent`) can be accessed by both:
- **Admin** → via `/admin/create-agent` (uses `adminToken`)
- **Agent** → via `/agent/create-agent` (uses `agentToken`)

Both use the **same React component**, but with:
- Different tokens
- Different permissions
- Different layouts (AdminLayout vs AgentLayout)

---

## 📦 STEP 1: Token Storage (LocalStorage)

When users log in, tokens are stored in browser's localStorage:

```javascript
// Admin login
localStorage.setItem('adminToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Agent login
localStorage.setItem('agentToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

**Key Point:** Both tokens can exist simultaneously in localStorage!

---

## 🔍 STEP 2: Page Detects Role (Frontend Logic)

When the page loads, it checks **which route** and **which tokens exist**:

```javascript
// pages/admin/create-agent.tsx (Line 39-68)

useEffect(() => {
  if (typeof window !== 'undefined') {
    // 1. Check which tokens exist
    const adminToken = !!localStorage.getItem('adminToken');  // true/false
    const agentToken = !!localStorage.getItem('agentToken');  // true/false
    
    // 2. Check current route
    const isAgentRoute = router.pathname?.startsWith('/agent/') || 
                         window.location.pathname?.startsWith('/agent/');
    
    // 3. Determine role based on route + tokens
    if (isAgentRoute && agentToken) {
      // ✅ On /agent/* route with agentToken → AGENT
      setIsAdmin(false);
      setIsAgent(true);
    } else if (adminToken) {
      // ✅ Has adminToken (not on agent route) → ADMIN
      setIsAdmin(true);
      setIsAgent(false);
    } else if (agentToken) {
      // ✅ Has agentToken but not on agent route → AGENT
      setIsAdmin(false);
      setIsAgent(true);
    } else {
      // ❌ No tokens → Neither
      setIsAdmin(false);
      setIsAgent(false);
    }
  }
}, [router.pathname]);
```

### Example Scenarios:

| Route | adminToken | agentToken | Result |
|-------|-----------|------------|--------|
| `/admin/create-agent` | ✅ Yes | ❌ No | **isAdmin = true** |
| `/admin/create-agent` | ✅ Yes | ✅ Yes | **isAdmin = true** (admin route) |
| `/agent/create-agent` | ❌ No | ✅ Yes | **isAgent = true** |
| `/agent/create-agent` | ✅ Yes | ✅ Yes | **isAgent = true** (agent route prioritized) |

**Key Point:** If on `/agent/*` route, `agentToken` is prioritized even if `adminToken` exists!

---

## 📡 STEP 3: Token Selection for API Calls

When making API calls, the page selects the appropriate token:

```javascript
// pages/admin/create-agent.tsx (Line 75-82)

// Get both tokens
const adminToken = localStorage.getItem('adminToken');  // "eyJhbGc..." or null
const agentToken = localStorage.getItem('agentToken');  // "eyJhbGc..." or null

async function loadAgents() {
  try {
    // ⭐ CRITICAL: Use adminToken if available, otherwise agentToken
    const token = adminToken || agentToken;  // Fallback logic
    
    const { data } = await axios.get('/api/lead-ms/get-agents', {
      headers: { 
        Authorization: `Bearer ${token}`  // ← Token sent in header
      },
    });
    // ...
  }
}
```

### Token Selection Logic:

```javascript
const token = adminToken || agentToken;
```

This means:
- If `adminToken` exists → use `adminToken`
- If `adminToken` is null but `agentToken` exists → use `agentToken`
- If both are null → `token` is `null` (will fail)

**Important:** This is a **fallback**, not role-based! The page uses `isAdmin`/`isAgent` state for UI logic, but for API calls, it prefers `adminToken` first.

---

## 🔐 STEP 4: Backend Receives Token

The API receives the token in the request header:

```javascript
// pages/api/lead-ms/get-agents.js (Line 12)

export default async function handler(req, res) {
  await dbConnect();
  
  // Extract token from Authorization header
  const me = await getUserFromReq(req);
  // getUserFromReq reads: req.headers.authorization = "Bearer eyJhbGc..."
  
  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  // me now contains the user object with role
  // me.role = "admin" or "agent" or "doctorStaff"
}
```

### How `getUserFromReq` Works:

```javascript
// pages/api/lead-ms/auth.js (Line 6-30)

export async function getUserFromReq(req) {
  await dbConnect();
  
  // 1. Extract token from header
  const auth = req.headers.authorization || "";  // "Bearer eyJhbGc..."
  
  // 2. Remove "Bearer " prefix
  const token = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7)  // Remove "Bearer "
    : null;
  
  if (!token) return null;
  
  // 3. Verify JWT token
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  
  // 4. Get user ID from token
  const userId = payload?.userId || payload?.id;
  
  // 5. Fetch user from database
  const user = await User.findById(userId);
  return user;  // Returns user object with role: "admin" or "agent"
}
```

**Key Point:** The backend doesn't know if it's `adminToken` or `agentToken` - it just verifies the JWT and gets the user. The user's `role` field tells us if they're admin or agent!

---

## 🎨 STEP 5: Different Dashboards (Layout Selection)

The same page component is wrapped with different layouts based on the route:

### Admin Access (`/admin/create-agent`):
```typescript
// pages/admin/create-agent.tsx
export default withAdminAuth(ManageAgentsPage);

// _app.tsx detects /admin/* route
if (router.pathname.startsWith('/admin/')) {
  return <AdminLayout>{Component}</AdminLayout>;  // ← Admin sidebar
}
```

### Agent Access (`/agent/create-agent`):
```typescript
// pages/agent/[slug].tsx loads pages/admin/create-agent.tsx
// But _app.tsx detects /agent/* route
if (router.pathname.startsWith('/agent/')) {
  return <AgentLayout>{Component}</AgentLayout>;  // ← Agent sidebar
}
```

**Key Point:** The **same component** (`ManageAgentsPage`) is rendered, but with different layouts!

---

## 🔄 Complete Flow Example

### Scenario 1: Admin Accesses `/admin/create-agent`

```
1. USER LOGIN:
   localStorage.setItem('adminToken', 'admin_jwt_token_123');

2. PAGE LOADS:
   URL: /admin/create-agent
   router.pathname = "/admin/create-agent"
   isAgentRoute = false (doesn't start with /agent/)
   adminToken = true ✅
   agentToken = false ❌
   
   Result: setIsAdmin(true), setIsAgent(false)

3. API CALL:
   const token = adminToken || agentToken;
   // token = "admin_jwt_token_123"
   
   axios.get('/api/lead-ms/get-agents', {
     headers: { Authorization: `Bearer admin_jwt_token_123` }
   });

4. BACKEND:
   getUserFromReq(req) → verifies token → finds user
   me.role = "admin"
   me.role === 'admin' → bypasses permission checks ✅

5. LAYOUT:
   _app.tsx detects /admin/* → renders AdminLayout
   Shows: Admin sidebar, admin header
```

### Scenario 2: Agent Accesses `/agent/create-agent`

```
1. USER LOGIN:
   localStorage.setItem('agentToken', 'agent_jwt_token_456');

2. PAGE LOADS:
   URL: /agent/create-agent
   router.pathname = "/agent/create-agent"
   isAgentRoute = true ✅ (starts with /agent/)
   adminToken = false ❌
   agentToken = true ✅
   
   Result: setIsAdmin(false), setIsAgent(true)

3. PERMISSIONS CHECK:
   useAgentPermissions("create_agent") → fetches agent permissions
   agentPermissions = { canCreate: true, canRead: true, ... }

4. API CALL:
   const token = adminToken || agentToken;
   // token = "agent_jwt_token_456" (adminToken is null)
   
   axios.get('/api/lead-ms/get-agents', {
     headers: { Authorization: `Bearer agent_jwt_token_456` }
   });

5. BACKEND:
   getUserFromReq(req) → verifies token → finds user
   me.role = "agent"
   me.role === 'agent' → checks permissions
   checkAgentPermission(me._id, "create_agent", "read")
   → Returns: hasPermission = true ✅

6. LAYOUT:
   _app.tsx detects /agent/* → renders AgentLayout
   Shows: Agent sidebar, agent header
```

---

## 🎯 Key Differences Summary

| Aspect | Admin | Agent |
|--------|-------|-------|
| **Route** | `/admin/create-agent` | `/agent/create-agent` |
| **Token** | `adminToken` | `agentToken` |
| **Layout** | `AdminLayout` | `AgentLayout` |
| **Permissions** | Bypassed (full access) | Checked via `checkAgentPermission` |
| **Sidebar** | Admin navigation items | Agent navigation items (filtered) |
| **UI Buttons** | All buttons shown | Buttons shown based on permissions |

---

## 🔑 Critical Points

1. **Token Selection:** `const token = adminToken || agentToken;` - Simple fallback, not role-based
2. **Role Detection:** Based on **route** (`/admin/*` vs `/agent/*`) + **token existence**
3. **Backend:** Doesn't care about token type - just verifies JWT and gets user role
4. **Layout:** Determined by route in `_app.tsx`, not by token
5. **Permissions:** Only checked for agents, admins bypass all checks

---

## 🚨 Important Note

The token selection logic (`adminToken || agentToken`) means:
- If an admin has both tokens, `adminToken` is always used
- If an agent has both tokens, `adminToken` is still used (if it exists)
- This is intentional - admins should use their admin token even if they have an agent token

The **route-based role detection** (`isAdmin`/`isAgent`) is separate and used for:
- Permission checks
- UI button visibility
- Layout selection (via route in `_app.tsx`)

