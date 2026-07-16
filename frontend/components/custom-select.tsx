"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SingleProps = {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

type MultiProps = {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

type CustomSelectProps = SingleProps | MultiProps;

type MenuStyle = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function isMulti(props: CustomSelectProps): props is MultiProps {
  return props.multiple === true;
}

export function CustomSelect(props: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<MenuStyle | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const multi = isMulti(props);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return;
    }

    function place() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(220, openUp ? spaceAbove : spaceBelow);
      setMenuStyle({
        top: openUp ? rect.top - maxHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        (target instanceof Element && target.closest(`#${CSS.escape(listId)}`))
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, listId]);

  const selectedLabels = multi
    ? props.options
        .filter((option) => props.value.includes(option.value))
        .map((option) => option.label)
    : props.options.find((option) => option.value === props.value)?.label;

  const display = multi
    ? (selectedLabels as string[]).length > 0
      ? (selectedLabels as string[]).join(", ")
      : props.placeholder || "Select…"
    : (selectedLabels as string | undefined) || props.placeholder || "Select…";

  const hasValue = multi
    ? props.value.length > 0
    : props.options.some((option) => option.value === props.value);

  function toggleOption(optionValue: string) {
    if (multi) {
      const next = props.value.includes(optionValue)
        ? props.value.filter((v) => v !== optionValue)
        : [...props.value, optionValue];
      props.onChange(next);
      return;
    }
    props.onChange(optionValue);
    setOpen(false);
  }

  function isSelected(optionValue: string) {
    return multi ? props.value.includes(optionValue) : props.value === optionValue;
  }

  return (
    <div
      className={`custom-select ${open ? "is-open" : ""} ${props.className || ""}`}
      ref={rootRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`custom-select-trigger ${hasValue ? "has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={props["aria-label"]}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="custom-select-value">{display}</span>
        <span className="custom-select-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && menuStyle ? (
        <ul
          id={listId}
          className="custom-select-menu"
          role="listbox"
          aria-multiselectable={multi || undefined}
          style={{
            position: "fixed",
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            maxHeight: menuStyle.maxHeight,
          }}
        >
          {props.options.length === 0 ? (
            <li className="custom-select-empty">No options</li>
          ) : (
            props.options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <li key={option.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`custom-select-option ${selected ? "is-selected" : ""}`}
                    onClick={() => toggleOption(option.value)}
                  >
                    {multi ? (
                      <span className={`custom-select-check ${selected ? "on" : ""}`} />
                    ) : null}
                    <span>{option.label}</span>
                    {!multi && selected ? (
                      <span className="custom-select-tick" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {multi && props.value.length > 0 ? (
        <div className="custom-select-chips">
          {props.options
            .filter((option) => props.value.includes(option.value))
            .map((option) => (
              <button
                key={option.value}
                type="button"
                className="custom-select-chip"
                onClick={() => toggleOption(option.value)}
                title={`Remove ${option.label}`}
              >
                {option.label}
                <span aria-hidden>×</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
