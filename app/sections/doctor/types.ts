import type { ClinicalDrug } from "../../data/diagnosisMapping";

export type Patient = {
  id: string;
  name: string;
  nic: string;
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
