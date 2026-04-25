import type { ReactNode } from 'react'
import AppHeader from './AppHeader'
import BottomNav from './BottomNav'

interface AppLayoutProps {
  title: string
  activeTab: string
  onTabChange: (tab: string) => void
  children: ReactNode
}

export default function AppLayout({ title, activeTab, onTabChange, children }: AppLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <AppHeader title={title} />
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pb-4">
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
