"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AppSelectField } from "../components/ui/AppSelectField";
import { AsyncStatePanel } from "../components/ui/AsyncStatePanel";
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
} from "../components/ui/ViewportLayout";
import type {
  TaskItem,
  TaskPriority,
  TaskRole,
  TaskStatus,
  TaskVisitMode,
  TaskWorkflowMode,
} from "../lib/api-client";
import { useTasksBoard } from "./tasks/hooks/useTasksBoard";

function badgeTone(priority?: string | null) {
  switch (priority) {
    case "critical":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "high":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "normal":
      return "bg-sky-50 text-sky-700 ring-sky-100";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ScopeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/92 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-[0.74rem] font-semibold text-slate-800">{children}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "rose" | "emerald" | "sky";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50/80 text-emerald-700"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50/80 text-amber-700"
        : tone === "rose"
          ? "border-rose-100 bg-rose-50/80 text-rose-700"
          : tone === "sky"
            ? "border-sky-100 bg-sky-50/80 text-sky-700"
            : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-[22px] border px-4 py-3 ${toneClasses}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function TaskCard({
  task,
  onStart,
  onEdit,
  onComplete,
  isBusy,
}: {
  task: TaskItem;
  onStart: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onComplete: (task: TaskItem) => void;
  isBusy: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-white/75 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-950">{task.title}</p>
          {task.description ? (
            <p className="mt-1 text-[0.82rem] leading-5 text-slate-600">{task.description}</p>
          ) : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeTone(task.priority)}`}>
          {formatLabel(task.priority ?? "normal")}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MetaPill label="Assigned" value={task.assignedUserName ?? task.assignedRole ?? "--"} />
        <MetaPill label="Due" value={task.dueDate ?? task.dueAt?.slice(0, 10) ?? "--"} />
        <MetaPill label="Visit" value={task.visitMode ? formatLabel(task.visitMode) : "--"} />
        <MetaPill
          label="Workflow"
          value={task.doctorWorkflowMode ? formatLabel(task.doctorWorkflowMode) : "--"}
        />
        <MetaPill label="Source" value={task.sourceType ?? "--"} />
        <MetaPill label="Status" value={formatLabel(task.status)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {task.status === "pending" ? (
          <button
            type="button"
            onClick={() => onStart(task)}
            disabled={isBusy}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
          >
            Start
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(task)}
          disabled={isBusy}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Edit
        </button>
        {task.status !== "completed" ? (
          <button
            type="button"
            onClick={() => onComplete(task)}
            disabled={isBusy}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
          >
            Complete
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-slate-50/85 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-[0.82rem] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function TaskColumn({
  title,
  tasks,
  onStart,
  onEdit,
  onComplete,
  activeTaskId,
}: {
  title: string;
  tasks: TaskItem[];
  onStart: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onComplete: (task: TaskItem) => void;
  activeTaskId: number | null;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-[24px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-3 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-sky-50/80">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Tasks
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {tasks.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={onStart}
              onEdit={onEdit}
              onComplete={onComplete}
              isBusy={activeTaskId === task.id}
            />
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/80 px-4 py-5 text-sm text-slate-500">
            No tasks in this column.
          </div>
        )}
      </div>
    </div>
  );
}

function TaskModal({
  open,
  title,
  values,
  onChange,
  onClose,
  onSubmit,
  isSaving,
  isOwner,
  userOptions,
}: {
  open: boolean;
  title: string;
  values: ReturnType<typeof useTasksBoard>["formValues"];
  onChange: (next: ReturnType<typeof useTasksBoard>["formValues"]) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isOwner: boolean;
  userOptions: Array<{ id: number; name: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[30px] border border-white/75 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tasks
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <LabeledField label="Title">
            <input
              value={values.title}
              onChange={(event) => onChange({ ...values, title: event.target.value })}
              placeholder="Follow up dengue review"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
          </LabeledField>
          <LabeledField label="Priority">
            <AppSelectField
              value={values.priority}
              onValueChange={(value) => onChange({ ...values, priority: value as TaskPriority | "" })}
              ariaLabel="Task priority"
              options={[
                { value: "", label: "Default" },
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
            />
          </LabeledField>
          <LabeledField label="Description" className="md:col-span-2">
            <textarea
              value={values.description}
              onChange={(event) => onChange({ ...values, description: event.target.value })}
              placeholder="Short task details for the doctor or assistant."
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
          </LabeledField>
          <LabeledField label="Due Date">
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) => onChange({ ...values, dueDate: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
          </LabeledField>
          <LabeledField label="Source Type">
            <input
              value={values.sourceType}
              onChange={(event) => onChange({ ...values, sourceType: event.target.value })}
              placeholder="follow_up / dispense / stock_review"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
          </LabeledField>
          <LabeledField label="Visit Mode">
            <AppSelectField
              value={values.visitMode}
              onValueChange={(value) => onChange({ ...values, visitMode: value as TaskVisitMode | "" })}
              ariaLabel="Task visit mode"
              options={[
                { value: "", label: "All" },
                { value: "walk_in", label: "Walk-in" },
                { value: "appointment", label: "Appointment" },
              ]}
            />
          </LabeledField>
          <LabeledField label="Workflow Mode">
            <AppSelectField
              value={values.doctorWorkflowMode}
              onValueChange={(value) =>
                onChange({ ...values, doctorWorkflowMode: value as TaskWorkflowMode | "" })
              }
              ariaLabel="Task workflow mode"
              options={[
                { value: "", label: "All" },
                { value: "self_service", label: "Self Service" },
                { value: "clinic_supported", label: "Clinic Supported" },
              ]}
            />
          </LabeledField>
          <LabeledField label="Assigned Role">
            <AppSelectField
              value={values.assignedRole}
              onValueChange={(value) => onChange({ ...values, assignedRole: value as TaskRole | "" })}
              ariaLabel="Assigned role"
              options={[
                { value: "", label: "Auto / none" },
                { value: "doctor", label: "Doctor" },
                { value: "assistant", label: "Assistant" },
                { value: "owner", label: "Owner" },
              ]}
            />
          </LabeledField>
          {isOwner ? (
            <LabeledField label="Assigned User">
              <AppSelectField
                value={values.assignedUserId}
                onValueChange={(value) => onChange({ ...values, assignedUserId: value })}
                ariaLabel="Assigned user"
                options={[
                  { value: "", label: "Unassigned" },
                  ...userOptions.map((user) => ({
                    value: String(user.id),
                    label: user.name,
                  })),
                ]}
              />
            </LabeledField>
          ) : null}
          <LabeledField label="Status">
            <AppSelectField
              value={values.status}
              onValueChange={(value) => onChange({ ...values, status: value as TaskStatus })}
              ariaLabel="Task status"
              options={[
                { value: "pending", label: "Pending" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </LabeledField>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function LabeledField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function TasksSection() {
  const {
    currentUser,
    isOwner,
    groupedTasks,
    summary,
    sourceTypeOptions,
    userOptions,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    visitModeFilter,
    setVisitModeFilter,
    workflowModeFilter,
    setWorkflowModeFilter,
    sourceTypeFilter,
    setSourceTypeFilter,
    roleFilter,
    setRoleFilter,
    assignedUserFilter,
    setAssignedUserFilter,
    isModalOpen,
    editingTask,
    formValues,
    setFormValues,
    isSaving,
    activeTaskId,
    loadState,
    openCreateModal,
    openEditModal,
    closeModal,
    saveTask,
    startTask,
    completeSelectedTask,
    refreshTasks,
  } = useTasksBoard();

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="flex min-h-0 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          <ViewportHeader
            eyebrow="Operations"
            title="Tasks"
            description="Turn warnings, delays, and follow-up needs into an action list your team can actually work through."
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refreshTasks()}
                  disabled={loadState.isLoading}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  {loadState.isLoading ? "Refreshing..." : "Refresh tasks"}
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="ios-button-primary rounded-2xl px-4 py-2 text-xs"
                >
                  New Task
                </button>
              </div>
            }
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Pending" value={summary.pending} tone="amber" />
            <SummaryCard label="In Progress" value={summary.inProgress} tone="sky" />
            <SummaryCard label="Completed" value={summary.completed} tone="emerald" />
            <SummaryCard label="Cancelled" value={summary.cancelled} tone="rose" />
            <SummaryCard label="Visible Tasks" value={summary.total} tone="slate" />
          </div>

          <div className="grid gap-3 rounded-[24px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70 md:grid-cols-2 xl:grid-cols-7">
            <ScopeField label="Status">
              <AppSelectField
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}
                ariaLabel="Task status filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "pending", label: "Pending" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </ScopeField>
            <ScopeField label="Priority">
              <AppSelectField
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}
                ariaLabel="Task priority filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </ScopeField>
            <ScopeField label="Visit Mode">
              <AppSelectField
                value={visitModeFilter}
                onValueChange={(value) => setVisitModeFilter(value as TaskVisitMode | "all")}
                ariaLabel="Task visit mode filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "walk_in", label: "Walk-in" },
                  { value: "appointment", label: "Appointment" },
                ]}
              />
            </ScopeField>
            <ScopeField label="Workflow Mode">
              <AppSelectField
                value={workflowModeFilter}
                onValueChange={(value) =>
                  setWorkflowModeFilter(value as TaskWorkflowMode | "all")
                }
                ariaLabel="Task workflow mode filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "self_service", label: "Self Service" },
                  { value: "clinic_supported", label: "Clinic Supported" },
                ]}
              />
            </ScopeField>
            <ScopeField label="Source Type">
              <AppSelectField
                value={sourceTypeFilter}
                onValueChange={setSourceTypeFilter}
                ariaLabel="Task source filter"
                options={[
                  { value: "all", label: "All" },
                  ...sourceTypeOptions.map((source) => ({
                    value: source,
                    label: formatLabel(source),
                  })),
                ]}
              />
            </ScopeField>
            {isOwner ? (
              <>
                <ScopeField label="Role">
                  <AppSelectField
                    value={roleFilter}
                    onValueChange={(value) => setRoleFilter(value as TaskRole | "all")}
                    ariaLabel="Task role filter"
                    options={[
                      { value: "all", label: "All" },
                      { value: "doctor", label: "Doctor" },
                      { value: "assistant", label: "Assistant" },
                      { value: "owner", label: "Owner" },
                    ]}
                  />
                </ScopeField>
                <ScopeField label="Assigned User">
                  <AppSelectField
                    value={assignedUserFilter}
                    onValueChange={setAssignedUserFilter}
                    ariaLabel="Assigned user filter"
                    options={[
                      { value: "all", label: "All" },
                      ...userOptions.map((user) => ({
                        value: String(user.id),
                        label: user.name,
                      })),
                    ]}
                  />
                </ScopeField>
              </>
            ) : (
              <ScopeField label="Role">{currentUser?.role ?? "--"}</ScopeField>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {loadState.isLoading ? (
              <AsyncStatePanel
                eyebrow="Loading"
                title="Loading tasks"
                description="The operations board is being prepared."
                tone="loading"
              />
            ) : loadState.error ? (
              <AsyncStatePanel
                eyebrow="Error"
                title="Tasks could not be loaded"
                description={loadState.error}
                tone="error"
              />
            ) : (
              <div className="grid h-full min-h-0 gap-3 xl:grid-cols-3">
                <TaskColumn
                  title="Pending"
                  tasks={groupedTasks.pending}
                  onStart={startTask}
                  onEdit={openEditModal}
                  onComplete={completeSelectedTask}
                  activeTaskId={activeTaskId}
                />
                <TaskColumn
                  title="In Progress"
                  tasks={groupedTasks.in_progress}
                  onStart={startTask}
                  onEdit={openEditModal}
                  onComplete={completeSelectedTask}
                  activeTaskId={activeTaskId}
                />
                <TaskColumn
                  title="Completed"
                  tasks={groupedTasks.completed}
                  onStart={startTask}
                  onEdit={openEditModal}
                  onComplete={completeSelectedTask}
                  activeTaskId={activeTaskId}
                />
              </div>
            )}
          </div>
        </ViewportBody>
      </ViewportFrame>

      <TaskModal
        open={isModalOpen}
        title={editingTask ? "Edit Task" : "Create Task"}
        values={formValues}
        onChange={setFormValues}
        onClose={closeModal}
        onSubmit={saveTask}
        isSaving={isSaving}
        isOwner={isOwner}
        userOptions={userOptions}
      />
    </ViewportPage>
  );
}
