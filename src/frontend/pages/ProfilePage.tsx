import { useRef, useState } from "react"
import { Button } from "../components/Button"
import { CustomCheckbox } from "../components/CustomCheckbox"
import { Icon } from "../components/Icon"
import { PageHeader } from "../components/PageHeader"
import { createFitnessStore } from "../fitnessStore"
import type { FitnessStore } from "../fitnessStore"
import { parseHeightCm, parseWeightKg, prettyDate } from "../lib/format"

export function ProfilePage({
  store,
  update,
  toast,
  onLogout,
  onOpenGlossary,
}: {
  store: FitnessStore
  update: (next: FitnessStore) => boolean
  toast: (message: string, error?: boolean) => void
  onLogout: () => void
  onOpenGlossary: (term?: string) => void
}) {
  const sectionNames = [
    "Account",
    "Body profile",
    "Training",
    "Health & safety",
    "Notifications",
    "Privacy & data",
    "Help",
  ] as const
  type SectionName = typeof sectionNames[number]
  const [user, setUser] = useState(store.user)
  const [challenge, setChallenge] = useState(store.challenge)
  const [preferences, setPreferences] = useState(store.preferences)
  const [editing, setEditing] = useState<SectionName | null>(null)
  const [expanded, setExpanded] = useState<SectionName>("Account")
  const [error, setError] = useState("")
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [showRestart, setShowRestart] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [showDelete, setShowDelete] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [durationChoice, setDurationChoice] = useState(
    [15, 30, 45, 60].includes(challenge.sessionMinutes)
      ? String(challenge.sessionMinutes)
      : "custom",
  )
  const [customDuration, setCustomDuration] = useState(
    [15, 30, 45, 60].includes(challenge.sessionMinutes)
      ? ""
      : String(challenge.sessionMinutes),
  )
  const challengeDay = Math.max(
    1,
    Math.min(
      challenge.length,
      Math.floor(
        (Date.now() - new Date(`${challenge.startDate}T12:00:00`).getTime()) /
          86_400_000,
      ) + 1,
    ),
  )
  const initials = user.username
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const passwordRules = [
    ["At least 8 characters", passwords.next.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(passwords.next)],
    ["One lowercase letter", /[a-z]/.test(passwords.next)],
    ["One number", /\d/.test(passwords.next)],
  ] as const
  const cancel = () => {
    setUser(store.user)
    setChallenge(store.challenge)
    setPreferences(store.preferences)
    setPasswords({ current: "", next: "", confirm: "" })
    setError("")
    setEditing(null)
  }
  const save = (section: SectionName) => {
    setError("")
    if (section === "Account") {
      if (
        !user.username.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
      )
        return setError("Enter a name and valid email.")
      if (passwords.current || passwords.next || passwords.confirm) {
        if (!passwords.current) return setError("Enter your current password.")
        if (!passwordRules.every((rule) => rule[1]))
          return setError("Your new password does not meet all the rules.")
        if (passwords.next !== passwords.confirm)
          return setError("New passwords do not match.")
      }
    }
    if (section === "Body profile") {
      const ageValue = Number(user.age)
      const heightCm = parseHeightCm(user.height, user.unitSystem)
      const weightKg = parseWeightKg(user.weight, user.unitSystem)
      const targetKg = user.targetWeight
        ? parseWeightKg(user.targetWeight, user.unitSystem)
        : 0
      if (!ageValue || ageValue < 10 || ageValue > 100)
        return setError("Age must be between 10 and 100.")
      if (!heightCm || heightCm < 100 || heightCm > 250)
        return setError(
          `Height must be between ${
            user.unitSystem === "metric"
              ? "100–250 cm"
              : "approximately 3 ft 3 in–8 ft 2 in"
          }.`,
        )
      if (
        !weightKg ||
        weightKg < 25 ||
        weightKg > 300 ||
        (targetKg && (targetKg < 25 || targetKg > 300))
      )
        return setError(
          `Weight must be between ${
            user.unitSystem === "metric" ? "25–300 kg" : "55–661 lb"
          }.`,
        )
      if (
        !user.somatotype ||
        !user.goal ||
        !user.experience ||
        !user.activityLevel
      )
        return setError("Complete each body profile selection.")
    }
    if (section === "Training") {
      const minutes =
        durationChoice === "custom"
          ? Number(customDuration)
          : Number(durationChoice)
      if (
        challenge.daysPerWeek < 2 ||
        challenge.daysPerWeek > 6 ||
        minutes < 5 ||
        minutes > 180
      )
        return setError(
          "Choose 2–6 workout days and a session duration from 5–180 minutes.",
        )
      setChallenge({ ...challenge, sessionMinutes: minutes })
      if (
        !update({
          ...store,
          user,
          challenge: { ...challenge, sessionMinutes: minutes },
          preferences,
        })
      )
        return
    } else if (!update({ ...store, user, challenge, preferences })) return
    setPasswords({ current: "", next: "", confirm: "" })
    setEditing(null)
    toast(`${section} saved.`)
  }
  const sectionActions = (section: SectionName) =>
    editing === section ? (
      <div className="profile-section-actions">
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button onClick={() => save(section)}>Save</Button>
      </div>
    ) : (
      <button
        className="profile-edit"
        onClick={() => {
          setError("")
          setEditing(section)
        }}
      >
        Edit
      </button>
    )
  const selectSection = (section: SectionName) => {
    setExpanded(section)
    document
      .getElementById(
        `profile-${section.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      )
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const chooseAvatar = (file?: File) => {
    setError("")
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setError("Choose a JPG, PNG, or WebP image.")
    if (file.size > 5 * 1024 * 1024)
      return setError("Choose an image smaller than 5 MB.")
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        const scale = Math.min(1, 800 / Math.max(image.width, image.height))
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext("2d")
        if (!context) return setError("We couldn't prepare that photo.")
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const avatar = canvas.toDataURL("image/webp", 0.82)
        const nextUser = { ...user, avatar }
        setUser(nextUser)
        if (update({ ...store, user: nextUser }))
          toast("Profile photo updated.")
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  const restartChallenge = () => {
    const fresh = createFitnessStore({
      name: user.username,
      email: user.email,
      avatarUrl: user.avatar,
      age: user.age,
      height: user.height,
      weight: user.weight,
      targetWeight: user.targetWeight,
      somatotype: user.somatotype,
      goal: user.goal,
      experience: user.experience,
      activity: user.activityLevel,
      unitSystem: user.unitSystem,
      availableEquipment: user.equipment,
      hasCondition: user.injuryFlag,
      challengeDays: challenge.length,
      workoutDays: challenge.daysPerWeek,
      sessionMinutes: challenge.sessionMinutes,
      challengeStartDate: new Date().toISOString(),
    })
    const restarted = {
      ...fresh,
      user: { ...fresh.user, ...user },
      preferences,
      weights: store.weights,
      photos: store.photos,
    }
    if (update(restarted)) {
      setChallenge(restarted.challenge)
      setShowRestart(false)
      toast("Challenge restarted at Day 1. We kept your weights and photos.")
    }
  }
  const downloadData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "soferfit-data.json"
    link.click()
    URL.revokeObjectURL(url)
    toast("Your data export is ready.")
  }
  const healthyPace =
    Boolean(user.weight && user.targetWeight) &&
    (parseWeightKg(user.weight, user.unitSystem) -
      parseWeightKg(user.targetWeight, user.unitSystem)) /
      (challenge.length / 7) >
      1
  const cardClass = (section: SectionName) =>
    `profile-section-card ${expanded === section ? "mobile-expanded" : ""}`

  return (
    <>
      <PageHeader eyebrow="YOUR ACCOUNT" title="Profile" />
      <article className="profile-header-card">
        <div className="profile-avatar-wrap">
          <button
            className="profile-avatar-large"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Change photo"
          >
            {user.avatar ? <img src={user.avatar} alt="" /> : initials}
          </button>
          <button
            className="profile-avatar-camera"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Change photo"
          >
            <Icon name="camera" />
            <span role="tooltip">Change photo</span>
          </button>
          <input
            ref={avatarInputRef}
            className="profile-avatar-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) => chooseAvatar(event.target.files?.[0])}
          />
        </div>
        <div className="profile-header-copy">
          <h2>{user.username}</h2>
          <p>{user.email || "Add your email"}</p>
          <span>Member since {prettyDate(user.memberSince)}</span>
        </div>
        <div className="profile-header-actions">
          <strong>
            Day {challengeDay} / {challenge.length}
          </strong>
          <button onClick={onLogout}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      </article>
      {error && (
        <p className="profile-global-error inline-validation">{error}</p>
      )}
      <div className="profile-layout">
        <nav className="profile-subnav" aria-label="Profile sections">
          {sectionNames.map((section) => (
            <button
              className={expanded === section ? "active" : ""}
              key={section}
              onClick={() => selectSection(section)}
            >
              {section}
              <Icon name="arrow" />
            </button>
          ))}
        </nav>
        <div className="profile-sections">
          <article id="profile-account" className={cardClass("Account")}>
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Account")}
              >
                <span>
                  <small>ACCOUNT</small>
                  <h2>Sign-in details</h2>
                </span>
                <i>{expanded === "Account" ? "−" : "+"}</i>
              </button>
              {sectionActions("Account")}
            </header>
            <div className="profile-section-body">
              <div className="profile-field-grid">
                <label>
                  Name
                  <input
                    disabled={editing !== "Account"}
                    value={user.username}
                    onChange={(event) =>
                      setUser({ ...user, username: event.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    disabled={editing !== "Account"}
                    type="email"
                    value={user.email}
                    onChange={(event) =>
                      setUser({ ...user, email: event.target.value })
                    }
                  />
                </label>
              </div>
              {editing === "Account" && (
                <div className="password-edit">
                  <h3>Change password</h3>
                  <div className="profile-field-grid">
                    <label>
                      Current password
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(event) =>
                          setPasswords({
                            ...passwords,
                            current: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      New password
                      <input
                        type="password"
                        value={passwords.next}
                        onChange={(event) =>
                          setPasswords({
                            ...passwords,
                            next: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Confirm new password
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(event) =>
                          setPasswords({
                            ...passwords,
                            confirm: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <ul>
                    {passwordRules.map(([rule, met]) => (
                      <li className={met ? "met" : ""} key={rule}>
                        <Icon name={met ? "check" : "close"} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>

          <article
            id="profile-body-profile"
            className={cardClass("Body profile")}
          >
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Body profile")}
              >
                <span>
                  <small>BODY PROFILE</small>
                  <h2>Your baseline</h2>
                </span>
                <i>{expanded === "Body profile" ? "−" : "+"}</i>
              </button>
              {sectionActions("Body profile")}
            </header>
            <div className="profile-section-body">
              <div className="profile-choice-group">
                <span>Units</span>
                <div>
                  <button
                    disabled={editing !== "Body profile"}
                    className={user.unitSystem === "metric" ? "active" : ""}
                    onClick={() => setUser({ ...user, unitSystem: "metric" })}
                  >
                    Metric
                  </button>
                  <button
                    disabled={editing !== "Body profile"}
                    className={user.unitSystem === "imperial" ? "active" : ""}
                    onClick={() => setUser({ ...user, unitSystem: "imperial" })}
                  >
                    Imperial
                  </button>
                </div>
              </div>
              <div className="profile-field-grid four">
                <label>
                  Age
                  <input
                    disabled={editing !== "Body profile"}
                    type="number"
                    value={user.age}
                    onChange={(event) =>
                      setUser({ ...user, age: event.target.value })
                    }
                  />
                </label>
                <label>
                  Height ({user.unitSystem === "metric" ? "cm" : "ft / in"})
                  <input
                    disabled={editing !== "Body profile"}
                    type={user.unitSystem === "metric" ? "number" : "text"}
                    placeholder={
                      user.unitSystem === "metric" ? "175" : "5 ft 8 in"
                    }
                    value={user.height}
                    onChange={(event) =>
                      setUser({ ...user, height: event.target.value })
                    }
                  />
                </label>
                <label>
                  Current weight ({user.unitSystem === "metric" ? "kg" : "lb"})
                  <input
                    disabled={editing !== "Body profile"}
                    type="number"
                    value={user.weight}
                    onChange={(event) =>
                      setUser({ ...user, weight: event.target.value })
                    }
                  />
                </label>
                <label>
                  Target weight
                  <input
                    disabled={editing !== "Body profile"}
                    type="number"
                    value={user.targetWeight}
                    onChange={(event) =>
                      setUser({ ...user, targetWeight: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="somatotype-label">
                <span>Somatotype</span>
                <button
                  onClick={() => onOpenGlossary("Somatotype")}
                  aria-label="Open somatotype glossary"
                >
                  ⓘ
                </button>
              </div>
              <div className="profile-somatotypes">
                {[
                  ["Ectomorph", "Naturally leaner frame"],
                  ["Mesomorph", "Naturally athletic frame"],
                  ["Endomorph", "Naturally broader frame"],
                  ["Not Sure", "Use my other details"],
                ].map(([name, copy]) => (
                  <button
                    disabled={editing !== "Body profile"}
                    className={user.somatotype === name ? "active" : ""}
                    key={name}
                    onClick={() => setUser({ ...user, somatotype: name })}
                  >
                    <strong>{name}</strong>
                    <small>{copy}</small>
                  </button>
                ))}
              </div>
              <div className="profile-field-grid three">
                <label>
                  Primary goal
                  <select
                    disabled={editing !== "Body profile"}
                    value={user.goal}
                    onChange={(event) =>
                      setUser({ ...user, goal: event.target.value })
                    }
                  >
                    <option value="">Choose a goal</option>
                    <option>Lose Fat & Get Lean</option>
                    <option>Build Muscle & Strength</option>
                    <option>Body Recomposition</option>
                  </select>
                </label>
                <label>
                  Experience level
                  <select
                    disabled={editing !== "Body profile"}
                    value={user.experience}
                    onChange={(event) =>
                      setUser({ ...user, experience: event.target.value })
                    }
                  >
                    <option value="">Choose experience</option>
                    <option>Starting Out</option>
                    <option>Some Experience</option>
                    <option>Consistent</option>
                  </select>
                </label>
                <label>
                  Activity level
                  <select
                    disabled={editing !== "Body profile"}
                    value={user.activityLevel}
                    onChange={(event) =>
                      setUser({ ...user, activityLevel: event.target.value })
                    }
                  >
                    <option value="">Choose activity</option>
                    <option>Sedentary</option>
                    <option>Sometimes Active</option>
                    <option>Moderately Active</option>
                    <option>Very Active</option>
                  </select>
                </label>
              </div>
              {healthyPace && (
                <p className="gentle-note">
                  That target may call for a faster pace. Gradual, sustainable
                  changes are easier to maintain; your plan will stay balanced.
                </p>
              )}
            </div>
          </article>

          <article id="profile-training" className={cardClass("Training")}>
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Training")}
              >
                <span>
                  <small>TRAINING</small>
                  <h2>Plan preferences</h2>
                </span>
                <i>{expanded === "Training" ? "−" : "+"}</i>
              </button>
              {sectionActions("Training")}
            </header>
            <div className="profile-section-body">
              <div className="profile-field-grid three">
                <label>
                  Equipment
                  <select
                    disabled={editing !== "Training"}
                    value={user.equipment}
                    onChange={(event) =>
                      setUser({ ...user, equipment: event.target.value })
                    }
                  >
                    <option>Bodyweight / Home Only</option>
                    <option>Dumbbells & Bands</option>
                    <option>Full Gym Access</option>
                  </select>
                </label>
                <label>
                  Workout days per week
                  <input
                    disabled={editing !== "Training"}
                    type="number"
                    min="2"
                    max="6"
                    value={challenge.daysPerWeek}
                    onChange={(event) =>
                      setChallenge({
                        ...challenge,
                        daysPerWeek: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Session duration
                  <select
                    disabled={editing !== "Training"}
                    value={durationChoice}
                    onChange={(event) => setDurationChoice(event.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="custom">Custom...</option>
                  </select>
                </label>
                {durationChoice === "custom" && (
                  <label>
                    Custom minutes
                    <input
                      disabled={editing !== "Training"}
                      type="number"
                      min="5"
                      max="180"
                      value={customDuration}
                      onChange={(event) =>
                        setCustomDuration(event.target.value)
                      }
                    />
                  </label>
                )}
                <label>
                  Challenge length
                  <input disabled value={`${challenge.length} days`} />
                </label>
              </div>
              <div className="danger-row">
                <div>
                  <strong>Restart challenge</strong>
                  <span>Return the plan and calendar to Day 1.</span>
                </div>
                <button onClick={() => setShowRestart(true)}>
                  Restart challenge
                </button>
              </div>
            </div>
          </article>

          <article
            id="profile-health-safety"
            className={cardClass("Health & safety")}
          >
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Health & safety")}
              >
                <span>
                  <small>HEALTH & SAFETY</small>
                  <h2>Exercise preferences</h2>
                </span>
                <i>{expanded === "Health & safety" ? "−" : "+"}</i>
              </button>
              {sectionActions("Health & safety")}
            </header>
            <div className="profile-section-body">
              <CustomCheckbox
                className="profile-check checkbox-leading"
                disabled={editing !== "Health & safety"}
                checked={user.injuryFlag}
                onChange={(checked) =>
                  setUser({ ...user, injuryFlag: checked })
                }
              >
                <span>
                  <strong>I have an injury or health condition</strong>
                  <small>When on, lower-impact exercises are favored.</small>
                </span>
              </CustomCheckbox>
              <p className="safety-disclaimer">
                SoferFit offers general fitness guidance, not medical advice.
                Check with a doctor before starting if you have a health
                condition.
              </p>
            </div>
          </article>

          <article
            id="profile-notifications"
            className={cardClass("Notifications")}
          >
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Notifications")}
              >
                <span>
                  <small>NOTIFICATIONS</small>
                  <h2>Stay on track</h2>
                </span>
                <i>{expanded === "Notifications" ? "−" : "+"}</i>
              </button>
              {sectionActions("Notifications")}
            </header>
            <div className="profile-section-body">
              <div className="notification-list">
                <CustomCheckbox
                  className="notification-option"
                  disabled={editing !== "Notifications"}
                  checked={preferences.workoutReminders}
                  onChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      workoutReminders: checked,
                    })
                  }
                >
                  <span>
                    <strong>Workout reminders</strong>
                    <small>A reminder on planned workout days.</small>
                  </span>
                </CustomCheckbox>
                {preferences.workoutReminders && (
                  <label className="reminder-time">
                    <span>Reminder time</span>
                    <input
                      disabled={editing !== "Notifications"}
                      type="time"
                      value={preferences.reminderTime}
                      onChange={(event) =>
                        setPreferences({
                          ...preferences,
                          reminderTime: event.target.value,
                        })
                      }
                    />
                  </label>
                )}
                <CustomCheckbox
                  className="notification-option"
                  disabled={editing !== "Notifications"}
                  checked={preferences.streakReminders}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, streakReminders: checked })
                  }
                >
                  <span>
                    <strong>Streak reminders</strong>
                    <small>A gentle prompt when your streak is active.</small>
                  </span>
                </CustomCheckbox>
                <CustomCheckbox
                  className="notification-option"
                  disabled={editing !== "Notifications"}
                  checked={preferences.weeklySummary}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, weeklySummary: checked })
                  }
                >
                  <span>
                    <strong>Weekly progress summaries</strong>
                    <small>A short recap of your training week.</small>
                  </span>
                </CustomCheckbox>
              </div>
            </div>
          </article>

          <article
            id="profile-privacy-data"
            className={cardClass("Privacy & data")}
          >
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Privacy & data")}
              >
                <span>
                  <small>PRIVACY & DATA</small>
                  <h2>Your information</h2>
                </span>
                <i>{expanded === "Privacy & data" ? "−" : "+"}</i>
              </button>
            </header>
            <div className="profile-section-body">
              <div className="privacy-statement">
                <Icon name="camera" />
                <div>
                  <strong>Your progress photos are private</strong>
                  <span>
                    They are stored with your local profile and only visible to
                    you.
                  </span>
                </div>
              </div>
              <button className="profile-row-action" onClick={downloadData}>
                <span>
                  <strong>Download my data</strong>
                  <small>Export your profile and progress as JSON.</small>
                </span>
                <Icon name="arrow" />
              </button>
              <div className="danger-zone">
                <strong>Delete my account</strong>
                <p>This removes your profile and all locally saved progress.</p>
                {showDelete ? (
                  <div>
                    <label>
                      Type DELETE to confirm
                      <input
                        value={deleteText}
                        onChange={(event) => setDeleteText(event.target.value)}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      disabled={deleteText !== "DELETE"}
                      onClick={onLogout}
                    >
                      Delete my account
                    </Button>
                    <button
                      onClick={() => {
                        setShowDelete(false)
                        setDeleteText("")
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowDelete(true)}>
                    Delete my account
                  </button>
                )}
              </div>
            </div>
          </article>

          <article id="profile-help" className={cardClass("Help")}>
            <header>
              <button
                className="profile-mobile-toggle"
                onClick={() => setExpanded("Help")}
              >
                <span>
                  <small>HELP</small>
                  <h2>Resources</h2>
                </span>
                <i>{expanded === "Help" ? "−" : "+"}</i>
              </button>
            </header>
            <div className="profile-section-body profile-help-links">
              <button onClick={() => onOpenGlossary()}>
                <span>
                  <strong>Glossary</strong>
                  <small>Plain-language fitness terms.</small>
                </span>
                <Icon name="arrow" />
              </button>
              <a href="mailto:feedback@soferfit.example">
                <span>
                  <strong>Send feedback</strong>
                  <small>Tell us what would make SoferFit better.</small>
                </span>
                <Icon name="arrow" />
              </a>
              <div>
                <span>
                  <strong>About SoferFit</strong>
                  <small>
                    Adaptive fitness planning for sustainable routines.
                  </small>
                </span>
                <b>Version 1.0</b>
              </div>
            </div>
          </article>
        </div>
      </div>
      {showRestart && (
        <div className="progress-modal-backdrop">
          <div className="end-dialog" role="dialog" aria-modal="true">
            <span className="dash-stat-icon">
              <Icon name="calendar" />
            </span>
            <h2>Restart challenge?</h2>
            <p>
              Your workout plan, sessions, badges, and calendar will reset to
              Day 1. Saved weights and progress photos will be kept.
            </p>
            <Button onClick={restartChallenge}>Restart at Day 1</Button>
            <Button variant="ghost" onClick={() => setShowRestart(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
