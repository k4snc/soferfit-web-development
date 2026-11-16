import {
  BodyChart,
  getMuscleDef,
  MUSCLE_MAP,
  ViewSide,
} from "@emmorts/body-muscles"

import type { BodyState, MuscleId } from "@emmorts/body-muscles"

import { useEffect, useMemo, useRef, useState } from "react"

import type { Gender, Muscle, Orientation } from "../types"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const FRONT_HAIR_MIRROR_TRANSFORM = "translate(31.8 0) scale(-1 1)"
const WOMAN_HAIR_PATHS: Record<Orientation, string[]> = {
  Front: [
    "M12.1 3.2 C10.8 3.8 10.5 5.4 10.9 7.1 C11.2 8.5 10.6 10.1 10.5 11.6 C10.4 12.7 10.8 13.5 11.4 14 C11.8 12.7 11.9 11.2 11.9 9.8 L11.8 6.2 Z",
    "M12.1 3.2 C10.8 3.8 10.5 5.4 10.9 7.1 C11.2 8.5 10.6 10.1 10.5 11.6 C10.4 12.7 10.8 13.5 11.4 14 C11.8 12.7 11.9 11.2 11.9 9.8 L11.8 6.2 Z",
  ],
  Back: [
    "M49.1 2.4 C47.5 3.3 47.1 5.5 47.7 7.4 C48.2 9 47.6 10.7 47.9 12.2 C48.1 13.2 48.7 13.8 49.4 14 C49.8 12.2 49.7 10.3 49.5 8.5 L49.2 5.2 Z",
    "M55.9 2.4 C57.5 3.3 57.9 5.5 57.3 7.4 C56.8 9 57.4 10.7 57.1 12.2 C56.9 13.2 56.3 13.8 55.6 14 C55.2 12.2 55.3 10.3 55.5 8.5 L55.8 5.2 Z",
  ],
}

function focusForRegion(id: MuscleId): Muscle | null {
  if (id.startsWith("chest-upper-")) return "Upper Chest"

  if (id.startsWith("chest-lower-")) return "Chest"

  if (id.startsWith("abs-upper-")) return "Upper Abs"

  if (id.startsWith("abs-lower-")) return "Lower Abs"

  if (id.startsWith("obliques-") || id.startsWith("serratus-anterior-"))
    return "Obliques"

  if (id.startsWith("shoulder-front-")) return "Front Deltoid"

  if (id.startsWith("shoulder-side-")) return "Shoulders"

  if (id.startsWith("deltoid-rear-")) return "Rear Deltoid"

  if (id.startsWith("traps-upper-")) return "Upper Trapezius"

  if (id === "nape") return "Upper Trapezius"

  if (id.startsWith("traps-mid-")) return "Mid Trapezius"

  if (id.startsWith("traps-lower-")) return "Lower Trapezius"

  if (id.startsWith("biceps-")) return "Biceps"

  if (id.startsWith("triceps-")) return "Triceps"

  if (
    id.startsWith("forearm-") ||
    id.startsWith("elbow-") ||
    id.startsWith("hand-")
  ) {
    return "Forearms"
  }

  if (id.startsWith("lats-upper-")) return "Upper Lats"

  if (id.startsWith("lats-mid-")) return "Mid Lats"

  if (id.startsWith("lats-lower-")) return "Lower Lats"

  if (id.startsWith("lower-back-") || id === "spine") return "Lower Back"

  if (id.startsWith("gluteus-")) return "Gluteal"

  if (id.startsWith("hamstrings-") || id.startsWith("adductors-"))
    return "Hamstring"

  if (
    id.startsWith("calves-") ||
    id.startsWith("tibialis-") ||
    id.startsWith("foot-")
  ) {
    return "Calves"
  }

  if (id.startsWith("knee-back-")) return "Calves"

  if (
    id.startsWith("quads-") ||
    id.startsWith("hip-flexor-") ||
    id.startsWith("knee-")
  ) {
    return "Quads"
  }

  if (id.startsWith("neck-")) return "Shoulders"

  return null
}

function isSelectedFocus(
  regionFocus: Muscle | null,
  selected: Muscle[],
): boolean {
  if (!regionFocus || selected.length === 0) return false

  return selected.some((muscle) => {
    if (regionFocus === muscle) return true
    if (muscle === "Chest") return regionFocus === "Upper Chest"
    if (muscle === "Core") {
      return ["Upper Abs", "Lower Abs", "Obliques"].includes(regionFocus)
    }
    if (muscle === "Shoulders") {
      return [
        "Front Deltoid",
        "Rear Deltoid",
        "Upper Trapezius",
        "Mid Trapezius",
        "Lower Trapezius",
      ].includes(regionFocus)
    }
    return false
  })
}

function createBodyState(
  selected: Muscle[],
  fullBody: boolean,
): BodyState {
  const bodyState: BodyState = {}

  for (const { id } of MUSCLE_MAP) {
    if (fullBody || isSelectedFocus(focusForRegion(id), selected)) {
      bodyState[id] = { intensity: 0, selected: true }
    }
  }

  return bodyState
}

export function BodyMap({
  gender,

  orientation,

  selected,

  fullBody,

  disabled,

  onSelect,
}: {
  gender: Gender

  orientation: Orientation

  selected: Muscle[]

  fullBody: boolean

  disabled: boolean

  onSelect: (muscle: Muscle) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const chartRef = useRef<BodyChart | null>(null)

  const onSelectRef = useRef(onSelect)

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const bodyState = useMemo(
    () => createBodyState(selected, fullBody),
    [selected, fullBody],
  )

  const view = orientation === "Front" ? ViewSide.FRONT : ViewSide.BACK

  onSelectRef.current = onSelect

  useEffect(() => {
    if (!containerRef.current) return

    const chart = new BodyChart(containerRef.current, {
      view,

      bodyState,

      interactive: !disabled,

      showTooltip: false,

      ariaLabel: `${gender} ${orientation.toLowerCase()} muscle map`,

      intensityColor: () => "#85877d",

      onMuscleClick: (id) => {
        const muscle = focusForRegion(id)

        if (muscle) onSelectRef.current(muscle)
      },

      onMuscleHover: (id) => {
        setHoveredRegion(id ? (getMuscleDef(id)?.name ?? null) : null)
      },
    })

    chartRef.current = chart

    return () => {
      chart.destroy()

      chartRef.current = null
    }
  }, [disabled, orientation, view])

  useEffect(() => {
    chartRef.current?.update({
      bodyState,

      ariaLabel: `${gender} ${orientation.toLowerCase()} muscle map`,
    })
  }, [bodyState, gender, orientation])

  useEffect(() => {
    if (gender !== "Woman") return

    const svg = containerRef.current?.querySelector("svg.body-chart-svg")
    if (!svg)
      throw new Error("Body-map SVG is unavailable for the hair detail.")

    const background = svg.querySelector(".body-chart-background")
    if (!background)
      throw new Error("Body-map background is unavailable for the hair detail.")

    const hair = document.createElementNS(SVG_NAMESPACE, "g")
    hair.setAttribute("class", "gender-hair-detail")
    hair.setAttribute("aria-hidden", "true")
    hair.setAttribute("pointer-events", "none")

    WOMAN_HAIR_PATHS[orientation].forEach((pathData, index) => {
      const path = document.createElementNS(SVG_NAMESPACE, "path")
      path.setAttribute("d", pathData)
      if (orientation === "Front" && index === 1) {
        path.setAttribute("transform", FRONT_HAIR_MIRROR_TRANSFORM)
      }
      hair.appendChild(path)
    })

    svg.insertBefore(hair, background.nextSibling)

    return () => {
      hair.remove()
    }
  }, [gender, orientation])

  return (
    <div className="body-wrap">
      <div
        ref={containerRef}
        className={`body-map-chart body-${gender.toLowerCase()} ${
          disabled ? "is-disabled" : ""
        }`}
        aria-label={`${gender} muscle map`}
      />
      <span className={`map-hint ${selected.length > 0 || fullBody ? "hidden" : ""}`}>
        {hoveredRegion || "Choose a muscle group to focus your routine"}
      </span>
    </div>
  )
}
