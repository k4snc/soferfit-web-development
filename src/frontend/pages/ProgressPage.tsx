import { useState } from "react"
import { Button } from "../components/Button"
import { EmptyState } from "../components/EmptyState"
import { Icon } from "../components/Icon"
import { PageHeader } from "../components/PageHeader"
import type { FitnessStore } from "../fitnessStore"
import { dateKey, prettyDate } from "../lib/format"

export function ProgressPage({
  store,
  update,
  toast,
}: {
  store: FitnessStore
  update: (next: FitnessStore) => boolean
  toast: (message: string, error?: boolean) => void
}) {
  type ProgressTab = "overview" | "body" | "photos" | "badges"
  const [tab, setTab] = useState<ProgressTab>("overview")
  const [showWeight, setShowWeight] = useState(false)
  const [editingWeight, setEditingWeight] = useState<number | null>(null)
  const [weightForm, setWeightForm] = useState({
    date: dateKey(new Date()),
    weight: "",
    waist: "",
    hips: "",
    chest: "",
  })
  const [weightError, setWeightError] = useState("")
  const [showPhoto, setShowPhoto] = useState(false)
  const [photoForm, setPhotoForm] = useState<{
    date: string
    angle: "Front" | "Side" | "Back"
    image: string
  }>({ date: dateKey(new Date()), angle: "Front", image: "" })
  const [photoError, setPhotoError] = useState("")
  const [compareMode, setCompareMode] = useState(false)
  const [beforeIndex, setBeforeIndex] = useState(0)
  const [afterIndex, setAfterIndex] = useState(
    Math.max(0, store.photos.length - 1),
  )
  const [comparePosition, setComparePosition] = useState(50)
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const unit = store.user.unitSystem === "metric" ? "kg" : "lb"
  const measurementUnit = store.user.unitSystem === "metric" ? "cm" : "in"
  const sortedWeights = store.weights
    .map((entry, index) => ({ ...entry, sourceIndex: index }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const startWeight = sortedWeights[0]?.weight
  const currentWeight = sortedWeights.at(-1)?.weight
  const targetWeight = Number(store.user.targetWeight) || undefined
  const targetProgress =
    startWeight !== undefined &&
    currentWeight !== undefined &&
    targetWeight !== undefined &&
    startWeight !== targetWeight
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((startWeight - currentWeight) / (startWeight - targetWeight)) *
                100,
            ),
          ),
        )
      : 0
  const activeMinutes = store.sessions.reduce(
    (sum, session) => sum + session.duration,
    0,
  )
  const sessionDates = Array.from(
    new Set(store.sessions.map((session) => session.date)),
  ).sort()
  let bestStreak = 0
  let runningStreak = 0
  sessionDates.forEach((date, index) => {
    const previous = index
      ? new Date(`${sessionDates[index - 1]}T12:00:00`)
      : null
    const current = new Date(`${date}T12:00:00`)
    runningStreak =
      previous &&
      Math.round((current.getTime() - previous.getTime()) / 86_400_000) === 1
        ? runningStreak + 1
        : 1
    bestStreak = Math.max(bestStreak, runningStreak)
  })
  let currentStreak = 0
  const completedDateSet = new Set(sessionDates)
  const streakCursor = new Date()
  while (completedDateSet.has(dateKey(streakCursor))) {
    currentStreak += 1
    streakCursor.setDate(streakCursor.getDate() - 1)
  }
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`)
  const challengeDay = Math.max(
    1,
    Math.min(
      store.challenge.length,
      Math.floor((Date.now() - challengeStart.getTime()) / 86_400_000) + 1,
    ),
  )
  const currentWeek = Math.floor((challengeDay - 1) / 7)
  const weeklyCounts = Array.from(
    { length: Math.min(8, Math.ceil(store.challenge.length / 7)) },
    (_, displayIndex) => {
      const weekIndex = Math.max(0, currentWeek - 3) + displayIndex
      return {
        week: weekIndex,
        count: store.sessions.filter(
          (session) =>
            Math.floor(
              (new Date(`${session.date}T12:00:00`).getTime() -
                challengeStart.getTime()) /
                (7 * 86_400_000),
            ) === weekIndex,
        ).length,
      }
    },
  ).filter((item) => item.week < Math.ceil(store.challenge.length / 7))
  const maxWeekly = Math.max(
    store.challenge.daysPerWeek,
    ...weeklyCounts.map((item) => item.count),
  )
  const fastChange = (() => {
    if (!weightForm.weight || !sortedWeights.length) return false
    const previous = sortedWeights.at(-1)!
    const days = Math.max(
      1,
      Math.abs(
        (new Date(`${weightForm.date}T12:00:00`).getTime() -
          new Date(`${previous.date}T12:00:00`).getTime()) /
          86_400_000,
      ),
    )
    const changeKg =
      Math.abs(Number(weightForm.weight) - previous.weight) *
      (store.user.unitSystem === "metric" ? 1 : 0.453592)
    return (changeKg / days) * 7 > 1
  })()
  const unlockTrackingBadge = (id: string, badges = store.badges) =>
    badges.map((badge) =>
      badge.id === id
        ? { ...badge, unlocked: true, date: badge.date || dateKey(new Date()) }
        : badge,
    )

  const openWeightModal = (entryIndex?: number) => {
    if (entryIndex === undefined) {
      setEditingWeight(null)
      setWeightForm({
        date: dateKey(new Date()),
        weight: "",
        waist: "",
        hips: "",
        chest: "",
      })
    } else {
      const entry = store.weights[entryIndex]
      setEditingWeight(entryIndex)
      setWeightForm({
        date: entry.date,
        weight: String(entry.weight),
        waist: String(entry.measurements?.waist ?? ""),
        hips: String(entry.measurements?.hips ?? ""),
        chest: String(entry.measurements?.chest ?? ""),
      })
    }
    setWeightError("")
    setShowWeight(true)
  }
  const saveWeight = () => {
    const weight = Number(weightForm.weight)
    const minWeight = store.user.unitSystem === "metric" ? 25 : 55
    const maxWeight = store.user.unitSystem === "metric" ? 400 : 880
    const measurements = [weightForm.waist, weightForm.hips, weightForm.chest]
      .filter(Boolean)
      .map(Number)
    const minMeasurement = store.user.unitSystem === "metric" ? 30 : 12
    const maxMeasurement = store.user.unitSystem === "metric" ? 300 : 120
    if (
      !weightForm.date ||
      !weight ||
      weight < minWeight ||
      weight > maxWeight ||
      measurements.some(
        (value) => value < minMeasurement || value > maxMeasurement,
      )
    ) {
      setWeightError(
        `Use ${minWeight}–${maxWeight} ${unit} and ${minMeasurement}–${maxMeasurement} ${measurementUnit} for measurements.`,
      )
      return
    }
    const entry = {
      date: weightForm.date,
      weight,
      measurements: {
        waist: weightForm.waist ? Number(weightForm.waist) : undefined,
        hips: weightForm.hips ? Number(weightForm.hips) : undefined,
        chest: weightForm.chest ? Number(weightForm.chest) : undefined,
      },
    }
    const weights =
      editingWeight === null
        ? [...store.weights, entry]
        : store.weights.map((item, index) =>
            index === editingWeight ? entry : item,
          )
    if (
      !update({
        ...store,
        weights,
        user: { ...store.user, weight: String(weight) },
        badges: unlockTrackingBadge("weight-1"),
      })
    )
      return
    setShowWeight(false)
    toast(
      editingWeight === null ? "Weight entry saved." : "Weight entry updated.",
    )
  }
  const choosePhoto = (file?: File) => {
    setPhotoError("")
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setPhotoError("Choose a JPG, PNG, or WebP image.")
    if (file.size > 5 * 1024 * 1024)
      return setPhotoError("Choose an image smaller than 5 MB.")
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext("2d")
        if (!context)
          return setPhotoError(
            "We couldn't prepare that image. Please try another.",
          )
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        setPhotoForm((current) => ({
          ...current,
          image: canvas.toDataURL("image/webp", 0.82),
        }))
      }
      image.onerror = () =>
        setPhotoError("We couldn't preview that image. Please try another.")
      image.src = String(reader.result)
    }
    reader.onerror = () =>
      setPhotoError("We couldn't read that image. Please try another.")
    reader.readAsDataURL(file)
  }
  const savePhoto = () => {
    if (!photoForm.image || !photoForm.date)
      return setPhotoError("Choose an image and date.")
    const photos = [...store.photos, photoForm].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    if (!update({ ...store, photos, badges: unlockTrackingBadge("photo-1") }))
      return
    setAfterIndex(photos.length - 1)
    setShowPhoto(false)
    setPhotoForm({ date: dateKey(new Date()), angle: "Front", image: "" })
    toast("Progress photo added.")
  }

  const chartValues = sortedWeights.map((entry) => entry.weight)
  const chartBounds = [...chartValues, ...(targetWeight ? [targetWeight] : [])]
  const chartMin = chartBounds.length ? Math.min(...chartBounds) - 2 : 0
  const chartMax = chartBounds.length ? Math.max(...chartBounds) + 2 : 1
  const chartPoint = (value: number, index: number) => ({
    x:
      sortedWeights.length === 1
        ? 40
        : 40 + (index / (sortedWeights.length - 1)) * 560,
    y: 190 - ((value - chartMin) / Math.max(1, chartMax - chartMin)) * 150,
  })
  const points = sortedWeights.map((entry, index) =>
    chartPoint(entry.weight, index),
  )
  const badgeCatalog = [
    {
      category: "Streaks",
      id: "streak-3",
      name: "3-day streak",
      target: 3,
      value: bestStreak,
      detail: "Complete a workout on 3 consecutive days.",
    },
    {
      category: "Streaks",
      id: "streak-7",
      name: "7-day streak",
      target: 7,
      value: bestStreak,
      detail: "Complete a workout on 7 consecutive days.",
    },
    {
      category: "Streaks",
      id: "streak-14",
      name: "14-day streak",
      target: 14,
      value: bestStreak,
      detail: "Complete a workout on 14 consecutive days.",
    },
    {
      category: "Streaks",
      id: "streak-30",
      name: "30-day streak",
      target: 30,
      value: bestStreak,
      detail: "Build a consistent 30-day workout streak.",
    },
    {
      category: "Workouts",
      id: "workout-1",
      name: "First workout",
      target: 1,
      value: store.sessions.length,
      detail: "Finish and save your first workout.",
    },
    {
      category: "Workouts",
      id: "workout-10",
      name: "10 workouts",
      target: 10,
      value: store.sessions.length,
      detail: "Finish 10 workout sessions.",
    },
    {
      category: "Workouts",
      id: "workout-25",
      name: "25 workouts",
      target: 25,
      value: store.sessions.length,
      detail: "Finish 25 workout sessions.",
    },
    {
      category: "Workouts",
      id: "workout-50",
      name: "50 workouts",
      target: 50,
      value: store.sessions.length,
      detail: "Finish 50 workout sessions.",
    },
    {
      category: "Challenge milestones",
      id: "week-1",
      name: "Week 1 done",
      target: store.challenge.daysPerWeek,
      value: store.sessions.filter(
        (session) =>
          new Date(`${session.date}T12:00:00`).getTime() <
          challengeStart.getTime() + 7 * 86_400_000,
      ).length,
      detail: "Complete your planned sessions in the first week.",
    },
    {
      category: "Challenge milestones",
      id: "halfway",
      name: "Halfway",
      target: Math.ceil(store.challenge.length / 2),
      value: challengeDay,
      detail: "Reach the halfway point of your challenge.",
    },
    {
      category: "Challenge milestones",
      id: "finish",
      name: "Finish line",
      target: store.challenge.length,
      value: challengeDay,
      detail: "Reach the final day of your challenge.",
    },
    {
      category: "Tracking",
      id: "weight-1",
      name: "First weigh-in",
      target: 1,
      value: store.weights.length,
      detail: "Save your first weight entry.",
    },
    {
      category: "Tracking",
      id: "photo-1",
      name: "First photo",
      target: 1,
      value: store.photos.length,
      detail: "Add your first private progress photo.",
    },
  ]
  const nextBadge = badgeCatalog.find((badge) => badge.value < badge.target)
  const selectedBadgeData = badgeCatalog.find(
    (badge) => badge.id === selectedBadge,
  )
  const photoGroups = store.photos.reduce<Record<string, {
    photo: FitnessStore["photos"][number]
    index: number
  }[]>>((groups, photo, index) => {
    const week = Math.max(
      1,
      Math.floor(
        (new Date(`${photo.date}T12:00:00`).getTime() -
          challengeStart.getTime()) /
          (7 * 86_400_000),
      ) + 1,
    )
    const key = `Week ${week}`
    groups[key] = [...(groups[key] || []), { photo, index }]
    return groups
  }, {})

  return (
    <>
      <PageHeader eyebrow="YOUR TRANSFORMATION" title="Progress" />
      <div
        className="workout-tabs progress-tabs"
        role="tablist"
        aria-label="Progress views"
      >
        {[
          ["overview", "Overview"],
          ["body", "Body"],
          ["photos", "Photos"],
          ["badges", "Badges"],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value as ProgressTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="progress-overview">
          <article className="progress-hero">
            <div
              className="target-ring"
              style={
                {
                  "--target-progress": `${targetProgress * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <div>
                <strong>{targetProgress}%</strong>
                <span>TARGET PROGRESS</span>
              </div>
            </div>
            <div>
              <small>PHYSICAL PROGRESS</small>
              <h2>
                {store.weights.length
                  ? "Your trend, at a glance."
                  : "Start with one simple check-in."}
              </h2>
              {store.weights.length ? (
                <p>
                  <strong>
                    {startWeight} {unit}
                  </strong>
                  <Icon name="arrow" />
                  <strong>
                    {currentWeight} {unit}
                  </strong>
                  <Icon name="arrow" />
                  <strong>
                    {targetWeight ? `${targetWeight} ${unit}` : "Set target"}
                  </strong>
                </p>
              ) : (
                <p>Log your starting weight to begin.</p>
              )}
              <Button
                onClick={() => {
                  setTab("body")
                  openWeightModal()
                }}
              >
                {store.weights.length ? "Log weight" : "Add starting weight"}
              </Button>
            </div>
          </article>
          <div className="progress-stat-grid">
            {[
              ["check", "WORKOUTS COMPLETED", String(store.sessions.length)],
              [
                "timer",
                "ACTIVE TIME",
                activeMinutes < 60
                  ? `${activeMinutes}m`
                  : `${(activeMinutes / 60).toFixed(1)}h`,
              ],
              [
                "flame",
                "CURRENT STREAK",
                `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`,
              ],
              [
                "star",
                "BEST STREAK",
                `${bestStreak} ${bestStreak === 1 ? "day" : "days"}`,
              ],
            ].map(([icon, label, value]) => (
              <article key={label}>
                <span className="dash-stat-icon">
                  <Icon name={icon as "check" | "timer" | "flame" | "star"} />
                </span>
                <small>{label}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <article className="consistency-card">
            <div className="panel-head">
              <div>
                <small>CONSISTENCY</small>
                <h3>Workouts by week</h3>
              </div>
              <span>
                {store.sessions.length
                  ? `${store.sessions.length} total`
                  : "No sessions yet"}
              </span>
            </div>
            {store.sessions.length ? (
              <>
                <div className="consistency-bars">
                  {weeklyCounts.map((item) => (
                    <div key={item.week}>
                      <i
                        className={item.week === currentWeek ? "current" : ""}
                        style={{
                          height: `${Math.max(8, (item.count / maxWeekly) * 100)}%`,
                        }}
                      />
                      <span>W{item.week + 1}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="Your rhythm will appear here"
                copy="Complete your first workout to start building a weekly consistency view."
              />
            )}
          </article>
        </div>
      )}

      {tab === "body" && (
        <div className="body-progress">
          <div className="progress-section-head">
            <div>
              <small>BODY TRACKING</small>
              <h2>Weight over time</h2>
            </div>
            <Button onClick={() => openWeightModal()}>Log weight</Button>
          </div>
          <article className="weight-chart-card">
            {sortedWeights.length ? (
              <>
                <svg
                  className="weight-chart"
                  viewBox="0 0 640 230"
                  role="img"
                  aria-label="Weight entries over time"
                >
                  <line
                    className="chart-axis"
                    x1="40"
                    y1="190"
                    x2="600"
                    y2="190"
                  />
                  {targetWeight && (
                    <>
                      <line
                        className="target-line"
                        x1="40"
                        y1={chartPoint(targetWeight, 0).y}
                        x2="600"
                        y2={chartPoint(targetWeight, 0).y}
                      />
                      <text
                        x="596"
                        y={chartPoint(targetWeight, 0).y - 7}
                        textAnchor="end"
                      >
                        Target {targetWeight} {unit}
                      </text>
                    </>
                  )}
                  <polyline
                    points={points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                  />
                  <circle
                    className="start-point"
                    cx={points[0].x}
                    cy={points[0].y}
                    r="6"
                  />
                  {points.map((point, index) => (
                    <circle key={index} cx={point.x} cy={point.y} r="5" />
                  ))}
                  <text
                    x={points[0].x}
                    y={points[0].y - 12}
                    textAnchor="middle"
                  >
                    Start
                  </text>
                </svg>
                <div className="weight-chart-dates">
                  <span>{prettyDate(sortedWeights[0].date)}</span>
                  <span>{prettyDate(sortedWeights.at(-1)!.date)}</span>
                </div>
              </>
            ) : (
              <EmptyState
                title="No entries yet."
                copy="Your first weigh-in becomes your starting point."
              />
            )}
          </article>
          {sortedWeights.length > 0 && (
            <article className="weight-entry-list">
              <div className="panel-head">
                <div>
                  <small>ENTRIES</small>
                  <h3>Your check-ins</h3>
                </div>
              </div>
              {sortedWeights
                .slice()
                .reverse()
                .map((entry) => (
                  <div key={`${entry.date}-${entry.sourceIndex}`}>
                    <div>
                      <strong>
                        {entry.weight} {unit}
                      </strong>
                      <span>
                        {prettyDate(entry.date)}
                        {entry.measurements &&
                        Object.values(entry.measurements).some(Boolean)
                          ? ` · Measurements added`
                          : ""}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => openWeightModal(entry.sourceIndex)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          update({
                            ...store,
                            weights: store.weights.filter(
                              (_, index) => index !== entry.sourceIndex,
                            ),
                          })
                          toast("Weight entry deleted.")
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </article>
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="photos-progress">
          <div className="progress-section-head">
            <div>
              <small>PHOTO LOG</small>
              <h2>Progress photos</h2>
              <p>Your photos are private and only visible to you.</p>
            </div>
            <div>
              {store.photos.length >= 2 && (
                <Button
                  variant="ghost"
                  onClick={() => setCompareMode((value) => !value)}
                >
                  {compareMode ? "View gallery" : "Compare"}
                </Button>
              )}
              <Button
                onClick={() => {
                  setPhotoError("")
                  setShowPhoto(true)
                }}
              >
                Add progress photo
              </Button>
            </div>
          </div>
          {compareMode && store.photos.length >= 2 ? (
            <article className="photo-compare">
              <div className="compare-pickers">
                <label>
                  Before
                  <select
                    value={beforeIndex}
                    onChange={(event) =>
                      setBeforeIndex(Number(event.target.value))
                    }
                  >
                    {store.photos.map((photo, index) => (
                      <option value={index} key={`${photo.date}-${index}`}>
                        {prettyDate(photo.date)} · {photo.angle || "Front"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  After
                  <select
                    value={afterIndex}
                    onChange={(event) =>
                      setAfterIndex(Number(event.target.value))
                    }
                  >
                    {store.photos.map((photo, index) => (
                      <option value={index} key={`${photo.date}-${index}`}>
                        {prettyDate(photo.date)} · {photo.angle || "Front"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div
                className="compare-stage"
                style={
                  {
                    "--compare-position": `${comparePosition}%`,
                  } as React.CSSProperties
                }
              >
                <img
                  src={store.photos[beforeIndex]?.image}
                  alt={`Progress on ${prettyDate(store.photos[beforeIndex]?.date)}`}
                />
                <div>
                  <img
                    src={store.photos[afterIndex]?.image}
                    alt={`Progress on ${prettyDate(store.photos[afterIndex]?.date)}`}
                  />
                </div>
                <i />
              </div>
              <label className="compare-slider">
                Drag to compare
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comparePosition}
                  onChange={(event) =>
                    setComparePosition(Number(event.target.value))
                  }
                />
              </label>
            </article>
          ) : store.photos.length ? (
            <div className="photo-weeks">
              {Object.entries(photoGroups).map(([week, photos]) => (
                <section key={week}>
                  <h3>{week}</h3>
                  <div>
                    {photos.map(({ photo, index }) => (
                      <article key={`${photo.date}-${index}`}>
                        <img
                          src={photo.image}
                          alt={`${photo.angle || "Front"} progress view from ${prettyDate(photo.date)}`}
                        />
                        <div>
                          <span>
                            <strong>{photo.angle || "Front"}</strong>
                            <small>{prettyDate(photo.date)}</small>
                          </span>
                          <button
                            onClick={() => {
                              update({
                                ...store,
                                photos: store.photos.filter(
                                  (_, photoIndex) => photoIndex !== index,
                                ),
                              })
                              toast("Photo deleted.")
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="photo-empty">
              <span>
                <Icon name="camera" />
              </span>
              <h3>Take your Day 1 photo</h3>
              <p>
                A private photo can help you notice changes that numbers may not
                capture.
              </p>
              <Button onClick={() => setShowPhoto(true)}>
                Add progress photo
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "badges" && (
        <div className="badges-progress">
          <article className="badge-summary">
            <span className="badge-flame">
              <Icon name="flame" />
            </span>
            <div>
              <small>CURRENT STREAK</small>
              <strong>
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </strong>
            </div>
            {nextBadge && (
              <div className="next-badge">
                <span>
                  Next: <strong>{nextBadge.name}</strong>
                </span>
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, (nextBadge.value / nextBadge.target) * 100)}%`,
                    }}
                  />
                </div>
                <small>
                  {Math.min(nextBadge.value, nextBadge.target)}/
                  {nextBadge.target}
                </small>
              </div>
            )}
          </article>
          {["Streaks", "Workouts", "Challenge milestones", "Tracking"].map(
            (category) => (
              <section className="badge-category" key={category}>
                <h2>{category}</h2>
                <div>
                  {badgeCatalog
                    .filter((badge) => badge.category === category)
                    .map((badge) => {
                      const storedBadge = store.badges.find(
                        (item) => item.id === badge.id,
                      )
                      const unlocked = Boolean(
                        storedBadge?.unlocked || badge.value >= badge.target,
                      )
                      return (
                        <button
                          className={unlocked ? "unlocked" : ""}
                          key={badge.id}
                          onClick={() => setSelectedBadge(badge.id)}
                        >
                          <span>
                            <Icon name={unlocked ? "star" : "bolt"} />
                          </span>
                          <strong>{badge.name}</strong>
                          <small>
                            {unlocked
                              ? `Unlocked ${
                                  storedBadge?.date
                                    ? prettyDate(storedBadge.date)
                                    : "today"
                                }`
                              : `${Math.min(badge.value, badge.target)}/${badge.target}`}
                          </small>
                        </button>
                      )
                    })}
                </div>
              </section>
            ),
          )}
          {selectedBadgeData && (
            <div className="badge-detail">
              <button
                onClick={() => setSelectedBadge(null)}
                aria-label="Close badge detail"
              >
                <Icon name="close" />
              </button>
              <span>
                <Icon name="star" />
              </span>
              <small>{selectedBadgeData.category}</small>
              <h3>{selectedBadgeData.name}</h3>
              <p>{selectedBadgeData.detail}</p>
              <strong>
                {Math.min(selectedBadgeData.value, selectedBadgeData.target)}/
                {selectedBadgeData.target} complete
              </strong>
            </div>
          )}
        </div>
      )}

      {showWeight && (
        <div
          className="progress-modal-backdrop"
          onMouseDown={() => setShowWeight(false)}
        >
          <div
            className="progress-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Log weight"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>BODY CHECK-IN</small>
                <h2>{editingWeight === null ? "Log weight" : "Edit entry"}</h2>
              </div>
              <button onClick={() => setShowWeight(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </header>
            <div className="progress-form">
              <label>
                Date
                <input
                  type="date"
                  value={weightForm.date}
                  onChange={(event) =>
                    setWeightForm({ ...weightForm, date: event.target.value })
                  }
                />
              </label>
              <label>
                Weight ({unit})
                <input
                  type="number"
                  step=".1"
                  value={weightForm.weight}
                  onChange={(event) => {
                    setWeightForm({ ...weightForm, weight: event.target.value })
                    setWeightError("")
                  }}
                />
              </label>
              <span>
                OPTIONAL MEASUREMENTS · {measurementUnit.toUpperCase()}
              </span>
              <label>
                Waist
                <input
                  type="number"
                  step=".1"
                  value={weightForm.waist}
                  onChange={(event) =>
                    setWeightForm({ ...weightForm, waist: event.target.value })
                  }
                />
              </label>
              <label>
                Hips
                <input
                  type="number"
                  step=".1"
                  value={weightForm.hips}
                  onChange={(event) =>
                    setWeightForm({ ...weightForm, hips: event.target.value })
                  }
                />
              </label>
              <label>
                Chest
                <input
                  type="number"
                  step=".1"
                  value={weightForm.chest}
                  onChange={(event) =>
                    setWeightForm({ ...weightForm, chest: event.target.value })
                  }
                />
              </label>
            </div>
            {fastChange && (
              <p className="gentle-note">
                That's a fast change. Gradual progress is safer; we'll keep your
                plan paced.
              </p>
            )}
            {weightError && <p className="inline-validation">{weightError}</p>}
            <Button onClick={saveWeight}>Save entry</Button>
          </div>
        </div>
      )}
      {showPhoto && (
        <div
          className="progress-modal-backdrop"
          onMouseDown={() => setShowPhoto(false)}
        >
          <div
            className="progress-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add progress photo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>PRIVATE PHOTO LOG</small>
                <h2>Add progress photo</h2>
              </div>
              <button onClick={() => setShowPhoto(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </header>
            <label className="photo-upload">
              {photoForm.image ? (
                <img src={photoForm.image} alt="Selected progress preview" />
              ) : (
                <span>
                  <Icon name="camera" />
                  <strong>Choose a photo</strong>
                  <small>JPG, PNG or WebP · max 5 MB</small>
                </span>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) => choosePhoto(event.target.files?.[0])}
              />
            </label>
            <div className="progress-form photo-meta">
              <label>
                Date
                <input
                  type="date"
                  value={photoForm.date}
                  onChange={(event) =>
                    setPhotoForm({ ...photoForm, date: event.target.value })
                  }
                />
              </label>
              <label>
                Angle
                <select
                  value={photoForm.angle}
                  onChange={(event) =>
                    setPhotoForm({
                      ...photoForm,
                      angle: event.target.value as "Front" | "Side" | "Back",
                    })
                  }
                >
                  <option>Front</option>
                  <option>Side</option>
                  <option>Back</option>
                </select>
              </label>
            </div>
            {photoError && <p className="inline-validation">{photoError}</p>}
            <Button onClick={savePhoto}>Save photo</Button>
            <p className="privacy-line">
              Your photos are private and only visible to you.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
