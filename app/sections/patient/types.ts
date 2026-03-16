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
  profileId?: string;
};

export type AgeBucketId = "all" | "18-30" | "31-45" | "46+";

export type AgeBucket = {
  id: AgeBucketId;
  label: string;
};
