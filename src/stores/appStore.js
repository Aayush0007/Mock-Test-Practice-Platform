/**
 * Global application state (UI preferences, notifications, etc.)
 */

import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // UI state
  sidebarOpen: false,
  theme: 'light',
  toasts: [],

  // Actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => set({ theme }),

  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          id: Date.now() + Math.random(),
          type: 'info',
          duration: 4000,
          ...toast,
        },
      ],
    })),

  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}))
