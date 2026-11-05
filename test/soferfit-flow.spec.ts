import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page, Response } from "@playwright/test";

type UserProfile = {
  label: string;
  age: number;
  height: number;
  weight: number;
  targetWeight: number | null;
  somatotype: string;
  goal: string;
  experience: string;
  activity: string;
  equipment: string;
  challengeDays: 60 | 90;
  workoutDays: number;
  sessionMinutes: "15" | "30" | "45" | "60";
  targetTimeline: string;
  hasCondition: boolean;
};

const profiles: UserProfile[] = [
  { label: "starter-home", age: 20, height: 160, weight: 55, targetWeight: 52, somatotype: "Ectomorph", goal: "Lose Fat & Get Lean", experience: "Starting Out", activity: "Sedentary", equipment: "Bodyweight / Home Only", challengeDays: 60, workoutDays: 2, sessionMinutes: "15", targetTimeline: "By day 60", hasCondition: false },
  { label: "gym-strength", age: 34, height: 182, weight: 88, targetWeight: null, somatotype: "Mesomorph", goal: "Build Muscle & Strength", experience: "Consistent", activity: "Very Active", equipment: "Full Gym Access", challengeDays: 90, workoutDays: 5, sessionMinutes: "60", targetTimeline: "Whole challenge", hasCondition: false },
  { label: "bands-recomposition", age: 29, height: 168, weight: 71, targetWeight: 68, somatotype: "Endomorph", goal: "Body Recomposition", experience: "Some Experience", activity: "Sometimes Active", equipment: "Dumbbells & Bands", challengeDays: 60, workoutDays: 3, sessionMinutes: "30", targetTimeline: "First 30 days", hasCondition: false },
  { label: "active-gym", age: 42, height: 175, weight: 92, targetWeight: 84, somatotype: "Not Sure", goal: "Lose Fat & Get Lean", experience: "Some Experience", activity: "Moderately Active", equipment: "Full Gym Access", challengeDays: 90, workoutDays: 4, sessionMinutes: "45", targetTimeline: "By day 90", hasCondition: false },
  { label: "home-muscle", age: 25, height: 170, weight: 64, targetWeight: null, somatotype: "Mesomorph", goal: "Build Muscle & Strength", experience: "Starting Out", activity: "Sometimes Active", equipment: "Bodyweight / Home Only", challengeDays: 60, workoutDays: 3, sessionMinutes: "30", targetTimeline: "Whole challenge", hasCondition: false },
  { label: "older-low-impact", age: 58, height: 165, weight: 78, targetWeight: 74, somatotype: "Endomorph", goal: "Body Recomposition", experience: "Consistent", activity: "Sedentary", equipment: "Dumbbells & Bands", challengeDays: 90, workoutDays: 2, sessionMinutes: "45", targetTimeline: "By day 90", hasCondition: true },
  { label: "lean-cardio", age: 31, height: 177, weight: 69, targetWeight: 66, somatotype: "Ectomorph", goal: "Lose Fat & Get Lean", experience: "Some Experience", activity: "Very Active", equipment: "Bodyweight / Home Only", challengeDays: 60, workoutDays: 6, sessionMinutes: "15", targetTimeline: "First 30 days", hasCondition: false },
  { label: "gym-recomposition", age: 47, height: 172, weight: 83, targetWeight: null, somatotype: "Not Sure", goal: "Body Recomposition", experience: "Starting Out", activity: "Moderately Active", equipment: "Full Gym Access", challengeDays: 90, workoutDays: 4, sessionMinutes: "60", targetTimeline: "Whole challenge", hasCondition: false },
  { label: "bands-cardio", age: 37, height: 158, weight: 62, targetWeight: 58, somatotype: "Endomorph", goal: "Lose Fat & Get Lean", experience: "Consistent", activity: "Sometimes Active", equipment: "Dumbbells & Bands", challengeDays: 60, workoutDays: 5, sessionMinutes: "30", targetTimeline: "By day 60", hasCondition: false },
  { label: "home-recomposition", age: 23, height: 188, weight: 96, targetWeight: 90, somatotype: "Mesomorph", goal: "Body Recomposition", experience: "Some Experience", activity: "Very Active", equipment: "Bodyweight / Home Only", challengeDays: 90, workoutDays: 3, sessionMinutes: "45", targetTimeline: "By day 90", hasCondition: true },
];

const apiBase = process.env.VITE_API_URL?.replace(/\/+$/, "");
const apiPrefix = apiBase ? new URL(apiBase).pathname.replace(/\/+$/, "") : "";

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function clickChoice(dialog: ReturnType<Page["locator"]>, label: string) {
  await dialog.getByRole("button", {
    name: new RegExp(`^${escapedRegExp(label)}(?:\\s|$)`),
  }).click();
}

async function apiCall(
  request: APIRequestContext,
  token: string | undefined,
  route: string,
  method: "GET" | "POST",
  expectedStatus: number,
  data?: Record<string, unknown>,
) {
  if (!apiBase) throw new Error("VITE_API_URL is required for backend assertions.");
  const response = await request.fetch(`${apiBase}${route}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
    timeout: 15_000,
  });
  expect(response.status(), `${method} ${route}`).toBe(expectedStatus);
  return response.json();
}

async function completeSignup(page: Page, profile: UserProfile, email: string, password: string, responses: Response[]) {
  let browserAlert: string | null = null;
  page.on("response", (response) => responses.push(response));
  page.on("dialog", async (dialog) => {
    browserAlert = dialog.message();
    await dialog.dismiss();
  });

  await page.goto("/");
  await page.locator("nav.nav").getByRole("button", { name: "Sign up", exact: true }).click();

  const dialog = page.locator(".signup-modal[role='dialog']");
  await expect(page.locator(".signup-backdrop")).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.getByPlaceholder("Choose a username").fill(`Athlete ${profile.label}`);
  await dialog.getByPlaceholder("you@example.com").fill(email);
  await dialog.getByPlaceholder("Create a strong password").fill(password);
  await dialog.getByPlaceholder("24").fill(String(profile.age));
  await dialog.getByPlaceholder("175 cm").fill(String(profile.height));
  await dialog.getByPlaceholder("68 kg").fill(String(profile.weight));
  await dialog.getByRole("button", { name: "Next", exact: true }).click();

  await expect(dialog.getByRole("heading", { name: "Tell us about your starting point." })).toBeVisible();
  await clickChoice(dialog, profile.somatotype);
  await dialog.getByRole("button", { name: profile.goal, exact: true }).click();
  await dialog.getByRole("button", { name: profile.experience, exact: true }).click();
  await dialog.getByRole("button", { name: profile.activity, exact: true }).click();
  await dialog.getByRole("button", { name: profile.equipment, exact: true }).click();
  if (profile.targetWeight !== null) {
    await dialog.getByPlaceholder("62 kg").fill(String(profile.targetWeight));
  }
  await dialog.getByLabel("Target Timeline Focus").selectOption(profile.targetTimeline);
  if (profile.hasCondition) {
    await dialog.getByLabel("I have an injury or health condition").check();
  }
  await dialog.getByRole("button", { name: "Next", exact: true }).click();

  await expect(dialog.getByRole("heading", { name: "Build your weekly rhythm." })).toBeVisible();
  await dialog.getByRole("button", { name: new RegExp(`${profile.challengeDays}-Day Challenge`) }).click();
  await dialog.getByRole("button", { name: `${profile.workoutDays} days`, exact: true }).click();
  await dialog.getByLabel("Session duration").selectOption(profile.sessionMinutes);
  await dialog.getByRole("button", { name: "Next", exact: true }).click();

  await expect(dialog.getByRole("heading", { name: "Review your transformation profile." })).toBeVisible();
  await dialog.getByRole("button", { name: "Generate My Plan", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Your challenge is ready." })).toBeVisible({ timeout: 20_000 });
  expect(browserAlert, "Signup must not show a backend error").toBeNull();

  return dialog;
}

test.describe("SoferFit multi-user full-stack flows", () => {
  test.describe.configure({ mode: "parallel" });

  for (const profile of profiles) {
    test(`${profile.label}: registers, personalizes a plan, and checks account data`, async ({ page, request }, testInfo) => {
      test.setTimeout(60_000);
      const email = `e2e-${profile.label}-${testInfo.workerIndex}-${randomUUID()}@example.test`;
      const password = "SecurePass123!";
      const responses: Response[] = [];

      const dialog = await completeSignup(page, profile, email, password, responses);
      const registration = responses.find((response) =>
        response.request().method() === "POST"
        && new URL(response.url()).pathname.endsWith("/register/"),
      );
      const onboarding = responses.find((response) =>
        response.request().method() === "PUT"
        && new URL(response.url()).pathname.endsWith("/me/onboarding/"),
      );

      if (apiBase) {
        expect(registration, "Django registration response was not observed").toBeDefined();
        expect(onboarding, "Django onboarding response was not observed").toBeDefined();
        if (!registration || !onboarding) throw new Error("Required Django responses were not captured.");

        expect(new URL(registration.url()).pathname).toBe(`${apiPrefix}/register/`);
        expect(registration.status()).toBe(201);
        expect(registration.request().postDataJSON()).toEqual({ email, password });

        expect(new URL(onboarding.url()).pathname).toBe(`${apiPrefix}/me/onboarding/`);
        expect(onboarding.status()).toBe(200);
        expect(onboarding.request().postDataJSON()).toMatchObject({
          age: profile.age,
          height: profile.height,
          current_weight: profile.weight,
          target_weight: profile.targetWeight,
          body_type: profile.somatotype,
          fitness_level: profile.experience,
          fitness_goal: profile.goal,
          exercise_frequency: profile.workoutDays,
          workout_duration: profile.sessionMinutes,
          available_equipment: profile.equipment,
          challenge_choice: profile.challengeDays,
          activity_level: profile.activity,
          unit_system: "metric",
          target_timeline: profile.targetTimeline,
          injury_status: profile.hasCondition ? "Injury or health condition reported" : "",
        });

        const accessToken = await page.evaluate(() => localStorage.getItem("access_token"));
        expect(accessToken, "Registration should persist its JWT access token").toBeTruthy();
        if (!accessToken) throw new Error("No access token was stored after registration.");

        const loginTokens = await apiCall(request, undefined, "/login/", "POST", 200, { email, password }) as {
          access: string;
          refresh: string;
        };
        expect(loginTokens.access).toBeTruthy();
        expect(loginTokens.refresh).toBeTruthy();
        const refreshedTokens = await apiCall(request, undefined, "/token/refresh/", "POST", 200, {
          refresh: loginTokens.refresh,
        }) as { access: string };
        expect(refreshedTokens.access).toBeTruthy();

        const currentUser = await apiCall(request, accessToken, "/me/", "GET", 200) as { email: string };
        expect(currentUser.email).toBe(email);

        const savedProfile = await apiCall(request, accessToken, "/me/onboarding/", "GET", 200) as Record<string, unknown>;
        expect(savedProfile).toMatchObject({
          age: profile.age,
          height: profile.height,
          current_weight: profile.weight,
          target_weight: profile.targetWeight,
          body_type: profile.somatotype,
          exercise_frequency: profile.workoutDays,
          challenge_choice: profile.challengeDays,
          activity_level: profile.activity,
        });

        await apiCall(request, accessToken, "/workouts/programs/recommended/", "GET", 200);
        const initialSessions = await apiCall(request, accessToken, "/workouts/sessions/", "GET", 200) as unknown[];
        expect(initialSessions).toHaveLength(0);
        const initialProgress = await apiCall(request, accessToken, "/workouts/progress/", "GET", 200) as unknown[];
        expect(initialProgress).toHaveLength(0);

        const createdSession = await apiCall(
          request,
          accessToken,
          "/workouts/sessions/",
          "POST",
          201,
          {
            workout: null,
            duration_minutes: 1,
            is_completed: true,
            effort: "3",
            exercises_done: [`E2E ${profile.label}`],
          },
        ) as { id: number; is_completed: boolean };
        expect(createdSession.id).toBeTruthy();
        expect(createdSession.is_completed).toBe(true);

        const sessions = await apiCall(request, accessToken, "/workouts/sessions/", "GET", 200) as Array<{ id: number }>;
        expect(sessions.some((session) => session.id === createdSession.id)).toBe(true);

        const progress = await apiCall(
          request,
          accessToken,
          "/workouts/progress/",
          "POST",
          201,
          { weight: profile.weight, notes: `E2E ${email}` },
        ) as { id: number; weight: number };
        expect(progress.id).toBeTruthy();
        expect(progress.weight).toBe(profile.weight);
        const progressEntries = await apiCall(request, accessToken, "/workouts/progress/", "GET", 200) as Array<{ weight: number; notes: string }>;
        expect(progressEntries.some((entry) => entry.weight === profile.weight && entry.notes === `E2E ${email}`)).toBe(true);
      } else {
        expect(registration).toBeUndefined();
        expect(onboarding).toBeUndefined();
      }

      await dialog.getByRole("button", { name: "Dashboard" }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("navigation", { name: "Dashboard navigation" })).toBeVisible();
      await expect(page.getByText("Day 1", { exact: true }).first()).toBeVisible();

      const dashboardNav = page.getByRole("navigation", { name: "Dashboard navigation" });
      await dashboardNav.getByRole("button", { name: "Overview" }).click();
      await expect(page.getByRole("heading", { name: "Keep your rhythm, Athlete." })).toBeVisible();

      await dashboardNav.getByRole("button", { name: "Workouts" }).click();
      await expect(page.getByRole("heading", { name: "My workouts" })).toBeVisible();
      await page.getByRole("tab", { name: "History" }).click();
      await expect(page.getByRole("heading", { name: "Your finished workouts will show up here." })).toBeVisible();

      await dashboardNav.getByRole("button", { name: "Profile" }).click();
      await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    });
  }
});
