"use client";
import Link from "next/link";
import { BookOpen, Scale, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Право на длану — почетна">
        <span className="brand-mark">
          <Scale size={23} />
        </span>
        <span>
          право<span className="brand-light"> на длану</span>
          <small>ВОДИЧ КРОЗ ПРАВО СРБИЈЕ</small>
        </span>
      </Link>
      <nav aria-label="Главна навигација">
        <Link href="/">Истражи право</Link>
        <Link href="/zakoni/ustav">Устав Србије</Link>
        <Link href="/ucenje">Примери</Link>
        <Link href="/o-projektu">О пројекту</Link>
      </nav>
      <a
        className={buttonVariants({ variant: "outline" })}
        href="https://www.pravno-informacioni-sistem.rs/"
        target="_blank"
        rel="noreferrer"
      >
        <BookOpen />{" "}
        <span className="header-source-label">Званични прописи</span>
        <ArrowUpRight size={14} />
      </a>
    </header>
  );
}
