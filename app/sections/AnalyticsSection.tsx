'use client';

import React, { useMemo, useState } from 'react';

interface DiseaseRecord {
    id: string;
    disease: string;
    patient: string;
    gender: 'Male' | 'Female';
    age: number;
    family: string;
    month: string; // YYYY-MM
    recurrence: number;
    source: 'Clinic' | 'Outside';
}

const SHADOWS = {
    card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
    inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]',
    chip: 'shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
} as const;

const TileCard: React.FC<{ className?: string; tone?: 'sky' | 'slate' | 'emerald' | 'pink'; children: React.ReactNode }> = ({
    className = '',
    tone = 'slate',
    children,
}) => {
    const palette = {
        sky: 'from-sky-50/80 to-white',
        slate: 'from-white to-slate-50/70',
        emerald: 'from-emerald-50/80 to-white',
        pink: 'from-purple-50/80 to-white',
    } as const;

    return (
        <div
            className={`relative rounded-3xl border border-white/80 bg-gradient-to-br ${palette[tone]} p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70 ${className}`}
        >
            {children}
        </div>
    );
};

const diseaseRecords: DiseaseRecord[] = [
    {
        id: 'd-01',
        disease: 'Fever',
        patient: 'Ranil Wickramasinghe',
        gender: 'Male',
        age: 70,
        family: 'Wickramasinghe',
        month: '2024-05',
        recurrence: 2,
        source: 'Clinic',
    },
    {
        id: 'd-02',
        disease: 'Headache',
        patient: 'Chandraka Bandaranayaka',
        gender: 'Female',
        age: 65,
        family: 'Bandaranayaka',
        month: '2024-04',
        recurrence: 1,
        source: 'Clinic',
    },
    {
        id: 'd-03',
        disease: 'Diabetes',
        patient: 'Mahinda Rajapaksha',
        gender: 'Male',
        age: 66,
        family: 'Rajapaksha',
        month: '2024-03',
        recurrence: 4,
        source: 'Clinic',
    },
    {
        id: 'd-04',
        disease: 'Fever',
        patient: 'Chandrika Bandranayaka',
        gender: 'Female',
        age: 63,
        family: 'Bandaranayaka',
        month: '2024-06',
        recurrence: 1,
        source: 'Outside',
    },
    {
        id: 'd-05',
        disease: 'Hypertension',
        patient: 'Premadasa',
        gender: 'Male',
        age: 66,
        family: 'Premadasa',
        month: '2024-06',
        recurrence: 3,
        source: 'Clinic',
    },
    {
        id: 'd-06',
        disease: 'Asthma',
        patient: 'JR Jayawardhana',
        gender: 'Male',
        age: 62,
        family: 'Jayawardhana',
        month: '2024-05',
        recurrence: 2,
        source: 'Outside',
    },
    {
        id: 'd-07',
        disease: 'Fever',
        patient: 'Mitreepala Sirisena',
        gender: 'Male',
        age: 68,
        family: 'Sirisena',
        month: '2024-04',
        recurrence: 1,
        source: 'Clinic',
    },
    {
        id: 'd-08',
        disease: 'Hypertension',
        patient: 'Dulani Wickramasinghe',
        gender: 'Female',
        age: 54,
        family: 'Wickramasinghe',
        month: '2024-02',
        recurrence: 2,
        source: 'Outside',
    },
    {
        id: 'd-09',
        disease: 'Diabetes',
        patient: 'Tharindu Perera',
        gender: 'Male',
        age: 48,
        family: 'Perera',
        month: '2024-05',
        recurrence: 1,
        source: 'Clinic',
    },
    {
        id: 'd-10',
        disease: 'Asthma',
        patient: 'Ishara Perera',
        gender: 'Female',
        age: 44,
        family: 'Perera',
        month: '2024-03',
        recurrence: 2,
        source: 'Clinic',
    },
    {
        id: 'd-11',
        disease: 'Fever',
        patient: 'Pramod Silva',
        gender: 'Male',
        age: 29,
        family: 'Silva',
        month: '2024-06',
        recurrence: 1,
        source: 'Outside',
    },
    {
        id: 'd-12',
        disease: 'Headache',
        patient: 'Samanthi Silva',
        gender: 'Female',
        age: 31,
        family: 'Silva',
        month: '2024-05',
        recurrence: 1,
        source: 'Clinic',
    },
];

const monthName = (month: string) => {
    const [year, monthIndex] = month.split('-').map(Number);
    return new Date(year, monthIndex - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const toPercentage = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

export default function AnalyticsSection() {
    const [search, setSearch] = useState('');
    const [gender, setGender] = useState<'all' | 'Male' | 'Female'>('all');
    const [month, setMonth] = useState<string>('all');
    const [family, setFamily] = useState<string>('all');
    const [disease, setDisease] = useState<string>('all');
    const [compareDisease, setCompareDisease] = useState<string>('Fever');

    const families = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.family))), []);
    const diseaseNames = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.disease))), []);
    const months = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.month))).sort(), []);

    const filteredRecords = useMemo(() => {
        return diseaseRecords.filter((entry) => {
            const matchesSearch = `${entry.disease} ${entry.patient} ${entry.family}`
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesGender = gender === 'all' || entry.gender === gender;
            const matchesMonth = month === 'all' || entry.month === month;
            const matchesFamily = family === 'all' || entry.family === family;
            const matchesDisease = disease === 'all' || entry.disease === disease;

            return matchesSearch && matchesGender && matchesMonth && matchesFamily && matchesDisease;
        });
    }, [search, gender, month, family, disease]);

    const diseaseBreakdown = useMemo(() => {
        const map = new Map<string, { total: number; male: number; female: number; ages: number[] }>();
        filteredRecords.forEach((item) => {
            const current = map.get(item.disease) || { total: 0, male: 0, female: 0, ages: [] };
            current.total += 1;
            current.ages.push(item.age);
            if (item.gender === 'Male') current.male += 1;
            if (item.gender === 'Female') current.female += 1;
            map.set(item.disease, current);
        });

        return Array.from(map.entries())
            .map(([key, value]) => ({ disease: key, ...value }))
            .sort((a, b) => b.total - a.total);
    }, [filteredRecords]);

    const topDisease = diseaseBreakdown[0];
    const allFamilies = useMemo(() => new Set(diseaseRecords.map((item) => item.family)), []);
    const activeFamilies = useMemo(() => new Set(filteredRecords.map((item) => item.family)), [filteredRecords]);

    const monthlyTrend = useMemo(() => {
        const map = new Map<string, number>();
        const relevant = disease === 'all' ? filteredRecords : filteredRecords.filter((item) => item.disease === disease);
        relevant.forEach((item) => {
            map.set(item.month, (map.get(item.month) || 0) + 1);
        });
        return months.map((monthKey) => ({
            month: monthKey,
            count: map.get(monthKey) || 0,
        }));
    }, [filteredRecords, months, disease]);

    const comparison = useMemo(() => {
        const targetDisease = compareDisease || 'Fever';
        const sortedMonths = [...months].sort();
        const latest = sortedMonths[sortedMonths.length - 1];
        const previous = sortedMonths[sortedMonths.length - 2];

        const countFor = (monthKey?: string) =>
            filteredRecords.filter((item) => item.disease === targetDisease && (!monthKey || item.month === monthKey)).length;

        const latestCount = countFor(latest);
        const prevCount = countFor(previous);
        const delta = latestCount - prevCount;
        const percentageChange = prevCount === 0 ? 100 : Math.round((delta / prevCount) * 100);

        return { targetDisease, latest, previous, latestCount, prevCount, delta, percentageChange };
    }, [filteredRecords, months, compareDisease]);

    const totalMale = useMemo(() => filteredRecords.filter((entry) => entry.gender === 'Male').length, [filteredRecords]);
    const totalFemale = useMemo(() => filteredRecords.filter((entry) => entry.gender === 'Female').length, [filteredRecords]);

    const sourceSplit = useMemo(
        () => ({
            clinic: filteredRecords.filter((entry) => entry.source === 'Clinic').length,
            outside: filteredRecords.filter((entry) => entry.source === 'Outside').length,
        }),
        [filteredRecords]
    );

    const uniqueDiseases = useMemo(() => new Set(filteredRecords.map((entry) => entry.disease)).size, [filteredRecords]);
    const averageRecurrence = useMemo(
        () => (filteredRecords.length === 0 ? 0 : filteredRecords.reduce((sum, item) => sum + item.recurrence, 0) / filteredRecords.length),
        [filteredRecords]
    );

    const latestMonthLabel = useMemo(() => {
        const lastMonth = months[months.length - 1];
        return lastMonth ? monthName(lastMonth) : 'Latest month';
    }, [months]);

    const sparkline = useMemo(() => {
        if (!monthlyTrend.length) return { path: '', area: '' };
        const width = 260;
        const height = 82;
        const maxValue = Math.max(...monthlyTrend.map((item) => item.count), 1);
        const coordinates = monthlyTrend.map((item, index) => {
            const x = (index / Math.max(monthlyTrend.length - 1, 1)) * width;
            const y = height - (item.count / maxValue) * height;
            return { x, y };
        });

        const line = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
        const area = `${line} L ${width} ${height} L 0 ${height} Z`;

        return { path: line, area };
    }, [monthlyTrend]);

    const topFourDiseases = useMemo(() => diseaseBreakdown.slice(0, 4), [diseaseBreakdown]);

    const handleDownload = () => {
        const payload = {
            generatedAt: new Date().toISOString(),
            filters: { search, gender, month, family, disease },
            diseaseBreakdown,
            monthlyTrend,
            comparison,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'doctor-disease-report.json';
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const resetFilters = () => {
        setSearch('');
        setGender('all');
        setMonth('all');
        setFamily('all');
        setDisease('all');
    };

    return (
        <section id="analytics" className="px-4 py-8 md:px-8">
            <div className="mx-auto space-y-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                            Insights control room
                            <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] font-semibold text-white">Live</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Disease Intelligence</h1>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Tiles</span>
                            <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Infographics</span>
                            <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Responsive</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
                        <button
                            onClick={handleDownload}
                            className="ios-button-primary rounded-2xl px-4 py-2 text-xs shadow-[0_14px_28px_rgba(14,165,233,0.35)]"
                        >
                            ⬇️ Export JSON
                        </button>
                        <button
                            onClick={resetFilters}
                            className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                        >
                            🔄 Reset
                        </button>
                    </div>
                </header>

                <TileCard className="lg:col-span-4" tone="sky">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <span>Quick filters</span>
                        <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] text-slate-700">Mini controls</span>
                    </div>
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                        <div
                            className={`flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 ${SHADOWS.inset}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-slate-500">
                                <path d="M10 21h4" />
                                <path d="M12 17v4" />
                                <path d="m7 13-1-1a2 2 0 0 1 2-3h1.5" />
                                <path d="M10 5a2 2 0 1 1 4 0v7a2 2 0 1 1-4 0Z" />
                            </svg>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search disease or family"
                                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>
                        <select
                            value={gender}
                            onChange={(event) => setGender(event.target.value as 'all' | 'Male' | 'Female')}
                            className="min-w-[160px] rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                            <option value="all">All genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select
                            value={family}
                            onChange={(event) => setFamily(event.target.value)}
                            className="min-w-[160px] rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                            <option value="all">All families</option>
                            {families.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={disease}
                            onChange={(event) => setDisease(event.target.value)}
                            className="min-w-[160px] rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                            <option value="all">All diseases</option>
                            {diseaseNames.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            className="min-w-[160px] rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                            <option value="all">All months</option>
                            {months.map((monthKey) => (
                                <option key={monthKey} value={monthKey}>
                                    {monthName(monthKey)}
                                </option>
                            ))}
                        </select>
                        <div className="flex min-w-[170px] items-center justify-between rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 ring-1 ring-slate-100">
                            <div className="inline-flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                                Live tiles
                            </div>
                            <span className="rounded-full bg-slate-700/90 px-2 py-1 text-[10px] text-white">{filteredRecords.length} results</span>
                        </div>
                    </div>
                </TileCard>

                <div className="grid auto-rows-fr gap-4 lg:grid-cols-4">
                    <TileCard className="lg:col-span-2">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Filtered visits</p>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-4xl font-bold leading-tight text-slate-900">{filteredRecords.length}</p>
                                    <span className="rounded-full bg-slate-700/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                        {uniqueDiseases} diseases
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">{toPercentage(filteredRecords.length, diseaseRecords.length)}% of {diseaseRecords.length} visits</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Families</p>
                                <p className="text-3xl font-bold text-slate-900">{activeFamilies.size}</p>
                                <p className="text-xs text-slate-500">{toPercentage(activeFamilies.size, allFamilies.size)}% coverage</p>
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <span>Flow</span>
                                <span>{latestMonthLabel}</span>
                            </div>
                            <svg viewBox="0 0 260 100" className="mt-2 h-24 w-full text-sky-500">
                                <defs>
                                    <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.08" />
                                    </linearGradient>
                                </defs>
                                {sparkline.area && <path d={sparkline.area} fill="url(#spark)" />}
                                {sparkline.path && <path d={sparkline.path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
                            </svg>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                <div className="rounded-xl bg-sky-50/70 px-3 py-2 text-sky-700">
                                    <p className="text-lg font-bold text-slate-900">{totalMale}</p>
                                    <p>Male</p>
                                </div>
                                <div className="rounded-xl bg-purple-50/70 px-3 py-2 text-purple-600">
                                    <p className="text-lg font-bold text-slate-900">{totalFemale}</p>
                                    <p>Female</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50/70 px-3 py-2 text-emerald-700">
                                    <p className="text-lg font-bold text-slate-900">{averageRecurrence.toFixed(1)}x</p>
                                    <p>Recurrence</p>
                                </div>
                            </div>
                        </div>
                    </TileCard>

                    <TileCard tone="sky">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Dominant condition</span>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] text-slate-700">Top</span>
                        </div>
                        {topDisease ? (
                            <div className="mt-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xl font-bold text-slate-900">{topDisease.disease}</p>
                                    <div className="rounded-full bg-slate-700/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                        {topDisease.total} visits
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                    <div className="rounded-xl bg-white/70 p-3">
                                        <p className="text-xl font-bold text-slate-900">{topDisease.male}</p>
                                        <p>Male</p>
                                    </div>
                                    <div className="rounded-xl bg-white/70 p-3">
                                        <p className="text-xl font-bold text-slate-900">{topDisease.female}</p>
                                        <p>Female</p>
                                    </div>
                                    <div className="rounded-xl bg-white/70 p-3">
                                        <p className="text-xl font-bold text-slate-900">{Math.round(topDisease.ages.reduce((sum, age) => sum + age, 0) / Math.max(topDisease.ages.length, 1))}</p>
                                        <p>Avg age</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs font-semibold text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span>Clinic</span>
                                        <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                            {filteredRecords.filter((entry) => entry.source === 'Clinic' && entry.disease === topDisease.disease).length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Outside</span>
                                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                                            {filteredRecords.filter((entry) => entry.source === 'Outside' && entry.disease === topDisease.disease).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">Adjust filters to see the dominant profile.</p>
                        )}
                    </TileCard>

                    <TileCard tone="emerald">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Month over month</span>
                            <select
                                value={compareDisease}
                                onChange={(event) => setCompareDisease(event.target.value)}
                                className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm"
                            >
                                {diseaseNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            <div className="rounded-xl bg-white/80 p-3">
                                <p className="text-2xl font-bold text-slate-900">{comparison.latestCount}</p>
                                <p>{comparison.latest ? monthName(comparison.latest) : 'Latest'}</p>
                            </div>
                            <div className="rounded-xl bg-white/80 p-3">
                                <p className="text-2xl font-bold text-slate-900">{comparison.prevCount}</p>
                                <p>{comparison.previous ? monthName(comparison.previous) : 'Prev'}</p>
                            </div>
                            <div className="rounded-xl bg-white/80 p-3">
                                <p className="text-2xl font-bold text-slate-900">{comparison.delta >= 0 ? '+' : ''}{comparison.delta}</p>
                                <p>Shift</p>
                            </div>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, comparison.percentageChange + 100)) / 2}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{comparison.percentageChange}% swing</p>
                    </TileCard>
                </div>

                <div className="grid auto-rows-fr gap-4 lg:grid-cols-4">
                    <TileCard className="lg:col-span-2" tone="sky">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Trend line</span>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] text-slate-700">{disease === 'all' ? 'All diseases' : disease}</span>
                        </div>
                        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
                            <div className="overflow-hidden rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                                <svg viewBox="0 0 320 140" className="h-36 w-full text-sky-500">
                                    <defs>
                                        <linearGradient id="trendArea" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.06" />
                                        </linearGradient>
                                    </defs>
                                    {sparkline.area && <path d={sparkline.area.replaceAll('260', '320')} fill="url(#trendArea)" />}
                                    {sparkline.path && <path d={sparkline.path.replaceAll('260', '320')} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
                                </svg>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    {monthlyTrend.slice(-3).map((item) => (
                                        <div key={item.month} className="rounded-xl bg-sky-50/80 px-3 py-2 text-sky-700">
                                            <p className="text-lg font-bold text-slate-900">{item.count}</p>
                                            <p>{monthName(item.month)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Source split</p>
                                    <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                                        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Clinic {sourceSplit.clinic}</span>
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Outside {sourceSplit.outside}</span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-400 to-sky-600"
                                            style={{ width: `${toPercentage(sourceSplit.clinic, Math.max(1, sourceSplit.clinic + sourceSplit.outside))}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Families touched</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">{activeFamilies.size}</p>
                                    <p className="text-xs text-slate-500">{toPercentage(activeFamilies.size, allFamilies.size)}% of {allFamilies.size}</p>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        {[...activeFamilies].slice(0, 3).map((familyName) => (
                                            <span key={familyName} className="rounded-xl bg-slate-50 px-2 py-2 text-slate-700">
                                                {familyName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TileCard>

                    <TileCard tone="pink">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Gender mix</span>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] text-slate-700">{totalMale + totalFemale} people</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="relative h-28 w-28 rounded-full bg-white/70">
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `conic-gradient(#0ea5e9 ${toPercentage(totalMale, totalMale + totalFemale)}%, #a855f7 0)`,
                                    }}
                                />
                                <div className="absolute inset-3 rounded-full bg-white/90" />
                                <div className="absolute inset-6 flex items-center justify-center rounded-full bg-slate-50">
                                    <p className="text-lg font-bold text-slate-900">{toPercentage(totalMale, totalMale + totalFemale)}%</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 text-sm font-semibold text-slate-700">
                                <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 ring-1 ring-sky-100">
                                    <span className="inline-flex items-center gap-2 text-sky-600">
                                        <span className="h-2 w-2 rounded-full bg-sky-500" /> Male
                                    </span>
                                    <span>{totalMale}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 ring-1 ring-purple-100">
                                    <span className="inline-flex items-center gap-2 text-purple-600">
                                        <span className="h-2 w-2 rounded-full bg-purple-500" /> Female
                                    </span>
                                    <span>{totalFemale}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
                                    <span className="text-slate-600">Unique diseases</span>
                                    <span>{uniqueDiseases}</span>
                                </div>
                            </div>
                        </div>
                    </TileCard>

                    <TileCard tone="emerald">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Check-in pace</span>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] text-slate-700">Monthly</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold text-slate-700">
                            {monthlyTrend.slice(-4).map((item) => (
                                <div key={item.month} className="rounded-xl bg-white/80 p-3 ring-1 ring-emerald-100">
                                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                                        <span>{monthName(item.month)}</span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{item.count}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                            style={{ width: `${Math.min(100, item.count * 20)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Flow kept compact inside tiles</p>
                    </TileCard>
                </div>

                <div className="grid auto-rows-fr gap-4 lg:grid-cols-4">
                    <TileCard className="lg:col-span-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <span>Conditions board</span>
                            <span className="rounded-full bg-slate-700/90 px-3 py-1 text-[10px] font-semibold text-white">{topFourDiseases.length} tiles</span>
                        </div>
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                            {topFourDiseases.map((item) => {
                                const total = item.male + item.female;
                                const maleWidth = total === 0 ? 0 : Math.round((item.male / total) * 100);
                                const femaleWidth = total === 0 ? 0 : 100 - maleWidth;

                                return (
                                    <div key={item.disease} className="min-w-[240px] flex-1 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-100">
                                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                                                {item.disease}
                                            </div>
                                            <span className="rounded-full bg-slate-700/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                                                {item.total} pts
                                            </span>
                                        </div>
                                        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500" style={{ width: `${maleWidth}%` }} />
                                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500" style={{ width: `${femaleWidth}%` }} />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                                            <span>{item.male} male</span>
                                            <span>{item.female} female</span>
                                            <span>Avg {Math.round(item.ages.reduce((sum, age) => sum + age, 0) / Math.max(item.ages.length, 1))}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TileCard>
                </div>
            </div>
        </section>
    );
}
