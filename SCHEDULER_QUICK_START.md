# 🚀 Modern Scheduler - Quick Start Guide

Get up and running with the Modern Appointment Scheduler in 5 minutes!

---

## ⚡ Super Quick Start (1 Minute)

### Step 1: Import Component

```tsx
import { ModernScheduler } from "@/components/clinic/ModernScheduler";
```

### Step 2: Add to Page

```tsx
export default function AppointmentsPage() {
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("clinicToken")}`,
  });

  return <ModernScheduler
    clinicId="your-clinic-id"
    getAuthHeaders={getAuthHeaders}
  />;
}
```

### Step 3: Done! ✅

Navigate to your page and see the beautiful scheduler in action!

---

## 🎯 Common Use Cases

### Use Case 1: Replace Existing Appointment Page

```tsx
// pages/clinic/appointments.tsx
import { ModernScheduler } from "@/components/clinic/ModernScheduler";

export default function AppointmentsPage() {
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getStoredToken()}`,
  });

  return (
    <ClinicLayout>
      <div className="p-6 bg-gray-50 dark:bg-gray-100 min-h-screen">
        <ModernScheduler
          clinicId={clinic._id}
          initialDate={new Date().toISOString().split("T")[0]}
          viewMode="both"
          getAuthHeaders={getAuthHeaders}
          enableDragDrop={true}
          showColorSettings={true}
          onBookAppointment={() => {
            // Refresh appointments after booking
            loadAppointments();
          }}
        />
      </div>
    </ClinicLayout>
  );
}
```

### Use Case 2: Add to Workflow Guide

```tsx
// In your workflow-guide.tsx
{activeSection === "appointment" && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Book Appointments</h2>
    <ModernScheduler
      clinicId={clinicId}
      getAuthHeaders={getAuthHeaders}
      viewMode="both"
    />
  </div>
)}
```

### Use Case 3: Demo/Showcase Page

```tsx
// Already created at: pages/clinic/modern-scheduler-demo.tsx
// Just navigate to /clinic/modern-scheduler-demo
```

---

## 📋 Props Cheat Sheet

| Prop | Required | Default | Example |
|------|----------|---------|---------|
| `clinicId` | ✅ Yes | - | `"clinic-123"` |
| `getAuthHeaders` | ✅ Yes | - | `() => ({ Authorization: "Bearer token" })` |
| `initialDate` | ❌ No | Today | `"2026-04-01"` |
| `viewMode` | ❌ No | `"both"` | `"doctors"` \| `"rooms"` \| `"both"` |
| `enableDragDrop` | ❌ No | `true` | `false` |
| `showColorSettings` | ❌ No | `false` | `true` |
| `onBookAppointment` | ❌ No | - | `(apt) => console.log(apt)` |
| `onEditAppointment` | ❌ No | - | `(apt) => editAppointment(apt)` |

---

## 🎨 Customization Quick Tips

### Change Time Slot Interval

Edit `ModernScheduler.tsx`:

```typescript
const SLOT_INTERVAL_MINUTES = 15; // Was 30
```

### Change Row Height

```typescript
const ROW_HEIGHT_PX = 56; // Was 48
```

### Add Custom Status Color

Via Color Settings Panel or programmatically:

```typescript
const customColors = {
  urgent: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
};
```

### Change Operating Hours

Hours are parsed from clinic timings automatically. To override, modify the `parseTimings` function.

---

## 🔧 Troubleshooting Quick Fixes

### Issue: "Cannot read property 'clinic' of null"

**Fix:** Check auth token
```javascript
console.log(localStorage.getItem("clinicToken"));
// Should not be null
```

### Issue: No appointments showing

**Fix:** Verify date format
```typescript
// Must be YYYY-MM-DD
initialDate="2026-04-01" // ✅ Correct
initialDate="04-01-2026" // ❌ Wrong
```

### Issue: Filters not working

**Fix:** Clear filter state
```typescript
// Click "Clear All" button
// Or refresh page
```

### Issue: Modal not opening

**Fix:** Check permissions
- Ensure user has appointment booking permissions
- Check browser console for errors

---

## 📱 Responsive Testing

### Desktop (1920px)
Full grid visible with all columns

### Tablet (768px)
Horizontal scroll enabled for columns

### Mobile (375px)
Optimized single-column view

Test it:
```javascript
// Chrome DevTools → Toggle Device Toolbar
// Select: iPhone 12 Pro or iPad Pro
```

---

## 🎯 Feature Highlights

### What Can Users Do?

1. **View Schedule**: See all appointments in calendar view
2. **Book Appointments**: Click empty slot → Fill form → Book
3. **Filter**: Search by patient, doctor, room, or status
4. **Customize**: Change status colors via settings panel
5. **Navigate**: Move between dates with arrows or date picker
6. **Hover Details**: Hover over any card for full information

### What Can Developers Do?

1. **Integrate**: Drop component into any page
2. **Customize**: Modify colors, intervals, views
3. **Extend**: Add new features to component
4. **Monitor**: Check console for debug logs
5. **Optimize**: Adjust performance settings

---

## 📊 Performance Tips

### For Large Datasets (1000+ appointments)

1. Use filters to limit displayed appointments
2. Enable virtual scrolling (future feature)
3. Limit date range navigation
4. Implement server-side pagination

### For Smooth Animations

```css
/* Already optimized in component */
- Will-change CSS property used
- GPU acceleration enabled
- Minimal re-renders
```

---

## 🎓 Learning Path

### Beginner
1. Read this quick start guide
2. Try the demo page
3. Integrate into a test page

### Intermediate
1. Read integration guide
2. Customize colors and layout
3. Add custom callbacks

### Advanced
1. Study component source code
2. Add new features
3. Contribute to project

---

## 🔗 Quick Links

- **Demo Page**: `/clinic/modern-scheduler-demo`
- **Component**: `components/clinic/ModernScheduler.tsx`
- **Integration Guide**: `MODERN_SCHEDULER_INTEGRATION.md`
- **Visual Showcase**: `SCHEDULER_VISUAL_SHOWCASE.md`
- **README**: `APPOINTMENT_BOOKING_LIBRARY_README.md`

---

## ✅ Pre-Flight Checklist

Before going live, ensure:

- [ ] Auth token is valid
- [ ] API endpoints are accessible
- [ ] Clinic data exists in database
- [ ] Doctors and rooms are configured
- [ ] User has appropriate permissions
- [ ] Browser is up to date
- [ ] Console shows no errors

---

## 🆘 Getting Help

### Step 1: Check Console
Open browser DevTools (F12) and look for errors

### Step 2: Review Documentation
Check the integration guide or README

### Step 3: Inspect Network Tab
Verify API calls are successful (status 200)

### Step 4: Test in Demo Page
Try `/clinic/modern-scheduler-demo` first

---

## 🎉 You're Ready!

That's it! You now have everything you need to use the Modern Scheduler.

**Remember:**
- Start simple with basic props
- Gradually add customization
- Test in demo page first
- Check docs when stuck

Happy scheduling! 📅✨

---

**Last Updated**: April 1, 2026  
**Difficulty**: ⭐ Easy  
**Time Required**: 5 minutes
