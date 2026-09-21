import { useCountUp, useInView, useParallax } from "./Hooks";
import s from "./Analytics.module.css";

/* height % of the tallest day, the day's label, and its raw count */
const DAYS = [
  [34, "29 Aug", 412],
  [51, "30 Aug", 618],
  [40, "31 Aug", 485],
  [63, "1 Sep", 763],
  [57, "2 Sep", 691],
  [78, "3 Sep", 945],
  [70, "4 Sep", 848],
  [45, "5 Sep", 545],
  [87, "6 Sep", 1054],
  [73, "7 Sep", 884],
  [92, "8 Sep", 1115],
  [80, "9 Sep", 969],
  [96, "10 Sep", 1163],
  [85, "11 Sep", 1030],
];

const SOURCES = [
  ["Instagram bio", "41%", 0.41],
  ["Newsletter", "27%", 0.27],
  ["Printed QR", "18%", 0.18],
  ["Direct", "14%", 0.14],
];

export default function Analytics() {
  const [ref, inView] = useInView(0.22);
  const panelRef = useParallax(0.08);
  const opens = useCountUp(12480, inView);

  return (
    <section className={s.section} id="analytics" ref={ref}>
      <div className={s.inner}>
        <figure className={`${s.panel} ${inView ? s.panelIn : ""}`} ref={panelRef}>
          <figcaption className={s.head}>
            <div>
              <p className={s.headLabel}>
                <i className={s.live} aria-hidden="true" />
                Opens, last fourteen days
              </p>
              <strong>{opens}</strong>
            </div>
            <span className={s.delta}>↑ 18.4%</span>
          </figcaption>

          <div className={s.plot}>
            <div className={s.bars}>
              {DAYS.map(([height, day, count], i) => (
                <div className={s.slot} key={day}>
                  <span className={s.tip} aria-hidden="true">
                    <b>{count.toLocaleString()}</b>
                    {day}
                  </span>
                  <div
                    className={s.bar}
                    style={{ height: `${height}%`, transitionDelay: `${i * 30}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={s.axis}>
            <span>29 Aug</span>
            <span>5 Sep</span>
            <span>11 Sep</span>
          </div>

          <div className={s.sources}>
            {SOURCES.map(([name, share, width], i) => (
              <div className={s.source} key={name}>
                <b>{name}</b>
                <i>{share}</i>
                <span
                  className={s.sourceBar}
                  style={{ "--w": width, transitionDelay: `${300 + i * 70}ms` }}
                />
              </div>
            ))}
          </div>
        </figure>

        <div className={`${s.copy} ${inView ? s.copyIn : ""}`}>
          <p className={s.eyebrow}>Analytics</p>
          <h2 className={s.heading}>
            Watch the link <em>work</em>.
          </h2>
          <p className={s.body}>
            Every open is recorded the second it happens, with country, referrer,
            device and campaign tag attached. Sort by any of them, hold two links
            side by side, or export the raw rows and take them elsewhere.
          </p>
          <p className={s.body}>
            Nothing is sampled and nothing is rounded. What you read is the whole
            record.
          </p>

          <ul className={s.assurances}>
            <li>Raw rows, never sampled</li>
            <li>CSV and API export</li>
            <li>No cookies on your readers</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
