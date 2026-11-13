export type ExplorerState = {
  query: string;
  category: string;
  view: string;
  mode: string;
  page: number;
};
export function readExplorerState(search: string): ExplorerState {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page") ?? 1);
  return {
    query: params.get("q") ?? "",
    category: params.get("category") || "all",
    view: params.get("view") === "map" ? "map" : "list",
    mode: ["full", "phrase"].includes(params.get("mode") ?? "")
      ? params.get("mode")!
      : "titles",
    page: Number.isSafeInteger(page) && page > 0 ? page - 1 : 0,
  };
}
export function explorerUrl(state: ExplorerState) {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category !== "all") params.set("category", state.category);
  if (state.view !== "list") params.set("view", state.view);
  if (state.mode !== "titles") params.set("mode", state.mode);
  if (state.page > 0) params.set("page", String(state.page + 1));
  return params.size ? `/?${params}` : "/";
}
export function safeReturnUrl(value: string | null) {
  if (!value || (value !== "/" && !value.startsWith("/?"))) return "/";
  return explorerUrl(readExplorerState(value.slice(1)));
}
export function documentUrl(path: string, returnTo: string, anchor?: string) {
  return `${path}${returnTo !== "/" ? `?returnTo=${encodeURIComponent(safeReturnUrl(returnTo))}` : ""}${anchor ? `#${encodeURIComponent(anchor)}` : ""}`;
}
