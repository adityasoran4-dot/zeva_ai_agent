# Modern Appointment Scheduler Integration Guide

## Overview

The **ModernScheduler** component is a sleek, responsive appointment booking library/module designed for clinic management systems. It features a clean, minimal UI inspired by calendar-based schedulers with professional aesthetics and smooth animations.

## Features

### Core Functionality
- ✅ **Dynamic Scheduler Grid** - Time slots (30-min intervals) with doctor/room columns
- ✅ **Interactive Booking** - Click-to-book appointments with modal interface
- ✅ **Drag-and-Drop Support** - Reschedule appointments via drag-and-drop (optional)
- ✅ **Real-time Updates** - Instant refresh after booking/editing
- ✅ **Conflict Prevention** - Visual indicators for booked vs available slots
- ✅ **Multi-view Modes** - Switch between doctors, rooms, or combined view

### UI/UX Enhancements
- 🎨 **Color-coded Statuses** - Distinct colors for different appointment statuses
- 🎨 **Custom Color Picker** - Personalize status colors via settings panel
- 🎨 **Hover Tooltips** - Full appointment details on hover
- 🎨 **Smooth Animations** - Fade-in, slide-in, scale effects
- 🎨 **Soft Shadows & Rounded Cards** - Modern, professional appearance
- 🎨 **Responsive Design** - Mobile-friendly with horizontal scroll

### Advanced Filtering
- 🔍 **Patient Search** - Search by name, mobile, email, or EMR number
- 🔍 **Doctor Filter** - Filter appointments by specific doctor
- 🔍 **Room Filter** - Filter by examination room/facility
- 🔍 **Status Filter** - Filter by appointment status (booked, cancelled, etc.)
- 🔍 **Clear All Filters** - One-click reset

## Component Structure

```
ModernScheduler
├── SchedulerHeader
│   ├── Clinic Name & Logo
│   ├── Date Picker & Navigation
│   ├── Action Buttons (Book, Import, Colors)
│
├── FiltersBar
│   ├── Search Input
│   ├── Doctor Dropdown
│   ├── Room Dropdown
│   ├── Status Dropdown
│
├── Scheduler Grid
│   ├── Time Column (9 AM - 8 PM)
│   ├── Doctor/Room Columns
│   └── Appointment Cells
│       ├── AppointmentCard (if booked)
│       └── Empty Slot Indicator (if available)
│
├── BookingModalWrapper
│   └── Integration with existing AppointmentBookingModal
│
└── ColorSettingsPanel
    ├── Status Color Customization
    └── Save/Reset Buttons
```

## Usage Example

### Basic Integration

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-100 p-6">
      <ModernScheduler
        clinicId="your-clinic-id"
        initialDate={new Date().toISOString().split("T")[0]}
        viewMode="both" // "doctors" | "rooms" | "both"
        getAuthHeaders={getAuthHeaders}
        enableDragDrop={true}
        showColorSettings={true}
        onBookAppointment={(appointment) => {
          console.log("New appointment booked:", appointment);
        }}
        onEditAppointment={(appointment) => {
          console.log("Editing appointment:", appointment);
        }}
      />
    </div>
  );
}
```

### Integration with Workflow Guide

To integrate the modern scheduler into your workflow guide page (`/clinic/workflow-guide`), replace the "Patients & Appointments" section with:

```tsx
import { ModernScheduler } from "@/components/clinic/ModernScheduler";

// In your workflow guide component
{activeSection === "appointment" && (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <Calendar className="w-8 h-8 text-teal-600" />
      <h2 className="text-2xl font-bold text-gray-900">
        Modern Appointment Scheduler
      </h2>
    </div>
    
    <ModernScheduler
      clinicId={clinicId}
      getAuthHeaders={getAuthHeaders}
      viewMode="both"
      enableDragDrop={true}
      showColorSettings={true}
    />
  </div>
)}
```

## Props Reference

### ModernSchedulerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `clinicId` | `string` | ✅ Yes | - | Unique clinic identifier |
| `initialDate` | `string` | ❌ No | Today | Initial selected date (YYYY-MM-DD) |
| `viewMode` | `"doctors" \| "rooms" \| "both"` | ❌ No | `"both"` | Display mode for columns |
| `getAuthHeaders` | `() => Record<string, string>` | ✅ Yes | - | Function to retrieve auth headers |
| `enableDragDrop` | `boolean` | ❌ No | `true` | Enable drag-to-book functionality |
| `showColorSettings` | `boolean` | ❌ No | `false` | Show color customization panel |
| `onBookAppointment` | `(appointment: Partial<Appointment>) => void` | ❌ No | - | Callback when appointment is booked |
| `onEditAppointment` | `(appointment: Appointment) => void` | ❌ No | - | Callback when editing appointment |

## API Endpoints Used

The component integrates with existing ZEVA APIs:

- `GET /api/clinic/appointment-data` - Fetch clinic data, doctors, rooms, appointments
- `POST /api/clinic/appointments` - Book new appointment (via BookingModal)
- `PUT /api/clinic/appointments/:id` - Update appointment (via EditModal)

## Customization

### Status Colors

Default status colors can be customized via the Color Settings panel:

```typescript
const DEFAULT_STATUS_COLORS = {
  booked: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },
  arrived: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
  cancelled: { bg: "#fce7f3", text: "#9f1239", border: "#ec4899" },
  completed: { bg: "#e0f2fe", text: "#075985", border: "#06b6d4" },
  consultation: { bg: "#f5d0fe", text: "#86198f", border: "#d946ef" },
  waiting: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },
};
```

### Time Slot Configuration

Time slots are automatically generated from clinic timings parsed from the database. Default is 9:00 AM to 5:00 PM with 30-minute intervals.

```typescript
const SLOT_INTERVAL_MINUTES = 30; // Configurable
const ROW_HEIGHT_PX = 48; // Row height in pixels
```

## Styling

The component uses Tailwind CSS with custom gradients and animations:

- **Gradients**: Blue to purple theme
- **Shadows**: Soft, multi-layer shadows for depth
- **Animations**: `fade-in`, `slide-in-from-bottom-2`, `scale-[1.02]`
- **Dark Mode**: Full dark mode support with `dark:` variants

## Performance Optimizations

- ✅ **Memoized Filters** - `useCallback` for filter functions
- ✅ **Conditional Rendering** - Only render visible appointments
- ✅ **Debounced Search** - Prevents excessive re-renders
- ✅ **Lazy Loading** - Appointments load on demand

## Browser Compatibility

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML structure
- ARIA labels for buttons
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Future Enhancements

- [ ] Drag-and-drop rescheduling
- [ ] Recurring appointments
- [ ] Multi-day view
- [ ] Print/PDF export
- [ ] Real-time notifications
- [ ] Telemedicine integration
- [ ] Patient self-booking portal

## Troubleshooting

### Issue: Appointments not loading
**Solution**: Check auth token validity and API endpoint response

### Issue: Color picker not showing
**Solution**: Ensure `showColorSettings={true}` prop is set

### Issue: Drag selection not working
**Solution**: Verify `enableDragDrop={true}` and check browser compatibility

## Support

For issues or feature requests, please contact the development team or create an issue in the project repository.

---

**Version**: 1.0.0  
**Last Updated**: April 1, 2026  
**Author**: ZEVA Development Team
