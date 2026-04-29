import React from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const GOAL = 8 // 8 glasses = 2L

export default function WaterTracker() {
  const waterLog = useQuery(api.waterLogs.getToday)
  const addGlass = useMutation(api.waterLogs.addGlass)
  const removeGlass = useMutation(api.waterLogs.removeGlass)

  const glasses = waterLog?.glasses || 0
  const pct = Math.min((glasses / GOAL) * 100, 100)

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="text-blue-500" size={20} />
        <h3 className="text-lg font-bold text-slate-800">Hidratación</h3>
      </div>

      {/* Water visual */}
      <div className="relative w-24 h-32 rounded-2xl border-2 border-blue-200 bg-blue-50/30 overflow-hidden mb-3">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-300 rounded-b-xl"
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-700 drop-shadow-sm">{glasses}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        {glasses >= GOAL ? '✅ ¡Meta alcanzada!' : `${GOAL - glasses} vasos para la meta`}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => removeGlass()}
          disabled={glasses <= 0}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => addGlass()}
          className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
