import { useEffect, useMemo, useRef, useState } from "react";
import soferFitLogo from "./assets/soferfit-logo.png";
import welcomeImage from "./assets/welcome-training.png";
import { api } from "./services/api";
import { clearFitnessStore, createFitnessStore, FitnessStore, PlannedWorkout, readFitnessStore, writeFitnessStore } from "./fitnessStore";

type Muscle = "Chest" | "Shoulders" | "Biceps" | "Triceps" | "Forearms" | "Core" | "Quads" | "Calves";
type Gender = "Man" | "Woman";
type Orientation = "Front" | "Back";
type TrainingMode = "Fat Loss & Cardio" | "HIIT" | "Muscle & Strength";
type Equipment = "No Equipment / Bodyweight" | "Gym Equipment";

const glossaryTerms = [
  ["Bodyweight", "Exercises that use only your own body weight as resistance, such as push-ups and squats. No equipment needed."],
  ["Cardio", "Exercise that raises your heart rate for a sustained period, such as brisk walking, jumping jacks, or cycling."],
  ["Compound movement", "An exercise that works several muscle groups at once, such as a squat or a push-up."],
  ["Fat Loss & Cardio", "Higher-repetition, shorter-rest workouts that keep your heart rate up to help burn calories."],
  ["Full Body", "A workout that trains your upper body, lower body, and core together instead of focusing on one muscle."],
  ["HIIT (High-Intensity Interval Training)", "Short bursts of hard effort followed by brief rest, repeated in rounds. It is intense, so beginners should start slowly and anyone with an injury or health condition should check with a doctor first."],
  ["Muscle & Strength", "Lower-repetition, longer-rest workouts focused on building strength and muscle."],
  ["Reps (repetitions)", "How many times you perform a movement in a row."],
  ["Rest interval", "The pause between sets or rounds that lets your body recover."],
  ["Sets", "A group of reps done before you rest."],
  ["Somatotype", "A broad, non-medical description of body-build tendencies. It can help set a starting point, but it does not define your metabolism, potential, or results."],
  ["Activity level", "How much you move during a typical week outside planned workouts, from mostly seated to highly active."],
  ["Body recomposition", "A gradual shift toward more lean muscle and less body fat, which may happen without a large change on the scale."],
  ["Challenge duration", "The 60- or 90-day window used to organize training progression, recovery, and habit-building milestones."],
  ["Target weight", "An optional reference point for tracking progress. SoferFit can build your challenge without a target weight."],
] as const;

const glossaryId = (term: string) => `glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

const reviews = [
  {
    initials: "AR",
    name: "Ari R.",
    comment: "The structured challenge and guided session cues kept me consistent without needing a personal trainer.",
  },
  {
    initials: "JM",
    name: "Jordan M.",
    comment: "SoferFit gives me structure without making fitness feel complicated. The weekly plan keeps me consistent.",
  },
  {
    initials: "SK",
    name: "Sam K.",
    comment: "I love that the workouts meet me at my level. Every session feels focused, clear, and achievable.",
  },
  {
    initials: "TN",
    name: "Taylor N.",
    comment: "The 90-day challenge finally made progress feel manageable. I always know what to do next.",
  },
];

const exercises: Record<Muscle, { bodyweight: string; gym: string; level: string; reps: string }[]> = {
  Chest: [
    { bodyweight: "Tempo push-up", gym: "Dumbbell bench press", level: "Beginner", reps: "3 × 10" },
    { bodyweight: "Incline push-up", gym: "Incline press", level: "Intermediate", reps: "4 × 8" },
    { bodyweight: "Wide push-up", gym: "Cable fly", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Plank push-up", gym: "Chest press", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Knee push-up", gym: "Pec deck", level: "Beginner", reps: "3 × 12" },
  ],
  Shoulders: [
    { bodyweight: "Pike push-up", gym: "Arnold press", level: "Beginner", reps: "3 × 8" },
    { bodyweight: "Wall walk", gym: "Shoulder press", level: "Intermediate", reps: "4 × 10" },
    { bodyweight: "Arm circles", gym: "Lateral raise", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Plank shoulder tap", gym: "Front raise", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Down-dog press", gym: "Face pull", level: "Intermediate", reps: "4 × 12" },
  ],
  Biceps: [
    { bodyweight: "Self-resisted curl", gym: "Dumbbell curl", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Towel curl", gym: "Cable curl", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Chin-up hold", gym: "Preacher curl", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Reverse plank pull", gym: "Hammer curl", level: "Intermediate", reps: "4 × 10" },
  ],
  Triceps: [
    { bodyweight: "Diamond push-up", gym: "Cable pushdown", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Bench dip", gym: "Skull crusher", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Close-grip push-up", gym: "Overhead extension", level: "Intermediate", reps: "4 × 8" },
    { bodyweight: "Triceps floor press", gym: "Close-grip bench press", level: "Intermediate", reps: "3 × 10" },
  ],
  Forearms: [
    { bodyweight: "Fingertip plank", gym: "Wrist curl", level: "Beginner", reps: "3 × 20s" },
    { bodyweight: "Towel squeeze", gym: "Reverse wrist curl", level: "Beginner", reps: "3 × 15" },
    { bodyweight: "Bear crawl hold", gym: "Farmer carry", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Knuckle plank", gym: "Plate pinch", level: "Intermediate", reps: "3 × 20s" },
  ],
  Core: [
    { bodyweight: "Dead bug", gym: "Cable crunch", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Hollow hold", gym: "Weighted sit-up", level: "Intermediate", reps: "3 × 30s" },
    { bodyweight: "Bicycle crunch", gym: "Cable woodchop", level: "Intermediate", reps: "4 × 12" },
    { bodyweight: "Forearm plank", gym: "Ab rollout", level: "Beginner", reps: "3 × 40s" },
    { bodyweight: "Lying knee raise", gym: "Hanging knee raise", level: "Advanced", reps: "3 × 10" },
  ],
  Quads: [
    { bodyweight: "Air squat", gym: "Goblet squat", level: "Beginner", reps: "4 × 10" },
    { bodyweight: "Reverse lunge", gym: "Barbell reverse lunge", level: "Beginner", reps: "3 × 12" },
    { bodyweight: "Wall sit", gym: "Leg extension", level: "Intermediate", reps: "3 × 15" },
    { bodyweight: "Split squat", gym: "Weighted split squat", level: "Intermediate", reps: "3 × 10" },
    { bodyweight: "Stair step-up", gym: "Box step-up", level: "Beginner", reps: "3 × 12" },
  ],
  Calves: [
    { bodyweight: "Standing raise", gym: "Smith machine raise", level: "Beginner", reps: "4 × 15" },
    { bodyweight: "Seated raise", gym: "Seated calf machine", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Pogo jump", gym: "Weighted pogo jump", level: "Athletic", reps: "3 × 30s" },
    { bodyweight: "Single-leg raise", gym: "Leg press calf raise", level: "Intermediate", reps: "3 × 12" },
    { bodyweight: "Tiptoe walk", gym: "Farmer walk", level: "Beginner", reps: "3 × 40s" },
  ],
};

const fullBodyExercises: Record<Equipment, { name: string; tag: string }[]> = {
  "No Equipment / Bodyweight": [
    { name: "Push-up to shoulder tap", tag: "Push" },
    { name: "Prone snow angel", tag: "Pull" },
    { name: "Reverse lunge to knee drive", tag: "Legs" },
    { name: "Plank knee drive", tag: "Core" },
    { name: "Burpee", tag: "Full Body" },
  ],
  "Gym Equipment": [
    { name: "Dumbbell thruster", tag: "Push" },
    { name: "Cable row", tag: "Pull" },
    { name: "Goblet squat", tag: "Legs" },
    { name: "Cable woodchop", tag: "Core" },
    { name: "Kettlebell swing", tag: "Full Body" },
  ],
};

function Icon({ name }: { name: "arrow" | "back" | "play" | "spark" | "calendar" | "chart" | "bolt" | "check" | "star" | "eye" | "eyeOff" | "dumbbell" | "camera" | "flame" | "clipboard" | "sliders" | "timer" | "user" | "logout" | "gear" | "close" | "pause" | "volume" | "walk" | "moon" | "book" }) {
  const paths = {
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    back: <path d="M19 12H5m5-5-5 5 5 5" />,
    play: <path d="m9 7 7 5-7 5V7Z" />,
    spark: <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></>,
    chart: <><path d="M5 19V9m7 10V5m7 14v-7" /><path d="M3 19h18" /></>,
    bolt: <path d="m13 2-8 12h7l-1 8 8-13h-7l1-7Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    eye: <><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 7.2A10 10 0 0 1 12 7c6 0 9.5 5 9.5 5a14 14 0 0 1-2.1 2.5M6.4 6.4C3.9 8 2.5 12 2.5 12s3.5 5 9.5 5c1.1 0 2.2-.2 3.1-.5" /></>,
    dumbbell: <><path d="M7 9v6M4.5 8v8M17 9v6M19.5 8v8M7 12h10" /><path d="M3 10v4m18-4v4" /></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z" /><circle cx="12" cy="13" r="3" /></>,
    flame: <path d="M13.5 2.5c.5 4-2.5 5-2 8 1-1 2-2 2.5-3 2.5 2 4 4.2 4 7a6 6 0 0 1-12 0c0-3.4 2-6.2 5.3-9-.2 2 .4 3.1 1.2 3.8.2-2.3.8-4.5 1-6.8Z" />,
    clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5V3h6v2M9 11h6m-6 4h6" /></>,
    sliders: <><path d="M4 7h10m4 0h2M4 17h2m4 0h10M8 14v6m8-16v6" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6m-3 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4.2 3.5-6 8-6s7.2 1.8 8 6" /></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4m4-4H9" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pause: <path d="M9 5v14m6-14v14" />,
    volume: <><path d="M5 10v4h3l4 3V7l-4 3H5Z" /><path d="M16 9c1.5 1.7 1.5 4.3 0 6m2-8c2.8 2.8 2.8 7.2 0 10" /></>,
    walk: <><circle cx="13" cy="4" r="2" /><path d="m10 22 2-7-3-3 2-5 4 3 3 1M6 22l3-6m5-2 3 8" /></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "dark";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function CustomCheckbox({ checked, onChange, disabled = false, className = "", children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string; children?: React.ReactNode }) {
  return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className={`custom-checkbox ${checked ? "checked" : ""} ${className}`} onClick={() => onChange(!checked)}>{children && <span className="checkbox-copy">{children}</span>}<span className="checkbox-mark">{checked && <Icon name="check" />}</span></button>;
}

function LogoMark() {
  return <span className="brand-mark"><img src={soferFitLogo} alt="" /></span>;
}

function InfoTip({
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

function GlossaryDrawer({ open, initialTerm, onClose }: { open: boolean; initialTerm?: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filteredTerms = glossaryTerms.filter(([term, definition]) => `${term} ${definition}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    if (initialTerm) {
      window.setTimeout(() => document.getElementById(glossaryId(initialTerm))?.scrollIntoView({ block: "center" }), 0);
    }
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, initialTerm, onClose]);

  if (!open) return null;

  return (
    <div className="glossary-backdrop" onMouseDown={onClose}>
      <aside className="glossary-drawer" role="dialog" aria-modal="true" aria-label="Glossary" onMouseDown={(event) => event.stopPropagation()}>
        <div className="glossary-head">
          <div><span className="eyebrow"> REFERENCE</span><h2>Glossary</h2></div>
          <button className="modal-close" onClick={onClose} aria-label="Close glossary">×</button>
        </div>
        <label className="glossary-search">Search terms<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search glossary" /></label>
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
  );
}

function LoginModal({
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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const nextErrors = {
      email: email.includes("@") ? undefined : "Enter a valid email",
      password: password ? undefined : "Password is required",
    };
    setErrors(nextErrors);
    if (!nextErrors.email && !nextErrors.password) onSuccess();
  };

  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={onClose}>
      <div className="modal login-modal" role="dialog" aria-modal="true" aria-label="Log in" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close login">×</button>
        <h2>Welcome back</h2>
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
        <Button onClick={submit}>Log in</Button>
        <p className="auth-switch">Don't have an account? <button onClick={onSignup}>Sign up to start your 60/90-day challenge.</button></p>
      </div>
    </div>
  );
}

type UnitSystem = "metric" | "imperial";
type Goal = "Lose Fat & Get Lean" | "Build Muscle & Strength" | "Body Recomposition";
type Experience = "Starting Out" | "Some Experience" | "Consistent";
type Activity = "Sedentary" | "Sometimes Active" | "Moderately Active" | "Very Active";
type SignupEquipment = "Bodyweight / Home Only" | "Dumbbells & Bands" | "Full Gym Access";

type SignupAnswers = {
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  unitSystem: UnitSystem;
  focusArea: Muscle | "Full Body";
  mode: TrainingMode;
  equipment: Equipment;
  age: string;
  height: string;
  weight: string;
  somatotype: string;
  goal: Goal | "";
  experience: Experience | "";
  activity: Activity | "";
  targetWeight: string;
  targetTimeline: string;
  availableEquipment: SignupEquipment | "";
  hasCondition: boolean;
  challengeDays: 60 | 90 | null;
  workoutDays: number | null;
  sessionMinutes: number | null;
  sessionChoice: "" | "15" | "30" | "45" | "60" | "custom";
  customSessionMinutes: string;
  challengeStartDate: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseHeightCm = (value: string, unit: UnitSystem) => {
  if (unit === "metric") return Number(value);
  const match = value.match(/(\d+)\D+(\d+)/);
  return match ? Number(match[1]) * 30.48 + Number(match[2]) * 2.54 : NaN;
};
const parseWeightKg = (value: string, unit: UnitSystem) => unit === "metric" ? Number(value) : Number(value) / 2.20462;

function SignupModal({
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
                    <div className="signup-review-group-head"><span>FOCUS &amp; GEAR</span><button type="button" onClick={() => editStep(2)}>Edit</button></div>
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
          {step === 4 && <footer className="signup-actions signup-review-actions"><button className="signup-back-link" type="button" onClick={goBack}>Back</button><div><Button onClick={() => { setGenerationProgress(0); setGenerationStatus(0); setStep(5); }}>Generate My Plan</Button><small>AI generation is limited. This uses one of your plan generations.</small></div></footer>}
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

function ReviewCarousel() {
  const [activeReview, setActiveReview] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const finishSwipe = (clientX: number) => {
    if (touchStart.current === null) return;
    const distance = clientX - touchStart.current;
    if (Math.abs(distance) > 45) {
      setActiveReview((current) => (
        distance < 0
          ? (current + 1) % reviews.length
          : (current - 1 + reviews.length) % reviews.length
      ));
    }
    touchStart.current = null;
  };

  const review = reviews[activeReview];

  return (
    <div
      className="review-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}
      aria-label="Member reviews"
    >
      <div className="review-slide" aria-live="polite">
        <span className={`review-avatar avatar-${activeReview + 1}`}>{review.initials}</span>
        <div className="review-content">
          <div className="review-meta">
            <strong>{review.name}</strong>
            <span className="review-stars" aria-label="5 out of 5 stars">
              {[0, 1, 2, 3, 4].map((star) => <Icon key={star} name="star" />)}
            </span>
          </div>
          <p>{review.comment}</p>
        </div>
      </div>
      <div className="review-dots" aria-label="Choose a review">
        {reviews.map((item, index) => (
          <button
            key={item.name}
            className={activeReview === index ? "active" : ""}
            onClick={() => setActiveReview(index)}
            aria-label={`Show review ${index + 1}`}
            aria-current={activeReview === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function BodyMap({
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

const memberNav = [
  { label: "Overview", path: "/dashboard", icon: "chart" },
  { label: "Workouts", path: "/workouts", icon: "bolt" },
  { label: "Progress", path: "/progress", icon: "calendar" },
  { label: "Generate", path: "/generate", icon: "spark" },
  { label: "Profile", path: "/profile", icon: "user" },
] as const;

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const prettyDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="member-empty"><span><Icon name="spark" /></span><h3>{title}</h3><p>{copy}</p></div>;
}

function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return <header className="dash-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1></div></header>;
}

function WorkoutCard({ workout, onStart }: { workout: PlannedWorkout; onStart: () => void }) {
  return (
    <article className="member-card workout-list-card">
      <div>
        <small>{prettyDate(workout.date)} · {workout.minutes} MIN {workout.optional ? "· OPTIONAL" : ""}</small>
        <h3>{workout.name}</h3>
        <p>{workout.equipment} · {workout.targetTags.join(" · ")}</p>
      </div>
      <Button onClick={onStart}>Start <Icon name="play" /></Button>
    </article>
  );
}

function OverviewPage({ store, navigate }: { store: FitnessStore; navigate: (path: string) => void }) {
  const today = new Date();
  const todayKey = dateKey(today);
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((today.getTime() - challengeStart.getTime()) / 86_400_000) + 1));
  const nextWorkout = store.plan.filter((workout) => workout.date >= todayKey && !workout.optional).sort((left, right) => left.date.localeCompare(right.date))[0] ?? store.plan[0];
  const workoutToday = nextWorkout?.date === todayKey;
  const activeMinutes = store.sessions.reduce((sum, session) => sum + session.duration, 0);
  const completedDates = new Set(store.sessions.map((session) => session.date));
  let streak = 0;
  const cursor = new Date(today);
  while (completedDates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const plannedDates = new Set(store.plan.map((workout) => workout.date));
  const firstName = store.user.username.split(/\s+/)[0] || "Member";

  return <>
    <PageHeader eyebrow={`DAY ${challengeDay}`} title={`Keep your rhythm, ${firstName}.`} />
    <div className="dash-layout">
      <div className="dash-primary">
        {nextWorkout ? <article className="today-workout">
          <div className="today-copy">
            <span className="workout-label">{workoutToday ? `TODAY'S WORKOUT · ${nextWorkout.minutes} MIN` : "REST DAY"}</span>
            <h2>{workoutToday ? nextWorkout.name : "Rest day"}</h2>
            <p>{workoutToday ? `${nextWorkout.exercises.length} exercises · ${nextWorkout.equipment} · ${nextWorkout.intensity ?? "Moderate"}` : `Next: ${nextWorkout.name}, ${new Date(`${nextWorkout.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}</p>
            {workoutToday && <Button onClick={() => navigate(`/session/${nextWorkout.id}`)}>Start workout <Icon name="play" /></Button>}
          </div>
          <div className="workout-art" aria-hidden="true" style={{ "--runner-logo": `url(${soferFitLogo})` } as React.CSSProperties} />
        </article> : <EmptyState title="Your first workout is waiting" copy="Visit Generate to create a workout that fits your day." />}
        <article className="dash-calendar-panel">
          <div className="panel-head"><div><h3>{today.toLocaleDateString(undefined, { month: "long" })} activity</h3></div><span>{streak ? `${streak} day streak` : "Start your streak"}</span></div>
          <div className="full-calendar">
            <div className="week days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
            <div className="calendar-grid">
              {calendarDays.map((date) => {
                const key = dateKey(date);
                const completed = completedDates.has(key);
                const isToday = key === todayKey;
                const planned = plannedDates.has(key);
                const className = completed ? "done" : isToday ? "today" : planned ? "upcoming" : "rest";
                return <span key={key} className={className} aria-label={`${date.toDateString()}, ${completed ? "completed" : isToday ? "today" : planned ? "upcoming" : "rest"}`}>{completed ? <Icon name="check" /> : date.getDate()}</span>;
              })}
            </div>
            <div className="calendar-legend"><span><i className="done" />Completed</span><span><i className="upcoming" />Upcoming</span><span><i className="today" />Today</span><span><i className="rest" />Rest</span></div>
          </div>
        </article>
      </div>
      <div className="dash-secondary">
        <div className="stat-row">
          <article><span className="dash-stat-icon"><Icon name="calendar" /></span><small>CHALLENGE</small><strong>Day {challengeDay} <i>/ {store.challenge.length}</i></strong><span>{Math.max(0, store.challenge.length - challengeDay)} days remaining</span></article>
          <article><span className="dash-stat-icon"><Icon name="bolt" /></span><small>ACTIVE TIME</small><strong>{activeMinutes < 60 ? `${activeMinutes}m` : `${(activeMinutes / 60).toFixed(1)}h`}</strong><span>{store.sessions.length ? `${store.sessions.length} sessions completed` : "Your first session is ready"}</span></article>
        </div>
        <article className="strength-card">
          <div className="panel-head"><div><small>BADGES</small><h3>{store.badges.some((badge) => badge.unlocked) ? "Your consistency is showing." : "Complete sessions to earn badges."}</h3></div><strong>{store.badges.filter((badge) => badge.unlocked).length}/{store.badges.length}</strong></div>
          <div className="badge-grid">{store.badges.map((badge) => <div className={badge.unlocked ? "unlocked" : ""} key={badge.id}><Icon name={badge.unlocked ? "check" : "star"} /><span>{badge.name}</span></div>)}</div>
        </article>
        <article className="encouragement"><p>“Small steps, repeated, become your transformation.”</p><span>KEEP YOUR RHYTHM · DAY {challengeDay}</span></article>
      </div>
    </div>
  </>;
}

function WorkoutsPage({ store, update, navigate, toast }: { store: FitnessStore; update: (next: FitnessStore) => void; navigate: (path: string) => void; toast: (message: string, error?: boolean) => void }) {
  const [tab, setTab] = useState<"week" | "plan" | "history">("week");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [viewWeek, setViewWeek] = useState<number | null>(null);
  const [settingsTargetId, setSettingsTargetId] = useState<string | null>(null);
  const [settingsEquipment, setSettingsEquipment] = useState<string[]>([]);
  const [settingsIntensity, setSettingsIntensity] = useState<"Easy" | "Moderate" | "Hard">("Moderate");
  const [settingsLowImpact, setSettingsLowImpact] = useState(false);
  const [settingsScope, setSettingsScope] = useState<"one" | "all">("one");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = dateKey(today);
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((today.getTime() - challengeStart.getTime()) / 86_400_000) + 1));
  const currentWeek = Math.max(0, Math.floor((challengeDay - 1) / 7));
  const displayedWeek = viewWeek ?? currentWeek;
  const totalWeeks = Math.ceil(store.challenge.length / 7);
  const selected = store.plan.find((workout) => workout.id === selectedId) ?? null;
  const completedIds = new Set(store.sessions.map((session) => session.workoutId));
  const completedKeys = new Set(store.sessions.map((session) => `${session.workoutId}-${session.date}`));
  const weekStart = new Date(challengeStart);
  weekStart.setDate(challengeStart.getDate() + displayedWeek * 7);
  const weekLength = Math.min(7, store.challenge.length - displayedWeek * 7);
  const weekDays = Array.from({ length: weekLength }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);
    return { date, key, workout: store.plan.find((item) => item.date === key) };
  });
  const weekEnd = weekDays.at(-1)?.date ?? weekStart;
  const todayWorkout = store.plan.find((workout) => workout.date === todayKey) ?? store.plan.filter((workout) => workout.date > todayKey && !workout.optional).sort((left, right) => left.date.localeCompare(right.date))[0] ?? null;
  const weeks = Array.from({ length: Math.ceil(store.challenge.length / 7) }, (_, index) => {
    const startOffset = index * 7;
    const endOffset = startOffset + 6;
    return {
      index,
      workouts: store.plan.filter((workout) => {
        const offset = Math.floor((new Date(`${workout.date}T12:00:00`).getTime() - challengeStart.getTime()) / 86_400_000);
        return offset >= startOffset && offset <= endOffset;
      }),
    };
  });
  const difficulty = selected?.intensity ?? (selected?.name.includes("Recovery") ? "Easy" : "Moderate");
  const defaultEquipment = store.user.equipment.includes("Gym") ? ["Gym machines & barbell"] : store.user.equipment.includes("Dumbbell") ? ["Dumbbells", "Resistance bands"] : ["Bodyweight only"];
  const automaticLowImpact = store.user.injuryFlag || (Number(store.user.age) > 0 && Number(store.user.age) < 18) || Number(store.user.age) >= 60;
  const openSettings = (workout: PlannedWorkout) => {
    setSettingsTargetId(workout.id);
    setSettingsEquipment(workout.equipment === "Bodyweight / Home" || workout.equipment.includes("Bodyweight") ? ["Bodyweight only"] : workout.equipment.includes("Gym") ? ["Gym machines & barbell"] : workout.equipment.includes("Dumbbell") ? ["Dumbbells", "Resistance bands"] : defaultEquipment);
    setSettingsIntensity(workout.intensity ?? "Moderate");
    setSettingsLowImpact(workout.lowImpact ?? automaticLowImpact);
    setSettingsScope("one");
  };
  const toggleSettingsEquipment = (item: string) => {
    setSettingsEquipment((current) => item === "Bodyweight only" ? ["Bodyweight only"] : [...current.filter((value) => value !== "Bodyweight only" && value !== item), ...(current.includes(item) ? [] : [item])]);
  };
  const savePlanSettings = () => {
    if (!settingsTargetId || !settingsEquipment.length) return;
    const equipmentLabel = settingsEquipment.length === 1 ? settingsEquipment[0] : settingsEquipment.join(" + ");
    const pools = {
      bodyweight: ["Bodyweight squats", "Incline push-ups", "Glute bridges", "Reverse lunges", "Mountain climbers", "Plank", "Bird dog", "Step jacks"],
      household: ["Backpack squats", "Incline push-ups", "Glute bridges", "Reverse lunges", "Water bottle rows", "Plank", "Bird dog", "Step jacks"],
      dumbbells: ["Dumbbell goblet squats", "Dumbbell floor press", "Dumbbell Romanian deadlifts", "Reverse lunges", "Dumbbell rows", "Plank", "Bird dog", "Dumbbell push press"],
      bands: ["Banded squats", "Banded chest press", "Banded glute bridges", "Reverse lunges", "Banded rows", "Plank", "Bird dog", "Banded step jacks"],
      gym: ["Barbell squats", "Machine chest press", "Cable pull-throughs", "Reverse lunges", "Seated cable rows", "Plank", "Bird dog", "Rowing intervals"],
    };
    const pool = settingsEquipment.includes("Gym machines & barbell") ? pools.gym : settingsEquipment.includes("Dumbbells") ? pools.dumbbells : settingsEquipment.includes("Resistance bands") ? pools.bands : settingsEquipment.includes("Household items (water bottles, backpack)") ? pools.household : pools.bodyweight;
    const prescription = settingsIntensity === "Easy" ? "30s work · 30s rest" : settingsIntensity === "Hard" ? "45s work · 15s rest" : "40s work · 20s rest";
    const plan = store.plan.map((workout) => {
      const applies = settingsScope === "all" ? workout.date >= todayKey : workout.id === settingsTargetId;
      if (!applies) return workout;
      const isRun = workout.name.includes("Walk-Run");
      return {
        ...workout,
        equipment: equipmentLabel,
        intensity: settingsIntensity,
        lowImpact: settingsLowImpact,
        sets: settingsIntensity === "Easy" ? 2 : settingsIntensity === "Hard" ? 4 : 3,
        exercises: isRun ? workout.exercises : workout.exercises.map((exercise, index) => ({ ...exercise, name: pool[index % pool.length], prescription })),
      };
    });
    update({ ...store, plan });
    setSettingsTargetId(null);
    toast(`Workout updated: ${equipmentLabel} · ${settingsIntensity}.`);
  };
  const moveWorkout = (nextDate: string) => {
    if (!selected || !nextDate) return;
    update({ ...store, plan: store.plan.map((workout) => workout.id === selected.id ? { ...workout, date: nextDate } : workout) });
    setShowMove(false);
    toast(`Workout moved to ${prettyDate(nextDate)}.`);
  };
  const closeDetail = () => {
    setSelectedId(null);
    setShowMove(false);
  };
  const openDetail = (workout?: PlannedWorkout) => workout && setSelectedId(workout.id);
  const startWorkout = (workout: PlannedWorkout) => navigate(`/session/${workout.id}`);

  useEffect(() => {
    if (tab !== "week" || displayedWeek !== currentWeek) return;
    const timer = window.setTimeout(() => document.querySelector(".seven-day-strip .day-card.today")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }), 50);
    return () => window.clearTimeout(timer);
  }, [tab, displayedWeek, currentWeek]);

  return <>
    <PageHeader eyebrow={`YOUR PLANS · DAY ${challengeDay}`} title="My workouts" />
    <div className="workout-tabs" role="tablist" aria-label="Workout views">
      {[["week", "This week"], ["plan", "Full plan"], ["history", "History"]].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value as "week" | "plan" | "history")}>{label}</button>)}
    </div>

    {tab === "week" && <div className="week-view">
      <div className="challenge-week-head">
        <div><strong>Week {displayedWeek + 1} of {totalWeeks} · {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><span>Day {challengeDay} of {store.challenge.length}</span></div>
        <div><button disabled={displayedWeek === 0} onClick={() => setViewWeek(Math.max(0, displayedWeek - 1))} aria-label="Previous challenge week"><Icon name="back" /></button><button disabled={displayedWeek === totalWeeks - 1} onClick={() => setViewWeek(Math.min(totalWeeks - 1, displayedWeek + 1))} aria-label="Next challenge week"><Icon name="arrow" /></button></div>
        <div className="challenge-day-progress"><i style={{ width: `${challengeDay / store.challenge.length * 100}%` }} /></div>
      </div>
      <div className="seven-day-strip">
        {weekDays.map(({ date, key, workout }) => {
          const isToday = key === todayKey;
          const elapsed = date < today;
          const completed = Boolean(workout && (completedKeys.has(`${workout.id}-${key}`) || ((elapsed || isToday) && completedIds.has(workout.id))));
          const state = completed ? "done" : isToday ? "today" : elapsed && workout ? "missed" : elapsed ? "elapsed-rest" : workout ? "upcoming" : "rest";
          const status = state === "done" ? "Done" : state === "missed" ? "Missed" : state === "today" ? "Today" : "Rest";
          return <article key={key} className={`day-card ${state}`}>
            <button className="day-card-main" onClick={() => openDetail(workout)} disabled={!workout}>
              <span className="day-card-date"><small>{date.toLocaleDateString(undefined, { weekday: "short" })}</small><strong>{date.getDate()}</strong></span>
              <span className="day-card-workout"><strong>{workout?.name || "Recovery day"}</strong><small>{workout ? `${workout.minutes} min` : "Rest & reset"}</small></span>
              <span className={`status-chip ${state}`}>{state === "done" ? <Icon name="check" /> : state === "missed" ? <Icon name="back" /> : !workout ? <Icon name="moon" /> : isToday ? <Icon name="calendar" /> : <Icon name="arrow" />}{status === "Rest" && workout ? "Upcoming" : status}</span>
            </button>
            {isToday && workout && <button className="day-start" onClick={() => startWorkout(workout)}>Start workout</button>}
            {state === "missed" && workout && <button className="reschedule-link" onClick={() => { openDetail(workout); setShowMove(true); }}>Reschedule</button>}
          </article>;
        })}
      </div>
      <div className="workout-legend"><span><i className="done"><Icon name="check" /></i>Done</span><span><i className="today"><Icon name="calendar" /></i>Today</span><span><i className="upcoming"><Icon name="arrow" /></i>Upcoming</span><span><i className="rest"><Icon name="moon" /></i>Rest</span><span><i className="missed"><Icon name="back" /></i>Missed</span></div>
      <div className="section-title"><div><small>YOUR NEXT SESSION</small><h2>{todayWorkout?.date === todayKey ? "Ready when you are." : "Coming up next"}</h2></div></div>
      {todayWorkout ? <article className="today-detail-card">
        <button className="plan-settings-button dark" onClick={() => openSettings(todayWorkout)} aria-label="Plan settings"><Icon name="sliders" /><span role="tooltip">Plan settings</span></button>
        <div><span className="workout-label">{new Date(`${todayWorkout.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()} · {todayWorkout.minutes} MIN</span><h2>{todayWorkout.name}</h2><p>{todayWorkout.exercises.length} exercises · <span>{todayWorkout.equipment}</span> · {todayWorkout.intensity ?? "Moderate"}</p><div className="target-chips">{todayWorkout.targetTags.map((tag) => <i key={tag}>{tag}</i>)}</div></div>
        <div className="today-detail-actions"><Button variant="ghost" onClick={() => openDetail(todayWorkout)}>View details</Button><Button onClick={() => startWorkout(todayWorkout)}>Start workout <Icon name="play" /></Button></div>
      </article> : <EmptyState title="A clear day to recover" copy="Rest supports your progress. Your next planned workout will appear here." />}
    </div>}

    {tab === "plan" && <div className="plan-weeks">
      {weeks.map((week) => {
        const expanded = openWeek === week.index || (openWeek === null && week.index === currentWeek);
        const completed = week.workouts.filter((workout) => completedIds.has(workout.id)).length;
        const planned = week.workouts.filter((workout) => !workout.optional).length;
        return <article className={`plan-week ${week.index > currentWeek ? "future" : ""}`} key={week.index}>
          <button className="plan-week-toggle" aria-expanded={expanded} onClick={() => setOpenWeek(expanded ? -1 : week.index)}>
            <span><small>WEEK {week.index + 1}</small><strong>{week.index === currentWeek ? "This week" : `Days ${week.index * 7 + 1}–${Math.min(store.challenge.length, week.index * 7 + 7)}`}</strong></span>
            <span>{completed}/{planned} sessions <i>{expanded ? "−" : "+"}</i></span>
          </button>
          {expanded && <div className="plan-week-workouts">{week.workouts.length ? week.workouts.map((workout) => <button key={workout.id} onClick={() => openDetail(workout)}><span><small>{prettyDate(workout.date)}</small><strong>{workout.name}</strong></span><span>{workout.minutes} min <Icon name="arrow" /></span></button>) : <p>Recovery week — no sessions scheduled.</p>}</div>}
        </article>;
      })}
    </div>}

    {tab === "history" && <div className="history-view">
      {store.sessions.length ? <div className="history-list">{store.sessions.slice().reverse().map((session) => {
        const workout = store.plan.find((item) => item.id === session.workoutId);
        return <article key={`${session.workoutId}-${session.date}`}><span className="dash-stat-icon"><Icon name="check" /></span><div><small>{prettyDate(session.date)}</small><h3>{workout?.name || "Completed workout"}</h3></div><div><strong>{session.duration} min</strong><span>Effort {session.effort}/5</span></div></article>;
      })}</div> : <div className="history-empty"><div className="history-illustration" aria-hidden="true"><span><Icon name="dumbbell" /></span><i /><i /></div><h3>Your finished workouts will show up here.</h3><p>Start today's session to log your first one.</p>{todayWorkout && <Button onClick={() => startWorkout(todayWorkout)}>Start workout <Icon name="play" /></Button>}</div>}
    </div>}

    {selected && <div className="workout-drawer-backdrop" onMouseDown={closeDetail}>
      <aside className="workout-detail-drawer" role="dialog" aria-modal="true" aria-label={`${selected.name} details`} onMouseDown={(event) => event.stopPropagation()}>
        <header><div className="drawer-header-actions"><button className="plan-settings-button" onClick={() => openSettings(selected)} aria-label="Plan settings"><Icon name="sliders" /><span role="tooltip">Plan settings</span></button><button className="drawer-close" onClick={closeDetail} aria-label="Close workout details">×</button></div><small>{selected.minutes} MIN · {difficulty.toUpperCase()}</small><h2>{selected.name}</h2><div className="target-chips"><i>{selected.equipment}</i>{selected.targetTags.map((tag) => <i key={tag}>{tag}</i>)}</div></header>
        <div className="drawer-scroll">
          {selected.name.includes("Walk-Run") && <div className="run-segments"><small>RUN SEGMENTS</small><p>Warm-up walk 5:00 · 8 × (jog 1:00 / walk 2:00) · cool-down 5:00</p></div>}
          <ol className="detail-exercises">{selected.exercises.map((exercise, index) => <li key={`${exercise.name}-${index}`}>
            <span className="exercise-number">{String(index + 1).padStart(2, "0")}</span><span className="dumbbell-icon"><Icon name="dumbbell" /></span>
            <div><strong>{exercise.name}</strong><small>{exercise.prescription}{selected.lowImpact && <em>Low-impact</em>}</small></div><i>{selected.targetTags[index % selected.targetTags.length]}</i>
          </li>)}</ol>
        </div>
        <footer>
          {showMove && <label className="move-date">Choose a new day<input type="date" min={todayKey} defaultValue={selected.date} onChange={(event) => moveWorkout(event.target.value)} /></label>}
          <div><Button variant="ghost" onClick={() => setShowMove((current) => !current)}><Icon name="calendar" /> Move to another day</Button><Button onClick={() => startWorkout(selected)}>Start workout <Icon name="play" /></Button></div>
          <p>General fitness guidance, not medical advice.</p>
        </footer>
      </aside>
    </div>}
    {settingsTargetId && <div className="plan-settings-backdrop" onMouseDown={() => setSettingsTargetId(null)}><div className="plan-settings-dialog" role="dialog" aria-modal="true" aria-label="Plan settings" onMouseDown={(event) => event.stopPropagation()}><header><div><small>WORKOUT PREFERENCES</small><h2>Plan settings</h2><p>Tell us what you have and how hard you want to train.</p></div><button onClick={() => setSettingsTargetId(null)} aria-label="Close plan settings"><Icon name="close" /></button></header><div className="plan-settings-body">
      <fieldset><legend>What equipment do you have for this plan?</legend><div className="settings-equipment">{["Bodyweight only", "Household items (water bottles, backpack)", "Dumbbells", "Resistance bands", "Gym machines & barbell"].map((item) => <button className={settingsEquipment.includes(item) ? "active" : ""} key={item} onClick={() => toggleSettingsEquipment(item)}>{settingsEquipment.includes(item) && <Icon name="check" />}{item}</button>)}</div></fieldset>
      <fieldset><legend>How intense should it be?</legend><div className="intensity-control">{([["Easy", "Lower impact, longer rests"], ["Moderate", "Balanced work and rest"], ["Hard", "More work, shorter rests"]] as const).map(([name, copy]) => <button className={settingsIntensity === name ? "active" : ""} key={name} onClick={() => setSettingsIntensity(name)}><strong>{name}</strong><small>{copy}</small></button>)}</div></fieldset>
      <label className="settings-toggle"><span><strong>Include low-impact versions</strong><small>Add joint-friendly alternatives where useful.</small></span><input type="checkbox" checked={settingsLowImpact} onChange={(event) => setSettingsLowImpact(event.target.checked)} /></label>
      <fieldset><legend>Apply to</legend><div className="settings-scope"><label><input type="radio" name="settings-scope" checked={settingsScope === "one"} onChange={() => setSettingsScope("one")} />This workout only</label><label><input type="radio" name="settings-scope" checked={settingsScope === "all"} onChange={() => setSettingsScope("all")} />All upcoming workouts</label></div></fieldset>
    </div><footer><button className="reset-settings" onClick={() => { setSettingsEquipment(defaultEquipment); setSettingsIntensity("Moderate"); setSettingsLowImpact(automaticLowImpact); setSettingsScope("one"); }}>Reset to profile defaults</button><div><Button variant="ghost" onClick={() => setSettingsTargetId(null)}>Cancel</Button><Button disabled={!settingsEquipment.length} onClick={savePlanSettings}>Save changes</Button></div></footer></div></div>}
  </>;
}

function ProgressPage({ store, update, toast }: { store: FitnessStore; update: (next: FitnessStore) => boolean; toast: (message: string, error?: boolean) => void }) {
  type ProgressTab = "overview" | "body" | "photos" | "badges";
  const [tab, setTab] = useState<ProgressTab>("overview");
  const [showWeight, setShowWeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [weightForm, setWeightForm] = useState({ date: dateKey(new Date()), weight: "", waist: "", hips: "", chest: "" });
  const [weightError, setWeightError] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoForm, setPhotoForm] = useState<{ date: string; angle: "Front" | "Side" | "Back"; image: string }>({ date: dateKey(new Date()), angle: "Front", image: "" });
  const [photoError, setPhotoError] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(Math.max(0, store.photos.length - 1));
  const [comparePosition, setComparePosition] = useState(50);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const unit = store.user.unitSystem === "metric" ? "kg" : "lb";
  const measurementUnit = store.user.unitSystem === "metric" ? "cm" : "in";
  const sortedWeights = store.weights.map((entry, index) => ({ ...entry, sourceIndex: index })).sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = sortedWeights[0]?.weight;
  const currentWeight = sortedWeights.at(-1)?.weight;
  const targetWeight = Number(store.user.targetWeight) || undefined;
  const targetProgress = startWeight !== undefined && currentWeight !== undefined && targetWeight !== undefined && startWeight !== targetWeight
    ? Math.max(0, Math.min(100, Math.round(((startWeight - currentWeight) / (startWeight - targetWeight)) * 100)))
    : 0;
  const activeMinutes = store.sessions.reduce((sum, session) => sum + session.duration, 0);
  const sessionDates = Array.from(new Set(store.sessions.map((session) => session.date))).sort();
  let bestStreak = 0;
  let runningStreak = 0;
  sessionDates.forEach((date, index) => {
    const previous = index ? new Date(`${sessionDates[index - 1]}T12:00:00`) : null;
    const current = new Date(`${date}T12:00:00`);
    runningStreak = previous && Math.round((current.getTime() - previous.getTime()) / 86_400_000) === 1 ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
  });
  let currentStreak = 0;
  const completedDateSet = new Set(sessionDates);
  const streakCursor = new Date();
  while (completedDateSet.has(dateKey(streakCursor))) {
    currentStreak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((Date.now() - challengeStart.getTime()) / 86_400_000) + 1));
  const currentWeek = Math.floor((challengeDay - 1) / 7);
  const weeklyCounts = Array.from({ length: Math.min(8, Math.ceil(store.challenge.length / 7)) }, (_, displayIndex) => {
    const weekIndex = Math.max(0, currentWeek - 3) + displayIndex;
    return {
      week: weekIndex,
      count: store.sessions.filter((session) => Math.floor((new Date(`${session.date}T12:00:00`).getTime() - challengeStart.getTime()) / (7 * 86_400_000)) === weekIndex).length,
    };
  }).filter((item) => item.week < Math.ceil(store.challenge.length / 7));
  const maxWeekly = Math.max(store.challenge.daysPerWeek, ...weeklyCounts.map((item) => item.count));
  const fastChange = (() => {
    if (!weightForm.weight || !sortedWeights.length) return false;
    const previous = sortedWeights.at(-1)!;
    const days = Math.max(1, Math.abs((new Date(`${weightForm.date}T12:00:00`).getTime() - new Date(`${previous.date}T12:00:00`).getTime()) / 86_400_000));
    const changeKg = Math.abs(Number(weightForm.weight) - previous.weight) * (store.user.unitSystem === "metric" ? 1 : .453592);
    return changeKg / days * 7 > 1;
  })();
  const unlockTrackingBadge = (id: string, badges = store.badges) => badges.map((badge) => badge.id === id ? { ...badge, unlocked: true, date: badge.date || dateKey(new Date()) } : badge);

  const openWeightModal = (entryIndex?: number) => {
    if (entryIndex === undefined) {
      setEditingWeight(null);
      setWeightForm({ date: dateKey(new Date()), weight: "", waist: "", hips: "", chest: "" });
    } else {
      const entry = store.weights[entryIndex];
      setEditingWeight(entryIndex);
      setWeightForm({ date: entry.date, weight: String(entry.weight), waist: String(entry.measurements?.waist ?? ""), hips: String(entry.measurements?.hips ?? ""), chest: String(entry.measurements?.chest ?? "") });
    }
    setWeightError("");
    setShowWeight(true);
  };
  const saveWeight = () => {
    const weight = Number(weightForm.weight);
    const minWeight = store.user.unitSystem === "metric" ? 25 : 55;
    const maxWeight = store.user.unitSystem === "metric" ? 400 : 880;
    const measurements = [weightForm.waist, weightForm.hips, weightForm.chest].filter(Boolean).map(Number);
    const minMeasurement = store.user.unitSystem === "metric" ? 30 : 12;
    const maxMeasurement = store.user.unitSystem === "metric" ? 300 : 120;
    if (!weightForm.date || !weight || weight < minWeight || weight > maxWeight || measurements.some((value) => value < minMeasurement || value > maxMeasurement)) {
      setWeightError(`Use ${minWeight}–${maxWeight} ${unit} and ${minMeasurement}–${maxMeasurement} ${measurementUnit} for measurements.`);
      return;
    }
    const entry = {
      date: weightForm.date,
      weight,
      measurements: {
        waist: weightForm.waist ? Number(weightForm.waist) : undefined,
        hips: weightForm.hips ? Number(weightForm.hips) : undefined,
        chest: weightForm.chest ? Number(weightForm.chest) : undefined,
      },
    };
    const weights = editingWeight === null ? [...store.weights, entry] : store.weights.map((item, index) => index === editingWeight ? entry : item);
    if (!update({ ...store, weights, user: { ...store.user, weight: String(weight) }, badges: unlockTrackingBadge("weight-1") })) return;
    setShowWeight(false);
    toast(editingWeight === null ? "Weight entry saved." : "Weight entry updated.");
  };
  const choosePhoto = (file?: File) => {
    setPhotoError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setPhotoError("Choose a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setPhotoError("Choose an image smaller than 5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return setPhotoError("We couldn't prepare that image. Please try another.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhotoForm((current) => ({ ...current, image: canvas.toDataURL("image/webp", .82) }));
      };
      image.onerror = () => setPhotoError("We couldn't preview that image. Please try another.");
      image.src = String(reader.result);
    };
    reader.onerror = () => setPhotoError("We couldn't read that image. Please try another.");
    reader.readAsDataURL(file);
  };
  const savePhoto = () => {
    if (!photoForm.image || !photoForm.date) return setPhotoError("Choose an image and date.");
    const photos = [...store.photos, photoForm].sort((a, b) => a.date.localeCompare(b.date));
    if (!update({ ...store, photos, badges: unlockTrackingBadge("photo-1") })) return;
    setAfterIndex(photos.length - 1);
    setShowPhoto(false);
    setPhotoForm({ date: dateKey(new Date()), angle: "Front", image: "" });
    toast("Progress photo added.");
  };

  const chartValues = sortedWeights.map((entry) => entry.weight);
  const chartBounds = [...chartValues, ...(targetWeight ? [targetWeight] : [])];
  const chartMin = chartBounds.length ? Math.min(...chartBounds) - 2 : 0;
  const chartMax = chartBounds.length ? Math.max(...chartBounds) + 2 : 1;
  const chartPoint = (value: number, index: number) => ({
    x: sortedWeights.length === 1 ? 40 : 40 + index / (sortedWeights.length - 1) * 560,
    y: 190 - ((value - chartMin) / Math.max(1, chartMax - chartMin)) * 150,
  });
  const points = sortedWeights.map((entry, index) => chartPoint(entry.weight, index));
  const badgeCatalog = [
    { category: "Streaks", id: "streak-3", name: "3-day streak", target: 3, value: bestStreak, detail: "Complete a workout on 3 consecutive days." },
    { category: "Streaks", id: "streak-7", name: "7-day streak", target: 7, value: bestStreak, detail: "Complete a workout on 7 consecutive days." },
    { category: "Streaks", id: "streak-14", name: "14-day streak", target: 14, value: bestStreak, detail: "Complete a workout on 14 consecutive days." },
    { category: "Streaks", id: "streak-30", name: "30-day streak", target: 30, value: bestStreak, detail: "Build a consistent 30-day workout streak." },
    { category: "Workouts", id: "workout-1", name: "First workout", target: 1, value: store.sessions.length, detail: "Finish and save your first workout." },
    { category: "Workouts", id: "workout-10", name: "10 workouts", target: 10, value: store.sessions.length, detail: "Finish 10 workout sessions." },
    { category: "Workouts", id: "workout-25", name: "25 workouts", target: 25, value: store.sessions.length, detail: "Finish 25 workout sessions." },
    { category: "Workouts", id: "workout-50", name: "50 workouts", target: 50, value: store.sessions.length, detail: "Finish 50 workout sessions." },
    { category: "Challenge milestones", id: "week-1", name: "Week 1 done", target: store.challenge.daysPerWeek, value: store.sessions.filter((session) => new Date(`${session.date}T12:00:00`).getTime() < challengeStart.getTime() + 7 * 86_400_000).length, detail: "Complete your planned sessions in the first week." },
    { category: "Challenge milestones", id: "halfway", name: "Halfway", target: Math.ceil(store.challenge.length / 2), value: challengeDay, detail: "Reach the halfway point of your challenge." },
    { category: "Challenge milestones", id: "finish", name: "Finish line", target: store.challenge.length, value: challengeDay, detail: "Reach the final day of your challenge." },
    { category: "Tracking", id: "weight-1", name: "First weigh-in", target: 1, value: store.weights.length, detail: "Save your first weight entry." },
    { category: "Tracking", id: "photo-1", name: "First photo", target: 1, value: store.photos.length, detail: "Add your first private progress photo." },
  ];
  const nextBadge = badgeCatalog.find((badge) => badge.value < badge.target);
  const selectedBadgeData = badgeCatalog.find((badge) => badge.id === selectedBadge);
  const photoGroups = store.photos.reduce<Record<string, { photo: FitnessStore["photos"][number]; index: number }[]>>((groups, photo, index) => {
    const week = Math.max(1, Math.floor((new Date(`${photo.date}T12:00:00`).getTime() - challengeStart.getTime()) / (7 * 86_400_000)) + 1);
    const key = `Week ${week}`;
    groups[key] = [...(groups[key] || []), { photo, index }];
    return groups;
  }, {});

  return <><PageHeader eyebrow="YOUR TRANSFORMATION" title="Progress" />
    <div className="workout-tabs progress-tabs" role="tablist" aria-label="Progress views">{[["overview", "Overview"], ["body", "Body"], ["photos", "Photos"], ["badges", "Badges"]].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value as ProgressTab)}>{label}</button>)}</div>

    {tab === "overview" && <div className="progress-overview">
      <article className="progress-hero">
        <div className="target-ring" style={{ "--target-progress": `${targetProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{targetProgress}%</strong><span>TARGET PROGRESS</span></div></div>
        <div><small>PHYSICAL PROGRESS</small><h2>{store.weights.length ? "Your trend, at a glance." : "Start with one simple check-in."}</h2>{store.weights.length ? <p><strong>{startWeight} {unit}</strong><Icon name="arrow" /><strong>{currentWeight} {unit}</strong><Icon name="arrow" /><strong>{targetWeight ? `${targetWeight} ${unit}` : "Set target"}</strong></p> : <p>Log your starting weight to begin.</p>}<Button onClick={() => { setTab("body"); openWeightModal(); }}>{store.weights.length ? "Log weight" : "Add starting weight"}</Button></div>
      </article>
      <div className="progress-stat-grid">
        {[["check", "WORKOUTS COMPLETED", String(store.sessions.length)], ["timer", "ACTIVE TIME", activeMinutes < 60 ? `${activeMinutes}m` : `${(activeMinutes / 60).toFixed(1)}h`], ["flame", "CURRENT STREAK", `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`], ["star", "BEST STREAK", `${bestStreak} ${bestStreak === 1 ? "day" : "days"}`]].map(([icon, label, value]) => <article key={label}><span className="dash-stat-icon"><Icon name={icon as "check" | "timer" | "flame" | "star"} /></span><small>{label}</small><strong>{value}</strong></article>)}
      </div>
      <article className="consistency-card"><div className="panel-head"><div><small>CONSISTENCY</small><h3>Workouts by week</h3></div><span>{store.sessions.length ? `${store.sessions.length} total` : "No sessions yet"}</span></div>{store.sessions.length ? <><div className="consistency-bars">{weeklyCounts.map((item) => <div key={item.week}><i className={item.week === currentWeek ? "current" : ""} style={{ height: `${Math.max(8, item.count / maxWeekly * 100)}%` }} /><span>W{item.week + 1}</span></div>)}</div></> : <EmptyState title="Your rhythm will appear here" copy="Complete your first workout to start building a weekly consistency view." />}</article>
    </div>}

    {tab === "body" && <div className="body-progress">
      <div className="progress-section-head"><div><small>BODY TRACKING</small><h2>Weight over time</h2></div><Button onClick={() => openWeightModal()}>Log weight</Button></div>
      <article className="weight-chart-card">{sortedWeights.length ? <><svg className="weight-chart" viewBox="0 0 640 230" role="img" aria-label="Weight entries over time"><line className="chart-axis" x1="40" y1="190" x2="600" y2="190" />{targetWeight && <><line className="target-line" x1="40" y1={chartPoint(targetWeight, 0).y} x2="600" y2={chartPoint(targetWeight, 0).y} /><text x="596" y={chartPoint(targetWeight, 0).y - 7} textAnchor="end">Target {targetWeight} {unit}</text></>}<polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} /><circle className="start-point" cx={points[0].x} cy={points[0].y} r="6" />{points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="5" />)}<text x={points[0].x} y={points[0].y - 12} textAnchor="middle">Start</text></svg><div className="weight-chart-dates"><span>{prettyDate(sortedWeights[0].date)}</span><span>{prettyDate(sortedWeights.at(-1)!.date)}</span></div></> : <EmptyState title="No entries yet." copy="Your first weigh-in becomes your starting point." />}</article>
      {sortedWeights.length > 0 && <article className="weight-entry-list"><div className="panel-head"><div><small>ENTRIES</small><h3>Your check-ins</h3></div></div>{sortedWeights.slice().reverse().map((entry) => <div key={`${entry.date}-${entry.sourceIndex}`}><div><strong>{entry.weight} {unit}</strong><span>{prettyDate(entry.date)}{entry.measurements && Object.values(entry.measurements).some(Boolean) ? ` · Measurements added` : ""}</span></div><div><button onClick={() => openWeightModal(entry.sourceIndex)}>Edit</button><button onClick={() => { update({ ...store, weights: store.weights.filter((_, index) => index !== entry.sourceIndex) }); toast("Weight entry deleted."); }}>Delete</button></div></div>)}</article>}
    </div>}

    {tab === "photos" && <div className="photos-progress">
      <div className="progress-section-head"><div><small>PHOTO LOG</small><h2>Progress photos</h2><p>Your photos are private and only visible to you.</p></div><div>{store.photos.length >= 2 && <Button variant="ghost" onClick={() => setCompareMode((value) => !value)}>{compareMode ? "View gallery" : "Compare"}</Button>}<Button onClick={() => { setPhotoError(""); setShowPhoto(true); }}>Add progress photo</Button></div></div>
      {compareMode && store.photos.length >= 2 ? <article className="photo-compare"><div className="compare-pickers"><label>Before<select value={beforeIndex} onChange={(event) => setBeforeIndex(Number(event.target.value))}>{store.photos.map((photo, index) => <option value={index} key={`${photo.date}-${index}`}>{prettyDate(photo.date)} · {photo.angle || "Front"}</option>)}</select></label><label>After<select value={afterIndex} onChange={(event) => setAfterIndex(Number(event.target.value))}>{store.photos.map((photo, index) => <option value={index} key={`${photo.date}-${index}`}>{prettyDate(photo.date)} · {photo.angle || "Front"}</option>)}</select></label></div><div className="compare-stage" style={{ "--compare-position": `${comparePosition}%` } as React.CSSProperties}><img src={store.photos[beforeIndex]?.image} alt={`Progress on ${prettyDate(store.photos[beforeIndex]?.date)}`} /><div><img src={store.photos[afterIndex]?.image} alt={`Progress on ${prettyDate(store.photos[afterIndex]?.date)}`} /></div><i /></div><label className="compare-slider">Drag to compare<input type="range" min="0" max="100" value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} /></label></article>
        : store.photos.length ? <div className="photo-weeks">{Object.entries(photoGroups).map(([week, photos]) => <section key={week}><h3>{week}</h3><div>{photos.map(({ photo, index }) => <article key={`${photo.date}-${index}`}><img src={photo.image} alt={`${photo.angle || "Front"} progress view from ${prettyDate(photo.date)}`} /><div><span><strong>{photo.angle || "Front"}</strong><small>{prettyDate(photo.date)}</small></span><button onClick={() => { update({ ...store, photos: store.photos.filter((_, photoIndex) => photoIndex !== index) }); toast("Photo deleted."); }}>Delete</button></div></article>)}</div></section>)}</div>
          : <div className="photo-empty"><span><Icon name="camera" /></span><h3>Take your Day 1 photo</h3><p>A private photo can help you notice changes that numbers may not capture.</p><Button onClick={() => setShowPhoto(true)}>Add progress photo</Button></div>}
    </div>}

    {tab === "badges" && <div className="badges-progress">
      <article className="badge-summary"><span className="badge-flame"><Icon name="flame" /></span><div><small>CURRENT STREAK</small><strong>{currentStreak} {currentStreak === 1 ? "day" : "days"}</strong></div>{nextBadge && <div className="next-badge"><span>Next: <strong>{nextBadge.name}</strong></span><div><i style={{ width: `${Math.min(100, nextBadge.value / nextBadge.target * 100)}%` }} /></div><small>{Math.min(nextBadge.value, nextBadge.target)}/{nextBadge.target}</small></div>}</article>
      {["Streaks", "Workouts", "Challenge milestones", "Tracking"].map((category) => <section className="badge-category" key={category}><h2>{category}</h2><div>{badgeCatalog.filter((badge) => badge.category === category).map((badge) => {
        const storedBadge = store.badges.find((item) => item.id === badge.id);
        const unlocked = Boolean(storedBadge?.unlocked || badge.value >= badge.target);
        return <button className={unlocked ? "unlocked" : ""} key={badge.id} onClick={() => setSelectedBadge(badge.id)}><span><Icon name={unlocked ? "star" : "bolt"} /></span><strong>{badge.name}</strong><small>{unlocked ? `Unlocked ${storedBadge?.date ? prettyDate(storedBadge.date) : "today"}` : `${Math.min(badge.value, badge.target)}/${badge.target}`}</small></button>;
      })}</div></section>)}
      {selectedBadgeData && <div className="badge-detail"><button onClick={() => setSelectedBadge(null)} aria-label="Close badge detail"><Icon name="close" /></button><span><Icon name="star" /></span><small>{selectedBadgeData.category}</small><h3>{selectedBadgeData.name}</h3><p>{selectedBadgeData.detail}</p><strong>{Math.min(selectedBadgeData.value, selectedBadgeData.target)}/{selectedBadgeData.target} complete</strong></div>}
    </div>}

    {showWeight && <div className="progress-modal-backdrop" onMouseDown={() => setShowWeight(false)}><div className="progress-modal" role="dialog" aria-modal="true" aria-label="Log weight" onMouseDown={(event) => event.stopPropagation()}><header><div><small>BODY CHECK-IN</small><h2>{editingWeight === null ? "Log weight" : "Edit entry"}</h2></div><button onClick={() => setShowWeight(false)} aria-label="Close"><Icon name="close" /></button></header><div className="progress-form"><label>Date<input type="date" value={weightForm.date} onChange={(event) => setWeightForm({ ...weightForm, date: event.target.value })} /></label><label>Weight ({unit})<input type="number" step=".1" value={weightForm.weight} onChange={(event) => { setWeightForm({ ...weightForm, weight: event.target.value }); setWeightError(""); }} /></label><span>OPTIONAL MEASUREMENTS · {measurementUnit.toUpperCase()}</span><label>Waist<input type="number" step=".1" value={weightForm.waist} onChange={(event) => setWeightForm({ ...weightForm, waist: event.target.value })} /></label><label>Hips<input type="number" step=".1" value={weightForm.hips} onChange={(event) => setWeightForm({ ...weightForm, hips: event.target.value })} /></label><label>Chest<input type="number" step=".1" value={weightForm.chest} onChange={(event) => setWeightForm({ ...weightForm, chest: event.target.value })} /></label></div>{fastChange && <p className="gentle-note">That's a fast change. Gradual progress is safer; we'll keep your plan paced.</p>}{weightError && <p className="inline-validation">{weightError}</p>}<Button onClick={saveWeight}>Save entry</Button></div></div>}
    {showPhoto && <div className="progress-modal-backdrop" onMouseDown={() => setShowPhoto(false)}><div className="progress-modal" role="dialog" aria-modal="true" aria-label="Add progress photo" onMouseDown={(event) => event.stopPropagation()}><header><div><small>PRIVATE PHOTO LOG</small><h2>Add progress photo</h2></div><button onClick={() => setShowPhoto(false)} aria-label="Close"><Icon name="close" /></button></header><label className="photo-upload">{photoForm.image ? <img src={photoForm.image} alt="Selected progress preview" /> : <span><Icon name="camera" /><strong>Choose a photo</strong><small>JPG, PNG or WebP · max 5 MB</small></span>}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label><div className="progress-form photo-meta"><label>Date<input type="date" value={photoForm.date} onChange={(event) => setPhotoForm({ ...photoForm, date: event.target.value })} /></label><label>Angle<select value={photoForm.angle} onChange={(event) => setPhotoForm({ ...photoForm, angle: event.target.value as "Front" | "Side" | "Back" })}><option>Front</option><option>Side</option><option>Back</option></select></label></div>{photoError && <p className="inline-validation">{photoError}</p>}<Button onClick={savePhoto}>Save photo</Button><p className="privacy-line">Your photos are private and only visible to you.</p></div></div>}
  </>;
}

function GeneratePage({ store, update, navigate, toast }: { store: FitnessStore; update: (next: FitnessStore) => boolean; navigate: (path: string) => void; toast: (message: string, error?: boolean) => void }) {
  type GeneratorState = "form" | "loading" | "result" | "error";
  type Focus = "Full Body" | "Upper Body" | "Lower Body" | "Core" | "Cardio / Running";
  type Training = "Fat Loss & Cardio" | "HIIT" | "Muscle & Strength" | "Walk-Run";
  type GeneratorEquipment = "Bodyweight / Home" | "Dumbbells & Bands" | "Gym Equipment";
  const nextMonday = (from = new Date()) => {
    const date = new Date(from);
    date.setHours(12, 0, 0, 0);
    const days = (8 - date.getDay()) % 7 || 7;
    date.setDate(date.getDate() + days);
    return dateKey(date);
  };
  const profileEquipment: GeneratorEquipment = store.user.equipment.includes("Gym") ? "Gym Equipment" : store.user.equipment.includes("Dumbbell") ? "Dumbbells & Bands" : "Bodyweight / Home";
  const profileTraining: Training = store.user.goal.includes("Muscle") ? "Muscle & Strength" : "Fat Loss & Cardio";
  const age = Number(store.user.age);
  const automaticLowImpact = store.user.injuryFlag || (age > 0 && age < 18) || age >= 60;
  const [generatorState, setGeneratorState] = useState<GeneratorState>("form");
  const [option, setOption] = useState<"single" | "adjust">("single");
  const [reason, setReason] = useState("");
  const [focus, setFocus] = useState<Focus>("Full Body");
  const [training, setTraining] = useState<Training>(profileTraining);
  const [equipment, setEquipment] = useState<GeneratorEquipment>(profileEquipment);
  const initialDuration = [15, 30, 45, 60].includes(store.challenge.sessionMinutes) ? String(store.challenge.sessionMinutes) : "custom";
  const [durationChoice, setDurationChoice] = useState(initialDuration);
  const [customDuration, setCustomDuration] = useState(initialDuration === "custom" ? String(store.challenge.sessionMinutes) : "");
  const [effort, setEffort] = useState<"Easy" | "Moderate" | "Hard">("Moderate");
  const [lowImpact, setLowImpact] = useState(automaticLowImpact);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [result, setResult] = useState<PlannedWorkout | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => store.plan.find((workout) => workout.date >= dateKey(new Date()) && !workout.optional)?.date || dateKey(new Date()));
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const resetDate = /^\d{4}-\d{2}-\d{2}$/.test(store.aiGenerations.resetDate) ? store.aiGenerations.resetDate : nextMonday();
  const resetDue = resetDate <= dateKey(new Date());
  const usedCount = resetDue ? 0 : store.aiGenerations.usedCount;
  const remaining = Math.max(0, 3 - usedCount);
  const duration = durationChoice === "custom" ? Number(customDuration) : Number(durationChoice);
  const valid = Boolean(focus && training && equipment && effort && duration >= 5 && duration <= 180 && (option === "single" || reason));

  useEffect(() => {
    const mondayReset = nextMonday();
    if (resetDue || resetDate !== mondayReset) {
      update({ ...store, aiGenerations: { usedCount: resetDue ? 0 : usedCount, resetDate: mondayReset } });
    }
  }, []);

  useEffect(() => {
    if (generatorState !== "loading") return;
    setLoadingMessage(0);
    const messageTimer = window.setInterval(() => setLoadingMessage((value) => (value + 1) % 3), 900);
    const resultTimer = window.setTimeout(() => {
      try {
        const exercisePools: Record<Focus, string[]> = {
          "Full Body": ["Squat to reach", "Incline push-up", "Reverse lunge", "Glute bridge", "Bird dog", "Standing knee drive", "Dead bug", "Marching finisher"],
          "Upper Body": ["Wall push-up", "Bent-over row", "Shoulder press", "Biceps curl", "Triceps extension", "Plank shoulder tap", "Lateral raise", "Chest press"],
          "Lower Body": ["Tempo squat", "Reverse lunge", "Glute bridge", "Calf raise", "Side lunge", "Wall sit", "Step-up", "Dead bug"],
          Core: ["Dead bug", "Bird dog", "Forearm plank", "Heel taps", "Side plank", "Bear hold", "Standing knee drive", "Glute bridge"],
          "Cardio / Running": training === "Walk-Run" ? ["Warm-up walk", "Jog interval", "Recovery walk", "Jog interval", "Recovery walk", "Steady finish", "Cool-down walk"] : ["March in place", "Step touch", "High knees", "Skater step", "Squat to reach", "Mountain climber", "Fast feet", "Breathing reset"],
        };
        const count = duration <= 15 ? 4 : duration <= 30 ? 6 : 8;
        const names = exercisePools[focus].slice(0, count);
        const isRun = focus === "Cardio / Running" && training === "Walk-Run";
        const generated: PlannedWorkout = {
          id: `generated-${Date.now()}`,
          date: scheduleDate,
          name: isRun ? "Fresh Walk-Run Intervals" : `${effort} ${focus} ${training === "HIIT" ? "Circuit" : "Session"}`,
          minutes: duration,
          equipment,
          targetTags: isRun ? ["Cardio", "Run"] : [focus, training],
          exercises: names.map((name, index) => ({
            name: lowImpact && /high knees|mountain climber|fast feet/i.test(name) ? `Low-impact ${name.toLowerCase()}` : name,
            prescription: isRun ? (index === 0 || index === names.length - 1 ? "5:00" : index % 2 ? "1:00 jog" : "2:00 walk") : training === "HIIT" ? "40 sec work · 20 sec rest" : effort === "Easy" ? "2 × 10 · 45 sec rest" : effort === "Hard" ? "4 × 12 · 30 sec rest" : "3 × 12 · 40 sec rest",
          })),
        };
        const nextStore = { ...store, aiGenerations: { usedCount: usedCount + 1, resetDate: nextMonday() } };
        if (!update(nextStore)) throw new Error("storage");
        setResult(generated);
        setGeneratorState("result");
      } catch {
        setGeneratorState("error");
      }
    }, 2800);
    return () => {
      window.clearInterval(messageTimer);
      window.clearTimeout(resultTimer);
    };
  }, [generatorState]);

  const startGeneration = () => {
    if (!remaining) return;
    setConfirmRegenerate(false);
    setGeneratorState("loading");
  };
  const addToPlan = (saveOnly = false) => {
    if (!result) return;
    const scheduled = { ...result, id: `${result.id}-${saveOnly ? "saved" : "plan"}`, date: scheduleDate, optional: saveOnly };
    const plan = option === "adjust" && !saveOnly
      ? store.plan.map((workout) => workout.date >= dateKey(new Date()) && !workout.optional ? { ...scheduled, id: workout.id, date: workout.date, name: workout.name.includes("Recovery") ? workout.name : scheduled.name } : workout)
      : [scheduled, ...store.plan];
    if (!update({ ...store, plan })) return;
    toast(option === "adjust" && !saveOnly ? "Your remaining challenge plan was re-balanced." : saveOnly ? "Workout saved to My workouts." : `Workout added for ${prettyDate(scheduleDate)}.`);
    navigate("/workouts");
  };
  const discard = () => {
    setResult(null);
    setGeneratorState("form");
  };
  const loadingCopy = ["Analyzing your profile...", "Balancing reps, rest, and equipment...", "Building your routine..."];

  return <><PageHeader title="Generate" />
    <div className="generate-header"><span>{remaining} of 3 generations left this week</span></div>
    <article className="generator-shell">
      {generatorState === "form" && <div className="generator-scroll">
        <div className="generator-options">
          <button className={option === "single" ? "selected" : ""} onClick={() => setOption("single")}><span className="generate-choice-icon"><Icon name="bolt" /></span><div><strong>Single workout</strong><small>A one-off routine for today or another day.</small></div><i>{option === "single" && <Icon name="check" />}</i></button>
          <button className={option === "adjust" ? "selected" : ""} onClick={() => setOption("adjust")}><span className="generate-choice-icon"><Icon name="calendar" /></span><div><strong>Adjust my challenge plan</strong><small>Re-balance the workouts in your remaining weeks.</small></div><i>{option === "adjust" && <Icon name="check" />}</i></button>
        </div>
        {option === "adjust" && <div className="reason-row"><small>WHAT CHANGED?</small><div>{["Too hard", "Too easy", "Schedule changed", "New equipment", "Plateau"].map((item) => <button className={reason === item ? "active" : ""} key={item} onClick={() => setReason(item)}>{item}</button>)}</div></div>}
        <div className="generator-form">
          <fieldset><legend>Focus area</legend><div className="generator-chips">{(["Full Body", "Upper Body", "Lower Body", "Core", "Cardio / Running"] as Focus[]).map((item) => <button className={focus === item ? "active" : ""} key={item} onClick={() => { setFocus(item); if (item !== "Cardio / Running" && training === "Walk-Run") setTraining("Fat Loss & Cardio"); }}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Training <span className="info-tip"><button type="button" aria-label="About training">ⓘ</button><span className="term-tooltip" role="tooltip"><strong>Training style</strong><span>This changes the pace, repetitions, work periods, and rest in your routine.</span><a href="/#glossary">View glossary</a></span></span></legend><div className="generator-chips">{(["Fat Loss & Cardio", "HIIT", "Muscle & Strength", ...(focus === "Cardio / Running" ? ["Walk-Run"] : [])] as Training[]).map((item) => <button className={training === item ? "active" : ""} key={item} onClick={() => setTraining(item)}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Equipment</legend><div className="generator-chips">{(["Bodyweight / Home", "Dumbbells & Bands", "Gym Equipment"] as GeneratorEquipment[]).map((item) => <button className={equipment === item ? "active" : ""} key={item} onClick={() => setEquipment(item)}>{item}</button>)}</div></fieldset>
          <div className="generator-row"><label>Duration<select value={durationChoice} onChange={(event) => setDurationChoice(event.target.value)}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="custom">Custom...</option></select></label>{durationChoice === "custom" && <label>Custom minutes<input type="number" min="5" max="180" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} placeholder="5–180" /></label>}</div>
          <fieldset><legend>Effort today</legend><div className="generator-chips">{(["Easy", "Moderate", "Hard"] as const).map((item) => <button className={effort === item ? "active" : ""} key={item} onClick={() => setEffort(item)}>{item}</button>)}</div></fieldset>
          <CustomCheckbox className="generator-toggle" checked={lowImpact} onChange={setLowImpact}><span><strong>Include low-impact options</strong><small>{automaticLowImpact ? "On based on your profile; you can change it here." : "Adds joint-friendly alternatives to the routine."}</small></span></CustomCheckbox>
        </div>
      </div>}

      {generatorState === "loading" && <div className="generator-loading" aria-live="polite"><span className="emerald-pulse"><Icon name="spark" /></span><strong>{loadingCopy[loadingMessage]}</strong><div className="generator-skeleton">{[0, 1, 2].map((item) => <div key={item}><i /><span><i /><i /></span></div>)}</div></div>}

      {generatorState === "result" && result && <div className="generator-result">
        <header><div><small>YOUR GENERATED ROUTINE</small><h2>{result.name}</h2><p>{result.minutes} min · {result.equipment}</p></div><div className="target-chips">{result.targetTags.map((tag) => <i key={tag}>{tag}</i>)}</div></header>
        <div className="generated-exercises">{result.exercises.map((exercise, index) => <article key={`${exercise.name}-${index}`}><span className="dumbbell-icon"><Icon name="dumbbell" /></span><div><strong>{exercise.name}</strong><small>{exercise.prescription}</small></div><i>{result.targetTags[index % result.targetTags.length]}</i></article>)}</div>
        <div className="why-plan"><span><Icon name="spark" /></span><div><strong>Why this plan</strong><ul><li>{equipment === "Bodyweight / Home" ? "Bodyweight-focused, since that's your selected equipment." : `${equipment} movements match the setup you selected.`}</li><li>{lowImpact ? "Low-impact swaps are included so you can adjust as needed." : `${effort} effort keeps today's session aligned with how you feel.`}</li></ul></div></div>
        <p className="generator-guidance">AI suggestions are general fitness guidance, not medical advice.</p>
      </div>}

      {generatorState === "error" && <div className="generator-message"><span><Icon name="spark" /></span><h2>Let's try that again.</h2><p>We couldn't generate a new plan. Your current plan is unchanged and no generation was used.</p><Button onClick={() => setGeneratorState("form")}>Try again</Button></div>}

      <footer className="generator-actions">
        {generatorState === "form" && <><Button onClick={startGeneration} disabled={!valid || !remaining}>Generate routine</Button><small>AI generation is limited, use wisely.</small>{!remaining && <p className="limit-message">You've used all 3 generations this week. They reset on {prettyDate(resetDate)}. In the meantime, swap exercises in <button onClick={() => navigate("/workouts")}>My workouts</button>.</p>}</>}
        {generatorState === "result" && result && <><div className="schedule-action"><label>Add to my plan<input type="date" min={dateKey(new Date())} value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><Button onClick={() => addToPlan(false)}>Add to my plan</Button></div><div className="result-actions"><Button variant="ghost" onClick={() => addToPlan(true)}>Save to My workouts</Button><Button variant="ghost" onClick={() => setConfirmRegenerate(true)} disabled={!remaining}>Regenerate</Button><button onClick={discard}>Discard</button></div>{confirmRegenerate && <div className="regenerate-confirm"><p>Regenerating uses another of your weekly generations.</p><button onClick={() => setConfirmRegenerate(false)}>Cancel</button><Button onClick={startGeneration}>Use 1 generation</Button></div>}</>}
      </footer>
    </article>
  </>;
}

function ProfilePage({ store, update, toast, onLogout, onOpenGlossary }: { store: FitnessStore; update: (next: FitnessStore) => boolean; toast: (message: string, error?: boolean) => void; onLogout: () => void; onOpenGlossary: (term?: string) => void }) {
  const sectionNames = ["Account", "Body profile", "Training", "Health & safety", "Notifications", "Privacy & data", "Help"] as const;
  type SectionName = typeof sectionNames[number];
  const [user, setUser] = useState(store.user);
  const [challenge, setChallenge] = useState(store.challenge);
  const [preferences, setPreferences] = useState(store.preferences);
  const [editing, setEditing] = useState<SectionName | null>(null);
  const [expanded, setExpanded] = useState<SectionName>("Account");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showRestart, setShowRestart] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [durationChoice, setDurationChoice] = useState([15, 30, 45, 60].includes(challenge.sessionMinutes) ? String(challenge.sessionMinutes) : "custom");
  const [customDuration, setCustomDuration] = useState([15, 30, 45, 60].includes(challenge.sessionMinutes) ? "" : String(challenge.sessionMinutes));
  const challengeDay = Math.max(1, Math.min(challenge.length, Math.floor((Date.now() - new Date(`${challenge.startDate}T12:00:00`).getTime()) / 86_400_000) + 1));
  const initials = user.username.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const passwordRules = [
    ["At least 8 characters", passwords.next.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(passwords.next)],
    ["One lowercase letter", /[a-z]/.test(passwords.next)],
    ["One number", /\d/.test(passwords.next)],
  ] as const;
  const cancel = () => {
    setUser(store.user);
    setChallenge(store.challenge);
    setPreferences(store.preferences);
    setPasswords({ current: "", next: "", confirm: "" });
    setError("");
    setEditing(null);
  };
  const save = (section: SectionName) => {
    setError("");
    if (section === "Account") {
      if (!user.username.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return setError("Enter a name and valid email.");
      if (passwords.current || passwords.next || passwords.confirm) {
        if (!passwords.current) return setError("Enter your current password.");
        if (!passwordRules.every((rule) => rule[1])) return setError("Your new password does not meet all the rules.");
        if (passwords.next !== passwords.confirm) return setError("New passwords do not match.");
      }
    }
    if (section === "Body profile") {
      const ageValue = Number(user.age);
      const heightCm = parseHeightCm(user.height, user.unitSystem);
      const weightKg = parseWeightKg(user.weight, user.unitSystem);
      const targetKg = user.targetWeight ? parseWeightKg(user.targetWeight, user.unitSystem) : 0;
      if (!ageValue || ageValue < 10 || ageValue > 100) return setError("Age must be between 10 and 100.");
      if (!heightCm || heightCm < 100 || heightCm > 250) return setError(`Height must be between ${user.unitSystem === "metric" ? "100–250 cm" : "approximately 3 ft 3 in–8 ft 2 in"}.`);
      if (!weightKg || weightKg < 25 || weightKg > 300 || (targetKg && (targetKg < 25 || targetKg > 300))) return setError(`Weight must be between ${user.unitSystem === "metric" ? "25–300 kg" : "55–661 lb"}.`);
      if (!user.somatotype || !user.goal || !user.experience || !user.activityLevel) return setError("Complete each body profile selection.");
    }
    if (section === "Training") {
      const minutes = durationChoice === "custom" ? Number(customDuration) : Number(durationChoice);
      if (challenge.daysPerWeek < 2 || challenge.daysPerWeek > 6 || minutes < 5 || minutes > 180) return setError("Choose 2–6 workout days and a session duration from 5–180 minutes.");
      setChallenge({ ...challenge, sessionMinutes: minutes });
      if (!update({ ...store, user, challenge: { ...challenge, sessionMinutes: minutes }, preferences })) return;
    } else if (!update({ ...store, user, challenge, preferences })) return;
    setPasswords({ current: "", next: "", confirm: "" });
    setEditing(null);
    toast(`${section} saved.`);
  };
  const sectionActions = (section: SectionName) => editing === section
    ? <div className="profile-section-actions"><Button variant="ghost" onClick={cancel}>Cancel</Button><Button onClick={() => save(section)}>Save</Button></div>
    : <button className="profile-edit" onClick={() => { setError(""); setEditing(section); }}>Edit</button>;
  const selectSection = (section: SectionName) => {
    setExpanded(section);
    document.getElementById(`profile-${section.toLowerCase().replace(/[^a-z]+/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const chooseAvatar = (file?: File) => {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Choose a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("Choose an image smaller than 5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return setError("We couldn't prepare that photo.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const avatar = canvas.toDataURL("image/webp", .82);
        const nextUser = { ...user, avatar };
        setUser(nextUser);
        if (update({ ...store, user: nextUser })) toast("Profile photo updated.");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const restartChallenge = () => {
    const fresh = createFitnessStore({
      name: user.username, email: user.email, avatarUrl: user.avatar, age: user.age, height: user.height, weight: user.weight, targetWeight: user.targetWeight,
      somatotype: user.somatotype, goal: user.goal, experience: user.experience, activity: user.activityLevel, unitSystem: user.unitSystem,
      availableEquipment: user.equipment, hasCondition: user.injuryFlag, challengeDays: challenge.length, workoutDays: challenge.daysPerWeek,
      sessionMinutes: challenge.sessionMinutes, challengeStartDate: new Date().toISOString(),
    });
    const restarted = { ...fresh, user: { ...fresh.user, ...user }, preferences, weights: store.weights, photos: store.photos };
    if (update(restarted)) {
      setChallenge(restarted.challenge);
      setShowRestart(false);
      toast("Challenge restarted at Day 1. We kept your weights and photos.");
    }
  };
  const downloadData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soferfit-data.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Your data export is ready.");
  };
  const healthyPace = Boolean(user.weight && user.targetWeight) && (parseWeightKg(user.weight, user.unitSystem) - parseWeightKg(user.targetWeight, user.unitSystem)) / (challenge.length / 7) > 1;
  const cardClass = (section: SectionName) => `profile-section-card ${expanded === section ? "mobile-expanded" : ""}`;

  return <><PageHeader eyebrow="YOUR ACCOUNT" title="Profile" />
    <article className="profile-header-card"><div className="profile-avatar-wrap"><button className="profile-avatar-large" onClick={() => avatarInputRef.current?.click()} aria-label="Change photo">{user.avatar ? <img src={user.avatar} alt="" /> : initials}</button><button className="profile-avatar-camera" onClick={() => avatarInputRef.current?.click()} aria-label="Change photo"><Icon name="camera" /><span role="tooltip">Change photo</span></button><input ref={avatarInputRef} className="profile-avatar-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => chooseAvatar(event.target.files?.[0])} /></div><div className="profile-header-copy"><h2>{user.username}</h2><p>{user.email || "Add your email"}</p><span>Member since {prettyDate(user.memberSince)}</span></div><div className="profile-header-actions"><strong>Day {challengeDay} / {challenge.length}</strong><button onClick={onLogout}><Icon name="logout" />Log out</button></div></article>
    {error && <p className="profile-global-error inline-validation">{error}</p>}
    <div className="profile-layout">
      <nav className="profile-subnav" aria-label="Profile sections">{sectionNames.map((section) => <button className={expanded === section ? "active" : ""} key={section} onClick={() => selectSection(section)}>{section}<Icon name="arrow" /></button>)}</nav>
      <div className="profile-sections">
        <article id="profile-account" className={cardClass("Account")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Account")}><span><small>ACCOUNT</small><h2>Sign-in details</h2></span><i>{expanded === "Account" ? "−" : "+"}</i></button>{sectionActions("Account")}</header><div className="profile-section-body"><div className="profile-field-grid"><label>Name<input disabled={editing !== "Account"} value={user.username} onChange={(event) => setUser({ ...user, username: event.target.value })} /></label><label>Email<input disabled={editing !== "Account"} type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} /></label></div>{editing === "Account" && <div className="password-edit"><h3>Change password</h3><div className="profile-field-grid"><label>Current password<input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label><label>New password<input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label><label>Confirm new password<input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></label></div><ul>{passwordRules.map(([rule, met]) => <li className={met ? "met" : ""} key={rule}><Icon name={met ? "check" : "close"} />{rule}</li>)}</ul></div>}</div></article>

        <article id="profile-body-profile" className={cardClass("Body profile")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Body profile")}><span><small>BODY PROFILE</small><h2>Your baseline</h2></span><i>{expanded === "Body profile" ? "−" : "+"}</i></button>{sectionActions("Body profile")}</header><div className="profile-section-body">
          <div className="profile-choice-group"><span>Units</span><div><button disabled={editing !== "Body profile"} className={user.unitSystem === "metric" ? "active" : ""} onClick={() => setUser({ ...user, unitSystem: "metric" })}>Metric</button><button disabled={editing !== "Body profile"} className={user.unitSystem === "imperial" ? "active" : ""} onClick={() => setUser({ ...user, unitSystem: "imperial" })}>Imperial</button></div></div>
          <div className="profile-field-grid four"><label>Age<input disabled={editing !== "Body profile"} type="number" value={user.age} onChange={(event) => setUser({ ...user, age: event.target.value })} /></label><label>Height ({user.unitSystem === "metric" ? "cm" : "ft / in"})<input disabled={editing !== "Body profile"} type={user.unitSystem === "metric" ? "number" : "text"} placeholder={user.unitSystem === "metric" ? "175" : "5 ft 8 in"} value={user.height} onChange={(event) => setUser({ ...user, height: event.target.value })} /></label><label>Current weight ({user.unitSystem === "metric" ? "kg" : "lb"})<input disabled={editing !== "Body profile"} type="number" value={user.weight} onChange={(event) => setUser({ ...user, weight: event.target.value })} /></label><label>Target weight<input disabled={editing !== "Body profile"} type="number" value={user.targetWeight} onChange={(event) => setUser({ ...user, targetWeight: event.target.value })} /></label></div>
          <div className="somatotype-label"><span>Somatotype</span><button onClick={() => onOpenGlossary("Somatotype")} aria-label="Open somatotype glossary">ⓘ</button></div><div className="profile-somatotypes">{[["Ectomorph", "Naturally leaner frame"], ["Mesomorph", "Naturally athletic frame"], ["Endomorph", "Naturally broader frame"], ["Not Sure", "Use my other details"]].map(([name, copy]) => <button disabled={editing !== "Body profile"} className={user.somatotype === name ? "active" : ""} key={name} onClick={() => setUser({ ...user, somatotype: name })}><strong>{name}</strong><small>{copy}</small></button>)}</div>
          <div className="profile-field-grid three"><label>Primary goal<select disabled={editing !== "Body profile"} value={user.goal} onChange={(event) => setUser({ ...user, goal: event.target.value })}><option value="">Choose a goal</option><option>Lose Fat & Get Lean</option><option>Build Muscle & Strength</option><option>Body Recomposition</option></select></label><label>Experience level<select disabled={editing !== "Body profile"} value={user.experience} onChange={(event) => setUser({ ...user, experience: event.target.value })}><option value="">Choose experience</option><option>Starting Out</option><option>Some Experience</option><option>Consistent</option></select></label><label>Activity level<select disabled={editing !== "Body profile"} value={user.activityLevel} onChange={(event) => setUser({ ...user, activityLevel: event.target.value })}><option value="">Choose activity</option><option>Sedentary</option><option>Sometimes Active</option><option>Moderately Active</option><option>Very Active</option></select></label></div>{healthyPace && <p className="gentle-note">That target may call for a faster pace. Gradual, sustainable changes are easier to maintain; your plan will stay balanced.</p>}
        </div></article>

        <article id="profile-training" className={cardClass("Training")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Training")}><span><small>TRAINING</small><h2>Plan preferences</h2></span><i>{expanded === "Training" ? "−" : "+"}</i></button>{sectionActions("Training")}</header><div className="profile-section-body"><div className="profile-field-grid three"><label>Equipment<select disabled={editing !== "Training"} value={user.equipment} onChange={(event) => setUser({ ...user, equipment: event.target.value })}><option>Bodyweight / Home Only</option><option>Dumbbells & Bands</option><option>Full Gym Access</option></select></label><label>Workout days per week<input disabled={editing !== "Training"} type="number" min="2" max="6" value={challenge.daysPerWeek} onChange={(event) => setChallenge({ ...challenge, daysPerWeek: Number(event.target.value) })} /></label><label>Session duration<select disabled={editing !== "Training"} value={durationChoice} onChange={(event) => setDurationChoice(event.target.value)}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="custom">Custom...</option></select></label>{durationChoice === "custom" && <label>Custom minutes<input disabled={editing !== "Training"} type="number" min="5" max="180" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} /></label>}<label>Challenge length<input disabled value={`${challenge.length} days`} /></label></div><div className="danger-row"><div><strong>Restart challenge</strong><span>Return the plan and calendar to Day 1.</span></div><button onClick={() => setShowRestart(true)}>Restart challenge</button></div></div></article>

        <article id="profile-health-safety" className={cardClass("Health & safety")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Health & safety")}><span><small>HEALTH & SAFETY</small><h2>Exercise preferences</h2></span><i>{expanded === "Health & safety" ? "−" : "+"}</i></button>{sectionActions("Health & safety")}</header><div className="profile-section-body"><CustomCheckbox className="profile-check checkbox-leading" disabled={editing !== "Health & safety"} checked={user.injuryFlag} onChange={(checked) => setUser({ ...user, injuryFlag: checked })}><span><strong>I have an injury or health condition</strong><small>When on, lower-impact exercises are favored.</small></span></CustomCheckbox><p className="safety-disclaimer">SoferFit offers general fitness guidance, not medical advice. Check with a doctor before starting if you have a health condition.</p></div></article>

        <article id="profile-notifications" className={cardClass("Notifications")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Notifications")}><span><small>NOTIFICATIONS</small><h2>Stay on track</h2></span><i>{expanded === "Notifications" ? "−" : "+"}</i></button>{sectionActions("Notifications")}</header><div className="profile-section-body"><div className="notification-list"><CustomCheckbox className="notification-option" disabled={editing !== "Notifications"} checked={preferences.workoutReminders} onChange={(checked) => setPreferences({ ...preferences, workoutReminders: checked })}><span><strong>Workout reminders</strong><small>A reminder on planned workout days.</small></span></CustomCheckbox>{preferences.workoutReminders && <label className="reminder-time"><span>Reminder time</span><input disabled={editing !== "Notifications"} type="time" value={preferences.reminderTime} onChange={(event) => setPreferences({ ...preferences, reminderTime: event.target.value })} /></label>}<CustomCheckbox className="notification-option" disabled={editing !== "Notifications"} checked={preferences.streakReminders} onChange={(checked) => setPreferences({ ...preferences, streakReminders: checked })}><span><strong>Streak reminders</strong><small>A gentle prompt when your streak is active.</small></span></CustomCheckbox><CustomCheckbox className="notification-option" disabled={editing !== "Notifications"} checked={preferences.weeklySummary} onChange={(checked) => setPreferences({ ...preferences, weeklySummary: checked })}><span><strong>Weekly progress summaries</strong><small>A short recap of your training week.</small></span></CustomCheckbox></div></div></article>

        <article id="profile-privacy-data" className={cardClass("Privacy & data")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Privacy & data")}><span><small>PRIVACY & DATA</small><h2>Your information</h2></span><i>{expanded === "Privacy & data" ? "−" : "+"}</i></button></header><div className="profile-section-body"><div className="privacy-statement"><Icon name="camera" /><div><strong>Your progress photos are private</strong><span>They are stored with your local profile and only visible to you.</span></div></div><button className="profile-row-action" onClick={downloadData}><span><strong>Download my data</strong><small>Export your profile and progress as JSON.</small></span><Icon name="arrow" /></button><div className="danger-zone"><strong>Delete my account</strong><p>This removes your profile and all locally saved progress.</p>{showDelete ? <div><label>Type DELETE to confirm<input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} /></label><Button variant="ghost" disabled={deleteText !== "DELETE"} onClick={onLogout}>Delete my account</Button><button onClick={() => { setShowDelete(false); setDeleteText(""); }}>Cancel</button></div> : <button onClick={() => setShowDelete(true)}>Delete my account</button>}</div></div></article>

        <article id="profile-help" className={cardClass("Help")}><header><button className="profile-mobile-toggle" onClick={() => setExpanded("Help")}><span><small>HELP</small><h2>Resources</h2></span><i>{expanded === "Help" ? "−" : "+"}</i></button></header><div className="profile-section-body profile-help-links"><button onClick={() => onOpenGlossary()}><span><strong>Glossary</strong><small>Plain-language fitness terms.</small></span><Icon name="arrow" /></button><a href="mailto:feedback@soferfit.example"><span><strong>Send feedback</strong><small>Tell us what would make SoferFit better.</small></span><Icon name="arrow" /></a><div><span><strong>About SoferFit</strong><small>Adaptive fitness planning for sustainable routines.</small></span><b>Version 1.0</b></div></div></article>
      </div>
    </div>
    {showRestart && <div className="progress-modal-backdrop"><div className="end-dialog" role="dialog" aria-modal="true"><span className="dash-stat-icon"><Icon name="calendar" /></span><h2>Restart challenge?</h2><p>Your workout plan, sessions, badges, and calendar will reset to Day 1. Saved weights and progress photos will be kept.</p><Button onClick={restartChallenge}>Restart at Day 1</Button><Button variant="ghost" onClick={() => setShowRestart(false)}>Cancel</Button></div></div>}
  </>;
}

function SessionPlayer({ workout, store, update, navigate, toast }: { workout: PlannedWorkout; store: FitnessStore; update: (next: FitnessStore) => void; navigate: (path: string) => void; toast: (message: string) => void }) {
  type PlayerScreen = "ready" | "countdown" | "active" | "complete";
  type Phase = "work" | "rest";
  const isRunning = workout.name.includes("Walk-Run") || workout.targetTags.includes("Run");
  const [screen, setScreen] = useState<PlayerScreen>("ready");
  const [countdown, setCountdown] = useState(3);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(40);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reps, setReps] = useState(0);
  const [cueIndex, setCueIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [effort, setEffort] = useState(3);
  const [note, setNote] = useState("");
  const [distance, setDistance] = useState("");
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [wakeScreen, setWakeScreen] = useState(true);
  const [demoSpeed, setDemoSpeed] = useState(false);
  const [indoor, setIndoor] = useState(false);
  const [sessionSwaps, setSessionSwaps] = useState<Record<number, string>>({});
  const equipmentItems = isRunning ? ["Comfortable shoes", "Water bottle", "Safe route or clear indoor space"] : [workout.equipment, "Clear floor space", "Water nearby"];
  const [equipmentReady, setEquipmentReady] = useState(() => equipmentItems.map(() => false));
  const [runIndex, setRunIndex] = useState(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const runningSegments = useMemo(() => [
    { label: "WALK", name: "Warm-up walk", duration: 300 },
    ...Array.from({ length: 16 }, (_, index) => ({ label: index % 2 === 0 ? "JOG" : "WALK", name: index % 2 === 0 ? "Easy jog" : "Recovery walk", duration: index % 2 === 0 ? 60 : 120 })),
    { label: "WALK", name: "Cool-down walk", duration: 300 },
  ], []);
  const currentExercise = workout.exercises[exerciseIndex];
  const displayName = sessionSwaps[exerciseIndex] || currentExercise?.name || workout.name;
  const isTimed = workout.name.includes("HIIT") || /plank|hold|climber|jump|high knees/i.test(displayName);
  const totalSets = workout.sets ?? (isTimed ? 4 : 3);
  const phaseLabel = isRunning ? runningSegments[runIndex].label : phase === "rest" ? "REST" : "WORK";
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const cues = /push/i.test(displayName)
    ? ["Keep your core tight", "Breathe out as you push", "Keep a long line from head to heel"]
    : /squat|lunge/i.test(displayName)
      ? ["Soft knees on landing", "Press the floor away", "Keep your chest comfortably lifted"]
      : ["Move with control", "Keep breathing steadily", "Choose a pace you can sustain"];

  const beep = (double = false) => {
    if (!sound || muted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      [0, ...(double ? [0.14] : [])].forEach((delay) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = double ? 720 : 620;
        gain.gain.setValueAtTime(.08, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + delay + .09);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + .1);
      });
    } catch {
      // Sound is an enhancement; the visible phase labels remain the source of truth.
    }
  };
  const announce = (message: string) => {
    if (!voice || muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  };
  const signalChange = (message: string) => {
    beep(true);
    announce(message);
    if (vibration && "vibrate" in navigator) navigator.vibrate([80, 50, 80]);
  };
  const finishWorkout = () => {
    setPaused(true);
    setScreen("complete");
  };
  const advanceExercise = (direction = 1) => {
    const next = exerciseIndex + direction;
    if (next < 0) return;
    if (next >= workout.exercises.length) return finishWorkout();
    setExerciseIndex(next);
    setSetIndex(0);
    setPhase("work");
    setRemaining(40);
    setReps(0);
    signalChange(`Next exercise, ${sessionSwaps[next] || workout.exercises[next].name}`);
  };
  const finishRest = () => {
    if (setIndex + 1 < totalSets) {
      setSetIndex((value) => value + 1);
      setPhase("work");
      setRemaining(40);
      setReps(0);
      signalChange("Work");
    } else {
      advanceExercise();
    }
  };
  const finishWork = () => {
    setPhase("rest");
    setRemaining(20);
    signalChange("Rest");
  };
  const finishRunSegment = () => {
    if (runIndex + 1 >= runningSegments.length) return finishWorkout();
    const next = runIndex + 1;
    setRunIndex(next);
    setRemaining(runningSegments[next].duration);
    signalChange(`${runningSegments[next].label === "JOG" ? "Jog" : "Walk"} now`);
  };
  const moveRunSegment = (direction: number) => {
    const next = Math.max(0, Math.min(runningSegments.length - 1, runIndex + direction));
    setRunIndex(next);
    setRemaining(runningSegments[next].duration);
  };
  const saveSession = (partial = false, destination = "/dashboard") => {
    const completedExercises = workout.exercises.slice(0, Math.min(workout.exercises.length, exerciseIndex + (partial ? 1 : workout.exercises.length))).map((exercise, index) => sessionSwaps[index] || exercise.name);
    const existing = store.sessions.some((session) => session.workoutId === workout.id && session.date === dateKey(new Date()));
    if (!existing) {
      const sessions = [...store.sessions, { workoutId: workout.id, date: dateKey(new Date()), duration: Math.max(1, Math.round(elapsed / 60)), exercisesDone: completedExercises, effort }];
      const completionDates = new Set(sessions.map((session) => session.date));
      let currentStreak = 0;
      const cursor = new Date();
      while (completionDates.has(dateKey(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      const challengeDay = Math.max(1, Math.floor((Date.now() - new Date(`${store.challenge.startDate}T12:00:00`).getTime()) / 86_400_000) + 1);
      const badges = store.badges.map((badge) => {
        const requirements: Record<string, boolean> = {
          "streak-3": currentStreak >= 3,
          "streak-7": currentStreak >= 7,
          "streak-14": currentStreak >= 14,
          "streak-30": currentStreak >= 30,
          "workout-1": sessions.length >= 1,
          "workout-10": sessions.length >= 10,
          "workout-25": sessions.length >= 25,
          "workout-50": sessions.length >= 50,
          "week-1": sessions.length >= store.challenge.daysPerWeek,
          halfway: challengeDay >= store.challenge.length / 2,
          finish: challengeDay >= store.challenge.length,
        };
        const unlock = requirements[badge.id] ?? badge.unlocked;
        return unlock && !badge.unlocked ? { ...badge, unlocked: true, date: dateKey(new Date()) } : badge;
      });
      update({ ...store, sessions, badges });
    }
    toast(partial ? "Partial session saved." : "Workout saved. Your progress is updated.");
    navigate(destination);
  };

  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) {
      signalChange(isRunning ? "Start walking" : "Begin");
      setScreen("active");
      setRemaining(isRunning ? runningSegments[0].duration : 40);
      return;
    }
    beep();
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), demoSpeed ? 100 : 1000);
    return () => window.clearTimeout(timer);
  }, [screen, countdown, demoSpeed]);

  useEffect(() => {
    if (screen !== "active" || paused) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      if (isRunning || phase === "rest" || isTimed) setRemaining((value) => Math.max(0, value - 1));
    }, demoSpeed ? 100 : 1000);
    return () => window.clearInterval(timer);
  }, [screen, paused, demoSpeed, isRunning, isTimed, phase]);

  useEffect(() => {
    if (screen !== "active" || paused) return;
    if (remaining > 0 && remaining <= 3) beep();
    if (remaining !== 0) return;
    if (isRunning) finishRunSegment();
    else if (phase === "rest") finishRest();
    else if (isTimed) finishWork();
  }, [remaining, screen, paused]);

  useEffect(() => {
    if (screen !== "active") return;
    const timer = window.setInterval(() => setCueIndex((value) => value + 1), demoSpeed ? 1500 : 15000);
    return () => window.clearInterval(timer);
  }, [screen, demoSpeed, exerciseIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSettings) return;
      if (event.key === "Escape") setShowEnd(true);
      if (screen !== "active") return;
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key === "ArrowRight") isRunning ? finishRunSegment() : advanceExercise();
      if (event.key === "ArrowLeft" && !isRunning) advanceExercise(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, showSettings, isRunning, exerciseIndex, runIndex]);

  useEffect(() => {
    const manageWakeLock = async () => {
      const wakeNavigator = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
      if (wakeScreen && screen === "active" && wakeNavigator.wakeLock) {
        try { wakeLock.current = await wakeNavigator.wakeLock.request("screen"); } catch { wakeLock.current = null; }
      } else if (wakeLock.current) {
        await wakeLock.current.release();
        wakeLock.current = null;
      }
    };
    void manageWakeLock();
    return () => { if (wakeLock.current) void wakeLock.current.release(); };
  }, [wakeScreen, screen]);

  const settingsButton = <button className="player-icon-button" onClick={() => setShowSettings(true)} aria-label="Session settings"><Icon name="gear" /></button>;
  const settingsSheet = showSettings && <div className="player-modal-backdrop" onMouseDown={() => setShowSettings(false)}><aside className="settings-sheet" role="dialog" aria-modal="true" aria-label="Session settings" onMouseDown={(event) => event.stopPropagation()}><header><div><small>SESSION PREFERENCES</small><h2>Settings</h2></div><button className="player-icon-button" onClick={() => setShowSettings(false)} aria-label="Close settings"><Icon name="close" /></button></header><div className="setting-list">
    {[["Sound beeps", sound, setSound], ["Voice cues", voice, setVoice], ["Vibration on mobile", vibration, setVibration], ["Keep screen awake", wakeScreen, setWakeScreen], ["Demo speed 10×", demoSpeed, setDemoSpeed]].map(([label, checked, setter]) => <label key={String(label)}><span><strong>{String(label)}</strong>{label === "Demo speed 10×" && <small>For presentations</small>}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<boolean>>)(event.target.checked)} /></label>)}
  </div></aside></div>;

  if (screen === "ready" || screen === "countdown") return <main className="session-player ready-screen">
    <header><button className="player-icon-button" onClick={() => navigate("/workouts")} aria-label="Close session"><Icon name="close" /></button>{settingsButton}</header>
    {screen === "countdown" ? <section className="start-countdown" aria-live="assertive"><small>GET READY</small><strong>{countdown || "GO"}</strong><p>{workout.name}</p></section> : <section className="ready-content">
      <div className="ready-heading"><small>{workout.minutes} MIN · {workout.exercises.length} EXERCISES</small><h1>{workout.name}</h1><p>Check your setup, then begin when you feel ready.</p></div>
      <div className="ready-grid"><ol>{workout.exercises.map((exercise, index) => <li key={exercise.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{exercise.name}</strong><small>{exercise.prescription}</small></li>)}</ol><div className="equipment-checklist"><small>EQUIPMENT CHECK</small>{equipmentItems.map((item, index) => <button className={equipmentReady[index] ? "checked" : ""} key={item} onClick={() => setEquipmentReady((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))}><span>{equipmentReady[index] && <Icon name="check" />}</span>{item}</button>)}</div></div>
      <p className="safety-line">Stop if you feel dizzy, sharp pain, or chest pain. This is general fitness guidance, not medical advice.</p>
      <Button onClick={() => { setCountdown(3); setScreen("countdown"); }}>Begin <Icon name="play" /></Button>
    </section>}
    {settingsSheet}
  </main>;

  if (screen === "complete") {
    const projectedCount = store.sessions.some((session) => session.workoutId === workout.id && session.date === dateKey(new Date())) ? store.sessions.length : store.sessions.length + 1;
    const completionDates = new Set([...store.sessions.map((session) => session.date), dateKey(new Date())]);
    let completionStreak = 0;
    const streakCursor = new Date();
    while (completionDates.has(dateKey(streakCursor))) {
      completionStreak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
    }
    const completionRequirements: Record<string, boolean> = {
      "streak-3": completionStreak >= 3,
      "streak-7": completionStreak >= 7,
      "streak-14": completionStreak >= 14,
      "streak-30": completionStreak >= 30,
      "workout-1": projectedCount >= 1,
      "workout-10": projectedCount >= 10,
      "workout-25": projectedCount >= 25,
      "workout-50": projectedCount >= 50,
    };
    const earnedBadge = store.badges.find((badge) => !badge.unlocked && completionRequirements[badge.id]);
    return <main className="session-player complete-screen"><header>{settingsButton}</header><section><span className="completion-mark"><Icon name="check" /></span><small>DAY {Math.max(1, Math.floor((Date.now() - new Date(`${store.challenge.startDate}T12:00:00`).getTime()) / 86_400_000) + 1)}</small><h1>Workout complete</h1><p>Great job showing up today.</p>
      <div className="completion-stats"><div><strong>{formatTime(elapsed)}</strong><span>Total time</span></div><div><strong>{isRunning ? runIndex + 1 : Math.min(workout.exercises.length, exerciseIndex + 1)}</strong><span>{isRunning ? "Intervals" : "Exercises"}</span></div><div><strong>{isRunning ? "—" : exerciseIndex * totalSets + setIndex + 1}</strong><span>Sets</span></div></div>
      <div className="earned-banner"><Icon name="star" /><div><strong>{earnedBadge ? `${earnedBadge.name} badge unlocked` : "Your streak is growing"}</strong><span>Streak: {completionStreak} {completionStreak === 1 ? "day" : "days"}</span></div></div>
      <div className="effort-rating"><strong>How did that feel?</strong><div>{[["Easy", 2], ["Just right", 3], ["Hard", 5]].map(([label, value]) => <button key={String(label)} className={effort === value ? "active" : ""} onClick={() => setEffort(Number(value))}>{label}</button>)}</div></div>
      {isRunning && <label className="completion-field">Distance (km) · optional<input type="number" min="0" step=".1" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="0.0" /></label>}
      <label className="completion-field">Add a note · optional<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="How did the session feel?" /></label>
      <div className="completion-actions"><Button onClick={() => saveSession(false)}>Save and back to dashboard</Button><Button variant="ghost" onClick={() => saveSession(false, "/progress")}>Log my weight</Button></div>
    </section>{settingsSheet}</main>;
  }

  const totalRunDuration = runningSegments.reduce((sum, segment) => sum + segment.duration, 0);
  const runRemaining = runningSegments.slice(runIndex + 1).reduce((sum, segment) => sum + segment.duration, 0) + remaining;
  const progress = isRunning ? ((totalRunDuration - runRemaining) / totalRunDuration) * 100 : ((exerciseIndex + (phase === "rest" ? .8 : .25)) / workout.exercises.length) * 100;
  return <main className="session-player active-player">
    <header className="active-topbar"><button className="player-icon-button" onClick={() => setShowEnd(true)} aria-label="End workout"><Icon name="close" /></button><div><strong>{workout.name}</strong><span>{isRunning ? `Segment ${runIndex + 1} of ${runningSegments.length}` : `Exercise ${exerciseIndex + 1} of ${workout.exercises.length}`}</span></div><span className="elapsed-time">{formatTime(elapsed)}</span>{settingsButton}<div className="overall-progress"><i style={{ width: `${Math.max(2, progress)}%` }} /></div></header>
    <section className="active-content">
      {isRunning ? <div className="running-phase">
        <div className={`phase-label ${phaseLabel.toLowerCase()}`}><Icon name={phaseLabel === "JOG" ? "bolt" : "walk"} />{phaseLabel}</div>
        <div className={`timer-ring ${phaseLabel.toLowerCase()}`}><strong>{formatTime(remaining)}</strong><span>{runningSegments[runIndex].name}</span></div>
        <h2>{runIndex === 0 ? "Warm-up" : runIndex === runningSegments.length - 1 ? "Cool-down" : `Interval ${Math.ceil(runIndex / 2)} of 8`}</h2><p>{phaseLabel === "JOG" ? "Easy pace. You should be able to hold a conversation." : "Brisk walk, let your breathing settle."}</p>
        {remaining <= 3 && runIndex < runningSegments.length - 1 && <div className="transition-callout">{runningSegments[runIndex + 1].label === "JOG" ? "Jog" : "Walk"} in {remaining}</div>}
        <button className={`indoor-toggle ${indoor ? "active" : ""}`} onClick={() => setIndoor((value) => !value)}><span>{indoor && <Icon name="check" />}</span>No space or hot weather? March or jog in place.</button>
        <small className="outdoor-tip">In warm weather, go early morning or evening and bring water.</small>
        <div className="run-times"><span>Total elapsed <strong>{formatTime(elapsed)}</strong></span><span>Remaining <strong>{formatTime(runRemaining)}</strong></span></div>
        <div className="segment-timeline">{runningSegments.map((segment, index) => <i key={index} className={index === runIndex ? "current" : index < runIndex ? "done" : ""} title={segment.name} />)}</div>
      </div> : phase === "rest" ? <div className="rest-phase">
        <div className="timer-ring rest"><div className="phase-label rest"><Icon name="timer" />REST</div><strong>{remaining}</strong><span>seconds</span></div>
        <div className="breathing-copy"><span /><strong>Breathe in... breathe out...</strong><small>Sip some water</small></div>
        <div className="rest-actions"><button onClick={() => setRemaining((value) => value + 15)}>+15s</button><button onClick={finishRest}>Skip rest</button></div>
        <div className="next-up-card"><small>NEXT UP</small><strong>{setIndex + 1 < totalSets ? displayName : workout.exercises[exerciseIndex + 1]?.name || "Finish strong"}</strong><span>{setIndex + 1 < totalSets ? `Set ${setIndex + 2} of ${totalSets}` : workout.exercises[exerciseIndex + 1]?.prescription}</span></div>
      </div> : isTimed ? <div className="timed-phase">
        <div className="timer-ring work"><div className="phase-label work"><Icon name="bolt" />WORK</div><strong>{remaining}</strong><span>seconds</span></div>
        <h1>{displayName}</h1><p>Round {setIndex + 1} of {totalSets}</p>
      </div> : <div className="reps-phase">
        <div className="exercise-illustration"><Icon name="dumbbell" /></div><div className="phase-label work"><Icon name="bolt" />WORK</div><h1>{displayName}</h1><p>Set {setIndex + 1} of {totalSets} · <strong>12 reps</strong></p>
        <div className="rep-counter"><span>{reps}</span><button onClick={() => setReps((value) => value + 1)} aria-label="Add repetition">+</button></div><Button onClick={finishWork}>Done set</Button>
        <ul><li>Brace your core before each rep</li><li>Move through a comfortable range</li><li>Exhale through the effort</li></ul>
        <div className="next-up-chip">Next up: {setIndex + 1 < totalSets ? `Rest, then set ${setIndex + 2}` : workout.exercises[exerciseIndex + 1]?.name || "Cool down"}</div>
      </div>}
      {!isRunning && phase === "work" && <div className="session-options"><button onClick={() => setSessionSwaps({ ...sessionSwaps, [exerciseIndex]: `Easier ${currentExercise.name.toLowerCase()}` })}>Easier option</button><button onClick={() => setSessionSwaps({ ...sessionSwaps, [exerciseIndex]: `Low-impact ${currentExercise.name.toLowerCase()}` })}>Low-impact option</button></div>}
      <div className="cue-banner" key={`${exerciseIndex}-${cueIndex}`}><small>CUE</small><strong>{isRunning ? (phaseLabel === "JOG" ? "Relax your shoulders and find your rhythm" : "Let your breathing settle") : cues[cueIndex % cues.length]}</strong></div>
    </section>
    <footer className="player-controls"><button onClick={() => isRunning ? moveRunSegment(-1) : advanceExercise(-1)}><Icon name="back" />Previous</button><button className="pause-button" onClick={() => setPaused((value) => !value)}>{paused ? <Icon name="play" /> : <Icon name="pause" />}{paused ? "Resume" : "Pause"}</button><button onClick={() => isRunning ? finishRunSegment() : advanceExercise()}>Skip<Icon name="arrow" /></button><button className={muted ? "muted" : ""} onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute session" : "Mute session"}><Icon name="volume" /></button></footer>
    {showEnd && <div className="player-modal-backdrop"><div className="end-dialog" role="dialog" aria-modal="true"><span className="dash-stat-icon"><Icon name="timer" /></span><h2>End workout?</h2><p>You can keep going, save what you completed, or discard this session.</p><Button onClick={() => setShowEnd(false)}>Keep going</Button><Button variant="ghost" onClick={() => saveSession(true)}>Save partial session</Button><button className="discard-action" onClick={() => navigate("/workouts")}>Discard</button></div></div>}
    {settingsSheet}
  </main>;
}

function DashboardPage({ path, navigate, onHome, onLogout, profile }: { path?: string; navigate: (path: string) => void; onHome: () => void; onLogout: () => void; profile: SignupAnswers | null }) {
  const activePath = typeof path === "string" && path.length > 0 ? path : window.location.pathname || "/dashboard";
  const [store, setStore] = useState(() => readFitnessStore(profile));
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [profileGlossary, setProfileGlossary] = useState<{ open: boolean; term?: string }>({ open: false });
  const update = (next: FitnessStore) => {
    try {
      writeFitnessStore(next);
      setStore(next);
      return true;
    } catch {
      setToast({ message: "We couldn't save that change. Try a smaller image or free some browser storage.", error: true });
      return false;
    }
  };
  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 3200);
  };
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((Date.now() - challengeStart.getTime()) / 86_400_000) + 1));
  const logout = async () => {
    await api.logout();
    clearFitnessStore();
    onLogout();
  };
  if (activePath.startsWith("/session/")) {
    const workout = store.plan.find((item) => item.id === decodeURIComponent(activePath.split("/").pop() || ""));
    return workout ? <><SessionPlayer workout={workout} store={store} update={update} navigate={navigate} toast={showToast} />{toast && <div className={`app-toast ${toast.error ? "error" : ""}`}>{toast.message}</div>}</> : <main className="session-player"><EmptyState title="Workout not found" copy="Return to your plan and choose another workout." /><Button onClick={() => navigate("/workouts")}>Back to workouts</Button></main>;
  }
  const content = activePath === "/workouts" ? <WorkoutsPage store={store} update={update} navigate={navigate} toast={showToast} />
    : activePath === "/progress" ? <ProgressPage store={store} update={update} toast={showToast} />
      : activePath === "/generate" ? <GeneratePage store={store} update={update} navigate={navigate} toast={showToast} />
        : activePath === "/profile" ? <ProfilePage store={store} update={update} toast={showToast} onLogout={logout} onOpenGlossary={(term) => setProfileGlossary({ open: true, term })} />
          : <OverviewPage store={store} navigate={navigate} />;
  return (
    <main className="dashboard-page">
      <aside className="dash-sidebar">
        <button className="brand" onClick={onHome}><LogoMark />SoferFit</button>
        <nav aria-label="Dashboard navigation">{memberNav.map((item) => <button key={item.path} className={activePath === item.path ? "active" : ""} onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <div className="challenge-mini"><small>{store.challenge.length}-DAY CHALLENGE</small><strong>Day {challengeDay}</strong><div><i style={{ width: `${(challengeDay / store.challenge.length) * 100}%` }} /></div><span>{Math.max(0, store.challenge.length - challengeDay)} days to go</span></div>
        <button className="sidebar-glossary" onClick={() => setProfileGlossary({ open: true })} aria-label="Open glossary"><span><Icon name="book" /></span><div><strong>Glossary</strong><small>Fitness terms, explained</small></div></button>
      </aside>
      <section className="dash-main">{content}</section>
      <GlossaryDrawer open={profileGlossary.open} initialTerm={profileGlossary.term} onClose={() => setProfileGlossary({ open: false })} />
      {toast && <div className={`app-toast ${toast.error ? "error" : ""}`} role="status">{toast.message}</div>}
    </main>
  );
}

function App() {
  const [gender, setGender] = useState<Gender>("Man");
  const [orientation, setOrientation] = useState<Orientation>("Front");
  const [selected, setSelected] = useState<Muscle | null>(null);
  const [fullBody, setFullBody] = useState(false);
  const [mode, setMode] = useState<TrainingMode>("Fat Loss & Cardio");
  const [equipment, setEquipment] = useState<Equipment>("No Equipment / Bodyweight");
  const [routineState, setRoutineState] = useState<"idle" | "loading" | "results">("idle");
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [explorerAge, setExplorerAge] = useState("");
  const [explorerHeight, setExplorerHeight] = useState("");
  const [explorerWeight, setExplorerWeight] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryTerm, setGlossaryTerm] = useState<string>();
  const [memberProfile, setMemberProfile] = useState<SignupAnswers | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(localStorage.getItem("soferfit-member")));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [path, setPath] = useState(window.location.pathname);
  const [view, setView] = useState<"home" | "dashboard">(() => window.location.pathname === "/" ? "home" : "dashboard");
  const [appToast, setAppToast] = useState<string | null>(null);
  const focusArea = fullBody ? "Full Body" : selected;
  const prescription = mode === "Fat Loss & Cardio"
    ? "3 x 15 · 30s rest"
    : mode === "HIIT"
      ? "40s work / 20s rest × 4 rounds"
      : "4 x 8 · 90s rest";
  const list = useMemo(() => {
    if (fullBody) {
      return fullBodyExercises[equipment].map((exercise) => ({
        ...exercise,
        level: mode,
        reps: prescription,
        equipment,
      }));
    }
    if (!selected) return [];
    return exercises[selected].slice(0, 4).map((exercise) => ({
      name: equipment === "Gym Equipment" ? exercise.gym : exercise.bodyweight,
      tag: selected,
      level: mode,
      reps: prescription,
      equipment,
    }));
  }, [selected, fullBody, mode, equipment, prescription]);
  const metricErrors = {
    age: explorerAge && (+explorerAge < 10 || +explorerAge > 100) ? "10–100" : "",
    height: explorerHeight && (+explorerHeight < 100 || +explorerHeight > 250) ? "100–250 cm" : "",
    weight: explorerWeight && (+explorerWeight < 25 || +explorerWeight > 300) ? "25–300 kg" : "",
  };

  const navigate = (nextPath: string, replace = false) => {
    if (replace) window.history.replaceState({}, "", nextPath);
    else window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    setView(nextPath === "/" ? "home" : "dashboard");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (routineState !== "loading") return;
    setLoadingMessage(0);
    const messageTimer = window.setInterval(() => setLoadingMessage((current) => (current + 1) % 2), 1200);
    const resultTimer = window.setTimeout(() => setRoutineState("results"), 3500);
    return () => {
      window.clearInterval(messageTimer);
      window.clearTimeout(resultTimer);
    };
  }, [routineState]);

  useEffect(() => {
    const onPopState = () => {
      const nextPath = window.location.pathname;
      setPath(nextPath);
      setView(nextPath === "/" ? "home" : "dashboard");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (path !== "/" && !isSignedIn) navigate("/", true);
  }, [isSignedIn, path]);

  useEffect(() => {
    if (!appToast) return;
    const timer = window.setTimeout(() => setAppToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [appToast]);

  const openGlossary = (term?: string) => {
    setGlossaryTerm(term);
    setShowGlossary(true);
  };
  const selectMuscle = (muscle: Muscle) => {
    setSelected((current) => !fullBody && current === muscle ? null : muscle);
    setFullBody(false);
    setRoutineState("idle");
  };
  const selectFullBody = () => {
    setFullBody((current) => !current);
    setSelected(null);
    setRoutineState("idle");
  };
  const updateMode = (nextMode: TrainingMode) => {
    setMode(nextMode);
    setRoutineState("idle");
  };
  const updateEquipment = (nextEquipment: Equipment) => {
    setEquipment(nextEquipment);
    setRoutineState("idle");
  };
  
  if (view === "dashboard" && isSignedIn) return <DashboardPage path={path} navigate={navigate} profile={memberProfile} onHome={() => navigate("/")} onLogout={() => {
    setMemberProfile(null);
    setIsSignedIn(false);
    setAppToast("You've been logged out.");
    navigate("/", true);
  }} />;

  return (
    <main className="landing-page">
      <nav className="nav shell">
        <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <LogoMark />
          SoferFit
        </button>
        <div className="nav-links">
          <a href="#features">How it works</a>
          <a href="#challenge">Challenge</a>
          <a href="#explore">Explore</a>
        </div>
        {isSignedIn ? <div className="member-menu-wrap">
          <button className="member-menu-trigger" onClick={() => setShowProfileMenu((current) => !current)} aria-expanded={showProfileMenu}>
            <span>{memberProfile?.avatarUrl ? <img src={memberProfile.avatarUrl} alt="" /> : memberProfile?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF"}</span>
            <strong>{memberProfile?.name.split(/\s+/)[0] || "Member"}</strong>
          </button>
          {showProfileMenu && <div className="member-menu"><button onClick={() => navigate("/dashboard")}>Dashboard</button><button onClick={async () => { await api.logout(); clearFitnessStore(); setMemberProfile(null); setIsSignedIn(false); setShowProfileMenu(false); setAppToast("You've been logged out."); }}>Log out</button></div>}
        </div> : <div className="nav-auth">
          <button className="login-link" onClick={() => setShowLogin(true)}>Log in</button>
          <Button variant="dark" onClick={() => setShowSignup(true)}>Sign up</Button>
        </div>}
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <h1>Your body.<br />Your goals.</h1>
          <p>Adaptive training tailored to your body type, designed for weight management, and structured 60–90 day challenges.</p>
          <ReviewCarousel />
          <div className="hero-trust-actions">
            <div className="trust-row">
              <div className="avatars"><span>J</span><span>M</span><span>A</span></div>
              <div className="rating"><Icon name="star" /><strong>4.9/5</strong></div>
            </div>
            <div className="hero-actions">
              <Button className="hero-explore" onClick={() => document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" })}>
                Build Your Routine <Icon name="arrow" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <img className="welcome-image" src={welcomeImage} alt="Athlete training in a green outdoor setting" />
          <div className="float-card workout-card">
            <span className="card-icon"><Icon name="bolt" /></span>
            <div><small>TODAY'S FOCUS</small><strong>Upper body + core</strong></div>
          </div>
          <div className="float-card progress-card">
            <div className="progress-ring">32%</div>
            <div><small>TRACK PROGRESS</small><strong>Visualize accomplishments</strong></div>
          </div>
          <div className="float-card plan-card">
            <span className="card-icon"><Icon name="spark" /></span>
            <div><small>SMART PLANNING</small><strong>Adapts to you</strong></div>
          </div>
          <div className="float-card coach-card">
            <span className="card-icon"><Icon name="check" /></span>
            <div><small>GUIDED WORKOUT</small><strong>Cues + rest timer</strong></div>
          </div>
        </div>
      </section>

      <div className="metric-strip">
        <div><strong>100%</strong><span>FREE</span></div>
        <div><strong>60–90</strong><span>DAY CHALLENGE</span></div>
        <div><strong className="metric-ai"><Icon name="spark" /></strong><span>GENERATE WORKOUTS</span></div>
        <div><strong>∞</strong><span>WAYS TO PROGRESS</span></div>
      </div>

      <section className="features shell" id="features">
        <div className="section-heading centered">
          <div className="eyebrow">MORE THAN A WORKOUT WEBSITE</div>
          <h2>Everything you need to<br /><em>keep showing up.</em></h2>
        </div>
        <div className="feature-grid">
          <article><div className="feature-icon feature-icon-violet"><Icon name="spark" /></div><h3>AI-made for you</h3><p>Plans are made based on your body type, equipment access, and fat-reduction goals.</p></article>
          <article><div className="feature-icon feature-icon-violet"><Icon name="calendar" /></div><h3>Progress, made visible</h3><p>A calendar heatmap, active workouts, streaks, and meaningful stats in one view.</p></article>
          <article><div className="feature-icon feature-icon-violet"><Icon name="bolt" /></div><h3>Encouragement</h3><p>Step-by-step guidance, active countdown timers, set/rep counters, and real-time encouragement.</p></article>
        </div>
      </section>

      <section className="challenge" id="challenge">
        <div className="shell">
          <div className="challenge-copy">
            <h2>One challenge.<br /><em>Built around you.</em></h2>
            <p>Tell us your starting point, schedule, equipment, and goal. SoferFit shapes every session—and adapts to you.</p>
            <ul>
              <li><Icon name="check" /> Choose a 60 or 90-day roadmap</li>
              <li><Icon name="check" /> Smart recovery and session adjustments</li>
              <li><Icon name="check" /> Encouragement exactly when you need it</li>
            </ul>
          </div>
          <div className="dashboard-card">
            <div className="dash-top"><div><small>GOOD MORNING, KENNETH</small><h3>Keep your rhythm! 🌞</h3></div><span>DAY 24 / 90</span></div>
            <div className="calendar">
              <div className="calendar-head"><strong>SEPTEMBER</strong><span>3 week streak 🔥</span></div>
              <div className="week days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              {[0, 1, 2, 3].map((week) => (
                <div className="week" key={week}>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const num = week * 7 + day;
                    const dayClass = num <= 23
                      ? "done"
                      : num === 24
                        ? "today"
                        : num >= 25
                          ? "blue-day"
                          : "";
                    return <span key={day} className={dayClass}>{num}</span>;
                  })}
                </div>
              ))}
            </div>
            <div className="dash-stats">
              <div><span className="mini-icon"><Icon name="calendar" /></span><small>CHALLENGE</small><strong>Day 24 <i>/ 60</i></strong></div>
              <div><span className="mini-icon lime"><Icon name="chart" /></span><small>TARGET PROGRESS</small><strong>32%</strong></div>
              <div><span className="mini-icon peach"><Icon name="bolt" /></span><small>ACTIVE TIME</small><strong>16.4h</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="explorer shell" id="explore">
        <div className="section-heading">
          <h2>Select Your Focus Area.<br /><em>Build Your Routine.</em></h2>
          <p>Choose the area you want to tone or target for fat reduction.</p>
        </div>
        <div className="explorer-grid">
          <div className="map-panel">
            <BodyMap gender={gender} orientation={orientation} selected={selected} fullBody={fullBody} disabled={routineState !== "idle"} onSelect={selectMuscle} />
          </div>
          <div className="exercise-panel">
            {routineState === "idle" && (
              <div className="routine-state routine-idle" key="idle">
                <div className="routine-state-head">
                  <small>YOUR ROUTINE</small>
                  <h3>{focusArea ?? "No focus area selected"}</h3>
                </div>
                <div className="routine-state-scroll">
                  <div className="routine-controls">
                    <div className="control-row focus-orientation-row">
                      <div className="filter-group">
                        <small>FOCUS AREA</small>
                        <div className="filter-pills"><button className={fullBody ? "active" : ""} onClick={selectFullBody}>Full Body</button></div>
                      </div>
                      <div className="filter-group">
                        <small>ORIENTATION</small>
                        <div className="filter-pills">
                          {(["Front", "Back"] as Orientation[]).map((item) => (
                            <button key={item} className={orientation === item ? "active" : ""} onClick={() => setOrientation(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="control-row model-metrics-row">
                      <div className="filter-group">
                        <small>MODEL</small>
                        <div className="filter-pills">
                          {(["Man", "Woman"] as Gender[]).map((item) => (
                            <button key={item} className={gender === item ? "active" : ""} onClick={() => setGender(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                      <div className="metric-inputs">
                        <label>Age<input type="number" min="10" max="100" value={explorerAge} onChange={(event) => setExplorerAge(event.target.value)} placeholder="24" />{metricErrors.age && <small>{metricErrors.age}</small>}</label>
                        <label>Height<input type="number" min="100" max="250" value={explorerHeight} onChange={(event) => setExplorerHeight(event.target.value)} placeholder="175 cm" />{metricErrors.height && <small>{metricErrors.height}</small>}</label>
                        <label>Weight<input type="number" min="25" max="300" value={explorerWeight} onChange={(event) => setExplorerWeight(event.target.value)} placeholder="70 kg" />{metricErrors.weight && <small>{metricErrors.weight}</small>}</label>
                      </div>
                    </div>
                    <div className="filter-group">
                      <small className="label-with-info">TRAINING <InfoTip term="Training" definition="Defines routine intensity and rep schemes." actionLabel="View Glossary" showTerm={false} onLearnMore={() => openGlossary("Fat Loss & Cardio")} /></small>
                      <div className="filter-pills">
                        {(["Fat Loss & Cardio", "HIIT", "Muscle & Strength"] as TrainingMode[]).map((item) => (
                          <button key={item} className={mode === item ? "active" : ""} onClick={() => updateMode(item)}>{item}</button>
                        ))}
                      </div>
                    </div>
                    <div className="filter-group">
                      <small className="label-with-info">EQUIPMENT <InfoTip term="Equipment" definition="Choose whether your routine should use only your body weight or common gym equipment." actionLabel="View Glossary" onLearnMore={() => openGlossary("Bodyweight")} /></small>
                      <div className="filter-pills">
                        <button className={equipment === "No Equipment / Bodyweight" ? "active" : ""} onClick={() => updateEquipment("No Equipment / Bodyweight")}>Bodyweight / Home</button>
                        <button className={equipment === "Gym Equipment" ? "active" : ""} onClick={() => updateEquipment("Gym Equipment")}>Gym Equipment</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="routine-state-action">
                  <Button disabled={!focusArea || !mode || !equipment} onClick={() => setRoutineState("loading")}>Generate workout routine </Button>
                  <small>AI generation is limited, use wisely.</small>
                </div>
              </div>
            )}

            {routineState === "loading" && (
              <div className="routine-state routine-loading" key="loading" aria-live="polite">
                <div className="loading-copy">
                  <span className="generation-spinner" />
                  <strong>{loadingMessage === 0 ? "Analyzing body focus and target metrics..." : "Balancing rep schemes, equipment, and rest intervals..."}</strong>
                </div>
                <div className="skeleton-list" aria-hidden="true">
                  {[0, 1, 2].map((item) => <div key={item}><i /><span><i /><i /></span></div>)}
                </div>
              </div>
            )}

            {routineState === "results" && (
              <div className="routine-state routine-results" key="results">
                <div className="routine-results-head">
                  <div><h3>Your Generated Routine</h3></div>
                  <div><span>{focusArea}</span><span>{mode}</span></div>
                </div>
                <div className="routine-state-scroll result-list">
                  {list.map((exercise) => (
                    <article className="result-card" key={exercise.name}>
                      <span className="dumbbell-icon"><Icon name="dumbbell" /></span>
                      <span className="exercise-name"><strong>{exercise.name}</strong><small>{exercise.reps}</small></span>
                      <span className="muscle-tag">{exercise.tag}</span>
                    </article>
                  ))}
                </div>
                <div className="routine-result-action">
                  <div className="save-routine-banner">
                    <strong>Save this routine and start your 60–90 day transformation challenge!</strong>
                    <Button onClick={() => setShowSignup(true)}>Create Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-divider" />
        <div className="shell footer-bottom">
          <p>© 2026 SoferFit. All rights reserved.</p>
          <nav aria-label="Legal links">
            <button className="footer-glossary" onClick={() => openGlossary()}> Glossary</button>
            <a href="#privacy-policy">Privacy Policy</a>
            <a href="#terms-of-service">Terms of Service</a>
            <a href="#cookies">Cookies</a>
          </nav>
        </div>
      </footer>

      <GlossaryDrawer open={showGlossary} initialTerm={glossaryTerm} onClose={() => setShowGlossary(false)} />
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onSuccess={() => {
          setShowLogin(false);
          setIsSignedIn(true);
          if (!localStorage.getItem("soferfit-member")) localStorage.setItem("soferfit-member", JSON.stringify({ id: crypto.randomUUID(), email: "member@soferfit.local", createdAt: new Date().toISOString() }));
          navigate("/dashboard");
        }}
      />
      <SignupModal
        open={showSignup}
        initialAnswers={{
          name: "",
          email: "",
          password: "",
          avatarUrl: "",
          unitSystem: "metric",
          focusArea: focusArea ?? "Full Body",
          mode,
          equipment,
          age: explorerAge,
          height: explorerHeight,
          weight: explorerWeight,
          somatotype: "",
          goal: mode === "Muscle & Strength" ? "Build Muscle & Strength" : mode === "Fat Loss & Cardio" ? "Lose Fat & Get Lean" : "Body Recomposition",
          experience: "",
          activity: "",
          targetWeight: "",
          targetTimeline: "By day 60",
          availableEquipment: equipment === "Gym Equipment" ? "Full Gym Access" : "Bodyweight / Home Only",
          hasCondition: false,
          challengeDays: null,
          workoutDays: null,
          sessionMinutes: null,
          sessionChoice: "",
          customSessionMinutes: "",
          challengeStartDate: "",
        }}
        onClose={() => setShowSignup(false)}
        onLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onOpenGlossary={openGlossary}
        onComplete={(profile) => {
          const completeProfile = { ...profile, challengeStartDate: new Date().toISOString() };
          setMemberProfile(completeProfile);
          localStorage.setItem("soferfit-member", JSON.stringify({ id: crypto.randomUUID(), email: profile.email, createdAt: new Date().toISOString() }));
          clearFitnessStore();
          writeFitnessStore(readFitnessStore(completeProfile));
          setIsSignedIn(true);
          setShowSignup(false);
          navigate("/dashboard");
        }}
      />
      {appToast && <div className="app-toast" role="status">{appToast}</div>}
    </main>
  );
}

export default App;
