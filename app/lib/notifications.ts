export type AppNotificationTone = "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: number;
  tone: AppNotificationTone;
  message: string;
  requestId?: string;
};

let nextId = 1;
let notifications: AppNotification[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeNotifications(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationsSnapshot() {
  return notifications;
}

export function addNotification(input: {
  tone: AppNotificationTone;
  message: string;
  requestId?: string;
}) {
  const message = input.message.trim();
  if (!message) {
    return null;
  }

  const last = notifications[notifications.length - 1];
  if (
    last &&
    last.message === message &&
    last.tone === input.tone &&
    last.requestId === input.requestId
  ) {
    return last.id;
  }

  const id = nextId++;
  notifications = [...notifications, { id, tone: input.tone, message, requestId: input.requestId }];
  emit();
  return id;
}

export function removeNotification(id: number) {
  const next = notifications.filter((notification) => notification.id !== id);
  if (next.length === notifications.length) {
    return;
  }

  notifications = next;
  emit();
}

export function notifyError(message: string, requestId?: string) {
  return addNotification({ tone: "error", message, requestId });
}

export function notifyWarning(message: string, requestId?: string) {
  return addNotification({ tone: "warning", message, requestId });
}

export function notifySuccess(message: string, requestId?: string) {
  return addNotification({ tone: "success", message, requestId });
}
