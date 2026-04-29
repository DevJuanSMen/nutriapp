import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Calories from './pages/Calories'
import History from './pages/History'
import Recipes from './pages/Recipes'
import Supplements from './pages/Supplements'
import AIChat from './pages/AIChat'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/calories" element={<ProtectedRoute><Calories /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/supplements" element={<ProtectedRoute><Supplements /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
