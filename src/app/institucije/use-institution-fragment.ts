"use client";

import { useSyncExternalStore } from "react";

function subscribe(change: () => void) {
  window.addEventListener("hashchange", change);
  window.addEventListener("popstate", change);
  return () => {
    window.removeEventListener("hashchange", change);
    window.removeEventListener("popstate", change);
  };
}

function fragment() {
  return window.location.hash.slice(1);
}

function serverFragment() {
  return null;
}

export function useInstitutionFragment() {
  return useSyncExternalStore(subscribe, fragment, serverFragment);
}
