import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "../lib/api";
import QrCode from "./QrCode";
import { buildStandaloneSvg } from "../lib/qr";
import { downloadText } from "../lib/download";
import { normaliseUrl } from "../lib/normaliseUrl";
import { useCountUp, useInView, useParallax, useReducedMotion } from "./Hooks";
import s from "./Hero.module.css";

const FOLD_MS = 780;

const TRUSTED = ["Aperture", "Nordwell", "Maison Clé", "Vantage", "Orrery"];

function Figure({ value, decimals, suffix, label, active }) {
  const shown = useCountUp(value, active, decimals);
  return (
    <div className={s.cell}>
      <p className={s.figure}>
        {shown}
        <span>{suffix}</span>
      </p>
      <p className={s.cellLabel}>{label}</p>
    </div>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const auraRef = useParallax(0.18);
  const [ledgerRef, ledgerIn] = useInView(0.4);

  const [value, setValue] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | folding | done
  const [code, setCode] = useState("");
  // Neither is ever rendered at this initial value — the display only
  // appears once phase is "done", which only happens after the real API
  // response has already called setDomain/setUrl. No domain or scheme
  // belongs in frontend source; the server is configured for both
  // (SHORT_DOMAIN, SHORT_URL_SCHEME) and hands back link.url ready to use.
  const [domain, setDomain] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const shorten = useCallback(async () => {
    if (phase === "folding") return;

    const clean = normaliseUrl(value);
    if (!clean) {
      setError("That isn't a web address yet. Try one that starts with https://");
      return;
    }

    setError("");
    setCopied(false);
    setPhase("folding");

    const foldTimer = reduced
      ? Promise.resolve()
      : new Promise((resolve) => {
          timers.current.push(setTimeout(resolve, FOLD_MS));
        });

    try {
      const [{ link }] = await Promise.all([api.createLink({ longUrl: clean }), foldTimer]);
      setCode(link.code);
      setDomain(link.domain);
      setUrl(link.url);
      setPhase("done");
    } catch (err) {
      setPhase("idle");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  }, [value, reduced, phase]);

  const copy = useCallback(async () => {
    try {
      // The full, clickable form — not just the "domain/code" text on
      // screen — what gets pasted needs to actually work wherever it
      // lands. link.url already has the right scheme baked in server-side.
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
    setCopied(true);
    timers.current.push(setTimeout(() => setCopied(false), 2000));
  }, [url]);

  const downloadQr = useCallback(() => {
    downloadText(`${code}.svg`, buildStandaloneSvg(url));
  }, [code, url]);

  return (
    <section className={s.hero} id="top">
      <div className={s.aura} ref={auraRef} aria-hidden="true" />

      <div className={s.inner}>
        <h1 className={s.headline}>
          <span className={s.mask}>
            <span className={s.rise} style={{ animationDelay: "0.05s" }}>
              Fold a long link
            </span>
          </span>
          <span className={s.mask}>
            <span className={s.rise} style={{ animationDelay: "0.14s" }}>
              down to <em>seven</em> characters.
            </span>
          </span>
        </h1>

        <p className={s.lede}>
          Paste anything. Brevé hands back a short link on your own domain, then
          tells you who opened it, from where, and at what moment.
        </p>

        {/* ------------------------- the press ------------------------- */}
        <div className={s.press} id="start">
          <div className={`${s.field} ${phase === "folding" ? s.fieldPressed : ""}`}>
            <input
              className={s.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && shorten()}
              placeholder="Paste a long link"
              aria-label="Long link to shorten"
              spellCheck="false"
              autoComplete="off"
              inputMode="url"
            />

            <button className={s.go} onClick={shorten} disabled={phase === "folding"}>
              {phase === "folding" ? "Folding" : "Shorten link"}
            </button>
          </div>

          <p className={`${s.note} ${error ? s.noteError : ""}`} role={error ? "alert" : undefined}>
            {error || "Your first ten links need no account."}
          </p>

          {phase === "done" && (
            <article className={s.result} key={code}>
              <div className={s.resultMain}>
                <p className={s.label}>Your short link</p>
                <p className={s.short}>
                  {domain}/<b>{code}</b>
                </p>
                <div className={s.row}>
                  <button className={`${s.copy} ${copied ? s.copyDone : ""}`} onClick={copy}>
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <span className={s.meta}>Created just now · never expires</span>
                </div>
              </div>

              <div className={s.qr}>
                <div className={s.qrPlate}>
                  <QrCode value={url} className={s.qrArt} />
                </div>
                <button className={s.qrLink} onClick={downloadQr}>
                  Download SVG
                </button>
              </div>
            </article>
          )}
        </div>

        {/* -------------------------- trust -------------------------- */}
        <div className={s.trust}>
          <p className={s.trustLabel}>Folding links for</p>
          <ul className={s.trustRow}>
            {TRUSTED.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        {/* -------------------------- ledger -------------------------- */}
        <div className={`${s.ledger} ${ledgerIn ? s.ledgerIn : ""}`} ref={ledgerRef}>
          <Figure value={4.2} decimals={1} suffix="M" label="links folded so far" active={ledgerIn} />
          <Figure value={180} suffix="ms" label="median redirect, worldwide" active={ledgerIn} />
          <Figure value={99.99} decimals={2} suffix="%" label="uptime over twelve months" active={ledgerIn} />
        </div>
      </div>
    </section>
  );
}
