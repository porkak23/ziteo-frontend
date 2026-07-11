export const Z = {
  // Accent colours — respond to dark mode via CSS vars
  orange:       'var(--z-orange)',
  orangeDark:   'var(--z-orange-dark)',
  orangeLight:  'var(--z-orange-light)',
  orangePastel: 'var(--z-orange-pastel)',
  blue:         'var(--z-blue)',
  blueDark:     'var(--z-blue-dark)',
  blueLight:    'var(--z-blue-light)',
  bluePastel:   'var(--z-blue-pastel)',

  // Always-dark UI (driver/splash — never theme-switched)
  navy:    '#0D1020',
  navyMid: '#1A1F35',

  // Surfaces & text — respond to dark mode
  bg:       'var(--z-bg)',
  surface:  'var(--z-surface)',
  text:     'var(--z-text)',
  textSec:  'var(--z-text-sec)',
  textMuted:'var(--z-text-muted)',
  error:    'var(--z-error)',
  errorBg:  'var(--z-error-bg)',
  success:  'var(--z-success)',
  successBg:'var(--z-success-bg)',
  successDark:'var(--z-success-dark)',
  border:   'var(--z-border)',
  divider:  'var(--z-divider)',

  // On-color text — responds to dark mode (primary/secondary button backgrounds change)
  onPrimary:   'var(--color-on-primary)',
  onSecondary: 'var(--color-on-secondary)',

  // Static
  font: "'Manrope', sans-serif",
  r: { sm: 10, md: 14, lg: 20, xl: 28, full: 9999 },

  // Gradients
  gradOrange: 'linear-gradient(135deg, var(--z-orange) 0%, var(--z-orange-dark) 100%)',
  gradBlue:   'linear-gradient(135deg, #5B9BD5 0%, #2E6EB5 100%)',
  gradMixed:  'linear-gradient(135deg, var(--z-orange) 0%, var(--z-blue) 100%)',
} as const;

export type ZColor = typeof Z.orange;
