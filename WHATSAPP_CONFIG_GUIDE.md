# WhatsApp Numbers Configuration Guide

## Overview
This document tracks all WhatsApp numbers used across the Zeva360 landing pages.

---

## Landing Pages

### 1. UAE Landing Page
- **URL:** `/clinic-management-system-uae`
- **WhatsApp Number:** `971502983757`
- **WhatsApp URL:** `https://wa.me/971502983757`
- **File:** `pages/clinic-management-system-uae/index.tsx`
- **Status:** ✅ Active

### 2. India Landing Page
- **URL:** `/clinic-management-system-india`
- **WhatsApp Number:** `919876543210` ⚠️ **REPLACE WITH ACTUAL NUMBER**
- **WhatsApp URL:** `https://wa.me/919876543210`
- **File:** `pages/clinic-management-system-india/index.tsx`
- **Status:** ⚠️ Needs actual India WhatsApp number

---

## Components with WhatsApp Links

### Shared Components (Default: UAE - 971502983757)

1. **Zeva360FinalCTA** (`components/landing/Zeva360FinalCTA.tsx`)
   - Has `whatsappUrl` and `whatsappNumber` props
   - Default: `971502983757`
   - India page passes custom props

2. **Zeva360Header** (`components/landing/Zeva360Header.tsx`)
   - Hardcoded: `971502983757` (2 locations)
   - Lines: 60, 100
   - **Action:** Create India-specific header component or add props

3. **LandingHeader** (`components/landing/LandingHeader.tsx`)
   - Hardcoded: `971502983757` (2 locations)
   - Lines: 72, 115
   - **Action:** Create India-specific header component or add props

4. **DemoFAQ** (`components/landing/DemoFAQ.tsx`)
   - Hardcoded: `971502983757` (1 location)
   - Line: 66
   - **Action:** Create India-specific FAQ component or add props

---

## Files to Update for India

If you want to fully support India with a different WhatsApp number, you need to either:

### Option A: Create India-Specific Component Variants
Create these files:
- `components/landing/Zeva360HeaderIndia.tsx`
- `components/landing/LandingHeaderIndia.tsx`
- `components/landing/DemoFAQIndia.tsx`

Then update `pages/clinic-management-system-india/index.tsx` to import the India variants.

### Option B: Add Props to All Components (Recommended)
Update each component to accept `whatsappUrl` and `whatsappNumber` props like `Zeva360FinalCTA`.

---

## Quick Update Instructions

### To Update India WhatsApp Number:
1. Replace `919876543210` with your actual India number in:
   - `pages/clinic-management-system-india/index.tsx` (line ~33)

### To Add Props to Other Components:
Follow the pattern used in `Zeva360FinalCTA.tsx`:

```typescript
interface ComponentProps {
  whatsappUrl?: string;
  whatsappNumber?: string;
}

const Component: React.FC<ComponentProps> = ({
  whatsappUrl = "https://wa.me/971502983757",
  whatsappNumber = "971502983757",
}) => {
  // Use whatsappUrl in href attributes
}
```

---

## Current Status

| Component | UAE Number | India Props | Status |
|-----------|-----------|-------------|--------|
| Zeva360FinalCTA | ✅ 971502983757 | ✅ Configurable | Complete |
| Zeva360Header | ✅ 971502983757 | ❌ Hardcoded | Needs update |
| LandingHeader | ✅ 971502983757 | ❌ Hardcoded | Needs update |
| DemoFAQ | ✅ 971502983757 | ❌ Hardcoded | Needs update |

---

## Notes
- Both pages share the same UI components
- UAE page uses default values (no props needed)
- India page passes custom props to `Zeva360FinalCTA`
- Other components still use hardcoded UAE numbers on both pages
- For full India support, update remaining 3 components
