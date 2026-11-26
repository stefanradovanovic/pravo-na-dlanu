export const themeStorageKey = "pravo-na-dlanu-theme";
export const darkThemeQuery = "(prefers-color-scheme: dark)";

export const initializeTheme = `try {
  const theme = localStorage.getItem(${JSON.stringify(themeStorageKey)});
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
} catch {}`;
