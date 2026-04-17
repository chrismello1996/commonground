"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/debate", label: "Debate", icon: "zap" },
  { href: "/browse", label: "Browse", icon: "eye" },
  { href: "/rankings", label: "Rankings", icon: "trophy" },
  { href: "/clips", label: "Clips", icon: "scissors" },
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
  trophy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  scissors: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
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
