/** Shared between client storage and server sync, so it can't drift. */
export const GUEST_PREFIX = "guest_";

export function isGuestTripId(id: string) {
  return id.startsWith(GUEST_PREFIX);
}
