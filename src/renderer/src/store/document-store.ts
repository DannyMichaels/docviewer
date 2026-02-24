import { create } from 'zustand'
import type { PdfSignature } from '../components/PdfViewer'

export interface DocumentTab {
  id: string
  fileName: string
  filePath: string | null
  type: 'docx' | 'pdf' | 'new'
  html?: string
  pdfData?: string
  signatures?: PdfSignature[]
  dirty: boolean
}

interface DocumentState {
  tabs: DocumentTab[]
  activeTabId: string | null

  addTab: (tab: DocumentTab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<DocumentTab>) => void
  markDirty: (id: string) => void
  markClean: (id: string) => void
  getActiveTab: () => DocumentTab | undefined
}

let tabCounter = 0

export function generateTabId(): string {
  return `tab-${++tabCounter}-${Date.now()}`
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) => {
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
  },

  removeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let newActiveId = state.activeTabId
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id)
        newActiveId = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null
      }
      return { tabs: newTabs, activeTabId: newActiveId }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
  },

  markDirty: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, dirty: true } : t))
    }))
  },

  markClean: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, dirty: false } : t))
    }))
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  }
}))
