export const atmospheres = [
  {
    id: "pearl",
    name: "Pearl",
    note: "Cool light. Clear mind.",
    background: "#e9eae7",
    ink: "#292c32",
    accent: "#506662",
    colors: [
      [0.62, 0.75, 0.69],
      [0.92, 0.77, 0.62],
      [0.36, 0.47, 0.64],
    ],
  },
  {
    id: "dusk",
    name: "Dusk",
    note: "The space between day and night.",
    background: "#e6e7ed",
    ink: "#2c3044",
    accent: "#626dab",
    colors: [
      [0.35, 0.44, 0.88],
      [0.97, 0.62, 0.42],
      [0.59, 0.36, 0.67],
    ],
  },
  {
    id: "ember",
    name: "Ember",
    note: "A little warmth, held in the light.",
    background: "#ede3db",
    ink: "#45372e",
    accent: "#a95c36",
    colors: [
      [0.81, 0.39, 0.17],
      [1.0, 0.81, 0.48],
      [0.46, 0.25, 0.34],
    ],
  },
] as const;
export type AtmosphereId = (typeof atmospheres)[number]["id"];
export type IrisValue = { atmosphere: AtmosphereId; intensity: number };
export const defaultIrisValue: IrisValue = {
  atmosphere: "dusk",
  intensity: 72,
};
export const clampIntensity = (v: number) =>
  Math.max(0, Math.min(100, Number.isFinite(v) ? Math.round(v) : 72));
