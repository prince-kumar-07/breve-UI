import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

/**
 * The session itself lives in an httpOnly cookie the server set — this only
 * mirrors who that cookie belongs to, so the rest of the app can render
 * around it without every component making its own /me call. A fresh page
 * load has no way to know the cookie's contents up front, so `ready` stays
 * false for one round trip before the real state (signed in or not) settles.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((data) => alive && setUser(data.user))
      .catch(() => {}) // no session yet — that's the ordinary signed-out state, not an error
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const data = await api.login(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api.signup(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // The cookie clears either way; a failed logout request shouldn't
      // leave the UI claiming someone is still signed in.
      setUser(null);
    }
  }, []);

  /** Some flows (a completed password reset) hand back a fresh session
   *  without going through login()/signup() — this just applies it. */
  const applySession = useCallback((nextUser) => setUser(nextUser), []);

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, applySession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be called within an AuthProvider.");
  return ctx;
}
