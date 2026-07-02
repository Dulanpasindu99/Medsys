"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { portalProfileMatch, portalUpdateProfile, type PortalProfileInput } from "@/app/lib/portal-api";
import { usePortalAccount } from "../usePortalAccount";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const SEVERITIES = [
  { key: "low", label: "Low", color: "bg-emerald-500" },
  { key: "moderate", label: "Medium", color: "bg-amber-500" },
  { key: "high", label: "High", color: "bg-rose-500" }
] as const;

type Allergy = { name: string; severity?: "low" | "moderate" | "high" };

const STEPS = ["Your name", "Date of birth & gender", "Contact", "Health details", "Review"];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const account = usePortalAccount();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [allergyName, setAllergyName] = useState("");
  const [allergySeverity, setAllergySeverity] = useState<Allergy["severity"]>("low");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);

  useEffect(() => {
    if (account.isError) router.replace("/portal/login");
    else if (account.data?.profileCompleted) router.replace("/portal");
  }, [account.isError, account.data, router]);

  useEffect(() => {
    if (account.data && !firstName && !lastName) {
      setFirstName(account.data.firstName ?? "");
      setLastName(account.data.lastName ?? "");
      setPhone(account.data.phone ?? "");
      // Carry over the NIC captured at signup so completing the profile doesn't clear it.
      if (account.data.nic) setNic(account.data.nic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.data]);

  // If the NIC/phone matches an existing clinic record, pre-fill the blanks so the
  // patient only fills what's missing. (Debounced; only fills empty fields.)
  useEffect(() => {
    const id = nic.trim();
    const ph = phone.trim();
    if (id.length < 4 && ph.length < 6) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      portalProfileMatch({ nic: id || undefined, phone: ph || undefined })
        .then((res) => {
          if (cancelled || !res.matched || !res.profile) return;
          const p = res.profile;
          setFirstName((prev) => prev || p.firstName || "");
          setLastName((prev) => prev || p.lastName || "");
          setDob((prev) => prev || p.dob || "");
          setGender((prev) => prev || (p.gender ?? ""));
          setPhone((prev) => prev || p.phone || "");
          setAddress((prev) => prev || p.address || "");
          setBloodGroup((prev) => prev || p.bloodGroup || "");
          setMatchNotice("We found your existing clinic record — we've filled in what we could. Just complete the rest.");
        })
        .catch(() => {
          /* ignore — pre-fill is best-effort */
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nic, phone]);

  const age = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
    const birth = new Date(`${dob}T00:00:00Z`);
    const now = new Date();
    let value = now.getUTCFullYear() - birth.getUTCFullYear();
    const m = now.getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) value -= 1;
    return value >= 0 ? value : null;
  }, [dob]);

  const canNext = () => {
    if (step === 0) return firstName.trim() && lastName.trim();
    if (step === 1) return /^\d{4}-\d{2}-\d{2}$/.test(dob) && gender;
    return true;
  };

  const addAllergy = () => {
    const name = allergyName.trim();
    if (!name) return;
    setAllergies((prev) => [...prev, { name, severity: allergySeverity }]);
    setAllergyName("");
    setAllergySeverity("low");
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const payload: PortalProfileInput = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        gender: gender as "male" | "female" | "other",
        nic: nic.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        bloodGroup: bloodGroup || null,
        allergies
      };
      const updated = await portalUpdateProfile(payload);
      queryClient.setQueryData(["portal", "me"], updated);
      setWelcome(true);
      setTimeout(() => router.replace("/portal"), 1900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
      setBusy(false);
    }
  };

  if (welcome) {
    return (
      <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-sky-50 to-white px-6 text-center">
        <div className="animate-[fadeInUp_0.6s_ease]">
          <div className="text-6xl">👋</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Hi, {firstName}!</h1>
          <p className="mt-2 text-slate-500">Your profile is ready. Taking you in…</p>
        </div>
      </main>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          Step {step + 1} of {STEPS.length}
        </span>
        <span>{STEPS[step]}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 flex-1 rounded-[26px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 sm:p-6">
        {matchNotice ? (
          <div className="mb-4 rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            {matchNotice}
          </div>
        ) : null}
        {step === 0 ? (
          <div className="space-y-3">
            <Heading title="What's your name?" subtitle="As it should appear on your records." />
            <Input label="First name" value={firstName} onChange={setFirstName} />
            <Input label="Last name" value={lastName} onChange={setLastName} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <Heading title="Date of birth & gender" subtitle={age != null ? `Age: ${age}` : "We'll calculate your age."} />
            <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
            <div>
              <Label>Gender</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-2xl border py-2.5 text-sm font-semibold capitalize transition ${
                      gender === g ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <Heading title="Contact details" subtitle="Optional, but helps your clinic reach you." />
            <Input label="NIC (optional)" value={nic} onChange={setNic} />
            <Input label="Phone (optional)" type="tel" value={phone} onChange={setPhone} />
            <Input label="Address (optional)" value={address} onChange={setAddress} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <Heading title="Health details" subtitle="Blood group and any allergies." />
            <div>
              <Label>Blood group (optional)</Label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup((cur) => (cur === bg ? "" : bg))}
                    className={`rounded-xl border py-2 text-sm font-semibold transition ${
                      bloodGroup === bg ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Allergies (optional)</Label>
              <div className="flex gap-2">
                <input
                  value={allergyName}
                  onChange={(e) => setAllergyName(e.target.value)}
                  placeholder="e.g. Penicillin"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <button type="button" onClick={addAllergy} className="rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white">
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setAllergySeverity(s.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      allergySeverity === s.key ? `${s.color} text-white` : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {allergies.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {allergies.map((a, i) => (
                    <li key={`${a.name}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-700">
                        {a.name} <span className="text-xs text-slate-400">({a.severity})</span>
                      </span>
                      <button type="button" onClick={() => setAllergies((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-500">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <Heading title="Review" subtitle="Confirm your details to finish." />
            <ReviewRow label="Name" value={`${firstName} ${lastName}`} />
            <ReviewRow label="Date of birth" value={dob} />
            <ReviewRow label="Gender" value={gender} />
            <ReviewRow label="NIC" value={nic || "—"} />
            <ReviewRow label="Phone" value={phone || "—"} />
            <ReviewRow label="Address" value={address || "—"} />
            <ReviewRow label="Blood group" value={bloodGroup || "—"} />
            <ReviewRow label="Allergies" value={allergies.length ? allergies.map((a) => a.name).join(", ") : "None"} />
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600"
          >
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canNext()}
            onClick={() => setStep((s) => s + 1)}
            className="flex-[2] rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="flex-[2] rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Finish"}
          </button>
        )}
      </div>
    </main>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{children}</span>;
}
function Input(props: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <Label>{props.label}</Label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium capitalize text-slate-800">{value}</span>
    </div>
  );
}
