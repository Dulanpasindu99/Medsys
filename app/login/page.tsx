'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const SHADOWS = {
  card: 'shadow-[0_22px_52px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  glow: 'shadow-[0_18px_44px_rgba(10,132,255,0.28)]',
  tooltip: 'shadow-[0_12px_24px_rgba(15,23,42,0.18)]',
} as const;

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className = '', ...props }: CardProps) => (
  <div className={`ios-surface ${SHADOWS.card} ${className}`} {...props}>
    {children}
  </div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 ring-1 ring-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
    <span className="h-2 w-2 rounded-full bg-sky-500" />
    {children}
  </span>
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

type OwnerPanelProps = {
  highlight?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
};

const OwnerPanel = ({
  highlight = false,
  onClick,
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: OwnerPanelProps) => (
  <Card
    onClick={onClick}
    className={`relative overflow-hidden p-8 transition-transform duration-300 ease-out ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.18)]' : ''
      } ${highlight ? 'ring-2 ring-sky-100 shadow-[0_30px_70px_rgba(15,23,42,0.2)]' : ''}`}
  >
    <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-sky-200/40" />
    <div className="pointer-events-none absolute -right-6 top-1/3 h-40 w-40 rounded-full bg-indigo-200/40" />

    <div className="relative flex items-start justify-between gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <RolePill label="Medical Center Owner" />
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100">
            Secure area
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Owner login</h2>
        <p className="text-sm text-slate-600">
          Manage staff access, billing, and clinic controls from a focused owner hub. The pre-filled demo lets you explore without typing.
        </p>
      </div>
      <Link href="/owner" className="ios-button-primary px-5 py-2 text-[11px] uppercase tracking-[0.2em]">
        Owner tools
      </Link>
    </div>

    <div className="relative mt-6 grid gap-4 md:grid-cols-2">
      <Field label="Email" value={email} onChange={onEmailChange} placeholder="owner@email.com" />
      <Field label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="••••••••" />
    </div>

    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Chip>Owner only area</Chip>
      <button className="ios-button-primary px-6">Sign in as owner</button>
    </div>
  </Card>
);

type StaffPanelProps = {
  highlight?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
};

const DoctorPanel = ({
  highlight = false,
  onClick,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}: StaffPanelProps) => (
  <Card
    onClick={onClick}
    className={`p-5 transition-transform duration-300 ease-out ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.16)]' : ''
      } ${highlight ? 'ring-2 ring-sky-100 shadow-[0_28px_60px_rgba(15,23,42,0.18)]' : ''}`}
  >
    <div className="flex items-center gap-2">
      <RolePill label="Doctor Login" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Primary clinical view</span>
    </div>
    <div className="mt-4 flex flex-col gap-3">
      <Field label="Username" value={username} onChange={onUsernameChange} placeholder="doctor username" />
      <Field label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="•••••••" />
    </div>
    <button className="ios-button-primary mt-4 w-full">Continue as doctor</button>
    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        Live queue
      </span>
      <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-bold text-slate-700">Clinic view</span>
    </div>
  </Card>
);

const AssistantPanel = ({
  highlight = false,
  onClick,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}: StaffPanelProps) => (
  <Card
    onClick={onClick}
    className={`p-5 transition-transform duration-300 ease-out ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.16)]' : ''
      } ${highlight ? 'ring-2 ring-emerald-100 shadow-[0_28px_60px_rgba(15,23,42,0.18)]' : ''}`}
  >
    <div className="flex items-center gap-2">
      <RolePill label="Assistant Login" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Support lane</span>
    </div>
    <div className="mt-4 flex flex-col gap-3">
      <Field label="Username" value={username} onChange={onUsernameChange} placeholder="assistant username" />
      <Field label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="••••••••" />
    </div>
    <button className="ios-button-primary mt-4 w-full">Continue as assistant</button>
    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Patient flow
      </span>
      <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-bold text-slate-700">Task board</span>
    </div>
  </Card>
);

export default function Login() {
  const [ownerEmail, setOwnerEmail] = useState('owner@medsys.lk');
  const [ownerPassword, setOwnerPassword] = useState('medsys-owner');

  const [doctorUser, setDoctorUser] = useState('dr.charuka');
  const [doctorPassword, setDoctorPassword] = useState('doctor-access');

  const [assistantUser, setAssistantUser] = useState('assistant1');
  const [assistantPassword, setAssistantPassword] = useState('assistant-access');

  type ActiveModal = 'owner' | 'doctor' | 'assistant' | null;
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const handleSectionClick = (role: Exclude<ActiveModal, null>) => (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input')) return;
    setActiveModal(role);
  };

  const closeModal = () => setActiveModal(null);

  const renderModalContent = () => {
    if (!activeModal) return null;

    const panelMap = {
      owner: (
        <OwnerPanel
          highlight
          email={ownerEmail}
          password={ownerPassword}
          onEmailChange={setOwnerEmail}
          onPasswordChange={setOwnerPassword}
        />
      ),
      doctor: (
        <DoctorPanel
          highlight
          username={doctorUser}
          password={doctorPassword}
          onUsernameChange={setDoctorUser}
          onPasswordChange={setDoctorPassword}
        />
      ),
      assistant: (
        <AssistantPanel
          highlight
          username={assistantUser}
          password={assistantPassword}
          onUsernameChange={setAssistantUser}
          onPasswordChange={setAssistantPassword}
        />
      ),
    };

    return panelMap[activeModal];
  };

  return (
    <main className="relative isolate flex min-h-screen items-start justify-center overflow-hidden px-4 py-8 text-slate-900">
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-sky-200/40" />
        <div className="absolute right-12 top-16 h-52 w-52 rounded-full bg-emerald-200/40" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30" />
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-3xl animate-[modal-pop_0.35s_cubic-bezier(0.22,0.61,0.36,1)]">
            {renderModalContent()}
          </div>
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80 backdrop-blur-2xl transition-all duration-300 ease-out ${activeModal ? 'scale-[0.98] blur-[1.5px] opacity-75' : ''
          }`}
        aria-hidden={!!activeModal}
      >
        <div className="flex flex-col gap-8 px-6 py-8 lg:px-12">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Chip>Medsys Access</Chip>
                <RolePill label="Owner + Staff" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Team login</h1>
                <span className="rounded-full bg-gradient-to-r from-sky-100 to-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                  Smooth iOS lineup
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Quickly access the right workspace with pre-filled demo credentials. Each panel mirrors the crisp, layered iOS look so owners, doctors, and assistants can land exactly where they need without friction.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 ring-1 ring-white/70 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              All systems healthy
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <OwnerPanel
              onClick={handleSectionClick('owner')}
              email={ownerEmail}
              password={ownerPassword}
              onEmailChange={setOwnerEmail}
              onPasswordChange={setOwnerPassword}
            />

            <Card className="p-8 transition-transform duration-300 ease-out">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <RolePill label="Staff Login" />
                    <h2 className="text-2xl font-bold text-slate-900">Doctor & Assistant access</h2>
                    <p className="text-sm text-slate-600">
                      Separate, simplified paths for clinical and support tasks. Toggle ready credentials and jump straight into each panel.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-100">
                    Dual panels
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DoctorPanel
                    onClick={handleSectionClick('doctor')}
                    username={doctorUser}
                    password={doctorPassword}
                    onUsernameChange={setDoctorUser}
                    onPasswordChange={setDoctorPassword}
                  />
                  <AssistantPanel
                    onClick={handleSectionClick('assistant')}
                    username={assistantUser}
                    password={assistantPassword}
                    onUsernameChange={setAssistantUser}
                    onPasswordChange={setAssistantPassword}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-white/70 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Need quick routing? Owner can also switch into staff panels from the top-right hub.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
