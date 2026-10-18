export type Exercise = {
  name: string;
  prescription: string;
};

export type PlannedWorkout = {
  id: string;
  date: string;
  name: string;
  minutes: number;
  equipment: string;
  targetTags: string[];
  exercises: Exercise[];
  optional?: boolean;
  intensity?: "Easy" | "Moderate" | "Hard";
  lowImpact?: boolean;
  sets?: number;
};

export type FitnessStore = {
  user: {
    username: string;
    email: string;
    avatar: string;
    memberSince: string;
    age: string;
    height: string;
    weight: string;
    targetWeight: string;
    somatotype: string;
    goal: string;
    experience: string;
    activityLevel: string;
    unitSystem: "metric" | "imperial";
    equipment: string;
    injuryFlag: boolean;
  };
  preferences: {
    workoutReminders: boolean;
    reminderTime: string;
    streakReminders: boolean;
    weeklySummary: boolean;
  };
  challenge: {
    startDate: string;
    length: 60 | 90;
    daysPerWeek: number;
    sessionMinutes: number;
  };
  plan: PlannedWorkout[];
  sessions: {
    workoutId: string;
    date: string;
    duration: number;
    exercisesDone: string[];
    effort: number;
  }[];
  weights: {
    date: string;
    weight: number;
    measurements?: { waist?: number; chest?: number; hips?: number };
  }[];
  photos: { date: string; image: string; angle?: "Front" | "Side" | "Back" }[];
  badges: { id: string; name: string; unlocked: boolean; date?: string }[];
  aiGenerations: { usedCount: number; resetDate: string };
};

export type ProfileSeed = {
  name?: string;
  email?: string;
  avatarUrl?: string;
  age?: string;
  height?: string;
  weight?: string;
  targetWeight?: string;
  somatotype?: string;
  goal?: string;
  experience?: string;
  activity?: string;
  unitSystem?: "metric" | "imperial";
  availableEquipment?: string;
  hasCondition?: boolean;
  challengeStartDate?: string;
  challengeDays?: 60 | 90 | null;
  workoutDays?: number | null;
  sessionMinutes?: number | null;
};

const STORE_KEY = "soferfit-fitness-store-v1";
const dayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const workoutTemplates = [
  {
    name: "Full Body Conditioning",
    tags: ["Full body", "Conditioning"],
    exercises: ["Marching warm-up", "Air squats", "Incline push-ups", "Reverse lunges", "Plank shoulder taps", "Glute bridges", "Mountain climbers", "Dead bug"],
  },
  {
    name: "Walk-Run Intervals",
    tags: ["Cardio", "Run"],
    exercises: ["Brisk walk warm-up", "Easy run interval", "Recovery walk", "Steady run", "Recovery walk", "Fast finish", "Cool-down walk", "Calf stretch"],
  },
  {
    name: "Lower Body & Core",
    tags: ["Lower body", "Core"],
    exercises: ["Hip circles", "Tempo squats", "Reverse lunges", "Single-leg bridges", "Wall sit", "Forearm plank", "Bird dog", "Dead bug"],
  },
  {
    name: "HIIT Circuit",
    tags: ["HIIT", "Full body"],
    exercises: ["Jumping jacks", "Squat thrusts", "High knees", "Push-ups", "Skater steps", "Mountain climbers", "Plank jacks", "Breathing reset"],
  },
] as const;

const recoveryTemplate = {
  name: "Active Recovery & Stretch",
  tags: ["Recovery", "Mobility"],
  exercises: ["Easy walk", "Cat-cow", "World's greatest stretch", "Hip flexor stretch", "Hamstring fold", "Thoracic rotation", "Child's pose", "Box breathing"],
};

function buildPlan(startDate: string, length: number, daysPerWeek: number, minutes: number): PlannedWorkout[] {
  const start = new Date(`${startDate}T12:00:00`);
  const result: PlannedWorkout[] = [];
  let workoutIndex = 0;

  for (let offset = 0; offset < length; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const weekday = (date.getDay() + 6) % 7;
    if (weekday < daysPerWeek) {
      const template = workoutTemplates[workoutIndex % workoutTemplates.length];
      result.push({
        id: `plan-${offset}`,
        date: dayKey(date),
        name: template.name,
        minutes,
        equipment: "Bodyweight / Home",
        targetTags: [...template.tags],
        exercises: template.exercises.map((name) => ({ name, prescription: template.name.includes("Intervals") ? "3 minutes" : "40 sec · 20 sec rest" })),
        intensity: "Moderate",
        sets: 3,
      });
      workoutIndex += 1;
    } else if (weekday === 5) {
      result.push({
        id: `recovery-${offset}`,
        date: dayKey(date),
        name: recoveryTemplate.name,
        minutes: Math.min(30, minutes),
        equipment: "Bodyweight / Home",
        targetTags: [...recoveryTemplate.tags],
        exercises: recoveryTemplate.exercises.map((name) => ({ name, prescription: "45 sec · easy pace" })),
        optional: true,
        intensity: "Easy",
        sets: 2,
      });
    }
  }
  return result;
}

export function createFitnessStore(profile: ProfileSeed = {}): FitnessStore {
  const startDate = profile.challengeStartDate?.slice(0, 10) || dayKey(new Date());
  const length = profile.challengeDays ?? 60;
  const daysPerWeek = profile.workoutDays ?? 4;
  const sessionMinutes = profile.sessionMinutes ?? 60;
  return {
    user: {
      username: profile.name || "SoferFit Member",
      email: profile.email || "",
      avatar: profile.avatarUrl || "",
      memberSince: dayKey(new Date()),
      age: profile.age || "",
      height: profile.height || "",
      weight: profile.weight || "",
      targetWeight: profile.targetWeight || "",
      somatotype: profile.somatotype || "",
      goal: profile.goal || "",
      experience: profile.experience || "",
      activityLevel: profile.activity || "",
      unitSystem: profile.unitSystem || "metric",
      equipment: profile.availableEquipment || "Bodyweight / Home Only",
      injuryFlag: Boolean(profile.hasCondition),
    },
    preferences: {
      workoutReminders: true,
      reminderTime: "18:00",
      streakReminders: true,
      weeklySummary: true,
    },
    challenge: { startDate, length, daysPerWeek, sessionMinutes },
    plan: buildPlan(startDate, length, daysPerWeek, sessionMinutes),
    sessions: [],
    weights: [],
    photos: [],
    badges: [
      { id: "streak-3", name: "3-day streak", unlocked: false },
      { id: "streak-7", name: "7-day streak", unlocked: false },
      { id: "streak-14", name: "14-day streak", unlocked: false },
      { id: "streak-30", name: "30-day streak", unlocked: false },
      { id: "workout-1", name: "First workout", unlocked: false },
      { id: "workout-10", name: "10 workouts", unlocked: false },
      { id: "workout-25", name: "25 workouts", unlocked: false },
      { id: "workout-50", name: "50 workouts", unlocked: false },
      { id: "week-1", name: "Week 1 done", unlocked: false },
      { id: "halfway", name: "Halfway", unlocked: false },
      { id: "finish", name: "Finish line", unlocked: false },
      { id: "weight-1", name: "First weigh-in", unlocked: false },
      { id: "photo-1", name: "First photo", unlocked: false },
    ],
    aiGenerations: { usedCount: 0, resetDate: dayKey(new Date(Date.now() + 7 * 86_400_000)) },
  };
}

export function readFitnessStore(profile?: ProfileSeed | null): FitnessStore {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FitnessStore;
      const defaults = createFitnessStore(profile ?? {});
      const savedBadges = new Map((parsed.badges ?? []).map((badge) => [badge.id, badge]));
      const canonicalExercises = ["Bodyweight squats", "Incline push-ups", "Glute bridges", "Reverse lunges", "Mountain climbers", "Plank", "Bird dog", "Step jacks"];
      return {
        ...defaults,
        ...parsed,
        user: { ...defaults.user, ...parsed.user },
        preferences: { ...defaults.preferences, ...parsed.preferences },
        challenge: { ...defaults.challenge, ...parsed.challenge },
        plan: (parsed.plan ?? defaults.plan).map((workout) => ({
          ...workout,
          intensity: workout.intensity ?? (workout.name.includes("Recovery") ? "Easy" : "Moderate"),
          exercises: workout.exercises.map((exercise, index) => /variation/i.test(exercise.name) ? { ...exercise, name: canonicalExercises[index % canonicalExercises.length] } : exercise),
        })),
        sessions: parsed.sessions ?? [],
        weights: parsed.weights ?? [],
        photos: parsed.photos ?? [],
        badges: defaults.badges.map((badge) => savedBadges.get(badge.id) ?? badge),
        aiGenerations: { ...defaults.aiGenerations, ...parsed.aiGenerations },
      };
    }
  } catch {
    // A clean store is safer than blocking the member area when storage is unavailable.
  }
  return createFitnessStore(profile ?? {});
}

export function writeFitnessStore(store: FitnessStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function clearFitnessStore() {
  localStorage.removeItem(STORE_KEY);
}
