"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { portalLogout, portalUpdateProfile, type PortalProfileInput } from "@/app/lib/portal-api";
import { PortalFamilySection } from "@/app/components/PortalFamilySection";
import { LanguageBar } from "@/app/components/LanguageBar";
import { useT } from "@/app/lib/i18n";
import { usePortalGuard } from "../usePortalAccount";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function PortalProfilePage() {
  const account = usePortalGuard();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useT();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (account.data && !loaded) {
      setFirstName(account.data.firstName ?? "");
      setLastName(account.data.lastName ?? "");
      setDob(account.data.dob ?? "");
      setGender((account.data.gender as "male" | "female" | "other") ?? "");
      setNic(account.data.nic ?? "");
      setPhone(account.data.phone ?? "");
      setAddress(account.data.address ?? "");
      setBloodGroup(account.data.bloodGroup ?? "");
      setLoaded(true);
    }
  }, [account.data, loaded]);

  const save = async () => {
    setFeedback(null);
    if (!firstName.trim() || !lastName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !gender) {
      setFeedback("Please fill name, date of birth and gender.");
      return;
    }
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
        allergies: account.data?.allergies as PortalProfileInput["allergies"]
      };
      const updated = await portalUpdateProfile(payload);
      queryClient.setQueryData(["portal", "me"], updated);
      queryClient.invalidateQueries({ queryKey: ["portal", "doctors"] });
      setFeedback("Saved ✓");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await portalLogout().catch(() => undefined);
    queryClient.clear();
    router.replace("/portal/login");
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{t("My Profile")}</h1>
          <p className="text-sm text-slate-500">{account.data?.email}</p>
        </div>
        <button type="button" onClick={logout} className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">
          {t("Sign out")}
        </button>
      </header>

      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t("Language")}</p>
        <LanguageBar className="flex-wrap" />
      </section>

      <section className="space-y-3 rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={setFirstName} />
          <Input label="Last name" value={lastName} onChange={setLastName} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
          <div>
            <Label>Gender</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["male", "female", "other"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                    gender === g ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Input label="NIC" value={nic} onChange={setNic} />
        <Input label="Phone" type="tel" value={phone} onChange={setPhone} />
        <Input label="Address" value={address} onChange={setAddress} />
        <div>
          <Label>Blood group</Label>
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

        {feedback ? (
          <p className={`text-sm font-medium ${feedback.includes("✓") ? "text-emerald-600" : "text-rose-600"}`}>{feedback}</p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </section>

      <PortalFamilySection />
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
