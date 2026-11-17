import { expect, test } from "@playwright/test";
import { buildPlan } from "../src/frontend/fitnessStore";

function dayOffset(startDate: string, workoutDate: string) {
  const start = Date.parse(`${startDate}T12:00:00Z`);
  const date = Date.parse(`${workoutDate}T12:00:00Z`);
  return (date - start) / 86_400_000;
}

test("buildPlan schedules the requested frequency across full weeks", () => {
  const startDate = "2026-01-04";

  for (let frequency = 1; frequency <= 7; frequency++) {
    const plan = buildPlan(startDate, 56, frequency, 45);
    const trainingDays = plan.filter((workout) => !workout.optional);

    for (let week = 0; week < 8; week++) {
      const startOffset = week * 7;
      const weekCount = trainingDays.filter((workout) => {
        const offset = dayOffset(startDate, workout.date);
        return offset >= startOffset && offset < startOffset + 7;
      }).length;

      expect(weekCount, `${frequency} sessions in week ${week + 1}`).toBe(frequency);
    }
  }
});

test("four weekly sessions are spread with no more than two consecutive training days", () => {
  const plan = buildPlan("2026-01-04", 7, 4, 45);
  const offsets = new Set(
    plan
      .filter((workout) => !workout.optional)
      .map((workout) => dayOffset("2026-01-04", workout.date)),
  );
  let longestRun = 0;
  let currentRun = 0;

  for (let day = 0; day < 7; day++) {
    currentRun = offsets.has(day) ? currentRun + 1 : 0;
    longestRun = Math.max(longestRun, currentRun);
  }

  expect(offsets.size).toBe(4);
  expect(longestRun).toBeLessThanOrEqual(2);
});

test("buildPlan clamps invalid frequency and session duration inputs", () => {
  const plan = buildPlan("2026-01-04", 7, 0, 0);
  const trainingDays = plan.filter((workout) => !workout.optional);

  expect(trainingDays).toHaveLength(1);
  expect(trainingDays[0].minutes).toBe(5);
});
