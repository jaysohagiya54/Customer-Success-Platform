"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

const baseLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/interactions",
    label: "Interactions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const adminLink = {
  href: "/admin",
  label: "Users",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

// Chevron icons for toggle button
function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const role = useAppSelector((s) => s.auth.user?.role);
  const [collapsed, setCollapsed] = useState(false);

  const links = role === "admin" ? [...baseLinks, adminLink] : baseLinks;

  return (
    <aside
      className={`hidden shrink-0 border-r border-theme bg-sidebar md:flex md:flex-col transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[52px]" : "w-60"
      }`}
    >
      {/* Header */}
      <div className={`flex h-14 items-center border-b border-theme shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-3"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              CS
            </div>
            <span className="text-sm font-semibold text-theme truncate">CS Platform</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-soft transition-colors ${collapsed ? "" : "ml-1 shrink-0"}`}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex flex-1 flex-col gap-0.5 p-2 ${collapsed ? "items-center" : ""}`}>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? link.label : undefined}
              className={`flex items-center rounded-[10px] py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "w-8 h-8 justify-center p-0" : "gap-3 px-3 w-full"
              } ${
                active
                  ? "bg-surface text-theme"
                  : "text-muted hover:bg-surface hover:text-soft"
              }`}
              style={active ? { boxShadow: "var(--shadow-sm)", color: "var(--accent)" } : {}}
            >
              <span className={`shrink-0 ${active ? "text-accent" : ""}`}>{link.icon}</span>
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin footer */}
      {role === "admin" && !collapsed && (
        <div className="border-t border-theme px-4 py-3">
          <p className="text-xs text-muted">Admin workspace</p>
        </div>
      )}
    </aside>
  );
}
