export type MotionTuning = { tempo: number; radius: number };
export const defaultTuning: MotionTuning = { tempo: 1, radius: 12 };
export const motionPresets = [
  { name: "Crisp", tempo: 1.3, radius: 8, description: "Quick and compact" },
  { name: "Balanced", tempo: 1, radius: 12, description: "The original feel" },
  {
    name: "Soft",
    tempo: 0.75,
    radius: 18,
    description: "A more relaxed settle",
  },
] as const;
export function normalizeTuning(value: Partial<MotionTuning>): MotionTuning {
  return {
    tempo: Number.isFinite(value.tempo)
      ? Math.max(0.6, Math.min(1.6, value.tempo!))
      : 1,
    radius: Number.isFinite(value.radius)
      ? Math.max(0, Math.min(24, value.radius!))
      : 12,
  };
}
