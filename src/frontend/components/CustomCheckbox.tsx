import { Icon } from "./Icon";

export function CustomCheckbox({ checked, onChange, disabled = false, className = "", children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string; children?: React.ReactNode }) {
  return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className={`custom-checkbox ${checked ? "checked" : ""} ${className}`} onClick={() => onChange(!checked)}>{children && <span className="checkbox-copy">{children}</span>}<span className="checkbox-mark">{checked && <Icon name="check" />}</span></button>;
}
