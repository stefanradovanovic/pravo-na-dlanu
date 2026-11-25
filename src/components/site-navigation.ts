import { BookOpen, Compass, House, Landmark, Search } from "lucide-react";

export const searchNavigationHref = "/#pretraga";

export const siteNavigation = [
  {
    href: "/",
    label: "Почетак",
    icon: House,
    desktop: { label: "Прописи", accessibleLabel: "Истражи право" },
  },
  {
    href: "/institucije",
    label: "Институције",
    icon: Landmark,
    desktop: { label: "Институције", accessibleLabel: "Мапе институција" },
  },
  { href: searchNavigationHref, label: "Претрага", icon: Search },
  {
    href: "/ucenje",
    label: "Учење",
    icon: BookOpen,
    desktop: { label: "Учење", accessibleLabel: "Учи кроз примере" },
  },
  {
    href: "/vodic",
    label: "Водич",
    icon: Compass,
    desktop: { label: "Водич", accessibleLabel: "Како читати закон" },
  },
] as const;

export function getCurrentNavigationHref(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (/^\/(propisi|zakoni)(\/|$)/.test(path)) return searchNavigationHref;

  return siteNavigation.find(
    ({ href }) => path === href || (href !== "/" && path.startsWith(`${href}/`)),
  )?.href;
}
