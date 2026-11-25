"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Trash2, ListChecks } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  createStatusOption,
  deleteStatusOption,
} from "@/actions/admin";

export interface CategoryItem {
  id: string;
  name: string;
}

export interface StatusOptionItem {
  id: string;
  key: string;
  label: string;
  color: string;
}

const COLOR_OPTIONS = [
  { value: "amber", label: "Bernstein (Gelb)" },
  { value: "blue", label: "Blau" },
  { value: "emerald", label: "Smaragd (Grün)" },
  { value: "red", label: "Rot" },
  { value: "purple", label: "Violett" },
  { value: "zinc", label: "Grau" },
];

export function AdminSettingsManager({
  categories,
  statusOptions,
}: {
  categories: CategoryItem[];
  statusOptions: StatusOptionItem[];
}) {
  const [categoryName, setCategoryName] = useState("");
  const [statusKey, setStatusKey] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [statusColor, setStatusColor] = useState("blue");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const res = await createCategory(trimmed);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCategoryName("");
    });
  }

  function handleDeleteCategory(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.success) setError(res.error);
    });
  }

  function handleCreateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!statusKey.trim() || !statusLabel.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createStatusOption({
        key: statusKey.trim(),
        label: statusLabel.trim(),
        color: statusColor,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setStatusKey("");
      setStatusLabel("");
      setStatusColor("blue");
    });
  }

  function handleDeleteStatus(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteStatusOption(id);
      if (!res.success) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted" />
            <h2 className="text-base font-semibold">Ticket-Kategorien</h2>
          </div>

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="z.B. iPad Passwort vergessen"
              disabled={isPending}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !categoryName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Hinzufügen
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="text-xs text-muted">
              Noch keine benutzerdefinierten Kategorien angelegt.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-background">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>{cat.name}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteCategory(cat.id)}
                    aria-label={`Kategorie ${cat.name} löschen`}
                    className="rounded p-1 text-muted hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted" />
            <h2 className="text-base font-semibold">Status-Optionen</h2>
          </div>

          <form onSubmit={handleCreateStatus} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={statusKey}
                onChange={(e) => setStatusKey(e.target.value)}
                placeholder="Schlüssel (z.B. WAITING)"
                disabled={isPending}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              />
              <input
                type="text"
                value={statusLabel}
                onChange={(e) => setStatusLabel(e.target.value)}
                placeholder="Anzeigename (z.B. Wartend)"
                disabled={isPending}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusColor}
                onChange={(e) => setStatusColor(e.target.value)}
                disabled={isPending}
                aria-label="Status-Farbe"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isPending || !statusKey.trim() || !statusLabel.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Hinzufügen
              </button>
            </div>
          </form>

          {statusOptions.length === 0 ? (
            <p className="text-xs text-muted">
              Standard-Status (Offen, In Bearbeitung, Erledigt) sind immer verfügbar.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-background">
              {statusOptions.map((opt) => (
                <li
                  key={opt.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">
                      {opt.key}
                    </span>
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteStatus(opt.id)}
                    aria-label={`Status ${opt.label} löschen`}
                    className="rounded p-1 text-muted hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
