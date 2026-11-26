import { BookOpen, House, Landmark, Search, UsersRound } from "lucide-react";

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
    href: "/institucije/skupstina",
    label: "Скупштина",
    icon: UsersRound,
    desktop: { label: "Скупштина", accessibleLabel: "Скупштина" },
  },
  {
    href: "/ucenje",
    label: "Учење",
    icon: BookOpen,
    desktop: { label: "Учење", accessibleLabel: "Учи кроз примере" },
  },
] as const;

export function getCurrentNavigationHref(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (/^\/(propisi|zakoni)(\/|$)/.test(path)) return searchNavigationHref;

  const matches = siteNavigation.filter(
    ({ href }) =>
      path === href || (href !== "/" && path.startsWith(`${href}/`)),
  );
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
