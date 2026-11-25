"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireStaffSession(allowedRoles: readonly string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Nicht angemeldet." as const, user: null };
  }
  const role = (session.user as { role?: string }).role ?? "USER";
  if (!allowedRoles.includes(role)) {
    return { error: "Keine Berechtigung für diese Aktion." as const, user: null };
  }
  return { error: null, user: session.user };
}

const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket-ID fehlt."),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export async function updateTicketStatus(
  ticketId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
): Promise<ActionResult> {
  const { error } = await requireStaffSession(["IT_TEAM", "ADMIN"]);
  if (error) return { success: false, error };

  const parsed = updateTicketStatusSchema.safeParse({ ticketId, status });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticketId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin");
  return { success: true };
}

const ticketIdSchema = z.object({
  ticketId: z.string().min(1, "Ticket-ID fehlt."),
});

export async function assignTicketToSelf(
  ticketId: string
): Promise<ActionResult> {
  const { error, user } = await requireStaffSession(["IT_TEAM", "ADMIN"]);
  if (error || !user) return { success: false, error: error ?? "Nicht angemeldet." };

  const parsed = ticketIdSchema.safeParse({ ticketId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Ticket-ID.",
    };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticketId },
    data: {
      assignedToId: user.id,
      status: "IN_PROGRESS",
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

const addAdminCommentSchema = z.object({
  ticketId: z.string().min(1, "Ticket-ID fehlt."),
  content: z
    .string()
    .trim()
    .min(1, "Kommentar darf nicht leer sein.")
    .max(2000, "Kommentar ist zu lang (max. 2000 Zeichen)."),
});

export async function addAdminComment(
  ticketId: string,
  content: string
): Promise<ActionResult> {
  const { error, user } = await requireStaffSession(["IT_TEAM", "ADMIN"]);
  if (error || !user) return { success: false, error: error ?? "Nicht angemeldet." };

  const parsed = addAdminCommentSchema.safeParse({ ticketId, content });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  await prisma.comment.create({
    data: {
      ticketId: parsed.data.ticketId,
      userId: user.id,
      content: parsed.data.content,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

const createRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Raumcode ist erforderlich.")
    .max(32, "Raumcode ist zu lang.")
    .regex(/^[A-Za-z0-9_-]+$/, "Raumcode darf nur Buchstaben, Zahlen, - und _ enthalten."),
  name: z
    .string()
    .trim()
    .min(1, "Raumname ist erforderlich.")
    .max(100, "Raumname ist zu lang."),
  building: z
    .string()
    .trim()
    .min(1, "Gebäude ist erforderlich.")
    .max(100, "Gebäudename ist zu lang."),
});

export async function createRoom(input: {
  code: string;
  name: string;
  building: string;
}): Promise<ActionResult<{ id: string; code: string }>> {
  const { error } = await requireStaffSession(["IT_TEAM", "ADMIN"]);
  if (error) return { success: false, error };

  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Raumdaten.",
    };
  }

  const existing = await prisma.room.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      error: `Ein Raum mit dem Code "${parsed.data.code}" existiert bereits.`,
    };
  }

  const room = await prisma.room.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      building: parsed.data.building,
    },
    select: { id: true, code: true },
  });

  revalidatePath("/admin");
  return { success: true, data: room };
}

const toggleUserRoleSchema = z.object({
  userId: z.string().min(1, "Benutzer-ID fehlt."),
  role: z.enum(["USER", "IT_TEAM"]),
});

export async function toggleUserRole(
  userId: string,
  role: "USER" | "IT_TEAM"
): Promise<ActionResult> {
  const { error, user } = await requireStaffSession(["ADMIN"]);
  if (error || !user) return { success: false, error: error ?? "Keine Berechtigung." };

  const parsed = toggleUserRoleSchema.safeParse({ userId, role });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  if (parsed.data.userId === user.id) {
    return {
      success: false,
      error: "Die eigene Rolle kann hier nicht geändert werden.",
    };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });

  if (!target) {
    return { success: false, error: "Benutzer nicht gefunden." };
  }

  if (target.role === "ADMIN") {
    return {
      success: false,
      error: "Administrator-Rollen können hier nicht geändert werden.",
    };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin");
  return { success: true };
}
