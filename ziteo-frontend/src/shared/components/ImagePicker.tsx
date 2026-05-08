import { useRef } from 'react'
import { useImageUpload } from '../hooks/useImageUpload'
import type { UseImageUploadOptions } from '../hooks/useImageUpload'

interface ImagePickerProps extends UseImageUploadOptions {
  value?: string
  onChange: (url: string) => void
  shape?: 'circle' | 'square'
  fallbackText?: string
}

export function ImagePicker({ value, onChange, bucket, folder, shape = 'square', fallbackText }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error } = useImageUpload({ bucket, folder })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const publicUrl = await upload(file)
      onChange(publicUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const isCircle = shape === 'circle'
  const containerClasses = isCircle
    ? 'w-20 h-20 rounded-full shadow-sm'
    : 'w-full h-32 rounded-2xl shadow-sm border border-outline-variant'

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div 
        className={`relative overflow-hidden bg-surface-container flex items-center justify-center cursor-pointer group ${containerClasses}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : isCircle && fallbackText ? (
          <span className="font-headline text-3xl text-on-surface-variant font-medium">
            {fallbackText}
          </span>
        ) : (
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
            photo_camera
          </span>
        )}

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${value || (isCircle && fallbackText) ? 'opacity-0 group-hover:opacity-100' : ''}`}>
          {uploading ? (
            <span className="material-symbols-outlined animate-spin text-white text-3xl">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">photo_camera</span>
          )}
        </div>
      </div>
      
      {error && <p className="text-error text-xs text-center">{error}</p>}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  )
}
