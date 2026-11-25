"use client";

import { useState, useTransition } from "react";
import { Search, Shield, User, Wrench } from "lucide-react";
import { toggleUserRole } from "@/actions/admin";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
}

export function AdminTeamManager({
  users,
  currentUserId,
}: {
  users: AdminUserItem[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!normalizedQuery) return true;
    return (
      u.email.toLowerCase().includes(normalizedQuery) ||
      (u.username ?? "").toLowerCase().includes(normalizedQuery) ||
      u.name.toLowerCase().includes(normalizedQuery)
    );
  });

  function handleToggleRole(userId: string, nextRole: "USER" | "IT_TEAM") {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserRole(userId, nextRole);
      if (!res.success) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nach Benutzername, Name oder E-Mail suchen..."
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Keine Benutzer gefunden.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {filteredUsers.map((u) => {
            const isAdmin = u.role === "ADMIN";
            const isItTeam = u.role === "IT_TEAM";
            const isSelf = u.id === currentUserId;

            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {u.username || u.name}
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2 py-0.5 text-[11px] font-medium">
                        <Shield className="h-3 w-3" />
                        ADMIN
                      </span>
                    )}
                    {isItTeam && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[11px] font-medium">
                        <Wrench className="h-3 w-3" />
                        IT_TEAM
                      </span>
                    )}
                    {!isAdmin && !isItTeam && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border text-muted px-2 py-0.5 text-[11px] font-medium">
                        <User className="h-3 w-3" />
                        USER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">{u.email}</p>
                </div>

                {!isAdmin && !isSelf && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleToggleRole(u.id, isItTeam ? "USER" : "IT_TEAM")
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 cursor-pointer ${
                      isItTeam
                        ? "border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
                        : "bg-foreground text-background border-transparent hover:opacity-90"
                    }`}
                  >
                    {isItTeam ? "Zu USER herabstufen" : "Zu IT_TEAM ernennen"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
