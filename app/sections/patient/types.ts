export type Gender = "Male" | "Female" | "Other";

export type Patient = {
  patientId?: number;
  name: string;
  patientCode: string;
  nic: string;
  guardianName?: string;
  guardianNic?: string;
  guardianRelationship?: string;
  age: number;
  gender: Gender;
  mobile: string;
  family: string;
  visits: number;
  lastVisit: string;
  nextAppointment?: string;
  tags: string[];
  conditions: string[];
  diagnoses: string[];
  profileId?: string;
  selfRegistered: boolean;
};

export type AgeBucketId = "all" | "18-30" | "31-45" | "46+";

// Where the patient record originated: self-serve portal signup vs. added by
// clinic staff (doctor/assistant).
export type RegistrationFilterId = "all" | "online" | "clinic";

export type AgeBucket = {
  id: AgeBucketId;
  label: string;
};
