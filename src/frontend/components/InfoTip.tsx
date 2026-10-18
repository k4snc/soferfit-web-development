import { useEffect, useState } from "react";

export function InfoTip({
  term,
  definition,
  onLearnMore,
  actionLabel = "Learn more",
  showTerm = true,
}: {
  term: string;
  definition: string;
  onLearnMore: () => void;
  actionLabel?: string;
  showTerm?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <span className={`info-tip ${open ? "open" : ""}`}>
      <button type="button" aria-label={`About ${term}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>ⓘ</button>
      <span className="term-tooltip" role="tooltip">
        {showTerm && <strong>{term}</strong>}
        <span>{definition}</span>
        <button type="button" onClick={() => {
          setOpen(false);
          onLearnMore();
        }}>{actionLabel}</button>
      </span>
    </span>
  );
}
