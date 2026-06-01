// Singleton that captures the `beforeinstallprompt` event as early as possible
// (registered from main.tsx before React mounts) so the install flow can fire
// the native dialog with a single tap regardless of which component asks for it.

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(e: BeforeInstallPromptEvent | null) => void>()

function notify() {
  listeners.forEach((l) => l(deferredPrompt))
}

export function initPWAInstallCapture(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function subscribeInstallPrompt(
  cb: (e: BeforeInstallPromptEvent | null) => void,
): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb) as unknown as void
}

export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  try {
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      deferredPrompt = null
      notify()
    }
    return choice.outcome
  } catch {
    return 'dismissed'
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isDesktopDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /macintosh|windows|linux/i.test(ua) && !/mobile|android/i.test(ua)
}

export type InAppBrowser =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'generic-webview'

// In-app browsers (WebViews inside other apps like WhatsApp, Instagram, etc.)
// CANNOT install PWAs — `beforeinstallprompt` never fires. We detect them so we
// can offer a "Open in Chrome / Safari" escape hatch instead of a dead button.
export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/WhatsApp/i.test(ua)) return 'whatsapp'
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN\/Messenger|Messenger/i.test(ua)) return 'messenger'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook'
  if (/BytedanceWebview|musical_ly|TikTok|Bytedance/i.test(ua)) return 'tiktok'
  if (/Twitter|TwitterAndroid/i.test(ua)) return 'twitter'
  if (/LinkedInApp/i.test(ua)) return 'linkedin'
  // Generic Android WebView signal: "; wv)" in UA. Excludes regular Chrome.
  if (/Android.*;\s*wv\)/i.test(ua)) return 'generic-webview'
  return null
}

// Builds an Android intent URL that opens the given URL in Chrome, bouncing
// the user out of the in-app WebView. If Chrome is not installed it falls back
// to the system default browser.
export function buildOpenInChromeIntent(url: string = window.location.href): string {
  const stripped = url.replace(/^https?:\/\//, '')
  const fallback = encodeURIComponent(url)
  return `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`
}
