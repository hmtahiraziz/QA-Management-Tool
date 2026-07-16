"use client";

import type { ReactNode } from "react";

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search records…",
  count,
  countLabel = "records",
  actions,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  count: number;
  countLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <label className="search-field">
          <span className="search-icon" aria-hidden>
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
          />
        </label>
        <span className="toolbar-count">
          {count} {countLabel}
        </span>
      </div>
      <div className="toolbar-actions">{actions}</div>
    </div>
  );
}

export function DetailDrawer({
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <p className="drawer-kicker">Record details</p>
            <h2>{title}</h2>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-footer">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function DetailGrid({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="detail-grid">
      {rows.map((row) => (
        <div key={row.label} className="detail-row">
          <dt>{row.label}</dt>
          <dd>{row.value || <span className="muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IdChip({ label }: { label: string }) {
  return <span className="chip">{label}</span>;
}

export function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="muted">—</span>;
  return (
    <div className="chip-row">
      {items.map((item) => (
        <IdChip key={item} label={item} />
      ))}
    </div>
  );
}

export function QuickAddMenu({
  onSelect,
  showMembers = true,
}: {
  onSelect: (type: "project" | "test-case" | "bug" | "member") => void;
  showMembers?: boolean;
}) {
  return (
    <div className="quick-add">
      <span className="quick-add-label">Quick add</span>
      <div className="quick-add-buttons">
        <button type="button" className="btn btn-primary" onClick={() => onSelect("project")}>
          + Project
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onSelect("test-case")}>
          + Test case
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onSelect("bug")}>
          + Bug
        </button>
        {showMembers ? (
          <button type="button" className="btn btn-ghost" onClick={() => onSelect("member")}>
            + Invite member
          </button>
        ) : null}
      </div>
    </div>
  );
}
