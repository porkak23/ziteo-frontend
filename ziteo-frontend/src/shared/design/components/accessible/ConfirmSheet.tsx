import { Z } from '../../tokens';
import { BigActionButton } from './BigActionButton';

type ConfirmSheetTone = 'default' | 'danger' | 'success';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  tone?: ConfirmSheetTone;
}

const toneToVariant: Record<ConfirmSheetTone, 'primary' | 'success' | 'danger'> = {
  default: 'primary',
  danger: 'danger',
  success: 'success',
};

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'No, volver',
  onConfirm,
  onCancel,
  isPending = false,
  tone = 'default',
}: ConfirmSheetProps) {
  if (!open) return null;

  const titleId = 'confirm-sheet-title';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={isPending ? undefined : onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: Z.surface,
          borderTopLeftRadius: Z.r.xl,
          borderTopRightRadius: Z.r.xl,
          padding: '24px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: Z.r.full,
            background: Z.border,
            alignSelf: 'center',
            marginBottom: 4,
          }}
        />
        <h2
          id={titleId}
          style={{
            fontFamily: Z.font,
            fontSize: 22,
            fontWeight: 800,
            color: Z.text,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 16,
            lineHeight: 1.5,
            color: Z.textSec,
            margin: 0,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <BigActionButton
            label={confirmLabel}
            variant={toneToVariant[tone]}
            onClick={onConfirm}
            loading={isPending}
            testId="confirm-sheet-confirm"
          />
          <BigActionButton
            label={cancelLabel}
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
            testId="confirm-sheet-cancel"
          />
        </div>
      </div>
    </div>
  );
}
