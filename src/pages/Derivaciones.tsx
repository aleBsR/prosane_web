import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, PageHeader, SelectInput, useToast } from '../components/ui';

const ESPECIALIDADES: [string, string][] = [
  ['', 'Todas'],
  ['odontologia', 'Odontología'],
  ['oftalmologia', 'Oftalmología'],
  ['nutricion', 'Nutrición'],
  ['vacunatorio', 'Vacunatorio'],
  ['pediatria', 'Pediatría'],
  ['fonoaudiologia', 'Fonoaudiología'],
];

// Espejo de derivaciones_screen.dart: derivaciones generadas en el operativo
// (Anexo I 4.6), con filtro por especialidad.
export default function Derivaciones() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [datos, setDatos] = useState<any>(null);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar(esp: string) {
    setLoading(true);
    try {
      const params: any = {};
      if (esp) params.especialidad = esp;
      const { data } = await v1Api.get(`/operativos/${id}/derivaciones/`, { params });
      setDatos(data);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudieron cargar las derivaciones'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filtro]);

  const items: any[] = Array.isArray(datos?.derivaciones) ? datos.derivaciones : [];

  if (loading && !datos) return <AppCard>Cargando derivaciones…</AppCard>;
  return (
    <div>
      <PageHeader title="Derivaciones" backTo={`/operativos/${id}`} />
      <AppCard>
        <div className="field" style={{ marginBottom: 4 }}>
          <label>Especialidad</label>
          <SelectInput value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {ESPECIALIDADES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </SelectInput>
        </div>
        <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 8 }}>
          {datos?.total ?? 0} derivaciones
        </div>
      </AppCard>
      <div style={{ height: 12 }} />
      {items.length === 0 ? (
        <EmptyState titulo="Sin derivaciones registradas" />
      ) : (
        <>
          {items.map((d: any) => (
            <div key={`${d.alumno_id}-${d.especialidad}`} style={{ marginBottom: 12 }}>
              <AppCard>
                <div
                  className="school-card-click"
                  onClick={() => nav(`/operativos/${id}/alumnos/${d.alumno_id}`)}
                >
                  <div style={{ fontWeight: 700 }}>
                    {d.apellido}, {d.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 2 }}>
                    DNI {d.dni}{d.curso ? ` · ${d.curso}` : ''}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className="chip warn">{d.especialidad_label ?? d.especialidad}</span>
                  </div>
                  {d.motivo && (
                    <div style={{ fontSize: 13, marginTop: 6 }}>{d.motivo}</div>
                  )}
                  {d.profesional && (
                    <div style={{ fontSize: 11, color: 'var(--texto-suave)', marginTop: 4 }}>
                      Deriva: {d.profesional}
                    </div>
                  )}
                </div>
              </AppCard>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
