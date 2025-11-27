'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const SHADOWS = {
  card: 'shadow-[0_22px_52px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  glow: 'shadow-[0_18px_44px_rgba(10,132,255,0.28)]',
  tooltip: 'shadow-[0_12px_24px_rgba(15,23,42,0.18)]',
} as const;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`ios-surface ${SHADOWS.card} ${className}`}>{children}</div>
);

const Field = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${SHADOWS.inset}`}
    />
  </label>
);

const RolePill = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-white/70">
    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
    {label}
  </span>
);

export default function Login() {
  const [ownerEmail, setOwnerEmail] = useState('owner@medlink.lk');
  const [ownerPassword, setOwnerPassword] = useState('medlink-owner');

  const [doctorUser, setDoctorUser] = useState('dr.charuka');
  const [doctorPassword, setDoctorPassword] = useState('doctor-access');

  const [assistantUser, setAssistantUser] = useState('assistant1');
  const [assistantPassword, setAssistantPassword] = useState('assistant-access');

  return (
    <main className="relative isolate flex min-h-screen items-start justify-center px-4 py-6 text-slate-900">
      <div className="w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80 backdrop-blur-2xl">
        <div className="flex flex-col gap-6 px-6 py-7 lg:px-10">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 ring-1 ring-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                MedLink Access
              </span>
              <RolePill label="Owner + Staff" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Team login</h1>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
              <div className="flex items-center gap-2">
                <RolePill label="Medical Center Owner" />
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100">
                  Secure area
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Owner login</h2>
            </div>
            <Link href="/owner" className="ios-button-primary px-5 py-2 text-[11px] uppercase tracking-[0.2em]">
              Go to owner tools
            </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Email" value={ownerEmail} onChange={setOwnerEmail} placeholder="owner@email.com" />
              <Field label="Password" type="password" value={ownerPassword} onChange={setOwnerPassword} placeholder="••••••••" />
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Owner only area
              </div>
              <button className="ios-button-primary">
                Sign in as owner
              </button>
            </div>
          </Card>

          <Card className="p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <RolePill label="Staff Login" />
                <h2 className="mt-3 text-xl font-bold text-slate-900">Doctor & Assistant access</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-100">
                Dual panels
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <RolePill label="Doctor Login" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Primary clinical view</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Field label="Username" value={doctorUser} onChange={setDoctorUser} placeholder="doctor username" />
                  <Field
                    label="Password"
                    type="password"
                    value={doctorPassword}
                    onChange={setDoctorPassword}
                    placeholder="••••••••"
                  />
                </div>
                <button className="ios-button-primary mt-4 w-full">
                  Continue as doctor
                </button>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <RolePill label="Assistant Login" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Support lane</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Field
                    label="Username"
                    value={assistantUser}
                    onChange={setAssistantUser}
                    placeholder="assistant username"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={assistantPassword}
                    onChange={setAssistantPassword}
                    placeholder="••••••••"
                  />
                </div>
                <button className="ios-button-primary mt-4 w-full">
                  Continue as assistant
                </button>
              </Card>
            </div>
          </Card>
        </div>
        </div>
      </div>
    </main>
  );
}
