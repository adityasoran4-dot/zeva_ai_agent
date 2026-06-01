export type Lead = {
  _id: string;
  clinicId: string;
  name: string;
  phone: string;
  email?: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  treatments: [{ treatment: string; subTreatment: string }];
  source:
    | "Instagram"
    | "Facebook"
    | "Google"
    | "WhatsApp"
    | "Walk-in"
    | "Other";
  customSource: string;
  offerTag: string;
  status:
    | "New"
    | "Contacted"
    | "Booked"
    | "Visited"
    | "Follow-up"
    | "Not Interested"
    | "Other";
  customStatus: string;
  notes: [
    {
      text: string;
      addedBy: string;
      createdAt: string;
    }
  ];
  assignedTo: [
    {
      user: string;
      assignedAt: string;
    }
  ];
  followUps: [{ date: string }];
  newFollowUps: [{ date: string }];
  segments: string[];
  createdAt: string;
  updatedAt: string;
};
