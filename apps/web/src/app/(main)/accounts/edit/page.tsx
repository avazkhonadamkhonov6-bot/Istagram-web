import { EditProfileForm } from "@/features/account/components/edit-profile-form";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function EditProfilePage() {
  return <EditProfileForm />;
}