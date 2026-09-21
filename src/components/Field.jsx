import { useId, useState } from "react";
import s from "./Field.module.css";

function EyeIcon({ off }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  );
}

/**
 * One labelled input. The label rides above the field once the field has
 * focus or content, which keeps the placeholder role and the label role
 * separate — a placeholder alone disappears the moment someone types.
 */
export default function Field({
  label,
  type = "text",
  error,
  hint,
  icon,
  value,
  onChange,
  ...rest
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`${s.field} ${error ? s.invalid : ""}`}>
      <div className={s.shell}>
        {icon && <span className={s.icon}>{icon}</span>}

        <input
          id={id}
          className={s.input}
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder=" "
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          data-has-icon={icon ? "" : undefined}
          {...rest}
        />

        <label className={s.label} htmlFor={id}>
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            className={s.reveal}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            <EyeIcon off={revealed} />
          </button>
        )}
      </div>

      {error ? (
        <p className={s.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={s.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
