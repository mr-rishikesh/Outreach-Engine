import { isBlockedDomain } from "./blockedDomains.js";

/**
 * Checks if a contact is blocked from receiving emails based on:
 * 1. DNC/Unsubscribe/Stage flags (DNC, unsubscribed, stages, notes)
 * 2. Bounced flags
 * 3. Replied flags
 * 4. Blocked Domain rule
 *
 * @param {Object} contact - The Contact document or object
 * @returns {Object} - { blocked: boolean, reason: string|null }
 */
export function isContactBlockedFromEmails(contact) {
  if (!contact) {
    return { blocked: true, reason: "No contact provided" };
  }

  if (!contact.email) {
    return { blocked: true, reason: "Missing email address" };
  }

  // 1. Blocked Domain (always check this)
  if (isBlockedDomain(contact.email)) {
    return { blocked: true, reason: "Blocked domain" };
  }

  // 2. Do Not Contact (DNC) / Unsubscribed Rules
  if (
    contact.flags?.doNotContact === true ||
    contact.flags?.unsubscribe === true ||
    contact.notes === "DONOTSEND" ||
    contact.stage === "Do Not Contact"
  ) {
    return { blocked: true, reason: "Do Not Contact (DNC) / Unsubscribed" };
  }

  // 3. Bounced Rules
  if (
    contact.flags?.bounced === true ||
    contact.emailBounced === "true" ||
    contact.emailStatus === "Bounced"
  ) {
    return { blocked: true, reason: "Bounced email" };
  }

  // 4. Replied Rules
  if (
    contact.reply?.replied === true ||
    contact.replied === "true" ||
    contact.outreachStatus === "REPLIED_POSITIVE" ||
    contact.outreachStatus === "REPLIED_NEGATIVE"
  ) {
    return { blocked: true, reason: "Contact has replied" };
  }

  return { blocked: false, reason: null };
}
