import { useEffect, useState } from 'react';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, EmptyState, Field, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

const ENTIDADES = [
  'escuela', 'curso', 'alumno_operativo', 'paciente', 'evaluacion_medica',
  'evaluacion_odontologica', 'seccion_escuela', 'datos_alumno', 'tutor',
  'antecedente', 'profesional_cuenta', 'operativo', 'operativo_profesional',
];
  const ACCIONES = ['crear', 'editar', 'eliminar', 'desactivar', 'importar', 'cambiar_estado', 'leer'];

const ENTIDAD_LABEL: Record<string, string> = {
  escuela: 'Escuela', curso: 'Curso', alumno_operativo: 'Alumno (operativo)',
  paciente: 'Paciente', evaluacion_medica: 'Eval. médica',
  evaluacion_odontologica: 'Eval. odontológica', seccion_escuela: 'Sección escuela',
  datos_alumno: 'Datos alumno', tutor: 'Tutor', antecedente: 'Antecedente',
  profesional_cuenta: 'Cuenta profesional', operativo: 'Operativo',
  operativo_profesional: 'Profesional asignado',
};

// Hoy local en aaaa-mm-dd para validar y limitar los inputs de fecha.
function fechaHoyLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
const HOY = fechaHoyLocal();

// Consulta de auditoría de cambios (solo superadmin, acción verAuditoria).
export default function Auditoria() {
  const { can } = useAuth();
  const toast = useToast();
  const [filas, setFilas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ entidad: '', accion: '', actor: '', desde: '', hasta: '' });

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function cargar() {
    if (f.desde && f.desde > HOY) {
      toast.push('error', 'La fecha "desde" no puede ser posterior a hoy');
      return;
    }
    if (f.hasta && f.hasta > HOY) {
      toast.push('error', 'La fecha "hasta" no puede ser posterior a hoy');
      return;
    }
    if (f.desde && f.hasta && f.desde > f.hasta) {
      toast.push('error', 'La fecha "desde" debe ser menor o igual que "hasta"');
      return;
    }
    setLoading(true);
    try {
      const params: any = {};
      if (f.entidad) params.entidad = f.entidad;
      if (f.accion) params.accion = f.accion;
      if (f.actor.trim()) params.actor = f.actor.trim();
      if (f.desde) params.desde = f.desde;
      if (f.hasta) params.hasta = f.hasta;
      const { data } = await v1Api.get('/auditoria/cambios/', { params });
      setFilas(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar la auditoría'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!can('verAuditoria')) {
    return (
      <div>
        <PageHeader title="Auditoría" backTo="/inicio" />
        <EmptyState titulo="Sin permiso" subtitulo="Solo superadmin puede ver la auditoría." />
      </div>
    );
  }

  const fecha = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso ?? '';
    }
  };

  return (
    <div>
      <PageHeader title="Auditoría de cambios" backTo="/inicio" />
      <AppCard>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <Field label="Entidad">
              <SelectInput value={f.entidad} onChange={(e) => set('entidad', e.target.value)}>
                <option value="">Todas</option>
                {ENTIDADES.map((x) => <option key={x} value={x}>{ENTIDAD_LABEL[x] ?? x}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <Field label="Acción">
              <SelectInput value={f.accion} onChange={(e) => set('accion', e.target.value)}>
                <option value="">Todas</option>
                {ACCIONES.map((x) => <option key={x} value={x}>{x}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <Field label="Actor (email)">
              <TextInput placeholder="usuario@…" value={f.actor} onChange={(e) => set('actor', e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <Field label="Desde">
              <TextInput type="date" max={HOY} value={f.desde} onChange={(e) => set('desde', e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <Field label="Hasta">
              <TextInput type="date" max={HOY} value={f.hasta} onChange={(e) => set('hasta', e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <AppButton label="Buscar" loading={loading} onClick={cargar} />
        </div>
      </AppCard>
      {loading ? (
        <AppCard>Cargando…</AppCard>
      ) : filas.length === 0 ? (
        <EmptyState titulo="Sin movimientos" subtitulo="No hay registros con esos filtros." />
      ) : (
        filas.map((r: any) => (
          <div key={r.id} style={{ marginBottom: 12 }}>
            <AppCard>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {ENTIDAD_LABEL[r.entidad] ?? r.entidad} · {r.accion}
              </div>
              <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4 }}>
                {fecha(r.created_at)} · {r.actor_email ?? 'sistema'} {r.ip ? `· ${r.ip}` : ''}
              </div>
              {r.detalle && Object.keys(r.detalle).length > 0 && (
                <details style={{ fontSize: 12, marginTop: 6 }}>
                  <summary style={{ cursor: 'pointer' }}>Detalle</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '4px 0 0' }}>
                    {JSON.stringify(r.detalle, null, 1)}
                  </pre>
                </details>
              )}
            </AppCard>
          </div>
        ))
      )}
    </div>
  );
}
