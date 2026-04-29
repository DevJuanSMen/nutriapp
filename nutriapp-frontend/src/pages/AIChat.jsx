import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Bot, User, Loader2, Lightbulb, Trash2, ChefHat } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { chatWithNutriBot, generateRecipe, getDailyTip } from '../services/groqAI'
import { recommendedCalories } from '../utils/nutrition'

const SUGGESTIONS = [
  '¿Qué puedo cenar ligero?',
  'Receta alta en proteínas',
  'Snacks saludables',
  '¿Cuánta agua debo tomar?',
]

export default function AIChat() {
  const profile = useQuery(api.profile.get)
  const todayMeals = useQuery(api.meals.getToday) || []
  const waterLog = useQuery(api.waterLogs.getToday)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [genRecipe, setGenRecipe] = useState(false)
  const scrollRef = useRef(null)

  const total = todayMeals.reduce((s, i) => s + (i.calories || 0), 0)
  const target = profile ? recommendedCalories({ sex: profile.sex_assigned, weightKg: profile.weight_kg, heightCm: profile.height_cm, age: profile.age, activity: profile.activity_level }) : null

  const userContext = {
    perfil: profile ? { edad: profile.age, peso_kg: profile.weight_kg, altura_cm: profile.height_cm, sexo: profile.sex_assigned, actividad: profile.activity_level } : null,
    meta_calorica: target, consumido_hoy: total,
    comidas_hoy: todayMeals.map(m => ({ nombre: m.name, calorias: m.calories, proteina: m.protein, carbos: m.carbs, grasa: m.fat })),
    agua_hoy: waterLog?.glasses || 0,
  }

  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight) }, [messages])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    const userMsg = { role: 'user', content: msg }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs); setInput(''); setLoading(true)
    try {
      const res = await chatWithNutriBot(newMsgs.map(m => ({ role: m.role, content: m.content })), userContext)
      setMessages([...newMsgs, { role: 'assistant', content: res }])
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', content: '❌ Error al conectar con la IA. Verifica tu VITE_GROQ_API_KEY.' }])
    } finally { setLoading(false) }
  }

  async function handleGenRecipe() {
    setGenRecipe(true)
    try {
      const r = await generateRecipe(profile ? `Para persona de ${profile.age} años, ${profile.weight_kg}kg` : '')
      if (r) {
        const txt = `🍳 **${r.name}**\n⏱️ ${r.time || '30 min'} | ${r.difficulty || 'Media'}\n🔥 ${r.calories} kcal | P:${r.protein}g C:${r.carbs}g G:${r.fat}g\n\n**Ingredientes:**\n${(r.ingredients || []).map(i => `• ${i}`).join('\n')}\n\n**Preparación:**\n${r.instructions || ''}`
        setMessages(prev => [...prev, { role: 'assistant', content: txt }])
      }
    } catch {} finally { setGenRecipe(false) }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 flex items-center gap-3">
          <Sparkles className="text-brand-500" size={28} /> NutriBot IA
        </h1>
        <p className="text-slate-500 mt-1">Tu asistente nutricional inteligente powered by Groq.</p>
      </div>

      <div className="flex items-center gap-4 bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-100 rounded-2xl p-3 mb-4 text-sm flex-wrap">
        <span className="text-brand-700 font-medium">🎯 Meta: <b>{target || '--'}</b> kcal</span>
        <span className="text-slate-600">🍽️ Consumido: <b>{total}</b> kcal</span>
        <span className="text-slate-600">💧 Agua: <b>{waterLog?.glasses || 0}</b> vasos</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white mb-6 shadow-lg shadow-brand-500/30">
              <Bot size={36} />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">¡Hola! Soy NutriBot 🌿</h2>
            <p className="text-slate-400 mb-6 max-w-md">Pregúntame sobre alimentación, recetas o nutrición.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mb-6 text-left">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1"><Lightbulb size={16} /> Tip del día</div>
              <p className="text-sm text-amber-600">{getDailyTip()}</p>
            </div>
            <button onClick={handleGenRecipe} disabled={genRecipe} className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium rounded-xl transition-colors text-sm border border-brand-200 mb-4">
              {genRecipe ? <Loader2 className="animate-spin" size={16}/> : <ChefHat size={16}/>} Generar Receta
            </button>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="text-sm text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-full hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 transition-colors">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white shrink-0 mt-1"><Bot size={16}/></div>}
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-br-md' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1"><User size={16}/></div>}
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white shrink-0"><Bot size={16}/></div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="animate-spin" size={16}/> Pensando...</div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex gap-3 items-end">
          {messages.length > 0 && <button onClick={() => setMessages([])} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Limpiar"><Trash2 size={18}/></button>}
          <div className="flex-1 relative">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Pregúntale a NutriBot..." rows={1} className="w-full px-5 py-3.5 pr-14 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm resize-none text-sm" style={{ minHeight: 50, maxHeight: 120 }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="absolute right-2 bottom-2 p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors disabled:opacity-30">
              <Send size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
