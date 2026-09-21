import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import Nav from "../components/Nav";
import Field from "../components/Field";
import QrCode from "../components/QrCode";
import PlatformIcon from "../components/PlatformIcon";
import { buildStandaloneSvg } from "../lib/qr";
import { downloadText } from "../lib/download";
import { normaliseUrl } from "../lib/normaliseUrl";
import { PLATFORMS, PLATFORM_LABELS } from "../lib/platforms";
import { ApiError, api } from "../lib/api";
import StatsChart from "./StatsChart";
import s from "./PageDetail.module.css";

let tempId = 0;
const nextTempId = () => `new-${(tempId += 1)}`;

function emptyLinkDraft() {
  return { key: nextTempId(), id: null, platform: "website", label: "", url: "", active: true };
}

export default function PageDetail() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileState, setProfileState] = useState("idle"); // idle | saving | saved

  const [linksDraft, setLinksDraft] = useState([]);
  const [linksError, setLinksError] = useState("");
  const [linksState, setLinksState] = useState("idle"); // idle | saving | saved

  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    let alive = true;
    setPage(null);
    setLoadError("");
    setConfirmingDelete(false);

    Promise.all([api.getPage(code), api.pageStats(code)])
      .then(([pageData, statsData]) => {
        if (!alive) return;
        setPage(pageData.page);
        setDisplayName(pageData.page.displayName);
        setBio(pageData.page.bio);
        setAvatarUrl(pageData.page.avatarUrl);
        setLinksDraft(pageData.page.links.map((l) => ({ key: l.id, ...l })));
        setStats(statsData);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load this page.");
      });

    return () => {
      alive = false;
    };
  }, [code]);

  const url = page ? page.url : "";

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
    setCopied(true);
    timers.current.push(setTimeout(() => setCopied(false), 1800));
  }, [url]);

  async function saveProfile(e) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setProfileError("Give this page a name.");
      return;
    }

    setProfileError("");
    setProfileState("saving");
    try {
      const { page: updated } = await api.updatePage(code, {
        displayName: name,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      setPage(updated);
      setProfileState("saved");
      timers.current.push(setTimeout(() => setProfileState("idle"), 1500));
    } catch (err) {
      setProfileState("idle");
      setProfileError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  async function toggleActive() {
    const { page: updated } = await api.updatePage(code, { active: !page.active });
    setPage(updated);
  }

  function removePage() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      timers.current.push(setTimeout(() => setConfirmingDelete(false), 3000));
      return;
    }
    api.deletePage(code).then(() => navigate("/pages", { replace: true }));
  }

  // ------------------------------ links ------------------------------

  function updateDraft(key, patch) {
    setLinksDraft((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setLinksError("");
  }

  function addDraft() {
    setLinksDraft((prev) => [...prev, emptyLinkDraft()]);
  }

  function removeDraft(key) {
    setLinksDraft((prev) => prev.filter((l) => l.key !== key));
  }

  function moveDraft(key, dir) {
    setLinksDraft((prev) => {
      const i = prev.findIndex((l) => l.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function saveLinks() {
    for (const l of linksDraft) {
      if (!l.label.trim()) {
        setLinksError("Every link needs a label.");
        return;
      }
      if (!normaliseUrl(l.url)) {
        setLinksError(`"${l.label}" needs a real web address.`);
        return;
      }
    }

    setLinksError("");
    setLinksState("saving");
    try {
      const payload = linksDraft.map((l) => ({
        id: l.id || undefined,
        platform: l.platform,
        label: l.label.trim(),
        url: l.url.trim(),
        active: l.active,
      }));
      const { page: updated } = await api.updatePage(code, { links: payload });
      setPage(updated);
      setLinksDraft(updated.links.map((l) => ({ key: l.id, ...l })));
      setLinksState("saved");
      timers.current.push(setTimeout(() => setLinksState("idle"), 1500));
      const statsData = await api.pageStats(code);
      setStats(statsData);
    } catch (err) {
      setLinksState("idle");
      setLinksError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <Nav />
      <main className={s.page} id="main">
        <div className={s.shell}>
          <RouterLink className={s.back} to="/pages">
            ← All pages
          </RouterLink>

          {loadError ? (
            <p className={s.notFound}>{loadError}</p>
          ) : !page ? (
            <div className={s.loading} aria-hidden="true">
              <span className={s.skeletonBar} style={{ width: "40%", height: 34 }} />
              <div className={s.loadingGrid}>
                <span className={s.skeletonBlock} />
                <span className={s.skeletonBlock} style={{ maxWidth: 260 }} />
              </div>
            </div>
          ) : (
            <>
              <header className={s.head}>
                <div>
                  <p className={s.eyebrow}>
                    <i className={`${s.dot} ${page.active ? s.dotOn : s.dotOff}`} aria-hidden="true" />
                    {page.active ? "Active" : "Paused"}
                  </p>
                  <h1 className={s.short}>{page.shortUrl}</h1>
                </div>
                <div className={s.headActions}>
                  <button className={s.action} onClick={copy}>
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button className={s.action} onClick={toggleActive}>
                    {page.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    className={`${s.action} ${s.danger} ${confirmingDelete ? s.dangerConfirming : ""}`}
                    onClick={removePage}
                  >
                    {confirmingDelete ? "Sure?" : "Delete"}
                  </button>
                </div>
              </header>

              <div className={s.grid}>
                <div className={s.column}>
                  <form className={s.card} onSubmit={saveProfile}>
                    <p className={s.cardTitle}>Profile</p>
                    <div className={s.profileFields}>
                      <Field label="Page name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={profileError} />
                      <Field label="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                      <Field label="Avatar image URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} inputMode="url" />
                    </div>
                    <button className={s.save} type="submit" disabled={profileState === "saving"}>
                      {profileState === "saving" ? "Saving" : profileState === "saved" ? "Saved" : "Save profile"}
                    </button>
                  </form>

                  <div className={s.card}>
                    <p className={s.cardTitle}>Links</p>

                    <div className={s.linkRows}>
                      {linksDraft.length === 0 && <p className={s.linksEmpty}>No links yet — add your first one below.</p>}
                      {linksDraft.map((l, i) => (
                        <div className={s.linkRow} key={l.key}>
                          <select
                            className={s.select}
                            value={l.platform}
                            onChange={(e) => updateDraft(l.key, { platform: e.target.value })}
                          >
                            {PLATFORMS.map((p) => (
                              <option key={p} value={p}>
                                {PLATFORM_LABELS[p]}
                              </option>
                            ))}
                          </select>
                          <span className={s.linkIcon}>
                            <PlatformIcon platform={l.platform} />
                          </span>
                          <input
                            className={s.textInput}
                            placeholder="Label"
                            value={l.label}
                            onChange={(e) => updateDraft(l.key, { label: e.target.value })}
                          />
                          <input
                            className={s.textInput}
                            placeholder="https://…"
                            value={l.url}
                            onChange={(e) => updateDraft(l.key, { url: e.target.value })}
                            inputMode="url"
                          />
                          <div className={s.linkRowActions}>
                            <button type="button" className={s.iconBtn} onClick={() => moveDraft(l.key, -1)} disabled={i === 0} aria-label="Move up">
                              ↑
                            </button>
                            <button type="button" className={s.iconBtn} onClick={() => moveDraft(l.key, 1)} disabled={i === linksDraft.length - 1} aria-label="Move down">
                              ↓
                            </button>
                            <button
                              type="button"
                              className={`${s.iconBtn} ${l.active ? "" : s.iconBtnOff}`}
                              onClick={() => updateDraft(l.key, { active: !l.active })}
                              aria-label={l.active ? "Hide from page" : "Show on page"}
                              title={l.active ? "Visible on the page" : "Hidden from the page"}
                            >
                              {l.active ? "●" : "○"}
                            </button>
                            <button type="button" className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => removeDraft(l.key)} aria-label="Remove link">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={s.linksFooter}>
                      <button type="button" className={s.addLink} onClick={addDraft}>
                        + Add a link
                      </button>
                      <button type="button" className={s.save} onClick={saveLinks} disabled={linksState === "saving"}>
                        {linksState === "saving" ? "Saving" : linksState === "saved" ? "Saved" : "Save links"}
                      </button>
                    </div>

                    {linksError && (
                      <p className={s.formError} role="alert">
                        {linksError}
                      </p>
                    )}
                  </div>

                  {stats && (
                    <>
                      <StatsChart totalClicks={stats.totalClicks} last14Days={stats.last14Days} sources={stats.sources} />

                      {stats.perLink.length > 0 && (
                        <div className={s.card}>
                          <p className={s.cardTitle}>Opens by link</p>
                          <div className={s.perLink}>
                            {stats.perLink.map((l) => (
                              <div className={s.perLinkRow} key={l.id}>
                                <span className={s.linkIcon}>
                                  <PlatformIcon platform={l.platform} />
                                </span>
                                <b>{l.label}</b>
                                <span>{l.clicksCount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={s.previewColumn}>
                  <p className={s.previewLabel}>Live preview</p>
                  <div className={s.preview}>
                    {avatarUrl ? (
                      <img className={s.previewAvatar} src={avatarUrl} alt="" />
                    ) : (
                      <div className={s.previewAvatarFallback}>{(displayName || "?").trim().charAt(0).toUpperCase() || "?"}</div>
                    )}
                    <p className={s.previewName}>{displayName || "Page name"}</p>
                    {bio && <p className={s.previewBio}>{bio}</p>}
                    <div className={s.previewLinks}>
                      {linksDraft.filter((l) => l.active).length === 0 ? (
                        <p className={s.previewEmpty}>No links yet</p>
                      ) : (
                        linksDraft
                          .filter((l) => l.active)
                          .map((l) => (
                            <div className={s.previewLink} key={l.key}>
                              <PlatformIcon platform={l.platform} />
                              <span>{l.label || PLATFORM_LABELS[l.platform]}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className={s.qrPlate}>
                    <QrCode value={url} className={s.qrArt} />
                  </div>
                  <button className={s.qrDownload} onClick={() => downloadText(`${page.code}.svg`, buildStandaloneSvg(url))}>
                    Download QR
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
