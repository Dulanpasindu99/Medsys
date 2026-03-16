import type React from 'react';
import type { AssistantFormState, AssistantPatientOption } from '../types';

type AssistantIntakePanelProps = {
    formState: AssistantFormState;
    setFormState: React.Dispatch<React.SetStateAction<AssistantFormState>>;
    patientOptions: AssistantPatientOption[];
    addAllergy: () => void;
    addPatient: () => void;
    canCreatePatients?: boolean;
    patientActionDisabledReason?: string | null;
    isSubmitting?: boolean;
};

const bloodGroups = ['A+', 'A-', 'B+', 'O+', 'AB+'] as const;
const priorityLevels = ['Normal', 'Urgent', 'Critical'] as const;

function calculateAge(dateOfBirth: string) {
    if (!dateOfBirth) return null;
    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let years = today.getUTCFullYear() - dob.getUTCFullYear();
    const beforeBirthday =
        today.getUTCMonth() < dob.getUTCMonth() ||
        (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
    if (beforeBirthday) years -= 1;
    return years;
}

export function AssistantIntakePanel({
    formState,
    setFormState,
    patientOptions,
    addAllergy,
    addPatient,
    canCreatePatients = true,
    patientActionDisabledReason = null,
    isSubmitting = false,
}: AssistantIntakePanelProps) {
    const age = calculateAge(formState.dateOfBirth);
    const isMinor = age !== null && age < 18;

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add Patient to System</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">Pre-registration</span>
            </div>
            <div className="space-y-3 text-sm text-slate-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="First name"
                        value={formState.firstName}
                        disabled={!canCreatePatients}
                        onChange={(e) => setFormState((prev) => ({ ...prev, firstName: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Last name"
                        value={formState.lastName}
                        disabled={!canCreatePatients}
                        onChange={(e) => setFormState((prev) => ({ ...prev, lastName: e.target.value }))}
                    />
                    <input
                        type="date"
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        value={formState.dateOfBirth}
                        disabled={!canCreatePatients}
                        onChange={(e) => setFormState((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder={isMinor ? "Patient NIC (optional for minors)" : "Patient NIC"}
                        value={formState.nic}
                        disabled={!canCreatePatients}
                        onChange={(e) => setFormState((prev) => ({ ...prev, nic: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Mobile Number"
                        value={formState.mobile}
                        disabled={!canCreatePatients}
                        onChange={(e) => setFormState((prev) => ({ ...prev, mobile: e.target.value }))}
                    />
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner">
                        {age === null ? 'Enter date of birth to calculate age' : `Age ${age} yrs`}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-inner">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gender</span>
                    {(['Male', 'Female'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${formState.gender === option
                                ? option === 'Female'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-700'
                                }`}
                            disabled={!canCreatePatients}
                            onClick={() => setFormState((prev) => ({ ...prev, gender: option }))}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {isMinor ? (
                    <div className="space-y-3 rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 ring-1 ring-amber-100/70">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Guardian Details</h3>
                                <p className="text-xs text-slate-600">
                                    For minors, link an existing guardian patient or capture guardian contact details.
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200">
                                Child flow
                            </span>
                        </div>
                        <select
                            value={formState.guardian.guardianPatientId}
                            disabled={!canCreatePatients}
                            onChange={(event) => {
                                const selectedId = event.target.value;
                                const selectedGuardian = patientOptions.find(
                                    (patient) => String(patient.id) === selectedId
                                );
                                setFormState((prev) => ({
                                    ...prev,
                                    guardian: {
                                        ...prev.guardian,
                                        guardianPatientId: selectedId,
                                        guardianName: selectedId ? selectedGuardian?.name ?? prev.guardian.guardianName : prev.guardian.guardianName,
                                        guardianNic: selectedId ? selectedGuardian?.nic ?? prev.guardian.guardianNic : prev.guardian.guardianNic,
                                    },
                                }));
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
                        >
                            <option value="">Link existing guardian patient (recommended)</option>
                            {patientOptions.map((patient) => (
                                <option key={patient.id} value={String(patient.id)}>
                                    {patient.name} | {patient.patientCode || patient.nic || `Patient #${patient.id}`}
                                </option>
                            ))}
                        </select>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner"
                                placeholder="Guardian name"
                                value={formState.guardian.guardianName}
                                disabled={!canCreatePatients}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        guardian: { ...prev.guardian, guardianName: e.target.value },
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner"
                                placeholder="Guardian relationship"
                                value={formState.guardian.guardianRelationship}
                                disabled={!canCreatePatients}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        guardian: { ...prev.guardian, guardianRelationship: e.target.value },
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner"
                                placeholder="Guardian NIC"
                                value={formState.guardian.guardianNic}
                                disabled={!canCreatePatients}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        guardian: { ...prev.guardian, guardianNic: e.target.value },
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner"
                                placeholder="Guardian phone"
                                value={formState.guardian.guardianPhone}
                                disabled={!canCreatePatients}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        guardian: { ...prev.guardian, guardianPhone: e.target.value },
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner md:col-span-2"
                                placeholder="Family ID (optional)"
                                value={formState.guardian.familyId}
                                disabled={!canCreatePatients}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        guardian: {
                                            ...prev.guardian,
                                            familyId: e.target.value.replace(/[^0-9]/g, ''),
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    {formState.allergies.map((allergy) => (
                        <span key={allergy} className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                            {allergy}
                            <button
                                type="button"
                                className="rounded-full bg-white px-2 text-rose-600 ring-1 ring-rose-100"
                                disabled={!canCreatePatients}
                                onClick={() =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        allergies: prev.allergies.filter((entry) => entry !== allergy),
                                    }))
                                }
                            >
                                x
                            </button>
                        </span>
                    ))}
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                        <input
                            className="bg-transparent text-xs outline-none"
                            placeholder="Add allergies"
                            value={formState.allergyInput}
                            disabled={!canCreatePatients}
                            onChange={(e) => setFormState((prev) => ({ ...prev, allergyInput: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addAllergy();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600"
                            onClick={addAllergy}
                            disabled={isSubmitting || !canCreatePatients}
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                        Blood Group
                        {bloodGroups.map((group) => (
                            <button
                                key={group}
                                type="button"
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${formState.bloodGroup === group
                                        ? 'bg-slate-700 text-white shadow-[0_10px_22px_rgba(71,85,105,0.22)]'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                disabled={!canCreatePatients}
                                onClick={() => setFormState((prev) => ({ ...prev, bloodGroup: group }))}
                            >
                                {group}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                        Priority Level
                        {priorityLevels.map((level) => (
                            <button
                                key={level}
                                type="button"
                                className={`rounded-full px-3 py-1 ${formState.priority === level ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'}`}
                                disabled={!canCreatePatients}
                                onClick={() => setFormState((prev) => ({ ...prev, priority: level }))}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        onClick={addPatient}
                        disabled={isSubmitting || !canCreatePatients}
                        className="rounded-2xl bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:-translate-y-0.5 hover:bg-[#0070f0] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Adding patient...' : 'Add Patient'}
                    </button>
                </div>
                {!canCreatePatients && patientActionDisabledReason ? (
                    <p className="text-sm font-semibold text-amber-700">{patientActionDisabledReason}</p>
                ) : null}
            </div>
        </>
    );
}
