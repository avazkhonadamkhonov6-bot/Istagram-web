import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Xatohoi 4xx takror nameshavand, shabaka — 2 bor (TZ §6.3)
        retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      },
    },
  });
}
