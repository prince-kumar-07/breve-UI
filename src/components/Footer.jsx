import { useInView, useMagnetic, useParallax } from "./Hooks";
import s from "./Footer.module.css";

const COLUMNS = [
  ["Product", ["Analytics", "Custom domains", "QR studio", "Workspaces", "Changelog"]],
  ["Developers", ["API reference", "Webhooks", "Bulk import", "Status"]],
  ["Company", ["About", "Writing", "Careers", "Press kit"]],
];

export default function Footer() {
  const [ref, inView] = useInView(0.3);
  const glowRef = useParallax(0.2);
  const buttonRef = useMagnetic(0.2);

  return (
    <footer>
      <div className={s.closing} ref={ref}>
        <div className={s.glow} ref={glowRef} aria-hidden="true" />
        <div className={s.inner}>
          <p className={`${s.eyebrow} ${inView ? s.eyebrowIn : ""}`}>Begin</p>

          <h2 className={`${s.heading} ${inView ? s.headingIn : ""}`}>
            Start with one link and see how it <em>lands</em>.
          </h2>

          <a className={`${s.button} ${inView ? s.buttonIn : ""}`} href="#start" ref={buttonRef}>
            <span>Get your short link</span>
          </a>

          <p className={`${s.reassure} ${inView ? s.reassureIn : ""}`}>
            No card. Ten links free, forever.
          </p>
        </div>
      </div>

      <div className={s.base}>
        <div className={s.baseInner}>
          <div className={s.brand}>
            <div className={s.mark}>
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
              <span>Brevé</span>
            </div>
            <p>Short links, kept measurable.</p>
            <p className={s.status}>
              <i aria-hidden="true" />
              All systems operational
            </p>
          </div>

          {COLUMNS.map(([title, items]) => (
            <nav className={s.column} key={title}>
              <h3>{title}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}>{item}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={s.rule} aria-hidden="true" />

        <div className={s.fine}>
          <span>© {new Date().getFullYear()} Brevé. All rights reserved.</span>
          <nav className={s.legal}>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#cookies">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
