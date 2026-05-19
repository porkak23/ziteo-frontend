import React from 'react'
import * as Sentry from '@sentry/react'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
          <span
            className="material-symbols-outlined text-[64px] text-error"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            error_outline
          </span>
          <div className="space-y-2">
            <h1 className="font-headline font-bold text-2xl text-on-surface">
              Algo salió mal
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Ocurrió un error inesperado. Por favor recarga la aplicación.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-on-primary rounded-2xl px-6 py-3 font-medium active:opacity-80 transition-opacity"
          >
            Recargar app
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
