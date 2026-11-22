import type { BeforeSendEvent } from "@vercel/analytics";

export function redactAnalyticsUrl(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.searchParams.delete("q");
  // Reader links can carry the original search URL in returnTo.
  url.searchParams.delete("returnTo");
  return { ...event, url: url.href };
}
