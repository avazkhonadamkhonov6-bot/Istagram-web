import type { ComponentProps } from "react";

export function SidebarIcon({ name, active, ...props }: ComponentProps<"svg"> & { name: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {name === "home" && <path d="m3 10 7.6-7a2 2 0 0 1 2.8 0l7.6 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" fill={active ? "currentColor" : "none"} />}
      {name === "reels" && <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="m10 7 6 5-6 5Z" /></>}
      {name === "messages" && <path d="M21.4 5.2 14 21l-3.7-8.1L2.6 7.4a1.4 1.4 0 0 1 .8-2.5L20 3.2a1.4 1.4 0 0 1 1.4 2ZM10.3 12.9 17 7" />}
      {name === "search" && <><circle cx="10.8" cy="10.8" r="8.8" /><path d="m17.2 17.2 4.6 4.6" /></>}
      {name === "notifications" && <path d="M20.8 4.6a5.7 5.7 0 0 0-8.8.9 5.7 5.7 0 0 0-8.8-.9C.8 7.2 1.4 10.5 4 13.2l8 8 8-8c2.6-2.7 3.2-6 .8-8.6Z" fill={active ? "currentColor" : "none"} />}
      {name === "create" && <path d="M12 3v18M3 12h18" />}
      {name === "products" && <><rect x="8.5" y="2" width="7" height="7" rx="1" /><rect x="2" y="14" width="7" height="7" rx="1" /><rect x="15" y="14" width="7" height="7" rx="1" /><path d="M12 9v3M5.5 14v-2h13v2" /></>}
    </svg>
  );
}
