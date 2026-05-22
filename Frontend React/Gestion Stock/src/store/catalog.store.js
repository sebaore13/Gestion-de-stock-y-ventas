import { create } from 'zustand'
import { api } from '../services/api'

export const useCatalogStore = create((set, get) => ({
  categories: [],
  categoriesLoading: false,
  categoriesError: '',

  loadCategories: async () => {
    if (get().categoriesLoading) return
    set({ categoriesLoading: true, categoriesError: '' })
    try {
      const res = await api.get('/categories')
      set({ categories: res.categories || [], categoriesLoading: false })
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Error al cargar categorias'
      set({ categoriesLoading: false, categoriesError: msg })
    }
  },
}))
