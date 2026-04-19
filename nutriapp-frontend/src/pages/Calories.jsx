import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, RotateCcw, Download, Utensils, Flame } from 'lucide-react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

export default function Calories() {
  const items = useQuery(api.meals.get) || []
  const addMeal = useMutation(api.meals.add)
  const removeMeal = useMutation(api.meals.remove)
  const resetMeals = useMutation(api.meals.reset)

  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [loading, setLoading] = useState(false)

  const total = items.reduce((s, i) => s + Number(i.calories || 0), 0)

  async function add() {
    if (!name || !calories) return
    setLoading(true)
    try {
      await addMeal({ name, calories: Number(calories) })
      setName('')
      setCalories('')
    } catch (err) {
      console.error('Error inserting meal:', err)
      alert('Error al guardar la comida')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id) {
    try {
      await removeMeal({ id })
    } catch (err) {
      console.error('Error deleting meal:', err)
    }
  }

  async function resetDay() {
    if (window.confirm('¿Estás seguro de borrar todo lo registrado hoy?')) {
      try {
        await resetMeals()
      } catch (err) {
        console.error('Error resetting meals:', err)
      }
    }
  }

  function exportExcel() {
    const rows = items.map(i => `<tr><td>${i.name}</td><td>${i.calories}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table><tr><th>Nombre</th><th>Calorías</th></tr>${rows}</table></body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comidas.xls'
    a.click()
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-5">
          <div className="glass-card">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Plus className="text-brand-500" size={20} />
              Añadir Alimento
            </h2>
            <div className="space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">¿Cuántas calorías tiene?</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Flame className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    placeholder="Ej. 95"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    type="number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">kcal</span>
                  </div>
                </div>
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
                <button onClick={resetDay} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Resetear Día">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[400px]">
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <Utensils className="mx-auto text-slate-200 mb-3" size={40} />
                  <p className="text-slate-500">Todavía no has registrado nada hoy.</p>
                </div>
              ) : (
                items.map((it) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    key={it._id} 
                    className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-200 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-700">{it.name}</div>
                      <div className="text-sm text-brand-600 font-medium">{it.calories} kcal</div>
                    </div>
                    <div>
                      <button onClick={() => remove(it._id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
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
    </div>
  )
}
