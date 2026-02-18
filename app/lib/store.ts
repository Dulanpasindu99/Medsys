import fs from "fs";
import path from "path";

type Role = "owner" | "doctor" | "assistant";

type User = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

type Patient = {
  id: number;
  name: string;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

type PatientHistory = {
  id: number;
  patientId: number;
  note: string;
  createdByUserId: number | null;
  createdAt: string;
};

type StoreData = {
  users: User[];
  patients: Patient[];
  history: PatientHistory[];
  counters: {
    users: number;
    patients: number;
    history: number;
  };
};

type Store = {
  data: StoreData;
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "medsys.json");

const defaultData: StoreData = {
  users: [],
  patients: [],
  history: [],
  counters: {
    users: 0,
    patients: 0,
    history: 0,
  },
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadData(): StoreData {
  ensureDataDir();
  if (!fs.existsSync(storePath)) {
    return structuredClone(defaultData);
  }

  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    return hydrateData(parsed);
  } catch (error) {
    console.warn("Failed to read medsys.json, resetting store.", error);
    return structuredClone(defaultData);
  }
}

function hydrateData(data: StoreData): StoreData {
  const usersMax = Math.max(0, ...data.users.map((user) => user.id));
  const patientsMax = Math.max(0, ...data.patients.map((patient) => patient.id));
  const historyMax = Math.max(0, ...data.history.map((entry) => entry.id));
  return {
    users: data.users ?? [],
    patients: data.patients ?? [],
    history: data.history ?? [],
    counters: {
      users: Math.max(data.counters?.users ?? 0, usersMax),
      patients: Math.max(data.counters?.patients ?? 0, patientsMax),
      history: Math.max(data.counters?.history ?? 0, historyMax),
    },
  };
}

function saveData(store: Store) {
  ensureDataDir();
  fs.writeFileSync(storePath, JSON.stringify(store.data, null, 2), "utf8");
}

declare global {
  // eslint-disable-next-line no-var
  var __medsysStore: Store | undefined;
}

export function getStore() {
  if (!global.__medsysStore) {
    global.__medsysStore = { data: loadData() };
  }

  return global.__medsysStore;
}

function nextId(store: Store, key: keyof StoreData["counters"]) {
  store.data.counters[key] += 1;
  saveData(store);
  return store.data.counters[key];
}

export function listUsers(role?: Role) {
  const store = getStore();
  return role ? store.data.users.filter((user) => user.role === role) : store.data.users;
}

export function findUserByEmail(email: string) {
  const store = getStore();
  return store.data.users.find((user) => user.email === email);
}

export function findUserById(id: number) {
  const store = getStore();
  return store.data.users.find((user) => user.id === id);
}

export function createUser(input: Omit<User, "id" | "createdAt">) {
  const store = getStore();
  const user: User = {
    id: nextId(store, "users"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  store.data.users.push(user);
  saveData(store);
  return user;
}

export function listPatients() {
  const store = getStore();
  return [...store.data.patients].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findPatientById(id: number) {
  const store = getStore();
  return store.data.patients.find((patient) => patient.id === id);
}

export function createPatient(input: Omit<Patient, "id" | "createdAt">) {
  const store = getStore();
  const patient: Patient = {
    id: nextId(store, "patients"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  store.data.patients.push(patient);
  saveData(store);
  return patient;
}

export function updatePatient(
  id: number,
  updates: Partial<Omit<Patient, "id" | "createdAt">>
) {
  const store = getStore();
  const patient = store.data.patients.find((entry) => entry.id === id);
  if (!patient) {
    return null;
  }

  if (updates.name !== undefined) {
    patient.name = updates.name;
  }
  if (updates.dateOfBirth !== undefined) {
    patient.dateOfBirth = updates.dateOfBirth;
  }
  if (updates.phone !== undefined) {
    patient.phone = updates.phone;
  }
  if (updates.address !== undefined) {
    patient.address = updates.address;
  }

  saveData(store);
  return patient;
}

export function deletePatient(id: number) {
  const store = getStore();
  const patientIndex = store.data.patients.findIndex((entry) => entry.id === id);
  if (patientIndex === -1) {
    return false;
  }

  store.data.patients.splice(patientIndex, 1);
  store.data.history = store.data.history.filter((entry) => entry.patientId !== id);
  saveData(store);
  return true;
}

export function listPatientHistory(patientId: number) {
  const store = getStore();
  return store.data.history
    .filter((entry) => entry.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPatientHistory(input: Omit<PatientHistory, "id" | "createdAt">) {
  const store = getStore();
  const entry: PatientHistory = {
    id: nextId(store, "history"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  store.data.history.push(entry);
  saveData(store);
  return entry;
}
