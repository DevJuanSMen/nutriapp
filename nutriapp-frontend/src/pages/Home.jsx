import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, Target, TrendingUp, Settings, Plus, Beef, Wheat, Droplets, Sparkles, Calendar, Pill } from 'lucide-react'
import { bmi, recommendedCalories, classificationByTarget } from '../utils/nutrition'
import { getDailyTip } from '../services/groqAI'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts'
import WaterTracker from '../components/WaterTracker'

function bmiCategory(imc) {
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

function ProgressRing({ radius, stroke, progress, target, total }) {
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference
  let color = '#22c55e'
  if (progress > 120) color = '#ef4444'
  else if (progress > 100) color = '#f97316'

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
  )
}

export default function Home() {
  const navigate = useNavigate()
  const profile = useQuery(api.profile.get)
  const items = useQuery(api.meals.getToday) || []
  const weekData = useQuery(api.dailyLogs.getWeekSummary) || []
  const stats = useQuery(api.dailyLogs.getStats)
  const saveProfileMutation = useMutation(api.profile.update)

  const [editingProfile, setEditingProfile] = useState(false)
  const [localProfile, setLocalProfile] = useState(null)

  useEffect(() => { if (profile) setLocalProfile(profile) }, [profile])

  const total = items.reduce((s, i) => s + Number(i.calories || 0), 0)
  const totalProtein = items.reduce((s, i) => s + Number(i.protein || 0), 0)
  const totalCarbs = items.reduce((s, i) => s + Number(i.carbs || 0), 0)
  const totalFat = items.reduce((s, i) => s + Number(i.fat || 0), 0)

  const weightKg = profile?.weight_kg ?? profile?.weightKg ?? null
  const heightCm = profile?.height_cm ?? profile?.heightCm ?? null
  const imc = profile ? bmi(weightKg, heightCm) : null
  const target = profile ? recommendedCalories({ sex: profile.sex_assigned, weightKg, heightCm, age: profile.age, activity: profile.activity_level }) : null
  const progressRaw = target ? (total / target) * 100 : 0
  const displayProgress = Math.min(Math.max(progressRaw, 0), 200)

  // Macro targets (rough estimates)
  const proteinTarget = weightKg ? Math.round(weightKg * 1.6) : null
  const macroData = (totalProtein || totalCarbs || totalFat) ? [
    { name: 'Proteína', value: totalProtein, color: '#ef4444' },
    { name: 'Carbos', value: totalCarbs, color: '#f59e0b' },
    { name: 'Grasa', value: totalFat, color: '#8b5cf6' },
  ].filter(d => d.value > 0) : []

  const chartData = weekData.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short' }),
  }))

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
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
    } catch (err) { console.error(err); alert('Error al guardar') }
  }

  if (profile === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">Resumen Diario</h1>
          <p className="text-slate-500 mt-1">Sigue tu progreso y alcanza tus metas nutricionales.</p>
        </div>
        <button onClick={() => navigate('/calories')} className="btn-primary">
          <Plus size={18} /> Registrar Comida
        </button>
      </div>

      {/* Stats Row */}
      <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-2xl font-bold text-brand-600">{stats?.streak || 0} 🔥</div>
          <div className="text-xs text-slate-400 font-medium">Racha</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-2xl font-bold text-slate-800">{items.length}</div>
          <div className="text-xs text-slate-400 font-medium">Comidas hoy</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0 cursor-pointer" onClick={() => navigate('/supplements')}>
          <div className="text-2xl font-bold text-purple-600"><Pill size={20} className="inline" /></div>
          <div className="text-xs text-slate-400 font-medium">Suplementos</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0 cursor-pointer" onClick={() => navigate('/ai')}>
          <div className="text-2xl font-bold text-brand-500"><Sparkles size={20} className="inline" /></div>
          <div className="text-xs text-slate-400 font-medium">NutriBot IA</div>
        </div>
      </motion.div>

      {/* Tip del día */}
      <motion.div variants={itemVars} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-lg">💡</span>
        <p className="text-sm text-amber-700">{getDailyTip()}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVars} className="glass-card md:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-brand-500" size={20} /> Tu Perfil
              </h2>
              <button onClick={() => { if (!localProfile) setLocalProfile({}); setEditingProfile(true) }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <Settings size={18} />
              </button>
            </div>
            {profile ? (
              <div className="space-y-3">
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
                  <span className="text-sm font-medium text-slate-500">Actividad</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{profile?.activity_level ?? '--'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="mx-auto text-brand-300 mb-3" size={32} />
                <p className="text-sm text-slate-500 mb-4">Configura tu perfil para obtener recomendaciones.</p>
                <button className="btn-secondary w-full text-sm py-2" onClick={() => { setLocalProfile({}); setEditingProfile(true) }}>Configurar</button>
              </div>
            )}
          </div>
          {/* Water tracker inline */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <WaterTracker />
          </div>
        </motion.div>

        {/* Progress + Macros */}
        <motion.div variants={itemVars} className="glass-card md:col-span-8 bg-gradient-to-br from-white/90 to-brand-50/30">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Flame className="text-accent-500" size={20} /> Consumo Calórico
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
            <ProgressRing radius={90} stroke={14} progress={displayProgress} total={total} target={target} />

            <div className="space-y-4 w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="block text-xs text-slate-400">Meta</span>
                  <span className="text-lg font-bold text-slate-800">{target ?? '--'}</span>
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="block text-xs text-slate-400">Restante</span>
                  <span className={`text-lg font-bold ${target && total > target ? 'text-red-500' : 'text-brand-600'}`}>{target ? target - total : '--'}</span>
                </div>
              </div>

              {/* Macro bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-500 font-medium flex items-center gap-1"><Beef size={12}/> Proteína</span>
                    <span className="text-slate-500">{totalProtein}g {proteinTarget ? `/ ${proteinTarget}g` : ''}</span>
                  </div>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${proteinTarget ? Math.min((totalProtein/proteinTarget)*100, 100) : 0}%` }} className="h-full bg-red-400 rounded-full" transition={{ duration: 1 }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-500 font-medium flex items-center gap-1"><Wheat size={12}/> Carbos</span>
                    <span className="text-slate-500">{totalCarbs}g</span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${target ? Math.min((totalCarbs*4/target)*100*2, 100) : 0}%` }} className="h-full bg-amber-400 rounded-full" transition={{ duration: 1 }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-violet-500 font-medium flex items-center gap-1"><Droplets size={12}/> Grasa</span>
                    <span className="text-slate-500">{totalFat}g</span>
                  </div>
                  <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${target ? Math.min((totalFat*9/target)*100*3, 100) : 0}%` }} className="h-full bg-violet-400 rounded-full" transition={{ duration: 1 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly chart + Macro pie */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <motion.div variants={itemVars} className="glass-card md:col-span-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-500" size={20} /> Tendencia Semanal
          </h2>
          {chartData.length > 0 && chartData.some(d => d.totalCalories > 0) ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="calGradHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="totalCalories" stroke="#22c55e" fill="url(#calGradHome)" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Calendar className="mx-auto mb-2 text-slate-200" size={32} />
              Archiva días para ver tu tendencia aquí.
            </div>
          )}
        </motion.div>

        {/* Macro Pie Chart */}
        <motion.div variants={itemVars} className="glass-card md:col-span-4 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Macros Hoy</h2>
          {macroData.length > 0 ? (
            <>
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#fff">
                      {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v, n) => [`${v}g`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                {macroData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-500">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center">Registra comidas con macros para ver la distribución.</p>
          )}
        </motion.div>
      </div>

      {/* Meal Breakdown */}
      <motion.div variants={itemVars} className="glass-card">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-500" size={20} /> Desglose de Comidas
        </h2>
        {items.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 mb-4">No hay comidas registradas hoy.</p>
            <button onClick={() => navigate('/calories')} className="btn-secondary max-w-xs mx-auto">Empezar a Registrar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {items.map((it, idx) => {
              const pct = target ? Math.round((it.calories / target) * 100) : 0
              return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={it._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-brand-200 transition-colors">
                  <div className="flex justify-between items-end mb-2">
                    <div className="font-semibold text-slate-700">{it.name}</div>
                    <div className="text-sm font-bold bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 px-3 py-1 rounded-full transition-colors">
                      {it.calories} kcal <span className="text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${pct > 40 ? 'bg-accent-500' : 'bg-brand-500'}`} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Editar Perfil Biométrico</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Edad</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="28" type="number" value={localProfile?.age ?? ''} onChange={e => setLocalProfile(p => ({ ...(p||{}), age: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Peso (kg)</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="70" type="number" value={localProfile?.weightKg ?? localProfile?.weight_kg ?? ''} onChange={e => setLocalProfile(p => ({ ...(p||{}), weightKg: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Altura (cm)</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="175" type="number" value={localProfile?.heightCm ?? localProfile?.height_cm ?? ''} onChange={e => setLocalProfile(p => ({ ...(p||{}), heightCm: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sexo Asignado</label>
                <select value={localProfile?.sex ?? localProfile?.sex_assigned ?? ''} onChange={e => setLocalProfile(p => ({ ...(p||{}), sex: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="">Selecciona</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nivel de Actividad</label>
                <select value={localProfile?.activity ?? localProfile?.activity_level ?? ''} onChange={e => setLocalProfile(p => ({ ...(p||{}), activity: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="">Selecciona</option>
                  <option value="sedentary">Sedentario</option>
                  <option value="light">Ligera</option>
                  <option value="moderate">Moderada</option>
                  <option value="active">Activa</option>
                  <option value="very">Muy activa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary py-3">Guardar</button>
                <button type="button" onClick={() => setEditingProfile(false)} className="px-6 py-3 font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
