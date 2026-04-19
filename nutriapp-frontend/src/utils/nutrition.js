export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Number((weightKg / (h * h)).toFixed(1))
}

export function bmr({ sex = 'male', weightKg, heightCm, age }) {
  // Mifflin-St Jeor
  if (!weightKg || !heightCm || !age) return null
  if (sex === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
}

export function activityFactor(level) {
  // sedentary, light, moderate, active, very
  switch (level) {
    case 'light':
      return 1.375
    case 'moderate':
      return 1.55
    case 'active':
      return 1.725
    case 'very':
      return 1.9
    default:
      return 1.2
  }
}

export function recommendedCalories(profile) {
  const base = bmr(profile)
  if (!base) return null
  const factor = activityFactor(profile.activity)
  return Math.round(base * factor)
}

export function classificationByTarget(totalCalories, target) {
  if (!target) return { label: 'Sin objetivo', state: 'neutral' }
  if (totalCalories < target * 0.9) return { label: 'Déficit', state: 'low' }
  if (totalCalories <= target * 1.1) return { label: 'En rango', state: 'normal' }
  return { label: 'Exceso', state: 'high' }
}
