export type AssistantPriority = "Normal" | "Urgent" | "Critical";
export type AssistantAllergySeverity = "low" | "moderate" | "high";
export type AssistantAllergyEntry = {
  name: string;
  severity: AssistantAllergySeverity;
};

export type PrescriptionDrugEntry = {
  name: string;
  dose: string;
  terms: string;
  amount: number;
  inventoryItemId?: number;
};

export interface Prescription {
  prescriptionId?: number;
  appointmentId?: number;
  encounterId?: number;
  patientId?: number;
  patient: string;
  patientCode: string;
  nic: string;
  guardianName?: string;
  guardianNic?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  age: number;
  gender: "Male" | "Female";
  diagnosis: string;
  clinical: PrescriptionDrugEntry[];
  outside: PrescriptionDrugEntry[];
  allergies: string[];
  dispenseItems?: { inventoryItemId: number; quantity: number }[];
}

export type CompletedPatient = {
  name: string;
  patientCode: string;
  age: number;
  nic: string;
  guardianNic?: string;
  guardianRelationship?: string;
  time: string;
  profileId?: string;
};

export type AssistantGuardianFormState = {
  guardianPatientId: string;
  guardianName: string;
  guardianNic: string;
  guardianPhone: string;
  guardianRelationship: string;
  familyId: string;
  familyCode: string;
};

export type AssistantFormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  nic: string;
  mobile: string;
  address: string;
  allergyInput: string;
  allergySeverity: AssistantAllergySeverity;
  allergies: AssistantAllergyEntry[];
  bloodGroup: string;
  priority: AssistantPriority;
  regularDrug: string;
  guardian: AssistantGuardianFormState;
};

export type AssistantPatientOption = {
  id: number;
  name: string;
  patientCode: string;
  nic: string;
  familyId?: number;
  guardianName?: string;
  guardianNic?: string;
};

export type AssistantFamilyOption = {
  id: number;
  name: string;
  familyCode?: string;
};

export type AssistantDoctorAvailability = {
  id?: number;
  name: string;
  email?: string;
  doctorWorkflowMode?: "self_service" | "clinic_supported" | null;
  isActive?: boolean;
  status: string;
};

export type AssistantScheduleFormState = {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  reason: string;
  priority: AssistantPriority;
};
