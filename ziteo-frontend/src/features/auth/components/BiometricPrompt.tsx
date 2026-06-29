import { Z } from '../../../shared/design/tokens';
import { ZButton } from '../../../shared/design/components/ZButton';

interface BiometricPromptProps {
  type: 'fingerprint' | 'face' | 'generic';
  onEnable: () => void;
  onSkip: () => void;
  loading?: boolean;
}

function FingerprintIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect width="80" height="80" rx="22" fill={Z.orangeLight} />
      {/* Center dot */}
      <circle cx="40" cy="40" r="3.5" fill={Z.orangeDark} />
      {/* Inner arc */}
      <path
        d="M32 40c0-4.4 3.6-8 8-8s8 3.6 8 8c0 5.5-2.5 10.5-6 14"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Mid arc */}
      <path
        d="M26 35.5c-1 1.4-1.5 3-1.5 4.5 0 5 1.8 9.6 4.8 13.2"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M54 35.5c1 1.4 1.5 3 1.5 4.5 0 3.2-.7 6.3-2 9"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Outer arc */}
      <path
        d="M40 24c-8.8 0-16 7.2-16 16 0 6 1.8 11.6 5 16.2"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 24c8.8 0 16 7.2 16 16 0 2-.3 4-.8 5.8"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom sweep */}
      <path
        d="M40 48c-.8 2.5-1.2 5.2-1.2 8"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function FaceIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect width="80" height="80" rx="22" fill={Z.orangeLight} />
      {/* Face outline */}
      <rect x="20" y="20" width="40" height="40" rx="12" stroke={Z.orangeDark} strokeWidth="2.2" fill="none" />
      {/* Scan lines top */}
      <path d="M20 30h6M54 30h6" stroke={Z.orangeDark} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 50h6M54 50h6" stroke={Z.orangeDark} strokeWidth="2.2" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="33" cy="37" r="2.5" fill={Z.orangeDark} />
      <circle cx="47" cy="37" r="2.5" fill={Z.orangeDark} />
      {/* Smile */}
      <path d="M33 46c1.5 2.5 12.5 2.5 14 0" stroke={Z.orangeDark} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <path d="M40 38v3.5c0 1 1.5 2 0 2s-1.5-1 0-2" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function GenericBiometricIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect width="80" height="80" rx="22" fill={Z.orangeLight} />
      {/* Shield */}
      <path
        d="M40 16l18 7v13c0 10-8 17-18 20C22 53 22 36 22 36v-13l18-7z"
        fill="none"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Check */}
      <path
        d="M33 40l5 5 9-10"
        stroke={Z.orangeDark}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const TITLES: Record<BiometricPromptProps['type'], string> = {
  fingerprint: 'Entra más rápido con tu huella',
  face: 'Entra más rápido con Face ID',
  generic: 'Activa el acceso biométrico',
};

const SUBTITLES: Record<BiometricPromptProps['type'], string> = {
  fingerprint: 'Sin necesidad de ingresar tu PIN cada vez. Tu huella digital desbloquea Ziteoo de forma segura.',
  face: 'Sin necesidad de ingresar tu PIN cada vez. Face ID desbloquea Ziteoo de forma segura.',
  generic: 'Usa la biometría de tu dispositivo para acceder sin PIN. Seguro y conveniente.',
};

const BUTTON_LABELS: Record<BiometricPromptProps['type'], string> = {
  fingerprint: 'Activar huella digital',
  face: 'Activar Face ID',
  generic: 'Activar biometría',
};

export function BiometricPrompt({
  type,
  onEnable,
  onSkip,
  loading = false,
}: BiometricPromptProps) {
  const Icon = type === 'fingerprint'
    ? FingerprintIcon
    : type === 'face'
    ? FaceIcon
    : GenericBiometricIcon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: '8px 0',
        width: '100%',
      }}
    >
      <Icon />

      <div style={{ textAlign: 'center', maxWidth: 300 }}>
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 22,
            fontWeight: 700,
            color: Z.text,
            margin: 0,
            marginBottom: 10,
            lineHeight: 1.25,
          }}
        >
          {TITLES[type]}
        </p>
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 14,
            color: Z.textSec,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {SUBTITLES[type]}
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ZButton
          variant="primary"
          disabled={loading}
          onClick={onEnable}
        >
          {BUTTON_LABELS[type]}
        </ZButton>

        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          style={{
            fontFamily: Z.font,
            fontSize: 14,
            fontWeight: 600,
            color: Z.textSec,
            background: 'none',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            padding: '12px 0',
            textAlign: 'center',
            opacity: loading ? 0.5 : 1,
            letterSpacing: '0.2px',
          }}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
