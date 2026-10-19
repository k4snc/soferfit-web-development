import { useEffect, useState } from "react"
import { glossaryId, glossaryTerms } from "../data/glossary"

export function GlossaryDrawer({
  open,
  initialTerm,
  onClose,
}: {
  open: boolean
  initialTerm?: string
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const filteredTerms = glossaryTerms.filter(([term, definition]) =>
    `${term} ${definition}`.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (!open) return
    setQuery("")
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    if (initialTerm) {
      window.setTimeout(
        () =>
          document
            .getElementById(glossaryId(initialTerm))
            ?.scrollIntoView({ block: "center" }),
        0,
      )
    }
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, initialTerm, onClose])

  if (!open) return null

  return (
    <div className="glossary-backdrop" onMouseDown={onClose}>
      <aside
        className="glossary-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Glossary"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="glossary-head">
          <div>
            <span className="eyebrow"> REFERENCE</span>
            <h2>Glossary</h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close glossary"
          >
            ×
          </button>
        </div>
        <label className="glossary-search">
          Search terms
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search glossary"
          />
        </label>
        <div className="glossary-list">
          {filteredTerms.map(([term, definition]) => (
            <article id={glossaryId(term)} key={term}>
              <strong>{term}</strong>
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  )
}
