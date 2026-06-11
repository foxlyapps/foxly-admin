import { create } from "zustand";

interface TableState {
  search: string;
  page: number;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  setSearch: (s: string) => void;
  setPage: (p: number) => void;
  toggleSort: (key: string) => void;
  reset: () => void;
}

/**
 * Client-side UI state for the active resource table.
 * Reset when navigating between resources.
 */
export const useTableStore = create<TableState>((set) => ({
  search: "",
  page: 1,
  sortKey: null,
  sortDir: "desc",
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  toggleSort: (key) =>
    set((s) =>
      s.sortKey === key
        ? { sortDir: s.sortDir === "asc" ? "desc" : "asc" }
        : { sortKey: key, sortDir: "asc" },
    ),
  reset: () => set({ search: "", page: 1, sortKey: null, sortDir: "desc" }),
}));
