import type React from 'react';
import type { AssistantFormState } from '../types';

type AssistantIntakePanelProps = {
    formState: AssistantFormState;
    setFormState: React.Dispatch<React.SetStateAction<AssistantFormState>>;
    addAllergy: () => void;
    addPatient: () => void;
    canManageAssistantWorkflow?: boolean;
    workflowActionDisabledReason?: string | null;
    isSubmitting?: boolean;
};

const bloodGroups = ['A+', 'A-', 'B+', 'O+', 'AB+'] as const;
const priorityLevels = ['Normal', 'Urgent', 'Critical'] as const;

export function AssistantIntakePanel({
    formState,
    setFormState,
    addAllergy,
    addPatient,
    canManageAssistantWorkflow = true,
    workflowActionDisabledReason = null,
    isSubmitting = false,
}: AssistantIntakePanelProps) {
    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add Patient to System</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">Pre-registration</span>
            </div>
            <div className="space-y-3 text-sm text-slate-800">
                <div className="grid grid-cols-2 gap-3">
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Enter Patient NIC"
                        value={formState.nic}
                        disabled={!canManageAssistantWorkflow}
                        onChange={(e) => setFormState((prev) => ({ ...prev, nic: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Patient Name"
                        value={formState.name}
                        disabled={!canManageAssistantWorkflow}
                        onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Mobile Number"
                        value={formState.mobile}
                        disabled={!canManageAssistantWorkflow}
                        onChange={(e) => setFormState((prev) => ({ ...prev, mobile: e.target.value }))}
                    />
                    <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                        placeholder="Age"
                        value={formState.age}
                        disabled={!canManageAssistantWorkflow}
                        onChange={(e) => setFormState((prev) => ({ ...prev, age: e.target.value.replace(/[^0-9]/g, '') }))}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {formState.allergies.map((allergy) => (
                        <span key={allergy} className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                            {allergy}
                            <button
                                type="button"
                                className="rounded-full bg-white px-2 text-rose-600 ring-1 ring-rose-100"
                                disabled={!canManageAssistantWorkflow}
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
                            disabled={!canManageAssistantWorkflow}
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
                            disabled={isSubmitting || !canManageAssistantWorkflow}
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
                                disabled={!canManageAssistantWorkflow}
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
                                disabled={!canManageAssistantWorkflow}
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
                        disabled={isSubmitting || !canManageAssistantWorkflow}
                        className="rounded-2xl bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:-translate-y-0.5 hover:bg-[#0070f0] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Adding patient...' : 'Add Patient'}
                    </button>
                </div>
                {!canManageAssistantWorkflow && workflowActionDisabledReason ? (
                    <p className="text-sm font-semibold text-amber-700">{workflowActionDisabledReason}</p>
                ) : null}
            </div>
        </>
    );
}
