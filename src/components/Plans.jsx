import { useState } from "react";
import { useInView } from "./Hooks";
import s from "./Plans.module.css";

// The only domain name in the whole frontend — everywhere a real link is
// shown, it's the server's own response (SHORT_DOMAIN-driven) doing the
// talking, not this. This is a marketing bullet with nothing to fetch it
// from, so it reads the same variable name the server uses instead of
// repeating a literal, with a sensible fallback for a build that skips it.
const SHORT_DOMAIN = import.meta.env.VITE_SHORT_DOMAIN || "bre.ve";

const PLANS = [
  {
    name: "Personal",
    monthly: 0,
    yearly: 0,
    note: "For the link you send once.",
    featured: false,
    action: "Start free",
    includes: ["Ten links a month", "Open counts and referrers", `${SHORT_DOMAIN} domain`, "QR download"],
  },
  {
    name: "Studio",
    monthly: 12,
    yearly: 10,
    note: "For one name, used everywhere.",
    featured: true,
    action: "Choose Studio",
    includes: [
      "Unlimited links",
      "One custom domain",
      "Full analytics with export",
      "Editable destinations",
      "Expiry and passphrases",
    ],
  },
  {
    name: "House",
    monthly: 49,
    yearly: 41,
    note: "For a team and its brands.",
    featured: false,
    action: "Choose House",
    includes: [
      "Ten custom domains",
      "Unlimited team seats",
      "API and bulk import",
      "Branded QR with your logo",
      "99.99% uptime agreement",
    ],
  },
];

function Tick() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export default function Plans() {
  const [ref, inView] = useInView(0.15);
  const [yearly, setYearly] = useState(false);

  return (
    <section className={s.section} id="plans" ref={ref}>
      <div className={s.inner}>
        <header className={s.top}>
          <p className={s.eyebrow}>Plans</p>
          <h2 className={s.heading}>
            Three ways to <em>pay for it</em>.
          </h2>
          <p className={s.body}>
            Monthly, cancel whenever. Every plan keeps your existing links alive.
          </p>

          <div className={s.switch} role="group" aria-label="Billing period">
            <span className={s.thumb} data-yearly={yearly || undefined} aria-hidden="true" />
            <button
              className={`${s.option} ${!yearly ? s.optionOn : ""}`}
              onClick={() => setYearly(false)}
              aria-pressed={!yearly}
            >
              Monthly
            </button>
            <button
              className={`${s.option} ${yearly ? s.optionOn : ""}`}
              onClick={() => setYearly(true)}
              aria-pressed={yearly}
            >
              Yearly
              <em>2 months free</em>
            </button>
          </div>
        </header>

        <div className={s.grid}>
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearly : plan.monthly;

            return (
              <article
                key={plan.name}
                className={`${s.plan} ${plan.featured ? s.featured : ""} ${inView ? s.planIn : ""}`}
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                {plan.featured && <span className={s.ribbon}>Most chosen</span>}

                <h3 className={s.name}>{plan.name}</h3>
                <p className={s.note}>{plan.note}</p>

                <p className={s.price} key={`${plan.name}-${price}`}>
                  {price === 0 ? "Free" : `$${price}`}
                  {price > 0 && <small>/month</small>}
                </p>
                <p className={s.billed}>
                  {price === 0
                    ? "No card, no expiry"
                    : yearly
                      ? `Billed $${price * 12} once a year`
                      : "Billed every month"}
                </p>

                <ul className={s.includes}>
                  {plan.includes.map((item) => (
                    <li key={item}>
                      <i>
                        <Tick />
                      </i>
                      {item}
                    </li>
                  ))}
                </ul>

                <button className={s.action}>
                  <span>{plan.action}</span>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
