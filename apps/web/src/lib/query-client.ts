import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Kesh-i sahifahoi kushodashuda 5 daqiqa nigoh doshta meshavad (bozgasht — foran)
        gcTime: 5 * 60_000,
        // Bozgasht ba tab / internet — ma'lumot nav meshavad
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Xatohoi 4xx takror nameshavand, shabaka — 2 bor (TZ §6.3)
        retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      },
      mutations: {
        // Amalho (like, firistodan) xudkor takror nameshavand — du bor ijro nashavand
        retry: false,
      },
    },
  });
}
