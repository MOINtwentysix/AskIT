"use client";

import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Printer } from "lucide-react";
import { createRoom } from "@/actions/admin";

export interface AdminRoomItem {
  id: string;
  code: string;
  name: string;
  building: string;
  _count?: {
    tickets: number;
  };
}

export function AdminRoomsQR({ rooms }: { rooms: AdminRoomItem[] }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [printingRoomId, setPrintingRoomId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function triggerPrint(roomId: string | null) {
    setPrintingRoomId(roomId);
    setTimeout(() => {
      window.print();
    }, 50);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createRoom({ code, name, building });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccess(`Raum "${code.trim()}" wurde angelegt.`);
      setCode("");
      setName("");
      setBuilding("");
    });
  }

  return (
    <div className="space-y-6">
      <div className="no-print rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Neuen Raum anlegen</h2>
            <p className="text-xs text-muted">
              Erstellt einen Raum und generiert automatisch den passenden QR-Code.
            </p>
          </div>
          <button
            type="button"
            onClick={() => triggerPrint(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Druckansicht / Alle QR-Codes drucken
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code (z.B. R204)"
            required
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (z.B. Raum 204)"
            required
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <input
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="Gebäude (z.B. Hauptgebäude)"
            required
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Raum erstellen
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="no-print rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Noch keine Räume vorhanden.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-6">
          {rooms.map((room) => {
            const qrUrl = `${baseUrl}/ticket/new?room=${encodeURIComponent(room.code)}`;
            const isHiddenInPrint =
              printingRoomId !== null && printingRoomId !== room.id;
            return (
              <div
                key={room.id}
                className={`print-break-inside-avoid rounded-xl border border-border bg-surface p-5 flex flex-col items-center text-center space-y-3 print:border-zinc-300 print:bg-white print:text-black ${
                  isHiddenInPrint ? "print:hidden" : ""
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 print:bg-zinc-100 print:text-black">
                    {room.code}
                  </span>
                  <h3 className="text-base font-semibold pt-1">{room.name}</h3>
                  <p className="text-xs text-muted print:text-zinc-600">
                    {room.building}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-zinc-200">
                  <QRCodeSVG value={qrUrl} size={144} level="M" />
                </div>

                <p className="text-[11px] text-muted print:text-zinc-700">
                  Störung melden: QR-Code scannen
                </p>
                <p className="no-print font-mono text-[11px] text-muted break-all">
                  {qrUrl}
                </p>
                <button
                  type="button"
                  onClick={() => triggerPrint(room.id)}
                  className="no-print inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Einzeln drucken
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
