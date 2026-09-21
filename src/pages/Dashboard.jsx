import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import SectionTabs from "../components/SectionTabs";
import Field from "../components/Field";
import { ApiError, api } from "../lib/api";
import { normaliseUrl } from "../lib/normaliseUrl";
import s from "./Dashboard.module.css";

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d="M10 13.6a4.5 4.5 0 0 0 6.6.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
    <path d="M14 10.4a4.5 4.5 0 0 0-6.6-.4l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
  </svg>
);

function StatusPill({ link }) {
  const expired = link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
  if (expired) return <span className={`${s.pill} ${s.pillExpired}`}>Expired</span>;
  if (!link.active) return <span className={`${s.pill} ${s.pillOff}`}>Paused</span>;
  if (link.hasPassphrase) return <span className={`${s.pill} ${s.pillLocked}`}>Locked</span>;
  return <span className={`${s.pill} ${s.pillOn}`}>Active</span>;
}

function LinkRow({ link, index, fresh, onToggle, onDelete, copiedCode, onCopy, confirmingCode }) {
  const confirming = confirmingCode === link.code;

  return (
    <li
      className={`${s.row} ${fresh ? s.rowFresh : ""}`}
      style={{ "--i": index }}
    >
      <div className={s.rowMain}>
        {/* link.url is the server's own fully-qualified address — scheme
            included, correct for whatever SHORT_URL_SCHEME actually is.
            Reconstructing it here with an assumed "https://" is exactly
            what broke this on a local, TLS-less server. */}
        <a className={s.rowShort} href={link.url} target="_blank" rel="noreferrer">
          {link.shortUrl}
        </a>
        <p className={s.rowLong} title={link.longUrl}>
          {link.longUrl}
        </p>
      </div>

      <StatusPill link={link} />

      <span className={s.rowClicks}>
        {link.clicksCount.toLocaleString()} <small>{link.clicksCount === 1 ? "open" : "opens"}</small>
      </span>

      <div className={s.rowActions}>
        <button className={s.rowBtn} onClick={() => onCopy(link)}>
          {copiedCode === link.code ? "Copied" : "Copy"}
        </button>
        <Link className={s.rowBtn} to={`/dashboard/${link.code}`}>
          Stats
        </Link>
        <button className={s.rowBtn} onClick={() => onToggle(link)}>
          {link.active ? "Pause" : "Resume"}
        </button>
        <button
          className={`${s.rowBtn} ${s.rowBtnDanger} ${confirming ? s.rowBtnConfirming : ""}`}
          onClick={() => onDelete(link)}
        >
          {confirming ? "Sure?" : "Delete"}
        </button>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className={s.skeletonRow} aria-hidden="true">
      <div className={s.skeletonMain}>
        <span className={s.skeletonBar} style={{ width: "38%" }} />
        <span className={s.skeletonBar} style={{ width: "62%" }} />
      </div>
      <span className={s.skeletonPill} />
      <span className={s.skeletonBar} style={{ width: "44px" }} />
      <span className={s.skeletonBar} style={{ width: "70%", justifySelf: "end" }} />
    </li>
  );
}

export default function Dashboard() {
  const [links, setLinks] = useState(null); // null = loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [freshCode, setFreshCode] = useState("");
  const [confirmingCode, setConfirmingCode] = useState("");
  const timers = useRef([]);

  const [longUrl, setLongUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = useCallback(async (targetPage) => {
    try {
      const data = await api.listLinks({ page: targetPage, limit: 20 });
      setLinks((prev) => (targetPage === 1 ? data.links : [...(prev || []), ...data.links]));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load your links.");
      setLinks((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  async function onCreate(e) {
    e.preventDefault();
    if (creating) return;

    const clean = normaliseUrl(longUrl);
    if (!clean) {
      setFormError("That isn't a web address yet. Try one that starts with https://");
      return;
    }
    if (passphrase && passphrase.length < 4) {
      setFormError("A passphrase needs at least four characters.");
      return;
    }

    setFormError("");
    setCreating(true);

    try {
      const payload = { longUrl: clean };
      if (expiresAt) payload.expiresAt = new Date(`${expiresAt}T23:59:59`).toISOString();
      if (passphrase) payload.passphrase = passphrase;

      const { link } = await api.createLink(payload);
      setLinks((prev) => [link, ...(prev || [])]);
      setTotal((t) => t + 1);
      setLongUrl("");
      setExpiresAt("");
      setPassphrase("");
      setAdvanced(false);

      // A brief highlight on the row that just landed — the list changing
      // isn't always enough of a signal that the click actually worked.
      setFreshCode(link.code);
      timers.current.push(setTimeout(() => setFreshCode(""), 1800));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(link) {
    const next = { ...link, active: !link.active };
    setLinks((prev) => prev.map((l) => (l.code === link.code ? next : l)));
    try {
      await api.updateLink(link.code, { active: next.active });
    } catch {
      // The row already reflects the attempt; a background refresh corrects
      // it if the write actually failed, without blocking the click on a
      // round trip first.
      load(1);
    }
  }

  // Two-step, in-place — a click on "Delete" arms it ("Sure?"), a second
  // click within three seconds actually deletes, and anything else lets it
  // quietly disarm. Fewer surprises than a native confirm() dialog, and it
  // never blocks the rest of the page the way that would.
  function onDelete(link) {
    if (confirmingCode !== link.code) {
      setConfirmingCode(link.code);
      timers.current.push(setTimeout(() => setConfirmingCode((c) => (c === link.code ? "" : c)), 3000));
      return;
    }

    setConfirmingCode("");
    setLinks((prev) => prev.filter((l) => l.code !== link.code));
    setTotal((t) => Math.max(0, t - 1));
    api.deleteLink(link.code).catch(() => load(1));
  }

  async function onCopy(link) {
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
    setCopiedCode(link.code);
    timers.current.push(setTimeout(() => setCopiedCode(""), 1800));
  }

  return (
    <>
      <Nav />
      <main className={s.page} id="main">
        <div className={s.shell}>
          <header className={s.top}>
            <p className={s.eyebrow}>Dashboard</p>
            <div className={s.headingRow}>
              <h1 className={s.heading}>Your links.</h1>
              {total > 0 && (
                <span className={s.count}>
                  {total.toLocaleString()} {total === 1 ? "link" : "links"}
                </span>
              )}
            </div>
          </header>

          <SectionTabs />

          <form className={s.form} onSubmit={onCreate}>
            <div className={s.formRow}>
              <div className={s.formField}>
                <Field
                  label="Paste a long link"
                  icon={<LinkIcon />}
                  value={longUrl}
                  onChange={(e) => {
                    setLongUrl(e.target.value);
                    setFormError("");
                  }}
                  disabled={creating}
                  inputMode="url"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button className={s.create} type="submit" disabled={creating}>
                {creating ? "Creating" : "Create link"}
              </button>
            </div>

            <button
              type="button"
              className={s.advancedToggle}
              onClick={() => setAdvanced((v) => !v)}
              aria-expanded={advanced}
            >
              {advanced ? "Hide options" : "Expiry & passphrase"}
            </button>

            {advanced && (
              <div className={s.advancedRow}>
                <div className={s.formField}>
                  <label className={s.plainLabel} htmlFor="expiresAt">
                    Expires on
                  </label>
                  <input
                    id="expiresAt"
                    type="date"
                    className={s.dateInput}
                    value={expiresAt}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className={s.formField}>
                  <Field
                    label="Passphrase (optional)"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={creating}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {formError && (
              <p className={s.formError} role="alert">
                {formError}
              </p>
            )}
          </form>

          {links === null ? (
            <ul className={s.list} aria-hidden="true">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </ul>
          ) : loadError ? (
            <p className={s.empty}>{loadError}</p>
          ) : links.length === 0 ? (
            <div className={s.empty}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true" className={s.emptyIcon}>
                <path d="M10 13.6a4.5 4.5 0 0 0 6.6.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
                <path d="M14 10.4a4.5 4.5 0 0 0-6.6-.4l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
              </svg>
              <p>Nothing folded yet — paste a link above to make your first one.</p>
            </div>
          ) : (
            <>
              <ul className={s.list}>
                {links.map((link, i) => (
                  <LinkRow
                    key={link.code}
                    link={link}
                    index={i}
                    fresh={freshCode === link.code}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    copiedCode={copiedCode}
                    onCopy={onCopy}
                    confirmingCode={confirmingCode}
                  />
                ))}
              </ul>

              {page < totalPages && (
                <button className={s.more} onClick={() => load(page + 1)}>
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
