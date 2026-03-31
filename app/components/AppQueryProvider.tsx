"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { NotificationCenter } from "./ui/NotificationCenter";
import { notifyError, notifyWarning } from "../lib/notifications";
import type { ApiClientError } from "../lib/api-client";

function getErrorDetails(error: unknown): {
  message: string;
  tone: "warning" | "error";
  requestId?: string;
} {
  if (typeof error === "string") {
    return { message: error, tone: "error" };
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const apiError = error as ApiClientError;

    return {
      message: apiError.userMessage ?? apiError.message,
      tone: apiError.severity === "warning" ? "warning" : "error",
      requestId: apiError.requestId,
    };
  }

  return {
    message: "Something went wrong while talking to the server.",
    tone: "error",
  };
}

function notifyForError(error: unknown) {
  const details = getErrorDetails(error);

  if (details.requestId) {
    console.error("API request failed", {
      requestId: details.requestId,
      error,
    });
  }

  if (details.tone === "warning") {
    notifyWarning(details.message, details.requestId);
    return;
  }

  notifyError(details.message, details.requestId);
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifyForError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifyForError(error);
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <NotificationCenter />
    </QueryClientProvider>
  );
}
