export type AssistantPriority = "Normal" | "Urgent" | "Critical";

export interface Prescription {
  prescriptionId?: number;
  appointmentId?: number;
  patientId?: number;
  patient: string;
  nic: string;
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
  age: number;
  nic: string;
  time: string;
  profileId?: string;
};

export type AssistantFormState = {
  nic: string;
  name: string;
  mobile: string;
  age: string;
  allergyInput: string;
  allergies: string[];
  bloodGroup: string;
  priority: AssistantPriority;
  regularDrug: string;
};

export type AssistantPatientOption = {
  id: number;
  name: string;
  nic: string;
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
