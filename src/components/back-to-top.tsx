"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const top = document.getElementById("page-top");
    if (!top) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "320px 0px 0px" },
    );
    observer.observe(top);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <Button
      className="back-to-top"
      variant="outline"
      size="icon-sm"
      aria-label="Назад на врх странице"
      onClick={() => {
        window.scrollTo({ top: 0 });
        document.getElementById("site-brand")?.focus({ preventScroll: true });
      }}
    >
      <ArrowUp aria-hidden="true" />
    </Button>
  );
}
