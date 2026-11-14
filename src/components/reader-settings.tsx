"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

// A separate island keeps the source article server rendered.
export function ReaderSettings() {
  const [size, setSize] = useState(18);
  const controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reader = controls.current?.closest<HTMLElement>(".full-document");
    reader?.style.setProperty("--reader-font-size", size + "px");
    return () => {
      reader?.style.removeProperty("--reader-font-size");
    };
  }, [size]);
  return (
    <div
      ref={controls}
      className="reading-control-group reader-settings"
      role="group"
      aria-label="Величина текста"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Смањи текст"
        disabled={size <= 16}
        onClick={() => setSize(size - 2)}
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Врати подразумевану величину текста"
        title="Врати подразумевану величину текста"
        onClick={() => setSize(18)}
      >
        <span aria-hidden="true">Аа</span>
        <span className="reader-font-size">{size}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Увећај текст"
        disabled={size >= 24}
        onClick={() => setSize(size + 2)}
      >
        <Plus />
      </Button>
    </div>
  );
}
