import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { DIAGNOSIS_MAPPING } from "../../../data/diagnosisMapping";
import type { ClinicalDrug, ClinicalDrugForm, DrugDoseUnit, DrugFrequencyCode } from "../types";
import type {
  ClinicalDiagnosisOption,
  ClinicalDiagnosisSelection,
  ClinicalTestOption,
} from "../types";

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

const CLINICAL_SEARCH_DEBOUNCE_MS = 350;
const CLINICAL_RESULT_LIMIT = 8;
const CLINICAL_SEARCH_CACHE_TTL_MS = 60_000;
const CLINICAL_SEARCH_MIN_CHARS = 2;

type CacheEntry<T> = {
  data: T;
  cachedAt: number;
};

const diagnosisSearchCache = new Map<string, CacheEntry<ClinicalDiagnosisOption[]>>();
const testSearchCache = new Map<string, CacheEntry<ClinicalTestOption[]>>();
const diagnosisSearchInflight = new Map<string, Promise<ClinicalDiagnosisOption[]>>();
const testSearchInflight = new Map<string, Promise<ClinicalTestOption[]>>();

function readFreshCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.cachedAt > CLINICAL_SEARCH_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

async function fetchDiagnosisSuggestionsCached(query: string, signal: AbortSignal) {
  const cacheKey = `${query}:${CLINICAL_RESULT_LIMIT}`;
  const cached = readFreshCache(diagnosisSearchCache, cacheKey);
  if (cached) {
    return cached;
  }

  const inflight = diagnosisSearchInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await fetch(
      `/api/clinical/diagnoses?terms=${encodeURIComponent(query)}&limit=${CLINICAL_RESULT_LIMIT}`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(String(response.status));
    }

    const payload = (await response.json()) as { diagnoses?: ClinicalDiagnosisOption[] };
    const suggestions = Array.isArray(payload.diagnoses) ? payload.diagnoses : [];
    diagnosisSearchCache.set(cacheKey, {
      data: suggestions,
      cachedAt: Date.now(),
    });
    return suggestions;
  })();

  diagnosisSearchInflight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    diagnosisSearchInflight.delete(cacheKey);
  }
}

async function fetchTestSuggestionsCached(query: string, signal: AbortSignal) {
  const cacheKey = `${query}:${CLINICAL_RESULT_LIMIT}`;
  const cached = readFreshCache(testSearchCache, cacheKey);
  if (cached) {
    return cached;
  }

  const inflight = testSearchInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await fetch(
      `/api/clinical/tests?terms=${encodeURIComponent(query)}&limit=${CLINICAL_RESULT_LIMIT}`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(String(response.status));
    }

    const payload = (await response.json()) as { tests?: ClinicalTestOption[] };
    const suggestions = Array.isArray(payload.tests)
      ? payload.tests.slice(0, CLINICAL_RESULT_LIMIT)
      : [];
    testSearchCache.set(cacheKey, {
      data: suggestions,
      cachedAt: Date.now(),
    });
    return suggestions;
  })();

  testSearchInflight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    testSearchInflight.delete(cacheKey);
  }
}

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
  const [drugDraftFeedback, setDrugDraftFeedback] = useState<string | null>(null);
  const [persistedConditionDiagnoses, setPersistedConditionDiagnoses] = useState<Set<string>>(
    () => new Set()
  );

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
    if (drugDraftFeedback) {
      setDrugDraftFeedback(null);
    }
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

    const normalizedName = name.toLowerCase();
    if (rxRows.some((entry) => entry.drug.trim().toLowerCase() === normalizedName)) {
      setDrugDraftFeedback("This drug is already added to the prescription.");
      return;
    }

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
    setDrugDraftFeedback(null);
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
    if (drugDraftFeedback) {
      setDrugDraftFeedback(null);
    }
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
    if (drugDraftFeedback) {
      setDrugDraftFeedback(null);
    }
    setRxRows((prev) => prev.filter((_, i) => i !== index));
  };

  const [selectedTests, setSelectedTests] = useState<ClinicalTestOption[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const [debouncedTestQuery, setDebouncedTestQuery] = useState("");
  const [testSuggestions, setTestSuggestions] = useState<ClinicalTestOption[]>([]);
  const [isFetchingTests, setIsFetchingTests] = useState(false);
  const [testSearchFeedback, setTestSearchFeedback] = useState<string | null>(null);
  const [highlightedTestIndex, setHighlightedTestIndex] = useState(-1);
  const [testChipsPendingRemoval, setTestChipsPendingRemoval] = useState<Set<string>>(new Set());
  const testChipsPendingRemovalRef = useRef(testChipsPendingRemoval);

  const filteredTestOptions = useMemo(
    () =>
      testSuggestions
        .filter((test) => !selectedTests.some((selected) => selected.code === test.code))
        .slice(0, CLINICAL_RESULT_LIMIT),
    [selectedTests, testSuggestions]
  );

  useEffect(() => {
    const shouldHighlight = testQuery.trim().length > 0;
    setHighlightedTestIndex(shouldHighlight && filteredTestOptions.length ? 0 : -1);
  }, [filteredTestOptions, testQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTestQuery(testQuery.trim());
    }, CLINICAL_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [testQuery]);

  useEffect(() => {
    const q = debouncedTestQuery.trim();
    if (q.length < CLINICAL_SEARCH_MIN_CHARS) {
      setTestSuggestions([]);
      setTestSearchFeedback(null);
      setHighlightedTestIndex(-1);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        setIsFetchingTests(true);
        setTestSearchFeedback(null);
        const suggestions = await fetchTestSuggestionsCached(q, controller.signal);
        setTestSuggestions(suggestions);
        setHighlightedTestIndex(suggestions.length ? 0 : -1);
      } catch (error) {
        if (!controller.signal.aborted) {
          const status = error instanceof Error ? error.message : "";
          if (status === "503") {
            setTestSearchFeedback("Medical test search is temporarily unavailable. Try again shortly.");
          } else {
            console.error("Error fetching medical test suggestions", error);
            setTestSearchFeedback("Unable to load medical test suggestions right now.");
          }
          setHighlightedTestIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingTests(false);
        }
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [debouncedTestQuery]);

  const addMedicalTest = (test: ClinicalTestOption) => {
    if (!test.code || !test.display.trim()) return;
    setSelectedTests((prev) => (prev.some((entry) => entry.code === test.code) ? prev : [...prev, test]));
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(test.code);
      return next;
    });
    setTestQuery("");
    setHighlightedTestIndex(-1);
  };

  const toggleTestChipRemovalState = (testCode: string) => {
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(testCode)) {
        next.delete(testCode);
        setSelectedTests((current) => current.filter((entry) => entry.code !== testCode));
      } else {
        next.add(testCode);
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
      if (filteredTestOptions.length === 0) {
        const immediateQuery = testQuery.trim();
        if (
          immediateQuery.length >= CLINICAL_SEARCH_MIN_CHARS &&
          immediateQuery !== debouncedTestQuery
        ) {
          setDebouncedTestQuery(immediateQuery);
          return;
        }
      }
      const selected =
        (highlightedTestIndex >= 0 && filteredTestOptions[highlightedTestIndex]) || filteredTestOptions[0];
      if (selected) {
        addMedicalTest(selected);
      }
    }
  };

  const [selectedDiseases, setSelectedDiseases] = useState<ClinicalDiagnosisSelection[]>([]);
  const [diseaseQuery, setDiseaseQuery] = useState("");
  const [debouncedDiseaseQuery, setDebouncedDiseaseQuery] = useState("");
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<ClinicalDiagnosisOption[]>([]);
  const [recommendedTests, setRecommendedTests] = useState<ClinicalTestOption[]>([]);
  const [highlightedDiseaseIndex, setHighlightedDiseaseIndex] = useState(-1);
  const [isFetchingDiseases, setIsFetchingDiseases] = useState(false);
  const [chipsPendingRemoval, setChipsPendingRemoval] = useState<Set<string>>(new Set());
  const chipsPendingRemovalRef = useRef(chipsPendingRemoval);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedDiseaseQuery(diseaseQuery.trim());
    }, CLINICAL_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [diseaseQuery]);

  useEffect(() => {
    const q = debouncedDiseaseQuery.trim();
    if (q.length < CLINICAL_SEARCH_MIN_CHARS) {
      setDiseaseSuggestions([]);
      setHighlightedDiseaseIndex(-1);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        setIsFetchingDiseases(true);
        const suggestions = await fetchDiagnosisSuggestionsCached(q, controller.signal);
        setDiseaseSuggestions(suggestions);
        setHighlightedDiseaseIndex(suggestions.length ? 0 : -1);
      } catch (error) {
        if (!controller.signal.aborted) {
          const status = error instanceof Error ? error.message : "";
          if (status !== "503") {
            console.error("Error fetching disease suggestions", error);
          }
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
  }, [debouncedDiseaseQuery]);

  const addDisease = (disease: ClinicalDiagnosisOption) => {
    if (!disease.code || !disease.display.trim()) return;

    setSelectedDiseases((prev) =>
      prev.some((entry) => entry.code === disease.code)
        ? prev
        : [...prev, { ...disease, persistAsCondition: false }]
    );
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(disease.code);
      return next;
    });

    const lowerCaseDisease = disease.display.toLowerCase();
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

  const toggleChipRemovalState = (diagnosisCode: string) => {
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(diagnosisCode)) {
        next.delete(diagnosisCode);
        setSelectedDiseases((current) => current.filter((entry) => entry.code !== diagnosisCode));
        setPersistedConditionDiagnoses((current) => {
          const updated = new Set(current);
          updated.delete(diagnosisCode);
          return updated;
        });
      } else {
        next.add(diagnosisCode);
      }
      return next;
    });
  };

  const togglePersistAsCondition = (diagnosisCode: string) => {
    setPersistedConditionDiagnoses((current) => {
      const next = new Set(current);
      if (next.has(diagnosisCode)) {
        next.delete(diagnosisCode);
      } else {
        next.add(diagnosisCode);
      }
      return next;
    });
    setSelectedDiseases((current) =>
      current.map((entry) =>
        entry.code === diagnosisCode
          ? { ...entry, persistAsCondition: !entry.persistAsCondition }
          : entry
      )
    );
  };

  useEffect(() => {
    const latestDiagnosis = selectedDiseases[selectedDiseases.length - 1];
    if (!latestDiagnosis?.code) {
      setRecommendedTests([]);
      return;
    }

    const controller = new AbortController();
    const fetchRecommendedTests = async () => {
      try {
        const response = await fetch(
          `/api/clinical/diagnoses/${encodeURIComponent(latestDiagnosis.code)}/recommended-tests`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch recommended tests: ${response.status}`);
        }

        const payload = (await response.json()) as { tests?: ClinicalTestOption[] };
        const tests = Array.isArray(payload.tests) ? payload.tests : [];
        setRecommendedTests(
          tests.filter((test) => !selectedTests.some((selected) => selected.code === test.code))
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching recommended tests", error);
          setRecommendedTests([]);
        }
      }
    };

    fetchRecommendedTests();
    return () => controller.abort();
  }, [selectedDiseases, selectedTests]);

  const addRecommendedTests = () => {
    if (!recommendedTests.length) return;
    setSelectedTests((current) => {
      const seen = new Set(current.map((entry) => entry.code));
      return [
        ...current,
        ...recommendedTests.filter((entry) => {
          if (seen.has(entry.code)) {
            return false;
          }
          seen.add(entry.code);
          return true;
        }),
      ];
    });
    setRecommendedTests([]);
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
      if (diseaseSuggestions.length === 0) {
        const immediateQuery = diseaseQuery.trim();
        if (
          immediateQuery.length >= CLINICAL_SEARCH_MIN_CHARS &&
          immediateQuery !== debouncedDiseaseQuery
        ) {
          setDebouncedDiseaseQuery(immediateQuery);
          return;
        }
      }
      const selected =
        highlightedDiseaseIndex >= 0 && diseaseSuggestions[highlightedDiseaseIndex]
          ? diseaseSuggestions[highlightedDiseaseIndex]
          : null;
      if (selected) {
        addDisease(selected);
      }
    }
  };

  return {
    rxRows,
    setRxRows,
    drugDraftFeedback,
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
    persistedConditionDiagnoses,
    diseaseQuery,
    setDiseaseQuery,
    diseaseSuggestions,
    highlightedDiseaseIndex,
    isFetchingDiseases,
    chipsPendingRemoval,
    addDisease,
    togglePersistAsCondition,
    toggleChipRemovalState,
    handleDiseaseKeyDown,
    selectedTests,
    testQuery,
    setTestQuery,
    isFetchingTests,
    testSearchFeedback,
    filteredTestOptions,
    highlightedTestIndex,
    testChipsPendingRemoval,
    addMedicalTest,
    toggleTestChipRemovalState,
    handleMedicalTestKeyDown,
    recommendedTests,
    addRecommendedTests,
  };
}
