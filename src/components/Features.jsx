import { useInView } from "./Hooks";
import s from "./Features.module.css";

const CAPABILITIES = [
  [
    "Your own domain",
    "Point links.yourbrand.com at Brevé and every link you make carries your name instead of ours. Verification takes one DNS record.",
  ],
  [
    "Links you can edit",
    "Change where a link points after you've sent it. The short link on the poster stays exactly as printed.",
  ],
  [
    "Expiry, limits and passphrases",
    "Close a link on a date, after a set number of opens, or behind a word only your reader knows.",
  ],
  [
    "Codes made for print",
    "Download vector QR codes at any size, in your colours, with your logo set into the centre.",
  ],
  [
    "Shared workspaces",
    "Folders, roles and one billing line for the whole team. Invite by email, remove in a click.",
  ],
];

export default function Features() {
  const [ref, inView] = useInView(0.1);

  return (
    <section className={s.section} id="features" ref={ref}>
      <div className={s.inner}>
        <header className={s.top}>
          <p className={s.eyebrow}>Capabilities</p>
          <h2 className={s.heading}>
            Built for links that carry <em>your name</em>.
          </h2>
        </header>

        <div className={s.list}>
          {CAPABILITIES.map(([title, detail], i) => (
            <article
              key={title}
              className={`${s.row} ${inView ? s.rowIn : ""}`}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <p className={s.index} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className={s.title}>{title}</h3>
              <p className={s.detail}>{detail}</p>
              <span className={s.chevron} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" />
                </svg>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
