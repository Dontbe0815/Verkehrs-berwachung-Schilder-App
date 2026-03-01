import type { Role } from "@/lib/session";
export type UserSpec = { username: string; password: string; role: Role };

export function getUsers(): UserSpec[] {
  const adminU = process.env.ADMIN_USER || "admin";
  const adminP = process.env.ADMIN_PASS || "admin123";
  const creatorU = process.env.CREATOR_USER || "creator";
  const creatorP = process.env.CREATOR_PASS || "creator123";
  const spectatorU = process.env.SPECTATOR_USER || "spectator";
  const spectatorP = process.env.SPECTATOR_PASS || "spectator123";
  return [
    { username: adminU, password: adminP, role: "admin" },
    { username: creatorU, password: creatorP, role: "creator" },
    { username: spectatorU, password: spectatorP, role: "spectator" }
  ];
}
export function validateLogin(username: string, password: string): { ok: boolean; role?: Role } {
  const u = getUsers().find((x) => x.username === username);
  if (!u) return { ok: false };
  return u.password === password ? { ok: true, role: u.role } : { ok: false };
}
