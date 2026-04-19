type RankColorMap = Record<string, string>;

const rankColorMap: RankColorMap = {
  testing: "#7c3aed",
  root: "#dc143c",
  staff: "#22c55e",
  moderator: "#3b82f6",
  support: "#d6c4a8",
  user: "#f97316",
};

const normalizeRankName = (value?: string) =>
  (value ?? "").trim().toLowerCase();

const toHexColor = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.max(0, Math.floor(value));
  if (normalized <= 0) {
    return null;
  }
  return `#${normalized.toString(16).padStart(6, "0").slice(-6)}`;
};

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) {
    return null;
  }
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  if (![r, g, b].every((value) => Number.isFinite(value))) {
    return null;
  }
  return { r, g, b };
};

const toRgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamped})`;
};

export const getRankColorHex = (
  name?: string,
  color?: number | null,
): string | null => {
  const direct = toHexColor(color ?? undefined);
  if (direct) {
    return direct;
  }
  const normalized = normalizeRankName(name);
  if (!normalized) {
    return null;
  }
  return rankColorMap[normalized] ?? null;
};

export const getRankGlowStyle = (
  name?: string,
  color?: number | null,
  intensity = 0.45,
): { borderColor: string; boxShadow: string } | null => {
  const hex = getRankColorHex(name, color);
  if (!hex) {
    return null;
  }
  const soft = toRgba(hex, intensity * 0.35);
  const glow = toRgba(hex, intensity);
  if (!soft || !glow) {
    return null;
  }
  return {
    borderColor: soft,
    boxShadow: `0 0 0 1px ${soft}, 0 0 18px -3px ${glow}`,
  };
};
