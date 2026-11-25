"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeaderSearch } from "./header-search";
import {
  getCurrentNavigationHref,
  searchNavigationHref,
  siteNavigation,
} from "./site-navigation";

export function SiteHeader() {
  const currentHref = getCurrentNavigationHref(usePathname());
  const selectedHref = currentHref === searchNavigationHref ? "/" : currentHref;

  return (
    <header className="site-header">
      <Link
        id="site-brand"
        href="/"
        className="brand"
        aria-label="Право на длану — почетна"
      >
        <span className="brand-mark">
          <Scale size={19} aria-hidden="true" />
        </span>
        <span>
          право<span className="brand-light"> на длану</span>
        </span>
      </Link>
      <nav aria-label="Главна навигација">
        {siteNavigation
          .filter((link) => "desktop" in link)
          .map(({ href, desktop }) => (
            <Link
              key={href}
              href={href}
              aria-label={desktop.accessibleLabel}
              aria-current={selectedHref === href ? "page" : undefined}
            >
              {desktop.label}
            </Link>
          ))}
      </nav>
      <div id="site-header-search" className="contents">
        <HeaderSearch />
      </div>
      <Link
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "header-search-mobile",
        })}
        href={searchNavigationHref}
        aria-label="Претражи прописе"
      >
        <Search size={21} aria-hidden="true" />
      </Link>
    </header>
  );
}
