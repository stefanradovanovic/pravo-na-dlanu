"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocationSearch } from "./explorer-location";
import { safeReturnUrl } from "@/lib/explorer-url";

export function ReaderBackLink() {
  const search = useLocationSearch();
  const href = safeReturnUrl(new URLSearchParams(search).get("returnTo"));
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft size={16} />
      {href === "/" ? "Назад на све законе" : "Назад на резултате"}
    </Link>
  );
}
