// Single source of truth for Appointment.status options (must match backend enum values exactly)
export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "booked", label: "Booked" },
  { value: "enquiry", label: "Enquiry" },
  { value: "Discharge", label: "Discharge" },
  { value: "Arrived", label: "Arrived" },
  { value: "Consultation", label: "Consultation" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Approved", label: "Approved" },
  { value: "Rescheduled", label: "Rescheduled" },
  { value: "Waiting", label: "Waiting" },
  { value: "Rejected", label: "Rejected" },
  { value: "Completed", label: "Completed" },
  { value: "invoice", label: "Invoiced" },
  { value: "No Show", label: "No Show" },
];


