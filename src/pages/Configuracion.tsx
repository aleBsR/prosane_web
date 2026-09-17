import { useNavigate } from 'react-router-dom';
import { AppCard, MIcon, PageHeader } from '../components/ui';

// Hub de configuración (espejo de la app): botones a datos personales y
// cambio de contraseña, más tarjeta Acerca de.
export default function Configuracion() {
  const nav = useNavigate();

  const opciones = [
    {
      icon: 'person',
      titulo: 'Datos personales',
      subtitulo: 'Actualizá tu nombre y apellido',
      to: '/usuario/configuracion/datos',
    },
    {
      icon: 'lock',
      titulo: 'Cambiar contraseña',
      subtitulo: 'Usá tu contraseña actual para confirmar el cambio',
      to: '/usuario/configuracion/password',
    },
  ];

  return (
    <div>
      <PageHeader title="Configuración" backTo="/usuario" />
      {opciones.map((o) => (
        <div key={o.to} style={{ marginBottom: 12 }}>
          <AppCard>
            <div
              className="school-card-click"
              onClick={() => nav(o.to)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 4 }}
            >
              <span style={{ background: 'rgba(124,92,252,.1)', borderRadius: 12, padding: 10, lineHeight: 1, color: 'var(--primario)' }}>
                <MIcon name={o.icon} size={28} />
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{o.titulo}</div>
                <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>{o.subtitulo}</div>
              </span>
              <MIcon name="chevron_right" />
            </div>
          </AppCard>
        </div>
      ))}
      <AppCard>
        <h3>Acerca de</h3>
        <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)' }}>PROSANE Salta — v1.0.0</div>
        <div style={{ fontSize: 12, marginTop: 2 }}>Si necesitás ayuda contactá a soporte.</div>
      </AppCard>
    </div>
  );
}
