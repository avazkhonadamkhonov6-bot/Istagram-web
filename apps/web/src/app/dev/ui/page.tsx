"use client";

import { useState } from "react";
import { Avatar, AVATAR_SIZES } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StoryRing } from "@/components/ui/story-ring";
import { toast } from "@/components/ui/toast";
import { formatCount, formatRelativeTime } from "@/lib/format";
// Фиксированная точка отсчёта: рендер остаётся чистым (react-hooks/purity)
const REF_NOW = new Date("2026-10-20T12:00:00Z").getTime();

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ig-text-secondary">{title}</h3>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

function Showcase({ mode }: { mode: "light" | "dark" }) {
  const wrapper =
    mode === "dark" ? "dark __ig-dark-mode" : "light __ig-light-mode";
  const demoIcons = [
    Icons.House,
    Icons.Search,
    Icons.Compass,
    Icons.Clapperboard,
    Icons.Send,
    Icons.Heart,
    Icons.SquarePlus,
    Icons.User,
    Icons.Menu,
  ];

  return (
    <div
      className={`${wrapper} space-y-8 rounded-xl border border-ig-separator bg-ig-bg p-6 text-ig-text`}
    >
      <h2 className="border-b border-ig-separator pb-3 text-lg font-semibold">
        {mode === "dark" ? "Dark" : "Light"}
      </h2>

      <Block title="Button">
        <Button>Log in</Button>
        <Button variant="secondary">Following</Button>
        <Button variant="borderless">Follow</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="destructive">Delete</Button>
      </Block>

      <Block title="Button (disabled)">
        <Button disabled>Log in</Button>
        <Button variant="secondary" disabled>
          Following
        </Button>
        <Button variant="borderless" disabled>
          Post
        </Button>
      </Block>

      <Block title="Input">
        <div className="w-full max-w-xs space-y-3">
          <Input label="Username" name={`u-${mode}`} />
          <Input label="Username" name={`ok-${mode}`} status="success" defaultValue="abubakr" />
          <Input
            label="Username"
            name={`bad-${mode}`}
            status="error"
            error="This username is already taken."
            defaultValue="avaz"
          />
        </div>
      </Block>

      <Block title="Avatar (24 / 32 / 44 / 56 / 77 / 150)">
        {AVATAR_SIZES.map((size) => (
          <Avatar key={size} alt="Abubakr" size={size} />
        ))}
      </Block>

      <Block title="StoryRing (unseen / seen / close-friends)">
        <StoryRing state="unseen">
          <Avatar alt="Avaz" size={56} />
        </StoryRing>
        <StoryRing state="seen">
          <Avatar alt="Avaz" size={56} />
        </StoryRing>
        <StoryRing state="close-friends">
          <Avatar alt="Avaz" size={56} />
        </StoryRing>
      </Block>

      <Block title="Skeleton / Spinner">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Spinner />
        <Spinner size={32} />
      </Block>

      <Block title="Icons (lucide-react)">
        {demoIcons.map((Icon, i) => (
          <Icon key={i} className="size-6 text-ig-icon" />
        ))}
      </Block>

      <Block title="format.ts">
        <code className="text-xs">
          {formatRelativeTime(REF_NOW - 2 * 60_000, REF_NOW)} ·{" "}
          {formatRelativeTime(REF_NOW - 3 * 3_600_000, REF_NOW)} ·{" "}
          {formatRelativeTime(REF_NOW - 5 * 86_400_000, REF_NOW)} ·{" "}
          {formatRelativeTime(REF_NOW - 14 * 86_400_000, REF_NOW)} ·{" "}
          {formatRelativeTime(REF_NOW - 90 * 86_400_000, REF_NOW)}
        </code>
        <code className="text-xs">
          {formatCount(1234)} · {formatCount(12_500)} · {formatCount(1_200_000)}
        </code>
      </Block>
    </div>
  );
}

export default function DevUiPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function applyTheme(next: "light" | "dark") {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    setTheme(next);
  }

  return (
    <main className="min-h-screen bg-ig-bg px-6 py-8 text-ig-text">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ig-separator pb-4">
          <div className="flex items-center gap-3">
            <span className="font-logo text-3xl">Instagram</span>
            <span className="rounded-md bg-ig-bg-secondary px-2.5 py-1 text-xs font-semibold text-ig-text-secondary">
              FE-03 · /dev/ui
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={() => applyTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Icons.Moon className="size-4" />
            ) : (
              <Icons.Sun className="size-4" />
            )}
            Theme: {theme}
          </Button>
        </header>

        <section className="space-y-3 rounded-xl border border-ig-separator p-6">
          <h3 className="text-sm font-semibold text-ig-text-secondary">
            Overlay: Dialog / Dropdown / Sheet / Toast (используют текущую тему страницы)
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <div className="space-y-2 p-6">
                  <DialogTitle>Delete post?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone.
                  </DialogDescription>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Open Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Icons.Settings className="size-5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.Bookmark className="size-5" />
                  Saved
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="space-y-2 p-6">
                  <SheetTitle className="text-xl font-semibold">Search</SheetTitle>
                  <SheetDescription className="text-sm text-ig-text-secondary">
                    Panel 397px
                  </SheetDescription>
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={() => toast("Link copied to clipboard")}>
              Show Toast
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Showcase mode="light" />
          <Showcase mode="dark" />
        </div>
      </div>
    </main>
  );
}