import { instantDtoSchema, type InstantDto } from "@repo/shared";
import { api } from "@/lib/api-client";

/** Instants (Spec 17) */
export const instantKeys = { inbox: ["instants"] as const, archive: ["instants", "archive"] as const };

export const getInstants = () => api<InstantDto[]>("/Instant/get-instants", { schema: instantDtoSchema.array() });
export const getInstantArchive = () =>
  api<InstantDto[]>("/Instant/get-instant-archive", { schema: instantDtoSchema.array() });
export const viewInstant = (id: number) => api<boolean>(`/Instant/view-instant?id=${id}`, { method: "POST" });
export const deleteInstant = (id: number) => api<boolean>(`/Instant/delete-instant?id=${id}`, { method: "DELETE" });

export function addInstant(photo: Blob, closeFriends: boolean) {
  const form = new FormData();
  form.set("Image", photo, "instant.jpg");
  return api<InstantDto>(`/Instant/add-instant?CloseFriends=${closeFriends}`, {
    method: "POST",
    body: form,
    schema: instantDtoSchema,
  });
}
