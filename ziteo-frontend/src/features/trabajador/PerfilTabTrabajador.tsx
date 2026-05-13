import { Z } from '../../shared/design/tokens'
import { ZAvatar } from '../../shared/design/components'
import { SectionTitle, IconStar, IconVerified } from '../../shared/design/shell'
import { useAuthStore } from '../auth/store/authStore'
import { useMaestroProfile } from '../maestro/hooks/useMaestroProfile'
import { useHabilidades } from '../maestro/hooks/useHabilidades'
import { useProfileReviews } from '../../shared/hooks/useReviews'

const SAMPLE_TOOLS = ['Rotomartillo', 'Mezcladora', 'Andamios', 'Nivel láser', 'Andamio metálico']
const SAMPLE_CERTS = [
  { title: 'COSUDE Construcción', year: '2022' },
  { title: 'INFOCAL Técnico', year: '2019' },
]
const PORTFOLIO_ITEMS = [
  { label: 'Antes', bg: `linear-gradient(135deg, ${Z.divider}, #e2cfc3)` },
  { label: 'Después', bg: `linear-gradient(135deg, ${Z.orangeLight}, #f5e6da)` },
  { label: 'Proyecto', bg: `linear-gradient(135deg, ${Z.blueLight}, #d4e6ff)` },
]

export function PerfilTabTrabajador() {
  const user = useAuthStore((s) => s.user)
  const maestroId = user?.user_id ?? ''
  const { data: profile } = useMaestroProfile(maestroId)
  const { data: habilidades = [] } = useHabilidades(maestroId)
  const { data: reviewsData } = useProfileReviews(maestroId)

  const reviews = reviewsData?.reviews ?? []
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '4.8'
  const displayName = profile?.name ?? user?.name ?? 'Maestro'
  const skills = habilidades.length > 0 ? habilidades.map((h) => h.skill) : ['Albañilería', 'Obra gruesa', 'Acabados', 'Lectura de planos']

  return (
    <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
      <div
        style={{
          padding: '24px 20px 20px',
          background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        }}
      >
        <ZAvatar name={displayName} size={84} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
              {displayName}
            </h3>
            <IconVerified size={18} />
          </div>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            {profile?.specialty ?? 'Maestro Albañil'} · {profile?.years_experience ?? 12} años exp.
          </p>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, margin: '2px 0 0' }}>
            {user?.city ?? 'Santa Cruz'}, Bolivia
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            borderRadius: Z.r.full,
            background: Z.surface,
            border: `1px solid ${Z.border}`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 28, fontWeight: 800, color: Z.text }}>{avgRating}</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <IconStar
                  key={i}
                  color={i <= Math.round(parseFloat(avgRating)) ? '#F59E0B' : Z.border}
                  size={14}
                />
              ))}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>47</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>trabajos</div>
          </div>
          <div style={{ width: 1, height: 40, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>98%</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>éxito</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <SectionTitle title="Portafolio" />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {PORTFOLIO_ITEMS.map((p, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 90,
                  borderRadius: Z.r.sm,
                  background: p.bg,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  padding: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 8,
                    color: Z.textMuted,
                    background: 'rgba(255,255,255,0.6)',
                    padding: '2px 5px',
                    borderRadius: 4,
                  }}
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Habilidades" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {skills.map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: Z.font,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 20,
                  background: Z.orangeLight,
                  color: Z.orangeDark,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Herramientas Propias" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {SAMPLE_TOOLS.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: Z.font,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 20,
                  background: Z.blueLight,
                  color: Z.blueDark,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Certificaciones" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {SAMPLE_CERTS.map((c) => (
              <div
                key={c.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: Z.r.sm,
                  background: Z.surface,
                  border: `1px solid ${Z.border}`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: Z.orangeLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🎓
                </div>
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{c.title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{c.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title={`Reseñas (${reviews.length || 5})`} />
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {reviews.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: Z.r.sm,
                    background: Z.surface,
                    border: `1px solid ${Z.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
                      {r.reviewer_name ?? 'Cliente'}
                    </div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>
                      {r.comment ?? ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <IconStar key={s} color={s <= r.rating ? '#F59E0B' : Z.border} size={13} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[
                { client: 'Carlos Méndez', rating: 5, work: 'Albañilería casa familiar', date: 'Hace 2 semanas' },
                { client: 'Rosa Flores', rating: 5, work: 'Remodelación cocina', date: 'Hace 1 mes' },
                { client: 'Jorge Salinas', rating: 4, work: 'Construcción muro perimetral', date: 'Hace 2 meses' },
              ].map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: Z.r.sm,
                    background: Z.surface,
                    border: `1px solid ${Z.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{r.client}</div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{r.work}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <IconStar key={s} color={s <= r.rating ? '#F59E0B' : Z.border} size={13} />
                      ))}
                    </div>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>{r.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
