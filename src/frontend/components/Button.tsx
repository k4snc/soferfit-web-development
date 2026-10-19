export function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode
  variant?: "primary" | "ghost" | "dark"
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
