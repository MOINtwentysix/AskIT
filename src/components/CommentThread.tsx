"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { addComment } from "@/actions/tickets";

export interface ThreadComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface CommentThreadProps {
  ticketId: string;
  currentUserId: string;
  comments: ThreadComment[];
}

export function CommentThread({
  ticketId,
  currentUserId,
  comments,
}: CommentThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addComment(ticketId, content);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setContent("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <MessageSquare className="h-4 w-4 text-muted" />
        <h2 className="text-base font-semibold text-foreground">
          Kommentare ({comments.length})
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Noch keine Kommentare. Schreiben Sie eine Nachricht an das IT-Team.
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user.id === currentUserId;
            const isStaff =
              comment.user.role === "IT_TEAM" || comment.user.role === "ADMIN";

            return (
              <div
                key={comment.id}
                className={`flex flex-col ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isOwn
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-75">
                    <span className="font-medium">{comment.user.name}</span>
                    {isStaff && (
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        IT-Team
                      </span>
                    )}
                    <span>
                      {new Date(comment.createdAt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 border-t border-border pt-4">
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="Nachricht schreiben…"
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            aria-label="Kommentar senden"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Senden</span>
          </button>
        </div>
      </form>
    </section>
  );
}
