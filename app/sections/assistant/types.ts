export interface Prescription {
  id: string;
  patient: string;
  nic: string;
  age: number;
  gender: "Male" | "Female";
  diagnosis: string;
  clinical: { name: string; dose: string; terms: string; amount: number }[];
  outside: { name: string; dose: string; terms: string; amount: number }[];
  allergies: string[];
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
  priority: "Normal" | "Urgent" | "Critical";
  regularDrug: string;
};
