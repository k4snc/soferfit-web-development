import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { InfoTip } from "../components/InfoTip";
import { LogoMark } from "../components/LogoMark";
import { glossaryTerms } from "../data/glossary";
import { emailPattern, parseHeightCm, parseWeightKg } from "../lib/format";
import { api } from "../services/api";
import type { Activity, Experience, Goal, SignupAnswers, SignupEquipment, UnitSystem } from "../types";

export function SignupModal({
  open,
  initialAnswers,
  onClose,
  onLogin,
  onOpenGlossary,
  onComplete,
}: {
  open: boolean;
  initialAnswers: SignupAnswers;
  onClose: () => void;
  onLogin: () => void;
  onOpenGlossary: (term: string) => void;
  onComplete: (profile: SignupAnswers) => void;
}) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [returnToReview, setReturnToReview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState(0);
  const [answers, setAnswers] = useState<SignupAnswers>(initialAnswers);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customSessionRef = useRef<HTMLInputElement>(null);
  const totalSteps = 4;
  const setAnswer = <K extends keyof SignupAnswers>(key: K, value: SignupAnswers[K]) => setAnswers((current) => ({ ...current, [key]: value }));

  const passwordRules = {
    length: answers.password.length >= 8,
    number: /[\d\p{P}\p{S}]/u.test(answers.password),
    case: /[a-z]/.test(answers.password) && /[A-Z]/.test(answers.password),
  };
  const validPassword = Object.values(passwordRules).every(Boolean);
  const ageNumber = Number(answers.age);
  const heightCm = parseHeightCm(answers.height, answers.unitSystem);
  const weightKg = parseWeightKg(answers.weight, answers.unitSystem);
  const validAge = ageNumber >= 10 && ageNumber <= 100;
  const validHeight = heightCm >= 100 && heightCm <= 250;
  const validWeight = weightKg >= 25 && weightKg <= 300;
  const stepOneValid = Boolean(answers.name.trim()) && emailPattern.test(answers.email) && validPassword && validAge && validHeight && validWeight;
  const targetKg = parseWeightKg(answers.targetWeight, answers.unitSystem);
  const hasTargetWeight = Boolean(answers.targetWeight.trim());
  const targetValid = !hasTargetWeight || (targetKg >= 25 && targetKg <= 300);
  const timelineWeeks = answers.targetTimeline === "First 30 days" ? 4.3 : answers.targetTimeline === "By day 60" ? 8.6 : 12.9;
  const targetCaution = hasTargetWeight && targetValid && validHeight && ((targetKg / ((heightCm / 100) ** 2)) < 18.5 || (weightKg - targetKg) / timelineWeeks > 1);
  const stepTwoValid = Boolean(answers.somatotype && answers.goal && answers.experience && answers.activity && answers.availableEquipment && targetValid);
  const customSessionValue = Number(answers.customSessionMinutes);
  const customSessionValid = Number.isInteger(customSessionValue) && customSessionValue >= 5 && customSessionValue <= 180;
  const sessionValid = answers.sessionChoice === "custom" ? customSessionValid : Boolean(answers.sessionChoice && answers.sessionMinutes);
  const stepThreeValid = Boolean(answers.challengeDays && answers.workoutDays && sessionValid);
  const stepValid = step === 1 ? stepOneValid : step === 2 ? stepTwoValid : step === 3 ? stepThreeValid : true;
  const strength = Object.values(passwordRules).filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    setAnswers(initialAnswers);
    setStep(1);
    setDirection("forward");
    setShowLeavePrompt(false);
    setAvatarError("");
    setReturnToReview(false);
    setGenerationProgress(0);
    setGenerationStatus(0);
  }, [open]);

  useEffect(() => {
    if (step !== 5) return;
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      setGenerationProgress(Math.min(100, Math.round(((Date.now() - startedAt) / 4000) * 100)));
    }, 50);
    const statusTimer = window.setInterval(() => setGenerationStatus((current) => Math.min(2, current + 1)), 1300);
    const finishTimer = window.setTimeout(() => {
      setGenerationProgress(100);
      setStep(6);
    }, 4100);
    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(statusTimer);
      window.clearTimeout(finishTimer);
    };
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => titleRef.current?.focus(), 20);
  }, [open, step]);

  useEffect(() => {
    if (step === 3 && answers.sessionChoice === "custom") {
      window.setTimeout(() => customSessionRef.current?.focus(), 20);
    }
  }, [answers.sessionChoice, step]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && step !== 5) {
        event.preventDefault();
        setShowLeavePrompt(true);
      }
      if (event.key === "Enter" && !showLeavePrompt && stepValid && step < 4) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "BUTTON" && target.tagName !== "SELECT" && step < totalSteps) {
          event.preventDefault();
          setDirection("forward");
          setStep((current) => current + 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, showLeavePrompt, step, stepValid]);

  if (!open) return null;

  const goBack = () => {
    if (step === 5) return;
    if (step === 1) return setShowLeavePrompt(true);
    setDirection("back");
    setStep((current) => current - 1);
  };
  const goNext = () => {
    if (!stepValid || step >= totalSteps) return;
    setDirection("forward");
    if (returnToReview) {
      setReturnToReview(false);
      setStep(4);
    } else {
      setStep((current) => current + 1);
    }
  };
  const changeUnit = (unit: UnitSystem) => {
    if (unit === answers.unitSystem) return;
    const nextHeight = answers.height ? unit === "imperial"
      ? `${Math.floor(heightCm / 30.48)} ft ${Math.round((heightCm % 30.48) / 2.54)} in`
      : String(Math.round(heightCm)) : "";
    const nextWeight = answers.weight ? unit === "imperial" ? String(Math.round(weightKg * 2.20462)) : String(Math.round(weightKg)) : "";
    const nextTarget = hasTargetWeight ? unit === "imperial" ? String(Math.round(targetKg * 2.20462)) : String(Math.round(targetKg)) : "";
    setAnswers((current) => ({ ...current, unitSystem: unit, height: nextHeight, weight: nextWeight, targetWeight: nextTarget }));
  };
  const uploadAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setAvatarError("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setAvatarError("Please choose an image smaller than 5 MB.");
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => setAnswer("avatarUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const pill = <T extends string>(value: T, selected: boolean, onSelect: (value: T) => void) => (
    <button key={value} type="button" className={`signup-pill ${selected ? "selected" : ""}`} onClick={() => onSelect(value)}>
      {selected && <Icon name="check" />}{value}
    </button>
  );
  const initials = answers.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";
  const statusMessages = [
    "Analyzing body type and metabolic profile...",
    `Calibrating your ${answers.challengeDays ?? 60}-day challenge schedule and rest intervals...`,
    "Finalizing Day 1 session and guided cues...",
  ];
  const editStep = (nextStep: number) => {
    setReturnToReview(true);
    setDirection("back");
    setStep(nextStep);
  };

  return (
    <div className="signup-backdrop" onMouseDown={() => step !== 5 && setShowLeavePrompt(true)}>
      <section className={`signup-modal ${step > 4 ? "signup-final-state" : ""}`} role="dialog" aria-modal="true" aria-labelledby="signup-step-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="signup-form-column">
          {step <= 4 && <header className="signup-header">
            <div className="signup-topline">
              <button className="signup-icon-button" type="button" onClick={goBack} aria-label={step === 1 ? "Leave sign up" : "Previous step"}><Icon name="back" /></button>
              <div className="signup-member-actions"><span>Already a member? <button type="button" onClick={onLogin}>Log in</button></span></div>
            </div>
            <div className="signup-progress">
              <span>Step {step} of {totalSteps}</span>
              <div className="signup-progress-track" aria-label={`Step ${step} of ${totalSteps}`}>
                {[1, 2, 3, 4].map((item) => <i key={item} className={item < step || step === 4 ? "complete" : item === step ? "current" : ""} />)}
              </div>
            </div>
            <div className="signup-mobile-preview"><Icon name={step === 2 ? "chart" : step === 3 ? "calendar" : step === 4 ? "check" : "calendar"} /><span>{step === 2 ? "Your starting point" : step === 3 ? "Weekly rhythm" : step === 4 ? "Ready to review" : "Day 1 Kickoff"}</span></div>
          </header>}

          <div className="signup-scroll">
            {step === 1 && (
              <div className={`signup-step-content signup-slide-${direction}`} key="step-1">
                <h2 id="signup-step-title" ref={titleRef} tabIndex={-1}>Create your account.</h2>
                <p className="signup-step-intro">Save your routine and keep your 60/90-day challenge progress in one place.</p>
                <div className="signup-avatar-upload">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
                  <button type="button" className="signup-avatar-button" onClick={() => fileInputRef.current?.click()} aria-label="Upload profile photo">
                    {answers.avatarUrl ? <img src={answers.avatarUrl} alt="Profile preview" /> : <span><Icon name="camera" /><b>+</b></span>}
                  </button>
                  <strong>Upload profile photo <span>(Optional)</span></strong>
                  {answers.avatarUrl && <button type="button" className="signup-change-avatar" onClick={() => fileInputRef.current?.click()}>Change</button>}
                  {avatarError && <small className="signup-field-error"><span>!</span>{avatarError}</small>}
                </div>
                <div className="signup-account-fields">
                  <label className="signup-field">Username<input value={answers.name} onChange={(event) => setAnswer("name", event.target.value)} placeholder="Choose a username" /></label>
                  <label className="signup-field">Email Address<input type="email" value={answers.email} onChange={(event) => setAnswer("email", event.target.value)} placeholder="you@example.com" />{answers.email && !emailPattern.test(answers.email) && <small className="signup-field-error"><span>!</span>Enter a valid email address.</small>}</label>
                  <label className="signup-field">Password<span className="signup-password-field"><input type={showPassword ? "text" : "password"} value={answers.password} onChange={(event) => setAnswer("password", event.target.value)} placeholder="Create a strong password" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eyeOff" : "eye"} /></button></span></label>
                  <div className="signup-password-status">
                    <div className="signup-strength-meter" aria-label={`Password strength ${strength} of 3`}>{[1, 2, 3].map((item) => <i key={item} className={item <= strength ? "passed" : ""} />)}</div>
                    <div className="signup-password-rules">
                      {[[passwordRules.length, "At least 8 characters"], [passwordRules.number, "At least one number or symbol"], [passwordRules.case, "Upper and lowercase letters"]].map(([passed, label]) => <span className={passed ? "passed" : ""} key={String(label)}><i><Icon name="check" /></i>{label}</span>)}
                    </div>
                  </div>
                </div>
                <div className="signup-section-heading">
                  <span>About you</span>
                  <div className="signup-unit-toggle"><button type="button" className={answers.unitSystem === "metric" ? "active" : ""} onClick={() => changeUnit("metric")}>Metric <small>kg/cm</small></button><button type="button" className={answers.unitSystem === "imperial" ? "active" : ""} onClick={() => changeUnit("imperial")}>Imperial <small>lbs/ft</small></button></div>
                </div>
                <div className="signup-biometric-grid">
                  <label className="signup-field">Age<input inputMode="numeric" value={answers.age} onChange={(event) => setAnswer("age", event.target.value)} placeholder="24" />{answers.age && !validAge && <small className="signup-field-error"><span>!</span>Enter an age from 10–100.</small>}</label>
                  <label className="signup-field">Height<span className="signup-input-with-unit"><input inputMode={answers.unitSystem === "metric" ? "numeric" : "text"} value={answers.height} onChange={(event) => setAnswer("height", event.target.value)} placeholder={answers.unitSystem === "metric" ? "175 cm" : "5 ft 9 in"} /><b>{answers.unitSystem === "metric" ? "cm" : "ft / in"}</b></span>{answers.height && !validHeight && <small className="signup-field-error"><span>!</span>{answers.unitSystem === "metric" ? "100–250 cm" : "3 ft 3 in–8 ft 2 in"}</small>}</label>
                  <label className="signup-field">Current Weight<span className="signup-input-with-unit"><input inputMode="decimal" value={answers.weight} onChange={(event) => setAnswer("weight", event.target.value)} placeholder={answers.unitSystem === "metric" ? "68 kg" : "150 lbs"} /><b>{answers.unitSystem === "metric" ? "kg" : "lbs"}</b></span>{answers.weight && !validWeight && <small className="signup-field-error"><span>!</span>{answers.unitSystem === "metric" ? "25–300 kg" : "55–661 lbs"}</small>}</label>
                </div>
                {validAge && ageNumber < 18 && <p className="signup-notice">Under 18? Please ask a parent or guardian before starting a fitness challenge.</p>}
              </div>
            )}

            {step === 2 && (
              <div className={`signup-step-content signup-slide-${direction}`} key="step-2">
                <h2 id="signup-step-title" ref={titleRef} tabIndex={-1}>Tell us about your starting point.</h2>
                <p className="signup-step-intro">These details help us customize practical volume, exercise selection, and recovery.</p>
                <div className="signup-step-section">
                  <div className="signup-label-with-tip"><span>SOMATOTYPE</span><InfoTip term="Somatotype" definition={glossaryTerms.find(([term]) => term === "Somatotype")?.[1] ?? ""} onLearnMore={() => onOpenGlossary("Somatotype")} actionLabel="Open Glossary" showTerm={false} /></div>
                  <div className="signup-somatotype-grid">
                    {[["Ectomorph", "Naturally leaner frame, fast metabolism."], ["Mesomorph", "Naturally athletic, builds muscle and burns fat easily."], ["Endomorph", "Naturally broader, tends to store body fat easily."], ["Not Sure", "We will use your other baseline answers."]].map(([title, subtitle]) => (
                      <button type="button" key={title} className={answers.somatotype === title ? "selected" : ""} onClick={() => setAnswer("somatotype", title)}>
                        <span><strong>{title}</strong><small>{subtitle}</small></span>{answers.somatotype === title && <b><Icon name="check" /></b>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="signup-step-section"><span className="signup-section-label">PRIMARY GOAL</span><div className="signup-pill-group">{(["Lose Fat & Get Lean", "Build Muscle & Strength", "Body Recomposition"] as Goal[]).map((item) => pill(item, answers.goal === item, (value) => setAnswer("goal", value)))}</div></div>
                <div className="signup-step-section"><span className="signup-section-label">EXPERIENCE LEVEL</span><p className="signup-helper">Where are you in your fitness journey?</p><div className="signup-pill-group">{(["Starting Out", "Some Experience", "Consistent"] as Experience[]).map((item) => pill(item, answers.experience === item, (value) => setAnswer("experience", value)))}</div></div>
                <div className="signup-step-section"><span className="signup-section-label">CURRENT ACTIVITY LEVEL</span><p className="signup-helper">How active are you outside your planned workouts?</p><div className="signup-pill-group">{(["Sedentary", "Sometimes Active", "Moderately Active", "Very Active"] as Activity[]).map((item) => pill(item, answers.activity === item, (value) => setAnswer("activity", value)))}</div></div>
                <div className="signup-step-section">
                  <span className="signup-section-label">TARGET GOAL METRIC</span>
                  <div className="signup-target-grid">
                    <label className="signup-field signup-target-weight-field">
                      <span className="signup-target-label">Target Weight <small>(Optional)</small></span>
                      <span className="signup-target-input-row">
                        <span className="signup-input-with-unit"><input inputMode="decimal" value={answers.targetWeight} onChange={(event) => setAnswer("targetWeight", event.target.value)} placeholder={answers.unitSystem === "metric" ? "62 kg" : "137 lbs"} /><b>{answers.unitSystem === "metric" ? "kg" : "lbs"}</b></span>
                      </span>
                      {hasTargetWeight && !targetValid && <small className="signup-field-error"><span>!</span>{answers.unitSystem === "metric" ? "Enter 25–300 kg or leave blank." : "Enter 55–661 lbs or leave blank."}</small>}
                    </label>
                    <label className="signup-field">Target Timeline Focus<select value={answers.targetTimeline} onChange={(event) => setAnswer("targetTimeline", event.target.value)}><option>First 30 days</option><option>By day 60</option><option>By day 90</option><option>Whole challenge</option></select></label>
                  </div>
                  {targetCaution && <p className="signup-notice">That’s a big change. Gradual progress is safer; we’ll pace your plan.</p>}
                </div>
                <div className="signup-step-section"><span className="signup-section-label">AVAILABLE EQUIPMENT</span><div className="signup-pill-group">{(["Bodyweight / Home Only", "Dumbbells & Bands", "Full Gym Access"] as SignupEquipment[]).map((item) => pill(item, answers.availableEquipment === item, (value) => setAnswer("availableEquipment", value)))}</div></div>
                <div className="signup-medical-block">
                  <p>SoferFit offers general fitness guidance, not medical advice. If you have an injury or health condition, check with a doctor first.</p>
                  <label><input type="checkbox" checked={answers.hasCondition} onChange={(event) => setAnswer("hasCondition", event.target.checked)} /><span>I have an injury or health condition</span></label>
                  {answers.hasCondition && <small>We’ll favor lower-impact exercises in your plan.</small>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={`signup-step-content signup-slide-${direction}`} key="step-3">
                <h2 id="signup-step-title" ref={titleRef} tabIndex={-1}>Build your weekly rhythm.</h2>
                <p className="signup-step-intro">Select your transformation duration and weekly schedule.</p>
                <div className="signup-step-section signup-duration-section">
                  <span className="signup-section-label">CHOOSE YOUR CHALLENGE DURATION</span>
                  <div className="signup-duration-grid">
                    {([60, 90] as const).map((days) => (
                      <button type="button" key={days} className={answers.challengeDays === days ? "selected" : ""} onClick={() => setAnswer("challengeDays", days)}>
                        <span className="signup-duration-chip">{days === 60 ? "Sprint" : "Most sustainable"}</span>
                        <strong>{days}-Day Challenge</strong>
                        <p>{days === 60 ? "A high-intensity, focused sprint. Best for rapid routine formation and fast fat loss." : "Comprehensive body transformation. Best for sustainable recomposition and deep habit building."}</p>
                        {answers.challengeDays === days && <b><Icon name="check" /></b>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="signup-step-section">
                  <span className="signup-section-label">WORKOUT DAYS PER WEEK</span>
                  <div className="signup-number-pills">{[2, 3, 4, 5, 6].map((days) => <button type="button" key={days} className={answers.workoutDays === days ? "selected" : ""} onClick={() => setAnswer("workoutDays", days)}>{answers.workoutDays === days && <Icon name="check" />}{days} days</button>)}</div>
                  <p className="signup-live-helper">{answers.workoutDays ? `That leaves ${7 - answers.workoutDays} rest ${7 - answers.workoutDays === 1 ? "day" : "days"} each week for recovery.` : "Choose a pace that leaves room for recovery."}</p>
                  {answers.workoutDays === 6 && answers.experience === "Starting Out" && <p className="signup-notice">New to training? 3-4 days a week is a great way to start.</p>}
                </div>
                <div className="signup-step-section">
                  <span className="signup-section-label">SESSION DURATION</span>
                  <div className="signup-session-controls">
                    <label className="signup-field">
                      <select
                        value={answers.sessionChoice}
                        onChange={(event) => {
                          const choice = event.target.value as SignupAnswers["sessionChoice"];
                          setAnswers((current) => ({
                            ...current,
                            sessionChoice: choice,
                            sessionMinutes: choice && choice !== "custom" ? Number(choice) : null,
                            customSessionMinutes: choice === "custom" ? current.customSessionMinutes : "",
                          }));
                        }}
                        aria-label="Session duration"
                      >
                        <option value="" disabled>Select session length</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="custom">Custom...</option>
                      </select>
                    </label>
                    {answers.sessionChoice === "custom" && <label className="signup-field signup-custom-session">
                      <span className="signup-input-with-unit"><input ref={customSessionRef} inputMode="numeric" value={answers.customSessionMinutes} onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "");
                        setAnswers((current) => ({ ...current, customSessionMinutes: value, sessionMinutes: value && Number(value) >= 5 && Number(value) <= 180 ? Number(value) : null }));
                      }} placeholder="50" /><b>min</b></span>
                      {answers.customSessionMinutes && !customSessionValid && <small className="signup-field-error"><span>!</span>Enter 5-180 minutes</small>}
                    </label>}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className={`signup-step-content signup-slide-${direction}`} key="step-4">
                <h2 id="signup-step-title" ref={titleRef} tabIndex={-1}>Review your transformation profile.</h2>
                <p className="signup-step-intro">Confirm your details before we structure your challenge.</p>
                <div className="signup-review-card">
                  <section>
                    <div className="signup-review-group-head"><span>ACCOUNT</span><button type="button" onClick={() => editStep(1)}>Edit</button></div>
                    <div className="signup-review-account"><span className="signup-review-avatar">{answers.avatarUrl ? <img src={answers.avatarUrl} alt="" /> : initials}</span><div><strong>{answers.name}</strong><small>{answers.email}</small></div></div>
                  </section>
                  <section>
                    <div className="signup-review-group-head"><span>BODY PROFILE</span><button type="button" onClick={() => editStep(2)}>Edit</button></div>
                    <div className="signup-review-values">
                      <p><small>Age</small><strong>{answers.age}</strong></p>
                      <p><small>Height</small><strong>{answers.height} {answers.unitSystem === "metric" && !answers.height.toLowerCase().includes("cm") ? "cm" : ""}</strong></p>
                      <p><small>Current → target weight</small><strong>{answers.weight || "—"} {answers.unitSystem === "metric" ? "kg" : "lbs"} → {answers.targetWeight ? `${answers.targetWeight} ${answers.unitSystem === "metric" ? "kg" : "lbs"}` : "N/A"}</strong></p>
                      <p><small>Unit system</small><strong>{answers.unitSystem === "metric" ? "Metric" : "Imperial"}</strong></p>
                      <p><small>Somatotype</small><strong>{answers.somatotype}</strong></p>
                      <p><small>Activity level</small><strong>{answers.activity}</strong></p>
                    </div>
                  </section>
                  <section>
                    <div className="signup-review-group-head"><span>SCHEDULE</span><button type="button" onClick={() => editStep(3)}>Edit</button></div>
                    <div className="signup-review-values">
                      <p><small>Challenge duration</small><strong>{answers.challengeDays} Days</strong></p>
                      <p><small>Frequency</small><strong>{answers.workoutDays} days/week, {answers.sessionMinutes} min/session</strong></p>
                      <p><small>Timeline focus</small><strong>{answers.targetTimeline}</strong></p>
                    </div>
                  </section>
                  <section>
                    <div className="signup-review-group-head"><span>FOCUS & GEAR</span><button type="button" onClick={() => editStep(2)}>Edit</button></div>
                    <div className="signup-review-values">
                      <p><small>Primary goal</small><strong>{answers.goal}</strong></p>
                      <p><small>Experience level</small><strong>{answers.experience}</strong></p>
                      <p><small>Available equipment</small><strong>{answers.availableEquipment}</strong></p>
                      <p><small>Explorer focus</small><strong>{answers.focusArea}</strong></p>
                      <p><small>Training mode</small><strong>{answers.mode}</strong></p>
                      <p><small>Injury or condition</small><strong>{answers.hasCondition ? "Yes — favor lower impact" : "No"}</strong></p>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="signup-generation-state signup-slide-forward" key="generation">
                <div className="signup-generation-ring" style={{ "--generation-progress": `${generationProgress * 3.6}deg` } as React.CSSProperties}><span>{generationProgress}%</span></div>
                <div className="signup-reduced-progress"><i style={{ width: `${generationProgress}%` }} /></div>
                <strong key={generationStatus} className="signup-generation-status">{statusMessages[generationStatus]}</strong>
                <p>This only takes a moment.</p>
              </div>
            )}

            {step === 6 && (
              <div className="signup-reveal signup-slide-forward" key="reveal">
                <h2 id="signup-step-title" ref={titleRef} tabIndex={-1}>Your challenge is ready.</h2>
                <p className="signup-step-intro">Your fitness journey starts today! Based on your answers, here is what your challenge includes:</p>
                <div className="signup-reveal-list">
                  {[
                    ["clipboard", "Complete, Easy-to-Follow Plan", "Clear scheduled workouts, structured rest days, and progressive cues."],
                    ["sliders", "Absolute Freedom to Customize", "Adjust your equipment, intensity, and workout days to fit your week."],
                    ["camera", "Progress Photos & Weight Tracking", "Capture your transformation with regular photos and track every pound lost."],
                    ["timer", "Structured Guided Sessions", "Built-in countdown timers, rep counters, and motivational cues."],
                  ].map(([icon, title, description], index) => <article key={title} style={{ "--reveal-index": index } as React.CSSProperties}><span><Icon name={icon as "clipboard" | "sliders" | "camera" | "timer"} /></span><div><strong>{title}</strong><p>{description}</p></div></article>)}
                </div>
              </div>
            )}
          </div>

          {step <= 3 && <footer className="signup-actions"><button className="signup-back-link" type="button" onClick={goBack}>Back</button><Button onClick={goNext} disabled={!stepValid}>{returnToReview ? "Return to review" : "Next"}</Button></footer>}
          
          {step === 4 && (
            <footer className="signup-actions signup-review-actions">
              <button className="signup-back-link" type="button" onClick={goBack}>Back</button>
              <div>
                <Button 
                  onClick={async () => {
                    try {
                      // 1. Register user account on Django backend
                      await api.register(answers.email, answers.password);

                      // 2. Save onboarding profile data to Django backend
                      await api.saveOnboarding({
                        name: answers.name,
                        age: answers.age,
                        height: answers.height,
                        currentWeight: answers.weight,
                        targetWeight: answers.targetWeight,
                        unitSystem: answers.unitSystem,
                        somatotype: answers.somatotype,
                        goal: answers.goal,
                        experience: answers.experience,
                        activity: answers.activity,
                        workoutDays: String(answers.workoutDays),
                        sessionLength: String(answers.sessionMinutes ?? 30),
                        focusArea: answers.focusArea || "General Fitness",
                        mode: answers.mode || "Standard",
                        equipment: answers.availableEquipment,
                        challengeDays: answers.challengeDays!,
                        targetTimeline: answers.targetTimeline,
                        hasCondition: answers.hasCondition,
                      });

                      // 3. Trigger generation state animation
                      setGenerationProgress(0);
                      setGenerationStatus(0);
                      setStep(5);
                    } catch (error) {
                      console.error("Backend integration failed during signup:", error);
                      alert("Could not connect to the backend server. Make sure Django is running.");
                    }
                  }}
                >
                  Generate My Plan
                </Button>
                <small>AI generation is limited. This uses one of your plan generations.</small>
              </div>
            </footer>
          )}

          {step === 6 && <footer className="signup-actions signup-reveal-actions"><Button onClick={() => onComplete(answers)}>Dashboard <Icon name="arrow" /></Button></footer>}
        </div>

        {step <= 4 && <aside className="signup-preview-panel" aria-label="Your plan preview">
          <div className="signup-preview-brand"><LogoMark /><span>SoferFit</span></div><div className="signup-orb signup-orb-one" /><div className="signup-orb signup-orb-two" />
          <div className="signup-preview-stack" key={step}>
            {step === 1 ? <>
              <article className="signup-glass-card signup-glass-primary"><span className="signup-glass-icon"><Icon name="calendar" /></span><small>DAY 1</small><strong>Starts the day you sign up</strong></article>
              <article className="signup-glass-card signup-glass-secondary"><span className="signup-mini-check"><Icon name="flame" /></span><div><small>HABIT STREAK</small><strong>Show up daily to build your streak!</strong></div></article>
            </> : step === 2 ? <>
              <article className="signup-glass-card signup-glass-primary signup-weekly-card"><span className="signup-progress-ring">4<small>DAYS</small></span><small>WEEKLY TARGET</small><strong>Build a steady rhythm</strong></article>
              <article className="signup-glass-card signup-glass-secondary"><span className="signup-mini-check"><Icon name="chart" /></span><div><small>YOUR STARTING POINT</small><strong>{answers.goal || "Choose your primary goal"}</strong></div></article>
            </> : step === 3 ? <>
              <article className="signup-glass-card signup-glass-primary signup-week-card"><small>YOUR WEEK</small><div>{[0, 1, 2, 3, 4, 5, 6].map((day) => <i key={day} className={day < (answers.workoutDays ?? 0) ? "workout" : "rest"}>{["M", "T", "W", "T", "F", "S", "S"][day]}</i>)}</div><strong>{answers.workoutDays ? `${answers.workoutDays} training days` : "Choose your rhythm"}</strong></article>
              <article className="signup-glass-card signup-glass-secondary"><span className="signup-mini-check"><Icon name="flame" /></span><div><small>CHALLENGE LENGTH</small><strong>{answers.challengeDays ? `${answers.challengeDays} days` : "Choose 60 or 90 days"}</strong></div></article>
            </> : <article className="signup-glass-card signup-glass-primary signup-ready-card"><span className="signup-day-one-chip">DAY 1</span><small>READY TO START</small><strong>Your {answers.challengeDays}-day challenge</strong><p>Everything is set for your first session.</p></article>}
          </div>
          <p className="signup-preview-quote">Small steps. Stronger days.</p>
        </aside>}


        {showLeavePrompt && <div className="signup-confirm-wrap"><div className="signup-confirm" role="alertdialog" aria-modal="true" aria-labelledby="leave-signup-title"><span className="signup-confirm-icon"><Icon name="back" /></span><h3 id="leave-signup-title">Leave sign up?</h3><p>Your answers will be lost.</p><div><Button variant="ghost" onClick={() => setShowLeavePrompt(false)}>Stay</Button><Button variant="dark" onClick={onClose}>Leave</Button></div></div></div>}
      </section>
    </div>
  );
}