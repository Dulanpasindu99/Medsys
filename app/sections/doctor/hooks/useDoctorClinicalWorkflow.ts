import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { DIAGNOSIS_MAPPING } from "../../../data/diagnosisMapping";
import type { ClinicalDrug, ClinicalDrugForm, DrugDoseUnit, DrugFrequencyCode } from "../types";

const SUGGESTED_DRUG_NAMES = [
  "Ibuprofen",
  "Naproxen",
  "Acetaminophen",
  "Paracetamol",
  "Amoxicillin",
  "Azithromycin",
  "Metformin",
  "Omeprazole",
  "Amlodipine",
  "Prednisone",
  "Ciprofloxacin",
  "Clopidogrel",
] as const;

const DOSE_UNIT_OPTIONS: readonly DrugDoseUnit[] = [
  "mg",
  "ml",
  "mcg",
  "g",
  "tablet",
  "capsule",
  "drops",
  "puffs",
  "sachet",
] as const;

const FREQUENCY_LABELS: Record<DrugFrequencyCode, string> = {
  OD: "OD - once daily",
  BD: "BD - twice daily",
  TDS: "TDS - three times daily",
  QID: "QID - four times daily",
  Q4H: "Q4H - every 4 hours",
  Q6H: "Q6H - every 6 hours",
  Q8H: "Q8H - every 8 hours",
  HS: "HS - at night",
  STAT: "STAT - immediately",
  PRN: "PRN - as needed",
};

function formatDose(value: string, unit: DrugDoseUnit) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return "";
  }

  const suffix =
    unit === "mg" || unit === "ml" || unit === "mcg" || unit === "g"
      ? unit.toUpperCase()
      : unit === "tablet"
        ? "tablet(s)"
        : unit === "capsule"
          ? "capsule(s)"
          : unit === "drops"
            ? "drops"
            : unit === "puffs"
              ? "puffs"
              : "sachet(s)";

  return `${normalizedValue} ${suffix}`.trim();
}

export function useDoctorClinicalWorkflow() {
  const [rxRows, setRxRows] = useState<ClinicalDrug[]>([]);

  const suggestedDrugNames = useMemo(() => [...SUGGESTED_DRUG_NAMES], []);

  const [clinicalDrugForm, setClinicalDrugForm] = useState<ClinicalDrugForm>({
    name: "",
    doseValue: "",
    doseUnit: "mg",
    frequencyCode: "TDS",
    amount: "",
    source: "Clinical",
  });

  const filteredDrugSuggestions = useMemo(() => {
    const query = clinicalDrugForm.name.trim().toLowerCase();
    if (!query) {
      return suggestedDrugNames.slice(0, 6);
    }
    return suggestedDrugNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 6);
  }, [clinicalDrugForm.name, suggestedDrugNames]);

  const updateClinicalDrugForm = (patch: Partial<ClinicalDrugForm>) => {
    setClinicalDrugForm((prev) => ({ ...prev, ...patch }));
  };

  const toggleDoseUnit = () => {
    setClinicalDrugForm((prev) => {
      const currentIndex = DOSE_UNIT_OPTIONS.indexOf(prev.doseUnit);
      const nextIndex = (currentIndex + 1) % DOSE_UNIT_OPTIONS.length;
      return {
        ...prev,
        doseUnit: DOSE_UNIT_OPTIONS[nextIndex] ?? "mg",
      };
    });
  };

  const toggleDrugSource = () => {
    setClinicalDrugForm((prev) => ({
      ...prev,
      source: prev.source === "Clinical" ? "Outside" : "Clinical",
    }));
  };

  const addClinicalDrug = () => {
    const name = clinicalDrugForm.name.trim();
    const doseValue = clinicalDrugForm.doseValue.trim();
    const amountValue = clinicalDrugForm.amount.trim();

    if (!name || !doseValue || !amountValue) return;

    const dose = formatDose(doseValue, clinicalDrugForm.doseUnit);
    const termsDisplay = FREQUENCY_LABELS[clinicalDrugForm.frequencyCode];

    const newEntry: ClinicalDrug = {
      drug: name,
      dose,
      terms: termsDisplay,
      amount: amountValue,
      source: clinicalDrugForm.source,
    };

    setRxRows((prev) => [...prev, newEntry]);
    setClinicalDrugForm({
      name: "",
      doseValue: "",
      doseUnit: "mg",
      frequencyCode: "TDS",
      amount: "",
      source: "Clinical",
    });
  };

  const handleDrugFormKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addClinicalDrug();
    }
  };

  const updateRxRow = (index: number, field: keyof ClinicalDrug, value: string) => {
    setRxRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === "amount"
                  ? value.replace(/[^0-9.]/g, "")
                  : field === "source"
                  ? (value as ClinicalDrug["source"])
                  : value,
            }
          : row
      )
    );
  };

  const removeRxRow = (index: number) => {
    setRxRows((prev) => prev.filter((_, i) => i !== index));
  };

  const preSavedTests = useMemo(
    () => [
      "F.B.C",
      "Cholesterol",
      "Lipid Profile",
      "Thyroid Panel",
      "D-Dimer",
      "Vitamin D",
      "Electrolyte Panel",
      "MRI Brain",
      "X-Ray Chest",
      "Blood Sugar Fasting",
    ],
    []
  );

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const [highlightedTestIndex, setHighlightedTestIndex] = useState(-1);
  const [testChipsPendingRemoval, setTestChipsPendingRemoval] = useState<Set<string>>(new Set());
  const testChipsPendingRemovalRef = useRef(testChipsPendingRemoval);

  const filteredTestOptions = useMemo(() => {
    const available = preSavedTests.filter((test) => !selectedTests.includes(test));
    const q = testQuery.trim().toLowerCase();
    if (!q) {
      return available.slice(0, 5);
    }
    return available.filter((test) => test.toLowerCase().includes(q));
  }, [preSavedTests, selectedTests, testQuery]);

  useEffect(() => {
    const shouldHighlight = testQuery.trim().length > 0;
    setHighlightedTestIndex(shouldHighlight && filteredTestOptions.length ? 0 : -1);
  }, [filteredTestOptions, testQuery]);

  const addMedicalTest = (test: string) => {
    const trimmed = test.trim();
    if (!trimmed) return;
    setSelectedTests((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });
    setTestQuery("");
    setHighlightedTestIndex(-1);
  };

  const toggleTestChipRemovalState = (test: string) => {
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(test)) {
        next.delete(test);
        setSelectedTests((current) => current.filter((entry) => entry !== test));
      } else {
        next.add(test);
      }
      return next;
    });
  };

  useEffect(() => {
    testChipsPendingRemovalRef.current = testChipsPendingRemoval;
  }, [testChipsPendingRemoval]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!testChipsPendingRemovalRef.current.size) return;
      const target = event.target as HTMLElement | null;
      const pendingChip = target?.closest("[data-test-chip]");
      const isPendingChip = pendingChip?.getAttribute("data-pending-removal") === "true";

      if (!isPendingChip) {
        setTestChipsPendingRemoval(new Set());
      }
    };

    document.addEventListener("click", handleOutsideClick, true);
    return () => document.removeEventListener("click", handleOutsideClick, true);
  }, []);

  const handleMedicalTestKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && filteredTestOptions.length) {
      event.preventDefault();
      setHighlightedTestIndex((prev) => (prev + 1) % filteredTestOptions.length);
      return;
    }

    if (event.key === "ArrowUp" && filteredTestOptions.length) {
      event.preventDefault();
      setHighlightedTestIndex((prev) => (prev - 1 + filteredTestOptions.length) % filteredTestOptions.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        (highlightedTestIndex >= 0 && filteredTestOptions[highlightedTestIndex]) || filteredTestOptions[0] || testQuery;
      if (selected) {
        addMedicalTest(selected);
      }
    }
  };

  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [diseaseQuery, setDiseaseQuery] = useState("");
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<string[]>([]);
  const [highlightedDiseaseIndex, setHighlightedDiseaseIndex] = useState(-1);
  const [isFetchingDiseases, setIsFetchingDiseases] = useState(false);
  const [chipsPendingRemoval, setChipsPendingRemoval] = useState<Set<string>>(new Set());
  const chipsPendingRemovalRef = useRef(chipsPendingRemoval);

  useEffect(() => {
    const q = diseaseQuery.trim();
    if (q.length < 2) {
      setDiseaseSuggestions([]);
      setHighlightedDiseaseIndex(-1);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        setIsFetchingDiseases(true);
        const response = await fetch(`/api/clinical/icd10?terms=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }

        const payload = (await response.json()) as { suggestions?: string[] };
        const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
        setDiseaseSuggestions(suggestions);
        setHighlightedDiseaseIndex(suggestions.length ? 0 : -1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching disease suggestions", error);
          setDiseaseSuggestions([]);
          setHighlightedDiseaseIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingDiseases(false);
        }
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [diseaseQuery]);

  const addDisease = (disease: string) => {
    const trimmed = disease.trim();
    if (!trimmed) return;

    setSelectedDiseases((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });

    const lowerCaseDisease = trimmed.toLowerCase();
    const drugsToAdd: ClinicalDrug[] = [];
    Object.entries(DIAGNOSIS_MAPPING).forEach(([key, drugs]) => {
      if (lowerCaseDisease.includes(key.toLowerCase())) {
        drugsToAdd.push(...drugs);
      }
    });

    if (drugsToAdd.length > 0) {
      setRxRows((prev) => {
        const existingNames = new Set(prev.map((r) => r.drug.toLowerCase()));
        const uniqueNewDrugs = drugsToAdd.filter((d) => !existingNames.has(d.drug.toLowerCase()));
        return [...prev, ...uniqueNewDrugs];
      });
    }

    setDiseaseQuery("");
    setDiseaseSuggestions([]);
    setHighlightedDiseaseIndex(-1);
  };

  const toggleChipRemovalState = (disease: string) => {
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(disease)) {
        next.delete(disease);
        setSelectedDiseases((current) => current.filter((entry) => entry !== disease));
      } else {
        next.add(disease);
      }
      return next;
    });
  };

  useEffect(() => {
    chipsPendingRemovalRef.current = chipsPendingRemoval;
  }, [chipsPendingRemoval]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!chipsPendingRemovalRef.current.size) return;
      const target = event.target as HTMLElement | null;
      const pendingChip = target?.closest("[data-disease-chip]");
      const isPendingChip = pendingChip?.getAttribute("data-pending-removal") === "true";
      if (!isPendingChip) {
        setChipsPendingRemoval(new Set());
      }
    };

    document.addEventListener("click", handleOutsideClick, true);
    return () => document.removeEventListener("click", handleOutsideClick, true);
  }, []);

  const handleDiseaseKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && diseaseSuggestions.length) {
      event.preventDefault();
      setHighlightedDiseaseIndex((prev) => (prev + 1) % diseaseSuggestions.length);
    } else if (event.key === "ArrowUp" && diseaseSuggestions.length) {
      event.preventDefault();
      setHighlightedDiseaseIndex((prev) => (prev - 1 + diseaseSuggestions.length) % diseaseSuggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        highlightedDiseaseIndex >= 0 && diseaseSuggestions[highlightedDiseaseIndex]
          ? diseaseSuggestions[highlightedDiseaseIndex]
          : diseaseQuery;
      if (selected) {
        addDisease(selected);
      }
    }
  };

  return {
    rxRows,
    setRxRows,
    clinicalDrugForm,
    updateClinicalDrugForm,
    filteredDrugSuggestions,
    toggleDoseUnit,
    toggleDrugSource,
    addClinicalDrug,
    handleDrugFormKeyDown,
    updateRxRow,
    removeRxRow,
    selectedDiseases,
    diseaseQuery,
    setDiseaseQuery,
    diseaseSuggestions,
    highlightedDiseaseIndex,
    isFetchingDiseases,
    chipsPendingRemoval,
    addDisease,
    toggleChipRemovalState,
    handleDiseaseKeyDown,
    selectedTests,
    testQuery,
    setTestQuery,
    filteredTestOptions,
    highlightedTestIndex,
    testChipsPendingRemoval,
    addMedicalTest,
    toggleTestChipRemovalState,
    handleMedicalTestKeyDown,
  };
}
