import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, Calendar, MapPin, Tag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import {
  TicketStatusBadge,
  TicketUrgencyBadge,
} from "@/components/TicketStatusBadge";
import { CommentThread } from "@/components/CommentThread";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="h-14 border-b border-border bg-surface/90" />
          <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-muted">
            Lade Ticket…
          </div>
        </div>
      }
    >
      <TicketDetailContent params={params} />
    </Suspense>
  );
}

async function TicketDetailContent({ params }: TicketDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      room: {
        select: {
          code: true,
          name: true,
          building: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const userRole = (session.user as { role?: string }).role ?? "USER";
  const canView =
    ticket.userId === session.user.id ||
    userRole === "IT_TEAM" ||
    userRole === "ADMIN";

  if (!canView) {
    notFound();
  }

  const serializedComments = ticket.comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: c.user,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} userRole={userRole} />

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketUrgencyBadge urgency={ticket.urgency} />
          </div>

          <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground">
            {ticket.room
              ? `${ticket.room.code} – ${ticket.room.name}`
              : "Allgemein / Kein Raum"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            {ticket.room ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {ticket.room.building}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Raum {ticket.room.code}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Allgemein / Kein Raum
              </span>
            )}
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
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {ticket.description}
            </p>
          </div>
        </article>

        <CommentThread
          ticketId={ticket.id}
          currentUserId={session.user.id}
          comments={serializedComments}
        />
      </main>
    </div>
  );
}
