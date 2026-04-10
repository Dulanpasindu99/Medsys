"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  completeTask,
  createTask,
  updateTask,
  type TaskCreatePayload,
  type TaskItem,
  type TaskPriority,
  type TaskRole,
  type TaskStatus,
  type TasksQuery,
  type TaskUpdatePayload,
  type TaskVisitMode,
  type TaskWorkflowMode,
} from "@/app/lib/api-client";
import { queryKeys } from "@/app/lib/query-keys";
import { useCurrentUserQuery, useTasksQuery, useUsersQuery } from "@/app/lib/query-hooks";
import { notifyError, notifySuccess } from "@/app/lib/notifications";

export type TaskFormValues = {
  title: string;
  description: string;
  priority: TaskPriority | "";
  dueDate: string;
  assignedRole: TaskRole | "";
  assignedUserId: string;
  visitMode: TaskVisitMode | "";
  doctorWorkflowMode: TaskWorkflowMode | "";
  sourceType: string;
  status: TaskStatus;
};

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: "",
  description: "",
  priority: "",
  dueDate: "",
  assignedRole: "",
  assignedUserId: "",
  visitMode: "",
  doctorWorkflowMode: "",
  sourceType: "",
  status: "pending",
};

function asUserRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toTaskFormValues(task: TaskItem): TaskFormValues {
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority ?? "",
    dueDate: task.dueDate ?? task.dueAt?.slice(0, 10) ?? "",
    assignedRole: task.assignedRole ?? "",
    assignedUserId: task.assignedUserId ? String(task.assignedUserId) : "",
    visitMode: task.visitMode ?? "",
    doctorWorkflowMode: task.doctorWorkflowMode ?? "",
    sourceType: task.sourceType ?? "",
    status: task.status ?? "pending",
  };
}

function buildCreatePayload(values: TaskFormValues): TaskCreatePayload {
  return {
    title: values.title.trim(),
    description: toNullableString(values.description),
    priority: values.priority || null,
    dueDate: values.dueDate || null,
    assignedRole: values.assignedRole || null,
    assignedUserId: values.assignedUserId ? Number(values.assignedUserId) : null,
    visitMode: values.visitMode || null,
    doctorWorkflowMode: values.doctorWorkflowMode || null,
    sourceType: toNullableString(values.sourceType),
  };
}

function buildUpdatePayload(values: TaskFormValues): TaskUpdatePayload {
  return {
    ...buildCreatePayload(values),
    status: values.status,
  };
}

export function useTasksBoard() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const currentUser = currentUserQuery.data ?? null;
  const isOwner = currentUser?.role === "owner";

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [visitModeFilter, setVisitModeFilter] = useState<TaskVisitMode | "all">("all");
  const [workflowModeFilter, setWorkflowModeFilter] = useState<TaskWorkflowMode | "all">("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<TaskRole | "all">("all");
  const [assignedUserFilter, setAssignedUserFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formValues, setFormValues] = useState<TaskFormValues>(EMPTY_TASK_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const queryInput = useMemo<TasksQuery | undefined>(() => {
    const next: TasksQuery = {};
    if (statusFilter !== "all") next.status = statusFilter;
    if (visitModeFilter !== "all") next.visitMode = visitModeFilter;
    if (workflowModeFilter !== "all") next.doctorWorkflowMode = workflowModeFilter;
    if (isOwner && roleFilter !== "all") next.role = roleFilter;
    return Object.keys(next).length ? next : undefined;
  }, [isOwner, roleFilter, statusFilter, visitModeFilter, workflowModeFilter]);

  const tasksQuery = useTasksQuery(queryInput, !!currentUser);
  const doctorUsersQuery = useUsersQuery({ role: "doctor" }, isOwner);
  const assistantUsersQuery = useUsersQuery({ role: "assistant" }, isOwner);

  const tasks = tasksQuery.data ?? [];

  const userOptions = useMemo(() => {
    const fromUsers = [
      ...asUserRows(doctorUsersQuery.data).map((row) => ({
        id: getNumber(row.id ?? row.userId),
        name: getString(row.name ?? row.fullName) || getString(row.email),
      })),
      ...asUserRows(assistantUsersQuery.data).map((row) => ({
        id: getNumber(row.id ?? row.userId),
        name: getString(row.name ?? row.fullName) || getString(row.email),
      })),
    ].filter((row): row is { id: number; name: string } => row.id !== null && Boolean(row.name));

    const fromTasks = tasks
      .map((task) => ({
        id: task.assignedUserId ?? null,
        name: task.assignedUserName ?? "",
      }))
      .filter((row): row is { id: number; name: string } => row.id !== null && Boolean(row.name));

    const merged = [...fromUsers, ...fromTasks];
    const seen = new Set<number>();
    return merged.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [assistantUsersQuery.data, doctorUsersQuery.data, tasks]);

  const sourceTypeOptions = useMemo(() => {
    const values = Array.from(
      new Set(tasks.map((task) => task.sourceType).filter((value): value is string => Boolean(value)))
    );
    return values.sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (sourceTypeFilter !== "all" && task.sourceType !== sourceTypeFilter) return false;
      if (assignedUserFilter !== "all" && String(task.assignedUserId ?? "") !== assignedUserFilter) {
        return false;
      }
      return true;
    });
  }, [assignedUserFilter, priorityFilter, sourceTypeFilter, tasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, TaskItem[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    for (const task of filteredTasks) {
      groups[task.status ?? "pending"].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const summary = useMemo(
    () => ({
      total: filteredTasks.length,
      pending: groupedTasks.pending.length,
      inProgress: groupedTasks.in_progress.length,
      completed: groupedTasks.completed.length,
      cancelled: groupedTasks.cancelled.length,
    }),
    [filteredTasks.length, groupedTasks]
  );

  function openCreateModal() {
    setEditingTask(null);
    setFormValues(EMPTY_TASK_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(task: TaskItem) {
    setEditingTask(task);
    setFormValues(toTaskFormValues(task));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormValues(EMPTY_TASK_FORM);
  }

  async function refreshTasks() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
  }

  async function saveTask() {
    if (!formValues.title.trim()) {
      notifyError("Task title is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, buildUpdatePayload(formValues));
        notifySuccess("Task updated.");
      } else {
        await createTask(buildCreatePayload(formValues));
        notifySuccess("Task created.");
      }
      closeModal();
      await refreshTasks();
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? "Unable to save task right now.";
      notifyError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function startTask(task: TaskItem) {
    setActiveTaskId(task.id);
    try {
      await updateTask(task.id, { status: "in_progress" });
      notifySuccess("Task moved to in progress.");
      await refreshTasks();
    } catch (error) {
      notifyError((error as { message?: string })?.message ?? "Unable to start task.");
    } finally {
      setActiveTaskId(null);
    }
  }

  async function completeSelectedTask(task: TaskItem) {
    setActiveTaskId(task.id);
    try {
      await completeTask(task.id, {});
      notifySuccess("Task completed.");
      await refreshTasks();
    } catch (error) {
      notifyError((error as { message?: string })?.message ?? "Unable to complete task.");
    } finally {
      setActiveTaskId(null);
    }
  }

  return {
    currentUser,
    isOwner,
    tasks,
    filteredTasks,
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
    loadState: {
      isLoading: tasksQuery.isPending || tasksQuery.isFetching,
      error: tasksQuery.isError
        ? ((tasksQuery.error as { message?: string } | undefined)?.message ?? "Unable to load tasks.")
        : null,
    },
    openCreateModal,
    openEditModal,
    closeModal,
    saveTask,
    startTask,
    completeSelectedTask,
    refreshTasks: async () => {
      await tasksQuery.refetch();
    },
  };
}
