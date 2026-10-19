import soferFitLogo from "../assets/soferfit-logo.png"
import { Button } from "../components/Button"
import { EmptyState } from "../components/EmptyState"
import { Icon } from "../components/Icon"
import { PageHeader } from "../components/PageHeader"
import type { FitnessStore } from "../fitnessStore"
import { dateKey } from "../lib/format"

export function OverviewPage({
  store,
  navigate,
}: {
  store: FitnessStore
  navigate: (path: string) => void
}) {
  const today = new Date()
  const todayKey = dateKey(today)
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`)
  const challengeDay = Math.max(
    1,
    Math.min(
      store.challenge.length,
      Math.floor((today.getTime() - challengeStart.getTime()) / 86_400_000) + 1,
    ),
  )
  const nextWorkout =
    store.plan
      .filter((workout) => workout.date >= todayKey && !workout.optional)
      .sort((left, right) => left.date.localeCompare(right.date))[0] ??
    store.plan[0]
  const workoutToday = nextWorkout?.date === todayKey
  const activeMinutes = store.sessions.reduce(
    (sum, session) => sum + session.duration,
    0,
  )
  const completedDates = new Set(store.sessions.map((session) => session.date))
  let streak = 0
  const cursor = new Date(today)
  while (completedDates.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7))
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
  const plannedDates = new Set(store.plan.map((workout) => workout.date))
  const firstName = store.user.username.split(/\s+/)[0] || "Member"

  return (
    <>
      <PageHeader
        eyebrow={`DAY ${challengeDay}`}
        title={`Keep your rhythm, ${firstName}.`}
      />
      <div className="dash-layout">
        <div className="dash-primary">
          {nextWorkout ? (
            <article className="today-workout">
              <div className="today-copy">
                <span className="workout-label">
                  {workoutToday
                    ? `TODAY'S WORKOUT · ${nextWorkout.minutes} MIN`
                    : "REST DAY"}
                </span>
                <h2>{workoutToday ? nextWorkout.name : "Rest day"}</h2>
                <p>
                  {workoutToday
                    ? `${nextWorkout.exercises.length} exercises · ${nextWorkout.equipment} · ${nextWorkout.intensity ?? "Moderate"}`
                    : `Next: ${nextWorkout.name}, ${new Date(`${nextWorkout.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
                </p>
                {workoutToday && (
                  <Button
                    onClick={() => navigate(`/session/${nextWorkout.id}`)}
                  >
                    Start workout <Icon name="play" />
                  </Button>
                )}
              </div>
              <div
                className="workout-art"
                aria-hidden="true"
                style={
                  {
                    "--runner-logo": `url(${soferFitLogo})`,
                  } as React.CSSProperties
                }
              />
            </article>
          ) : (
            <EmptyState
              title="Your first workout is waiting"
              copy="Visit Generate to create a workout that fits your day."
            />
          )}
          <article className="dash-calendar-panel">
            <div className="panel-head">
              <div>
                <h3>
                  {today.toLocaleDateString(undefined, { month: "long" })}{" "}
                  activity
                </h3>
              </div>
              <span>
                {streak ? `${streak} day streak` : "Start your streak"}
              </span>
            </div>
            <div className="full-calendar">
              <div className="week days">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
              <div className="calendar-grid">
                {calendarDays.map((date) => {
                  const key = dateKey(date)
                  const completed = completedDates.has(key)
                  const isToday = key === todayKey
                  const planned = plannedDates.has(key)
                  const className = completed
                    ? "done"
                    : isToday
                      ? "today"
                      : planned
                        ? "upcoming"
                        : "rest"
                  return (
                    <span
                      key={key}
                      className={className}
                      aria-label={`${date.toDateString()}, ${
                        completed
                          ? "completed"
                          : isToday
                            ? "today"
                            : planned
                              ? "upcoming"
                              : "rest"
                      }`}
                    >
                      {completed ? <Icon name="check" /> : date.getDate()}
                    </span>
                  )
                })}
              </div>
              <div className="calendar-legend">
                <span>
                  <i className="done" />
                  Completed
                </span>
                <span>
                  <i className="upcoming" />
                  Upcoming
                </span>
                <span>
                  <i className="today" />
                  Today
                </span>
                <span>
                  <i className="rest" />
                  Rest
                </span>
              </div>
            </div>
          </article>
        </div>
        <div className="dash-secondary">
          <div className="stat-row">
            <article>
              <span className="dash-stat-icon">
                <Icon name="calendar" />
              </span>
              <small>CHALLENGE</small>
              <strong>
                Day {challengeDay} <i>/ {store.challenge.length}</i>
              </strong>
              <span>
                {Math.max(0, store.challenge.length - challengeDay)} days
                remaining
              </span>
            </article>
            <article>
              <span className="dash-stat-icon">
                <Icon name="bolt" />
              </span>
              <small>ACTIVE TIME</small>
              <strong>
                {activeMinutes < 60
                  ? `${activeMinutes}m`
                  : `${(activeMinutes / 60).toFixed(1)}h`}
              </strong>
              <span>
                {store.sessions.length
                  ? `${store.sessions.length} sessions completed`
                  : "Your first session is ready"}
              </span>
            </article>
          </div>
          <article className="strength-card">
            <div className="panel-head">
              <div>
                <small>BADGES</small>
                <h3>
                  {store.badges.some((badge) => badge.unlocked)
                    ? "Your consistency is showing."
                    : "Complete sessions to earn badges."}
                </h3>
              </div>
              <strong>
                {store.badges.filter((badge) => badge.unlocked).length}/
                {store.badges.length}
              </strong>
            </div>
            <div className="badge-grid">
              {store.badges.map((badge) => (
                <div
                  className={badge.unlocked ? "unlocked" : ""}
                  key={badge.id}
                >
                  <Icon name={badge.unlocked ? "check" : "star"} />
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="encouragement">
            <p>“Small steps, repeated, become your transformation.”</p>
            <span>KEEP YOUR RHYTHM · DAY {challengeDay}</span>
          </article>
        </div>
      </div>
    </>
  )
}
