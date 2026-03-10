"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

export function createQueryWrapper() {
  const queryClient = createTestQueryClient();

  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
