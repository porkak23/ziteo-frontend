import { useEffect, useState } from 'react'
import { Preferences } from '@capacitor/preferences'
import { loginWithPinOrLegacy } from '@/features/auth/services/authService'
import { useAuthStore } from '@/features/auth/store/authStore'

// Key constants
const KEY_BIO_PHONE = 'ziteo_bio_phone'
const KEY_BIO_PIN = 'ziteo_bio_pin'
const KEY_BIO_ENABLED = 'ziteo_biometric_enabled'

export interface BiometricAuthHook {
  isAvailable: boolean
  biometricType: 'fingerprint' | 'face' | 'generic'
  isLoading: boolean
  loginWithBiometric: () => Promise<void>
  saveCredential: (phone: string, pin: string) => Promise<void>
  clearCredential: () => Promise<void>
}

export function useBiometricAuth(): BiometricAuthHook {
  const [isAvailable, setIsAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'generic'>('generic')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        // Dynamic import to avoid breaking web builds when native plugin is absent
        const { BiometricAuth, BiometryType } = await import('@aparajita/capacitor-biometric-auth')
        const result = await BiometricAuth.checkBiometry()
        const enabled = localStorage.getItem(KEY_BIO_ENABLED) === 'true'
        setIsAvailable(result.isAvailable && enabled)

        if (
          result.biometryType === BiometryType.faceAuthentication ||
          result.biometryType === BiometryType.faceId
        ) {
          setBiometricType('face')
        } else if (
          result.biometryType === BiometryType.fingerprintAuthentication ||
          result.biometryType === BiometryType.touchId
        ) {
          setBiometricType('fingerprint')
        } else {
          setBiometricType('generic')
        }
      } catch {
        // Plugin not available (web browser, emulator without biometry, etc.)
        setIsAvailable(false)
      }
    }

    void check()
  }, [])

  async function loginWithBiometric(): Promise<void> {
    setIsLoading(true)
    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
      await BiometricAuth.authenticate({
        reason: 'Confirma tu identidad para entrar a Ziteo',
        cancelTitle: 'Cancelar',
        iosFallbackTitle: 'Usar PIN',
        androidTitle: 'Ziteo',
        androidSubtitle: 'Confirma tu identidad',
      })

      const { value: phone } = await Preferences.get({ key: KEY_BIO_PHONE })
      const { value: pin } = await Preferences.get({ key: KEY_BIO_PIN })

      if (!phone || !pin) {
        throw new Error('No se encontraron credenciales guardadas. Ingresa con tu PIN.')
      }

      const user = await loginWithPinOrLegacy(phone, pin)
      useAuthStore.getState().setUser(user)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveCredential(phone: string, pin: string): Promise<void> {
    await Promise.all([
      Preferences.set({ key: KEY_BIO_PHONE, value: phone }),
      Preferences.set({ key: KEY_BIO_PIN, value: pin }),
    ])
    localStorage.setItem(KEY_BIO_ENABLED, 'true')
  }

  async function clearCredential(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: KEY_BIO_PHONE }),
      Preferences.remove({ key: KEY_BIO_PIN }),
    ])
    localStorage.removeItem(KEY_BIO_ENABLED)
  }

  return {
    isAvailable,
    biometricType,
    isLoading,
    loginWithBiometric,
    saveCredential,
    clearCredential,
  }
}
