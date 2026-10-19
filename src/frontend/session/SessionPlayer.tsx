import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../components/Button"
import { Icon } from "../components/Icon"
import type { FitnessStore, PlannedWorkout } from "../fitnessStore"
import { dateKey } from "../lib/format"

export function SessionPlayer({
  workout,
  store,
  update,
  navigate,
  toast,
}: {
  workout: PlannedWorkout
  store: FitnessStore
  update: (next: FitnessStore) => void
  navigate: (path: string) => void
  toast: (message: string) => void
}) {
  type PlayerScreen = "ready" | "countdown" | "active" | "complete"
  type Phase = "work" | "rest"
  const isRunning =
    workout.name.includes("Walk-Run") || workout.targetTags.includes("Run")
  const [screen, setScreen] = useState<PlayerScreen>("ready")
  const [countdown, setCountdown] = useState(3)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("work")
  const [remaining, setRemaining] = useState(40)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reps, setReps] = useState(0)
  const [cueIndex, setCueIndex] = useState(0)
  const [muted, setMuted] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [effort, setEffort] = useState(3)
  const [note, setNote] = useState("")
  const [distance, setDistance] = useState("")
  const [sound, setSound] = useState(true)
  const [voice, setVoice] = useState(false)
  const [vibration, setVibration] = useState(true)
  const [wakeScreen, setWakeScreen] = useState(true)
  const [demoSpeed, setDemoSpeed] = useState(false)
  const [indoor, setIndoor] = useState(false)
  const [sessionSwaps, setSessionSwaps] = useState<Record<number, string>>({})
  const equipmentItems = isRunning
    ? ["Comfortable shoes", "Water bottle", "Safe route or clear indoor space"]
    : [workout.equipment, "Clear floor space", "Water nearby"]
  const [equipmentReady, setEquipmentReady] = useState(() =>
    equipmentItems.map(() => false),
  )
  const [runIndex, setRunIndex] = useState(0)
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null)
  const runningSegments = useMemo(
    () => [
      { label: "WALK", name: "Warm-up walk", duration: 300 },
      ...Array.from({ length: 16 }, (_, index) => ({
        label: index % 2 === 0 ? "JOG" : "WALK",
        name: index % 2 === 0 ? "Easy jog" : "Recovery walk",
        duration: index % 2 === 0 ? 60 : 120,
      })),
      { label: "WALK", name: "Cool-down walk", duration: 300 },
    ],
    [],
  )
  const currentExercise = workout.exercises[exerciseIndex]
  const displayName =
    sessionSwaps[exerciseIndex] || currentExercise?.name || workout.name
  const isTimed =
    workout.name.includes("HIIT") ||
    /plank|hold|climber|jump|high knees/i.test(displayName)
  const totalSets = workout.sets ?? (isTimed ? 4 : 3)
  const phaseLabel = isRunning
    ? runningSegments[runIndex].label
    : phase === "rest"
      ? "REST"
      : "WORK"
  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
  const cues = /push/i.test(displayName)
    ? [
        "Keep your core tight",
        "Breathe out as you push",
        "Keep a long line from head to heel",
      ]
    : /squat|lunge/i.test(displayName)
      ? [
          "Soft knees on landing",
          "Press the floor away",
          "Keep your chest comfortably lifted",
        ]
      : [
          "Move with control",
          "Keep breathing steadily",
          "Choose a pace you can sustain",
        ]

  const beep = (double = false) => {
    if (!sound || muted) return
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioContextClass) return
      const context = new AudioContextClass()
      ;[0, ...(double ? [0.14] : [])].forEach((delay) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.frequency.value = double ? 720 : 620
        gain.gain.setValueAtTime(0.08, context.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + delay + 0.09,
        )
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(context.currentTime + delay)
        oscillator.stop(context.currentTime + delay + 0.1)
      })
    } catch {
      // Sound is an enhancement; the visible phase labels remain the source of truth.
    }
  }
  const announce = (message: string) => {
    if (!voice || muted || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message))
  }
  const signalChange = (message: string) => {
    beep(true)
    announce(message)
    if (vibration && "vibrate" in navigator) navigator.vibrate([80, 50, 80])
  }
  const finishWorkout = () => {
    setPaused(true)
    setScreen("complete")
  }
  const advanceExercise = (direction = 1) => {
    const next = exerciseIndex + direction
    if (next < 0) return
    if (next >= workout.exercises.length) return finishWorkout()
    setExerciseIndex(next)
    setSetIndex(0)
    setPhase("work")
    setRemaining(40)
    setReps(0)
    signalChange(
      `Next exercise, ${sessionSwaps[next] || workout.exercises[next].name}`,
    )
  }
  const finishRest = () => {
    if (setIndex + 1 < totalSets) {
      setSetIndex((value) => value + 1)
      setPhase("work")
      setRemaining(40)
      setReps(0)
      signalChange("Work")
    } else {
      advanceExercise()
    }
  }
  const finishWork = () => {
    setPhase("rest")
    setRemaining(20)
    signalChange("Rest")
  }
  const finishRunSegment = () => {
    if (runIndex + 1 >= runningSegments.length) return finishWorkout()
    const next = runIndex + 1
    setRunIndex(next)
    setRemaining(runningSegments[next].duration)
    signalChange(
      `${runningSegments[next].label === "JOG" ? "Jog" : "Walk"} now`,
    )
  }
  const moveRunSegment = (direction: number) => {
    const next = Math.max(
      0,
      Math.min(runningSegments.length - 1, runIndex + direction),
    )
    setRunIndex(next)
    setRemaining(runningSegments[next].duration)
  }
  const saveSession = (partial = false, destination = "/dashboard") => {
    const completedExercises = workout.exercises
      .slice(
        0,
        Math.min(
          workout.exercises.length,
          exerciseIndex + (partial ? 1 : workout.exercises.length),
        ),
      )
      .map((exercise, index) => sessionSwaps[index] || exercise.name)
    const existing = store.sessions.some(
      (session) =>
        session.workoutId === workout.id &&
        session.date === dateKey(new Date()),
    )
    if (!existing) {
      const sessions = [
        ...store.sessions,
        {
          workoutId: workout.id,
          date: dateKey(new Date()),
          duration: Math.max(1, Math.round(elapsed / 60)),
          exercisesDone: completedExercises,
          effort,
        },
      ]
      const completionDates = new Set(sessions.map((session) => session.date))
      let currentStreak = 0
      const cursor = new Date()
      while (completionDates.has(dateKey(cursor))) {
        currentStreak += 1
        cursor.setDate(cursor.getDate() - 1)
      }
      const challengeDay = Math.max(
        1,
        Math.floor(
          (Date.now() -
            new Date(`${store.challenge.startDate}T12:00:00`).getTime()) /
            86_400_000,
        ) + 1,
      )
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
        }
        const unlock = requirements[badge.id] ?? badge.unlocked
        return unlock && !badge.unlocked
          ? { ...badge, unlocked: true, date: dateKey(new Date()) }
          : badge
      })
      update({ ...store, sessions, badges })
    }
    toast(
      partial
        ? "Partial session saved."
        : "Workout saved. Your progress is updated.",
    )
    navigate(destination)
  }

  useEffect(() => {
    if (screen !== "countdown") return
    if (countdown <= 0) {
      signalChange(isRunning ? "Start walking" : "Begin")
      setScreen("active")
      setRemaining(isRunning ? runningSegments[0].duration : 40)
      return
    }
    beep()
    const timer = window.setTimeout(
      () => setCountdown((value) => value - 1),
      demoSpeed ? 100 : 1000,
    )
    return () => window.clearTimeout(timer)
  }, [screen, countdown, demoSpeed])

  useEffect(() => {
    if (screen !== "active" || paused) return
    const timer = window.setInterval(
      () => {
        setElapsed((value) => value + 1)
        if (isRunning || phase === "rest" || isTimed)
          setRemaining((value) => Math.max(0, value - 1))
      },
      demoSpeed ? 100 : 1000,
    )
    return () => window.clearInterval(timer)
  }, [screen, paused, demoSpeed, isRunning, isTimed, phase])

  useEffect(() => {
    if (screen !== "active" || paused) return
    if (remaining > 0 && remaining <= 3) beep()
    if (remaining !== 0) return
    if (isRunning) finishRunSegment()
    else if (phase === "rest") finishRest()
    else if (isTimed) finishWork()
  }, [remaining, screen, paused])

  useEffect(() => {
    if (screen !== "active") return
    const timer = window.setInterval(
      () => setCueIndex((value) => value + 1),
      demoSpeed ? 1500 : 15000,
    )
    return () => window.clearInterval(timer)
  }, [screen, demoSpeed, exerciseIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSettings) return
      if (event.key === "Escape") setShowEnd(true)
      if (screen !== "active") return
      if (event.code === "Space") {
        event.preventDefault()
        setPaused((value) => !value)
      }
      if (event.key === "ArrowRight")
        isRunning ? finishRunSegment() : advanceExercise()
      if (event.key === "ArrowLeft" && !isRunning) advanceExercise(-1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [screen, showSettings, isRunning, exerciseIndex, runIndex])

  useEffect(() => {
    const manageWakeLock = async () => {
      const wakeNavigator = navigator as Navigator & {
        wakeLock?: {
          request: (type: "screen") => Promise<{ release: () => Promise<void> }>
        }
      }
      if (wakeScreen && screen === "active" && wakeNavigator.wakeLock) {
        try {
          wakeLock.current = await wakeNavigator.wakeLock.request("screen")
        } catch {
          wakeLock.current = null
        }
      } else if (wakeLock.current) {
        await wakeLock.current.release()
        wakeLock.current = null
      }
    }
    void manageWakeLock()
    return () => {
      if (wakeLock.current) void wakeLock.current.release()
    }
  }, [wakeScreen, screen])

  const settingsButton = (
    <button
      className="player-icon-button"
      onClick={() => setShowSettings(true)}
      aria-label="Session settings"
    >
      <Icon name="gear" />
    </button>
  )
  const settingsSheet = showSettings && (
    <div
      className="player-modal-backdrop"
      onMouseDown={() => setShowSettings(false)}
    >
      <aside
        className="settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Session settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>SESSION PREFERENCES</small>
            <h2>Settings</h2>
          </div>
          <button
            className="player-icon-button"
            onClick={() => setShowSettings(false)}
            aria-label="Close settings"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="setting-list">
          {[
            ["Sound beeps", sound, setSound],
            ["Voice cues", voice, setVoice],
            ["Vibration on mobile", vibration, setVibration],
            ["Keep screen awake", wakeScreen, setWakeScreen],
            ["Demo speed 10×", demoSpeed, setDemoSpeed],
          ].map(([label, checked, setter]) => (
            <label key={String(label)}>
              <span>
                <strong>{String(label)}</strong>
                {label === "Demo speed 10×" && <small>For presentations</small>}
              </span>
              <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={(event) =>
                  setter as React.Dispatch<React.SetStateAction<boolean>>(
                    event.target.checked,
                  )
                }
              />
            </label>
          ))}
        </div>
      </aside>
    </div>
  )

  if (screen === "ready" || screen === "countdown")
    return (
      <main className="session-player ready-screen">
        <header>
          <button
            className="player-icon-button"
            onClick={() => navigate("/workouts")}
            aria-label="Close session"
          >
            <Icon name="close" />
          </button>
          {settingsButton}
        </header>
        {screen === "countdown" ? (
          <section className="start-countdown" aria-live="assertive">
            <small>GET READY</small>
            <strong>{countdown || "GO"}</strong>
            <p>{workout.name}</p>
          </section>
        ) : (
          <section className="ready-content">
            <div className="ready-heading">
              <small>
                {workout.minutes} MIN · {workout.exercises.length} EXERCISES
              </small>
              <h1>{workout.name}</h1>
              <p>Check your setup, then begin when you feel ready.</p>
            </div>
            <div className="ready-grid">
              <ol>
                {workout.exercises.map((exercise, index) => (
                  <li key={exercise.name}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.prescription}</small>
                  </li>
                ))}
              </ol>
              <div className="equipment-checklist">
                <small>EQUIPMENT CHECK</small>
                {equipmentItems.map((item, index) => (
                  <button
                    className={equipmentReady[index] ? "checked" : ""}
                    key={item}
                    onClick={() =>
                      setEquipmentReady((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index ? !value : value,
                        ),
                      )
                    }
                  >
                    <span>
                      {equipmentReady[index] && <Icon name="check" />}
                    </span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <p className="safety-line">
              Stop if you feel dizzy, sharp pain, or chest pain. This is general
              fitness guidance, not medical advice.
            </p>
            <Button
              onClick={() => {
                setCountdown(3)
                setScreen("countdown")
              }}
            >
              Begin <Icon name="play" />
            </Button>
          </section>
        )}
        {settingsSheet}
      </main>
    )

  if (screen === "complete") {
    const projectedCount = store.sessions.some(
      (session) =>
        session.workoutId === workout.id &&
        session.date === dateKey(new Date()),
    )
      ? store.sessions.length
      : store.sessions.length + 1
    const completionDates = new Set([
      ...store.sessions.map((session) => session.date),
      dateKey(new Date()),
    ])
    let completionStreak = 0
    const streakCursor = new Date()
    while (completionDates.has(dateKey(streakCursor))) {
      completionStreak += 1
      streakCursor.setDate(streakCursor.getDate() - 1)
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
    }
    const earnedBadge = store.badges.find(
      (badge) => !badge.unlocked && completionRequirements[badge.id],
    )
    return (
      <main className="session-player complete-screen">
        <header>{settingsButton}</header>
        <section>
          <span className="completion-mark">
            <Icon name="check" />
          </span>
          <small>
            DAY{" "}
            {Math.max(
              1,
              Math.floor(
                (Date.now() -
                  new Date(`${store.challenge.startDate}T12:00:00`).getTime()) /
                  86_400_000,
              ) + 1,
            )}
          </small>
          <h1>Workout complete</h1>
          <p>Great job showing up today.</p>
          <div className="completion-stats">
            <div>
              <strong>{formatTime(elapsed)}</strong>
              <span>Total time</span>
            </div>
            <div>
              <strong>
                {isRunning
                  ? runIndex + 1
                  : Math.min(workout.exercises.length, exerciseIndex + 1)}
              </strong>
              <span>{isRunning ? "Intervals" : "Exercises"}</span>
            </div>
            <div>
              <strong>
                {isRunning ? "—" : exerciseIndex * totalSets + setIndex + 1}
              </strong>
              <span>Sets</span>
            </div>
          </div>
          <div className="earned-banner">
            <Icon name="star" />
            <div>
              <strong>
                {earnedBadge
                  ? `${earnedBadge.name} badge unlocked`
                  : "Your streak is growing"}
              </strong>
              <span>
                Streak: {completionStreak}{" "}
                {completionStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
          <div className="effort-rating">
            <strong>How did that feel?</strong>
            <div>
              {[
                ["Easy", 2],
                ["Just right", 3],
                ["Hard", 5],
              ].map(([label, value]) => (
                <button
                  key={String(label)}
                  className={effort === value ? "active" : ""}
                  onClick={() => setEffort(Number(value))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {isRunning && (
            <label className="completion-field">
              Distance (km) · optional
              <input
                type="number"
                min="0"
                step=".1"
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
                placeholder="0.0"
              />
            </label>
          )}
          <label className="completion-field">
            Add a note · optional
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="How did the session feel?"
            />
          </label>
          <div className="completion-actions">
            <Button onClick={() => saveSession(false)}>
              Save and back to dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => saveSession(false, "/progress")}
            >
              Log my weight
            </Button>
          </div>
        </section>
        {settingsSheet}
      </main>
    )
  }

  const totalRunDuration = runningSegments.reduce(
    (sum, segment) => sum + segment.duration,
    0,
  )
  const runRemaining =
    runningSegments
      .slice(runIndex + 1)
      .reduce((sum, segment) => sum + segment.duration, 0) + remaining
  const progress = isRunning
    ? ((totalRunDuration - runRemaining) / totalRunDuration) * 100
    : ((exerciseIndex + (phase === "rest" ? 0.8 : 0.25)) /
        workout.exercises.length) *
      100
  return (
    <main className="session-player active-player">
      <header className="active-topbar">
        <button
          className="player-icon-button"
          onClick={() => setShowEnd(true)}
          aria-label="End workout"
        >
          <Icon name="close" />
        </button>
        <div>
          <strong>{workout.name}</strong>
          <span>
            {isRunning
              ? `Segment ${runIndex + 1} of ${runningSegments.length}`
              : `Exercise ${exerciseIndex + 1} of ${workout.exercises.length}`}
          </span>
        </div>
        <span className="elapsed-time">{formatTime(elapsed)}</span>
        {settingsButton}
        <div className="overall-progress">
          <i style={{ width: `${Math.max(2, progress)}%` }} />
        </div>
      </header>
      <section className="active-content">
        {isRunning ? (
          <div className="running-phase">
            <div className={`phase-label ${phaseLabel.toLowerCase()}`}>
              <Icon name={phaseLabel === "JOG" ? "bolt" : "walk"} />
              {phaseLabel}
            </div>
            <div className={`timer-ring ${phaseLabel.toLowerCase()}`}>
              <strong>{formatTime(remaining)}</strong>
              <span>{runningSegments[runIndex].name}</span>
            </div>
            <h2>
              {runIndex === 0
                ? "Warm-up"
                : runIndex === runningSegments.length - 1
                  ? "Cool-down"
                  : `Interval ${Math.ceil(runIndex / 2)} of 8`}
            </h2>
            <p>
              {phaseLabel === "JOG"
                ? "Easy pace. You should be able to hold a conversation."
                : "Brisk walk, let your breathing settle."}
            </p>
            {remaining <= 3 && runIndex < runningSegments.length - 1 && (
              <div className="transition-callout">
                {runningSegments[runIndex + 1].label === "JOG" ? "Jog" : "Walk"}{" "}
                in {remaining}
              </div>
            )}
            <button
              className={`indoor-toggle ${indoor ? "active" : ""}`}
              onClick={() => setIndoor((value) => !value)}
            >
              <span>{indoor && <Icon name="check" />}</span>No space or hot
              weather? March or jog in place.
            </button>
            <small className="outdoor-tip">
              In warm weather, go early morning or evening and bring water.
            </small>
            <div className="run-times">
              <span>
                Total elapsed <strong>{formatTime(elapsed)}</strong>
              </span>
              <span>
                Remaining <strong>{formatTime(runRemaining)}</strong>
              </span>
            </div>
            <div className="segment-timeline">
              {runningSegments.map((segment, index) => (
                <i
                  key={index}
                  className={
                    index === runIndex
                      ? "current"
                      : index < runIndex
                        ? "done"
                        : ""
                  }
                  title={segment.name}
                />
              ))}
            </div>
          </div>
        ) : phase === "rest" ? (
          <div className="rest-phase">
            <div className="timer-ring rest">
              <div className="phase-label rest">
                <Icon name="timer" />
                REST
              </div>
              <strong>{remaining}</strong>
              <span>seconds</span>
            </div>
            <div className="breathing-copy">
              <span />
              <strong>Breathe in... breathe out...</strong>
              <small>Sip some water</small>
            </div>
            <div className="rest-actions">
              <button onClick={() => setRemaining((value) => value + 15)}>
                +15s
              </button>
              <button onClick={finishRest}>Skip rest</button>
            </div>
            <div className="next-up-card">
              <small>NEXT UP</small>
              <strong>
                {setIndex + 1 < totalSets
                  ? displayName
                  : workout.exercises[exerciseIndex + 1]?.name ||
                    "Finish strong"}
              </strong>
              <span>
                {setIndex + 1 < totalSets
                  ? `Set ${setIndex + 2} of ${totalSets}`
                  : workout.exercises[exerciseIndex + 1]?.prescription}
              </span>
            </div>
          </div>
        ) : isTimed ? (
          <div className="timed-phase">
            <div className="timer-ring work">
              <div className="phase-label work">
                <Icon name="bolt" />
                WORK
              </div>
              <strong>{remaining}</strong>
              <span>seconds</span>
            </div>
            <h1>{displayName}</h1>
            <p>
              Round {setIndex + 1} of {totalSets}
            </p>
          </div>
        ) : (
          <div className="reps-phase">
            <div className="exercise-illustration">
              <Icon name="dumbbell" />
            </div>
            <div className="phase-label work">
              <Icon name="bolt" />
              WORK
            </div>
            <h1>{displayName}</h1>
            <p>
              Set {setIndex + 1} of {totalSets} · <strong>12 reps</strong>
            </p>
            <div className="rep-counter">
              <span>{reps}</span>
              <button
                onClick={() => setReps((value) => value + 1)}
                aria-label="Add repetition"
              >
                +
              </button>
            </div>
            <Button onClick={finishWork}>Done set</Button>
            <ul>
              <li>Brace your core before each rep</li>
              <li>Move through a comfortable range</li>
              <li>Exhale through the effort</li>
            </ul>
            <div className="next-up-chip">
              Next up:{" "}
              {setIndex + 1 < totalSets
                ? `Rest, then set ${setIndex + 2}`
                : workout.exercises[exerciseIndex + 1]?.name || "Cool down"}
            </div>
          </div>
        )}
        {!isRunning && phase === "work" && (
          <div className="session-options">
            <button
              onClick={() =>
                setSessionSwaps({
                  ...sessionSwaps,
                  [exerciseIndex]: `Easier ${currentExercise.name.toLowerCase()}`,
                })
              }
            >
              Easier option
            </button>
            <button
              onClick={() =>
                setSessionSwaps({
                  ...sessionSwaps,
                  [exerciseIndex]: `Low-impact ${currentExercise.name.toLowerCase()}`,
                })
              }
            >
              Low-impact option
            </button>
          </div>
        )}
        <div className="cue-banner" key={`${exerciseIndex}-${cueIndex}`}>
          <small>CUE</small>
          <strong>
            {isRunning
              ? phaseLabel === "JOG"
                ? "Relax your shoulders and find your rhythm"
                : "Let your breathing settle"
              : cues[cueIndex % cues.length]}
          </strong>
        </div>
      </section>
      <footer className="player-controls">
        <button
          onClick={() => (isRunning ? moveRunSegment(-1) : advanceExercise(-1))}
        >
          <Icon name="back" />
          Previous
        </button>
        <button
          className="pause-button"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Icon name="play" /> : <Icon name="pause" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => (isRunning ? finishRunSegment() : advanceExercise())}
        >
          Skip
          <Icon name="arrow" />
        </button>
        <button
          className={muted ? "muted" : ""}
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? "Unmute session" : "Mute session"}
        >
          <Icon name="volume" />
        </button>
      </footer>
      {showEnd && (
        <div className="player-modal-backdrop">
          <div className="end-dialog" role="dialog" aria-modal="true">
            <span className="dash-stat-icon">
              <Icon name="timer" />
            </span>
            <h2>End workout?</h2>
            <p>
              You can keep going, save what you completed, or discard this
              session.
            </p>
            <Button onClick={() => setShowEnd(false)}>Keep going</Button>
            <Button variant="ghost" onClick={() => saveSession(true)}>
              Save partial session
            </Button>
            <button
              className="discard-action"
              onClick={() => navigate("/workouts")}
            >
              Discard
            </button>
          </div>
        </div>
      )}
      {settingsSheet}
    </main>
  )
}
