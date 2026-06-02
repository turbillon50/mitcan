// Membership QR target. Encodes an external URL carrying the CSN key so
// cashiers scanning at checkout land on the member-verification page.
export const MEMBERSHIP_KEY = "mitcan";

export function membershipUrl(userId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://carnesn.ink";
  return `${base}/m/${encodeURIComponent(userId)}?k=${MEMBERSHIP_KEY}`;
}
