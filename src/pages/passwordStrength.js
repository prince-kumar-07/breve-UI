// Shared by Signup and ResetPassword — one meter, one scoring rule, wherever
// someone is choosing a password.

export const TIERS = [
  { label: "Too short", tone: "#e8a88b" },
  { label: "Weak", tone: "#e8c08b" },
  { label: "Fair", tone: "#d8b45c" },
  { label: "Strong", tone: "#a8d8a0" },
  { label: "Excellent", tone: "#7fd6a8" },
];

/** Four cheap signals — length, mixed case, a digit, a symbol. */
export function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1;
  return Math.min(4, score);
}
