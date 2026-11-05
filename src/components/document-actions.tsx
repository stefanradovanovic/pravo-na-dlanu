"use client";
import { useState } from "react";
import { Copy, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
export function DocumentActions({ printable = true }: { printable?: boolean }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Линк је копиран");
    } catch {
      setMessage("Копирајте адресу из прегледача.");
    }
  }
  return (
    <div className="document-actions">
      <Button variant="outline" size="sm" onClick={copy}>
        {message === "Линк је копиран" ? <Check /> : <Copy />} Копирај линк
      </Button>
      {printable && (
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> Штампај
        </Button>
      )}
      <span role="status">{message}</span>
    </div>
  );
}
