export const LS_KEYS = {
  snapshot: "vz_map_snapshot_v3"
} as const;

export type OfflineSnapshot = {
  savedAt: string;
  locations: unknown[];
  signs: unknown[];
  zones: unknown[];
};

export function saveSnapshot(s: OfflineSnapshot): void {
  try {
    localStorage.setItem(LS_KEYS.snapshot, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function loadSnapshot(): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(LS_KEYS.snapshot);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineSnapshot;
  } catch {
    return null;
  }
}
