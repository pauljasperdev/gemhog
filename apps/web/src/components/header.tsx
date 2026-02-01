"use client";
import Link from "next/link";

import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/ai", label: "AI Chat" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-muted border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <nav className="flex gap-6 font-medium text-sm">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
