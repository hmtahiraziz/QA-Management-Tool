"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { apiUrl } from "@/lib/api";

const nav = [
  { href: "/", label: "Overview", icon: "◆", fullOnly: false },
  { href: "/projects", label: "Projects", icon: "▣", fullOnly: false },
  { href: "/test-cases", label: "Test cases", icon: "☰", fullOnly: false },
  { href: "/bugs", label: "Bugs", icon: "◉", fullOnly: false },
  { href: "/team", label: "Team", icon: "◎", fullOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isFullAccess, logout } = useAuth();
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    fetch(apiUrl("/api/health"))
      .then(async (res) => {
        const data = await res.json();
        setHealth(data.connected ? "ok" : "down");
      })
      .catch(() => setHealth("down"));
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/team") && !isFullAccess) {
      router.replace("/");
    }
  }, [pathname, isFullAccess, router]);

  const visibleNav = nav.filter((item) => !item.fullOnly || isFullAccess);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">QA</div>
        <div>
          <strong>TestForge</strong>
          <span>Airtable workspace</span>
        </div>
      </div>

      <nav className="nav">
        {visibleNav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user">
            <strong>{user.name || user.email}</strong>
            <span>{isFullAccess ? "Full access" : "Read-only"}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              Sign out
            </button>
          </div>
        ) : null}
        <div className={`connection ${health}`}>
          <span className="dot" />
          {health === "checking" && "Checking Airtable…"}
          {health === "ok" && "connected"}
          {health === "down" && "Database unreachable"}
        </div>
      </div>
    </aside>
  );
}
