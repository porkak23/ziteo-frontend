interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
      {children}
    </span>
  )
}
