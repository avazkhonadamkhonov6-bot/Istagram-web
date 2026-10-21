"use client";
import dynamic from "next/dynamic";
import { useUiStore } from "@/store/ui.store";
const CreateModal = dynamic(
  () =>
    import("@/features/create/components/create-modal").then(
      (m) => m.CreateModal,
    ),
  { ssr: false },
);
export function CreateLauncher() {
  const open = useUiStore((s) => s.createOpen);
  return open ? <CreateModal /> : null;
}
