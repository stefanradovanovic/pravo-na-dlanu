"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteHeader() {
  const pathname = usePathname();
  const links = [
    {
      href: "/",
      text: "Прописи",
      label: "Истражи право",
      active:
        pathname === "/" ||
        pathname.startsWith("/propisi") ||
        pathname.startsWith("/zakoni"),
    },
    {
      href: "/ucenje",
      text: "Учење",
      label: "Учи кроз примере",
      active: pathname.startsWith("/ucenje"),
    },
    {
      href: "/vodic",
      text: "Водич",
      label: "Како читати закон",
      active: pathname.startsWith("/vodic"),
    },
  ];
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
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-label={link.label}
            aria-current={link.active ? "page" : undefined}
          >
            {link.text}
          </Link>
        ))}
      </nav>
      <form
        className="header-search"
        action="/"
        method="get"
        role="search"
        aria-label="Претрага из заглавља"
      >
        <Input
          name="q"
          aria-label="Претрага из заглавља"
          placeholder="Пронађи пропис…"
          type="search"
        />
        <input type="hidden" name="view" value="list" />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          aria-label="Претражи прописе"
        >
          <Search size={18} aria-hidden="true" />
        </Button>
      </form>
      <Link
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "header-search-mobile",
        })}
        href="/#pretraga"
        aria-label="Претражи прописе"
      >
        <Search size={21} aria-hidden="true" />
      </Link>
    </header>
  );
}
