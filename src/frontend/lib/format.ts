import type { UnitSystem } from "../types"

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const parseHeightCm = (value: string, unit: UnitSystem) => {
  if (unit === "metric") return Number(value)
  const match = value.match(/(\d+)\D+(\d+)/)
  return match ? Number(match[1]) * 30.48 + Number(match[2]) * 2.54 : NaN
}

export const parseWeightKg = (value: string, unit: UnitSystem) =>
  unit === "metric" ? Number(value) : Number(value) / 2.20462

export const dateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const prettyDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
