import { Z } from '../tokens';

interface ZStepBarProps {
  current: number;
  total?: number;
}

export function ZStepBar({ current, total = 3 }: ZStepBarProps) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i < current ? Z.orange : i === current ? Z.orangePastel : Z.divider,
            transition: 'background 0.3s',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {i === current && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '50%',
                background: Z.orange,
                borderRadius: 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
