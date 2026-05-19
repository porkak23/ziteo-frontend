import { Z } from '../tokens';

type ProjectStatus = 'Activo' | 'Planificación' | 'Completo';

interface ProjectCardProps {
  name: string;
  status: ProjectStatus;
  date: string;
  budget: string | number;
  pedidos: string | number;
  onTap?: () => void;
}

// Z.success (#16A34A) is in tokens; success badge bg (#DCFCE7) is a semantic tint derived from it,
// not a brand hex — acceptable as a one-off literal here.
const STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string }> = {
  Activo:       { bg: '#DCFCE7', text: Z.success },
  Planificación: { bg: Z.blueLight, text: Z.blueDark },
  Completo:     { bg: Z.divider, text: Z.textMuted },
};

export function ProjectCard({ name, status, date, budget, pedidos, onTap }: ProjectCardProps) {
  const sc = STATUS_STYLES[status] ?? STATUS_STYLES.Activo;

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px',
        borderRadius: Z.r.md,
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        outline: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 700,
            color: Z.text,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            background: sc.bg,
            color: sc.text,
          }}
        >
          {status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 10,
              color: Z.textMuted,
              fontWeight: 500,
            }}
          >
            Presupuesto
          </div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 700,
              color: Z.text,
              marginTop: 2,
            }}
          >
            Bs {budget}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 10,
              color: Z.textMuted,
              fontWeight: 500,
            }}
          >
            Pedidos
          </div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 700,
              color: Z.text,
              marginTop: 2,
            }}
          >
            {pedidos}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 10,
              color: Z.textMuted,
              fontWeight: 500,
            }}
          >
            Fecha
          </div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 700,
              color: Z.text,
              marginTop: 2,
            }}
          >
            {date}
          </div>
        </div>
      </div>
    </button>
  );
}
