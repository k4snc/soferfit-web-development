export type OnboardingProfile = {
  name: string;
  age: string;
  height: string;
  currentWeight: string;
  somatotype: string;
  goal: string;
  experience: string;
  workoutDays: string;
  sessionLength: string;
  focusArea: string;
  mode: string;
  equipment: string;
  challengeDays: 60 | 90;
};

export type Member = {
  id: string;
  email: string;
  profile?: OnboardingProfile;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const STORAGE_KEY = "soferfit-member";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) throw new Error("We couldn't save your information. Please try again.");
  return response.json() as Promise<T>;
}

function readLocalMember(): Member | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) as Member : null;
}

export const api = {
  async register(email: string, password: string): Promise<Member> {
    if (API_URL) {
      return request<Member>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    }

    const member: Member = {
      id: crypto.randomUUID(),
      email,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    return member;
  },

  async saveOnboarding(profile: OnboardingProfile): Promise<Member> {
    if (API_URL) {
      return request<Member>("/me/onboarding", {
        method: "PUT",
        body: JSON.stringify(profile),
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
    if (API_URL) return request<Member>("/me");
    return readLocalMember();
  },

  async logout(): Promise<void> {
    if (API_URL) await request("/auth/logout", { method: "POST" });
    localStorage.removeItem(STORAGE_KEY);
  },
};
