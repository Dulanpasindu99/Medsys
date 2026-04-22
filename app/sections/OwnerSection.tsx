'use client';

import Link from 'next/link';
import { AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import { ViewportBody, ViewportFrame, ViewportHeader, ViewportPage } from '../components/ui/ViewportLayout';
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
    doctorWorkflowMode,
    setDoctorWorkflowMode,
    resetCreateForm,
    createFieldErrors,
    permissions,
    extraPermissions,
    toggleCreateExtraPermission,
    staffUsers,
    canManageStaff,
    manageStaffDisabledReason,
    handleCreate,
    getEditableExtraPermissions,
    toggleUserExtraPermission,
    saveUserExtraPermissions,
    getUserUpdateFeedback,
    isUpdatingUser,
    loadState,
    createState,
    isSyncing,
    refresh,
  } = useOwnerAccess();

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-10">
          <ViewportHeader
            title="Create User & Manage Staff"
            description="Add, edit, and manage doctor/assistant access with owner-only controls in one workspace."
            actions={
              <>
                <OwnerBadge label="Owner tools" />
                <OwnerBadge label="Staff" tone="emerald" />
                <OwnerBadge label="Access" tone="amber" />
              </>
            }
            className="items-start"
          />

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <Link href="/login" className="app-button app-button--primary app-button--pill px-4">
              Back to login
            </Link>
            <button
              type="button"
              onClick={refresh}
              className="app-button app-button--secondary app-button--pill px-4"
              disabled={isSyncing}
            >
              {isSyncing ? 'Refreshing...' : 'Refresh live staff'}
            </button>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 font-semibold text-sky-800 ring-1 ring-sky-100">
              Owner only
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[1.32fr_0.68fr]">
              <div className="min-h-0 overflow-hidden">
                <OwnerStaffFormCard
                  role={role}
                  setRole={setRole}
                  name={name}
                  setName={setName}
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  doctorWorkflowMode={doctorWorkflowMode}
                  setDoctorWorkflowMode={setDoctorWorkflowMode}
                  onReset={resetCreateForm}
                  fieldErrors={createFieldErrors}
                  permissions={permissions}
                  extraPermissions={extraPermissions}
                  onToggleExtraPermission={toggleCreateExtraPermission}
                  onCreate={handleCreate}
                  isSubmitting={createState.status === 'pending'}
                  canManageStaff={canManageStaff}
                  manageStaffDisabledReason={manageStaffDisabledReason}
                />
              </div>

              <div className="min-h-0 overflow-hidden">
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
                  <OwnerStaffListCard
                    staffUsers={staffUsers}
                    canManageStaff={canManageStaff}
                    getEditableExtraPermissions={getEditableExtraPermissions}
                    onToggleExtraPermission={toggleUserExtraPermission}
                    onSaveUser={saveUserExtraPermissions}
                    getUserFeedback={getUserUpdateFeedback}
                    isUpdatingUser={isUpdatingUser}
                  />
                )}
              </div>
            </div>
          </div>
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
