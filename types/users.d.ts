export type User = {
  _id: string;
  name: string;
  phone?: string;
  email: string;
  password?: string;
  role:
    | "user"
    | "clinic"
    | "admin"
    | "doctor"
    | "lead"
    | "agent"
    | "staff"
    | "doctorStaff";
  gender?: "male" | "female" | "other" | null;
  dateOfBirth?: Date | string | null;
  age?: number | null;
  clinicId?: string | null;
  createdBy?: string | null;
  isApproved: boolean;
  declined: boolean;
  eodNotes?: Array<{
    note: string;
    createdAt: Date | string;
  }>;
  passwordChangedAt?: Date | string | null;
  isActive?: boolean; // Consider adding this if needed
  teamId?: string; // Consider adding this if needed
  createdAt: string;
  updatedAt: string;
};
