import type { Equipment, Muscle } from "../types"

export const exercises: Record<Muscle, {
  bodyweight: string
  gym: string
  level: string
  reps: string
}[]> = {
  Chest: [
    {
      bodyweight: "Tempo push-up",
      gym: "Dumbbell bench press",
      level: "Beginner",
      reps: "3 × 10",
    },
    {
      bodyweight: "Incline push-up",
      gym: "Incline press",
      level: "Intermediate",
      reps: "4 × 8",
    },
    {
      bodyweight: "Wide push-up",
      gym: "Cable fly",
      level: "Intermediate",
      reps: "3 × 12",
    },
    {
      bodyweight: "Plank push-up",
      gym: "Chest press",
      level: "Intermediate",
      reps: "3 × 10",
    },
    {
      bodyweight: "Knee push-up",
      gym: "Pec deck",
      level: "Beginner",
      reps: "3 × 12",
    },
  ],
  Shoulders: [
    {
      bodyweight: "Pike push-up",
      gym: "Arnold press",
      level: "Beginner",
      reps: "3 × 8",
    },
    {
      bodyweight: "Wall walk",
      gym: "Shoulder press",
      level: "Intermediate",
      reps: "4 × 10",
    },
    {
      bodyweight: "Arm circles",
      gym: "Lateral raise",
      level: "Beginner",
      reps: "3 × 15",
    },
    {
      bodyweight: "Plank shoulder tap",
      gym: "Front raise",
      level: "Beginner",
      reps: "3 × 12",
    },
    {
      bodyweight: "Down-dog press",
      gym: "Face pull",
      level: "Intermediate",
      reps: "4 × 12",
    },
  ],
  Biceps: [
    {
      bodyweight: "Self-resisted curl",
      gym: "Dumbbell curl",
      level: "Beginner",
      reps: "3 × 12",
    },
    {
      bodyweight: "Towel curl",
      gym: "Cable curl",
      level: "Beginner",
      reps: "3 × 15",
    },
    {
      bodyweight: "Chin-up hold",
      gym: "Preacher curl",
      level: "Intermediate",
      reps: "3 × 30s",
    },
    {
      bodyweight: "Reverse plank pull",
      gym: "Hammer curl",
      level: "Intermediate",
      reps: "4 × 10",
    },
  ],
  Triceps: [
    {
      bodyweight: "Diamond push-up",
      gym: "Cable pushdown",
      level: "Intermediate",
      reps: "3 × 10",
    },
    {
      bodyweight: "Bench dip",
      gym: "Skull crusher",
      level: "Beginner",
      reps: "3 × 12",
    },
    {
      bodyweight: "Close-grip push-up",
      gym: "Overhead extension",
      level: "Intermediate",
      reps: "4 × 8",
    },
    {
      bodyweight: "Triceps floor press",
      gym: "Close-grip bench press",
      level: "Intermediate",
      reps: "3 × 10",
    },
  ],
  Forearms: [
    {
      bodyweight: "Fingertip plank",
      gym: "Wrist curl",
      level: "Beginner",
      reps: "3 × 20s",
    },
    {
      bodyweight: "Towel squeeze",
      gym: "Reverse wrist curl",
      level: "Beginner",
      reps: "3 × 15",
    },
    {
      bodyweight: "Bear crawl hold",
      gym: "Farmer carry",
      level: "Intermediate",
      reps: "3 × 30s",
    },
    {
      bodyweight: "Knuckle plank",
      gym: "Plate pinch",
      level: "Intermediate",
      reps: "3 × 20s",
    },
  ],
  Core: [
    {
      bodyweight: "Dead bug",
      gym: "Cable crunch",
      level: "Beginner",
      reps: "3 × 12",
    },
    {
      bodyweight: "Hollow hold",
      gym: "Weighted sit-up",
      level: "Intermediate",
      reps: "3 × 30s",
    },
    {
      bodyweight: "Bicycle crunch",
      gym: "Cable woodchop",
      level: "Intermediate",
      reps: "4 × 12",
    },
    {
      bodyweight: "Forearm plank",
      gym: "Ab rollout",
      level: "Beginner",
      reps: "3 × 40s",
    },
    {
      bodyweight: "Lying knee raise",
      gym: "Hanging knee raise",
      level: "Advanced",
      reps: "3 × 10",
    },
  ],
  Quads: [
    {
      bodyweight: "Air squat",
      gym: "Goblet squat",
      level: "Beginner",
      reps: "4 × 10",
    },
    {
      bodyweight: "Reverse lunge",
      gym: "Barbell reverse lunge",
      level: "Beginner",
      reps: "3 × 12",
    },
    {
      bodyweight: "Wall sit",
      gym: "Leg extension",
      level: "Intermediate",
      reps: "3 × 15",
    },
    {
      bodyweight: "Split squat",
      gym: "Weighted split squat",
      level: "Intermediate",
      reps: "3 × 10",
    },
    {
      bodyweight: "Stair step-up",
      gym: "Box step-up",
      level: "Beginner",
      reps: "3 × 12",
    },
  ],
  Calves: [
    {
      bodyweight: "Standing raise",
      gym: "Smith machine raise",
      level: "Beginner",
      reps: "4 × 15",
    },
    {
      bodyweight: "Seated raise",
      gym: "Seated calf machine",
      level: "Intermediate",
      reps: "3 × 12",
    },
    {
      bodyweight: "Pogo jump",
      gym: "Weighted pogo jump",
      level: "Athletic",
      reps: "3 × 30s",
    },
    {
      bodyweight: "Single-leg raise",
      gym: "Leg press calf raise",
      level: "Intermediate",
      reps: "3 × 12",
    },
    {
      bodyweight: "Tiptoe walk",
      gym: "Farmer walk",
      level: "Beginner",
      reps: "3 × 40s",
    },
  ],
}

export const fullBodyExercises: Record<Equipment, {
  name: string
  tag: string
}[]> = {
  "No Equipment / Bodyweight": [
    { name: "Push-up to shoulder tap", tag: "Push" },
    { name: "Prone snow angel", tag: "Pull" },
    { name: "Reverse lunge to knee drive", tag: "Legs" },
    { name: "Plank knee drive", tag: "Core" },
    { name: "Burpee", tag: "Full Body" },
  ],
  "Gym Equipment": [
    { name: "Dumbbell thruster", tag: "Push" },
    { name: "Cable row", tag: "Pull" },
    { name: "Goblet squat", tag: "Legs" },
    { name: "Cable woodchop", tag: "Core" },
    { name: "Kettlebell swing", tag: "Full Body" },
  ],
}
