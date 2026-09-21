import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  One shared parallax engine for the whole page.
 *
 *  A scroll listener per component means N listeners and N layout reads
 *  interleaved with N writes — that is what makes parallax stutter.
 *  Here every subscriber is measured in one batch, then written in one
 *  batch, at most once per frame. The engine only writes a custom
 *  property, so it can never invalidate layout.
 * ------------------------------------------------------------------ */

const subscribers = new Map();
let queued = false;
let listening = false;

function paint() {
  queued = false;
  const vh = window.innerHeight || 1;
  const pending = [];

  // pass 1 — read only
  subscribers.forEach((speed, el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -240 || r.top > vh + 240) return; // offscreen, skip
    pending.push([el, ((vh / 2 - (r.top + r.height / 2)) / vh) * speed * 120]);
  });

  // pass 2 — write only
  for (let i = 0; i < pending.length; i += 1) {
    pending[i][0].style.setProperty("--parallax", `${pending[i][1].toFixed(2)}px`);
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(paint);
}

function subscribe(el, speed) {
  subscribers.set(el, speed);
  el.setAttribute("data-parallax", "");

  if (!listening) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    listening = true;
  }
  schedule();

  return () => {
    subscribers.delete(el);
    el.removeAttribute("data-parallax");
    el.style.removeProperty("--parallax");
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      listening = false;
    }
  };
}

/* ----------------------------- hooks ----------------------------- */

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** Fires once when the element scrolls into view, then disconnects. */
export function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/** Drifts an element as the page scrolls. Keep speed under 0.4. */
export function useParallax(speed = 0.15) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return undefined;
    return subscribe(ref.current, speed);
  }, [speed, reduced]);

  return ref;
}

/** Eases a number up to its target once `active` turns true. */
export function useCountUp(target, active, decimals = 0) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return undefined;
    }
    if (!active) return undefined;

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1600);
      setValue(target * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, reduced]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
}

/** True once the reader has left the very top of the page. */
export function useScrolled(offset = 28) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let pending = false;
    const check = () => {
      pending = false;
      setPast(window.scrollY > offset);
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return past;
}
/* ------------------------------------------------------------------ *
 *  Pointer-driven hooks.
 *
 *  All three write a CSS custom property and nothing else — no state,
 *  no re-render, no layout invalidation. React is told once, on mount;
 *  after that the compositor does the work.
 * ------------------------------------------------------------------ */

/** Writes --gx/--gy (0-100%) so a light source can track the cursor. */
export function usePointerGlow() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return undefined;

    let frame = 0;
    let x = 50;
    let y = 50;

    const write = () => {
      frame = 0;
      el.style.setProperty("--gx", `${x.toFixed(2)}%`);
      el.style.setProperty("--gy", `${y.toFixed(2)}%`);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (!frame) frame = requestAnimationFrame(write);
    };

    const onLeave = () => {
      x = 50;
      y = 50;
      if (!frame) frame = requestAnimationFrame(write);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return ref;
}

/**
 * Pulls an element a little way toward the cursor while it is near, and
 * lets it spring back on exit. Keep pull under 0.4 or it reads as a toy.
 */
export function useMagnetic(pull = 0.22) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    let frame = 0;
    let dx = 0;
    let dy = 0;

    const write = () => {
      frame = 0;
      el.style.setProperty("--mx", `${dx.toFixed(2)}px`);
      el.style.setProperty("--my", `${dy.toFixed(2)}px`);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      dx = (e.clientX - (r.left + r.width / 2)) * pull;
      dy = (e.clientY - (r.top + r.height / 2)) * pull;
      if (!frame) frame = requestAnimationFrame(write);
    };

    const onLeave = () => {
      dx = 0;
      dy = 0;
      if (!frame) frame = requestAnimationFrame(write);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pull, reduced]);

  return ref;
}

/** Writes --progress (0 → 1) for a read-position rail. */
export function useScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let frame = 0;

    const write = () => {
      frame = 0;
      const doc = document.documentElement;
      const span = doc.scrollHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      el.style.setProperty("--progress", p.toFixed(4));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
