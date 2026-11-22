"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAnalyticsUrl } from "@/lib/analytics";

export function SiteAnalytics() {
  return <Analytics beforeSend={redactAnalyticsUrl} />;
}
