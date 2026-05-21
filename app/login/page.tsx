"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  type ApiClientError,
  type LoginResponse,
} from "../lib/api-client";
import { canAccessRoute, getDefaultRouteForSubject } from "../lib/authorization";
import { useCurrentUserQuery } from "../lib/query-hooks";
import { validateDoctorLoginInput } from "../utils/schema-validation/doctor-section.schema";

type LoginRole = "owner" | "doctor" | "assistant";

type RoleDetails = {
  title: string;
  lane: string;
  description: string;
  status: string;
  statusColor: string;
  submitLabel: string;
};

type RoleCredentials = {
  email: string;
  password: string;
};

const DEFAULT_ORGANIZATION_SLUG = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG ?? "";
const ORGANIZATION_SLUG_STORAGE_KEY = "medsys.organizationSlug";

const WORKSPACE_ROUTE_BY_PANEL = {
  owner: "ownerWorkspace",
  doctor: "doctorHome",
  assistant: "assistantWorkspace",
} as const;

const ROLE_DETAILS: Record<LoginRole, RoleDetails> = {
  owner: {
    title: "Owner Login",
    lane: "Administrative control lane",
    description:
      "Manage staff access, clinic operations, and account-level controls.",
    status: "Secure area",
    statusColor: "bg-emerald-500",
    submitLabel: "Sign in as owner",
  },
  doctor: {
    title: "Doctor Login",
    lane: "Primary clinical workspace",
    description:
      "Access consultation workflow, queue visibility, and treatment tools.",
    status: "Clinical queue",
    statusColor: "bg-sky-500",
    submitLabel: "Continue as doctor",
  },
  assistant: {
    title: "Assistant Login",
    lane: "Patient support lane",
    description:
      "Handle patient flow, intake support, and clinic coordination tasks.",
    status: "Task board",
    statusColor: "bg-amber-500",
    submitLabel: "Continue as assistant",
  },
};

function toPermissionSubject(
  user: Pick<LoginResponse, "role" | "active_role" | "permissions">
) {
  return {
    role: user.active_role ?? user.role,
    permissions: user.permissions,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const currentUserQuery = useCurrentUserQuery(false);
  const [activeRole, setActiveRole] = useState<LoginRole>("doctor");
  const [organizationSlug, setOrganizationSlug] = useState(DEFAULT_ORGANIZATION_SLUG);
  const [credentials, setCredentials] = useState<Record<LoginRole, RoleCredentials>>({
    owner: { email: "", password: "" },
    doctor: { email: "", password: "" },
    assistant: { email: "", password: "" },
  });
  const [errors, setErrors] = useState<Record<LoginRole, string | null>>({
    owner: null,
    doctor: null,
    assistant: null,
  });
  const [activeSubmission, setActiveSubmission] = useState<LoginRole | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSlug = window.localStorage.getItem(ORGANIZATION_SLUG_STORAGE_KEY)?.trim() ?? "";
    if (storedSlug) {
      setOrganizationSlug(storedSlug);
    }
  }, []);

  useEffect(() => {
    const user = currentUserQuery.data;
    if (!user) {
      return;
    }

    router.replace(getDefaultRouteForSubject(toPermissionSubject(user)));
    router.refresh();
  }, [currentUserQuery.data, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const normalized = organizationSlug.trim();
    if (normalized) {
      window.localStorage.setItem(ORGANIZATION_SLUG_STORAGE_KEY, normalized);
      return;
    }

    window.localStorage.removeItem(ORGANIZATION_SLUG_STORAGE_KEY);
  }, [organizationSlug]);

  const updateCredential = (
    role: LoginRole,
    field: keyof RoleCredentials,
    value: string
  ) => {
    setCredentials((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [field]: value,
      },
    }));
    setErrors((current) => ({ ...current, [role]: null }));
  };

  const handleOrganizationSlugChange = (value: string) => {
    setOrganizationSlug(value);
    setErrors({ owner: null, doctor: null, assistant: null });
  };

  const handleSignIn = async (role: LoginRole) => {
    const normalizedOrganizationSlug = organizationSlug.trim();
    if (!normalizedOrganizationSlug) {
      setErrors((current) => ({
        ...current,
        [role]: "Organization slug is required. Example: sunrise-clinic",
      }));
      return;
    }

    const roleCredentials = credentials[role];
    const parsed = validateDoctorLoginInput({
      email: roleCredentials.email,
      password: roleCredentials.password,
    });

    if (!parsed.ok) {
      setErrors((current) => ({ ...current, [role]: parsed.error }));
      return;
    }

    try {
      setActiveSubmission(role);
      const user = await loginUser(
        parsed.value.email,
        parsed.value.password,
        role,
        normalizedOrganizationSlug
      );
      const permissionSubject = toPermissionSubject(user);
      const requestedRoute = WORKSPACE_ROUTE_BY_PANEL[role];

      if (!canAccessRoute(permissionSubject, requestedRoute)) {
        setErrors((current) => ({
          ...current,
          [role]: `This account does not have access to the ${role} workspace.`,
        }));
        return;
      }

      router.replace(getDefaultRouteForSubject(permissionSubject));
      router.refresh();
    } catch (error) {
      const message =
        (error as ApiClientError)?.message ?? "Unable to sign in right now.";
      setErrors((current) => ({ ...current, [role]: message }));
    } finally {
      setActiveSubmission(null);
    }
  };

  const detail = ROLE_DETAILS[activeRole];
  const roleCredentials = credentials[activeRole];
  const roleError = errors[activeRole];

  return (
    <main className="relative isolate h-dvh overflow-hidden px-3 py-3 text-slate-900 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[10%] h-56 w-56 rounded-full bg-sky-200/35 blur-3xl animate-float-slow" />
        <div className="absolute right-[8%] top-[18%] h-52 w-52 rounded-full bg-emerald-200/35 blur-3xl animate-float-medium" />
        <div className="absolute bottom-[10%] left-[38%] h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl animate-float-fast" />
      </div>

      <section className="relative mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80 backdrop-blur-2xl sm:p-5 lg:p-6">
        <header className="flex shrink-0 items-center border-b border-white/70 pb-3 sm:pb-4">
          <div className="min-w-0">
            <Image
              src="/assets/medlink-logo-optimized.png"
              alt="Medlink logo"
              width={320}
              height={71}
              className="h-9 w-auto object-contain sm:h-10"
              priority
            />
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Role-based login
            </h1>
          </div>
        </header>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden min-h-0 flex-col rounded-[24px] border border-white/70 bg-gradient-to-br from-sky-50/90 via-white/85 to-emerald-50/90 p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)] lg:flex">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Team Entry
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                One portal for owner, doctor, and assistant workflows.
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Select a role tab and sign in directly to the correct workspace
                without extra navigation steps.
              </p>
            </div>

            <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
              <Image
                src="/assets/login-side-medical.jpg"
                alt="Medical supplies background"
                fill
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 via-transparent to-cyan-900/10" />
            </div>

            <div className="mt-4 grid gap-3">
              {(["owner", "doctor", "assistant"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    activeRole === role
                      ? "border-sky-200 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
                      : "border-white/80 bg-white/65 text-slate-600 hover:border-sky-100"
                  }`}
                >
                  <span className="text-sm font-semibold">{ROLE_DETAILS[role].title}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${ROLE_DETAILS[role].statusColor}`} />
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Built by
              </span>
              <Image
                src="/assets/aldtan-logo-optimized.png"
                alt="ALDTAN company logo"
                width={170}
                height={37}
                className="h-5 w-auto object-contain"
              />
            </div>
          </aside>

          <div className="ios-surface flex min-h-0 flex-col rounded-[24px] p-4 shadow-[0_16px_36px_rgba(15,23,42,0.1)] sm:p-5">
            <div className="grid shrink-0 grid-cols-3 gap-2 rounded-2xl bg-slate-100/70 p-1 ring-1 ring-white/70">
              {(["owner", "doctor", "assistant"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition sm:text-xs ${
                    activeRole === role
                      ? "bg-white text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="mt-3 shrink-0 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{detail.title}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-slate-100">
                  <span className={`h-1.5 w-1.5 rounded-full ${detail.statusColor}`} />
                  {detail.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{detail.lane}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {detail.description}
              </p>
            </div>

            <div className="mt-3 grid shrink-0 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Organization Slug
                </span>
                <input
                  value={organizationSlug}
                  onChange={(event) => handleOrganizationSlugChange(event.target.value)}
                  placeholder="sunrise-clinic"
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Email
                </span>
                <input
                  value={roleCredentials.email}
                  onChange={(event) =>
                    updateCredential(activeRole, "email", event.target.value)
                  }
                  placeholder={`${activeRole}@email.com`}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Password
                </span>
                <input
                  type="password"
                  value={roleCredentials.password}
                  onChange={(event) =>
                    updateCredential(activeRole, "password", event.target.value)
                  }
                  placeholder="********"
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>

            <div className="mt-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-100"
              >
                Back to home
              </Link>
              <button
                type="button"
                onClick={() => handleSignIn(activeRole)}
                disabled={activeSubmission !== null}
                className="app-button app-button--primary app-button--pill px-5"
              >
                {activeSubmission === activeRole ? "Signing in..." : detail.submitLabel}
              </button>
            </div>

            {roleError ? (
              <p className="mt-2 shrink-0 text-sm font-semibold text-rose-600">
                {roleError}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
