import { Button } from "./Button";
import { Icon } from "./Icon";
import type { PlannedWorkout } from "../fitnessStore";
import { prettyDate } from "../lib/format";

export function WorkoutCard({ workout, onStart }: { workout: PlannedWorkout; onStart: () => void }) {
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
