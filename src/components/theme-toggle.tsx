"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { darkThemeQuery, themeStorageKey } from "@/lib/theme";

function isDarkTheme() {
  const theme = document.documentElement.dataset.theme;
  return (
    theme === "dark" ||
    (theme !== "light" && window.matchMedia(darkThemeQuery).matches)
  );
}

function subscribeToTheme(onChange: () => void) {
  const root = document.documentElement;
  const systemTheme = window.matchMedia(darkThemeQuery);
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributeFilter: ["data-theme"] });

  function syncStoredTheme(event: StorageEvent) {
    if (event.key !== themeStorageKey && event.key !== null) return;
    if (event.storageArea !== window.localStorage) return;
    const theme = event.storageArea.getItem(themeStorageKey);
    if (theme === "dark" || theme === "light") root.dataset.theme = theme;
    else delete root.dataset.theme;
  }

  systemTheme.addEventListener("change", onChange);
  window.addEventListener("storage", syncStoredTheme);
  return () => {
    observer.disconnect();
    systemTheme.removeEventListener("change", onChange);
    window.removeEventListener("storage", syncStoredTheme);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, isDarkTheme, () => null);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={dark === null ? "invisible" : undefined}
      aria-label="Тамна тема"
      aria-pressed={dark ?? undefined}
      onClick={() => {
        const theme = isDarkTheme() ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        try {
          window.localStorage.setItem(themeStorageKey, theme);
        } catch {
          // The theme still applies to this page when storage is blocked.
        }
      }}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
