"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { useSavedAccounts, useSwitchAccount } from "../hooks";

/** "Switch accounts" (misli Instagram): akkaunthoi vorid shuda + "Log into an existing account" */
export function SwitchAccountsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: accounts, isLoading } = useSavedAccounts(open);
  const switchAccount = useSwitchAccount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0">
        <header className="border-b border-ig-elevated-separator py-3 text-center">
          <DialogTitle>Switch accounts</DialogTitle>
          <DialogDescription className="sr-only">Choose an account to log into</DialogDescription>
        </header>
        <ul className="max-h-[60vh] overflow-y-auto py-2" data-no-translate>
          {isLoading ? (
            <li className="flex justify-center py-6"><Spinner /></li>
          ) : (
            (accounts ?? []).map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={switchAccount.isPending}
                  aria-current={a.current || undefined}
                  onClick={() => (a.current ? onOpenChange(false) : switchAccount.mutate(a))}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-ig-hover-overlay disabled:opacity-60"
                >
                  <SmallAvatar src={mediaUrl(a.image)} name={a.userName} className="size-11" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.userName}</span>
                  {a.current ? (
                    <Check className="size-5 text-ig-primary" aria-label="Current account" />
                  ) : switchAccount.isPending && switchAccount.variables?.id === a.id ? (
                    <Spinner className="size-4" />
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-ig-elevated-separator p-4 text-center">
          <Link
            href="/login?add=1"
            onClick={() => onOpenChange(false)}
            className="text-sm font-semibold text-[rgb(var(--ig-colors-button-borderless-text))] hover:text-[rgb(var(--ig-link))]"
          >
            Log into an existing account
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
