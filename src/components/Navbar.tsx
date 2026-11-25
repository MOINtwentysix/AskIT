"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Wrench } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface NavbarProps {
  userName?: string | null;
  userRole?: string | null;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const router = useRouter();
  const isStaff = userRole === "IT_TEAM" || userRole === "ADMIN";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Wrench className="h-4 w-4" />
          </span>
          <span className="text-base">AskIT</span>
        </Link>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden text-xs text-muted sm:inline">
              {userName}
            </span>
          )}

          {isStaff && (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Abmelden"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  );
}
