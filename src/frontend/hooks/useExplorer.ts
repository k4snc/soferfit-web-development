import { useEffect, useMemo, useState } from "react";
import { exercises, fullBodyExercises } from "../data/exercises";
import type {
  Equipment,
  Gender,
  Muscle,
  Orientation,
  SplitSession,
  TrainingMode,
  TrainingSplit,
} from "../types";

const UPPER_BODY_FOCUS: Muscle[] = [
  "Chest",
  "Upper Chest",
  "Shoulders",
  "Front Deltoid",
  "Rear Deltoid",
  "Biceps",
  "Triceps",
  "Forearms",
  "Upper Lats",
  "Mid Lats",
  "Lower Lats",
  "Upper Trapezius",
  "Mid Trapezius",
  "Lower Trapezius",
];
const CORE_FOCUS: Muscle[] = [
  "Core",
  "Upper Abs",
  "Lower Abs",
  "Obliques",
  "Lower Back",
];
const LOWER_BODY_FOCUS: Muscle[] = ["Quads", "Hamstring", "Calves", "Gluteal"];
const SPLIT_SESSIONS: Record<Exclude<TrainingSplit, "Custom">, SplitSession[]> = {
  "Push/Pull/Legs": ["Push", "Pull", "Legs"],
  "Upper/Lower": ["Upper", "Lower"],
};
const SPLIT_FOCUSES: Record<SplitSession, Muscle[]> = {
  Push: ["Chest", "Front Deltoid", "Triceps"],
  Pull: [
    "Upper Lats",
    "Mid Lats",
    "Lower Lats",
    "Upper Trapezius",
    "Mid Trapezius",
    "Lower Trapezius",
    "Rear Deltoid",
    "Biceps",
    "Forearms",
    "Lower Back",
  ],
  Legs: ["Quads", "Hamstring", "Gluteal", "Calves"],
  Upper: [
    "Chest",
    "Front Deltoid",
    "Rear Deltoid",
    "Upper Lats",
    "Mid Lats",
    "Lower Lats",
    "Upper Trapezius",
    "Mid Trapezius",
    "Lower Trapezius",
    "Biceps",
    "Triceps",
    "Forearms",
  ],
  Lower: ["Quads", "Hamstring", "Gluteal", "Calves", "Lower Back"],
};

export function useExplorer() {
  const [gender, setGender] = useState<Gender>("Man");
  const [orientation, setOrientation] = useState<Orientation>("Front");
  const [selected, setSelected] = useState<Muscle[]>([]);
  const [fullBody, setFullBody] = useState(false);
  const [trainingSplit, setTrainingSplit] = useState<TrainingSplit>("Custom");
  const [splitSession, setSplitSession] = useState<SplitSession | null>(null);
  const [mode, setMode] = useState<TrainingMode>("Fat Loss & Cardio");
  const [equipment, setEquipment] = useState<Equipment>("No Equipment / Bodyweight");
  const [routineState, setRoutineState] = useState<"idle" | "loading" | "results">("idle");
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [explorerAge, setExplorerAge] = useState("");
  const [explorerHeight, setExplorerHeight] = useState("");
  const [explorerWeight, setExplorerWeight] = useState("");

  const focusArea = fullBody
    ? "Full Body"
    : selected.length > 0
      ? selected.join(" + ")
      : null;
  const shouldSuggestFullBody =
    !fullBody &&
    selected.some((muscle) => UPPER_BODY_FOCUS.includes(muscle)) &&
    selected.some((muscle) => CORE_FOCUS.includes(muscle)) &&
    selected.some((muscle) => LOWER_BODY_FOCUS.includes(muscle));
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
    const suggestions = new Map<string, {
      name: string;
      tag: string;
      level: TrainingMode;
      reps: string;
      equipment: Equipment;
    }>();

    for (const muscle of selected) {
      for (const exercise of exercises[muscle].slice(0, 4)) {
        const name = equipment === "Gym Equipment" ? exercise.gym : exercise.bodyweight;
        const existing = suggestions.get(name);
        if (existing) {
          const tags = existing.tag.split(" · ");
          if (!tags.includes(muscle)) existing.tag = [...tags, muscle].join(" · ");
          continue;
        }

        suggestions.set(name, {
          name,
          tag: muscle,
          level: mode,
          reps: prescription,
          equipment,
        });
      }
    }

    return [...suggestions.values()];
  }, [selected, fullBody, mode, equipment, prescription]);
  const metricErrors = {
    age: explorerAge && (+explorerAge < 10 || +explorerAge > 100) ? "10–100" : "",
    height: explorerHeight && (+explorerHeight < 100 || +explorerHeight > 250) ? "100–250 cm" : "",
    weight: explorerWeight && (+explorerWeight < 25 || +explorerWeight > 300) ? "25–300 kg" : "",
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

  const selectMuscle = (muscle: Muscle) => {
    setSelected((current) =>
      current.includes(muscle)
        ? current.filter((item) => item !== muscle)
        : [...current, muscle],
    );
    setFullBody(false);
    setRoutineState("idle");
  };
  const removeMuscle = (muscle: Muscle) => {
    setSelected((current) => current.filter((item) => item !== muscle));
    setRoutineState("idle");
  };
  const selectFullBody = () => {
    setFullBody((current) => !current);
    setSelected([]);
    setTrainingSplit("Custom");
    setSplitSession(null);
    setRoutineState("idle");
  };
  const updateTrainingSplit = (nextSplit: TrainingSplit) => {
    setTrainingSplit(nextSplit);
    if (nextSplit === "Custom") {
      setSplitSession(null);
      setRoutineState("idle");
      return;
    }

    const nextSession = SPLIT_SESSIONS[nextSplit][0];
    setSplitSession(nextSession);
    setSelected(SPLIT_FOCUSES[nextSession]);
    setFullBody(false);
    setRoutineState("idle");
  };
  const updateSplitSession = (nextSession: SplitSession) => {
    setSplitSession(nextSession);
    setSelected(SPLIT_FOCUSES[nextSession]);
    setFullBody(false);
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

  return {
    gender,
    setGender,
    orientation,
    setOrientation,
    selected,
    fullBody,
    trainingSplit,
    splitSession,
    splitSessions: trainingSplit === "Custom" ? [] : SPLIT_SESSIONS[trainingSplit],
    mode,
    equipment,
    routineState,
    setRoutineState,
    loadingMessage,
    explorerAge,
    setExplorerAge,
    explorerHeight,
    setExplorerHeight,
    explorerWeight,
    setExplorerWeight,
    focusArea: focusArea as Muscle | "Full Body" | null,
    shouldSuggestFullBody,
    list,
    metricErrors,
    selectMuscle,
    removeMuscle,
    selectFullBody,
    updateTrainingSplit,
    updateSplitSession,
    updateMode,
    updateEquipment,
  };
}
