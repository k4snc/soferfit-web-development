import { useEffect, useState } from "react"
import { Button } from "../components/Button"
import { CustomCheckbox } from "../components/CustomCheckbox"
import { Icon } from "../components/Icon"
import { PageHeader } from "../components/PageHeader"
import type { FitnessStore, PlannedWorkout } from "../fitnessStore"
import { dateKey, prettyDate } from "../lib/format"

export function GeneratePage({
  store,
  update,
  navigate,
  toast,
}: {
  store: FitnessStore
  update: (next: FitnessStore) => boolean
  navigate: (path: string) => void
  toast: (message: string, error?: boolean) => void
}) {
  type GeneratorState = "form" | "loading" | "result" | "error"
  type Focus = "Full Body" | "Upper Body" | "Lower Body" | "Core" | "Cardio / Running"
  type Training = "Fat Loss & Cardio" | "HIIT" | "Muscle & Strength" | "Walk-Run"
  type GeneratorEquipment = "Bodyweight / Home" | "Dumbbells & Bands" | "Gym Equipment"
  const nextMonday = (from = new Date()) => {
    const date = new Date(from)
    date.setHours(12, 0, 0, 0)
    const days = (8 - date.getDay()) % 7 || 7
    date.setDate(date.getDate() + days)
    return dateKey(date)
  }
  const profileEquipment: GeneratorEquipment = store.user.equipment.includes(
    "Gym",
  )
    ? "Gym Equipment"
    : store.user.equipment.includes("Dumbbell")
      ? "Dumbbells & Bands"
      : "Bodyweight / Home"
  const profileTraining: Training = store.user.goal.includes("Muscle")
    ? "Muscle & Strength"
    : "Fat Loss & Cardio"
  const age = Number(store.user.age)
  const automaticLowImpact =
    store.user.injuryFlag || (age > 0 && age < 18) || age >= 60
  const [generatorState, setGeneratorState] = useState<GeneratorState>("form")
  const [option, setOption] = useState<"single" | "adjust">("single")
  const [reason, setReason] = useState("")
  const [focus, setFocus] = useState<Focus>("Full Body")
  const [training, setTraining] = useState<Training>(profileTraining)
  const [equipment, setEquipment] =
    useState<GeneratorEquipment>(profileEquipment)
  const initialDuration = [15, 30, 45, 60].includes(
    store.challenge.sessionMinutes,
  )
    ? String(store.challenge.sessionMinutes)
    : "custom"
  const [durationChoice, setDurationChoice] = useState(initialDuration)
  const [customDuration, setCustomDuration] = useState(
    initialDuration === "custom" ? String(store.challenge.sessionMinutes) : "",
  )
  const [effort, setEffort] = useState<"Easy" | "Moderate" | "Hard">("Moderate")
  const [lowImpact, setLowImpact] = useState(automaticLowImpact)
  const [loadingMessage, setLoadingMessage] = useState(0)
  const [result, setResult] = useState<PlannedWorkout | null>(null)
  const [scheduleDate, setScheduleDate] = useState(
    () =>
      store.plan.find(
        (workout) => workout.date >= dateKey(new Date()) && !workout.optional,
      )?.date || dateKey(new Date()),
  )
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const resetDate = /^\d{4}-\d{2}-\d{2}$/.test(store.aiGenerations.resetDate)
    ? store.aiGenerations.resetDate
    : nextMonday()
  const resetDue = resetDate <= dateKey(new Date())
  const usedCount = resetDue ? 0 : store.aiGenerations.usedCount
  const remaining = Math.max(0, 3 - usedCount)
  const duration =
    durationChoice === "custom"
      ? Number(customDuration)
      : Number(durationChoice)
  const valid = Boolean(
    focus &&
      training &&
      equipment &&
      effort &&
      duration >= 5 &&
      duration <= 180 &&
      (option === "single" || reason),
  )

  useEffect(() => {
    const mondayReset = nextMonday()
    if (resetDue || resetDate !== mondayReset) {
      update({
        ...store,
        aiGenerations: {
          usedCount: resetDue ? 0 : usedCount,
          resetDate: mondayReset,
        },
      })
    }
  }, [])

  useEffect(() => {
    if (generatorState !== "loading") return
    setLoadingMessage(0)
    const messageTimer = window.setInterval(
      () => setLoadingMessage((value) => (value + 1) % 3),
      900,
    )
    const resultTimer = window.setTimeout(() => {
      try {
        const exercisePools: Record<Focus, string[]> = {
          "Full Body": [
            "Squat to reach",
            "Incline push-up",
            "Reverse lunge",
            "Glute bridge",
            "Bird dog",
            "Standing knee drive",
            "Dead bug",
            "Marching finisher",
          ],
          "Upper Body": [
            "Wall push-up",
            "Bent-over row",
            "Shoulder press",
            "Biceps curl",
            "Triceps extension",
            "Plank shoulder tap",
            "Lateral raise",
            "Chest press",
          ],
          "Lower Body": [
            "Tempo squat",
            "Reverse lunge",
            "Glute bridge",
            "Calf raise",
            "Side lunge",
            "Wall sit",
            "Step-up",
            "Dead bug",
          ],
          Core: [
            "Dead bug",
            "Bird dog",
            "Forearm plank",
            "Heel taps",
            "Side plank",
            "Bear hold",
            "Standing knee drive",
            "Glute bridge",
          ],
          "Cardio / Running":
            training === "Walk-Run"
              ? [
                  "Warm-up walk",
                  "Jog interval",
                  "Recovery walk",
                  "Jog interval",
                  "Recovery walk",
                  "Steady finish",
                  "Cool-down walk",
                ]
              : [
                  "March in place",
                  "Step touch",
                  "High knees",
                  "Skater step",
                  "Squat to reach",
                  "Mountain climber",
                  "Fast feet",
                  "Breathing reset",
                ],
        }
        const count = duration <= 15 ? 4 : duration <= 30 ? 6 : 8
        const names = exercisePools[focus].slice(0, count)
        const isRun = focus === "Cardio / Running" && training === "Walk-Run"
        const generated: PlannedWorkout = {
          id: `generated-${Date.now()}`,
          date: scheduleDate,
          name: isRun
            ? "Fresh Walk-Run Intervals"
            : `${effort} ${focus} ${
                training === "HIIT" ? "Circuit" : "Session"
              }`,
          minutes: duration,
          equipment,
          targetTags: isRun ? ["Cardio", "Run"] : [focus, training],
          exercises: names.map((name, index) => ({
            name:
              lowImpact && /high knees|mountain climber|fast feet/i.test(name)
                ? `Low-impact ${name.toLowerCase()}`
                : name,
            prescription: isRun
              ? index === 0 || index === names.length - 1
                ? "5:00"
                : index % 2
                  ? "1:00 jog"
                  : "2:00 walk"
              : training === "HIIT"
                ? "40 sec work · 20 sec rest"
                : effort === "Easy"
                  ? "2 × 10 · 45 sec rest"
                  : effort === "Hard"
                    ? "4 × 12 · 30 sec rest"
                    : "3 × 12 · 40 sec rest",
          })),
        }
        const nextStore = {
          ...store,
          aiGenerations: { usedCount: usedCount + 1, resetDate: nextMonday() },
        }
        if (!update(nextStore)) throw new Error("storage")
        setResult(generated)
        setGeneratorState("result")
      } catch {
        setGeneratorState("error")
      }
    }, 2800)
    return () => {
      window.clearInterval(messageTimer)
      window.clearTimeout(resultTimer)
    }
  }, [generatorState])

  const startGeneration = () => {
    if (!remaining) return
    setConfirmRegenerate(false)
    setGeneratorState("loading")
  }
  const addToPlan = (saveOnly = false) => {
    if (!result) return
    const scheduled = {
      ...result,
      id: `${result.id}-${saveOnly ? "saved" : "plan"}`,
      date: scheduleDate,
      optional: saveOnly,
    }
    const plan =
      option === "adjust" && !saveOnly
        ? store.plan.map((workout) =>
            workout.date >= dateKey(new Date()) && !workout.optional
              ? {
                  ...scheduled,
                  id: workout.id,
                  date: workout.date,
                  name: workout.name.includes("Recovery")
                    ? workout.name
                    : scheduled.name,
                }
              : workout,
          )
        : [scheduled, ...store.plan]
    if (!update({ ...store, plan })) return
    toast(
      option === "adjust" && !saveOnly
        ? "Your remaining challenge plan was re-balanced."
        : saveOnly
          ? "Workout saved to My workouts."
          : `Workout added for ${prettyDate(scheduleDate)}.`,
    )
    navigate("/workouts")
  }
  const discard = () => {
    setResult(null)
    setGeneratorState("form")
  }
  const loadingCopy = [
    "Analyzing your profile...",
    "Balancing reps, rest, and equipment...",
    "Building your routine...",
  ]

  return (
    <>
      <PageHeader title="Generate" />
      <div className="generate-header">
        <span>{remaining} of 3 generations left this week</span>
      </div>
      <article className="generator-shell">
        {generatorState === "form" && (
          <div className="generator-scroll">
            <div className="generator-options">
              <button
                className={option === "single" ? "selected" : ""}
                onClick={() => setOption("single")}
              >
                <span className="generate-choice-icon">
                  <Icon name="bolt" />
                </span>
                <div>
                  <strong>Single workout</strong>
                  <small>A one-off routine for today or another day.</small>
                </div>
                <i>{option === "single" && <Icon name="check" />}</i>
              </button>
              <button
                className={option === "adjust" ? "selected" : ""}
                onClick={() => setOption("adjust")}
              >
                <span className="generate-choice-icon">
                  <Icon name="calendar" />
                </span>
                <div>
                  <strong>Adjust my challenge plan</strong>
                  <small>
                    Re-balance the workouts in your remaining weeks.
                  </small>
                </div>
                <i>{option === "adjust" && <Icon name="check" />}</i>
              </button>
            </div>
            {option === "adjust" && (
              <div className="reason-row">
                <small>WHAT CHANGED?</small>
                <div>
                  {[
                    "Too hard",
                    "Too easy",
                    "Schedule changed",
                    "New equipment",
                    "Plateau",
                  ].map((item) => (
                    <button
                      className={reason === item ? "active" : ""}
                      key={item}
                      onClick={() => setReason(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="generator-form">
              <fieldset>
                <legend>Focus area</legend>
                <div className="generator-chips">
                  {([
                    "Full Body",
                    "Upper Body",
                    "Lower Body",
                    "Core",
                    "Cardio / Running",
                  ] as Focus[]).map((item) => (
                    <button
                      className={focus === item ? "active" : ""}
                      key={item}
                      onClick={() => {
                        setFocus(item)
                        if (
                          item !== "Cardio / Running" &&
                          training === "Walk-Run"
                        )
                          setTraining("Fat Loss & Cardio")
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  Training{" "}
                  <span className="info-tip">
                    <button type="button" aria-label="About training">
                      ⓘ
                    </button>
                    <span className="term-tooltip" role="tooltip">
                      <strong>Training style</strong>
                      <span>
                        This changes the pace, repetitions, work periods, and
                        rest in your routine.
                      </span>
                      <a href="/#glossary">View glossary</a>
                    </span>
                  </span>
                </legend>
                <div className="generator-chips">
                  {([
                    "Fat Loss & Cardio",
                    "HIIT",
                    "Muscle & Strength",
                    ...(focus === "Cardio / Running" ? ["Walk-Run"] : []),
                  ] as Training[]).map((item) => (
                    <button
                      className={training === item ? "active" : ""}
                      key={item}
                      onClick={() => setTraining(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Equipment</legend>
                <div className="generator-chips">
                  {([
                    "Bodyweight / Home",
                    "Dumbbells & Bands",
                    "Gym Equipment",
                  ] as GeneratorEquipment[]).map((item) => (
                    <button
                      className={equipment === item ? "active" : ""}
                      key={item}
                      onClick={() => setEquipment(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="generator-row">
                <label>
                  Duration
                  <select
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
                      type="number"
                      min="5"
                      max="180"
                      value={customDuration}
                      onChange={(event) =>
                        setCustomDuration(event.target.value)
                      }
                      placeholder="5–180"
                    />
                  </label>
                )}
              </div>
              <fieldset>
                <legend>Effort today</legend>
                <div className="generator-chips">
                  {(["Easy", "Moderate", "Hard"] as const).map((item) => (
                    <button
                      className={effort === item ? "active" : ""}
                      key={item}
                      onClick={() => setEffort(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <CustomCheckbox
                className="generator-toggle"
                checked={lowImpact}
                onChange={setLowImpact}
              >
                <span>
                  <strong>Include low-impact options</strong>
                  <small>
                    {automaticLowImpact
                      ? "On based on your profile; you can change it here."
                      : "Adds joint-friendly alternatives to the routine."}
                  </small>
                </span>
              </CustomCheckbox>
            </div>
          </div>
        )}

        {generatorState === "loading" && (
          <div className="generator-loading" aria-live="polite">
            <span className="emerald-pulse">
              <Icon name="spark" />
            </span>
            <strong>{loadingCopy[loadingMessage]}</strong>
            <div className="generator-skeleton">
              {[0, 1, 2].map((item) => (
                <div key={item}>
                  <i />
                  <span>
                    <i />
                    <i />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatorState === "result" && result && (
          <div className="generator-result">
            <header>
              <div>
                <small>YOUR GENERATED ROUTINE</small>
                <h2>{result.name}</h2>
                <p>
                  {result.minutes} min · {result.equipment}
                </p>
              </div>
              <div className="target-chips">
                {result.targetTags.map((tag) => (
                  <i key={tag}>{tag}</i>
                ))}
              </div>
            </header>
            <div className="generated-exercises">
              {result.exercises.map((exercise, index) => (
                <article key={`${exercise.name}-${index}`}>
                  <span className="dumbbell-icon">
                    <Icon name="dumbbell" />
                  </span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.prescription}</small>
                  </div>
                  <i>{result.targetTags[index % result.targetTags.length]}</i>
                </article>
              ))}
            </div>
            <div className="why-plan">
              <span>
                <Icon name="spark" />
              </span>
              <div>
                <strong>Why this plan</strong>
                <ul>
                  <li>
                    {equipment === "Bodyweight / Home"
                      ? "Bodyweight-focused, since that's your selected equipment."
                      : `${equipment} movements match the setup you selected.`}
                  </li>
                  <li>
                    {lowImpact
                      ? "Low-impact swaps are included so you can adjust as needed."
                      : `${effort} effort keeps today's session aligned with how you feel.`}
                  </li>
                </ul>
              </div>
            </div>
            <p className="generator-guidance">
              AI suggestions are general fitness guidance, not medical advice.
            </p>
          </div>
        )}

        {generatorState === "error" && (
          <div className="generator-message">
            <span>
              <Icon name="spark" />
            </span>
            <h2>Let's try that again.</h2>
            <p>
              We couldn't generate a new plan. Your current plan is unchanged
              and no generation was used.
            </p>
            <Button onClick={() => setGeneratorState("form")}>Try again</Button>
          </div>
        )}

        <footer className="generator-actions">
          {generatorState === "form" && (
            <>
              <Button onClick={startGeneration} disabled={!valid || !remaining}>
                Generate routine
              </Button>
              <small>AI generation is limited, use wisely.</small>
              {!remaining && (
                <p className="limit-message">
                  You've used all 3 generations this week. They reset on{" "}
                  {prettyDate(resetDate)}. In the meantime, swap exercises in{" "}
                  <button onClick={() => navigate("/workouts")}>
                    My workouts
                  </button>
                  .
                </p>
              )}
            </>
          )}
          {generatorState === "result" && result && (
            <>
              <div className="schedule-action">
                <label>
                  Add to my plan
                  <input
                    type="date"
                    min={dateKey(new Date())}
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                  />
                </label>
                <Button onClick={() => addToPlan(false)}>Add to my plan</Button>
              </div>
              <div className="result-actions">
                <Button variant="ghost" onClick={() => addToPlan(true)}>
                  Save to My workouts
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={!remaining}
                >
                  Regenerate
                </Button>
                <button onClick={discard}>Discard</button>
              </div>
              {confirmRegenerate && (
                <div className="regenerate-confirm">
                  <p>Regenerating uses another of your weekly generations.</p>
                  <button onClick={() => setConfirmRegenerate(false)}>
                    Cancel
                  </button>
                  <Button onClick={startGeneration}>Use 1 generation</Button>
                </div>
              )}
            </>
          )}
        </footer>
      </article>
    </>
  )
}
