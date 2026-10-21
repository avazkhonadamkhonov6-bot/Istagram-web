"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { closeSocket } from "@/lib/socket";
import * as authApi from "./api";

export const authKeys = {
  me: ["me"] as const,
};

export function useMe() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.getMyProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { ...query, data: hydrated ? query.data : undefined };
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      closeSocket();
      qc.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}