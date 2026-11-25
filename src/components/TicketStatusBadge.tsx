import { AlertTriangle, CheckCircle2, Clock, CircleDot } from "lucide-react";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | string;
type TicketUrgency = "NORMAL" | "URGENT" | string;

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; Icon: typeof CircleDot }
> = {
  OPEN: {
    label: "Offen",
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    Icon: CircleDot,
  },
  IN_PROGRESS: {
    label: "In Bearbeitung",
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
    Icon: Clock,
  },
  RESOLVED: {
    label: "Gelöst",
    className:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    Icon: CheckCircle2,
  },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    Icon: CircleDot,
  };
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {config.label}
    </span>
  );
}

export function TicketUrgencyBadge({ urgency }: { urgency: TicketUrgency }) {
  if (urgency !== "URGENT") {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      Dringend
    </span>
  );
}
