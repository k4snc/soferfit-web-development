import { useMemo, useState } from "react";
import type { Gender, Muscle, Orientation } from "../types";
import {
  type BodyPart,
  SOFERFIT_TO_SVG_SLUG,
  SVG_SLUG_LABELS,
  SVG_SLUG_TO_PRIMARY_MUSCLE,
  type SvgSlug,
} from "./bodymap-svg/muscleAdapter";
import { bodyFront } from "./bodymap-svg/bodyFront";
import { bodyBack } from "./bodymap-svg/bodyBack";
import { bodyFemaleFront } from "./bodymap-svg/bodyFemaleFront";
import { bodyFemaleBack } from "./bodymap-svg/bodyFemaleBack";

const NON_INTERACTIVE_SLUGS = new Set<SvgSlug>([
  "head",
  "hair",
  "knees",
  "ankles",
  "feet",
  "hands",
]);

const HEAD_COLOR = "#d5d5d5";
const HAIR_COLOR = "#3f3f3f";
const BASE_MUSCLE_COLOR = "#c8c9c2";
const HOVER_COLOR = "#a3a59b";
const SELECTED_COLOR = "#acb841";

export function BodyMap({
  gender,
  orientation,
  selected,
  fullBody,
  disabled,
  onSelect,
}: {
  gender: Gender;
  orientation: Orientation;
  selected: Muscle[];
  fullBody: boolean;
  disabled: boolean;
  onSelect: (muscle: Muscle) => void;
}) {
  const [hoveredSlug, setHoveredSlug] = useState<SvgSlug | null>(null);

  const activeSlugs = useMemo(() => {
    const slugs = new Set<SvgSlug>();
    for (const muscle of selected) {
      const mapped = SOFERFIT_TO_SVG_SLUG[muscle];
      if (mapped) slugs.add(mapped);
    }
    return slugs;
  }, [selected]);

  const { parts, viewBox } = useMemo((): {
    parts: BodyPart[];
    viewBox: string;
  } => {
    if (gender === "Man") {
      return orientation === "Front"
        ? { parts: bodyFront, viewBox: "42 -15 640 1380" }
        : { parts: bodyBack, viewBox: "758 -15 640 1380" };
    }
    return orientation === "Front"
      ? { parts: bodyFemaleFront, viewBox: "-45 -95 730 1560" }
      : { parts: bodyFemaleBack, viewBox: "780 -95 730 1560" };
  }, [gender, orientation]);

  const handlePartClick = (slug: SvgSlug) => {
    if (disabled || NON_INTERACTIVE_SLUGS.has(slug)) return;
    const mappedMuscle = SVG_SLUG_TO_PRIMARY_MUSCLE[slug];
    if (mappedMuscle) {
      onSelect(mappedMuscle);
    }
  };

  const getFill = (part: BodyPart) => {
    if (part.slug === "head") return HEAD_COLOR;
    if (part.slug === "hair") return HAIR_COLOR;
    if (NON_INTERACTIVE_SLUGS.has(part.slug)) return BASE_MUSCLE_COLOR;
    if (fullBody || activeSlugs.has(part.slug)) return SELECTED_COLOR;
    if (!disabled && hoveredSlug === part.slug) return HOVER_COLOR;
    return BASE_MUSCLE_COLOR;
  };

  const hoveredLabel = hoveredSlug ? SVG_SLUG_LABELS[hoveredSlug] ?? null : null;

  return (
    <div className="body-wrap">
      <div
        className={`body-map-chart body-${gender.toLowerCase()} ${
          disabled ? "is-disabled" : ""
        }`}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`${gender} muscle map`}
      >
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "auto",
            height: "92%",
            maxHeight: "650px",
            minHeight: "520px",
            display: "block",
            filter: "drop-shadow(0px 14px 18px rgba(40, 41, 36, 0.18))",
          }}
          role="img"
          aria-label={`${gender} ${orientation.toLowerCase()} muscle map`}
        >
          {parts.map((part, index) => {
            const isInteractive =
              !disabled &&
              !NON_INTERACTIVE_SLUGS.has(part.slug) &&
              Boolean(SVG_SLUG_TO_PRIMARY_MUSCLE[part.slug]);

            const paths = [
              ...(part.path.common ?? []),
              ...(part.path.left ?? []),
              ...(part.path.right ?? []),
            ];

            return (
              <g
                key={`${part.slug}-${index}`}
                data-muscle={part.slug}
                onClick={() => handlePartClick(part.slug)}
                onMouseEnter={() => isInteractive && setHoveredSlug(part.slug)}
                onMouseLeave={() => isInteractive && setHoveredSlug(null)}
                style={{ cursor: isInteractive ? "pointer" : "default" }}
              >
                {paths.map((d, pathIndex) => (
                  <path
                    key={pathIndex}
                    d={d}
                    fill={getFill(part)}
                    stroke="#6e7068"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <span
        className={`map-hint ${
          selected.length > 0 || fullBody ? "hidden" : ""
        }`}
      >
        {hoveredLabel || "Choose a muscle group to focus your routine"}
      </span>
    </div>
  );
}