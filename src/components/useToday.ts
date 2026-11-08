"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientToday = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

/** Today's date in the user's own timezone ("" during server render). */
export function useToday() {
  return useSyncExternalStore(subscribe, clientToday, () => "");
}
