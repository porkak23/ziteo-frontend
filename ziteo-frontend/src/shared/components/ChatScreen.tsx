import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useChat } from '../hooks/useChat'

interface ChatScreenProps {
  otherUserId: string
  otherUserName: string
  onClose: () => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const SKELETON_WIDTHS = [160, 200, 140, 180, 220] as const

function BubbleSkeleton({ align, index = 0 }: { align: 'left' | 'right'; index?: number }) {
  const width = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]
  return (
    <div
      className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}
    >
      <div className="flex flex-col gap-1" style={{ maxWidth: '70%' }}>
        <div
          className={`h-10 rounded-2xl animate-pulse bg-surface-container ${
            align === 'right' ? 'rounded-tr-sm' : 'rounded-tl-sm'
          }`}
          style={{ width: `${width}px` }}
        />
        <div
          className={`h-3 w-8 rounded animate-pulse bg-surface-container ${
            align === 'right' ? 'self-end' : 'self-start'
          }`}
        />
      </div>
    </div>
  )
}

export function ChatScreen({ otherUserId, otherUserName, onClose }: ChatScreenProps) {
  const user = useAuthStore((s) => s.user)
  const currentUserId = user?.user_id ?? ''

  const { messages, isLoading, sendMessage } = useChat(currentUserId, otherUserId)

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    setInput('')
    setIsSending(true)
    await sendMessage(trimmed)
    setIsSending(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Header */}
      <div className="h-14 flex-shrink-0 flex items-center gap-3 px-4 border-b border-outline-variant">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <h2 className="font-label font-semibold text-on-surface text-sm truncate flex-1">
          {otherUserName}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {isLoading && (
          <>
            <BubbleSkeleton align="left" index={0} />
            <BubbleSkeleton align="right" index={1} />
            <BubbleSkeleton align="left" index={2} />
          </>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl">chat_bubble</span>
            <span className="font-body text-sm">Comienza una conversación</span>
          </div>
        )}

        {!isLoading &&
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
                  style={{ maxWidth: '75%' }}
                >
                  <div
                    className={`px-4 py-2.5 font-body text-sm leading-snug break-words ${
                      isOwn
                        ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm'
                        : 'bg-surface-container text-on-surface rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs font-body text-on-surface-variant px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          })}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-full border border-outline-variant px-4 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
          aria-label="Enviar"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  )
}
