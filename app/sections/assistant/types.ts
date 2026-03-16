export type AssistantPriority = "Normal" | "Urgent" | "Critical";

export interface Prescription {
  prescriptionId?: number;
  appointmentId?: number;
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
  clinical: { name: string; dose: string; terms: string; amount: number }[];
  outside: { name: string; dose: string; terms: string; amount: number }[];
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
};

export type AssistantFormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  nic: string;
  mobile: string;
  allergyInput: string;
  allergies: string[];
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
  guardianName?: string;
  guardianNic?: string;
};

export type AssistantDoctorAvailability = {
  id?: number;
  name: string;
  status: string;
};

export type AssistantScheduleFormState = {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  reason: string;
  priority: AssistantPriority;
};
