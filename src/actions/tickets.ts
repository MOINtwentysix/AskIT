"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TICKET_CATEGORIES = [
  "Beamer / Display",
  "WLAN / Netzwerk",
  "PC / Laptop / iPad",
  "Ton / Kabel",
  "Sonstiges",
] as const;

const createTicketSchema = z.object({
  roomId: z.string().min(1, "Bitte einen Raum auswählen."),
  category: z.enum(TICKET_CATEGORIES, {
    error: "Bitte eine gültige Kategorie auswählen.",
  }),
  urgency: z.enum(["NORMAL", "URGENT"], {
    error: "Bitte eine gültige Dringlichkeit auswählen.",
  }),
  description: z
    .string()
    .trim()
    .min(5, "Bitte beschreiben Sie das Problem (mind. 5 Zeichen)."),
});

const commentSchema = z
  .string()
  .trim()
  .min(1, "Kommentar darf nicht leer sein.")
  .max(2000, "Kommentar ist zu lang (max. 2000 Zeichen).");

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export async function createTicket(input: CreateTicketInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false as const, error: "Nicht angemeldet." };
  }

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
    return { success: false as const, error: firstIssue };
  }

  const room = await prisma.room.findUnique({
    where: { id: parsed.data.roomId },
    select: { id: true },
  });

  if (!room) {
    return { success: false as const, error: "Ausgewählter Raum existiert nicht." };
  }

  const ticket = await prisma.ticket.create({
    data: {
      roomId: parsed.data.roomId,
      userId: session.user.id,
      category: parsed.data.category,
      urgency: parsed.data.urgency,
      description: parsed.data.description,
      status: "OPEN",
    },
    select: { id: true },
  });

  revalidatePath("/");
  return { success: true as const, ticketId: ticket.id };
}

export async function addComment(ticketId: string, content: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false as const, error: "Nicht angemeldet." };
  }

  if (!ticketId) {
    return { success: false as const, error: "Ungültige Ticket-ID." };
  }

  const parsedContent = commentSchema.safeParse(content);
  if (!parsedContent.success) {
    const firstIssue =
      parsedContent.error.issues[0]?.message ?? "Ungültiger Kommentar.";
    return { success: false as const, error: firstIssue };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true },
  });

  if (!ticket) {
    return { success: false as const, error: "Ticket nicht gefunden." };
  }

  const role = (session.user as { role?: string }).role ?? "USER";
  const isAllowed =
    ticket.userId === session.user.id ||
    role === "IT_TEAM" ||
    role === "ADMIN";

  if (!isAllowed) {
    return { success: false as const, error: "Keine Berechtigung." };
  }

  await prisma.comment.create({
    data: {
      ticketId: ticket.id,
      userId: session.user.id,
      content: parsedContent.data,
    },
  });

  revalidatePath(`/ticket/${ticket.id}`);
  return { success: true as const };
}
