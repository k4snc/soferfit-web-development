import type { Gender, Muscle, Orientation } from "../types";

export interface MusclePathItem {
  key: string;
  muscle: Muscle;
  d: string;
}

// Path definitions mapped by Gender and Orientation
export const musclePathMap: Record<Gender, Record<Orientation, MusclePathItem[]>> = {
  Man: {
    Front: [
      { key: "chest", muscle: "Chest", d: "M99 98c10-6 16-5 21 1v34c-13 1-24-4-29-13Zm42 0c-10-6-16-5-21 1v34c13 1 24-4 29-13Z" },
      { key: "shoulders", muscle: "Shoulders", d: "M77 88c9-10 18-13 31-13l7 18-25 13Zm86 0c-9-10-18-13-31-13l-7 18 25 13Z" },
      { key: "biceps", muscle: "Biceps", d: "M70 106c8-5 15 1 14 10l-6 38-15-3 4-34Zm100 0c-8-5-15 1-14 10l6 38 15-3-4-34Z" },
      { key: "forearms", muscle: "Forearms", d: "M61 154l15 5-13 48-15-4Zm118 0l-15 5 13 48 15-4Z" },
      { key: "core", muscle: "Core", d: "M103 137c11 3 23 3 34 0l-2 59h-30Z" },
      { key: "quads", muscle: "Quads", d: "M91 207c8-6 18-7 27-2l-8 91-24-2Zm58 0c-8-6-18-7-27-2l8 91 24-2Z" },
      { key: "calves", muscle: "Calves", d: "M86 302h24l-5 80H89Zm68 0h-24l5 80h16Z" }
    ],
    Back: [
      { key: "upper-back", muscle: "Upper Back", d: "M95 85c15-8 35-8 50 0l15 65-40 15-40-15Z" },
      { key: "shoulders-back", muscle: "Shoulders", d: "M77 88c9-10 18-13 31-13l-7 18-24-5Zm86 0c-9-10-18-13-31-13l7 18 24-5Z" },
      { key: "triceps", muscle: "Triceps", d: "M70 104c9-3 15 3 13 12l-7 39-15-5 5-34Zm100 0c-9-3-15 3-13 12l7 39 15-5-5-34Z" },
      { key: "lower-back", muscle: "Lower Back", d: "M103 150c11 3 23 3 34 0l-2 45h-30Z" },
      { key: "hamstring", muscle: "Hamstring", d: "M91 207c8-6 18-7 27-2l-8 91-24-2Zm58 0c-8-6-18-7-27-2l8 91 24-2Z" },
      { key: "calves-back", muscle: "Calves", d: "M86 302h24l-5 80H89Zm68 0h-24l5 80h16Z" }
    ]
  },
  Woman: {
    Front: [
      { key: "chest-w", muscle: "Chest", d: "M97 98c11-5 17-4 23 2v32c-12 1-22-3-27-11Zm46 0c-11-5-17-4-23 2v32c12 1 22-3 27-11Z" },
      { key: "shoulders-w", muscle: "Shoulders", d: "M75 86c10-9 19-12 33-12l6 17-24 12Zm90 0c-10-9-19-12-33-12l-6 17 24 12Z" },
      { key: "biceps-w", muscle: "Biceps", d: "M67 109c7-4 13 1 12 9l-5 35-13-3 6-31Z" },
      { key: "forearms-w", muscle: "Forearms", d: "M59 152l13 4-11 44-13-3Z" },
      { key: "core-w", muscle: "Core", d: "M101 135c12 3 26 3 38 0l-3 57h-32Z" },
      { key: "quads-w", muscle: "Quads", d: "M89 205c9-5 19-6 29-1l-7 88-26-2Zm62 0c-9-5-19-6-29-1l7 88 26-2Z" },
      { key: "calves-w", muscle: "Calves", d: "M84 300h22l-4 78H87Zm72 0h-22l4 78h14Z" }
    ],
    Back: [
      { key: "upper-back-w", muscle: "Upper Back", d: "M93 83c16-7 38-7 54 0l13 62-40 14-40-14Z" },
      { key: "shoulders-back-w", muscle: "Shoulders", d: "M75 86c10-9 19-12 33-12l-6 17-23-5Zm90 0c-10-9-19-12-33-12l6 17 23-5Z" },
      { key: "triceps-w", muscle: "Triceps", d: "M67 107c8-3 13 3 11 11l-6 36-13-4 8-33Z" },
      { key: "lower-back-w", muscle: "Lower Back", d: "M101 148c12 2 26 2 38 0l-3 43h-32Z" },
      { key: "hamstring-w", muscle: "Hamstring", d: "M89 205c9-5 19-6 29-1l-7 88-26-2Zm62 0c-9-5-19-6-29-1l7 88 26-2Z" },
      { key: "calves-back-w", muscle: "Calves", d: "M84 300h22l-4 78H87Zm72 0h-22l4 78h14Z" }
    ]
  }
};