"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FAMILY_RELATIONSHIPS,
  portalAddFamilyMember,
  portalDeleteFamilyMember,
  portalGetFamily,
  portalUpdateFamilyMember,
  portalUpdateFamilyName,
  type FamilyRelationship,
  type PortalFamilyMember,
  type PortalFamilyMemberInput,
} from "@/app/lib/portal-api";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const emptyMember: PortalFamilyMemberInput = {
  firstName: "",
  lastName: "",
  relationship: "son",
  dob: "",
  gender: "male",
  nic: "",
  phone: "",
  bloodGroup: "",
  allergies: [],
};

export function PortalFamilySection() {
  const queryClient = useQueryClient();
  const family = useQuery({ queryKey: ["portal", "family"], queryFn: portalGetFamily });

  // Derived draft: the input shows the edited value, else the loaded family name — no
  // effect needed to mirror server state into local state.
  const [draftName, setDraftName] = useState<string | null>(null);
  const familyName = draftName ?? family.data?.familyName ?? "";

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<PortalFamilyMemberInput>(emptyMember);
  const [allergyText, setAllergyText] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["portal", "family"] });

  const saveName = useMutation({
    mutationFn: () => portalUpdateFamilyName(familyName.trim() || null),
    onSuccess: () => {
      setDraftName(null);
      invalidate();
    },
  });

  const saveMember = useMutation({
    mutationFn: async () => {
      const payload: PortalFamilyMemberInput = {
        ...form,
        nic: form.nic?.trim() || null,
        dob: form.dob || null,
        bloodGroup: form.bloodGroup || null,
        allergies: allergyText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, severity: "moderate" as const })),
      };
      if (editingId === "new") {
        await portalAddFamilyMember(payload);
      } else {
        await portalUpdateFamilyMember(editingId as number, payload);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setForm(emptyMember);
      setAllergyText("");
      invalidate();
    },
  });

  const removeMember = useMutation({
    mutationFn: (id: number) => portalDeleteFamilyMember(id),
    onSuccess: invalidate,
  });

  const startEdit = (m: PortalFamilyMember) => {
    setEditingId(m.id);
    setForm({
      firstName: m.firstName,
      lastName: m.lastName,
      relationship: m.relationship,
      dob: m.dob ?? "",
      gender: m.gender ?? "male",
      nic: m.nic ?? "",
      phone: m.phone ?? "",
      bloodGroup: m.bloodGroup ?? "",
    });
    setAllergyText((m.allergies ?? []).map((a) => a.name).join(", "));
  };
  const startAdd = () => {
    setEditingId("new");
    setForm(emptyMember);
    setAllergyText("");
  };

  const members = family.data?.members ?? [];
  const canSaveMember = form.firstName.trim() && form.lastName.trim() && !saveMember.isPending;

  return (
    <section className="space-y-4 rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">My Family</h2>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
        >
          + Add member
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Family name</span>
          <input
            value={familyName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="e.g. Perera Family"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <button
          type="button"
          disabled={saveName.isPending || familyName.trim() === (family.data?.familyName ?? "")}
          onClick={() => saveName.mutate()}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>

      {family.isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : members.length > 0 ? (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {m.firstName} {m.lastName}
                  <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-sky-700">
                    {m.relationship}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {m.age != null ? `Age ${m.age}` : "No DOB"}
                  {" · NIC "}
                  {m.effectiveNic || "—"}
                  {m.nic ? "" : m.effectiveNic ? " (guardian)" : ""}
                  {m.bloodGroup ? ` · ${m.bloodGroup}` : ""}
                  {m.allergies && m.allergies.length ? ` · ${m.allergies.length} allergy(s)` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => startEdit(m)} className="text-xs font-semibold text-sky-700 hover:underline">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeMember.mutate(m.id)}
                  className="text-xs font-medium text-slate-400 hover:text-rose-500"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Add your family members so their records are shared with your doctors.</p>
      )}

      {editingId !== null ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={() => setEditingId(null)}>
          <div
            className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:rounded-[28px] sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-base font-bold text-slate-900">{editingId === "new" ? "Add family member" : "Edit member"}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
                <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Relationship</span>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value as FamilyRelationship })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-sky-400"
                  >
                    {FAMILY_RELATIONSHIPS.map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Gender</span>
                  <select
                    value={form.gender ?? "male"}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" | "other" })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Date of birth</span>
                  <input
                    type="date"
                    value={form.dob ?? ""}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Blood group</span>
                  <select
                    value={form.bloodGroup ?? ""}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400"
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g || "—"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Field label="NIC (optional — auto-filled for under-18 from parent)" value={form.nic ?? ""} onChange={(v) => setForm({ ...form, nic: v })} />
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Allergies (comma separated)</span>
                <input
                  value={allergyText}
                  onChange={(e) => setAllergyText(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSaveMember}
                onClick={() => saveMember.mutate()}
                className="flex-1 rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saveMember.isPending ? "Saving…" : "Save member"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
