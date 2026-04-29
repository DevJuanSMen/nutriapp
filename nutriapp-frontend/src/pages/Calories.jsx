import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, RotateCcw, Download, Utensils, Flame, Beef, Wheat, Droplets, Camera, Archive } from 'lucide-react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import FoodScanner from '../components/FoodScanner'

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Desayuno', color: 'text-amber-600 bg-amber-50' },
  { value: 'lunch', label: '☀️ Almuerzo', color: 'text-blue-600 bg-blue-50' },
  { value: 'dinner', label: '🌙 Cena', color: 'text-indigo-600 bg-indigo-50' },
  { value: 'snack', label: '🍎 Snack', color: 'text-green-600 bg-green-50' },
]

function getMealLabel(type) {
  return MEAL_TYPES.find(m => m.value === type) || MEAL_TYPES[3]
}

export default function Calories() {
  const items = useQuery(api.meals.getToday) || []
  const addMeal = useMutation(api.meals.add)
  const removeMeal = useMutation(api.meals.remove)
  const resetDayMutation = useMutation(api.meals.resetDay)

  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState('snack')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [autoCalc, setAutoCalc] = useState(false)

  const total = items.reduce((s, i) => s + Number(i.calories || 0), 0)
  const totalProtein = items.reduce((s, i) => s + Number(i.protein || 0), 0)
  const totalCarbs = items.reduce((s, i) => s + Number(i.carbs || 0), 0)
  const totalFat = items.reduce((s, i) => s + Number(i.fat || 0), 0)

  // Auto-calculate calories from macros
  React.useEffect(() => {
    if (autoCalc && (protein || carbs || fat)) {
      const calc = (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9
      if (calc > 0) setCalories(String(Math.round(calc)))
    }
  }, [protein, carbs, fat, autoCalc])

  async function add() {
    if (!name || !calories) return
    setLoading(true)
    try {
      await addMeal({
        name,
        calories: Number(calories),
        protein: protein ? Number(protein) : 0,
        carbs: carbs ? Number(carbs) : 0,
        fat: fat ? Number(fat) : 0,
        mealType,
      })
      setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
    } catch (err) {
      console.error('Error inserting meal:', err)
      alert('Error al guardar la comida')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id) {
    try { await removeMeal({ id }) } catch (err) { console.error(err) }
  }

  async function resetDay() {
    if (window.confirm('¿Archivar el día y reiniciar? Las comidas se guardarán en tu historial.')) {
      try { await resetDayMutation() } catch (err) { console.error(err) }
    }
  }

  function handleScanResult(result) {
    if (result) {
      setName(result.nombre || '')
      setCalories(String(result.calorias || ''))
      setProtein(String(result.proteina || ''))
      setCarbs(String(result.carbohidratos || ''))
      setFat(String(result.grasa || ''))
    }
    setShowScanner(false)
  }

  function exportExcel() {
    const rows = items.map(i => `<tr><td>${i.name}</td><td>${i.calories}</td><td>${i.protein || 0}</td><td>${i.carbs || 0}</td><td>${i.fat || 0}</td><td>${getMealLabel(i.mealType).label}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table><tr><th>Nombre</th><th>Calorías</th><th>Proteína (g)</th><th>Carbos (g)</th><th>Grasa (g)</th><th>Tipo</th></tr>${rows}</table></body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'comidas.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
          Registro de Comidas
        </h1>
        <p className="text-slate-500 mt-1">Lleva el control de lo que comes al instante.</p>
      </div>

      {/* Quick Macro Summary Bar */}
      {items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 rounded-2xl p-4 text-center">
            <Flame className="mx-auto text-orange-500 mb-1" size={20} />
            <div className="text-2xl font-bold text-orange-600">{total}</div>
            <div className="text-xs text-orange-400 font-medium">kcal totales</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-2xl p-4 text-center">
            <Beef className="mx-auto text-red-500 mb-1" size={20} />
            <div className="text-2xl font-bold text-red-600">{totalProtein}g</div>
            <div className="text-xs text-red-400 font-medium">Proteína</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl p-4 text-center">
            <Wheat className="mx-auto text-amber-500 mb-1" size={20} />
            <div className="text-2xl font-bold text-amber-600">{totalCarbs}g</div>
            <div className="text-xs text-amber-400 font-medium">Carbohidratos</div>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50 rounded-2xl p-4 text-center">
            <Droplets className="mx-auto text-violet-500 mb-1" size={20} />
            <div className="text-2xl font-bold text-violet-600">{totalFat}g</div>
            <div className="text-xs text-violet-400 font-medium">Grasas</div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-5">
          <div className="glass-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="text-brand-500" size={20} />
                Añadir Alimento
              </h2>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition-colors"
              >
                <Camera size={16} /> Escanear
              </button>
            </div>

            <div className="space-y-4">
              {/* Meal Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de comida</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TYPES.map(mt => (
                    <button
                      key={mt.value}
                      onClick={() => setMealType(mt.value)}
                      className={`text-xs font-medium py-2 px-1 rounded-xl border transition-all ${
                        mealType === mt.value
                          ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">¿Qué comiste?</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Utensils className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    placeholder="Ej. Manzana"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Macros */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-600">Macronutrientes (opcional)</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCalc}
                      onChange={(e) => setAutoCalc(e.target.checked)}
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-slate-500">Auto-calcular kcal</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-red-500 font-medium mb-1">Proteína (g)</label>
                    <input
                      className="w-full p-2.5 bg-red-50/50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-300 outline-none transition-all text-sm"
                      placeholder="0"
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-500 font-medium mb-1">Carbos (g)</label>
                    <input
                      className="w-full p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl focus:ring-2 focus:ring-amber-300 outline-none transition-all text-sm"
                      placeholder="0"
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-violet-500 font-medium mb-1">Grasa (g)</label>
                    <input
                      className="w-full p-2.5 bg-violet-50/50 border border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-300 outline-none transition-all text-sm"
                      placeholder="0"
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Calorías</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Flame className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    className={`w-full pl-11 pr-16 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm ${autoCalc ? 'bg-slate-50 text-slate-500' : ''}`}
                    placeholder="Ej. 95"
                    value={calories}
                    onChange={(e) => { if (!autoCalc) setCalories(e.target.value) }}
                    type="number"
                    readOnly={autoCalc}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">kcal</span>
                  </div>
                </div>
                {autoCalc && <p className="text-xs text-slate-400 mt-1">Calculado: P×4 + C×4 + G×9</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={add} 
                  disabled={loading || !name || !calories}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Añadir a mi lista'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-7">
          <div className="glass-card h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                Resumen del día <span className="text-brand-500 text-sm ml-2 bg-brand-50 px-2 py-0.5 rounded-full">{items.length} items</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={exportExcel} className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-colors" title="Exportar a Excel">
                  <Download size={18} />
                </button>
                <button onClick={resetDay} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors" title="Archivar y reiniciar día">
                  <Archive size={16} /> Archivar
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[500px]">
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <Utensils className="mx-auto text-slate-200 mb-3" size={40} />
                  <p className="text-slate-500">Todavía no has registrado nada hoy.</p>
                  <p className="text-xs text-slate-400 mt-1">Usa el formulario o escanea una foto de tu comida</p>
                </div>
              ) : (
                items.map((it) => {
                  const mt = getMealLabel(it.mealType)
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      key={it._id} 
                      className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-200 transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mt.color}`}>
                            {mt.label}
                          </span>
                          <span className="font-semibold text-slate-700">{it.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-brand-600 font-bold">{it.calories} kcal</span>
                          {(it.protein > 0 || it.carbs > 0 || it.fat > 0) && (
                            <>
                              <span className="text-red-400">P: {it.protein || 0}g</span>
                              <span className="text-amber-400">C: {it.carbs || 0}g</span>
                              <span className="text-violet-400">G: {it.fat || 0}g</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button onClick={() => remove(it._id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  )
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-500">Total consumido</span>
                <span className="text-2xl font-bold text-slate-800">{total} <span className="text-sm font-medium text-slate-500">kcal</span></span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Food Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <FoodScanner
            onResult={handleScanResult}
            onClose={() => setShowScanner(false)}
            consumedToday={total}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
