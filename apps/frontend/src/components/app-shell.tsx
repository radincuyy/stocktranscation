"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Cube, Pulse, ArrowsDownUp } from "@phosphor-icons/react";

const nav = [
  { href: "/products", label: "Master Barang", icon: Package },
  {
    href: "/stock-transactions",
    label: "Transaksi Stok",
    icon: ArrowsDownUp,
  },
  { href: "/health", label: "Health", icon: Pulse },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative z-0 min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/products" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-app)] bg-accent text-white dark:text-zinc-950">
              <Cube size={18} weight="bold" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">MPA Stock</p>
              <p className="text-xs text-muted">KoperasiKuat inventory</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 rounded-[var(--radius-app)] px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
