import { useState, useEffect, useRef } from 'react'
import { useGlobalSearch } from '../hooks/useGlobalSearch'

interface GlobalSearchBarProps {
  onClose: () => void
}

export default function GlobalSearchBar({ onClose }: GlobalSearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('ziteo_recent_searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {}
    }
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(inputValue), 300)
    return () => clearTimeout(handler)
  }, [inputValue])

  const { projects, profiles, products, isLoading, isEmpty } = useGlobalSearch(debouncedQuery)

  const handleSelect = (text: string) => {
    const newRecent = [text, ...recentSearches.filter((r) => r !== text)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('ziteo_recent_searches', JSON.stringify(newRecent))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface pt-4 px-4 flex flex-col h-dvh overflow-hidden">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex-1 flex items-center bg-surface-container rounded-2xl px-4 py-3 border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar proyectos, personas, productos..."
            className="bg-transparent border-none outline-none flex-1 font-body text-on-surface placeholder:text-on-surface-variant"
          />
          {inputValue && (
            <button onClick={() => setInputValue('')} className="ml-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          )}
        </div>
        <button onClick={onClose} className="font-label font-semibold text-primary">
          Cancelar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {debouncedQuery.trim().length < 2 ? (
          <div>
            <h3 className="font-label font-bold text-sm text-on-surface-variant mb-2 uppercase tracking-wide">
              Búsquedas Recientes
            </h3>
            {recentSearches.length > 0 ? (
              <div className="flex flex-col">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(search)
                      setDebouncedQuery(search)
                    }}
                    className="flex items-center gap-3 py-3 border-b border-outline-variant/50 active:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">history</span>
                    <span className="font-body text-on-surface flex-1 text-left">{search}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">No hay búsquedas recientes.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isLoading && <p className="font-body text-center text-on-surface-variant py-4">Buscando...</p>}
            
            {isEmpty && !isLoading && (
              <p className="font-body text-center text-on-surface-variant py-8">
                Sin resultados para "{debouncedQuery}"
              </p>
            )}

            {!isLoading && projects.length > 0 && (
              <div>
                <h3 className="font-label font-bold text-sm text-on-surface-variant mb-2 uppercase tracking-wide">
                  Proyectos
                </h3>
                <div className="flex flex-col border border-outline-variant rounded-2xl overflow-hidden">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.title)}
                      className="flex items-center gap-3 py-3 px-4 bg-surface active:bg-surface-container border-b border-outline-variant last:border-b-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                         {p.photo_url ? (
                           <img src={p.photo_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                         ) : (
                           <span className="material-symbols-outlined text-primary">construction</span>
                         )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-label font-semibold text-on-surface truncate">{p.title}</p>
                        <p className="font-body text-xs text-on-surface-variant truncate capitalize">Estado: {p.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && profiles.length > 0 && (
              <div>
                <h3 className="font-label font-bold text-sm text-on-surface-variant mb-2 uppercase tracking-wide">
                  Personas
                </h3>
                <div className="flex flex-col border border-outline-variant rounded-2xl overflow-hidden">
                  {profiles.map((p) => (
                    <button
                      key={p.user_id}
                      onClick={() => handleSelect(p.name)}
                      className="flex items-center gap-3 py-3 px-4 bg-surface active:bg-surface-container border-b border-outline-variant last:border-b-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                         {p.avatar_url ? (
                           <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                         ) : (
                           <span className="material-symbols-outlined text-primary">person</span>
                         )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-label font-semibold text-on-surface truncate">{p.name}</p>
                        <p className="font-body text-xs text-on-surface-variant truncate capitalize">{p.active_role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div>
                <h3 className="font-label font-bold text-sm text-on-surface-variant mb-2 uppercase tracking-wide">
                  Productos
                </h3>
                <div className="flex flex-col border border-outline-variant rounded-2xl overflow-hidden">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.name)}
                      className="flex items-center gap-3 py-3 px-4 bg-surface active:bg-surface-container border-b border-outline-variant last:border-b-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                         {p.image_url ? (
                           <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                         ) : (
                           <span className="material-symbols-outlined text-primary">shopping_bag</span>
                         )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-label font-semibold text-on-surface truncate">{p.name}</p>
                        <p className="font-body text-xs text-on-surface-variant truncate">${p.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
