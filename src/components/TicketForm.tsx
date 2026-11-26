"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Send } from "lucide-react";
import { createTicket } from "@/actions/tickets";

const DEFAULT_CATEGORIES = [
  "Beamer / Display",
  "WLAN / Netzwerk",
  "PC / Laptop / iPad",
  "Ton / Kabel",
  "Sonstiges",
];

export interface RoomOption {
  id: string;
  code: string;
  name: string;
  building: string;
}

interface TicketFormProps {
  rooms: RoomOption[];
  categories?: string[];
  initialRoomId?: string;
}

export function TicketForm({
  rooms,
  categories = DEFAULT_CATEGORIES,
  initialRoomId = "",
}: TicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ticketScope, setTicketScope] = useState<"ROOM" | "GENERAL">("ROOM");
  const [roomId, setRoomId] = useState(initialRoomId || rooms[0]?.id || "NONE");
  const [category, setCategory] = useState(categories[0] ?? "Sonstiges");
  const [urgency, setUrgency] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createTicket({
        roomId: ticketScope === "GENERAL" ? "NONE" : roomId,
        category,
        urgency,
        description,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/ticket/${result.ticketId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Bereich
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTicketScope("ROOM")}
            className={`flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
              ticketScope === "ROOM"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                : "border-border bg-surface text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            Raum
          </button>
          <button
            type="button"
            onClick={() => setTicketScope("GENERAL")}
            className={`flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
              ticketScope === "GENERAL"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                : "border-border bg-surface text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            Allgemein
          </button>
        </div>
      </div>

      {ticketScope === "ROOM" && (
        <div className="space-y-2">
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-foreground"
          >
            Raum
          </label>
          <select
            id="roomId"
            name="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-foreground focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} – {room.name} ({room.building})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-foreground"
        >
          Kategorie
        </label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-foreground focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Dringlichkeit
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUrgency("NORMAL")}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
              urgency === "NORMAL"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-border bg-surface text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
            }`}
          >
            {urgency === "NORMAL" && <Check className="h-4 w-4" />}
            Normal
          </button>

          <button
            type="button"
            onClick={() => setUrgency("URGENT")}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
              urgency === "URGENT"
                ? "border-red-600 bg-red-600 text-white dark:border-red-500 dark:bg-red-500"
                : "border-border bg-surface text-foreground hover:bg-red-50/60 dark:hover:bg-red-950/30"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Dringend
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Problembeschreibung
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={5}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Was funktioniert nicht? (z. B. Beamer zeigt kein Bild, HDMI-Kabel defekt)"
          className="w-full rounded-xl border border-border bg-surface p-3.5 text-base text-foreground placeholder:text-muted focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Wird gesendet…
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Ticket absenden
          </>
        )}
      </button>
    </form>
  );
}
