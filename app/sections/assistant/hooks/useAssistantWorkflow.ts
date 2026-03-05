import { useMemo, useState } from "react";
import { getProfileIdByNicOrName } from "../../../data/patientProfiles";
import type { AssistantFormState, CompletedPatient, Prescription } from "../types";

export function useAssistantWorkflow() {
  const [pendingPatients, setPendingPatients] = useState<Prescription[]>([
    {
      id: "MH0001",
      patient: "Ranil Wickramasinghe",
      nic: "156546658V",
      age: 70,
      gender: "Male",
      diagnosis: "Fever, head ache",
      clinical: [
        { name: "Cough Syrup", dose: "20ml", terms: "3 x 4", amount: 1 },
        { name: "Cough Strops", dose: "1", terms: "4", amount: 7 },
      ],
      outside: [
        { name: "Zink", dose: "2", terms: "3 x 4", amount: 24 },
        { name: "Paracetamol", dose: "500mg", terms: "2 x 4", amount: 16 },
      ],
      allergies: ["Penicillin", "Piriton"],
    },
    {
      id: "MH0002",
      patient: "Chathura Deshan",
      nic: "865637762V",
      age: 32,
      gender: "Male",
      diagnosis: "Flu",
      clinical: [{ name: "Napa", dose: "500mg", terms: "2 x 5", amount: 10 }],
      outside: [{ name: "Vitamin C", dose: "500mg", terms: "Daily", amount: 7 }],
      allergies: ["-"],
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activePrescription = pendingPatients[activeIndex];

  const [formState, setFormState] = useState<AssistantFormState>({
    nic: "",
    name: "",
    mobile: "",
    age: "",
    allergyInput: "",
    allergies: ["No allergies"],
    bloodGroup: "O+",
    priority: "Normal",
    regularDrug: "",
  });

  const [completedSearch, setCompletedSearch] = useState("");

  const stats = useMemo(() => ({ total: 101, male: 20, female: 81, existing: 79, new: 22 }), []);

  const availableDoctors = useMemo(
    () => [
      { name: "Dr. Malith", status: "Online" },
      { name: "Dr. Jay", status: "Online" },
      { name: "Dr. Naveen", status: "Offline" },
    ],
    []
  );

  const completed = useMemo<CompletedPatient[]>(
    () => [
      {
        name: "Rani Fernando",
        age: 34,
        nic: "856456456V",
        time: "5.45 PM",
        profileId: getProfileIdByNicOrName("856456456V", "Rani Fernando"),
      },
      {
        name: "Sathya Dev",
        age: 65,
        nic: "222343222V",
        time: "5.25 PM",
        profileId: getProfileIdByNicOrName("222343222V", "Sathya Dev"),
      },
      {
        name: "Chathura Deshan",
        age: 32,
        nic: "865637762V",
        time: "5.00 PM",
        profileId: getProfileIdByNicOrName("865637762V", "Chathura Deshan"),
      },
      {
        name: "Rathmalie De Silva",
        age: 42,
        nic: "650002343V",
        time: "4.15 PM",
        profileId: getProfileIdByNicOrName("650002343V", "Rathmalie De Silva"),
      },
    ],
    []
  );

  const filteredCompleted = completed.filter((entry) =>
    `${entry.name} ${entry.nic}`.toLowerCase().includes(completedSearch.toLowerCase())
  );

  const addPatient = () => {
    if (!formState.nic || !formState.name || !formState.age) return;
    const next: Prescription = {
      id: `MH${(pendingPatients.length + 1).toString().padStart(4, "0")}`,
      patient: formState.name,
      nic: formState.nic,
      age: Number(formState.age),
      gender: "Male",
      diagnosis: "Awaiting doctor",
      clinical: [],
      outside: [],
      allergies: formState.allergies,
    };
    setPendingPatients((prev) => [...prev, next]);
    setFormState((prev) => ({
      ...prev,
      nic: "",
      name: "",
      mobile: "",
      age: "",
      allergyInput: "",
      allergies: ["No allergies"],
      regularDrug: "",
      priority: "Normal",
    }));
  };

  const addAllergy = () => {
    const entry = formState.allergyInput.trim();
    if (!entry) return;
    setFormState((prev) => ({
      ...prev,
      allergies: Array.from(new Set([...prev.allergies.filter((v) => v !== "No allergies"), entry])),
      allergyInput: "",
    }));
  };

  const markDoneAndNext = () => {
    if (!pendingPatients.length) return;
    const nextIndex = (activeIndex + 1) % pendingPatients.length;
    setActiveIndex(nextIndex);
  };

  return {
    pendingPatients,
    activePrescription,
    formState,
    setFormState,
    completedSearch,
    setCompletedSearch,
    stats,
    availableDoctors,
    filteredCompleted,
    addPatient,
    addAllergy,
    markDoneAndNext,
  };
}
