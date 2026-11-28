"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LearningSource } from "@/lib/learning";

export function ArticleDialog({ source }: { source: LearningSource }) {
  const [open, setOpen] = useState(false);
  const title = `Члан ${source.article}`;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <BookOpen aria-hidden="true" /> Прочитај члан {source.article}
      </DialogTrigger>
      <DialogContent className="learning-article-dialog" initialFocus="content">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{source.title}</DialogDescription>
        </DialogHeader>
        {open && (
          <iframe
            title={`${source.title} — ${title}`}
            src={source.href}
            onLoad={(event) => {
              const page = event.currentTarget.contentDocument;
              if (!page) return;
              page.documentElement.classList.add("quiz-law-page");
              page.getElementById(`clan-${source.article}`)?.scrollIntoView();
              // Escape inside a frame does not bubble to the parent dialog.
              page.addEventListener("keydown", (key) => {
                if (key.key === "Escape") {
                  key.preventDefault();
                  setOpen(false);
                }
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
