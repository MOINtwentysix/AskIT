import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, QrCode, Ticket, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTicketBoard } from "@/components/AdminTicketBoard";
import { AdminRoomsQR } from "@/components/AdminRoomsQR";
import { AdminTeamManager } from "@/components/AdminTeamManager";

type TabKey = "tickets" | "rooms" | "team";

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-sm text-muted">
          Lade Administration...
        </div>
      }
    >
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || (role !== "IT_TEAM" && role !== "ADMIN")) {
    redirect("/");
  }

  const isAdmin = role === "ADMIN";
  const resolvedParams = await searchParams;
  const requestedTab = resolvedParams.tab as TabKey | undefined;
  const activeTab: TabKey =
    requestedTab === "rooms"
      ? "rooms"
      : requestedTab === "team" && isAdmin
      ? "team"
      : "tickets";

  const [tickets, rooms, users] = await Promise.all([
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { code: true, name: true, building: true } },
        user: { select: { id: true, name: true, username: true, email: true } },
        assignedTo: { select: { id: true, name: true, username: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, role: true } } },
        },
      },
    }),
    prisma.room.findMany({
      orderBy: [{ building: "asc" }, { code: "asc" }],
      include: { _count: { select: { tickets: true } } },
    }),
    isAdmin
      ? prisma.user.findMany({
          orderBy: [{ role: "asc" }, { name: "asc" }],
          select: { id: true, name: true, email: true, username: true, role: true },
        })
      : Promise.resolve([]),
  ]);

  const tabs: Array<{ key: TabKey; label: string; icon: typeof Ticket }> = [
    { key: "tickets", label: "Ticket-Board", icon: Ticket },
    { key: "rooms", label: "Räume & QR-Codes", icon: QrCode },
    ...(isAdmin
      ? [{ key: "team" as const, label: "Team-Verwaltung", icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="no-print border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Startseite
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                IT-Team &amp; Administration
              </h1>
              <p className="text-xs text-muted">
                Angemeldet als {session.user.name} ({role})
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-1.5" aria-label="Admin-Bereiche">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/admin?tab=${tab.key}`}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {activeTab === "tickets" && (
          <AdminTicketBoard
            tickets={tickets}
            currentUserId={session.user.id}
          />
        )}
        {activeTab === "rooms" && <AdminRoomsQR rooms={rooms} />}
        {activeTab === "team" && isAdmin && (
          <AdminTeamManager users={users} currentUserId={session.user.id} />
        )}
      </main>
    </div>
  );
}
