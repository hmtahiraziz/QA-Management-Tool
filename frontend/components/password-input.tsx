"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function PasswordInput({
  label = "Password",
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={className}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
