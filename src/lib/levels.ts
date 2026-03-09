export const XP_PER_SUBMISSION = 10;

export type LevelDef = {
  level: number;
  title: string;
  minXp: number;
  color: string;
  bg: string;
};

export const LEVELS: LevelDef[] = [
  { level: 1,  title: "Nybegynner",    minXp: 0,    color: "#64748b", bg: "#f1f5f9" },
  { level: 2,  title: "Strandvakt",    minXp: 100,  color: "#16a34a", bg: "#dcfce7" },
  { level: 3,  title: "Kystfarer",     minXp: 250,  color: "#0891b2", bg: "#cffafe" },
  { level: 4,  title: "Havkjentmann",  minXp: 500,  color: "#2563eb", bg: "#dbeafe" },
  { level: 5,  title: "Kystmester",    minXp: 850,  color: "#7c3aed", bg: "#ede9fe" },
  { level: 6,  title: "Havekspert",    minXp: 1300, color: "#9333ea", bg: "#f3e8ff" },
  { level: 7,  title: "Kystnavigator", minXp: 1900, color: "#c026d3", bg: "#fae8ff" },
  { level: 8,  title: "Havforsker",    minXp: 2700, color: "#e11d48", bg: "#ffe4e6" },
  { level: 9,  title: "Kystlegende",   minXp: 3700, color: "#ea580c", bg: "#ffedd5" },
  { level: 10, title: "Havvokter",     minXp: 5000, color: "#d97706", bg: "#fef3c7" },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  const progressPct = next
    ? Math.min(100, ((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  const xpIntoLevel = xp - current.minXp;
  const xpNeeded = next ? next.minXp - current.minXp : 0;
  return { current, next, progressPct, xpIntoLevel, xpNeeded };
}
