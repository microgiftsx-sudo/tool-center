"use client"

import { create } from "zustand"
import apiClient from "@/lib/axiosClients"

const isRemoteActivitySyncEnabled = process.env.NEXT_PUBLIC_ENABLE_REMOTE_ACTIVITY_SYNC === "true"
const ACTIVITY_STORAGE_KEY = "tools-hub-activity"

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToolId = "excel-extractor" | "duplicate-detector" | "excel-merger" | "excel-compare"

// Maps frontend ToolId slug → API enum value
const TOOL_ID_MAP: Record<ToolId, string> = {
  "excel-extractor":    "excel_extractor",
  "duplicate-detector": "duplicate_detector",
  "excel-merger":       "excel_merger",
  "excel-compare":      "excel_compare",
}

export interface ActivityEntry {
  id: number           // DB integer id
  tool: ToolId
  label: string
  detail?: string
  at: string           // ISO string (maps from DB createdAt)
}

interface ActivityState {
  entries: ActivityEntry[]
  isInitialized: boolean
}

interface ActivityActions {
  initialize: () => Promise<void>
  log: (entry: Omit<ActivityEntry, "id" | "at">) => void
  clear: () => void
  remove: (id: number) => void
}

type ActivityStore = ActivityState & ActivityActions

function saveEntriesToLocal(entries: ActivityEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(entries))
}

function loadEntriesFromLocal(): ActivityEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ActivityEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 20)
  } catch {
    return []
  }
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  entries: [],
  isInitialized: false,

  // ── Initialize from API ──────────────────────────────────────────────────────
  initialize: async () => {
    if (get().isInitialized) return

    const localEntries = loadEntriesFromLocal()

    if (!isRemoteActivitySyncEnabled) {
      set({ entries: localEntries, isInitialized: true })
      return
    }

    try {
      const res = await apiClient.get<{ data: { items: Record<string, unknown>[] } }>("/activity?limit=20")
      const items = (res.data as { data?: { items?: Record<string, unknown>[] } })?.data?.items ?? []
      const entries: ActivityEntry[] = items.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        tool: (r.tool as string).replace(/_/g, "-") as ToolId,
        label: r.label as string,
        detail: r.detail as string | undefined,
        at: r.createdAt as string,
      }))
      saveEntriesToLocal(entries)
      set({ entries, isInitialized: true })
    } catch {
      set({ entries: localEntries, isInitialized: true })
    }
  },

  // ── Log new activity (optimistic) ────────────────────────────────────────────
  log: (entry) => {
    // Optimistic: add with a temp id of 0
    const tempId = -Date.now()
    const tempEntry: ActivityEntry = {
      ...entry,
      id: tempId,
      at: new Date().toISOString(),
    }
    set((s) => {
      const nextEntries = [tempEntry, ...s.entries].slice(0, 20)
      saveEntriesToLocal(nextEntries)
      return { entries: nextEntries }
    })

    if (!isRemoteActivitySyncEnabled) return
    // Sync to API
    apiClient.post("/activity", {
      tool: TOOL_ID_MAP[entry.tool],
      label: entry.label,
      detail: entry.detail,
    }).then((res) => {
      const saved = (res.data as { data?: { id?: number; createdAt?: string } })?.data
      if (saved?.id) {
        // Replace temp entry (id=0) with the real DB id
        set((s) => {
          const nextEntries = s.entries.map((e) =>
            e.id === tempId ? { ...e, id: saved.id!, at: saved.createdAt ?? e.at } : e
          )
          saveEntriesToLocal(nextEntries)
          return { entries: nextEntries }
        })
      }
    }).catch(() => {/* silent */})
  },

  // ── Clear all ────────────────────────────────────────────────────────────────
  clear: () => {
    set({ entries: [] })
    saveEntriesToLocal([])
    if (!isRemoteActivitySyncEnabled) return
    apiClient.delete("/activity").catch(() => {/* silent */})
  },

  // ── Remove single entry ──────────────────────────────────────────────────────
  remove: (id) => {
    set((s) => {
      const nextEntries = s.entries.filter((e) => e.id !== id)
      saveEntriesToLocal(nextEntries)
      return { entries: nextEntries }
    })
    if (!isRemoteActivitySyncEnabled) return
    if (id > 0) {
      apiClient.delete(`/activity/${id}`).catch(() => {/* silent */})
    }
  },
}))
