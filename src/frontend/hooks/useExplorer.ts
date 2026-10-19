import { useEffect, useMemo, useState } from "react"
import { exercises, fullBodyExercises } from "../data/exercises"
import type {
  Equipment,
  Gender,
  Muscle,
  Orientation,
  TrainingMode,
} from "../types"

export function useExplorer() {
  const [gender, setGender] = useState<Gender>("Man")
  const [orientation, setOrientation] = useState<Orientation>("Front")
  const [selected, setSelected] = useState<Muscle | null>(null)
  const [fullBody, setFullBody] = useState(false)
  const [mode, setMode] = useState<TrainingMode>("Fat Loss & Cardio")
  const [equipment, setEquipment] = useState<Equipment>(
    "No Equipment / Bodyweight",
  )
  const [routineState, setRoutineState] =
    useState<"idle" | "loading" | "results">("idle")
  const [loadingMessage, setLoadingMessage] = useState(0)
  const [explorerAge, setExplorerAge] = useState("")
  const [explorerHeight, setExplorerHeight] = useState("")
  const [explorerWeight, setExplorerWeight] = useState("")

  const focusArea = fullBody ? "Full Body" : selected
  const prescription =
    mode === "Fat Loss & Cardio"
      ? "3 x 15 · 30s rest"
      : mode === "HIIT"
        ? "40s work / 20s rest × 4 rounds"
        : "4 x 8 · 90s rest"
  const list = useMemo(() => {
    if (fullBody) {
      return fullBodyExercises[equipment].map((exercise) => ({
        ...exercise,
        level: mode,
        reps: prescription,
        equipment,
      }))
    }
    if (!selected) return []
    return exercises[selected].slice(0, 4).map((exercise) => ({
      name: equipment === "Gym Equipment" ? exercise.gym : exercise.bodyweight,
      tag: selected,
      level: mode,
      reps: prescription,
      equipment,
    }))
  }, [selected, fullBody, mode, equipment, prescription])
  const metricErrors = {
    age:
      explorerAge && (+explorerAge < 10 || +explorerAge > 100) ? "10–100" : "",
    height:
      explorerHeight && (+explorerHeight < 100 || +explorerHeight > 250)
        ? "100–250 cm"
        : "",
    weight:
      explorerWeight && (+explorerWeight < 25 || +explorerWeight > 300)
        ? "25–300 kg"
        : "",
  }

  useEffect(() => {
    if (routineState !== "loading") return
    setLoadingMessage(0)
    const messageTimer = window.setInterval(
      () => setLoadingMessage((current) => (current + 1) % 2),
      1200,
    )
    const resultTimer = window.setTimeout(
      () => setRoutineState("results"),
      3500,
    )
    return () => {
      window.clearInterval(messageTimer)
      window.clearTimeout(resultTimer)
    }
  }, [routineState])

  const selectMuscle = (muscle: Muscle) => {
    setSelected((current) => (!fullBody && current === muscle ? null : muscle))
    setFullBody(false)
    setRoutineState("idle")
  }
  const selectFullBody = () => {
    setFullBody((current) => !current)
    setSelected(null)
    setRoutineState("idle")
  }
  const updateMode = (nextMode: TrainingMode) => {
    setMode(nextMode)
    setRoutineState("idle")
  }
  const updateEquipment = (nextEquipment: Equipment) => {
    setEquipment(nextEquipment)
    setRoutineState("idle")
  }

  return {
    gender,
    setGender,
    orientation,
    setOrientation,
    selected,
    fullBody,
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
    list,
    metricErrors,
    selectMuscle,
    selectFullBody,
    updateMode,
    updateEquipment,
  }
}
