"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/debate", label: "Debate", icon: "zap" },
  { href: "/browse", label: "Browse", icon: "eye" },
  { href: "/challenge", label: "Challenge", icon: "swords" },
  { href: "/clips", label: "Clips", icon: "clip" },
];

const icons: Record<string, React.ReactNode> = {
  zap: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  swords: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  ),
  clip: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
};

export default function NavTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/debate") {
      return pathname === "/" || pathname === "/debate" || pathname === "/stances" || pathname.startsWith("/debate/");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden sm:flex items-center gap-0.5">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
            isActive(tab.href)
              ? "text-emerald-600 bg-emerald-500/10"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {icons[tab.icon]}
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
