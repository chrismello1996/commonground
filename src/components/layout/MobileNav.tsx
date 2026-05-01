"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/debate", label: "Debate", icon: "zap" },
  { href: "/browse", label: "Browse", icon: "eye" },
  { href: "/challenge", label: "Challenge", icon: "swords" },
  { href: "/clips", label: "Clips", icon: "clip" },
];

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  zap: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  eye: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"}/>
    </svg>
  ),
  swords: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  ),
  clip: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
};

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/debate") {
      return pathname === "/" || pathname === "/debate" || pathname === "/stances" || pathname.startsWith("/debate/");
    }
    return pathname.startsWith(href);
  };

  // Hide mobile nav on debate room pages (full screen experience)
  if (pathname.startsWith("/debate/") && pathname !== "/debate") return null;
  // Hide on watch pages
  if (pathname.includes("/watch/")) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-area-bottom" aria-label="Mobile navigation">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[60px] ${
                active
                  ? "text-emerald-600"
                  : "text-gray-400 active:text-gray-600"
              }`}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
            >
              {icons[tab.icon](active)}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
