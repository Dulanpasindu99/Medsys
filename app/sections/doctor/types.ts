import type { ClinicalDrug } from "../../data/diagnosisMapping";

export type AppointmentLifecycleStatus =
  | "waiting"
  | "in_consultation"
  | "completed"
  | "cancelled";

export type Patient = {
  patientId?: number;
  appointmentId?: number;
  doctorId?: number;
  appointmentStatus?: AppointmentLifecycleStatus;
  queueOrder?: number;
  familyId?: number;
  name: string;
  patientCode: string;
  nic: string;
  phone?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianNic?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  time: string;
  reason: string;
  age: number;
  gender: string;
  profileId?: string;
};

export type PatientGender = "Male" | "Female" | "Unspecified";
export type GuardianCaptureMode = "quick" | "draft";

export type FamilyOption = {
  id: number;
  name: string;
  familyCode?: string;
};

export type ClinicalDiagnosisOption = {
  code: string;
  codeSystem: string;
  display: string;
};

export type ClinicalDiagnosisSelection = ClinicalDiagnosisOption & {
  persistAsCondition?: boolean;
};

export type ClinicalTestOption = {
  code: string;
  codeSystem: string;
  display: string;
  category?: string | null;
};

export type PatientVital = {
  label: string;
  value: string;
  observedAt?: string;
};

export type AllergyAlert = {
  name: string;
  severity: string;
  severityKey: "low" | "moderate" | "high";
  dot: string;
  pill: string;
};

export type DrugDoseUnit =
  | "mg"
  | "ml"
  | "mcg"
  | "g"
  | "tablet"
  | "capsule"
  | "drops"
  | "puffs"
  | "sachet";

export type DrugFrequencyCode =
  | "OD"
  | "BD"
  | "TDS"
  | "QID"
  | "Q4H"
  | "Q6H"
  | "Q8H"
  | "HS"
  | "STAT"
  | "PRN";

export type ClinicalDrugForm = {
  name: string;
  doseValue: string;
  doseUnit: DrugDoseUnit;
  frequencyCode: DrugFrequencyCode;
  amount: string;
  source: ClinicalDrug["source"];
};

export type { ClinicalDrug };
