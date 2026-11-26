import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const apiBase = process.env.VITE_API_URL?.replace(/\/+$/, "");

test("account deletion revokes access and clears browser data", async ({ page, request }) => {
  test.skip(!apiBase, "VITE_API_URL is required for account deletion");

  const email = `delete-${randomUUID()}@example.test`;
  const registration = await request.post(`${apiBase}/register/`, {
    data: {
      email,
      password: "Secure-e2e-account-deletion-2026!",
    },
  });
  expect(registration.status()).toBe(201);
  const account = await registration.json() as {
    access: string;
    refresh: string;
    user: { id: number; email: string; createdAt: string };
  };

  await page.addInitScript((member) => {
    localStorage.setItem("soferfit-member", JSON.stringify(member.user));
    localStorage.setItem("access_token", member.access);
    localStorage.setItem("refresh_token", member.refresh);
    localStorage.setItem("soferfit-fitness-store-v1", JSON.stringify({ test: true }));
  }, account);

  await page.goto("/profile");
  const privacySection = page.locator("#profile-privacy-data");
  await privacySection.scrollIntoViewIfNeeded();
  await privacySection.getByRole("button", { name: "Delete my account" }).first().click();
  await privacySection.getByLabel("Type DELETE to confirm").fill("DELETE");
  await privacySection.getByRole("button", { name: "Delete my account" }).click();

  await expect(page.locator("nav.nav").getByRole("button", { name: "Sign up" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => [
    localStorage.getItem("soferfit-member"),
    localStorage.getItem("access_token"),
    localStorage.getItem("refresh_token"),
    localStorage.getItem("soferfit-fitness-store-v1"),
  ])).toEqual([null, null, null, null]);

  const currentUser = await request.get(`${apiBase}/me/`, {
    headers: { Authorization: `Bearer ${account.access}` },
  });
  expect(currentUser.status()).toBe(401);
});
