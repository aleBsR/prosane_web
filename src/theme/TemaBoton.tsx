import { useTema } from './TemaContext';
import { MIcon } from '../components/ui';

// Botón claro/oscuro reutilizable (espejo del topbar). Se usa en las rutas
// públicas (login, signup, forgot, reset) donde no hay Layout.
export default function TemaBoton({ style }: { style?: React.CSSProperties }) {
  const { oscuro, alternar } = useTema();
  return (
    <button
      className="theme-btn"
      style={{ position: 'fixed', top: 16, right: 16, ...style }}
      title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={alternar}
    >
      <MIcon name={oscuro ? 'light_mode' : 'dark_mode'} size={20} />
    </button>
  );
}
