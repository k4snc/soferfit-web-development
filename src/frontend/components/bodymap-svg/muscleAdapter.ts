import type { Muscle } from "../../types";

export type SvgSlug =
  | "chest" | "obliques" | "abs" | "biceps" | "triceps"
  | "neck" | "trapezius" | "deltoids" | "adductors"
  | "quadriceps" | "knees" | "tibialis" | "calves"
  | "forearm" | "hands" | "ankles" | "feet"
  | "head" | "hair" | "upper-back" | "lower-back"
  | "gluteal" | "hamstring";

export interface BodyPart {
  slug: SvgSlug;
  color: string;
  path: {
    common?: string[];
    left?: string[];
    right?: string[];
  };
}

export const SOFERFIT_TO_SVG_SLUG: Record<Muscle, SvgSlug> = {
  "Chest": "chest",
  "Upper Chest": "chest",
  "Shoulders": "deltoids",
  "Front Deltoid": "deltoids",
  "Rear Deltoid": "deltoids",
  "Biceps": "biceps",
  "Triceps": "triceps",
  "Forearms": "forearm",
  "Upper Lats": "upper-back",
  "Mid Lats": "upper-back",
  "Lower Lats": "lower-back",
  "Core": "abs",
  "Upper Abs": "abs",
  "Lower Abs": "abs",
  "Obliques": "obliques",
  "Upper Trapezius": "trapezius",
  "Mid Trapezius": "trapezius",
  "Lower Trapezius": "trapezius",
  "Quads": "quadriceps",
  "Hamstring": "hamstring",
  "Calves": "calves",
  "Gluteal": "gluteal",
  "Lower Back": "lower-back",
};

export const SVG_SLUG_TO_PRIMARY_MUSCLE: Partial<Record<SvgSlug, Muscle>> = {
  chest: "Chest",
  deltoids: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Forearms",
  "upper-back": "Upper Lats",
  "lower-back": "Lower Back",
  abs: "Core",
  obliques: "Obliques",
  trapezius: "Upper Trapezius",
  quadriceps: "Quads",
  hamstring: "Hamstring",
  calves: "Calves",
  gluteal: "Gluteal",
  adductors: "Hamstring",
  tibialis: "Calves",
  neck: "Upper Trapezius",
};

export const SVG_SLUG_LABELS: Partial<Record<SvgSlug, string>> = {
  chest: "Chest",
  deltoids: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Forearms",
  "upper-back": "Upper Back & Lats",
  "lower-back": "Lower Back",
  abs: "Core & Abs",
  obliques: "Obliques",
  trapezius: "Trapezius",
  quadriceps: "Quadriceps",
  hamstring: "Hamstrings",
  calves: "Calves",
  gluteal: "Glutes",
  adductors: "Adductors",
  tibialis: "Tibialis",
  neck: "Neck & Traps",
};