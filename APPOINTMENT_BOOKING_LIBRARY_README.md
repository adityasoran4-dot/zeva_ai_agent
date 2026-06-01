# 🏥 Modern Appointment Booking Library

A **modern, responsive appointment booking library/module** for clinic management systems featuring a clean and minimal UI inspired by calendar-based schedulers.

![Modern Scheduler](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)

## ✨ Features

### 🎯 Core Functionality

- **📅 Calendar-Based Scheduler Grid**
  - Time slots from 9:00 AM to 8:00 PM (configurable)
  - 30-minute intervals (customizable)
  - Doctor and room columns
  - Responsive horizontal scroll

- **🖱️ Interactive Booking**
  - Click-to-book appointments
  - Drag-to-select time ranges
  - Real-time availability updates
  - Conflict prevention

- **🎨 Beautiful UI/UX**
  - Clean, minimal design
  - Soft shadows & rounded cards
  - Smooth animations (fade-in, slide-in, scale)
  - Gradient headers and accents
  - Hover tooltips with full details
  - Color-coded statuses

- **🔍 Advanced Filtering**
  - Patient search (name, mobile, email, EMR)
  - Filter by doctor
  - Filter by room
  - Filter by status
  - One-click clear all

- **⚙️ Customization**
  - Custom status colors
  - Multiple view modes (doctors, rooms, both)
  - Configurable time slots
  - Theme support (light/dark)

### 🚀 Technical Highlights

- **TypeScript** - Full type safety
- **React Hooks** - Modern React patterns
- **Tailwind CSS** - Utility-first styling
- **Axios** - API integration
- **Lucide Icons** - Beautiful, consistent icons
- **Modal Portal** - Accessible modals
- **Error Handling** - Graceful error states

## 📦 Installation

The library is located in your components folder:

```
ZEVA/components/clinic/ModernScheduler.tsx
```

No additional installation required - it uses existing ZEVA dependencies:
- React 18+
- TypeScript 5+
- Tailwind CSS
- Lucide React
- Axios

## 📖 Quick Start

### Basic Usage

```tsx
import { ModernScheduler } from "@/components/clinic/ModernScheduler";

export default function AppointmentPage() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("clinicToken");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return (
    <ModernScheduler
      clinicId="your-clinic-id"
      initialDate={new Date().toISOString().split("T")[0]}
      viewMode="both"
      getAuthHeaders={getAuthHeaders}
      enableDragDrop={true}
      showColorSettings={true}
      onBookAppointment={(apt) => console.log("Booked:", apt)}
      onEditAppointment={(apt) => console.log("Edit:", apt)}
    />
  );
}
```

### Integration with Workflow Guide

Navigate to `/clinic/workflow-guide` and click on **"Patients & Appointments"** → **"Book Appointments"** to see the scheduler in action within the workflow context.

Or visit the dedicated demo page at `/clinic/modern-scheduler-demo` for a full-screen experience.

## 🎯 Component Architecture

```
ModernScheduler
│
├── SchedulerHeader
│   ├── Clinic branding
│   ├── Date navigation
│   └── Action buttons
│
├── FiltersBar
│   ├── Search input
│   ├── Doctor filter
│   ├── Room filter
│   └── Status filter
│
├── Scheduler Grid
│   ├── Time column
│   ├── Doctor/Room columns
│   └── Appointment cells
│       ├── AppointmentCard
│       └── Empty slot indicator
│
├── BookingModalWrapper
│   └── Appointment booking form
│
└── ColorSettingsPanel
    ├── Status color picker
    └── Save/Reset controls
```

## 🎨 UI Components

### Header Section

```
┌─────────────────────────────────────────────────────┐
│ 🏛️ Clinic Name          [<] [Date Picker] [>]      │
│ Appointment Schedule                                 │
│                               [Import] [Colors] [+] │
└─────────────────────────────────────────────────────┘
```

### Filters Bar

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Search patients... [Doctor ▼] [Room ▼] [Status▼]│
│                                      [Clear All]    │
└─────────────────────────────────────────────────────┘
```

### Scheduler Grid

```
┌─────────┬──────────┬──────────┬──────────┐
│ Time    │ Dr. Smith│ Dr. Jones│ Room 101 │
├─────────┼──────────┼──────────┼──────────┤
│ 9:00 AM │ [Patient │    +     │ [Patient │
│         │  Card]   │          │  Card]   │
├─────────┼──────────┼──────────┼──────────┤
│ 9:30 AM │    +     │ [Patient │    +     │
│         │          │  Card]   │          │
├─────────┼──────────┼──────────┼──────────┤
│ 10:00 AM│ [Patient │    +     │ [Patient │
│         │  Card]   │          │  Card]   │
└─────────┴──────────┴──────────┴──────────┘
```

### Appointment Card

```
┌────────────────────────────┐
│ 👤 John Doe                │
│ EMR: 12345                 │
│ Follow-up • Booked         │
└────────────────────────────┘
```

## 📋 Props Reference

### ModernSchedulerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `clinicId` | `string` | ✅ Yes | - | Unique clinic identifier |
| `initialDate` | `string` | ❌ No | Today | Initial date (YYYY-MM-DD) |
| `viewMode` | `"doctors"` \| `"rooms"` \| `"both"` | ❌ No | `"both"` | Column display mode |
| `getAuthHeaders` | `() => Record<string, string>` | ✅ Yes | - | Auth headers getter |
| `enableDragDrop` | `boolean` | ❌ No | `true` | Enable drag-to-book |
| `showColorSettings` | `boolean` | ❌ No | `false` | Show color panel |
| `onBookAppointment` | `(appointment) => void` | ❌ No | - | Book callback |
| `onEditAppointment` | `(appointment) => void` | ❌ No | - | Edit callback |

## 🎨 Status Colors

Default color scheme:

```typescript
const DEFAULT_STATUS_COLORS = {
  booked: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },      // Blue
  arrived: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },     // Green
  cancelled: { bg: "#fce7f3", text: "#9f1239", border: "#ec4899" },   // Pink/Red
  completed: { bg: "#e0f2fe", text: "#075985", border: "#06b6d4" },   // Cyan
  consultation: { bg: "#f5d0fe", text: "#86198f", border: "#d946ef" },// Purple
  waiting: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },     // Orange
};
```

## 🔧 Customization Examples

### Custom Time Slots

Modify constants in `ModernScheduler.tsx`:

```typescript
const SLOT_INTERVAL_MINUTES = 15; // Change interval
const ROW_HEIGHT_PX = 56; // Adjust row height
```

### Custom Status Color

Add custom colors via the Color Settings panel or programmatically:

```typescript
const customColors = {
  urgent: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
  checkup: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
};
```

## 📱 Responsive Design

The scheduler is fully responsive:

- **Desktop**: Full grid with all columns visible
- **Tablet**: Horizontal scroll for columns
- **Mobile**: Optimized single-column view with swipe

### Breakpoints

```css
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
```

## ⚡ Performance

- **Lazy Loading**: Appointments load on demand
- **Memoization**: `useCallback` for filters
- **Conditional Rendering**: Only visible items render
- **Debounced Search**: Prevents excessive updates

### Optimization Tips

1. Limit date range for large datasets
2. Use filters to reduce rendered appointments
3. Enable virtual scrolling for 1000+ slots

## 🔒 Security

- Authentication required via tokens
- Role-based access control
- Input sanitization
- XSS protection

## 🐛 Troubleshooting

### Issue: Scheduler not loading

**Solution:**
```javascript
// Check console for errors
// Verify auth token exists
console.log(localStorage.getItem("clinicToken"));
```

### Issue: Appointments not showing

**Solution:**
```javascript
// Verify API response
// Check date format (YYYY-MM-DD)
// Ensure appointments match selected date
```

### Issue: Colors not customizing

**Solution:**
```javascript
// Clear localStorage and try again
localStorage.removeItem("appointmentStatusColors");
location.reload();
```

## 📚 API Integration

### Required Endpoints

```typescript
GET  /api/clinic/appointment-data
// Returns: clinic, doctors, rooms, appointments

POST /api/clinic/appointments
// Creates new appointment

PUT  /api/clinic/appointments/:id
// Updates existing appointment
```

### Response Format

```json
{
  "success": true,
  "clinic": { "_id": "...", "name": "...", "timings": "..." },
  "doctorStaff": [{ "_id": "...", "name": "...", "email": "..." }],
  "rooms": [{ "_id": "...", "name": "..." }],
  "appointments": [...]
}
```

## 🎓 Learning Resources

- [Integration Guide](./MODERN_SCHEDULER_INTEGRATION.md)
- [Demo Page](./pages/clinic/modern-scheduler-demo.tsx)
- [Component Source](./components/clinic/ModernScheduler.tsx)

## 🗺️ Roadmap

- [ ] Drag-and-drop rescheduling
- [ ] Recurring appointments
- [ ] Multi-day/week view
- [ ] Print/PDF export
- [ ] SMS/Email notifications
- [ ] Patient self-booking portal
- [ ] Analytics dashboard
- [ ] Mobile app version

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch
3. Write tests
4. Submit pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For questions or issues:
- Check documentation
- Review troubleshooting guide
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: April 1, 2026  
**Author**: ZEVA Development Team  
**Status**: Production Ready ✅
