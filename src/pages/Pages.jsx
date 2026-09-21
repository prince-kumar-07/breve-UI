import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import SectionTabs from "../components/SectionTabs";
import Field from "../components/Field";
import { ApiError, api } from "../lib/api";
import s from "./Pages.module.css";

function Avatar({ page }) {
  if (page.avatarUrl) {
    return <img className={s.avatar} src={page.avatarUrl} alt="" />;
  }
  const initial = (page.displayName || "?").trim().charAt(0).toUpperCase() || "?";
  return <span className={s.avatar}>{initial}</span>;
}

function PageRow({ page, index, fresh, onToggle, onDelete, copiedCode, onCopy, confirmingCode }) {
  const confirming = confirmingCode === page.code;
  const linkCount = page.links.length;
  const totalClicks = page.links.reduce((sum, l) => sum + l.clicksCount, 0);

  return (
    <li className={`${s.row} ${fresh ? s.rowFresh : ""}`} style={{ "--i": index }}>
      <div className={s.rowMain}>
        <Avatar page={page} />
        <div className={s.rowText}>
          <Link className={s.rowName} to={`/pages/${page.code}`}>
            {page.displayName}
          </Link>
          <a className={s.rowShort} href={page.url} target="_blank" rel="noreferrer">
            {page.shortUrl}
          </a>
        </div>
      </div>

      <span className={`${s.pill} ${page.active ? s.pillOn : s.pillOff}`}>{page.active ? "Active" : "Paused"}</span>

      <span className={s.rowCount}>
        {linkCount} <small>{linkCount === 1 ? "link" : "links"}</small>
      </span>

      <span className={s.rowClicks}>
        {totalClicks.toLocaleString()} <small>{totalClicks === 1 ? "open" : "opens"}</small>
      </span>

      <div className={s.rowActions}>
        <button className={s.rowBtn} onClick={() => onCopy(page)}>
          {copiedCode === page.code ? "Copied" : "Copy"}
        </button>
        <Link className={s.rowBtn} to={`/pages/${page.code}`}>
          Edit
        </Link>
        <button className={s.rowBtn} onClick={() => onToggle(page)}>
          {page.active ? "Pause" : "Resume"}
        </button>
        <button
          className={`${s.rowBtn} ${s.rowBtnDanger} ${confirming ? s.rowBtnConfirming : ""}`}
          onClick={() => onDelete(page)}
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
      <span className={s.skeletonAvatar} />
      <span className={s.skeletonBar} style={{ width: "50%" }} />
      <span className={s.skeletonPill} />
      <span className={s.skeletonBar} style={{ width: "40px" }} />
      <span className={s.skeletonBar} style={{ width: "60px" }} />
    </li>
  );
}

export default function Pages() {
  const [pages, setPages] = useState(null); // null = loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [freshCode, setFreshCode] = useState("");
  const [confirmingCode, setConfirmingCode] = useState("");
  const timers = useRef([]);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = useCallback(async (targetPage) => {
    try {
      const data = await api.listPages({ page: targetPage, limit: 20 });
      setPages((prev) => (targetPage === 1 ? data.pages : [...(prev || []), ...data.pages]));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load your pages.");
      setPages((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  async function onCreate(e) {
    e.preventDefault();
    if (creating) return;

    const name = displayName.trim();
    if (!name) {
      setFormError("Give this page a name.");
      return;
    }

    setFormError("");
    setCreating(true);

    try {
      const payload = { displayName: name };
      if (bio.trim()) payload.bio = bio.trim();
      if (avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();

      const { page: created } = await api.createPage(payload);
      setPages((prev) => [created, ...(prev || [])]);
      setTotal((t) => t + 1);
      setDisplayName("");
      setBio("");
      setAvatarUrl("");
      setAdvanced(false);

      setFreshCode(created.code);
      timers.current.push(setTimeout(() => setFreshCode(""), 1800));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(pg) {
    const next = { ...pg, active: !pg.active };
    setPages((prev) => prev.map((p) => (p.code === pg.code ? next : p)));
    try {
      await api.updatePage(pg.code, { active: next.active });
    } catch {
      load(1);
    }
  }

  function onDelete(pg) {
    if (confirmingCode !== pg.code) {
      setConfirmingCode(pg.code);
      timers.current.push(setTimeout(() => setConfirmingCode((c) => (c === pg.code ? "" : c)), 3000));
      return;
    }

    setConfirmingCode("");
    setPages((prev) => prev.filter((p) => p.code !== pg.code));
    setTotal((t) => Math.max(0, t - 1));
    api.deletePage(pg.code).catch(() => load(1));
  }

  async function onCopy(pg) {
    try {
      await navigator.clipboard.writeText(pg.url);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
    setCopiedCode(pg.code);
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
              <h1 className={s.heading}>Your bio pages.</h1>
              {total > 0 && (
                <span className={s.count}>
                  {total.toLocaleString()} {total === 1 ? "page" : "pages"}
                </span>
              )}
            </div>
          </header>

          <SectionTabs />

          <form className={s.form} onSubmit={onCreate}>
            <div className={s.formRow}>
              <div className={s.formField}>
                <Field
                  label="Page name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setFormError("");
                  }}
                  disabled={creating}
                  autoComplete="off"
                />
              </div>
              <button className={s.create} type="submit" disabled={creating}>
                {creating ? "Creating" : "Create page"}
              </button>
            </div>

            <button
              type="button"
              className={s.advancedToggle}
              onClick={() => setAdvanced((v) => !v)}
              aria-expanded={advanced}
            >
              {advanced ? "Hide options" : "Bio & avatar"}
            </button>

            {advanced && (
              <div className={s.advancedRow}>
                <div className={s.formField}>
                  <Field
                    label="Short bio (optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className={s.formField}>
                  <Field
                    label="Avatar image URL (optional)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={creating}
                    autoComplete="off"
                    inputMode="url"
                  />
                </div>
              </div>
            )}

            {formError && (
              <p className={s.formError} role="alert">
                {formError}
              </p>
            )}

            <p className={s.hint}>Add Instagram, YouTube and the rest after creating the page.</p>
          </form>

          {pages === null ? (
            <ul className={s.list} aria-hidden="true">
              <SkeletonRow />
              <SkeletonRow />
            </ul>
          ) : loadError ? (
            <p className={s.empty}>{loadError}</p>
          ) : pages.length === 0 ? (
            <div className={s.empty}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true" className={s.emptyIcon}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
              </svg>
              <p>No bio pages yet — name one above to gather your links in one place.</p>
            </div>
          ) : (
            <>
              <ul className={s.list}>
                {pages.map((pg, i) => (
                  <PageRow
                    key={pg.code}
                    page={pg}
                    index={i}
                    fresh={freshCode === pg.code}
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
