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
  photos: {
    date: string;
    image: string;
    angle?: "Front" | "Side" | "Back"
  }[];
  badges: {
    id: string;
    name: string;
    unlocked: boolean;
    date?: string
  }[];
  aiGenerations: {
    usedCount: number;
    resetDate: string;
  };
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

function buildPlan(startDateStr: string, lengthDays: number, daysPerWeek: number, sessionMinutes: number): PlannedWorkout[] {
  const result: PlannedWorkout[] = [];
  const start = new Date(`${startDateStr}T12:00:00`);
  if (isNaN(start.getTime())) return result;

  const templates = [
    { name: "Full Body Strength & Conditioning", tags: ["Strength", "Core"] },
    { name: "Cardio & Fat Loss Intervals", tags: ["Cardio", "HIIT"] },
    { name: "Lower Body Power & Mobility", tags: ["Legs", "Mobility"] },
    { name: "Upper Body Hypertrophy", tags: ["Push", "Pull"] },
    { name: "Core & Functional Endurance", tags: ["Core", "Full Body"] },
  ];

  const recoveryTemplate = { name: "Active Recovery & Stretching", tags: ["Mobility", "Recovery"], exercises: ["Plank", "Bird dog"] };

  for (let dayOffset = 0; dayOffset < lengthDays; dayOffset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + dayOffset);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    // Assign workout days based on daysPerWeek frequency
    const isWorkoutDay = (dayOffset % 7) < daysPerWeek && dayOfWeek !== 0;

    if (isWorkoutDay) {
      const template = templates[dayOffset % templates.length];
      result.push({
        id: `workout-${dayOffset + 1}`,
        date: dayKey(date),
        name: template.name,
        minutes: sessionMinutes,
        equipment: "Bodyweight / Home",
        targetTags: [...template.tags],
        exercises: [
          { name: "Bodyweight squats", prescription: "3 × 12 reps" },
          { name: "Incline push-ups", prescription: "3 × 10 reps" },
          { name: "Glute bridges", prescription: "3 × 15 reps" },
          { name: "Plank", prescription: "3 × 45 sec" },
        ],
        intensity: "Moderate",
        sets: 3,
      });
    } else if (dayOfWeek === 0) {
      result.push({
        id: `recovery-${dayOffset + 1}`,
        date: dayKey(date),
        name: recoveryTemplate.name,
        minutes: Math.min(30, sessionMinutes),
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
    aiGenerations: {
      usedCount: 0,
      resetDate: dayKey(new Date(Date.now() + 7 * 86_400_000)),
    },
  };
}

/**
 * Hardened readFitnessStore with safe JSON parsing and schema merging 
 * to prevent uncaught exceptions or crashes on corrupted local storage.
 */
export function readFitnessStore(profile?: ProfileSeed | null): FitnessStore {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        const defaults = createFitnessStore(profile ?? {});
        const savedBadges = new Map((parsed.badges ?? []).map((badge: any) => [badge.id, badge]));
        const canonicalExercises = ["Bodyweight squats", "Incline push-ups", "Glute bridges", "Reverse lunges", "Mountain climbers", "Plank", "Bird dog", "Step jacks"];

        return {
          ...defaults,
          ...parsed,
          user: { ...defaults.user, ...(parsed.user ?? {}) },
          preferences: { ...defaults.preferences, ...(parsed.preferences ?? {}) },
          challenge: { ...defaults.challenge, ...(parsed.challenge ?? {}) },
          plan: (parsed.plan ?? defaults.plan).map((workout: any) => ({
            ...workout,
            intensity: workout.intensity ?? (workout.name?.includes("Recovery") ? "Easy" : "Moderate"),
            exercises: (workout.exercises ?? []).map((exercise: any, index: number) =>
              /variation/i.test(exercise.name)
                ? { ...exercise, name: canonicalExercises[index % canonicalExercises.length] }
                : exercise
            ),
          })),
          sessions: parsed.sessions ?? [],
          weights: parsed.weights ?? [],
          photos: parsed.photos ?? [],
          badges: defaults.badges.map((badge) => savedBadges.get(badge.id) ?? badge),
          aiGenerations: { ...defaults.aiGenerations, ...(parsed.aiGenerations ?? {}) },
        };
      }
    }
  } catch (err) {
    console.error("Corrupted local store detected or storage unavailable, resetting to default:", err);
    clearFitnessStore();
  }
  return createFitnessStore(profile ?? {});
}

export function writeFitnessStore(store: FitnessStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("Failed to write fitness store to localStorage:", err);
  }
}

export function clearFitnessStore() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (err) {
    console.error("Failed to clear fitness store from localStorage:", err);
  }
}