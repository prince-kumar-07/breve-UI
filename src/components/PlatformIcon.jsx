// Same paths, same viewBox as server/utils/platformIcons.js — the
// dashboard's picker and the live public page should never look like two
// different icon sets. Shape-only silhouettes, not exact logo
// reproductions, since each one always sits next to its own text label.
const PATHS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </>
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13.6 8.3h-1.1c-.7 0-1.3.6-1.3 1.3v1.4H9.6v2h1.6v5.3h2v-5.3h1.6l.3-2h-1.9v-1.1c0-.4.3-.7.7-.7h1.2z"
        fill="currentColor"
      />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" />
    </>
  ),
  twitter: <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  tiktok: (
    <>
      <path
        d="M13 4v10.5a3.5 3.5 0 1 1-3-3.46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M13 4c.4 2.4 2 4 4.5 4.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8.5" r="1.1" fill="currentColor" />
      <path
        d="M8 11v6M12 17v-3.5c0-1.4 1-2.3 2.2-2.3s2 .8 2 2.2V17"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  whatsapp: (
    <>
      <path
        d="M12 3a8.5 8.5 0 0 0-7.3 12.8L4 21l5.4-1.4A8.5 8.5 0 1 0 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8.5 9.5c0 3.5 2.5 6 6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m3.8 7 7.1 5.3a2 2 0 0 0 2.2 0L20.2 7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  website: (
    <>
      <path
        d="M10 13.6a4.5 4.5 0 0 0 6.6.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M14 10.4a4.5 4.5 0 0 0-6.6-.4l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
};

export default function PlatformIcon({ platform, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[platform] || PATHS.website}
    </svg>
  );
}
