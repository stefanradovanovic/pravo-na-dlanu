"use client";
import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";

import { safeReturnUrl } from "@/lib/explorer-url";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("reader-return", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("reader-return", callback);
  };
}
function returnSnapshot() {
  const explicit = new URLSearchParams(window.location.search).get("returnTo");
  if (explicit) return safeReturnUrl(explicit);
  try {
    return safeReturnUrl(
      sessionStorage.getItem("reader-return:" + window.location.pathname),
    );
  } catch {
    return "/";
  }
}
export function ReaderBackLink() {
  const href = useSyncExternalStore(subscribe, returnSnapshot, () => "/");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("returnTo")) return;
    try {
      sessionStorage.setItem(
        "reader-return:" + url.pathname,
        safeReturnUrl(url.searchParams.get("returnTo")),
      );
    } catch {
      // Keep the explicit return URL when browser storage is unavailable.
      return;
    }
    url.searchParams.delete("returnTo");
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
    window.dispatchEvent(new Event("reader-return"));
  }, [href]);
  return (
    <a className="back-link" href={href}>
      <ArrowLeft size={16} />
      {href === "/" ? "Назад на све законе" : "Назад на резултате"}
    </a>
  );
}
