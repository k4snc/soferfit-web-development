import { expect, test } from "@playwright/test"

test("detailed front and back muscles select matching routines", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  const frontRegions = [
    "Shoulders",
    "Chest",
    "Biceps",
    "Forearms",
    "Obliques",
    "Core & Abs",
    "Quadriceps",
    "Tibialis",
  ]

  for (const region of frontRegions) {
    await expect(page.getByRole("button", { name: region, exact: true })).toHaveCount(1)
  }

const shouldersPath = page.getByRole("button", {
  name: "Shoulders",
  exact: true,
})

const manChestPath = await page
  .getByRole("button", { name: "Chest", exact: true })
  .getAttribute("d")

  const defaultFill = await shouldersPath.evaluate(
    (path) => getComputedStyle(path).fill,
  )

  const hoverPoint = await shouldersPath.evaluate((path) => {
    if (!(path instanceof SVGPathElement)) {
      throw new Error("Muscle region is not an SVG path")
    }
    const bounds = path.getBBox()
    const matrix = path.getScreenCTM()
    if (!matrix) throw new Error("Muscle region has no screen transform")

    for (let row = 1; row < 20; row += 1) {
      for (let column = 1; column < 20; column += 1) {
        const point = new DOMPoint(
          bounds.x + (bounds.width * column) / 20,
          bounds.y + (bounds.height * row) / 20,
        )
        if (path.isPointInFill(point)) {
          return {
            x: matrix.a * point.x + matrix.c * point.y + matrix.e,
            y: matrix.b * point.x + matrix.d * point.y + matrix.f,
          }
        }
      }
    }

    throw new Error("No point found inside muscle region")
  })

  await page.mouse.move(hoverPoint.x, hoverPoint.y)
  await expect
    .poll(() => shouldersPath.evaluate((path) => getComputedStyle(path).fill))
    .not.toBe(defaultFill)
  await expect(shouldersPath).toHaveCSS("fill-opacity", "1")
  await page.mouse.move(0, 0)

// Capture Man's hair path before switching
  const manHairPath = await page
    .locator('[data-muscle="hair"] path')
    .first()
    .getAttribute("d")

  // Switch to Woman and verify female geometry + ponytail hair path
  await page.getByRole("button", { name: "Woman", exact: true }).click()
const womanChestPath = await page
  .getByRole("button", { name: "Chest", exact: true })
  .getAttribute("d")
  expect(womanChestPath).not.toBe(manChestPath)
  await expect(page.locator('[data-muscle="hair"]')).toHaveCount(1)
  const womanHairPath = await page
    .locator('[data-muscle="hair"] path')
    .first()
    .getAttribute("d")
  expect(womanHairPath).not.toBe(manHairPath)

  // Switch back to Man, then Woman again
  await page.getByRole("button", { name: "Man", exact: true }).click()
  await expect(page.locator('[data-muscle="hair"] path').first()).toHaveAttribute(
    "d",
    manHairPath ?? "",
  )
  await page.getByRole("button", { name: "Woman", exact: true }).click()
  await expect(page.locator('[data-muscle="hair"] path').first()).toHaveAttribute(
    "d",
    womanHairPath ?? "",
  )

  // Select Chest via keyboard Enter
  const chest = page.getByRole("button", { name: "Chest", exact: true })
  await chest.focus()
  await page.keyboard.press("Enter")

  await expect(page.locator(".routine-state-head h3")).toHaveText("Chest")
  await expect(chest).toHaveAttribute("aria-pressed", "true")

  // Switch orientation to Back
  await page
    .locator(".focus-orientation-row")
    .getByRole("button", { name: "Back", exact: true })
    .click()
  await expect(page.locator('[data-muscle="hair"]')).toHaveCount(1)

  const backRegions = [
    "Shoulders",
    "Trapezius",
    "Triceps",
    "Forearms",
    "Lower Back",
    "Upper Back & Lats",
    "Glutes",
    "Hamstrings",
    "Calves",
  ]

  for (const region of backRegions) {
    await expect(page.getByRole("button", { name: region, exact: true })).toHaveCount(1)
  }

  const trapezius = page.getByRole("button", { name: "Trapezius", exact: true })
  await trapezius.click()

  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Upper Trapezius",
  )
  await expect(trapezius).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Generate workout routine" }).click()
  await expect(page.locator(".routine-results")).toBeVisible()
})

test("multiple muscle groups combine, deduplicate, and can be removed", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  const biceps = page.getByRole("button", { name: "Biceps", exact: true })
  await biceps.click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Biceps")
  await expect(page.locator(".selected-muscle")).toHaveCount(1)

  // Clicking Biceps again toggles it off
  await biceps.click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "No focus area selected",
  )

  await biceps.click()
  await page.getByRole("button", { name: "Remove Biceps focus" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "No focus area selected",
  )

  await page.getByRole("button", { name: "Full Body", exact: true }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Full Body")
  await expect(page.locator(".selected-muscle")).toHaveCount(0)
  await page.getByRole("button", { name: "Full Body", exact: true }).click()

  const chest = page.getByRole("button", { name: "Chest", exact: true })
  const core = page.getByRole("button", { name: "Core & Abs", exact: true })
  await chest.click()
  await core.click()

  await expect(page.locator(".routine-state-head h3")).toHaveText("Chest + Core")
  await expect(chest).toHaveAttribute("aria-pressed", "true")
  await expect(core).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator(".selected-muscle")).toHaveCount(2)

  await page.getByRole("button", { name: "Generate workout routine" }).click()
  await expect(page.locator(".routine-results")).toBeVisible()
  await expect(page.locator(".routine-results-head")).toContainText(
    "Chest + Core",
  )
})

test("suggests Full Body for broad coverage without changing focus automatically", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  await page.getByRole("button", { name: "Chest", exact: true }).click()
  await page.getByRole("button", { name: "Core & Abs", exact: true }).click()
  await page.getByRole("button", { name: "Biceps", exact: true }).click()
  await page.getByRole("button", { name: "Quadriceps", exact: true }).click()

  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Core + Biceps + Quads",
  )
  const suggestion = page.getByRole("status")
  await expect(suggestion).toContainText("upper body, core, and lower body")
  await expect(suggestion).toContainText(
    "Choose Full Body if you want one broad session",
  )
  await expect(
    suggestion.getByRole("button", { name: "Switch to Full Body" }),
  ).toBeVisible()
  await expect(page.locator(".selected-muscle")).toHaveCount(4)

  await suggestion.getByRole("button", { name: "Switch to Full Body" }).click()

  await expect(page.locator(".routine-state-head h3")).toHaveText("Full Body")
  await expect(
    page.getByRole("button", { name: "Full Body", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator(".selected-muscle")).toHaveCount(0)
  await expect(page.getByRole("status")).toHaveCount(0)
})

test("mobile focus and split controls fit the viewport and work by keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true)

  const splits = page.getByRole("group", { name: "Training split" })
  const ppl = splits.getByRole("button", { name: "Push/Pull/Legs" })
  await ppl.focus()
  await page.keyboard.press("Space")
  await expect(ppl).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("group", { name: "Split session" })).toBeVisible()

  const biceps = page.getByRole("button", { name: "Biceps", exact: true })
  await biceps.focus()
  await page.keyboard.press("Space")
  await expect(biceps).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator(".routine-state-head h3")).toContainText("Biceps")
  await expect(page.locator(".selected-muscles")).toHaveAttribute(
    "role",
    "list",
  )
  await expect(page.locator(".sr-only")).toContainText("Biceps")
})

test("split presets load editable muscle targets for each session", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  await page.getByRole("button", { name: "Push/Pull/Legs" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Front Deltoid + Triceps",
  )
  await expect(
    page.getByRole("group", { name: "Split session" }).getByRole("button", {
      name: "Push",
    }),
  ).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Pull", exact: true }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Upper Lats + Mid Lats + Lower Lats + Upper Trapezius + Mid Trapezius + Lower Trapezius + Rear Deltoid + Biceps + Forearms + Lower Back",
  )
  await expect(
    page.getByRole("button", { name: "Remove Upper Lats focus" }),
  ).toBeVisible()

  await page
    .locator(".focus-orientation-row")
    .getByRole("button", { name: "Back", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Upper Back & Lats", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.getByRole("button", { name: "Lower Back", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator(".split-session-status")).toHaveText("Active session: Pull")
  await expect(page.locator(".split-guidance")).toContainText(
    "Switching sessions replaces your current selections, including map edits.",
  )

  await page.getByRole("button", { name: "Upper/Lower" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Front Deltoid + Rear Deltoid + Upper Lats + Mid Lats + Lower Lats + Upper Trapezius + Mid Trapezius + Lower Trapezius + Biceps + Triceps + Forearms",
  )
  await expect(
    page.getByRole("group", { name: "Split session" }).getByRole("button", {
      name: "Upper",
    }),
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Lower", exact: true }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Quads + Hamstring + Gluteal + Calves + Lower Back",
  )

  await page.getByRole("button", { name: "Custom", exact: true }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Quads + Hamstring + Gluteal + Calves + Lower Back",
  )
  await expect(page.getByRole("group", { name: "Split session" })).toHaveCount(0)
})

test("back map targets lats and traps and generates matching routines", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()
  await page
    .locator(".focus-orientation-row")
    .getByRole("button", { name: "Back", exact: true })
    .click()

  const upperBack = page.getByRole("button", {
    name: "Upper Back & Lats",
    exact: true,
  })
  await upperBack.click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Upper Lats")
  await expect(upperBack).toHaveAttribute("aria-pressed", "true")

  const trapezius = page.getByRole("button", {
    name: "Trapezius",
    exact: true,
  })
  await trapezius.click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Upper Lats + Upper Trapezius",
  )
  await expect(trapezius).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Generate workout routine" }).click()
  await expect(page.locator(".routine-results")).toBeVisible()
})