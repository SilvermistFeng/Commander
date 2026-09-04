"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False while rendering on the server and during hydration, true afterwards.
 *
 * Portals need a real `document`, and branching on `typeof document` directly
 * makes the server and client render different trees — which is a hydration
 * mismatch. useSyncExternalStore gives React the server answer during
 * hydration and the client answer on the render straight after, which is
 * exactly the handover it expects.
 */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
