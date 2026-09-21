import s from "./StatsChart.module.css";

const DAY_LABEL = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

/** Renders the real shape GET /api/v1/links/:code/stats returns — a 14-day
 *  daily series and a source breakdown — with no mock data standing in. */
export default function StatsChart({ totalClicks, last14Days, sources }) {
  const max = Math.max(1, ...last14Days.map((d) => d.count));

  return (
    <div className={s.panel}>
      <p className={s.headLabel}>Opens, last fourteen days</p>
      <strong className={s.total}>{totalClicks.toLocaleString()}</strong>

      {totalClicks === 0 ? (
        <p className={s.empty}>No opens yet — once someone follows this link, they'll show up here.</p>
      ) : (
        <>
          <div className={s.bars}>
            {last14Days.map((d) => (
              <div className={s.slot} key={d.date}>
                <span className={s.tip} aria-hidden="true">
                  <b>{d.count.toLocaleString()}</b>
                  {DAY_LABEL.format(new Date(`${d.date}T00:00:00`))}
                </span>
                <div className={s.bar} style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} />
              </div>
            ))}
          </div>

          <div className={s.axis}>
            <span>{DAY_LABEL.format(new Date(`${last14Days[0].date}T00:00:00`))}</span>
            <span>{DAY_LABEL.format(new Date(`${last14Days[last14Days.length - 1].date}T00:00:00`))}</span>
          </div>

          {sources.length > 0 && (
            <div className={s.sources}>
              {sources.map((src) => (
                <div className={s.source} key={src.name}>
                  <b>{src.name}</b>
                  <i>{Math.round(src.share * 100)}%</i>
                  <span className={s.sourceBar} style={{ "--w": src.share }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
