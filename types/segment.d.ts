export type Segment = {
  _id: string;
  clinicId: string;
  name: string;
  description: string;
  leads: string[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};
