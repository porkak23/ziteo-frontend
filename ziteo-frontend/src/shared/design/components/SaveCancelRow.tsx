interface SaveCancelRowProps {
  onSave: () => void
  onCancel: () => void
  saving: boolean
  saveLabel?: string
}

export function SaveCancelRow({ onSave, onCancel, saving, saveLabel = 'Guardar' }: SaveCancelRowProps) {
  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl py-2.5 text-sm font-label border border-outline-variant text-on-surface-variant active:opacity-70"
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 text-sm font-label font-semibold disabled:opacity-50 active:opacity-70"
      >
        {saving ? 'Guardando...' : saveLabel}
      </button>
    </div>
  )
}
