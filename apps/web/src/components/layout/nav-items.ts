import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Compass,
  Heart,
  House,
  Search,
  Send,
  SquarePlus,
  User,
} from "@/components/ui/icons";
import { CURRENT_USERNAME } from "@/lib/constants";
import type { SidePanel } from "@/store/ui.store";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  fillWhenActive?: boolean;
} & (
  | { kind: "link"; href: string; match: (pathname: string) => boolean }
  | { kind: "panel"; panel: Exclude<SidePanel, null> }
  | { kind: "create" }
);

const profileHref = `/${CURRENT_USERNAME}`;

export const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "Home",
    icon: House,
    fillWhenActive: true,
    kind: "link",
    href: "/",
    match: (p) => p === "/",
  },
  { key: "search", label: "Search", icon: Search, kind: "panel", panel: "search" },
  {
    key: "explore",
    label: "Explore",
    icon: Compass,
    kind: "link",
    href: "/explore",
    match: (p) => p.startsWith("/explore"),
  },
  {
    key: "reels",
    label: "Reels",
    icon: Clapperboard,
    kind: "link",
    href: "/reels",
    match: (p) => p.startsWith("/reels"),
  },
  {
    key: "messages",
    label: "Messages",
    icon: Send,
    kind: "link",
    href: "/direct/inbox",
    match: (p) => p.startsWith("/direct"),
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Heart,
    fillWhenActive: true,
    kind: "panel",
    panel: "notifications",
  },
  { key: "create", label: "Create", icon: SquarePlus, kind: "create" },
  {
    key: "profile",
    label: "Profile",
    icon: User,
    fillWhenActive: true,
    kind: "link",
    href: profileHref,
    match: (p) => p === profileHref || p.startsWith(`${profileHref}/`),
  },
];

export const BOTTOM_NAV_KEYS = ["home", "explore", "reels", "create", "profile"];

export function isItemActive(
  item: NavItem,
  pathname: string,
  panel: SidePanel,
): boolean {
  if (item.kind === "panel") return panel === item.panel;
  if (panel) return false;
  if (item.kind === "link") return item.match(pathname);
  return false;
}