"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getNotificationsSnapshot,
  removeNotification,
  subscribeNotifications,
} from "../../lib/notifications";

const toneClasses = {
  info: "bg-sky-50 text-sky-700 ring-sky-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  error: "bg-rose-50 text-rose-700 ring-rose-100",
} as const;

export function NotificationCenter() {
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getNotificationsSnapshot
  );

  useEffect(() => {
    if (!notifications.length) {
      return;
    }

    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        removeNotification(notification.id);
      }, 6000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications]);

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-1 ${toneClasses[notification.tone]}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="leading-6">{notification.message}</p>
              {notification.requestId ? (
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-75">
                  Ref: {notification.requestId}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-current"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
