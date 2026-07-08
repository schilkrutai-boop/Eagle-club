"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";

const LINKS = [
  { href: "/reservar", label: "Reservar" },
  { href: "/cocina", label: "Cocina" },
  { href: "/admin", label: "Admin" },
];

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <Link href="/" className="wordmark">
          <LogoMark height={30} />
          <span className="mark">Eagle Club</span>
          <span className="sub hidden sm:inline">Indoor Golf</span>
        </Link>
        <nav className="topnav" aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname.startsWith(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
