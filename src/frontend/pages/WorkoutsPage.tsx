import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import type { FitnessStore, PlannedWorkout } from "../fitnessStore";
import { dateKey, prettyDate } from "../lib/format";

export function WorkoutsPage({ store, update, navigate, toast }: { store: FitnessStore; update: (next: FitnessStore) => void; navigate: (path: string) => void; toast: (message: string, error?: boolean) => void }) {
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
