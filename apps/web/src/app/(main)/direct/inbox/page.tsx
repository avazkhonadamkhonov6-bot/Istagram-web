"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewMessageDialog } from "@/features/direct/components/new-message-dialog";

/** /direct/inbox — "Your messages" (Spec 08) */
export default function InboxPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-24 items-center justify-center rounded-full border-2 border-ig-text">
        <Send className="size-12" strokeWidth={1.5} />
      </span>
      <h2 className="text-xl">Your messages</h2>
      <p className="text-sm text-ig-text-secondary">Send private photos and messages to a friend.</p>
      <NewMessageDialog trigger={<Button>Send message</Button>} />
    </div>
  );
}
