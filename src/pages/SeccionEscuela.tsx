import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

const boolAOpcion = (v: any) => (v ? 'true' : 'false');

export default function SeccionEscuela() {
  const { opId, alumnoId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noEditable, setNoEditable] = useState(false);
  const [f, setF] = useState<any>({ escuela_preocupa_salud: false, escuela_preocupa_detalle: '', escuela_dificultad_lenguaje: false, escuela_bajo_tratamiento: false });

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  // Al marcar "No" se borra el detalle para no guardarlo huérfano
  // (igual que la app).
  const setPreocupa = (v: boolean) => setF((p: any) => ({
    ...p,
    escuela_preocupa_salud: v,
    ...(!v ? { escuela_preocupa_detalle: '' } : {}),
  }));

  useEffect(() => {
    (async () => {
      try {
        // GET datos trae escuela_completado + snapshot; la sección E vive en el alumno.
        const [op, datos] = await Promise.all([
          v1Api.get(`/operativos/${opId}/`),
          v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/datos/`),
        ]);
        setNoEditable(op.data.estado === 'finalizado' || op.data.estado === 'cancelado');
        const oa = datos.data?.operativo_alumno ?? {};
        setF((p: any) => ({ ...p, ...pick(oa) }));
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudo cargar'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  function pick(oa: any) {
    const out: any = {};
    for (const k of ['escuela_preocupa_salud', 'escuela_preocupa_detalle', 'escuela_dificultad_lenguaje', 'escuela_bajo_tratamiento']) {
      if (oa[k] !== undefined) out[k] = oa[k];
    }
    // Sanea detalle huérfano legacy.
    if (!out.escuela_preocupa_salud) out.escuela_preocupa_detalle = '';
    return out;
  }

  async function guardar() {
    setSaving(true);
    try {
      await v1Api.patch(`/operativos/${opId}/alumnos/${alumnoId}/seccion-escuela/`, f);
      toast.push('ok', 'Sección escuela guardada ✓ (E)');
      nav(`/operativos/${opId}`, { replace: true });
      nav(`/operativos/${opId}/alumnos/${alumnoId}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  const ro = noEditable;
  return (
    <div>
      <PageHeader title="Sección escuela (E)" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
      <AppCard>
        {ro && <div className="info-box ok">Solo lectura</div>}
        <Field label="¿Preocupa su salud?">
          <SelectInput value={boolAOpcion(f.escuela_preocupa_salud)} disabled={ro} onChange={(e) => setPreocupa(e.target.value === 'true')}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </SelectInput>
        </Field>
        {!!f.escuela_preocupa_salud && (
          <Field label="Detalle de la preocupación">
            <TextInput value={f.escuela_preocupa_detalle ?? ''} disabled={ro} onChange={(e) => set('escuela_preocupa_detalle', e.target.value)} />
          </Field>
        )}
        <Field label="¿Dificultad de lenguaje?">
          <SelectInput value={boolAOpcion(f.escuela_dificultad_lenguaje)} disabled={ro} onChange={(e) => set('escuela_dificultad_lenguaje', e.target.value === 'true')}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </SelectInput>
        </Field>
        <Field label="¿Bajo tratamiento?">
          <SelectInput value={boolAOpcion(f.escuela_bajo_tratamiento)} disabled={ro} onChange={(e) => set('escuela_bajo_tratamiento', e.target.value === 'true')}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </SelectInput>
        </Field>
        {!ro && <AppButton label="Guardar sección" loading={saving} onClick={guardar} />}
      </AppCard>
    </div>
  );
}
