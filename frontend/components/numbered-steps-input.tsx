"use client";

import { useEffect, useRef, useState } from "react";

function stripNumberPrefix(line: string) {
  return line.replace(/^\s*\d+[.)]\s*/, "");
}

export function parseSteps(value: string): string[] {
  if (!value || !value.trim()) return [""];
  const lines = value.split(/\r?\n/).map(stripNumberPrefix);
  return lines.length > 0 ? lines : [""];
}

/** Keep empty rows while editing so Enter / Add step work. */
export function formatSteps(lines: string[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1 && lines[0].trim() === "") return "";
  return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

/** Trim trailing blanks only when persisting to Airtable. */
export function formatStepsForSave(value: string): string {
  const lines = parseSteps(value).map((line) => line.trimEnd());
  while (lines.length > 1 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length === 1 && lines[0].trim() === "") return "";
  return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join("\n");
}

export function NumberedStepsInput({
  value,
  onChange,
  placeholder = "Start typing the first step…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [lines, setLines] = useState(() => parseSteps(value));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocus = useRef<number | null>(null);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setLines(parseSteps(value));
  }, [value]);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    const el = inputRefs.current[index];
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [lines]);

  function emit(next: string[]) {
    const normalized = next.length === 0 ? [""] : next;
    setLines(normalized);
    const formatted = formatSteps(normalized);
    lastEmitted.current = formatted;
    onChange(formatted);
  }

  function updateLine(index: number, text: string) {
    const next = [...lines];
    next[index] = text;
    emit(next);
  }

  function addLineAfter(index: number) {
    const next = [...lines];
    next.splice(index + 1, 0, "");
    pendingFocus.current = index + 1;
    emit(next);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      pendingFocus.current = 0;
      emit([""]);
      return;
    }
    const next = lines.filter((_, i) => i !== index);
    pendingFocus.current = Math.max(0, index - 1);
    emit(next);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      addLineAfter(index);
      return;
    }

    if (event.key === "Backspace" && lines[index] === "" && lines.length > 1) {
      event.preventDefault();
      event.stopPropagation();
      removeLine(index);
      return;
    }

    if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowDown" && index < lines.length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    event: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\n")) return;

    event.preventDefault();
    const pasted = text.split(/\r?\n/).map(stripNumberPrefix);
    if (pasted.length === 0) return;

    const next = [...lines];
    next[index] = `${next[index]}${pasted[0] ?? ""}`;
    next.splice(index + 1, 0, ...pasted.slice(1));
    pendingFocus.current = index + pasted.length - 1;
    emit(next);
  }

  return (
    <div
      className="numbered-steps"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {lines.map((line, index) => (
        <div key={`step-${index}`} className="numbered-step-row">
          <span className="numbered-step-index" aria-hidden>
            {index + 1}.
          </span>
          <input
            type="text"
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={line}
            onChange={(e) => updateLine(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            placeholder={index === 0 ? placeholder : "Next step…"}
            aria-label={`Step ${index + 1}`}
          />
        </div>
      ))}
      <div className="numbered-steps-footer">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addLineAfter(lines.length - 1);
          }}
        >
          + Add step
        </button>
        <span className="field-hint">Press Enter for the next number</span>
      </div>
    </div>
  );
}
