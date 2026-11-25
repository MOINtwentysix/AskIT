import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Calendar, ChevronRight, Inbox, Plus, Tag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import {
  TicketStatusBadge,
  TicketUrgencyBadge,
} from "@/components/TicketStatusBadge";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="h-14 border-b border-border bg-surface/90" />
          <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
            Lade Meldungen…
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      room: {
        select: {
          code: true,
          name: true,
          building: true,
        },
      },
    },
  });

  const userRole = (session.user as { role?: string }).role ?? "USER";
  const activeTickets = tickets.filter((t) => t.status !== "RESOLVED");
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} userRole={userRole} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Link
          href="/ticket/new"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-base font-semibold text-white shadow-xs transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Plus className="h-5 w-5" />
          Neues IT-Ticket melden
        </Link>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Meine Meldungen
            </h1>
            <span className="text-xs font-medium text-muted">
              {activeTickets.length}{" "}
              {activeTickets.length === 1 ? "aktives Ticket" : "aktive Tickets"}
            </span>
          </div>

          {activeTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
              <Inbox className="h-10 w-10 text-muted/60" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Keine offenen Tickets
              </p>
              <p className="mt-1 text-xs text-muted">
                Tippen Sie oben auf „Neues IT-Ticket melden“, um eine Störung zu
                erfassen.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/ticket/${ticket.id}`}
                    className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <TicketStatusBadge status={ticket.status} />
                          <TicketUrgencyBadge urgency={ticket.urgency} />
                        </div>

                        <div>
                          <p className="truncate text-base font-semibold text-foreground">
                            {ticket.room
                              ? `${ticket.room.code} – ${ticket.room.name}`
                              : "Allgemein / Kein Raum"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {ticket.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {ticket.createdAt.toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {resolvedTickets.length > 0 && (
          <details className="group rounded-2xl border border-border bg-surface p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
              <span>Gelöste Tickets</span>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {resolvedTickets.length}
              </span>
            </summary>
            <ul className="mt-3 space-y-3">
              {resolvedTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/ticket/${ticket.id}`}
                    className="block rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <TicketStatusBadge status={ticket.status} />
                          <TicketUrgencyBadge urgency={ticket.urgency} />
                        </div>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {ticket.room
                            ? `${ticket.room.code} – ${ticket.room.name}`
                            : "Allgemein / Kein Raum"}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted">
                          {ticket.description}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}
