import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Banner, Check, LockIcon, MailIcon, SocialRow } from "./AuthParts";
import s from "./Auth.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter the email you signed up with.";
  else if (!EMAIL.test(email.trim())) errors.email = "That doesn't look like an email address.";

  if (!password) errors.password = "Enter your password.";
  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Set by ProtectedRoute when an unauthenticated visit to, say, /dashboard
  // bounced here — landing them back where they meant to go beats dropping
  // everyone on the dashboard regardless of why they signed in. With no
  // redirect in play (someone just clicked "Sign in" from the nav), the
  // dashboard is still the more useful default than the marketing page.
  const destination = location.state?.from || "/dashboard";

  const [values, setValues] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const set = (key) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setServerError("");
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");

    try {
      await login({ email: values.email.trim(), password: values.password, remember });
      setStatus("sent");
      setTimeout(() => navigate(destination, { replace: true }), 700);
    } catch (err) {
      setStatus("idle");
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }

  const busy = status === "sending";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Pick up where your <em>links</em> left off.
        </>
      }
      lede="Sign in to see what opened while you were away."
      aside={
        <>
          <p className={s.quote}>
            We moved every campaign onto Brevé in an afternoon, and finally saw{" "}
            <em>which poster actually worked</em>.
          </p>
          <div className={s.cite}>
            <span className={s.avatar}>N</span>
            <div>
              <b>Nadia Okonjo</b>
              <span>Head of Brand, Nordwell</span>
            </div>
          </div>
        </>
      }
      alt={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <SocialRow verb="Sign in with" />

        <p className={s.divider}>or</p>

        <div className={s.fields}>
          <Field
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            icon={<MailIcon />}
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            disabled={busy}
          />

          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            icon={<LockIcon />}
            value={values.password}
            onChange={set("password")}
            error={errors.password}
            disabled={busy}
          />
        </div>

        <div className={s.options}>
          <Check checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Keep me signed in
          </Check>
          <Link className={s.forgot} to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {status === "sent" && <Banner tone="good">Signed in. Taking you through…</Banner>}
        {serverError && <Banner>{serverError}</Banner>}

        <button className={s.submit} type="submit" disabled={busy || status === "sent"}>
          <span>
            {busy && <i className={s.spinner} aria-hidden="true" />}
            {busy ? "Signing in" : "Sign in"}
          </span>
        </button>

        <p className={s.fine}>
          Protected by rate limiting and device checks. <Link to="/">Read the policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
