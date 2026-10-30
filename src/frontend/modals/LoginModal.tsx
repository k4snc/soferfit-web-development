import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { api } from "../services/api";

export function LoginModal({
  open,
  onClose,
  onSignup,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    const nextErrors: { email?: string; password?: string; general?: string } = {
      email: email.includes("@") ? undefined : "Enter a valid email",
      password: password ? undefined : "Password is required",
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    setErrors({});

    try {
      await api.login(email, password);
      onSuccess();
    } catch (err) {
      console.error("Login failed:", err);
      setErrors({ general: "Invalid email or password. Please check your credentials." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={onClose}>
      <div className="modal login-modal" role="dialog" aria-modal="true" aria-label="Log in" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close login">×</button>
        <h2>Welcome back</h2>
        {errors.general && <small className="field-error" style={{ display: "block", marginBottom: "1rem" }}>{errors.general}</small>}
        <label className={errors.email ? "field-invalid" : ""}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>
        <label className={errors.password ? "field-invalid" : ""}>
          Password
          <span className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
              <Icon name={showPassword ? "eyeOff" : "eye"} />
            </button>
          </span>
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>
        <Button onClick={submit} disabled={loading}>{loading ? "Logging in..." : "Log in"}</Button>
        <p className="auth-switch">Don't have an account? <button onClick={onSignup}>Sign up to start your 60/90-day challenge.</button></p>
      </div>
    </div>
  );
}