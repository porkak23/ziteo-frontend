import { create } from 'zustand'

interface NavStore {
  activeTab: string
  setTab: (tab: string) => void
}

export const useNavStore = create<NavStore>((set) => ({
  activeTab: 'home',
  setTab: (tab) => set({ activeTab: tab }),
}))
