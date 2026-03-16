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
  name: string;
  patientCode: string;
  nic: string;
  guardianName?: string;
  guardianNic?: string;
  guardianRelationship?: string;
  time: string;
  reason: string;
  age: number;
  gender: string;
  profileId?: string;
};

export type PatientGender = "Male" | "Female";

export type PatientVital = {
  label: string;
  value: string;
};

export type AllergyAlert = {
  name: string;
  severity: string;
  dot: string;
  pill: string;
};

export type ClinicalDrugForm = {
  name: string;
  doseValue: string;
  doseUnit: "MG" | "ML";
  terms: "Daily" | "Hourly";
  termsValue: string;
  amount: string;
  source: ClinicalDrug["source"];
};

export type { ClinicalDrug };
