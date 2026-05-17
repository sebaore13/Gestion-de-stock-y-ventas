import { create } from 'zustand'
import { api } from './api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: true,

  login: async (email) => {
    const res = await api.post('/auth/login', { email })
    localStorage.setItem('token', res.token)
    set({ user: res.user, token: res.token, isAuthenticated: true, loading: false })
    return res
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false, loading: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ loading: false, isAuthenticated: false })
      return
    }
    try {
      const res = await api.get('/me')
      set({ user: res.user, token, isAuthenticated: true, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, loading: false })
    }
  },
}))
