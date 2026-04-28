import type { ReactNode } from 'react'
import AppHeader from './AppHeader'
import BottomNav from './BottomNav'

interface AppLayoutProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: ReactNode
}

export default function AppLayout({ activeTab, onTabChange, children }: AppLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pb-4">
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
