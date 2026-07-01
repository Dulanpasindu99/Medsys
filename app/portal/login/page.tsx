"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { portalLogin, portalSignup, type PortalAccount } from "@/app/lib/portal-api";

export default function PortalLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSuccess = (account: PortalAccount) => {
    queryClient.setQueryData(["portal", "me"], account);
    router.replace(account.profileCompleted ? "/portal" : "/portal/onboarding");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await portalLogin({ email: email.trim(), password })
          : await portalSignup({ email: email.trim(), phone: phone.trim() || undefined, password });
      onSuccess(result.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-white via-slate-50 to-sky-50/50 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 sm:p-8">
        <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
          ← Back
        </Link>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
          {mode === "login" ? "Patient sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Access your records, prescriptions and reports."
            : "Sign up to manage your health records online."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-sm font-semibold">
          {(["login", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`rounded-full py-2 transition ${
                mode === value ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {value === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-3" onSubmit={submit}>
          <Field label="Email" type="email" value={email} onChange={setEmail} required placeholder="you@email.com" />
          {mode === "signup" ? (
            <Field label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="+94 7X XXX XXXX" />
          ) : null}
          <Field label="Password" type="password" value={password} onChange={setPassword} required placeholder="••••••••" />
          {mode === "signup" ? (
            <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} required placeholder="••••••••" />
          ) : null}

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {props.label}
      </span>
      <input
        type={props.type}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        required={props.required}
        placeholder={props.placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}
