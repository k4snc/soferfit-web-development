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
    .getByRole("button", { name: "Back" })
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
    "Upper Trapezius",
  )

  await expect(upperTrapezius).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Generate workout routine" }).click()

  await expect(page.locator(".routine-results")).toBeVisible()

  await expect(
    page.locator(".result-card .exercise-name strong").first(),
  ).toHaveText("Scapular push-up")
})
