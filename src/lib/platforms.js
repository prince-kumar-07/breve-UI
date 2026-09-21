// Mirrors server/utils/platforms.js exactly — same list, same order, same
// labels. The server is what actually enforces this set (an unknown value
// silently becomes "website" there); this copy exists only to drive the
// dashboard's picker UI.
export const PLATFORMS = [
  "instagram",
  "facebook",
  "youtube",
  "twitter",
  "tiktok",
  "linkedin",
  "whatsapp",
  "email",
  "website",
];

export const PLATFORM_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  twitter: "X (Twitter)",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
};
