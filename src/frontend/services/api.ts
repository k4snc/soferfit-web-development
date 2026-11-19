import { parseHeightCm, parseWeightKg } from "../lib/format";
import type { PlannedWorkout } from "../fitnessStore";
import type { UnitSystem } from "../types";

export type SavedWorkoutPlan = {
  startDate: string;
  durationDays: 60 | 90;
  daysPerWeek: number;
  sessionMinutes: number;
  schedule: PlannedWorkout[];
};

type ApiPlannedWorkout = Omit<PlannedWorkout, "targetTags" | "lowImpact"> & {
  target_tags: string[];
  low_impact?: boolean;
};

type ApiSavedWorkoutPlan = {
  start_date: string;
  duration_days: 60 | 90;
  days_per_week: number;
  session_minutes: number;
  schedule: ApiPlannedWorkout[];
};

export type OnboardingProfile = {
  name: string;
  age: string;
  height: string;
  currentWeight: string;
  targetWeight?: string;
  unitSystem?: UnitSystem;
  somatotype: string;
  goal: string;
  experience: string;
  activity?: string;
  workoutDays: string;
  sessionLength: string;
  focusArea: string;
  mode: string;
  equipment: string;
  challengeDays: 60 | 90;
  targetTimeline?: string;
  hasCondition?: boolean;
};

export type Member = {
  id: string | number;
  email: string;
  profile?: OnboardingProfile;
  createdAt: string;
};

export type FitnessProfile = {
  age: number | null;
  height: number | null;
  current_weight: number | null;
  target_weight: number | null;
  bmi: number | null;
  body_type: string;
  fitness_level: string;
  fitness_goal: string;
  exercise_frequency: number;
  workout_duration: string;
  available_equipment: string;
  challenge_choice: number;
  activity_level: string;
  unit_system: UnitSystem;
  target_timeline: string;
  injury_status: string;
};

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const STORAGE_KEY = "soferfit-member";
const ACCESS_TOKEN_KEY = "access_token";
//const REFRESH_TOKEN_KEY = "refresh_token";
// Token handling moved to HttpOnly cookies – no Authorization header needed
// The browser will automatically include cookies on same‑origin requests.

const REFRESH_TOKEN_KEY = "refresh_token";

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "ApiError";
  }
}

// Token handling moved to HttpOnly cookies – no Authorization header needed
// The browser will automatically include cookies on same‑origin requests.
function formatErrorValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(formatErrorValue).filter(Boolean).join(", ");
  }
  return "";
}

function getHttpErrorMessage(data: unknown, status: number): string {
  if (status >= 500) return "The server encountered a problem. Please try again later.";

  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const payload = data as Record<string, unknown>;
    const detail = formatErrorValue(payload.detail);
    if (detail) return detail;

    const fieldErrors = Object.entries(payload)
      .map(([field, errors]) => {
        const message = formatErrorValue(errors);
        return message ? `${field}: ${message}` : "";
      })
      .filter(Boolean)
      .join(" | ");
    if (fieldErrors) return fieldErrors;
  }

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested API endpoint was not found. Check the URL and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  return "We couldn't process your request. Please check the information and try again.";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.");
  }

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new ApiError("The server returned an invalid response. Please try again.", response.status);
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(getHttpErrorMessage(data, response.status), response.status);
  }

  return data as T;
}

function readLocalMember(): Member | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Member) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function fromApiPlan(plan: ApiSavedWorkoutPlan): SavedWorkoutPlan {
  return {
    startDate: plan.start_date,
    durationDays: plan.duration_days,
    daysPerWeek: plan.days_per_week,
    sessionMinutes: plan.session_minutes,
    schedule: plan.schedule.map(({ target_tags, low_impact, ...workout }) => ({
      ...workout,
      targetTags: target_tags,
      ...(low_impact === undefined ? {} : { lowImpact: low_impact }),
    })),
  };
}

function toApiPlan(plan: SavedWorkoutPlan): ApiSavedWorkoutPlan {
  return {
    start_date: plan.startDate,
    duration_days: plan.durationDays,
    days_per_week: plan.daysPerWeek,
    session_minutes: plan.sessionMinutes,
    schedule: plan.schedule.map(({ targetTags, lowImpact, ...workout }) => ({
      ...workout,
      target_tags: targetTags,
      ...(lowImpact === undefined ? {} : { low_impact: lowImpact }),
    })),
  };
}

export const api = {
  isBackendConfigured(): boolean {
    return Boolean(API_URL);
  },

  async getSavedWorkoutPlan(): Promise<SavedWorkoutPlan | null> {
    if (!API_URL) throw new Error("The backend is not configured.");
    const response = await request<{ plan: ApiSavedWorkoutPlan | null }>("/workouts/plan/");
    return response.plan ? fromApiPlan(response.plan) : null;
  },

  async saveWorkoutPlan(plan: SavedWorkoutPlan): Promise<void> {
    if (!API_URL) throw new Error("The backend is not configured.");
    await request<{ plan: ApiSavedWorkoutPlan }>("/workouts/plan/", {
      method: "PUT",
      body: JSON.stringify(toApiPlan(plan)),
    });
  },

  async register(email: string, password: string): Promise<Member> {
    if (API_URL) {
      const data = await request<{ access?: string; refresh?: string; user?: Member } | Member>("/register/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if ("access" in data && data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      }
      if ("refresh" in data && data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      const member = "user" in data && data.user ? data.user : (data as Member);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
      return member;
    }
    
    // Local fallback
    const member: Member = {
      id: crypto.randomUUID(),
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    return member;
  },

  async login(email: string, password: string): Promise<Member> {
    if (API_URL) {
      const data = await request<{ access: string; refresh: string; user?: Member }>("/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      }
      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      const member = data.user ?? { id: 1, email, createdAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
      return member;
    }

    const member: Member = {
      id: crypto.randomUUID(),
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    return member;
  },

  async saveOnboarding(profile: OnboardingProfile): Promise<FitnessProfile> {
    const unitSystem = profile.unitSystem ?? "metric";
    const data = {
      age: Number(profile.age),
      height: parseHeightCm(profile.height, unitSystem),
      current_weight: parseWeightKg(profile.currentWeight, unitSystem),
      target_weight: profile.targetWeight ? parseWeightKg(profile.targetWeight, unitSystem) : null,
      body_type: profile.somatotype,
      fitness_level: profile.experience,
      fitness_goal: profile.goal,
      exercise_frequency: Number(profile.workoutDays),
      workout_duration: profile.sessionLength,
      available_equipment: profile.equipment,
      challenge_choice: profile.challengeDays,
      activity_level: profile.activity ?? "",
      unit_system: unitSystem,
      target_timeline: profile.targetTimeline ?? "",
      injury_status: profile.hasCondition ? "Injury or health condition reported" : "",
    };

    if (API_URL) {
      return request<FitnessProfile>("/me/onboarding/", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    }

    const current = readLocalMember() ?? {
      id: crypto.randomUUID(),
      email: "demo@soferfit.local",
      createdAt: new Date().toISOString(),
    };
    const member = { ...current, profile };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    return data as unknown as FitnessProfile;
  },

  async getMember(): Promise<Member | null> {
    if (API_URL) return request<Member>("/me/");
    return readLocalMember();
  },

  async deleteAccount(): Promise<boolean> {
    if (API_URL) {
      await request("/me/", { method: "DELETE" });
    }

    let cleared = true;
    for (const key of [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, STORAGE_KEY]) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear ${key} after account deletion:`, error);
        cleared = false;
      }
    }
    return cleared;
  },

  async getTodayWorkout(): Promise<any> {
    if (API_URL) {
      return request<any>("/workouts/workouts/today/");
    }
    return null;
  },

  async postSession(sessionData: {
    workoutId: string;
    date: string;
    duration: number;
    exercisesDone: string[];
    effort: number;
    note?: string;
    distance?: number;
    isCompleted?: boolean;
  }): Promise<any> {
    if (API_URL) {
      const workoutId = /^\d+$/.test(sessionData.workoutId) ? Number(sessionData.workoutId) : null;
      return request("/workouts/sessions/", {
        method: "POST",
        body: JSON.stringify({
          workout: workoutId,
          duration_minutes: sessionData.duration,
          exercises_done: sessionData.exercisesDone,
          effort: String(sessionData.effort),
          is_completed: sessionData.isCompleted ?? true,
        }),
      });
    }
    return { success: true };
  },

  async logout(): Promise<void> {
    if (API_URL) {
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      try {
        await request("/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // Proceed with local cleanup even if request fails
      }
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
  },
};
