import { BookOpen, Compass, House, Scale, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const constitutionPath = "/propisi/ustav-republike-srbije";
const destinations = [
  {
    href: "/",
    label: "Почетна",
    accessibleLabel: "Почетна",
    icon: House,
  },
  {
    href: "/#pretraga",
    label: "Истражи",
    accessibleLabel: "Истражи право",
    icon: Search,
  },
  {
    href: "/ucenje",
    label: "Учи",
    accessibleLabel: "Учи кроз примере",
    icon: BookOpen,
  },
  {
    href: "/vodic",
    label: "Водич",
    accessibleLabel: "Како читати закон",
    icon: Compass,
  },
  {
    href: constitutionPath,
    label: "Устав",
    accessibleLabel: "Устав Србије",
    icon: Scale,
  },
];

/** Also rendered directly into standalone laws, where there is no Next router. */
export function MobileNavigationLinks({ pathname }: { pathname: string }) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const selected =
    path === "/zakoni/ustav" || path === constitutionPath
      ? constitutionPath
      : path.startsWith("/propisi/") || path.startsWith("/zakoni/")
        ? "/#pretraga"
        : destinations.find(
            ({ href }) =>
              path === href || (href !== "/" && path.startsWith(href + "/")),
          )?.href;

  return (
    <nav className="mobile-navigation" aria-label="Главна навигација">
      {destinations.map(({ href, label, accessibleLabel, icon: Icon }) => (
        // Ordinary links keep every destination usable in standalone laws and without JavaScript.
        <a
          key={href}
          href={href}
          aria-label={accessibleLabel}
          aria-current={selected === href ? "page" : undefined}
          className={buttonVariants({
            variant: selected === href ? "default" : "ghost",
            className: "mobile-navigation-link",
          })}
        >
          <Icon className="size-5" aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
