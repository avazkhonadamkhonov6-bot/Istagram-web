"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@repo/shared";
import { authKeys } from "@/features/auth/hooks";
import * as accountApi from "./api";

function useSyncProfile() {
  const qc = useQueryClient();
  return (profile: UserProfile) => {
    qc.setQueryData(authKeys.me, profile);
    void qc.invalidateQueries({ queryKey: ["profile"] });
  };
}

export function useUpdateProfile() {
  const sync = useSyncProfile();
  return useMutation({ mutationFn: accountApi.updateProfile, onSuccess: sync });
}

export function useUploadAvatar() {
  const sync = useSyncProfile();
  return useMutation({ mutationFn: accountApi.uploadAvatar, onSuccess: sync });
}

export function useDeleteAvatar() {
  const sync = useSyncProfile();
  return useMutation({ mutationFn: accountApi.deleteAvatar, onSuccess: sync });
}

export function useChangePassword() {
  return useMutation({ mutationFn: accountApi.changePassword });
}