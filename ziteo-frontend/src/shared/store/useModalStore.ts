import { create } from 'zustand'

interface ModalState {
  chatWith: string | null
  hireTargetId: string | null
  viewingMaestroId: string | null

  openChat: (userId: string) => void
  closeChat: () => void
  openHire: (targetId: string) => void
  closeHire: () => void
  openMaestroProfile: (userId: string) => void
  closeMaestroProfile: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  chatWith: null,
  hireTargetId: null,
  viewingMaestroId: null,

  openChat: (userId) => set({ chatWith: userId }),
  closeChat: () => set({ chatWith: null }),
  openHire: (targetId) => set({ hireTargetId: targetId }),
  closeHire: () => set({ hireTargetId: null }),
  openMaestroProfile: (userId) => set({ viewingMaestroId: userId }),
  closeMaestroProfile: () => set({ viewingMaestroId: null }),
}))
