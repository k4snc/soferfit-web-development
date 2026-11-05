export type Muscle =
  | "Chest"
  | "Upper Chest"
  | "Shoulders"
  | "Front Deltoid"
  | "Rear Deltoid"
  | "Biceps"
  | "Triceps"
  | "Forearms"
  | "Latissimus Dorsi"
  | "Core"
  | "Upper Abs"
  | "Lower Abs"
  | "Obliques"
  | "Upper Trapezius"
  | "Lower Trapezius"
  | "Quads"
  | "Hamstring"
  | "Calves"
  | "Gluteal"
  | "Lower Back";

export type Gender = "Man" | "Woman";

export type Orientation = "Front" | "Back";

export type TrainingMode = "Fat Loss & Cardio" | "HIIT" | "Muscle & Strength";

export type Equipment = "No Equipment / Bodyweight" | "Gym Equipment";

export type UnitSystem = "metric" | "imperial";

export type Goal = "Lose Fat & Get Lean" | "Build Muscle & Strength" | "Body Recomposition";

export type Experience = "Starting Out" | "Some Experience" | "Consistent";

export type Activity = "Sedentary" | "Sometimes Active" | "Moderately Active" | "Very Active";

export type SignupEquipment = "Bodyweight / Home Only" | "Dumbbells & Bands" | "Full Gym Access";

export type SignupAnswers = {
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  unitSystem: UnitSystem;
  focusArea: Muscle | "Full Body";
  mode: TrainingMode;
  equipment: Equipment;
  age: string;
  height: string;
  weight: string;
  somatotype: string;
  goal: Goal | "";
  experience: Experience | "";
  activity: Activity | "";
  targetWeight: string;
  targetTimeline: string;
  availableEquipment: SignupEquipment | "";
  hasCondition: boolean;
  challengeDays: 60 | 90 | null;
  workoutDays: number | null;
  sessionMinutes: number | null;
  sessionChoice: "" | "15" | "30" | "45" | "60" | "custom";
  customSessionMinutes: string;
  challengeStartDate: string;
};