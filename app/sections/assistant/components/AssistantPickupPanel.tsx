import type { Prescription } from '../types';

type AssistantPickupPanelProps = {
    activePrescription?: Prescription;
    onDoneAndNext: () => void;
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
        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{title}</span>
                <span className={`rounded-full px-3 py-1 ${statusClassName}`}>{status}</span>
            </div>
            <div className="space-y-2">
                {entries.map((drug) => (
                    <div key={drug.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <div>
                            <p className="text-slate-900">{drug.name}</p>
                            <p className="text-[11px] text-slate-500">
                                {drug.dose} · {drug.terms}
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{drug.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AssistantPickupPanel({ activePrescription, onDoneAndNext }: AssistantPickupPanelProps) {
    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Doctor Checked Patient</h2>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">03</span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700 shadow-[0_8px_18px_rgba(148,163,184,0.28)]">Patient</span>
                </div>
            </div>
            {activePrescription ? (
                <div className="space-y-4 text-sm text-slate-800">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Patient No</span>
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{activePrescription.id}</span>
                            </div>
                            <span className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700">Bill paid</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500">Patient Name</p>
                                <p className="text-lg font-semibold text-slate-900">{activePrescription.patient}</p>
                                <p className="text-xs text-slate-500">NIC {activePrescription.nic}</p>
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white shadow-[0_6px_14px_rgba(10,132,255,0.35)]">Download</span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-400 line-through">Medical report locked</span>
                        </div>
                        <button
                            type="button"
                            className="rounded-2xl bg-[var(--ioc-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:-translate-y-0.5 hover:bg-[#0070f0]"
                            onClick={onDoneAndNext}
                        >
                            Done & Next
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-500">No prescriptions waiting for pickup.</p>
            )}
        </>
    );
}
