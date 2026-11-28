import { buttonVariants } from "@/components/ui/button";
import { getCurrentNavigationHref, siteNavigation } from "./site-navigation";

/** Also rendered directly into standalone laws, where there is no Next router. */
export function MobileNavigationLinks({ pathname }: { pathname: string }) {
  const selectedHref = getCurrentNavigationHref(pathname);

  return (
    <nav
      id="mobile-site-navigation"
      popover="auto"
      className="mobile-navigation"
      aria-label="Главна навигација"
    >
      {siteNavigation.map(({ href, label, icon: Icon }) => (
        // Ordinary links keep every destination usable in standalone laws and without JavaScript.
        <a
          key={href}
          href={href}
          aria-current={selectedHref === href ? "page" : undefined}
          className={buttonVariants({
            variant: "ghost",
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
