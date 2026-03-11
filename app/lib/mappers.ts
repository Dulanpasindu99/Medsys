import type {
  CreatePatientRequest,
  CreatePrescriptionRequest,
  InventoryMovementRequest,
  PrescriptionItemInput,
} from "@/app/lib/types";

type PatientFormInput = {
  nic?: string;
  fullName: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: { allergyName: string; severity?: "low" | "moderate" | "high" }[];
};

type DoctorPrescriptionForm = {
  encounterId: number;
  patientId: number;
  doctorId: number;
  items: {
    drugName: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    quantity: number;
    source: "Clinical" | "Outside";
  }[];
};

type InventoryMovementForm = {
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  note?: string;
};

export function mapPatientFormToCreatePayload(input: PatientFormInput): CreatePatientRequest {
  return {
    nic: input.nic,
    full_name: input.fullName,
    dob: input.dob,
    gender: input.gender,
    phone: input.phone,
    address: input.address,
    blood_group: input.bloodGroup,
    allergies: input.allergies?.map((entry) => ({
      allergy_name: entry.allergyName,
      severity: entry.severity,
    })),
  };
}

export function mapPrescriptionFormToCreatePayload(
  input: DoctorPrescriptionForm
): CreatePrescriptionRequest {
  const mappedItems: PrescriptionItemInput[] = input.items.map((item) => ({
    drug_name: item.drugName,
    dose: item.dose,
    frequency: item.frequency,
    duration: item.duration,
    quantity: item.quantity,
    source: item.source,
  }));

  return {
    encounter_id: input.encounterId,
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    items: mappedItems,
  };
}

export function mapInventoryMovementFormToPayload(
  input: InventoryMovementForm
): InventoryMovementRequest {
  return {
    movement_type: input.movementType,
    quantity: input.quantity,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    note: input.note,
  };
}
