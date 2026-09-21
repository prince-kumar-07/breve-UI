// Shared by Hero and the dashboard's own link form — one rule for what
// counts as a web address, wherever someone can type one in. The server
// re-runs an identical check (server/utils/validators.js) since it's the
// actual trust boundary; this copy exists purely for instant UI feedback.
export function normaliseUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  if (!url.hostname.includes(".")) return null;
  return url.toString();
}
