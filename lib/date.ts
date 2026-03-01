export function isoToDE(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(iso);
  if (!m) return String(iso);
  const [, y, mo, d] = m;
  return `${d}.${mo}.${y}`;
}
