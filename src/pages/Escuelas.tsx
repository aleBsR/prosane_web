import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, PageHeader, useToast } from '../components/ui';

// Valores como los guarda el backend (espejo de escuelas_repository.dart).
export const SECTORES = [
  { value: 'estatal', label: 'Estatal' },
  { value: 'privado', label: 'Privado' },
  { value: 'social_cooperativa', label: 'Social/cooperativa' },
];
export const MODALIDADES = [
  { value: 'comun', label: 'Común' },
  { value: 'especial', label: 'Especial' },
];

// Lista de escuelas como en la app móvil (escuelas_list_screen.dart):
// solo tarjetas con nombre + CUE • localidad; al tocar se abre el detalle.
// Sin botones de abrir/editar/eliminar acá.
export default function Escuelas() {
  const toast = useToast();
  const nav = useNavigate();
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await v1Api.get('/escuelas/?activa=true');
        setEscuelas(Array.isArray(data) ? data : data.results ?? []);
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudieron cargar las escuelas'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <AppCard>Cargando escuelas…</AppCard>;
  return (
    <div>
      <PageHeader
        title="Escuelas"
        backTo="/inicio"
      />
      {escuelas.length === 0 ? (
        <EmptyState titulo="No hay escuelas registradas" subtitulo="Creá una para comenzar" />
      ) : (
        escuelas.map((e: any) => {
          const sub = [e.cue ? `CUE ${e.cue}` : '', e.localidad ?? e.domicilio?.localidad ?? '']
            .filter(Boolean)
            .join(' • ');
          return (
            <div key={e.id} style={{ marginBottom: 12 }}>
              <AppCard>
                <div className="school-card-click" onClick={() => nav(`/escuelas/${e.id}`)}>
                  <div style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.nombre}
                  </div>
                  {sub && <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4 }}>{sub}</div>}
                  {(() => {
                    // Solo cuentan los usuarios activos: con todos inactivos la
                    // escuela queda sin acceso y muestra la advertencia.
                    const asociados = (Array.isArray(e.usuarios_asociados) ? e.usuarios_asociados : [])
                      .filter((u: any) => u.is_active !== false);
                    if (asociados.length === 0) {
                      return (
                        <div style={{ marginTop: 6 }}>
                          <span className="badge warn">Sin usuario asociado</span>
                        </div>
                      );
                    }
                    return (
                      <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Usuario: {asociados.map((u: any) => (u.nombre && String(u.nombre).trim()) ? u.nombre : u.email).join(' • ')}
                      </div>
                    );
                  })()}
                </div>
              </AppCard>
            </div>
          );
        })
      )}
    </div>
  );
}
