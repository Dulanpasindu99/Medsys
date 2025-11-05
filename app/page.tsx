'use client';

import React, { useEffect, useMemo, useState } from 'react';
// ...rest of your code


// MedLink Doctor Dashboard – Single-file React component
// - TailwindCSS utility classes for styling
// - Pure React state for demo interactions (search, select patient, form edits)
// - Layout mirrors the uploaded design: LEFT patient list (collapsible rows) + RIGHT detailed sheet + sticky header
// - Drop into any React/Next.js app. For Next.js, export as default in a page and ensure Tailwind is configured.

// ---- Types ----
interface Patient {
  id: string;
  name: string;
  nic: string;
  time: string;
  reason: string;
  age: number;
  gender: string;
}

export default function MedLinkDoctorDashboard() {
  // ------ Constants ------
  const DOTS_PER_ROW = 32; // header capacity grid limit per row

  // ------ Clock for footer ------
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);
  const timeStr = useMemo(
    () => now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    [now]
  );
  const dateStr = useMemo(() => now.toLocaleDateString("en-US"), [now]);

  // ------ Demo Data ------
  const patients = useMemo<Patient[]>(
    () => [
      {
        id: "p1",
        name: "Premadasa",
        nic: "61524862V",
        time: "5.00 PM",
        reason: "Feever Headach",
        age: 66,
        gender: "Male",
      },
      {
        id: "p2",
        name: "JR Jayawardhana",
        nic: "64524862V",
        time: "5.10 PM",
        reason: "Stomached Headach",
        age: 62,
        gender: "Male",
      },
      {
        id: "p3",
        name: "Mitreepala Siirisena",
        nic: "78522862V",
        time: "5.20 PM",
        reason: "Feever",
        age: 68,
        gender: "Male",
      },
      {
        id: "p4",
        name: "Chandrika Bandranayake",
        nic: "71524862V",
        time: "5.30 PM",
        reason: "Feever Headach",
        age: 63,
        gender: "Female",
      },
      {
        id: "p5",
        name: "Ranil Vicramasinghe",
        nic: "77524862V",
        time: "5.00 PM",
        reason: "Feever Headach",
        age: 76,
        gender: "Male",
      },
      {
        id: "p6",
        name: "Mahinda Rajapakshe",
        nic: "74524862V",
        time: "—",
        reason: "Headach",
        age: 66,
        gender: "Male",
      },
    ],
    []
  );

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("p6");
  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) || patients[0],
    [patients, selectedId]
  );

  // track expanded patient rows (accordion-style)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Right sheet editable state
  const [sheet] = useState({
    disease: "Feever",
    clinical: ["Ibuprofen", "Naproxen", "Acetaminophen"],
    outside: [{ name: "Perasitamol", dose: "250MG", terms: "Hourly", amount: 32 }],
    allergies: "No",
    tests: "No",
    notes: "No",
    nextVisit: "05 November 2025",
    regularDrugs: "Suger",
  });

  const [rxRows] = useState([
    { drug: "Ibuprofen", dose: "250MG", terms: "1 DAILY", amount: 2 },
    { drug: "Naproxen", dose: "250MG", terms: "1 DAILY", amount: 2 },
    { drug: "Acetaminophen", dose: "250MG", terms: "2 Hourly", amount: 3 },
  ]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nic.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q)
    );
  }, [patients, search]);

  // ------ Small UI helpers ------
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl bg-white/70 backdrop-blur shadow-sm ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  );

  const Badge = ({ label, active = false }: { label: string; active?: boolean }) => (
    <button
      className={
        "px-4 py-2 rounded-full text-sm font-medium transition" +
        (active
          ? " bg-black text-white shadow"
          : " bg-white/70 backdrop-blur ring-1 ring-black/5 hover:bg-white")
      }
    >
      {label}
    </button>
  );

  const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="flex items-end justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
    </div>
  );

  // colors that should show a hover popup (green & red only)
  const isPopupColor = (c: string) => c.includes("green") || c.includes("red");

  /**
   * Small interactive square that opens a floating popup showing patient info.
   * - Each index maps to a patient (cycled) for demo purposes.
   * - Popup mimics the uploaded design with green avatar, name, age and "New" pill.
   */
  const SquareDot = ({ index, color, patients }: { index: number; color: string; patients: Patient[] }) => {
    const [open, setOpen] = useState(false);
    const p = patients[index % patients.length];
    const isGreen = color.includes("green");
    const isRed = color.includes("red");
    const canShow = isGreen || isRed;
    const shadeGrad = isGreen ? "from-green-300/60 to-emerald-200/60" : "from-red-300/60 to-rose-200/60";
    const avatarColor = isGreen ? "bg-green-400" : "bg-red-400";

    return (
      <div
        className="relative"
        onMouseEnter={() => canShow && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span className={`inline-block h-4 w-4 rounded-md ${color}`} />
        {open && (
          <>
            {/* soft blurred glow near the hovered square */}
            <div className={`pointer-events-none absolute -inset-3 rounded-xl blur-md ${isGreen ? "bg-green-300/30" : "bg-red-300/30"}`} />
            {/* info bubble */}
            <div className={`absolute -top-24 left-1/2 w-56 -translate-x-1/2 rounded-[24px] p-3 shadow-lg ring-1 ring-black/10 backdrop-blur bg-gradient-to-r ${shadeGrad}`}>
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-xl ${avatarColor}`} />
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold leading-5">{p.name}</div>
                  <div className="text-sm text-gray-800">Age {p.age}</div>
                </div>
                <span className="shrink-0 rounded-full bg-sky-400/90 px-2 py-0.5 text-xs font-semibold text-white">New</span>
              </div>
              {/* tail */}
              <div className={`absolute -bottom-2 left-6 h-4 w-8 rounded-b-[16px] bg-gradient-to-r ${shadeGrad}`} />
            </div>
          </>
        )}
      </div>
    );
  };

  // ------ Dev Smoke Tests (run once on mount) ------
  useEffect(() => {
    // Existing invariants
    console.assert(Array.isArray(patients) && patients.length > 0, "patients array should be non-empty");
    console.assert(Array.isArray(sheet.clinical) && sheet.clinical.every((x) => typeof x === "string"), "sheet.clinical must be string[]");
    const s = new Set<string>();
    s.add("p1");
    console.assert(s.has("p1"), "Set should add id");
    s.delete("p1");
    console.assert(!s.has("p1"), "Set should delete id");

    // New tests: header grid rules
    console.assert(DOTS_PER_ROW === 32, "Header rows must contain 32 squares");
    const samplePalette = [
      ...Array(12).fill("bg-green-400"),
      "bg-red-500",
      ...Array(6).fill("bg-green-400"),
      "bg-red-500",
      ...Array(12).fill("bg-gray-300"),
    ];
    console.assert(samplePalette.length >= DOTS_PER_ROW, "Palette must cover at least one row");

    // Hover gating tests
    console.assert(isPopupColor("bg-green-400") && isPopupColor("bg-red-500"), "Green/Red should allow popup");
    console.assert(!isPopupColor("bg-gray-300"), "Gray should NOT allow popup");

    // Footer time/date tests
    console.assert(typeof timeStr === "string" && timeStr.length > 0, "timeStr should be defined");
    console.assert(typeof dateStr === "string" && dateStr.length > 0, "dateStr should be defined");
  }, []);

  // ------ Layout ------
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900">
      {/* Top bar */}
      <header className="z-10 bg-transparent/60 backdrop-blur px-8 pt-3 pb-2">
        <div className="mx-auto max-w-[1680px]">
          <div className="flex items-start justify-between gap-6">
            {/* LEFT: Title + capacity bar */}
            <div className="min-w-0">
              <div className="rounded-2xl bg-gray-200/90 px-4 py-2 text-xl font-bold leading-none inline-block">Doctor Screen</div>
              <div className="mt-3 grid grid-cols-12 items-center gap-3">
                <div className="col-span-2 text-xl font-extrabold leading-5">
                  <div>Patinas</div>
                  <div>Amount</div>
                </div>
                <div className="col-span-10">
                  {/* bar rows container with popup */}
                  <div className="relative select-none">
                    {/* row 1: interactive DOTS_PER_ROW squares */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: DOTS_PER_ROW }).map((_, i) => {
                        const palette = [
                          ...Array(12).fill("bg-green-400"),
                          "bg-red-500",
                          ...Array(6).fill("bg-green-400"),
                          "bg-red-500",
                          ...Array(12).fill("bg-gray-300"),
                        ];
                        const color = palette[i] || "bg-gray-300";
                        return <SquareDot key={i} index={i} color={color} patients={patients} />;
                      })}
                    </div>

                    {/* row 2: baseline gray DOTS_PER_ROW squares */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.from({ length: DOTS_PER_ROW }).map((_, i) => (
                        <span key={i} className="h-4 w-4 rounded-md bg-gray-300"></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE: Total patients */}
            <div className="text-right">
              <div className="text-2xl font-bold">Totall Patiants</div>
              <div className="mt-1 text-sm text-gray-600 flex items-center justify-end gap-4">
                <span>
                  New <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1 text-xs font-semibold">5</span>
                </span>
                <span>
                  Exiting <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1 text-xs font-semibold">5</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-3 py-1 text-white text-sm">
                  <span className="text-lg font-bold">{patients.length}</span>
                  <span className="text-[10px] opacity-80 leading-none">Patiants</span>
                </span>
              </div>
            </div>

            {/* RIGHT: Greeting + avatar */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-extrabold leading-6">Hi Dr.Manjith</div>
                <div className="text-xs text-gray-600">Surgen / Family Consultant</div>
              </div>
              <div className="size-10 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1680px] px-8 py-4 h-[calc(100vh-170px)] overflow-hidden">
        {/* Two-column layout: LEFT = search/list, RIGHT = detailed sheet (per mock) */}
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* RIGHT: Search + expandable patient list (full height) */}
          <div className="col-span-4 order-2 h-full pl-1">
            <Card className="p-4 h-full">
              <div className="text-sm font-semibold">SearchPatiant Name/NIC No/Mobile No</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
                <button className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white">Search</button>
              </div>

              <div className="mt-4 text-sm font-semibold">Patiant List</div>
              <div className="mt-2 space-y-2 leading-tight overflow-auto pr-1" style={{maxHeight:'calc(100% - 90px)'}}>
                {filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  const isOpen = expandedIds.has(p.id);
                  return (
                    <div key={p.id} className="w-full rounded-xl border border-black/5 bg-white/60 shadow-sm">
                      {/* Row header */}
                      <div
                        className={`flex cursor-pointer items-center justify-between px-3 py-2 ${isSelected ? "bg-black/5" : ""}`}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <div className="min-w-0" onDoubleClick={() => toggleExpand(p.id)}>
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="truncate text-[11px] text-gray-500">{p.nic}</div>
                          <div className="mt-1 text-[11px] text-gray-500">{p.reason}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-[11px] text-gray-600">{p.time}</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(p.id);
                            }}
                            className="grid size-6 place-items-center rounded-md border border-black/10 bg-white/70 text-xs"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            {isOpen ? "–" : "+"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded preview card (matches image 2 style) */}
                      {isOpen && (
                        <div className="mx-2 mb-2 rounded-2xl bg-gray-200/90 px-4 py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-semibold leading-5">{p.name}</div>
                              <div className="text-sm text-gray-700">{p.nic}</div>
                              <span className="mt-2 inline-block rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-white">Father</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                Age <span className="text-xl font-semibold">{p.age}</span>
                              </div>
                              <span className="mt-1 inline-block rounded-full bg-sky-400/90 px-2 py-0.5 text-[10px] font-semibold text-white">{p.gender}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {["Today", "05/10", "05/09", "05/08", "05/07", "05/06", "05/05", "15/04", "15/04"].map((d, i) => (
                              <span key={i} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-gray-800 text-white" : "bg-white/70 ring-1 ring-black/10"}`}>
                                {d}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
                            <div>
                              <div className="text-base font-semibold">Disease</div>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-gray-700">
                                <span>Feever</span>
                                <span>Headach</span>
                              </div>
                              <div className="mt-4 text-base font-semibold">Clinical Drugs</div>
                              <div className="mt-1 text-gray-600">
                                <div>Ibuprofen</div>
                                <div>Naproxen</div>
                                <div>Acetaminophen</div>
                              </div>
                              <div className="mt-4 text-base font-semibold">Outside Drugs</div>
                              <div className="mt-1 text-gray-700">Perasitamol</div>
                              <div className="mt-4 text-base font-semibold">Alergies</div>
                              <div className="mt-1 text-gray-700">No</div>
                            </div>
                            <div>
                              <div className="text-base font-semibold">Medical Tests</div>
                              <div className="mt-1 text-gray-700">No</div>
                              <div className="mt-4 text-base font-semibold">Special Notes</div>
                              <div className="mt-1 text-gray-700">No</div>
                              <div className="mt-6 text-base font-semibold">Next Visit Date</div>
                              <div className="mt-1 text-gray-700">05 November 2025</div>
                            </div>
                          </div>
                          <div className="mt-6">
                            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">Download as Report</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* LEFT: Full detailed sheet (per 2nd image) */}
          <div className="col-span-8 order-1 h-full overflow-hidden pr-4">
            <div className="h-full overflow-hidden rounded-[24px] bg-gray-200/90 p-5 ring-1 ring-black/5">
              {/* Top header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold leading-tight">MediHelp - Nugegoda</div>
                  <div className="text-sm text-gray-700">No.10, Abc Street Nugegoda</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">Dr.Manjith</div>
                  <div className="text-sm text-gray-700">Surgen / Family Consultant</div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-500/70 px-3 py-1 text-xs text-white">
                    <span>Previously Patiant of Dr. Jay</span>
                    <span className="rounded-full bg-black/30 px-2 py-0.5">10 SEP 25</span>
                  </div>
                </div>
              </div>

              {/* Patient line: number + inputs + gender */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium">Patiant No MH0001</div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <input className="w-48 rounded-full border border-black/30 bg-transparent px-4 py-2 text-sm placeholder-gray-500" placeholder="Enter NIC No" defaultValue={selected.nic} />
                  <button className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">Male</button>
                  <button className="rounded-full bg-purple-400/80 px-3 py-1 text-xs font-semibold text-white">Female</button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input className="flex-1 rounded-full border border-black/30 bg-transparent px-4 py-3 text-lg placeholder-gray-500" placeholder="Enter Pation Name" defaultValue={selected.name} />
                <input className="w-40 rounded-full border border-black/30 bg-transparent px-4 py-2 text-sm placeholder-gray-500" placeholder="Enter Age" defaultValue={selected.age} />
              </div>

              {/* Two-column canvas */}
              <div className="mt-4 grid grid-cols-12 gap-6">
                {/* Left stack */}
                <div className="col-span-7">
                  {/* Disease */}
                  <div className="text-2xl font-bold">Disease</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input className="w-56 rounded-full border border-black/30 bg-transparent px-4 py-2 text-sm placeholder-gray-500" placeholder="Search Decises" />
                    <button className="rounded-full bg-gray-700 px-4 py-2 text-sm font-semibold text-white">Search</button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-full px-3 py-1 ring-1 ring-black/20">Feever</button>
                    <button className="rounded-full px-3 py-1 ring-1 ring-black/20">Headach</button>
                  </div>

                  {/* Clinical Drugs – table card */}
                  <div className="mt-6 text-2xl font-bold">Clinical Drugs</div>
                  <div className="mt-3 rounded-2xl bg-gray-300/70 p-4">
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
                      <div>Drug Name</div>
                      <div>Dose</div>
                      <div>Terms</div>
                      <div>Amount</div>
                    </div>
                    <div className="mt-1 divide-y divide-black/10 text-sm">
                      {rxRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 py-2">
                          <div>{r.drug}</div>
                          <div>{r.dose}</div>
                          <div>{(r.terms || "").toString()}</div>
                          <div>{r.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outside Drugs – table card */}
                  <div className="mt-6 text-2xl font-bold">Outside Drugs</div>
                  <div className="mt-3 rounded-2xl bg-gray-300/70 p-4">
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
                      <div>Drug Name</div>
                      <div>Dose</div>
                      <div>Terms</div>
                      <div>Amount</div>
                    </div>
                    <div className="mt-1 divide-y divide-black/10 text-sm">
                      <div className="grid grid-cols-4 gap-2 py-2">
                        <div>{sheet.outside[0]?.name}</div>
                        <div>{sheet.outside[0]?.dose}</div>
                        <div>{sheet.outside[0]?.terms}</div>
                        <div>{sheet.outside[0]?.amount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column stack */}
                <div className="col-span-5">
                  {/* Clinical drugs mini card */}
                  <div className="rounded-2xl bg-gray-300/70 p-3">
                    <div className="text-sm space-y-1">
                      {sheet.clinical.map((c, i) => (
                        <div key={i}>{c}</div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button className="inline-flex items-center gap-2 rounded-full bg-gray-700 px-3 py-2 font-semibold text-white">
                        <span>↪</span> Use same Drugs
                      </button>
                      <span className="text-gray-700">From Previously History</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="h-6"></div>

                  {/* Outside drugs mini card */}
                  <div className="rounded-2xl bg-gray-300/70 p-3">
                    <div className="text-sm">{sheet.outside[0]?.name}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button className="inline-flex items-center gap-2 rounded-full bg-gray-700 px-3 py-2 font-semibold text-white">
                        <span>↪</span> Use same Drugs
                      </button>
                      <span className="text-gray-700">From Previously History</span>
                    </div>
                  </div>

                  {/* Right-side labels */}
                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="text-3xl font-extrabold">Regualar Drugs</div>
                      <div className="mt-2 text-gray-800">{sheet.regularDrugs}</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold">Alergies</div>
                      <div className="mt-2 text-gray-800">{sheet.allergies}</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold">Medical Tests</div>
                      <div className="mt-2 text-gray-800">{sheet.tests}</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold">Special Notes</div>
                      <div className="mt-2 text-gray-800">{sheet.notes}</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold">Next Visit Date</div>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="rounded-full border border-black/30 px-3 py-1 text-sm">Two Weeks</button>
                        <button className="rounded-full border border-black/30 px-3 py-1 text-sm">Three Weeks</button>
                      </div>
                      <div className="mt-2 w-60 rounded-full bg-black/10 px-4 py-2 text-sm text-gray-800">{sheet.nextVisit}</div>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <div className="mt-8 flex justify-end">
                    <button className="rounded-full bg-black px-6 py-3 text-base font-semibold text-white">Confirm</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Bottom bar */}
      <footer className="z-10 bg-transparent/60 backdrop-blur px-8 pb-2 pt-2">
        <div className="mx-auto max-w-[1680px]">
          <div className="flex items-center justify-between gap-6">
            {/* left: time/date */}
            <div>
              <div className="text-2xl font-extrabold leading-none">{timeStr}</div>
              <div className="text-xs text-gray-600">{dateStr}</div>
            </div>
            {/* middle: capsules */}
            <div className="flex flex-wrap items-center gap-6">
              {["Patiant Management", "Inventory Management", "Ai Informatics"].map((t) => (
                <button key={t} className="rounded-full bg-gray-200/80 px-6 py-3 text-lg font-medium ring-1 ring-black/5">{t}</button>
              ))}
            </div>
            {/* right: AI card */}
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-100 to-rose-100 px-4 py-3 shadow-sm ring-1 ring-black/5">
              <div className="grid size-10 place-items-center rounded-xl bg-white/70 ring-1 ring-black/5">
                <span className="text-2xl">💬</span>
              </div>
              <div className="text-sm font-semibold leading-5">
                <div>Ask Anything about</div>
                <div>Your Patients from Ai</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
