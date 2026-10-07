import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, MIcon, PageHeader, useToast } from '../components/ui';

interface Op {
  id: string;
  nombre?: string;
  escuela?: { nombre?: string };
  escuela_nombre?: string;
  fecha?: string;
  lugar_realizacion?: string;
  estado: string;
  cantidad_profesionales?: number;
  cantidad_alumnos?: number;
}

export const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  confirmado: 'Confirmado',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

// Lista espejo de operativos_list_screen.dart: solo lectura, sin botón crear.
// Crear operativo es acción de superadmin/administrativo desde inicio
// (crearOperativo → /operativos/nuevo); el backend lo exige igual.
export default function Operativos() {
  const nav = useNavigate();
  const toast = useToast();
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await v1Api.get('/operativos/');
        setOps(Array.isArray(data) ? data : data.results ?? []);
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudieron cargar los operativos'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <AppCard>Cargando operativos…</AppCard>;
  return (
    <div>
      <PageHeader title="Operativos" backTo="/inicio" />
      {ops.length === 0 ? (
        <EmptyState titulo="No tenés operativos" subtitulo="Creá uno para comenzar" />
      ) : (
        ops.map((o) => (
          <div key={o.id} style={{ marginBottom: 12 }}>
            <AppCard>
              <div className="school-card-click" onClick={() => nav(`/operativos/${o.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.nombre || o.escuela?.nombre || 'Operativo'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4 }}>
                      {o.fecha} • {o.lugar_realizacion}
                    </div>
                  </div>
                  <span className={`estado-badge estado-${o.estado}`}>{ESTADO_LABEL[o.estado] ?? o.estado}</span>
                  <MIcon name="chevron_right" />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                  <span className="btn-icon"><MIcon name="groups" size={16} /> {o.cantidad_profesionales ?? 0} profesionales</span>
                  <span className="btn-icon"><MIcon name="person" size={16} /> {o.cantidad_alumnos ?? 0} alumnos</span>
                </div>
              </div>
            </AppCard>
          </div>
        ))
      )}
    </div>
  );
}
