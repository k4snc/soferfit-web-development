
export const glossaryTerms = [
  ["Bodyweight", "Exercises that use only your own body weight as resistance, such as push-ups and squats. No equipment needed."],
  ["Cardio", "Exercise that raises your heart rate for a sustained period, such as brisk walking, jumping jacks, or cycling."],
  ["Compound movement", "An exercise that works several muscle groups at once, such as a squat or a push-up."],
  ["Fat Loss & Cardio", "Higher-repetition, shorter-rest workouts that keep your heart rate up to help burn calories."],
  ["Full Body", "A workout that trains your upper body, lower body, and core together instead of focusing on one muscle."],
  ["HIIT (High-Intensity Interval Training)", "Short bursts of hard effort followed by brief rest, repeated in rounds. It is intense, so beginners should start slowly and anyone with an injury or health condition should check with a doctor first."],
  ["Muscle & Strength", "Lower-repetition, longer-rest workouts focused on building strength and muscle."],
  ["Reps (repetitions)", "How many times you perform a movement in a row."],
  ["Rest interval", "The pause between sets or rounds that lets your body recover."],
  ["Sets", "A group of reps done before you rest."],
  ["Somatotype", "A broad, non-medical description of body-build tendencies. It can help set a starting point, but it does not define your metabolism, potential, or results."],
  ["Activity level", "How much you move during a typical week outside planned workouts, from mostly seated to highly active."],
  ["Body recomposition", "A gradual shift toward more lean muscle and less body fat, which may happen without a large change on the scale."],
  ["Challenge duration", "The 60- or 90-day window used to organize training progression, recovery, and habit-building milestones."],
  ["Target weight", "An optional reference point for tracking progress. SoferFit can build your challenge without a target weight."],
] as const;

export const glossaryId = (term: string) => `glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
