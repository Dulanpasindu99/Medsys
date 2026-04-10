export interface PatientTimelineEntry {
  id?: string;
  date: string;
  title: string;
  description: string;
  kind?: "bp" | "general" | "checkup";
  tags?: string[];
  value?: string;
  reason?: string;
  diagnoses?: string[];
  tests?: string[];
  drugs?: string[];
}

export interface PatientVitalEntry {
  id?: string;
  recordedAt: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperatureC?: string;
  spo2?: number;
}

export interface PatientAllergyEntry {
  id?: string;
  name: string;
  severity: "Low" | "Medium" | "High";
  severityKey: "low" | "moderate" | "high";
  pill: string;
  dot: string;
}

export interface FamilyProfile {
  assigned: boolean;
  name: string;
  members: string[];
}

export interface PatientProfileRecord {
  id: string;
  name: string;
  patientCode: string;
  firstName?: string;
  lastName?: string;
  nic: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianNic?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  address?: string;
  bloodGroup?: string;
  familyId?: number;
  family: FamilyProfile;
  conditions: string[];
  allergies: PatientAllergyEntry[];
  vitals: PatientVitalEntry[];
  firstSeen: string;
  timeline: PatientTimelineEntry[];
}
