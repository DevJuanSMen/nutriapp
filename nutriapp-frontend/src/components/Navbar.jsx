import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, LogOut, User as UserIcon } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuthActions()
  // Try fetching the authenticated user from Convex DB
  const user = useQuery(api.users?.getMe) 

  async function logout() {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { name: 'Dashboard', path: '/home' },
    { name: 'Registro Diario', path: '/calories' },
    { name: 'Recetario', path: '/recipes' },
  ]

  return (
    <header className="glass-nav font-sans">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30"
          >
            <Leaf size={24} />
          </motion.div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-emerald-500">
            NutriApp
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path)
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={`relative font-medium text-sm transition-colors ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-500'}`}
              >
                {link.name}
                {isActive && (
                  <motion.div 
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand-500 rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user === undefined ? (
            // Cargando...
             <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          ) : user === null ? (
            <>
              <Link to="/login" className="text-slate-600 font-medium hover:text-brand-600 text-sm">Entrar</Link>
              <Link to="/register" className="btn-primary py-2 px-4 shadow-sm text-sm">Crear cuenta</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full pl-2 pr-4 py-1.5 shadow-inner">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center overflow-hidden">
                  <UserIcon size={14} />
                </div>
                <span className="text-slate-700 text-sm font-medium">{user?.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={logout} 
                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
