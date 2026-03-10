'use client';

import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import Link from 'next/link';
import { OwnerBadge } from './owner/components/OwnerBadge';
import { OwnerStaffFormCard } from './owner/components/OwnerStaffFormCard';
import { OwnerStaffListCard } from './owner/components/OwnerStaffListCard';
import { useOwnerAccess } from './owner/hooks/useOwnerAccess';

export default function OwnerSection() {
    const {
        role,
        setRole,
        name,
        setName,
        username,
        setUsername,
        password,
        setPassword,
        permissions,
        setPermissions,
        staffUsers,
        setStaffUsers,
        presets,
        togglePermission,
        handleCreate,
        loadState,
        createState,
        isSyncing,
        refresh,
    } = useOwnerAccess();

    return (
        <div id="owner" className="px-4 py-8 md:px-8">
            <div className="w-full overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80 backdrop-blur-2xl">
                <div className="flex flex-col gap-6 px-6 py-7 lg:px-10">
                    <header className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <OwnerBadge label="Owner tools" />
                            <OwnerBadge label="Staff" tone="emerald" />
                            <OwnerBadge label="Access" tone="amber" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Manage staff access</h1>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--ioc-blue)] px-3 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(10,132,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0070f0]"
                            >
                                Back to login
                            </Link>
                            <button
                                type="button"
                                onClick={refresh}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
                                disabled={isSyncing}
                            >
                                {isSyncing ? 'Refreshing...' : 'Refresh live staff'}
                            </button>
                            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 font-semibold text-sky-800 ring-1 ring-sky-100">
                                Owner only
                            </span>
                        </div>
                    </header>
                    {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
                    {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}
                    {createState.error ? <AsyncNotice tone="error" message={createState.error} /> : null}
                    {createState.status === 'success' && createState.message ? (
                        <AsyncNotice tone="success" message={createState.message} />
                    ) : null}
                    {!loadState.error && createState.status !== 'success' ? (
                        <AsyncNotice
                            tone="info"
                            message="Staff list is synced from audit and appointment activity. Create user adds a local draft until a staff-create API is available."
                        />
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <OwnerStaffFormCard
                            role={role}
                            setRole={setRole}
                            name={name}
                            setName={setName}
                            username={username}
                            setUsername={setUsername}
                            password={password}
                            setPassword={setPassword}
                            permissions={permissions}
                            setPermissions={setPermissions}
                            togglePermission={togglePermission}
                            presets={presets}
                            onCreate={handleCreate}
                            isSubmitting={createState.status === 'pending'}
                        />

                        {loadState.status === 'loading' ? (
                            <AsyncStatePanel
                                eyebrow="Loading"
                                title="Loading staff access"
                                description="Audit-derived staff activity and appointment ownership are being synchronized."
                                tone="loading"
                            />
                        ) : loadState.status === 'error' && !staffUsers.length ? (
                            <AsyncStatePanel
                                eyebrow="Error"
                                title="Staff access data could not be loaded"
                                description={loadState.error ?? 'The owner staff workspace is unavailable right now.'}
                                tone="error"
                                actionLabel="Retry staff sync"
                                onAction={refresh}
                            />
                        ) : (
                            <OwnerStaffListCard staffUsers={staffUsers} setStaffUsers={setStaffUsers} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
