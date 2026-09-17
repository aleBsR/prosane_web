import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppCard, MIcon, PageHeader } from '../components/ui';

// Espejo de usuario_screen.dart: tarjeta centrada con avatar, nombre, rol
// y fila de Configuración (ahí viven perfil + cambio de contraseña).
export default function Perfil() {
  const { usuario } = useAuth();
  const nav = useNavigate();

  const rol = usuario?.rolLabel || usuario?.rolName || '';

  return (
    <div>
      <PageHeader title="Perfil" backTo="/inicio" />
      <AppCard>
        <div className="profile-card">
          <span className="profile-avatar">
            <MIcon name="person" />
          </span>
          <div className="profile-name">{usuario?.nombre || 'Mi cuenta'}</div>
          <div className="profile-role">{rol}</div>
          <button className="profile-row" onClick={() => nav('/usuario/configuracion')}>
            <MIcon name="settings" />
            Configuración
            <MIcon name="chevron_right" size={20} />
          </button>
        </div>
      </AppCard>
    </div>
  );
}
