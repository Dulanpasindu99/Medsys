export interface PatientTimelineEntry {
  date: string;
  title: string;
  description: string;
  kind?: "bp" | "general" | "checkup";
  tags?: string[];
  value?: string;
}

export interface FamilyProfile {
  assigned: boolean;
  name: string;
  members: string[];
}

export interface PatientProfileRecord {
  id: string;
  name: string;
  nic: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  family: FamilyProfile;
  conditions: string[];
  allergies: string[];
  firstSeen: string;
  timeline: PatientTimelineEntry[];
}
