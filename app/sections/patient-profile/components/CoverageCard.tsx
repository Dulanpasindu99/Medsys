type CoverageCardProps = {
    totalProfiles: number;
};

export function CoverageCard({ totalProfiles }: CoverageCardProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">System status</p>
                    <h2 className="text-xl font-bold text-slate-900">Profile coverage</h2>
                </div>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(71,85,105,0.35)]">
                    {totalProfiles} patients auto-styled
                </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
                Every patient shares this exact layout. Linking from patient management, assistant completion, or doctor search opens the same canonical profile.
            </p>
        </>
    );
}
