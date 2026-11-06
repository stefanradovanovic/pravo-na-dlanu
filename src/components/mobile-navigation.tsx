"use client";

import { usePathname } from "next/navigation";
import { MobileNavigationLinks } from "./mobile-navigation-links";

export function MobileNavigation() {
  return <MobileNavigationLinks pathname={usePathname()} />;
}
