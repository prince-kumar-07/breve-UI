import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useMagnetic, useScrollProgress, useScrolled } from "./Hooks";
import s from "./Nav.module.css";

/* Section links carry the leading slash so they also work from /login and
   /signup — the router lands on the landing page, ScrollManager does the rest. */
const SECTION_LINKS = [
  ["Analytics", "/#analytics"],
  ["Features", "/#features"],
  ["Plans", "/#plans"],
];

export default function Nav() {
  const lifted = useScrolled(28);
  const railRef = useScrollProgress();
  const ctaRef = useMagnetic(0.12);
  const navigate = useNavigate();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);

  /* An open sheet owns the viewport — the page behind it must not scroll. */
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  // Signed in: the account entry becomes a name + log-out, and the CTA
  // points at the dashboard instead of the signup page. Neither shows
  // until the first /me round trip resolves, to avoid a signed-out flash
  // for someone who's actually signed in.
  const signedIn = ready && Boolean(user);
  const firstName = user?.name?.split(" ")[0];
  const ctaTarget = signedIn ? "/dashboard" : "/signup";
  const ctaLabel = signedIn ? "Dashboard" : "Get a short link";

  return (
    <header className={`${s.bar} ${lifted ? s.lifted : ""}`}>
      <div className={s.inner}>
        <Link className={s.mark} to="/" aria-label="Brevé, home">
          <svg width="20" height="20" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M9 16.6 L17 9.4" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M9.6 9.4 h3.9 a3.2 3.2 0 0 1 0 6.4"
              fill="none"
              stroke="var(--pearl)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
          <span className={s.word}>Brevé</span>
        </Link>

        <nav className={s.links}>
          {SECTION_LINKS.map(([label, to]) => (
            <Link key={to} className={s.link} to={to}>
              {label}
            </Link>
          ))}

          {signedIn ? (
            <>
              <span className={s.hello}>{firstName}</span>
              <button type="button" className={s.link} onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link className={s.link} to="/login">
              Sign in
            </Link>
          )}

          <Link className={s.cta} to={ctaTarget} ref={ctaRef}>
            {ctaLabel}
          </Link>
        </nav>

        <button
          className={`${s.toggle} ${open ? s.toggleOpen : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="nav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span />
          <span />
        </button>
      </div>

      {/* read position, drawn on the bar's own bottom edge */}
      <div className={s.rail} ref={railRef} aria-hidden="true">
        <i />
      </div>

      <div id="nav-panel" className={`${s.panel} ${open ? s.panelOpen : ""}`}>
        <div className={s.panelInner}>
          {SECTION_LINKS.map(([label, to], i) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} style={{ "--i": i }}>
              {label}
            </Link>
          ))}

          {signedIn ? (
            <button type="button" onClick={handleLogout} style={{ "--i": SECTION_LINKS.length }}>
              Log out ({firstName})
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} style={{ "--i": SECTION_LINKS.length }}>
              Sign in
            </Link>
          )}

          <Link to={ctaTarget} onClick={() => setOpen(false)} style={{ "--i": SECTION_LINKS.length + 1 }}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
