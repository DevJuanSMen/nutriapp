import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, Target, TrendingUp, Settings, Plus, Apple } from 'lucide-react'
import { bmi, recommendedCalories, classificationByTarget } from '../utils/nutrition'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

function bmiCategory(imc) {
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

function classificationLabel(total, target) {
  if (!target) return 'Sin objetivo definido'
  if (total < target * 0.9) return 'Déficit calórico (por debajo del límite)'
  if (total <= target * 1.1) return 'En rango saludable'
  return 'Exceso calórico (por encima de la meta)'
}

function ProgressRing({ radius, stroke, progress, target, total }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  let color = '#22c55e'; // brand-500
  if (progress > 120) color = '#ef4444'; // red-500
  else if (progress > 100) color = '#f97316'; // accent-500

  return (
    <div className="relative flex items-center justify-center filter drop-shadow-sm">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90 transform">
        <circle stroke="#f1f5f9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-slate-800">{total}</span>
        <span className="text-xs font-medium text-slate-400">/ {target || '--'} kcal</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate()
  const profile = useQuery(api.profile.get)
  const items = useQuery(api.meals.get) || []
  const saveProfileMutation = useMutation(api.profile.update)

  const [editingProfile, setEditingProfile] = useState(false)
  const [localProfile, setLocalProfile] = useState(null)

  useEffect(() => {
    if (profile) setLocalProfile(profile)
  }, [profile])


  const total = items.reduce((s, i) => s + Number(i.calories || 0), 0)
  const weightKg = profile ? (profile.weight_kg ?? profile.weightKg ?? profile.weight) : null
  const heightCm = profile ? (profile.height_cm ?? profile.heightCm ?? profile.height) : null
  const imc = profile ? bmi(weightKg, heightCm) : null
  const target = profile ? recommendedCalories({ sex: profile.sex_assigned ?? profile.sex, weightKg: weightKg, heightCm: heightCm, age: profile.age }) : null
  
  const classification = classificationByTarget(total, target)
  const progressRaw = target ? (total / target) * 100 : 0
  const displayProgress = Math.min(Math.max(progressRaw, 0), 200)

  // Motion variants
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      await saveProfileMutation({
        age: localProfile?.age ?? null,
        weight_kg: localProfile?.weightKg ?? localProfile?.weight_kg ?? null,
        height_cm: localProfile?.heightCm ?? localProfile?.height_cm ?? null,
        sex_assigned: localProfile?.sex ?? localProfile?.sex_assigned ?? null,
        activity_level: localProfile?.activity ?? localProfile?.activity_level ?? null,
      })
      setEditingProfile(false)
    } catch (err) {
      console.error(err)
      alert('Error al guardar el perfil')
    }
  }

  if (profile === undefined) {
    // Loading state
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
            Resumen Diario
          </h1>
          <p className="text-slate-500 mt-1">Sigue tu progreso y alcanza tus metas nutricionales.</p>
        </div>
        <button onClick={() => navigate('/calories')} className="btn-primary">
          <Plus size={18} /> Registrar Comida
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVars} className="glass-card md:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-brand-500" size={20} /> Tu Perfil 
              </h2>
              <button onClick={() => { if (!localProfile) setLocalProfile({}); setEditingProfile(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <Settings size={18} />
              </button>
            </div>
            
            {profile ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-slate-500">Peso/Altura</span>
                  <span className="text-sm font-bold text-slate-800">{weightKg ?? '--'} kg / {heightCm ?? '--'} cm</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-slate-500">IMC</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800">{imc ?? '--'}</span>
                    <span className="text-xs text-brand-600 block">{imc ? bmiCategory(imc) : ''}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-slate-500">Nivel Actividad</span>
                  <span className="text-sm font-bold text-slate-800 capitalize hover:text-clip">{profile?.activity_level ?? profile?.activity ?? '--'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500">
                  <Activity size={24} />
                </div>
                <p className="text-sm text-slate-500 mb-4">Aún no configuraste tu perfil. Completa tus datos para obtener recomendaciones.</p>
                <button className="btn-secondary w-full text-sm py-2" onClick={() => { setLocalProfile({}); setEditingProfile(true); }}>Configurar Perfil</button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div variants={itemVars} className="glass-card md:col-span-8 bg-gradient-to-br from-white/90 to-brand-50/30">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Flame className="text-accent-500" size={20} />
            Consumo Calórico
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-10 justify-around">
            <ProgressRing radius={100} stroke={16} progress={displayProgress} total={total} target={target} />
            
            <div className="space-y-6 w-full md:w-1/2">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Estado Actual</h3>
                <div className={`text-lg font-bold ${progressRaw > 110 ? 'text-red-500' : progressRaw >= 90 ? 'text-brand-500' : 'text-slate-700'}`}>
                  {classificationLabel(total, target)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Resumen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-xs text-slate-400">Meta recomendada</span>
                    <span className="text-lg font-bold text-slate-800">{target ?? '--'}</span>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-xs text-slate-400">Total consunmido</span>
                    <span className="text-lg font-bold text-brand-600">{total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Distribution */}
      <motion.div variants={itemVars} className="glass-card">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-500" size={20} />
          Desglose de Comidas
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Apple className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-500 mb-4">No hay comidas registradas hoy.</p>
            <button onClick={() => navigate('/calories')} className="btn-secondary max-w-xs mx-auto">Empezar a Registrar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {items.map((it, idx) => {
              const pct = target ? Math.round((it.calories / target) * 100) : 0
              return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} key={it._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-brand-200 transition-colors">
                  <div className="flex justify-between items-end mb-3">
                    <div className="font-semibold text-slate-700">{it.name}</div>
                    <div className="text-sm font-bold bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 px-3 py-1 rounded-full transition-colors">
                      {it.calories} kcal <span className="text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${pct > 40 ? 'bg-accent-500' : 'bg-brand-500'}`} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Editar Perfil Biométrico</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Edad</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="ej: 28" type="number" value={localProfile?.age ?? ''} onChange={(e) => setLocalProfile(prev => ({ ...(prev || {}), age: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Peso (kg)</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="ej: 70" type="number" value={localProfile?.weightKg ?? localProfile?.weight_kg ?? ''} onChange={(e) => setLocalProfile(prev => ({ ...(prev || {}), weightKg: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Altura (cm)</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="ej: 175" type="number" value={localProfile?.heightCm ?? localProfile?.height_cm ?? ''} onChange={(e) => setLocalProfile(prev => ({ ...(prev || {}), heightCm: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sexo Asignado</label>
                <select value={localProfile?.sex ?? localProfile?.sex_assigned ?? ''} onChange={(e) => setLocalProfile(prev => ({ ...(prev || {}), sex: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                  <option value="">Selecciona sexo</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nivel de Actividad</label>
                <select value={localProfile?.activity ?? localProfile?.activity_level ?? ''} onChange={(e) => setLocalProfile(prev => ({ ...(prev || {}), activity: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                  <option value="">Selecciona nivel de actividad</option>
                  <option value="sedentary">Sedentario (poco o ningún ejercicio)</option>
                  <option value="light">Ligera (ejercicio ligero 1-3 días x sem)</option>
                  <option value="moderate">Moderada (ejercicio mod. 3-5 días x sem)</option>
                  <option value="active">Activa (ejercicio fuerte 6-7 días x sem)</option>
                  <option value="very">Muy activa (entrenador, doble turno)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary py-3">Guardar Perfil</button>
                <button type="button" onClick={() => setEditingProfile(false)} className="px-6 py-3 font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
