import type { Prescription } from '../types';

type AssistantPickupPanelProps = {
    activePrescription?: Prescription;
    queueCount: number;
    onDoneAndNext: () => void;
    canManageAssistantWorkflow?: boolean;
    workflowActionDisabledReason?: string | null;
    isSubmitting?: boolean;
    isLoading?: boolean;
};

function DrugColumn({
    title,
    status,
    statusClassName,
    entries,
}: {
    title: string;
    status: string;
    statusClassName: string;
    entries: { name: string; dose: string; terms: string; amount: number }[];
}) {
    return (
        <div className="space-y-2 rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[inset_0_1px_2px_rgba(148,163,184,0.14),0_10px_22px_rgba(148,163,184,0.06)]">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">{title}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClassName}`}>{status}</span>
            </div>
            <div className="space-y-2">
                {entries.map((drug) => (
                    <div key={drug.name} className="flex items-center justify-between rounded-[18px] bg-slate-50 px-3 py-2.5">
                        <div>
                            <p className="font-semibold text-slate-900">{drug.name}</p>
                            <p className="text-[11px] text-slate-500">
                                {drug.dose} | {drug.terms}
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{drug.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AssistantPickupPanel({
    activePrescription,
    queueCount,
    onDoneAndNext,
    canManageAssistantWorkflow = true,
    workflowActionDisabledReason = null,
    isSubmitting = false,
    isLoading = false,
}: AssistantPickupPanelProps) {
    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Doctor Checked Patient</h2>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{queueCount}</span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700 shadow-[0_8px_18px_rgba(148,163,184,0.28)]">Patient</span>
                </div>
            </div>
            {isLoading ? (
                <p className="text-sm font-semibold text-slate-500">Loading dispense queue...</p>
            ) : activePrescription ? (
                <div className="space-y-4 text-sm text-slate-800">
                    <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50/35 px-4 py-4 shadow-[0_18px_38px_rgba(148,163,184,0.08)] ring-1 ring-white/80">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Patient No</span>
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                                    {activePrescription.patientCode || activePrescription.prescriptionId || "--"}
                                </span>
                            </div>
                            <span className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700">Bill paid</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500">Patient Name</p>
                                <p className="text-lg font-semibold text-slate-900">{activePrescription.patient}</p>
                                <p className="text-xs text-slate-500">
                                    {activePrescription.patientCode ? `Code ${activePrescription.patientCode}` : `NIC ${activePrescription.nic}`}
                                    {activePrescription.guardianNic ? ` | Guardian NIC ${activePrescription.guardianNic}` : ''}
                                </p>
                            </div>
                            <div className="flex items-end justify-end gap-3 text-sm font-semibold text-slate-700">
                                <span className="rounded-full bg-slate-200 px-4 py-2 text-slate-700">Age {activePrescription.age}</span>
                                <span className={`rounded-full px-4 py-2 ${activePrescription.gender === 'Female' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                    {activePrescription.gender}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                            <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">Disease</span>
                            <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">{activePrescription.diagnosis}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                        <DrugColumn
                            title="Clinical Drugs"
                            status="Given"
                            statusClassName="bg-lime-100 text-lime-700"
                            entries={activePrescription.clinical}
                        />
                        <DrugColumn
                            title="Outside Drugs"
                            status="Pending"
                            statusClassName="bg-orange-100 text-orange-700"
                            entries={activePrescription.outside}
                        />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                        <button
                            type="button"
                            disabled
                            className="app-button app-button--soft app-button--full"
                        >
                            Medical report locked
                        </button>
                        <button
                            type="button"
                            className="app-button app-button--primary app-button--full"
                            onClick={onDoneAndNext}
                            disabled={isSubmitting || !canManageAssistantWorkflow}
                        >
                            {isSubmitting ? 'Saving...' : 'Done & Next'}
                        </button>
                    </div>
                    {!canManageAssistantWorkflow && workflowActionDisabledReason ? (
                        <p className="text-sm font-semibold text-amber-700">{workflowActionDisabledReason}</p>
                    ) : null}
                </div>
            ) : (
                <p className="text-sm text-slate-500">No prescriptions waiting for pickup.</p>
            )}
        </>
    );
}
