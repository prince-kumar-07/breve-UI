import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Banner, Check, LockIcon, MailIcon, SocialRow, UserIcon } from "./AuthParts";
import { TIERS, scorePassword } from "./passwordStrength";
import s from "./Auth.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ name, email, password }, agreed, score) {
  const errors = {};
  if (!name.trim()) errors.name = "Tell us what to call you.";
  else if (name.trim().length < 2) errors.name = "That name looks a little short.";

  if (!email.trim()) errors.email = "We need an email to reach you on.";
  else if (!EMAIL.test(email.trim())) errors.email = "That doesn't look like an email address.";

  if (!password) errors.password = "Choose a password.";
  else if (password.length < 8) errors.password = "Use at least eight characters.";
  else if (score < 2) errors.password = "Mix in a capital, a number or a symbol.";

  if (!agreed) errors.agreed = "Please accept the terms to continue.";
  return errors;
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const score = useMemo(() => scorePassword(values.password), [values.password]);
  const tier = TIERS[score];

  const set = (key) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setServerError("");
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    const found = validate(values, agreed, score);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerError("");

    try {
      await signup({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      setStatus("sent");
      setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    } catch (err) {
      setStatus("idle");
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }

  const busy = status === "sending";

  return (
    <AuthShell
      eyebrow="Create an account"
      title={
        <>
          Ten links free, <em>no card</em>.
        </>
      }
      lede="Make your first short link in under a minute, then watch where it travels."
      aside={
        <>
          <p className={s.quote}>
            One DNS record and every link we print carries <em>our own name</em> instead
            of someone else's.
          </p>
          <div className={s.cite}>
            <span className={s.avatar}>T</span>
            <div>
              <b>Theo Marchetti</b>
              <span>Founder, Maison Clé</span>
            </div>
          </div>
        </>
      }
      alt={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <SocialRow verb="Sign up with" />

        <p className={s.divider}>or</p>

        <div className={s.fields}>
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            icon={<UserIcon />}
            value={values.name}
            onChange={set("name")}
            error={errors.name}
            disabled={busy}
          />

          <Field
            label="Work email"
            type="email"
            name="email"
            autoComplete="email"
            icon={<MailIcon />}
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            disabled={busy}
          />

          <div>
            <Field
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              icon={<LockIcon />}
              value={values.password}
              onChange={set("password")}
              error={errors.password}
              disabled={busy}
            />

            {values.password && !errors.password && (
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

        <div className={s.options}>
          <Check
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              setErrors((prev) => (prev.agreed ? { ...prev, agreed: undefined } : prev));
            }}
          >
            I agree to the <Link to="/">Terms</Link> and <Link to="/">Privacy Policy</Link>
          </Check>
        </div>

        {errors.agreed && <Banner>{errors.agreed}</Banner>}
        {serverError && <Banner>{serverError}</Banner>}
        {status === "sent" && <Banner tone="good">Account created. Setting things up…</Banner>}

        <button className={s.submit} type="submit" disabled={busy || status === "sent"}>
          <span>
            {busy && <i className={s.spinner} aria-hidden="true" />}
            {busy ? "Creating account" : "Create account"}
          </span>
        </button>

        <p className={s.fine}>No card needed. Your first ten links stay free for good.</p>
      </form>
    </AuthShell>
  );
}
