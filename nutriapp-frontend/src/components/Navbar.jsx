import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuthActions()
  const user = useQuery(api.users?.getMe) 
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Cierra el menú al cambiar de página
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  async function logout() {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { name: 'Dashboard', path: '/home' },
    { name: 'Registro', path: '/calories' },
    { name: 'Historial', path: '/history' },
    { name: 'Recetario', path: '/recipes' },
    { name: 'Suplementos', path: '/supplements' },
    { name: '🤖 IA', path: '/ai' },
  ]

  return (
    <header className="fixed w-full top-0 z-50 glass-nav font-sans">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30"
          >
            <Leaf size={20} />
          </motion.div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-emerald-500">
            NutriApp
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user !== null && navLinks.map((link) => {
            const isActive = location.pathname === link.path
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

        {/* Desktop User Actions */}
        <div className="hidden md:flex flex-1 md:flex-none justify-end items-center gap-4">
          {user === undefined ? (
             <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          ) : user === null ? (
            <>
              <Link to="/login" className="text-slate-600 font-medium hover:text-brand-600 text-sm">Entrar</Link>
              <Link to="/register" className="btn-primary py-2 px-4 shadow-sm text-sm">Crear cuenta</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100/80 rounded-full pl-2 pr-4 py-1.5 shadow-inner border border-slate-200/50">
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

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600 focus:outline-none p-2 bg-slate-100/50 rounded-xl"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl absolute w-full"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {user !== null && navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    className={`block font-medium py-2 px-3 rounded-xl transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {link.name}
                  </Link>
                )
              })}
              
              <div className="h-px bg-slate-100 my-2"></div>
              
              {user === null ? (
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="text-center text-slate-600 font-medium py-2 rounded-xl hover:bg-slate-50">Entrar</Link>
                  <Link to="/register" className="btn-primary text-center py-3">Crear cuenta</Link>
                </div>
              ) : user !== undefined ? (
                <div className="flex items-center justify-between py-2 px-2">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                        <UserIcon size={16} />
                     </div>
                     <span className="text-slate-700 font-medium">{user?.email?.split('@')[0]}</span>
                  </div>
                  <button onClick={logout} className="flex items-center gap-2 text-red-500 font-medium bg-red-50 py-2 px-4 rounded-xl">
                    <LogOut size={16} /> Salir
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
