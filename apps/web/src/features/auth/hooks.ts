"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { closeSocket } from "@/lib/socket";
import * as authApi from "./api";

export const authKeys = {
  me: ["me"] as const,
  accounts: ["auth", "accounts"] as const,
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

export function useSavedAccounts(enabled = true) {
  return useQuery({
    queryKey: authKeys.accounts,
    queryFn: authApi.getSavedAccounts,
    enabled,
    staleTime: 0,
    retry: false,
  });
}

/**
 * Ivazi akkaunt (misli Instagram): toast "Switching accounts...", cookie-i token ivaz meshavad,
 * sipas navigatsiyai purra — kesh, socket va store-hoi akkaunti peshina pok meshavand.
 * Agar token-i saqlshuda kuhna boshad — ba /login bo nomi korbar.
 */
export function useSwitchAccount() {
  return useMutation({
    mutationFn: (account: authApi.SavedAccount) => authApi.switchAccount(account.id),
    onMutate: () => ({ toastId: toast.loading("Switching accounts...") }),
    onSuccess: () => {
      closeSocket();
      // Navigatsiyai purra: hamai keshi akkaunti peshina pok meshavad
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    },
    onError: (err, account, ctx) => {
      if (ctx) toast.dismiss(ctx.toastId);
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?${new URLSearchParams({ add: "1", u: account.userName })}`);
        return;
      }
      toast.error(err.message || "Couldn't switch accounts. Try again.");
    },
  });
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