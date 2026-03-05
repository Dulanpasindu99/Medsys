export type Gender = "Male" | "Female";

export type Patient = {
  id: string;
  name: string;
  nic: string;
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
