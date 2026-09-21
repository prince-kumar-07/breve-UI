import { Link } from "react-router-dom";
import s from "./AuthShell.module.css";

const PROOF = [
  ["4.2M", "links folded"],
  ["180ms", "median redirect"],
  ["99.99%", "uptime"],
];

/**
 * The frame both auth routes sit in: a brand column that carries the
 * atmosphere, and a form column that stays quiet enough to fill in.
 */
export default function AuthShell({ eyebrow, title, lede, children, aside, alt }) {
  return (
    <div className={s.wrap}>
      {/* ------------------------- brand side ------------------------- */}
      <aside className={s.brand}>
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

        <div className={s.brandBody}>{aside}</div>

        <ul className={s.proof}>
          {PROOF.map(([figure, label]) => (
            <li key={label}>
              <b>{figure}</b>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* -------------------------- form side -------------------------- */}
      <main className={s.panel} id="main">
        <Link className={s.back} to="/">
          Back to site
        </Link>

        <div className={s.card}>
          <Link className={s.cardMark} to="/" aria-label="Brevé, home">
            <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true">
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
          </Link>

          <p className={s.eyebrow}>{eyebrow}</p>
          <h1 className={s.title}>{title}</h1>
          <p className={s.lede}>{lede}</p>

          {children}
        </div>

        <p className={s.alt}>{alt}</p>
      </main>
    </div>
  );
}
