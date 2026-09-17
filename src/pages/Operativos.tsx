import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, Field, MIcon, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

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

// Lista espejo de operativos_list_screen.dart: tarjeta clicable con título,
// fecha • lugar, badge de estado con sus colores y conteos.
export default function Operativos() {
  const nav = useNavigate();
  const toast = useToast();
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [form, setForm] = useState({ escuela: '', fecha: '', lugar_realizacion: 'escuela', nombre: '' });
  const [saving, setSaving] = useState(false);

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

  async function abrirNuevo() {
    try {
      const { data } = await v1Api.get('/escuelas/');
      setEscuelas(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setEscuelas([]);
    }
    setShowNew(true);
  }

  async function crear() {
    if (!form.escuela || !form.fecha) {
      toast.push('error', 'Elegí escuela y fecha');
      return;
    }
    setSaving(true);
    try {
      const { data } = await v1Api.post('/operativos/', {
        escuela: form.escuela,
        fecha: form.fecha,
        lugar_realizacion: form.lugar_realizacion,
        ...(form.nombre ? { nombre: form.nombre } : {}),
      });
      toast.push('ok', '¡Operativo creado!');
      setShowNew(false);
      nav(`/operativos/${data.id}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo crear el operativo'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando operativos…</AppCard>;
  return (
    <div>
      <PageHeader
        title="Operativos"
        backTo="/inicio"
        action={
          <button className="btn" style={{ width: 'auto', height: 40 }} onClick={abrirNuevo}>
            + Nuevo
          </button>
        }
      />
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
                    <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>
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
      {showNew && (
        <Modal title="Nuevo operativo" saveLabel="Crear" saving={saving} onSave={crear} onCancel={() => setShowNew(false)}>
          <Field label="Escuela *">
            <SelectInput value={form.escuela} onChange={(e) => setForm({ ...form, escuela: e.target.value })}>
              <option value="">Seleccioná…</option>
              {escuelas.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Fecha *">
            <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
          <Field label="Nombre (opcional)">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
