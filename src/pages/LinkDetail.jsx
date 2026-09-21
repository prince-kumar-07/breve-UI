import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Nav from "../components/Nav";
import Field from "../components/Field";
import QrCode from "../components/QrCode";
import { buildStandaloneSvg } from "../lib/qr";
import { downloadText } from "../lib/download";
import { normaliseUrl } from "../lib/normaliseUrl";
import { ApiError, api } from "../lib/api";
import StatsChart from "./StatsChart";
import s from "./LinkDetail.module.css";

function StatusDot({ active }) {
  return <i className={`${s.dot} ${active ? s.dotOn : s.dotOff}`} aria-hidden="true" />;
}

export default function LinkDetail() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [link, setLink] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [destination, setDestination] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    let alive = true;
    setLink(null);
    setLoadError("");
    setConfirmingDelete(false);

    Promise.all([api.getLink(code), api.linkStats(code)])
      .then(([linkData, statsData]) => {
        if (!alive) return;
        setLink(linkData.link);
        setDestination(linkData.link.longUrl);
        setStats(statsData);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load this link.");
      });

    return () => {
      alive = false;
    };
  }, [code]);

  // link.url is the server's own fully-qualified address, scheme included
  // and correct for whatever SHORT_URL_SCHEME actually is — reconstructing
  // it here with an assumed "https://" is exactly what broke this on a
  // local, TLS-less server (link.shortUrl, used elsewhere below, is the
  // scheme-free pretty form for on-screen display only).
  const url = link ? link.url : "";

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
    setCopied(true);
    timers.current.push(setTimeout(() => setCopied(false), 1800));
  }, [url]);

  async function saveDestination(e) {
    e.preventDefault();
    const clean = normaliseUrl(destination);
    if (!clean) {
      setSaveError("That isn't a web address yet.");
      return;
    }

    setSaveError("");
    setSaveState("saving");
    try {
      const { link: updated } = await api.updateLink(code, { longUrl: clean });
      setLink(updated);
      setDestination(updated.longUrl);
      setSaveState("saved");
      timers.current.push(setTimeout(() => setSaveState("idle"), 1500));
    } catch (err) {
      setSaveState("idle");
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  async function toggleActive() {
    const { link: updated } = await api.updateLink(code, { active: !link.active });
    setLink(updated);
  }

  // Two-step, in place — "Delete" arms it ("Sure?"), a second click within
  // three seconds actually deletes. No native confirm() dialog blocking
  // the rest of the page for one action.
  function removeLink() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      timers.current.push(setTimeout(() => setConfirmingDelete(false), 3000));
      return;
    }
    api.deleteLink(code).then(() => navigate("/dashboard", { replace: true }));
  }

  return (
    <>
      <Nav />
      <main className={s.page} id="main">
        <div className={s.shell}>
          <Link className={s.back} to="/dashboard">
            ← All links
          </Link>

          {loadError ? (
            <p className={s.notFound}>{loadError}</p>
          ) : !link ? (
            <div className={s.loading} aria-hidden="true">
              <span className={s.skeletonBar} style={{ width: "40%", height: 34 }} />
              <div className={s.loadingGrid}>
                <span className={s.skeletonBlock} />
                <span className={s.skeletonBlock} style={{ maxWidth: 220 }} />
              </div>
            </div>
          ) : (
            <>
              <header className={s.head}>
                <div>
                  <p className={s.eyebrow}>
                    <StatusDot active={link.active} />
                    {link.active ? "Active" : "Paused"}
                  </p>
                  <h1 className={s.short}>{link.shortUrl}</h1>
                </div>
                <div className={s.headActions}>
                  <button className={s.action} onClick={copy}>
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button className={s.action} onClick={toggleActive}>
                    {link.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    className={`${s.action} ${s.danger} ${confirmingDelete ? s.dangerConfirming : ""}`}
                    onClick={removeLink}
                  >
                    {confirmingDelete ? "Sure?" : "Delete"}
                  </button>
                </div>
              </header>

              <div className={s.grid}>
                <div className={s.column}>
                  <form className={s.editForm} onSubmit={saveDestination}>
                    <Field
                      label="Destination"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setSaveError("");
                      }}
                      error={saveError}
                      disabled={saveState === "saving"}
                    />
                    <button className={s.save} type="submit" disabled={saveState === "saving"}>
                      {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Save destination"}
                    </button>
                  </form>

                  <dl className={s.meta}>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(link.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</dd>
                    </div>
                    <div>
                      <dt>Expires</dt>
                      <dd>
                        {link.expiresAt
                          ? new Date(link.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })
                          : "Never"}
                      </dd>
                    </div>
                    <div>
                      <dt>Passphrase</dt>
                      <dd>{link.hasPassphrase ? "Set" : "None"}</dd>
                    </div>
                  </dl>

                  {stats && (
                    <StatsChart totalClicks={stats.totalClicks} last14Days={stats.last14Days} sources={stats.sources} />
                  )}
                </div>

                <div className={s.qrColumn}>
                  <div className={s.qrPlate}>
                    <QrCode value={url} className={s.qrArt} />
                  </div>
                  <button
                    className={s.qrDownload}
                    onClick={() => downloadText(`${link.code}.svg`, buildStandaloneSvg(url))}
                  >
                    Download SVG
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
