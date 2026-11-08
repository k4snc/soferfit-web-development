import { expect, test } from "@playwright/test"

test("detailed front and back muscles select matching routines", async ({
  page,
}) => {
  await page.goto("/")

  await page.locator("#explore").scrollIntoViewIfNeeded()

  const frontRegions = [
    "Left Shoulder (Front)",

    "Left Upper Chest (Clavicular)",

    "Left Lower Chest (Sternal)",

    "Left Biceps",

    "Left Forearm",

    "Left External Oblique",

    "Left Abs (Upper)",

    "Left Lower Abs",

    "Left Quadriceps",

    "Left Tibialis Anterior",
  ]

  for (const region of frontRegions) {
    await expect(page.getByRole("button", { name: region })).toHaveCount(1)
  }

  const firstFrontRegion = page.getByRole("button", {
    name: "Left Shoulder (Front)",
  })

  const frontPath = await firstFrontRegion.getAttribute("d")
  const defaultFill = await firstFrontRegion.evaluate(
    (path) => getComputedStyle(path).fill,
  )
  const hoverPoint = await firstFrontRegion.evaluate((path) => {
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
    .poll(() =>
      firstFrontRegion.evaluate((path) => getComputedStyle(path).fill),
    )
    .not.toBe(defaultFill)
  await expect(firstFrontRegion).toHaveCSS("fill-opacity", "1")
  await page.mouse.move(0, 0)

  await page.getByRole("button", { name: "Woman", exact: true }).click()

  await expect(firstFrontRegion).toHaveAttribute("d", frontPath ?? "")
  await expect(page.locator(".gender-hair-detail")).toHaveCount(1)
  await expect(page.locator(".gender-hair-detail")).toHaveAttribute(
    "aria-hidden",
    "true",
  )
  await expect(page.locator(".gender-hair-detail path").nth(1)).toHaveAttribute(
    "transform",
    "translate(31.8 0) scale(-1 1)",
  )

  await page.getByRole("button", { name: "Man", exact: true }).click()
  await expect(page.locator(".gender-hair-detail")).toHaveCount(0)
  await page.getByRole("button", { name: "Woman", exact: true }).click()
  await expect(page.locator(".gender-hair-detail")).toHaveCount(1)

  const upperChest = page.getByRole("button", {
    name: "Left Upper Chest (Clavicular)",
  })

  await upperChest.focus()

  await page.keyboard.press("Enter")

  await expect(page.locator(".routine-state-head h3")).toHaveText("Upper Chest")

  await expect(upperChest).toHaveAttribute("aria-pressed", "true")

  await page
    .locator(".focus-orientation-row")
    .getByRole("button", { name: "Back", exact: true })
    .click()
  await expect(page.locator(".gender-hair-detail")).toHaveCount(1)

  const backRegions = [
    "Left Rear Deltoid",

    "Left Trapezius (Upper)",

    "Left Trapezius (Mid)",

    "Left Triceps (Long Head)",

    "Forearm Flexors Left",

    "Erector Spinae Left",

    "Left Lats (Upper)",

    "Gluteus Maximus Left",

    "Medial Hamstrings (Semis) Left",

    "Gastrocnemius Medial Left",
  ]

  for (const region of backRegions) {
    await expect(page.getByRole("button", { name: region })).toHaveCount(1)
  }

  const upperTrapezius = page.getByRole("button", {
    name: "Left Trapezius (Upper)",
  })

  await upperTrapezius.click()

  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Upper Chest + Upper Trapezius",
  )

  await expect(upperTrapezius).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.getByRole("button", { name: "Left Trapezius (Mid)" }),
  ).toHaveAttribute("aria-pressed", "false")
  await expect(
    page.getByRole("button", { name: "Left Trapezius (Lower)" }),
  ).toHaveAttribute("aria-pressed", "false")

  await page.getByRole("button", { name: "Generate workout routine" }).click()

  await expect(page.locator(".routine-results")).toBeVisible()

  await expect(
    page.locator(".result-card .exercise-name strong").first(),
  ).toHaveText("Incline push-up")
})

test("multiple muscle groups combine, deduplicate, and can be removed", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  await page.getByRole("button", { name: "Left Biceps" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Biceps")
  await expect(page.locator(".selected-muscle")).toHaveCount(1)

  await page.getByRole("button", { name: "Right Biceps" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "No focus area selected",
  )

  await page.getByRole("button", { name: "Left Biceps" }).click()
  await page.getByRole("button", { name: "Remove Biceps focus" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "No focus area selected",
  )

  await page.getByRole("button", { name: "Full Body", exact: true }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Full Body")
  await expect(page.locator(".selected-muscle")).toHaveCount(0)
  await page.getByRole("button", { name: "Full Body", exact: true }).click()

  const chest = page.getByRole("button", {
    name: "Left Lower Chest (Sternal)",
  })
  const upperAbs = page.getByRole("button", { name: "Left Abs (Upper)" })
  await chest.click()
  await upperAbs.click()

  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Upper Abs",
  )
  await expect(chest).toHaveAttribute("aria-pressed", "true")
  await expect(upperAbs).toHaveAttribute("aria-pressed", "true")
  await expect(page.locator(".selected-muscle")).toHaveCount(2)

  await page.getByRole("button", { name: "Generate workout routine" }).click()
  await expect(page.locator(".routine-results")).toBeVisible()
  await expect(page.locator(".routine-results-head")).toContainText(
    "Chest + Upper Abs",
  )
  await expect(
    page.locator(".result-card .exercise-name strong"),
  ).toContainText(["Tempo push-up", "Crunch"])
  await expect(page.locator(".muscle-tag")).toContainText([
    "Chest",
    "Upper Abs",
  ])
})

test("suggests Full Body for broad coverage without changing focus automatically", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()

  await page.getByRole("button", { name: "Left Lower Chest (Sternal)" }).click()
  await page.getByRole("button", { name: "Left Abs (Upper)" }).click()
  await page.getByRole("button", { name: "Left Biceps" }).click()
  await page.getByRole("button", { name: "Left Quadriceps" }).click()

  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Chest + Upper Abs + Biceps + Quads",
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
  await expect(page.getByRole("button", { name: "Full Body", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
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

  const biceps = page.getByRole("button", { name: "Left Biceps" })
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
  await expect(page.getByRole("button", { name: "Left Lats (Upper)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  await expect(page.getByRole("button", { name: "Erector Spinae Left" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
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

test("back map targets upper, middle, and lower lats and traps separately", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("#explore").scrollIntoViewIfNeeded()
  await page
    .locator(".focus-orientation-row")
    .getByRole("button", { name: "Back", exact: true })
    .click()

  await page.getByRole("button", { name: "Left Lats (Upper)" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText("Upper Lats")
  await expect(page.getByRole("button", { name: "Left Lats (Upper)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  await expect(page.getByRole("button", { name: "Left Lats (Mid)" })).toHaveAttribute(
    "aria-pressed",
    "false",
  )
  await expect(page.getByRole("button", { name: "Left Lats (Lower)" })).toHaveAttribute(
    "aria-pressed",
    "false",
  )

  await page.getByRole("button", { name: "Left Trapezius (Mid)" }).click()
  await expect(page.locator(".routine-state-head h3")).toHaveText(
    "Upper Lats + Mid Trapezius",
  )
  await expect(
    page.getByRole("button", { name: "Left Trapezius (Mid)" }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.getByRole("button", { name: "Left Trapezius (Upper)" }),
  ).toHaveAttribute("aria-pressed", "false")
  await expect(
    page.getByRole("button", { name: "Left Trapezius (Lower)" }),
  ).toHaveAttribute("aria-pressed", "false")

  await page.getByRole("button", { name: "Generate workout routine" }).click()
  await expect(page.locator(".routine-results")).toBeVisible()
  await expect(
    page.locator(".result-card .exercise-name strong"),
  ).toContainText(["Assisted pull-up", "Prone T raise"])
  await expect(page.locator(".muscle-tag")).toContainText([
    "Upper Lats",
    "Mid Trapezius",
  ])
})
