interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h2 className="block font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
      {children}
    </h2>
  )
}
