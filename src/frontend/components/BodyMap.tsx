import type { Gender, Muscle, Orientation } from "../types";

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
  const armWidth = gender === "Man" ? 0 : 3;
  const zones: { key: string; muscle: Muscle; d: string }[] = [
    { key: "shoulders", muscle: "Shoulders", d: "M77 88c9-10 18-13 31-13l7 18-25 13Zm86 0c-9-10-18-13-31-13l-7 18 25 13Z" },
    { key: "chest", muscle: "Chest", d: "M99 98c10-6 16-5 21 1v34c-13 1-24-4-29-13Zm42 0c-10-6-16-5-21 1v34c13 1 24-4 29-13Z" },
    { key: "core", muscle: "Core", d: "M103 137c11 3 23 3 34 0l-2 59h-30Z" },
    { key: "quads", muscle: "Quads", d: "M91 207c8-6 18-7 27-2l-8 91-24-2Zm58 0c-8-6-18-7-27-2l8 91 24-2Z" },
    { key: "calves", muscle: "Calves", d: "M86 302h24l-5 80H89Zm68 0h-24l5 80h16Z" },
    ...(orientation === "Front"
      ? [
          { key: "biceps-left", muscle: "Biceps" as Muscle, d: `M${70 + armWidth} 106c8-5 15 1 14 10l-6 38-15-3 4-34Z` },
          { key: "biceps-right", muscle: "Biceps" as Muscle, d: `M${170 - armWidth} 106c-8-5-15 1-14 10l6 38 15-3-4-34Z` },
        ]
      : [
          { key: "triceps-left", muscle: "Triceps" as Muscle, d: `M${70 + armWidth} 104c9-3 15 3 13 12l-7 39-15-5 5-34Z` },
          { key: "triceps-right", muscle: "Triceps" as Muscle, d: `M${170 - armWidth} 104c-9-3-15 3-13 12l7 39 15-5-5-34Z` },
        ]),
    { key: "forearms-left", muscle: "Forearms", d: `M${61 + armWidth} 154l15 5-13 48-15-4Z` },
    { key: "forearms-right", muscle: "Forearms", d: `M${179 - armWidth} 154l-15 5 13 48 15-4Z` },
  ];

  return (
    <div className="body-wrap">
      <svg className={`body-svg body-${gender.toLowerCase()} orientation-${orientation.toLowerCase()} ${disabled ? "is-disabled" : ""}`} viewBox="0 0 240 410" role="img" aria-label={`${gender} ${orientation.toLowerCase()} muscle map`} focusable="false">
        <ellipse cx="120" cy="39" rx="24" ry="28" className="body-base" />
        <path className="body-base" d={gender === "Man"
          ? "M91 77c18-14 40-14 58 0l25 99-24 30 6 94-4 98h-23l-9-126-9 126H88l-4-98 6-94-24-30Z"
          : "M96 77c16-12 32-12 48 0l17 93-25 34 17 95-2 99h-22l-9-126-9 126H89l-2-99 17-95-25-34Z"} />
        <path className="body-base" d="m91 84-26 16-22 112 17 4 34-100Zm58 0 26 16 22 112-17 4-34-100Z" />
        {zones.map((zone) => (
          <path
            key={zone.key}
            d={zone.d}
            className={`muscle-zone ${fullBody ? "full-body-selected" : selected === zone.muscle ? "selected" : ""}`}
            onClick={() => !disabled && onSelect(zone.muscle)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label={`${selected === zone.muscle ? "Deselect" : "Select"} ${zone.muscle}`}
            onKeyDown={(event) => !disabled && (event.key === "Enter" || event.key === " ") && onSelect(zone.muscle)}
          >
            <title>{zone.muscle}</title>
          </path>
        ))}
        <path className="body-lines" d="M120 73v126M92 207l28-8 28 8M105 137h30M92 300h56" />
      </svg>
      <span className={`map-hint ${selected || fullBody ? "hidden" : ""}`}>Click any muscle group or tap 'Full Body' to begin</span>
    </div>
  );
}
