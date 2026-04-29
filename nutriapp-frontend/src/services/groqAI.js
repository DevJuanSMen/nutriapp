import Groq from 'groq-sdk'

const apiKey = import.meta.env.VITE_GROQ_API_KEY

let groq = null
if (apiKey) {
  groq = new Groq({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

const checkGroq = () => {
  if (!groq) {
    throw new Error('La API Key de Groq no está configurada. Por favor, añádela como VITE_GROQ_API_KEY en las variables de entorno.')
  }
}


const SYSTEM_PROMPT = `Eres NutriBot, un asistente nutricional experto y amigable. Tu trabajo es:
- Dar recomendaciones de alimentación saludable personalizadas
- Sugerir recetas nutritivas y fáciles de preparar
- Responder preguntas sobre nutrición, macros y micronutrientes
- Dar consejos prácticos para mejorar hábitos alimenticios
- Ser motivador y positivo

Reglas:
- Responde siempre en español
- Usa emojis con moderación para hacer la conversación más amigable
- Si el usuario comparte su perfil (peso, altura, meta), personaliza las recomendaciones
- Da cantidades específicas cuando sea posible (gramos, porciones)
- Si no sabes algo, admítelo y sugiere consultar a un nutriólogo
- Sé conciso, respuestas de máximo 300 palabras`

/**
 * Chat nutricional con contexto del usuario
 */
export async function chatWithNutriBot(messages, userContext = null) {
  const systemMessage = userContext
    ? `${SYSTEM_PROMPT}\n\nContexto del usuario:\n${JSON.stringify(userContext, null, 2)}`
    : SYSTEM_PROMPT

  checkGroq()
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemMessage },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  return response.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'
}

/**
 * Analizar foto de comida con vision
 */
export async function analyzeFoodPhoto(base64Image, userContext = null) {
  const contextStr = userContext
    ? `\n\nContexto del usuario:
- Meta calórica diaria: ${userContext.targetCalories || 'No definida'} kcal
- Calorías consumidas hoy: ${userContext.consumedToday || 0} kcal
- Calorías restantes: ${(userContext.targetCalories || 2000) - (userContext.consumedToday || 0)} kcal`
    : ''

  checkGroq()
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza esta imagen de comida y responde en español con el siguiente formato JSON exacto (sin markdown, solo el JSON):
{
  "nombre": "nombre del alimento o platillo",
  "descripcion": "breve descripción de lo que ves",
  "calorias": número estimado de calorías,
  "proteina": gramos estimados de proteína,
  "carbohidratos": gramos estimados de carbohidratos,
  "grasa": gramos estimados de grasa,
  "porcion": "tamaño de porción estimada",
  "recomendacion": "recomendación basada en el contexto calórico del usuario",
  "saludable": true o false
}${contextStr}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 512,
  })

  const content = response.choices[0]?.message?.content || '{}'
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch {
    return {
      nombre: 'No identificado',
      descripcion: content,
      calorias: 0,
      proteina: 0,
      carbohidratos: 0,
      grasa: 0,
      porcion: 'Desconocida',
      recomendacion: 'No se pudo analizar la imagen correctamente. Intenta con otra foto más clara.',
      saludable: null,
    }
  }
}

/**
 * Generate healthy recipe suggestion
 */
export async function generateRecipe(preferences = '') {
  checkGroq()
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Eres un chef nutricionista. Genera recetas saludables en español. Responde SOLO con JSON válido (sin markdown) con este formato:
{
  "name": "nombre de la receta",
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "calories": número,
  "protein": gramos,
  "carbs": gramos,
  "fat": gramos,
  "instructions": "paso a paso de la preparación",
  "time": "tiempo de preparación",
  "difficulty": "fácil/media/difícil"
}`,
      },
      {
        role: 'user',
        content: preferences
          ? `Genera una receta saludable con estas preferencias: ${preferences}`
          : 'Genera una receta saludable, nutritiva y fácil de preparar',
      },
    ],
    temperature: 0.8,
    max_tokens: 512,
  })

  const content = response.choices[0]?.message?.content || '{}'
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(content)
  } catch {
    return null
  }
}

// Daily nutrition tip
const TIPS = [
  "💧 Beber agua antes de cada comida puede ayudarte a controlar las porciones.",
  "🥦 Intenta que la mitad de tu plato sean vegetales en cada comida.",
  "🍳 El desayuno rico en proteínas te mantiene satisfecho más tiempo.",
  "🥑 Las grasas saludables (aguacate, nueces, aceite de oliva) son esenciales para absorber vitaminas.",
  "⏰ Intenta comer a horarios regulares para mantener tu metabolismo activo.",
  "🌾 Los carbohidratos complejos (avena, arroz integral) te dan energía sostenida.",
  "🥛 El calcio no solo está en la leche: brócoli, almendras y sardinas también lo tienen.",
  "🍌 Un plátano antes de entrenar te da potasio y energía rápida.",
  "🫐 Los antioxidantes de las frutas oscuras (moras, arándanos) protegen tus células.",
  "🥩 La proteína ayuda a recuperar tus músculos: apunta a 1.6g por kg de peso.",
  "🧂 Reduce el sodio: prueba sazonar con limón, ajo y hierbas frescas.",
  "🥕 Los vegetales naranjas son ricos en betacaroteno, excelente para la vista.",
  "🍵 El té verde puede aumentar ligeramente tu metabolismo basal.",
  "🥗 Preparar comidas con anticipación (meal prep) es clave para no caer en comida rápida.",
  "😴 Dormir bien (7-9h) es tan importante como comer bien para tu composición corporal.",
]

export function getDailyTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return TIPS[dayOfYear % TIPS.length]
}
