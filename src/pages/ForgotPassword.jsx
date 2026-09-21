import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import { ApiError, api } from "../lib/api";
import { Banner, MailIcon } from "./AuthParts";
import s from "./Auth.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    const clean = email.trim();
    if (!EMAIL.test(clean)) {
      setError("That doesn't look like an email address.");
      return;
    }

    setError("");
    setStatus("sending");

    try {
      // The server replies the same way whether or not that email has an
      // account — so does this page, on purpose. See Auth.js forgotPassword.
      await api.forgotPassword({ email: clean });
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <AuthShell
      eyebrow="Reset your password"
      title={
        <>
          Forgot your <em>password</em>?
        </>
      }
      lede="Enter the email on your account and we'll send a link to choose a new one."
      aside={
        <p className={s.quote}>
          Fifteen minutes, one link in your inbox, and you're <em>back in</em>.
        </p>
      }
      alt={
        <>
          Remembered it after all? <Link to="/login">Sign in</Link>
        </>
      }
    >
      {status === "sent" ? (
        <Banner tone="good">
          If that email has an account, a reset link just landed in its inbox. It's good for
          fifteen minutes.
        </Banner>
      ) : (
        <form className={s.form} onSubmit={onSubmit} noValidate>
          <div className={s.fields}>
            <Field
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              icon={<MailIcon />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              disabled={status === "sending"}
            />
          </div>

          <button className={s.submit} type="submit" disabled={status === "sending"}>
            <span>
              {status === "sending" && <i className={s.spinner} aria-hidden="true" />}
              {status === "sending" ? "Sending" : "Send reset link"}
            </span>
          </button>
        </form>
      )}
    </AuthShell>
  );
}
