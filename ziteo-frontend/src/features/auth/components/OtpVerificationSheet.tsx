import { useState, useEffect } from 'react';
import { Z } from '../../../shared/design/tokens';
import { OtpInput } from './OtpInput';
import { PinPad } from './PinPad';
import { ZButton } from '../../../shared/design/components/ZButton';
import { RECAPTCHA_CONTAINER_ID } from '../otp/constants';

export type VerificationStep = 'sending' | 'code' | 'pin-create' | 'pin-confirm' | 'biometric';

interface OtpVerificationSheetProps {
  phone: string;
  step: VerificationStep;
  onVerified: (code: string) => void;
  onPinCreated: (pin: string) => void;
  onBiometricChoice: (enabled: boolean) => void;
  onChangePhone: () => void;
  loading?: boolean;
  error?: string | null;
  onResend?: () => void;
  resendCooldown?: number;
  /** Dev-only: OTP code returned when WhatsApp is not configured. Auto-fills the input. */
  debugOtp?: string;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('591') && digits.length >= 11) {
    const local = digits.slice(3);
    return `+591 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4, 8)}`;
  }
  if (digits.length === 8) {
    return `+591 ${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4)}`;
  }
  return raw;
}

// SVG Icons
function IconMessage() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill={Z.orangeLight} />
      <path
        d="M8 13a3 3 0 013-3h18a3 3 0 013 3v10a3 3 0 01-3 3H22l-4 4-4-4H11a3 3 0 01-3-3V13z"
        fill="none"
        stroke={Z.orangeDark}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 17h12M14 21h7" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill={Z.orangeLight} />
      <path
        d="M20 8l10 4v7c0 5.5-4.5 9.5-10 11C10 28.5 10 19 10 19v-7l10-4z"
        fill="none"
        stroke={Z.orangeDark}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 20l3 3 5-6" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFingerprint() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={Z.orangeLight} />
      <path
        d="M18 24c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4-2 7-4 9"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <path
        d="M15 20.5c-.6 1.1-1 2.3-1 3.5 0 3.5 1.2 6.7 3 9"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <path
        d="M33 20.5c.6 1.1 1 2.3 1 3.5 0 2-.4 3.9-1.1 5.5"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <path
        d="M24 30c-.5 1.5-.8 3.2-.8 5"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <circle cx="24" cy="24" r="2" fill={Z.orangeDark} />
      <path
        d="M20.5 14.5A9.4 9.4 0 0124 14c5.5 0 10 4.5 10 10 0 1-.1 2-.4 2.9"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <path
        d="M14 24c0-5.5 4.5-10 10-10"
        stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <>
      <style>{`
        @keyframes z-spin {
          to { transform: rotate(360deg); }
        }
        .z-spinner { animation: z-spin 0.75s linear infinite; }
      `}</style>
      <svg
        className="z-spinner"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="14" stroke={Z.border} strokeWidth="3" />
        <path
          d="M18 4a14 14 0 0114 14"
          stroke={Z.orangeDark}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

const SUPPORT_WHATSAPP = 'https://wa.me/59175000000' // placeholder — update with real support number

export function OtpVerificationSheet({
  phone,
  step,
  onVerified,
  onPinCreated,
  onBiometricChoice,
  onChangePhone,
  loading = false,
  error = null,
  onResend,
  resendCooldown = 0,
  debugOtp,
}: OtpVerificationSheetProps) {
  const [otpValue, setOtpValue] = useState('');
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMismatch, setPinMismatch] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prevStep, setPrevStep] = useState(step);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Auto-fill OTP input in dev when backend returns debug_otp
  useEffect(() => {
    if (debugOtp && step === 'code') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOtpValue(debugOtp);
    }
  }, [debugOtp, step]);

  // React-recommended pattern: reset derived state during render when prop changes
  if (prevStep !== step) {
    setPrevStep(step);
    if (step === 'code') setOtpValue(debugOtp ?? '');
    if (step === 'pin-create') { setPinDraft(''); setPinConfirm(''); setPinMismatch(false); }
    if (step === 'pin-confirm') { setPinConfirm(''); setPinMismatch(false); }
  }

  function handleOtpContinue() {
    if (otpValue.length === 6 && !loading) {
      onVerified(otpValue);
    }
  }

  function handlePinCreateContinue() {
    if (pinDraft.length === 6 && !loading) {
      // Parent moves step to 'pin-confirm'; we just signal readiness
      // In practice, the parent controls the step prop.
      // We call onPinCreated when BOTH drafts are provided and confirmed.
      // Here we just advance — parent must listen and update step.
      onPinCreated(pinDraft);
    }
  }

  function handlePinConfirmContinue() {
    if (pinConfirm.length === 6 && !loading) {
      if (pinConfirm !== pinDraft) {
        setPinMismatch(true);
        setPinConfirm('');
        return;
      }
      setPinMismatch(false);
      onPinCreated(pinConfirm);
    }
  }

  const stepContent = (): React.ReactNode => {
    switch (step) {
      case 'sending':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0 24px' }}>
            <SpinnerIcon />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.text, margin: 0, marginBottom: 6 }}>
                Enviando código
              </p>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
                Enviando por WhatsApp a{' '}
                <span style={{ fontWeight: 600, color: Z.text }}>{formatPhone(phone)}</span>
              </p>
            </div>
          </div>
        );

      case 'code':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <IconMessage />
              <div>
                <p style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.text, margin: 0 }}>
                  Ingresa el código
                </p>
                <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, marginTop: 2 }}>
                  Enviado a {formatPhone(phone)}
                </p>
              </div>
            </div>

            <OtpInput
              value={otpValue}
              onChange={setOtpValue}
              disabled={loading}
              autoFocus
              error={!!error}
            />

            {error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <p style={{ fontFamily: Z.font, fontSize: 13, color: 'var(--z-error)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                  {error}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={SUPPORT_WHATSAPP}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.orangeDark, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Contactar soporte
                  </a>
                  <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted }}>·</span>
                  <button
                    type="button"
                    onClick={onChangePhone}
                    style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            {debugOtp && (
              <p style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, margin: 0, textAlign: 'center' }}>
                [DEV] Código de prueba: <strong>{debugOtp}</strong>
              </p>
            )}

            <ZButton
              variant="primary"
              disabled={otpValue.length < 6 || loading}
              onClick={handleOtpContinue}
            >
              Verificar
            </ZButton>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  fontFamily: Z.font,
                  fontSize: 13,
                  color: resendCooldown > 0 ? Z.textMuted : Z.orangeDark,
                  background: 'none',
                  border: 'none',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  padding: 0,
                  textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
              </button>
              <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>·</span>
              <button
                type="button"
                onClick={onChangePhone}
                style={{
                  fontFamily: Z.font,
                  fontSize: 13,
                  color: Z.textSec,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Cambiar número
              </button>
            </div>
          </div>
        );

      case 'pin-create':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <IconShield />
              <div>
                <p style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.text, margin: 0 }}>
                  Crea tu PIN
                </p>
                <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, marginTop: 2 }}>
                  Protege tu cuenta con 6 dígitos
                </p>
              </div>
            </div>

            <PinPad
              value={pinDraft}
              onChange={setPinDraft}
              disabled={loading}
              label="Crea tu PIN de seguridad"
              sublabel="6 dígitos que recordarás fácilmente"
            />

            {error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <p style={{ fontFamily: Z.font, fontSize: 13, color: 'var(--z-error)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                  {error}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={SUPPORT_WHATSAPP}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.orangeDark, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Contactar soporte
                  </a>
                  <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted }}>·</span>
                  <button
                    type="button"
                    onClick={onChangePhone}
                    style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            <ZButton
              variant="primary"
              disabled={pinDraft.length < 6 || loading}
              onClick={handlePinCreateContinue}
            >
              Continuar
            </ZButton>
          </div>
        );

      case 'pin-confirm':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <IconShield />
              <div>
                <p style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.text, margin: 0 }}>
                  Confirma tu PIN
                </p>
                <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, marginTop: 2 }}>
                  Ingresa el mismo PIN para confirmar
                </p>
              </div>
            </div>

            <PinPad
              value={pinConfirm}
              onChange={(val) => { setPinConfirm(val); if (pinMismatch) setPinMismatch(false); }}
              disabled={loading}
              label="Confirma tu PIN"
              sublabel="Ingresa el mismo PIN"
              error={pinMismatch ? 'Los PINs no coinciden. Intenta de nuevo.' : (error ?? null)}
            />

            <ZButton
              variant="primary"
              disabled={pinConfirm.length < 6 || loading}
              onClick={handlePinConfirmContinue}
            >
              Confirmar PIN
            </ZButton>
          </div>
        );

      case 'biometric':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <IconFingerprint />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, margin: 0, marginBottom: 8 }}>
                Activa tu huella digital
              </p>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.6 }}>
                Entra a Ziteoo sin escribir tu PIN cada vez. Seguro y rápido.
              </p>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ZButton
                variant="primary"
                disabled={loading}
                onClick={() => onBiometricChoice(true)}
              >
                Activar acceso biométrico
              </ZButton>
              <ZButton
                variant="ghost"
                onClick={() => onBiometricChoice(false)}
              >
                Ahora no
              </ZButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes z-sheet-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes z-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          opacity: visible ? 1 : 0,
          animation: visible ? 'z-overlay-in 0.3s ease-out forwards' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: Z.bg,
          borderRadius: '24px 24px 0 0',
          padding: '12px 24px 40px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          animation: visible ? 'z-sheet-in 0.3s ease-out forwards' : 'none',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: Z.r.full,
              background: Z.border,
            }}
          />
        </div>

        {stepContent()}

        {/* Ancla del reCAPTCHA invisible de Firebase — solo se usa cuando
            VITE_OTP_PROVIDER=firebase; inocuo para el proveedor whatsapp. */}
        <div id={RECAPTCHA_CONTAINER_ID} style={{ display: 'none' }} />
      </div>
    </>
  );
}
