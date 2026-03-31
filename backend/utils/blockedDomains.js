// Domains that should never receive outreach emails.
// Add domains here to block sending — matching is case-insensitive.
const BLOCKED_DOMAINS = [
  // Government
  "gov.in",
  "nic.in",
  "gov.uk",
  "gov.au",
  "gov.us",

  // Military
  "mil",
  "army.mil",
  "navy.mil",

  // Education (be careful — you may WANT to email some of these)
  // "edu",
  // "ac.in",
  // "ac.uk",

  // Major providers that flag cold email
  "yahoo.com",
  "hotmail.com",
  "aol.com",

  // Known no-reply / system domains
  "noreply.com",
  "example.com",
  "test.com",
  "localhost",
  "invalid",
 "factoryjet.com",
 "factoryjet.in",
 "commerceflo.com",
 "commerceflo.in"

  // Add your blocked domains below:
  // "competitor.com",
  // "somecompany.io",
];

/**
 * Checks if an email belongs to a blocked domain.
 * Supports multi-level TLDs (e.g. "gov.in" matches "user@tax.gov.in").
 * @param {string} email
 * @returns {boolean}
 */
export function isBlockedDomain(email) {
  if (!email || typeof email !== "string") return true;

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;

  return BLOCKED_DOMAINS.some((blocked) => {
    const b = blocked.toLowerCase();
    return domain === b || domain.endsWith(`.${b}`);
  });
}
