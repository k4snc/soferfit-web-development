import { expect, test } from "@playwright/test"

test("login uses the backend route and stores returned tokens", async ({
  page,
}) => {
  test.skip(!process.env.VITE_API_URL, "VITE_API_URL is required for API login")

  const email = "athlete@example.test"
  const password = "SecurePass123!"
  let requestBody: unknown

  await page.addInitScript(() => localStorage.clear())
  await page.route("**/api/login/", async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      contentType: "application/json",
      json: { access: "test-access-token", refresh: "test-refresh-token" },
    })
  })

  await page.goto("/")
  await page.getByRole("button", { name: "Log in", exact: true }).click()

  const dialog = page.getByRole("dialog", { name: "Log in" })
  await dialog.getByPlaceholder("you@example.com").fill(email)
  await dialog.getByPlaceholder("Enter your password").fill(password)
  await dialog.getByRole("button", { name: "Log in", exact: true }).click()

  await expect(dialog).toHaveCount(0)
  expect(requestBody).toEqual({ email, password })
  await expect
    .poll(() =>
      page.evaluate(() => ({
        access: localStorage.getItem("access_token"),
        refresh: localStorage.getItem("refresh_token"),
      })),
    )
    .toEqual({ access: "test-access-token", refresh: "test-refresh-token" })
})
