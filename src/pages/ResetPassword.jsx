import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Banner, LockIcon } from "./AuthParts";
import { TIERS, scorePassword } from "./passwordStrength";
import s from "./Auth.module.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done

  const score = useMemo(() => scorePassword(password), [password]);
  const tier = TIERS[score];

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    if (password.length < 8) {
      setError("Use at least eight characters.");
      return;
    }

    setError("");
    setStatus("sending");

    try {
      // Resetting also signs the browser in — the server issues a fresh
      // session cookie in the same response, so applying its user here
      // means no separate login step after this.
      const data = await api.resetPassword(token, { password });
      applySession(data.user);
      setStatus("done");
      setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }

  const busy = status === "sending";

  return (
    <AuthShell
      eyebrow="Choose a new password"
      title={
        <>
          One new password, and you're <em>through</em>.
        </>
      }
      lede="This link is only good once, and only for fifteen minutes from when it was sent."
      aside={
        <p className={s.quote}>
          A reset link that never expires isn't a safety net — it's a second front door.
        </p>
      }
      alt={
        <>
          Didn't request this? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {status === "done" ? (
        <Banner tone="good">Password changed. Taking you through…</Banner>
      ) : (
        <form className={s.form} onSubmit={onSubmit} noValidate>
          <div className={s.fields}>
            <div>
              <Field
                label="New password"
                type="password"
                name="password"
                autoComplete="new-password"
                icon={<LockIcon />}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                error={error}
                disabled={busy}
              />

              {password && !error && (
                <div className={s.meter} style={{ "--tone": tier.tone }}>
                  <div className={s.track} aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} data-on={i < score ? "" : undefined} />
                    ))}
                  </div>
                  <p className={s.meterLabel}>
                    <span>Password strength</span>
                    <b>{tier.label}</b>
                  </p>
                </div>
              )}
            </div>
          </div>

          <button className={s.submit} type="submit" disabled={busy}>
            <span>
              {busy && <i className={s.spinner} aria-hidden="true" />}
              {busy ? "Saving" : "Save new password"}
            </span>
          </button>

          <p className={s.fine}>
            If this link has expired, request a fresh one from{" "}
            <Link to="/forgot-password">the reset page</Link>.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
