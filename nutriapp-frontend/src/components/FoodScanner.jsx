import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, AlertTriangle, Sparkles } from 'lucide-react'
import { analyzeFoodPhoto } from '../services/groqAI'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function FoodScanner({ onResult, onClose, consumedToday = 0 }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)
  const profile = useQuery(api.profile.get)

  const targetCalories = profile
    ? (() => {
        const w = profile.weight_kg || 70
        const h = profile.height_cm || 170
        const a = profile.age || 25
        const s = profile.sex_assigned || 'male'
        const base = s === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
        const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 }
        return Math.round(base * (factors[profile.activity_level] || 1.2))
      })()
    : 2000

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      // Extract base64 without the data URI prefix
      const base64 = ev.target.result.split(',')[1]
      setImage(base64)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    try {
      const res = await analyzeFoodPhoto(image, { targetCalories, consumedToday })
      setResult(res)
    } catch (err) {
      console.error(err)
      setError('Error al analizar la imagen. Verifica tu API key de Groq o intenta con otra foto.')
    } finally {
      setAnalyzing(false)
    }
  }

  const remaining = targetCalories - consumedToday
  const wouldExceed = result ? (consumedToday + (result.calorias || 0)) > targetCalories : false

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Escáner de Comida</h2>
              <p className="text-xs text-slate-400">Analiza tu comida con IA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Context bar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 text-sm">
            <span className="text-slate-500">Presupuesto restante</span>
            <span className={`font-bold ${remaining > 0 ? 'text-brand-600' : 'text-red-500'}`}>
              {remaining} kcal
            </span>
          </div>

          {/* Upload Area */}
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all group"
            >
              <Upload className="mx-auto text-slate-300 group-hover:text-brand-400 mb-3 transition-colors" size={40} />
              <p className="text-slate-500 font-medium">Sube una foto de tu comida</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG — máximo 10MB</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </div>
          ) : (
            <div className="relative">
              <img src={preview} alt="Food preview" className="w-full h-56 object-cover rounded-2xl" />
              <button
                onClick={() => { setPreview(null); setImage(null); setResult(null) }}
                className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Analyze Button */}
          {preview && !result && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="w-full btn-primary py-3.5 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analizar Comida
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              <AlertTriangle className="inline mr-2" size={16} />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{result.nombre}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{result.descripcion}</p>
                  </div>
                  {result.saludable !== null && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.saludable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.saludable ? '✅ Saludable' : '⚠️ Cuidado'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white/80 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-orange-600">{result.calorias}</div>
                    <div className="text-[10px] text-slate-400 font-medium">kcal</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-red-500">{result.proteina}g</div>
                    <div className="text-[10px] text-slate-400 font-medium">Proteína</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-amber-500">{result.carbohidratos}g</div>
                    <div className="text-[10px] text-slate-400 font-medium">Carbos</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-violet-500">{result.grasa}g</div>
                    <div className="text-[10px] text-slate-400 font-medium">Grasa</div>
                  </div>
                </div>

                {/* Would exceed warning */}
                {wouldExceed && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 mb-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Agregar esto te haría superar tu meta calórica diaria por {(consumedToday + (result.calorias || 0)) - targetCalories} kcal.</span>
                  </div>
                )}

                <p className="text-sm text-slate-600 bg-white/60 p-3 rounded-xl">{result.recomendacion}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onResult(result)}
                  className="flex-1 btn-primary py-3"
                >
                  <Check size={18} /> Agregar a mi registro
                </button>
                <button
                  onClick={() => { setResult(null); setPreview(null); setImage(null) }}
                  className="px-5 py-3 font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Otra foto
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
