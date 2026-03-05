import { useMemo, useState } from "react";
import { patientProfiles } from "../../../data/patientProfiles";
import type { AgeBucketId, Gender, Patient } from "../types";

function getRelativeVisitLabel(lastVisitDate?: string) {
  if (!lastVisitDate) return "New patient";

  const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 3600 * 24));
  if (daysSince > 0) {
    if (daysSince < 7) return `${daysSince} days ago`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    return `${Math.floor(daysSince / 30)} months ago`;
  }
  return "Today";
}

function toPatientRows(): Patient[] {
  return Object.values(patientProfiles).map((profile) => {
    const sortedTimeline = [...profile.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastVisitDate = sortedTimeline[0]?.date;

    return {
      id: profile.id,
      name: profile.name,
      nic: profile.nic,
      age: profile.age,
      gender: profile.gender,
      mobile: "+94 71 723 4567",
      family: profile.family.name === "N/A" ? "Unassigned" : profile.family.name,
      visits: profile.timeline.length + 1,
      lastVisit: getRelativeVisitLabel(lastVisitDate),
      nextAppointment: Number(profile.id.replace(/\D/g, "")) % 3 === 0 ? "Tomorrow 10:00 AM" : undefined,
      tags: profile.conditions,
      conditions: [...profile.conditions, ...profile.allergies.map((a) => `Allergy: ${a}`)],
      profileId: profile.id,
    };
  });
}

export function usePatientDirectory() {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All Families");
  const [ageRange, setAgeRange] = useState<AgeBucketId>("all");
  const [gender, setGender] = useState<Gender | "all">("all");

  const patients = useMemo(() => toPatientRows(), []);

  const families = useMemo(() => {
    const set = new Set<string>(["All Families"]);
    for (const patient of patients) {
      set.add(patient.family);
    }
    return Array.from(set);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = `${patient.name} ${patient.nic} ${patient.mobile} ${patient.family}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFamily = family === "All Families" || patient.family === family;
      const matchesGender = gender === "all" || patient.gender === gender;
      const matchesAge =
        ageRange === "all" ||
        (ageRange === "18-30" && patient.age >= 18 && patient.age <= 30) ||
        (ageRange === "31-45" && patient.age >= 31 && patient.age <= 45) ||
        (ageRange === "46+" && patient.age >= 46);

      return matchesSearch && matchesFamily && matchesGender && matchesAge;
    });
  }, [ageRange, family, gender, patients, search]);

  return {
    search,
    setSearch,
    family,
    setFamily,
    ageRange,
    setAgeRange,
    gender,
    setGender,
    patients,
    filteredPatients,
    families,
  };
}
