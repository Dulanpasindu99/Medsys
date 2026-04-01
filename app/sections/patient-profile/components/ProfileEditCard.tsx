import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listFamilies, type ApiClientError, updatePatient } from "../../../lib/api-client";
import { notifyError, notifySuccess } from "../../../lib/notifications";
import { queryKeys } from "../../../lib/query-keys";
import type { PatientProfileRecord } from "../types";

type ProfileEditCardProps = {
  profile: PatientProfileRecord;
  onClose: () => void;
};

type FamilyOption = {
  id: number;
  name: string;
};

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function toFamilyOptions(value: unknown): FamilyOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const id =
        typeof row.id === "number"
          ? row.id
          : typeof row.id === "string" && !Number.isNaN(Number(row.id))
            ? Number(row.id)
            : null;
      const name =
        typeof row.name === "string"
          ? row.name
          : typeof row.familyName === "string"
            ? row.familyName
            : "";
      if (id === null || !name.trim()) return null;
      return { id, name };
    })
    .filter((entry): entry is FamilyOption => entry !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function ProfileEditCard({ profile, onClose }: ProfileEditCardProps) {
  const queryClient = useQueryClient();
  const [familyOptions, setFamilyOptions] = useState<FamilyOption[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState({
    firstName: profile.firstName ?? profile.name.split(" ")[0] ?? "",
    lastName: profile.lastName ?? profile.name.split(" ").slice(1).join(" "),
    nic: profile.nic === "No NIC" ? "" : profile.nic,
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender,
    phone: profile.mobile === "Not provided" ? "" : profile.mobile,
    address: profile.address ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    familyId: profile.familyId ? String(profile.familyId) : "",
    guardianName: profile.guardianName ?? "",
    guardianNic: profile.guardianNic ?? "",
    guardianPhone: profile.guardianPhone ?? "",
    guardianRelationship: profile.guardianRelationship ?? "",
  });

  useEffect(() => {
    setFormState({
      firstName: profile.firstName ?? profile.name.split(" ")[0] ?? "",
      lastName: profile.lastName ?? profile.name.split(" ").slice(1).join(" "),
      nic: profile.nic === "No NIC" ? "" : profile.nic,
      dateOfBirth: profile.dateOfBirth ?? "",
      gender: profile.gender,
      phone: profile.mobile === "Not provided" ? "" : profile.mobile,
      address: profile.address ?? "",
      bloodGroup: profile.bloodGroup ?? "",
      familyId: profile.familyId ? String(profile.familyId) : "",
      guardianName: profile.guardianName ?? "",
      guardianNic: profile.guardianNic ?? "",
      guardianPhone: profile.guardianPhone ?? "",
      guardianRelationship: profile.guardianRelationship ?? "",
    });
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    setLoadingFamilies(true);
    void listFamilies()
      .then((rows) => {
        if (!cancelled) {
          setFamilyOptions(toFamilyOptions(rows));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = (error as ApiClientError)?.message ?? "Unable to load family options.";
          notifyError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFamilies(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      await updatePatient(profile.id, {
        firstName: formState.firstName.trim() || undefined,
        lastName: formState.lastName.trim() || undefined,
        dob: formState.dateOfBirth.trim() || undefined,
        gender:
          formState.gender === "Male"
            ? "male"
            : formState.gender === "Female"
              ? "female"
              : "other",
        nic: formState.nic.trim() || null,
        phone: formState.phone.trim() || null,
        address: formState.address.trim() || null,
        bloodGroup: formState.bloodGroup.trim() || null,
        familyId: formState.familyId ? Number(formState.familyId) : null,
        guardianName: formState.guardianName.trim() || null,
        guardianNic: formState.guardianNic.trim() || null,
        guardianPhone: formState.guardianPhone.trim() || null,
        guardianRelationship: formState.guardianRelationship.trim() || null,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.profile(profile.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.consultations(profile.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.directory }),
      ]);
      notifySuccess("Patient profile updated successfully.");
      onClose();
    } catch (error) {
      const apiError = error as ApiClientError;
      notifyError(apiError.userMessage ?? apiError.message ?? "Unable to update patient profile.", apiError.requestId);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300";
  const labelClassName = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Edit patient</p>
          <h2 className="text-2xl font-bold text-slate-900">Patient details</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveProfile()}
            disabled={isSaving}
            className="ios-button-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-[26px] border border-slate-100 bg-white/80 p-5 ring-1 ring-white/70">
          <h3 className="text-lg font-bold text-slate-900">Personal Info</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClassName}>First name</span>
              <input className={inputClassName} value={formState.firstName} onChange={(event) => setField("firstName", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Last name</span>
              <input className={inputClassName} value={formState.lastName} onChange={(event) => setField("lastName", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>NIC</span>
              <input className={inputClassName} value={formState.nic} onChange={(event) => setField("nic", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Date of birth</span>
              <input type="date" className={inputClassName} value={formState.dateOfBirth} onChange={(event) => setField("dateOfBirth", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Gender</span>
              <select className={inputClassName} value={formState.gender} onChange={(event) => setField("gender", event.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Blood group</span>
              <select className={inputClassName} value={formState.bloodGroup} onChange={(event) => setField("bloodGroup", event.target.value)}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group || "empty"} value={group}>
                    {group || "Not provided"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-[26px] border border-slate-100 bg-white/80 p-5 ring-1 ring-white/70">
          <h3 className="text-lg font-bold text-slate-900">Contact Info</h3>
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className={labelClassName}>Phone</span>
              <input className={inputClassName} value={formState.phone} onChange={(event) => setField("phone", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Address</span>
              <textarea className={`${inputClassName} min-h-24 resize-none`} value={formState.address} onChange={(event) => setField("address", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-[26px] border border-slate-100 bg-white/80 p-5 ring-1 ring-white/70">
          <h3 className="text-lg font-bold text-slate-900">Family / Guardian</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className={labelClassName}>Family</span>
              <select className={inputClassName} value={formState.familyId} onChange={(event) => setField("familyId", event.target.value)} disabled={loadingFamilies}>
                <option value="">{loadingFamilies ? "Loading families..." : "No family selected"}</option>
                {familyOptions.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Guardian name</span>
              <input className={inputClassName} value={formState.guardianName} onChange={(event) => setField("guardianName", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Guardian relationship</span>
              <input className={inputClassName} value={formState.guardianRelationship} onChange={(event) => setField("guardianRelationship", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Guardian NIC</span>
              <input className={inputClassName} value={formState.guardianNic} onChange={(event) => setField("guardianNic", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Guardian phone</span>
              <input className={inputClassName} value={formState.guardianPhone} onChange={(event) => setField("guardianPhone", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="space-y-3 rounded-[26px] border border-slate-100 bg-slate-50/80 p-5 ring-1 ring-white/70">
          <h3 className="text-lg font-bold text-slate-900">Read-only sections</h3>
          <div className="grid gap-2 text-sm text-slate-600">
            <div>Patient identity, visit summary, timeline, and system metadata stay read-only here.</div>
            <div>Use the dedicated clinical actions for allergies, conditions, vitals, and history notes.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
