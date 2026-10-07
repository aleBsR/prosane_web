import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePendientes } from '../pendientes/usePendientes';
import { AppCard, EmptyState, MIcon, PageHeader } from '../components/ui';

// Espejo de pendientes_screen.dart: tarjetas con ícono violeta, título,
// subtítulo y › que navegan a la ruta del pendiente.
export default function Pendientes() {
  const { can } = useAuth();
  const nav = useNavigate();
  const { items, loading } = usePendientes(can);

  if (loading) return <AppCard>Cargando pendientes…</AppCard>;
  return (
    <div>
      <PageHeader title="Pendientes" backTo="/inicio" />
      {items.length === 0 ? (
        <EmptyState titulo="Todo sincronizado" />
      ) : (
        items.map((it, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <AppCard>
              <div className="school-card-click" onClick={() => nav(it.ruta)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: '#673ab7' }}>
                  <MIcon name={it.icono} size={34} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {it.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.subtitulo}
                  </div>
                </div>
                <MIcon name="chevron_right" />
              </div>
            </AppCard>
          </div>
        ))
      )}
    </div>
  );
}
