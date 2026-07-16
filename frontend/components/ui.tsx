import type { ReactNode } from "react";

const priorityClass: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
};

const statusClass: Record<string, string> = {
  Open: "badge-open",
  "In Progress": "badge-progress",
  Resolved: "badge-resolved",
  Closed: "badge-closed",
};

export function PriorityBadge({ value }: { value: string }) {
  return <span className={`badge ${priorityClass[value] || "badge-neutral"}`}>{value}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${statusClass[value] || "badge-neutral"}`}>{value}</span>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="loading-block">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-banner">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  /** When set, uses a real label-for association instead of wrapping controls. */
  htmlFor?: string;
}) {
  if (htmlFor) {
    return (
      <div className="field">
        <label htmlFor={htmlFor}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div className="field">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
