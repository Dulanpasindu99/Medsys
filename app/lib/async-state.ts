export type LoadStatus = "idle" | "loading" | "ready" | "empty" | "error";
export type MutationStatus = "idle" | "pending" | "success" | "error";

export type LoadState = {
  status: LoadStatus;
  error: string | null;
  notice: string | null;
};

export type MutationState = {
  status: MutationStatus;
  error: string | null;
  message: string | null;
};

export const idleLoadState = (): LoadState => ({
  status: "idle",
  error: null,
  notice: null,
});

export const loadingLoadState = (): LoadState => ({
  status: "loading",
  error: null,
  notice: null,
});

export const readyLoadState = (notice?: string | null): LoadState => ({
  status: "ready",
  error: null,
  notice: notice ?? null,
});

export const emptyLoadState = (notice?: string | null): LoadState => ({
  status: "empty",
  error: null,
  notice: notice ?? null,
});

export const errorLoadState = (
  error: string,
  notice?: string | null
): LoadState => ({
  status: "error",
  error,
  notice: notice ?? null,
});

export const idleMutationState = (): MutationState => ({
  status: "idle",
  error: null,
  message: null,
});

export const pendingMutationState = (): MutationState => ({
  status: "pending",
  error: null,
  message: null,
});

export const successMutationState = (message?: string | null): MutationState => ({
  status: "success",
  error: null,
  message: message ?? null,
});

export const errorMutationState = (
  error: string,
  message?: string | null
): MutationState => ({
  status: "error",
  error,
  message: message ?? null,
});
