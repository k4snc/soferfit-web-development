
import { useState } from "react";
import type { Gender, Muscle, Orientation } from "../types";
import { musclePathMap } from "../data/musclePaths";

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
  selected: Muscle | null;
  fullBody: boolean;
  disabled: boolean;
  onSelect: (muscle: Muscle) => void;
}) {
  const [hoveredMuscle, setHoveredMuscle] = useState<Muscle | null>(null);

  // Fetch the correct set of paths based on current gender and orientation
  const zones = musclePathMap[gender]?.[orientation] || [];

  return (
    <div className="body-wrap">
      <svg
        className={`body-svg body-${gender.toLowerCase()} orientation-${orientation.toLowerCase()} ${
          disabled ? "is-disabled" : ""
        }`}
        viewBox="0 0 240 410"
        role="img"
        aria-label={`${gender} ${orientation.toLowerCase()} muscle map`}
        focusable="false"
      >
        {/* Base Silhouette (Preserves your original theme and silhouette style) */}
        <ellipse cx="120" cy="39" rx="24" ry="28" className="body-base" />
        <path
          className="body-base"
          d={
            gender === "Man"
              ? "M91 77c18-14 40-14 58 0l25 99-24 30 6 94-4 98h-23l-9-126-9 126H88l-4-98 6-94-24-30Z"
              : "M96 77c16-12 32-12 48 0l17 93-25 34 17 95-2 99h-22l-9-126-9 126H89l-2-99 17-95-25-34Z"
          }
        />
        <path className="body-base" d="m91 84-26 16-22 112 17 4 34-100Zm58 0 26 16 22 112-17 4-34-100Z" />

        {/* Interactive Muscle Zones with Hover and Selection States */}
        {zones.map((zone) => (
          <path
            key={zone.key}
            d={zone.d}
            className={`muscle-zone ${
              fullBody
                ? "full-body-selected"
                : selected === zone.muscle
                ? "selected"
                : ""
            } ${hoveredMuscle === zone.muscle ? "hovered" : ""}`}
            onClick={() => !disabled && onSelect(zone.muscle)}
            onMouseEnter={() => !disabled && setHoveredMuscle(zone.muscle)}
            onMouseLeave={() => setHoveredMuscle(null)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label={`${selected === zone.muscle ? "Deselect" : "Select"} ${zone.muscle}`}
            onKeyDown={(event) =>
              !disabled &&
              (event.key === "Enter" || event.key === " ") &&
              onSelect(zone.muscle)
            }
          >
            <title>{zone.muscle}</title>
          </path>
        ))}

        <path className="body-lines" d="M120 73v126M92 207l28-8 28 8M105 137h30M92 300h56" />
      </svg>

      {/* Map Hint Message */}
      <span className={`map-hint ${selected || fullBody || hoveredMuscle ? "hidden" : ""}`}>
        {hoveredMuscle ? hoveredMuscle : "Click any muscle group or tap 'Full Body' to begin"}
      </span>
    </div>
  );
}