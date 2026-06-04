interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  )
}
