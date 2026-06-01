# 🎨 Modern Scheduler - Visual Design Showcase

A comprehensive visual guide to the Modern Appointment Scheduler component.

## 📸 Component Screenshots

### 1. Full Scheduler View (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏛️ ZEVA Medical Center        [<] April 1, 2026 [>]    [📥 Import]     │ │
│ │ Appointment Schedule                                      [🎨 Colors]   │ │
│ │                                                      [➕ Book Appointment]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search patients...  [Dr. Smith ▼] [Room 101▼] [Status▼] [Clear All] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌──────────┬──────────────┬──────────────┬──────────────┐                  │
│ │ Time     │ Dr. John     │ Dr. Sarah    │ Room 101     │                  │
│ │          │ Smith        │ Jones        │              │                  │
│ ├──────────┼──────────────┼──────────────┼──────────────┤                  │
│ │ 9:00 AM  │ ┌──────────┐ │      +       │ ┌──────────┐ │                  │
│ │          │ │👤 Jane D.│ │              │ │👤 Mike R.│ │                  │
│ │          │ │ EMR:12345│ │              │ │ EMR:67890│ │                  │
│ │          │ │ Follow-up│ │              │ │ First    │ │                  │
│ │          │ │ 💙 Booked│ │              │ │ 💚 Arrived│ │                 │
│ │          │ └──────────┘ │              │ └──────────┘ │                  │
│ ├──────────┼──────────────┼──────────────┼──────────────┤                  │
│ │ 9:30 AM  │      +       │ ┌──────────┐ │      +       │                  │
│ │          │              │ │👤 Tom H. │ │              │                  │
│ │          │              │ │ EMR:11111│ │              │                  │
│ │          │              │ │ Checkup  │ │              │                  │
│ │          │              │ │ 💜 Consult│ │             │                  │
│ │          │              │ └──────────┘ │              │                  │
│ ├──────────┼──────────────┼──────────────┼──────────────┤                  │
│ │ 10:00 AM │ ┌──────────┐ │      +       │ ┌──────────┐ │                  │
│ │          │ │👤 Amy W. │ │              │ │👤 Bob K. │ │                  │
│ │          │ │ EMR:22222│ │              │ │ EMR:33333│ │                  │
│ │          │ │ New      │ │              │ │ Follow-up│ │                  │
│ │          │ │ 🧡 Waiting│ │             │ │ 💙 Booked│ │                  │
│ │          │ └──────────┘ │              │ └──────────┘ │                  │
│ ├──────────┼──────────────┼──────────────┼──────────────┤                  │
│ │ 10:30 AM │      +       │      +       │      +       │                  │
│ ├──────────┼──────────────┼──────────────┼──────────────┤                  │
│ │ 11:00 AM │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │                  │
│ │          │ │👤 Lisa M.│ │ │👤 David L│ │ │👤 Emma S.│ │                  │
│ │          │ │ EMR:44444│ │ │ EMR:55555│ │ │ EMR:66666│ │                  │
│ │          │ │ Emergency│ │ │ Completed│ │ │ ❌ Cancel│ │                  │
│ │          │ │ ❤️ Urgent│ │ │ ✅ Done  │ │ │ 🔴 Cancel│ │                  │
│ │          │ └──────────┘ │ └──────────┘ │ └──────────┘ │                  │
│ └──────────┴──────────────┴──────────────┴──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Appointment Card Hover Tooltip

```
                    ┌────────────────────────────────────┐
                    │ 💙 BOOKED                          │
                    ├────────────────────────────────────┤
                    │                                    │
                    │ 👤 Jane Doe                        │
                    │                                    │
                    │ 📱 +1 (555) 123-4567              │
                    │ 📧 jane.doe@email.com             │
                    │ 👩 Female                          │
                    │ 📄 EMR: 12345                      │
                    │                                    │
                    │ ─────────────────────────────────  │
                    │                                    │
                    │ 🩺 Dr. John Smith                  │
                    │ 🏥 Room 101                        │
                    │ ⏰ 9:00 AM - 9:30 AM              │
                    │ 💳 Invoice: INV-2026-001          │
                    │                                    │
                    │ ─────────────────────────────────  │
                    │                                    │
                    │ "Patient needs follow-up for       │
                    │  routine checkup"                  │
                    │                                    │
                    └────────────────────────────────────┘
```

### 3. Color Settings Panel

```
┌──────────────────────────────────────┐
│ Status Colors                ✕      │
├──────────────────────────────────────┤
│                                      │
│ Booked                               │
│ Background: [███ #dbeafe]           │
│ Text:       [███ #1e40af]           │
│ Border:     [███ #3b82f6]           │
│                                      │
│ Arrived                              │
│ Background: [███ #d1fae5]           │
│ Text:       [███ #065f46]           │
│ Border:     [███ #10b981]           │
│                                      │
│ Cancelled                            │
│ Background: [███ #fce7f3]           │
│ Text:       [███ #9f1239]           │
│ Border:     [███ #ec4899]           │
│                                      │
│ Completed                            │
│ Background: [███ #e0f2fe]           │
│ Text:       [███ #075985]           │
│ Border:     [███ #06b6d4]           │
│                                      │
│ Consultation                         │
│ Background: [███ #f5d0fe]           │
│ Text:       [███ #86198f]           │
│ Border:     [███ #d946ef]           │
│                                      │
│ Waiting                              │
│ Background: [███ #fef3c7]           │
│ Text:       [███ #92400e]           │
│ Border:     [███ #f59e0b]           │
│                                      │
├──────────────────────────────────────┤
│ [Reset]                    [Save]    │
└──────────────────────────────────────┘
```

### 4. Booking Modal (Click Empty Slot)

```
┌─────────────────────────────────────────────────────┐
│ 📅 Book Appointment                           ✕     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Selected Doctor: Dr. John Smith ✓ Verified         │
│ Departments: Cardiology, Internal Medicine          │
│                                                     │
│ Room *               Doctor *          Status *     │
│ [Room 101 ▼]        [Dr. Smith ▼]     [Booked ▼]   │
│                                                     │
│ Search Patient *                                    │
│ [🔍 Type to search patients...]                    │
│                                                     │
│ [+ Add New Patient]                                 │
│                                                     │
│ Follow Type *        Emergency                      │
│ [First Time ▼]      [No ▼]                         │
│                                                     │
│ Start Date *         From Time *   To Time *       │
│ [2026-04-01]        [09:00]       [09:30]         │
│                                                     │
│ Notes (Optional)                                    │
│ ┌─────────────────────────────────────────────┐    │
│ │ Add any additional notes...                 │    │
│ │                                             │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Cancel]                        [Book Appointment]  │
└─────────────────────────────────────────────────────┘
```

### 5. Mobile Responsive View

```
┌─────────────────────────────────┐
│ 🏛️ ZEVA Medical Center         │
│ April 1, 2026                   │
│ [<]      [Today]      [>]       │
│                                 │
│ [📥 Import] [🎨 Colors] [+]     │
├─────────────────────────────────┤
│ 🔍 Search patients...           │
│ [Dr. Smith ▼] [Status▼]         │
├─────────────────────────────────┤
│ 9:00 AM                         │
│ ┌─────────────────────────────┐ │
│ │ Dr. John Smith              │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │👤 Jane Doe              │ │ │
│ │ │ EMR: 12345              │ │ │
│ │ │ Follow-up • Booked      │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 9:30 AM                         │
│ ┌─────────────────────────────┐ │
│ │ Dr. Sarah Jones             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │👤 Tom Harris            │ │ │
│ │ │ EMR: 11111              │ │ │
│ │ │ Checkup • Consultation  │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 10:00 AM                        │
│ ┌─────────────────────────────┐ │
│ │ Room 101                    │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │👤 Mike Roberts           │ │ │
│ │ │ EMR: 67890              │ │ │
│ │ │ First • Arrived         │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🎨 Color Palette

### Primary Gradient
```
from-blue-600 via-purple-600 to-blue-600
```

### Status Colors

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Booked | `#dbeafe` | `#1e40af` | `#3b82f6` |
| Arrived | `#d1fae5` | `#065f46` | `#10b981` |
| Cancelled | `#fce7f3` | `#9f1239` | `#ec4899` |
| Completed | `#e0f2fe` | `#075985` | `#06b6d4` |
| Consultation | `#f5d0fe` | `#86198f` | `#d946ef` |
| Waiting | `#fef3c7` | `#92400e` | `#f59e0b` |

### UI Elements

```
Header Gradient: from-blue-50 via-white to-purple-50
Card Background: #ffffff (light), #f9fafb (dark)
Border Color: #e5e7eb (light), #d1d5db (dark)
Text Primary: #111827
Text Secondary: #6b7280
```

## 🎭 Animation Effects

### Entrance Animations

```css
/* Fade In */
animate-in fade-in duration-300

/* Slide In From Bottom */
animate-in slide-in-from-bottom-4 duration-300

/* Zoom In */
zoom-in-95

/* Scale on Hover */
hover:scale-[1.02] active:scale-[0.98]
```

### Interactive States

```css
/* Button Hover */
hover:bg-gray-50 hover:shadow-md hover:scale-105

/* Card Hover */
hover:shadow-lg hover:border-blue-300

/* Input Focus */
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

## 📐 Layout Specifications

### Grid Dimensions

```typescript
ROW_HEIGHT_PX = 48           // Each time slot row height
SLOT_INTERVAL_MINUTES = 30   // Time between slots
COLUMN_MIN_WIDTH = 180px     // Minimum column width
TIME_COLUMN_WIDTH = 96px     // Time label column
```

### Spacing System

```
p-4 = 16px padding
p-6 = 24px padding
gap-2 = 8px gap
gap-4 = 16px gap
```

### Typography

```
Header: text-lg font-bold
Subheader: text-xs text-gray-500
Card Title: text-sm font-semibold
Card Body: text-xs
Tooltip: text-[10px]
```

## 🖼️ Icon Usage

All icons from Lucide React:

```typescript
Calendar      // Date & scheduling
Clock         // Time slots
Users         // Patients & doctors
Building2     // Clinic/rooms
Plus          // Add new
Upload        // Import
Settings      // Color settings
Search        // Search patients
Filter        // Filter options
X            // Close/cancel
Check        // Success/confirm
User         // Patient profile
Mail         // Email
Phone        // Phone number
FileText     // EMR/records
Stethoscope  // Doctor
CreditCard   // Invoice/billing
AlertCircle  // Errors/warnings
```

## 🌙 Dark Mode Support

Full dark mode theming with `dark:` variants:

```css
/* Light Mode */
bg-white text-gray-900 border-gray-200

/* Dark Mode */
dark:bg-gray-50 dark:text-gray-900 dark:border-gray-300
```

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Small tablets - adjust spacing */
md: 768px   /* Tablets - enable horizontal scroll */
lg: 1024px  /* Laptops - full grid */
xl: 1280px  /* Desktops - max width */
```

## 🎯 Accessibility Features

- ✅ Semantic HTML structure
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators (ring-2)
- ✅ Screen reader friendly
- ✅ High contrast ratios
- ✅ Touch-friendly targets (min 44px)

## 📊 Performance Metrics

### Load Times (Expected)

```
Initial Render: < 100ms
Data Fetch: < 500ms
Slot Click: < 50ms
Modal Open: < 100ms
Filter Change: Instant
```

### Bundle Size

```
Component: ~35KB (minified)
Dependencies: Already in ZEVA
Total Impact: Minimal
```

---

**Last Updated**: April 1, 2026  
**Design System**: ZEVA Modern UI  
**Version**: 1.0.0
