import { Z } from '../tokens';
import { NavIconMsg } from './NavIcons';

interface ChatFabProps {
  onClick?: () => void;
}

export function ChatFab({ onClick }: ChatFabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: 92,
        left: 18,
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: Z.gradMixed,
        boxShadow: '0 4px 16px rgba(232,115,58,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15,
      }}
    >
      <NavIconMsg color="#fff" size={22} />
    </button>
  );
}
