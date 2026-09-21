// Talks to the Brevé server (../../../server relative to this repo). No .env
// needed for local dev — this falls back to the server's own default port.
const BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:4000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      // The session lives in an httpOnly cookie, not a header this code
      // ever touches — every call needs to carry it, including reads.
      credentials: "include",
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch itself only throws for a network failure — DNS, offline, a
    // dead server, or (commonly, in dev) a CORS rejection — never for a
    // 4xx/5xx, which lands in the branch below instead.
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Something went wrong.", res.status);
  }

  return data;
}

export const api = {
  signup: (payload) => request("/api/v1/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/v1/auth/login", { method: "POST", body: payload }),
  logout: () => request("/api/v1/auth/logout", { method: "POST" }),
  me: () => request("/api/v1/auth/me"),
  forgotPassword: (payload) => request("/api/v1/auth/forgot-password", { method: "POST", body: payload }),
  resetPassword: (token, payload) =>
    request(`/api/v1/auth/reset-password/${encodeURIComponent(token)}`, { method: "POST", body: payload }),

  createLink: (payload) => request("/api/v1/links", { method: "POST", body: payload }),
  listLinks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/links${qs ? `?${qs}` : ""}`);
  },
  getLink: (code) => request(`/api/v1/links/${encodeURIComponent(code)}`),
  updateLink: (code, payload) => request(`/api/v1/links/${encodeURIComponent(code)}`, { method: "PATCH", body: payload }),
  deleteLink: (code) => request(`/api/v1/links/${encodeURIComponent(code)}`, { method: "DELETE" }),
  linkStats: (code) => request(`/api/v1/links/${encodeURIComponent(code)}/stats`),

  // Bio pages — a separate resource from links (own list, own creation
  // flow), sharing only the same short-code namespace on the server.
  createPage: (payload) => request("/api/v1/pages", { method: "POST", body: payload }),
  listPages: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/pages${qs ? `?${qs}` : ""}`);
  },
  getPage: (code) => request(`/api/v1/pages/${encodeURIComponent(code)}`),
  updatePage: (code, payload) => request(`/api/v1/pages/${encodeURIComponent(code)}`, { method: "PATCH", body: payload }),
  deletePage: (code) => request(`/api/v1/pages/${encodeURIComponent(code)}`, { method: "DELETE" }),
  pageStats: (code) => request(`/api/v1/pages/${encodeURIComponent(code)}/stats`),
};
