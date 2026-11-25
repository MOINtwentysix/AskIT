"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  UserCheck,
} from "lucide-react";
import {
  addAdminComment,
  assignTicketToSelf,
  updateTicketStatus,
} from "@/actions/admin";

export interface AdminTicketItem {
  id: string;
  category: string;
  urgency: string;
  status: string;
  description: string;
  createdAt: string | Date;
  room: {
    code: string;
    name: string;
    building: string;
  };
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string;
    username: string | null;
  } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    user: {
      name: string;
      role: string;
    };
  }>;
}

type FilterKey = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "URGENT";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Alle" },
  { key: "OPEN", label: "Offen" },
  { key: "IN_PROGRESS", label: "In Bearbeitung" },
  { key: "RESOLVED", label: "Erledigt" },
  { key: "URGENT", label: "Dringend" },
];

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  RESOLVED: "Erledigt",
};

const STATUS_BADGES: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminTicketBoard({
  tickets,
  currentUserId,
}: {
  tickets: AdminTicketItem[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "ALL") return true;
    if (filter === "URGENT") {
      return ticket.urgency.toUpperCase() === "URGENT" || ticket.urgency.toUpperCase() === "HIGH";
    }
    return ticket.status === filter;
  });

  function handleStatusChange(
    ticketId: string,
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  ) {
    setError(null);
    startTransition(async () => {
      const res = await updateTicketStatus(ticketId, status);
      if (!res.success) setError(res.error);
    });
  }

  function handleAssignToSelf(ticketId: string) {
    setError(null);
    startTransition(async () => {
      const res = await assignTicketToSelf(ticketId);
      if (!res.success) setError(res.error);
    });
  }

  function handleAddComment(ticketId: string) {
    const content = (commentDrafts[ticketId] ?? "").trim();
    if (!content) return;
    setError(null);
    startTransition(async () => {
      const res = await addAdminComment(ticketId, content);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface border border-border text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted">
          {filteredTickets.length} {filteredTickets.length === 1 ? "Ticket" : "Tickets"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Keine Tickets für diesen Filter gefunden.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isUrgent =
              ticket.urgency.toUpperCase() === "URGENT" ||
              ticket.urgency.toUpperCase() === "HIGH";
            const isAssignedToMe = ticket.assignedTo?.id === currentUserId;
            const commentsOpen = !!expandedComments[ticket.id];

            return (
              <div
                key={ticket.id}
                className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                        {ticket.room.code}
                      </span>
                      <span className="text-sm font-semibold">
                        {ticket.room.name}
                      </span>
                      <span className="text-xs text-muted">
                        ({ticket.room.building})
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          Dringend
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      Kategorie: <span className="text-foreground font-medium">{ticket.category}</span>
                      {" · "}
                      Gemeldet von{" "}
                      <span className="text-foreground font-medium">
                        {ticket.user.username || ticket.user.name}
                      </span>
                      {" · "}
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_BADGES[ticket.status] ?? "border-border text-muted"
                    }`}
                  >
                    {ticket.status === "RESOLVED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Ticket-Status ändern"
                      value={ticket.status}
                      disabled={isPending}
                      onChange={(e) =>
                        handleStatusChange(
                          ticket.id,
                          e.target.value as "OPEN" | "IN_PROGRESS" | "RESOLVED"
                        )
                      }
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
                    >
                      <option value="OPEN">Offen</option>
                      <option value="IN_PROGRESS">In Bearbeitung</option>
                      <option value="RESOLVED">Erledigt</option>
                    </select>

                    <button
                      type="button"
                      disabled={isPending || isAssignedToMe}
                      onClick={() => handleAssignToSelf(ticket.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {isAssignedToMe
                        ? "Mir zugewiesen"
                        : ticket.assignedTo
                        ? `Zugewiesen: ${ticket.assignedTo.username || ticket.assignedTo.name}`
                        : "Mir zuweisen"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => ({
                        ...prev,
                        [ticket.id]: !prev[ticket.id],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Kommentare ({ticket.comments.length})
                  </button>
                </div>

                {commentsOpen && (
                  <div className="pt-3 border-t border-border space-y-3">
                    {ticket.comments.length === 0 ? (
                      <p className="text-xs text-muted">Noch keine Kommentare.</p>
                    ) : (
                      <div className="space-y-2">
                        {ticket.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-lg bg-background border border-border px-3 py-2 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-muted">
                              <span className="font-medium text-foreground">
                                {comment.user.name}{" "}
                                <span className="font-normal text-muted">
                                  ({comment.user.role})
                                </span>
                              </span>
                              <span>{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[ticket.id] ?? ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [ticket.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(ticket.id);
                          }
                        }}
                        placeholder="Kommentar hinzufügen..."
                        disabled={isPending}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                      <button
                        type="button"
                        disabled={isPending || !(commentDrafts[ticket.id] ?? "").trim()}
                        onClick={() => handleAddComment(ticket.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-medium disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Senden
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
