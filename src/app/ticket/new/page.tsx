import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { TicketForm } from "@/components/TicketForm";

interface NewTicketPageProps {
  searchParams: Promise<{ room?: string }>;
}

export default function NewTicketPage({ searchParams }: NewTicketPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="h-14 border-b border-border bg-surface/90" />
          <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted">
            Lade Formular…
          </div>
        </div>
      }
    >
      <NewTicketContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewTicketContent({ searchParams }: NewTicketPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { room: roomParam } = await searchParams;

  const rooms = await prisma.room.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      building: true,
    },
  });

  const matchedRoom = roomParam
    ? rooms.find((r) => r.code.toLowerCase() === roomParam.trim().toLowerCase())
    : undefined;

  const userRole = (session.user as { role?: string }).role ?? "USER";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={session.user.name} userRole={userRole} />

      <main className="mx-auto max-w-xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Neues IT-Ticket melden
          </h1>
          <p className="mt-1 text-sm text-muted">
            Beschreiben Sie die Störung, damit das IT-Team schnell helfen kann.
          </p>

          <div className="mt-6">
            <TicketForm rooms={rooms} initialRoomId={matchedRoom?.id ?? ""} />
          </div>
        </div>
      </main>
    </div>
  );
}
