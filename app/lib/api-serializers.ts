import type { AppRole } from "@/app/lib/roles";
import type { AppPermission } from "@/app/lib/authorization";
import type { DoctorWorkflowMode, WorkflowProfiles } from "@/app/lib/api-client";

type PatientRecord = {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string | null;
  patientCode?: string | null;
  familyId?: number | null;
  familyName?: string | null;
  guardianPatientId?: number | null;
  guardianName?: string | null;
  guardianNic?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
  nic?: string | null;
  age?: number | null;
  gender?: string | null;
  priority?: string | null;
  mobile?: string | null;
  fullName?: string | null;
  visitCount?: number | null;
  lastVisitAt?: string | null;
  nextAppointment?: Record<string, unknown> | null;
  allergyHighlights?: unknown;
  majorActiveCondition?: string | null;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  roles?: AppRole[];
  activeRole?: AppRole;
  createdAt: string | null;
  permissions?: AppPermission[];
  extraPermissions?: AppPermission[];
  doctorWorkflowMode?: DoctorWorkflowMode;
  workflowProfiles?: WorkflowProfiles | null;
};

type HistoryEntry = {
  id: number;
  note: string;
  createdAt: string;
  createdByUserId: number | null;
};

type HistoryActor = {
  id: number;
  name: string;
  role: AppRole;
} | undefined;

type SessionIdentity = {
  id: number | null;
  name: string;
  email: string;
  role: AppRole;
  roles?: AppRole[];
  activeRole?: AppRole;
  permissions?: AppPermission[];
  extraPermissions?: AppPermission[];
  doctorWorkflowMode?: DoctorWorkflowMode;
  workflowProfiles?: WorkflowProfiles | null;
};

export function serializePatient(patient: PatientRecord) {
  return {
    id: patient.id,
    name: patient.name,
    ...(patient.firstName ? { first_name: patient.firstName } : {}),
    ...(patient.lastName ? { last_name: patient.lastName } : {}),
    ...(patient.fullName && patient.fullName !== patient.name
      ? { fullName: patient.fullName }
      : {}),
    date_of_birth: patient.dateOfBirth,
    ...(patient.patientCode ? { patient_code: patient.patientCode } : {}),
    phone: patient.phone,
    ...(patient.mobile && patient.mobile !== patient.phone
      ? { mobile: patient.mobile }
      : {}),
    address: patient.address,
    created_at: patient.createdAt ?? null,
    ...(patient.familyId != null ? { family_id: patient.familyId } : {}),
    ...(patient.familyName != null ? { family_name: patient.familyName } : {}),
    ...(patient.guardianPatientId != null
      ? { guardian_patient_id: patient.guardianPatientId }
      : {}),
    ...(patient.guardianName != null ? { guardian_name: patient.guardianName } : {}),
    ...(patient.guardianNic != null ? { guardian_nic: patient.guardianNic } : {}),
    ...(patient.guardianPhone != null ? { guardian_phone: patient.guardianPhone } : {}),
    ...(patient.guardianRelationship != null
      ? { guardian_relationship: patient.guardianRelationship }
      : {}),
    ...(patient.nic != null ? { nic: patient.nic } : {}),
    ...(patient.age != null ? { age: patient.age } : {}),
    ...(patient.gender != null ? { gender: patient.gender } : {}),
    ...(patient.priority != null ? { priority: patient.priority } : {}),
    ...(patient.visitCount != null ? { visit_count: patient.visitCount } : {}),
    ...(patient.lastVisitAt != null ? { last_visit_at: patient.lastVisitAt } : {}),
    ...(patient.nextAppointment != null ? { next_appointment: patient.nextAppointment } : {}),
    ...(patient.allergyHighlights != null ? { allergy_highlights: patient.allergyHighlights } : {}),
    ...(patient.majorActiveCondition != null
      ? { major_active_condition: patient.majorActiveCondition }
      : {}),
  };
}

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.roles?.length ? { roles: user.roles } : {}),
    ...(user.activeRole ? { active_role: user.activeRole } : {}),
    created_at: user.createdAt ?? null,
    ...(user.permissions?.length ? { permissions: user.permissions } : {}),
    ...(user.extraPermissions?.length ? { extra_permissions: user.extraPermissions } : {}),
    ...(user.doctorWorkflowMode ? { doctor_workflow_mode: user.doctorWorkflowMode } : {}),
    ...(user.workflowProfiles ? { workflow_profiles: user.workflowProfiles } : {}),
  };
}

export function serializeHistoryEntry(entry: HistoryEntry, actor?: HistoryActor) {
  return {
    id: entry.id,
    note: entry.note,
    created_at: entry.createdAt,
    created_by_user_id: actor?.id ?? entry.createdByUserId ?? null,
    created_by_name: actor?.name ?? null,
    created_by_role: actor?.role ?? null,
  };
}

export function serializeSessionIdentity(identity: SessionIdentity) {
  return {
    id: identity.id,
    user_id: identity.id,
    name: identity.name,
    email: identity.email,
    role: identity.role,
    ...(identity.roles?.length ? { roles: identity.roles } : {}),
    ...(identity.activeRole ? { active_role: identity.activeRole } : {}),
    ...(identity.permissions?.length ? { permissions: identity.permissions } : {}),
    ...(identity.extraPermissions?.length
      ? { extra_permissions: identity.extraPermissions }
      : {}),
    ...(identity.doctorWorkflowMode
      ? { doctor_workflow_mode: identity.doctorWorkflowMode }
      : {}),
    ...(identity.workflowProfiles ? { workflow_profiles: identity.workflowProfiles } : {}),
  };
}
