export function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string
  title: string
}) {
  return (
    <header className="dash-header">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
    </header>
  )
}
