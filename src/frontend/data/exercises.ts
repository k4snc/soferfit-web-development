import type { Equipment, Muscle } from "../types";

export const exercises: Record<Muscle, { bodyweight: string; gym: string; level: string; reps: string }[]> = {
  "Upper Chest": [
    { bodyweight: "Incline push-up", gym: "Incline dumbbell press", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Decline push-up", gym: "Incline barbell press", level: "Intermediate", reps: "4 × 8" },
    { bodyweight: "Feet-elevated push-up", gym: "Low-to-high cable fly", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Pike-to-push-up", gym: "Incline machine press", level: "Intermediate", reps: "3 × 10" },
  ],
  Chest: [
    { bodyweight: "Tempo push-up", gym: "Dumbbell bench press", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Incline push-up", gym: "Incline press", level: "Intermediate", reps: "4 × 8" },
    { bodyweight: "Wide push-up", gym: "Cable fly", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Plank push-up", gym: "Chest press", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Knee push-up", gym: "Pec deck", level: "Beginner", reps: "3 × 12" },
  ],
  Shoulders: [
    { bodyweight: "Pike push-up", gym: "Arnold press", level: "Beginner", reps: "3 × 8" },
    { bodyweight: "Wall walk", gym: "Shoulder press", level: "Intermediate", reps: "4 × 10" },
    { bodyweight: "Arm circles", gym: "Lateral raise", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Plank shoulder tap", gym: "Front raise", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Down-dog press", gym: "Face pull", level: "Intermediate", reps: "4 × 12" },
  ],
  "Front Deltoid": [
    { bodyweight: "Pike push-up", gym: "Dumbbell front raise", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Wall handstand hold", gym: "Seated shoulder press", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Down-dog shoulder press", gym: "Cable front raise", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Incline pike push-up", gym: "Landmine press", level: "Intermediate", reps: "3 × 10" },
  ],
  "Rear Deltoid": [
    { bodyweight: "Prone reverse snow angel", gym: "Reverse pec deck", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Bent-over arm raise", gym: "Bent-over dumbbell reverse fly", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Prone Y-T raise", gym: "Cable rear-delt fly", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Reverse plank reach", gym: "Face pull", level: "Intermediate", reps: "3 × 12" },
  ],
  "Latissimus Dorsi": [
    { bodyweight: "Doorway row", gym: "Lat pulldown", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Prone lat pull-down", gym: "Seated cable row", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Inverted row", gym: "Single-arm dumbbell row", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Towel row", gym: "Assisted pull-up", level: "Intermediate", reps: "3 × 8" },
  ],
  Biceps: [
    { bodyweight: "Self-resisted curl", gym: "Dumbbell curl", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Towel curl", gym: "Cable curl", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Chin-up hold", gym: "Preacher curl", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Reverse plank pull", gym: "Hammer curl", level: "Intermediate", reps: "4 × 10" },
  ],
  Triceps: [
    { bodyweight: "Diamond push-up", gym: "Cable pushdown", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Bench dip", gym: "Skull crusher", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Close-grip push-up", gym: "Overhead extension", level: "Intermediate", reps: "4 × 8" },
    { bodyweight: "Triceps floor press", gym: "Close-grip bench press", level: "Intermediate", reps: "3 × 10" },
  ],
  Forearms: [
    { bodyweight: "Fingertip plank", gym: "Wrist curl", level: "Beginner", reps: "3 × 20s" },
    { bodyweight: "Towel squeeze", gym: "Reverse wrist curl", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Bear crawl hold", gym: "Farmer carry", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Knuckle plank", gym: "Plate pinch", level: "Intermediate", reps: "3 × 20s" },
  ],
  Core: [
    { bodyweight: "Dead bug", gym: "Cable crunch", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Hollow hold", gym: "Weighted sit-up", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Bicycle crunch", gym: "Cable woodchop", level: "Intermediate", reps: "4 × 12" },
    { bodyweight: "Forearm plank", gym: "Ab rollout", level: "Beginner", reps: "3 × 40s" },
    { bodyweight: "Lying knee raise", gym: "Hanging knee raise", level: "Advanced", reps: "3 × 10" },
  ],
  "Upper Abs": [
    { bodyweight: "Crunch", gym: "Cable crunch", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Dead bug", gym: "Weighted crunch", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Hollow-body crunch", gym: "Decline sit-up", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Toe-touch crunch", gym: "Ab-crunch machine", level: "Intermediate", reps: "3 × 12" },
  ],
  "Lower Abs": [
    { bodyweight: "Reverse crunch", gym: "Hanging knee raise", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Lying leg raise", gym: "Captain's-chair knee raise", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Dead bug", gym: "Hanging leg raise", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Mountain climber", gym: "Decline bench leg raise", level: "Intermediate", reps: "3 × 30s" },
  ],
  Obliques: [
    { bodyweight: "Side plank", gym: "Cable woodchop", level: "Beginner", reps: "3 × 30s" },
    { bodyweight: "Bicycle crunch", gym: "Pallof press", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Side-plank hip dip", gym: "Dumbbell side bend", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Cross-body mountain climber", gym: "Landmine rotation", level: "Intermediate", reps: "3 × 12" },
  ],
  "Upper Trapezius": [
    { bodyweight: "Scapular push-up", gym: "Dumbbell shrug", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Prone Y raise", gym: "Barbell shrug", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Wall slide", gym: "Cable shrug", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Bear-crawl shoulder shrug", gym: "Farmer carry", level: "Intermediate", reps: "3 × 30s" },
  ],
  "Lower Trapezius": [
    { bodyweight: "Prone Y raise", gym: "Incline bench Y raise", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Wall slide with lift-off", gym: "Cable Y raise", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Scapular wall slide", gym: "Prone incline trap raise", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Quadruped Y raise", gym: "Face pull to overhead reach", level: "Intermediate", reps: "3 × 10" },
  ],
  "Lower Back": [
    { bodyweight: "Bird dog", gym: "Back extension", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Glute bridge", gym: "Romanian deadlift", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Superman hold", gym: "Cable pull-through", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Hip hinge", gym: "45-degree back extension", level: "Intermediate", reps: "3 × 12" },
  ],
  Quads: [
    { bodyweight: "Air squat", gym: "Goblet squat", level: "Beginner", reps: "4 × 10" },
    { bodyweight: "Reverse lunge", gym: "Barbell reverse lunge", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Wall sit", gym: "Leg extension", level: "Intermediate", reps: "3 × 15" },
    { bodyweight: "Split squat", gym: "Weighted split squat", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Stair step-up", gym: "Box step-up", level: "Beginner", reps: "3 × 12" },
  ],
  Calves: [
    { bodyweight: "Standing raise", gym: "Smith machine raise", level: "Beginner", reps: "4 × 15" },
    { bodyweight: "Seated raise", gym: "Seated calf machine", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Pogo jump", gym: "Weighted pogo jump", level: "Athletic", reps: "3 × 30s" },
    { bodyweight: "Single-leg raise", gym: "Leg press calf raise", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Tiptoe walk", gym: "Farmer walk", level: "Beginner", reps: "3 × 40s" },
  ],
  Gluteal: [
    { bodyweight: "Glute bridge", gym: "Hip thrust", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Single-leg glute bridge", gym: "Barbell hip thrust", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Donkey kick", gym: "Cable kickback", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Step-up", gym: "Dumbbell Bulgarian split squat", level: "Intermediate", reps: "3 × 10" },
  ],
  Hamstring: [
    { bodyweight: "Glute bridge walkout", gym: "Romanian deadlift", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Hamstring walkout", gym: "Seated leg curl", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Single-leg bridge", gym: "Lying leg curl", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Single-leg hip hinge", gym: "Dumbbell Romanian deadlift", level: "Intermediate", reps: "3 × 10" },
  ],
};

export const fullBodyExercises: Record<Equipment, { name: string; tag: string }[]> = {
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
};
