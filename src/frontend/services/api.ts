import { parseHeightCm, parseWeightKg } from "../lib/format";
import type { UnitSystem } from "../types";

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

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const STORAGE_KEY = "soferfit-member";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error("We couldn't process your request. Please check your credentials or network.");
  }

  // Handle empty responses (e.g., 205 Reset Content / 204 No Content for logout)
  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

function readLocalMember(): Member | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Member) : null;
}

export const api = {
  async register(email: string, password: string): Promise<Member> {
    if (API_URL) {
      const data = await request<{ access?: string; refresh?: string; user?: Member } | Member>("/register/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      // If backend returns JWT tokens and user object, cache them
      if (data && typeof data === "object" && "access" in data && data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        if (data.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      return ("user" in data && data.user ? data.user : data) as Member;
    }

    const member: Member = {
      id: crypto.randomUUID(),
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    return member;
  },

  async login(email: string, password: string): Promise<{ access: string; refresh: string } | { success: true }> {
    if (API_URL) {
      // Django SimpleJWT login endpoint
      const data = await request<{ access: string; refresh: string }>("/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      }
      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      return data;
    }
    return { success: true };
  },

  async saveOnboarding(profile: OnboardingProfile): Promise<FitnessProfile | Member> {
    if (API_URL) {
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
    return member;
  },

  async getMember(): Promise<Member | null> {
    if (API_URL) return request<Member>("/me/");
    return readLocalMember();
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