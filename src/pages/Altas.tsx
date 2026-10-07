import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, EmptyState, Field, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

// Alta directa de escuela (ruta /escuelas/nuevo, espejo de crearEscuela).
export function EscuelaCreate() {
  const nav = useNavigate();
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [cue, setCue] = useState('');
  const [saving, setSaving] = useState(false);

  async function crear() {
    if (!nombre.trim()) return toast.push('error', 'El nombre es obligatorio');
    setSaving(true);
    try {
      const { data } = await v1Api.post('/escuelas/', { nombre: nombre.trim(), ...(cue ? { cue } : {}) });
      toast.push('ok', 'Escuela creada');
      // El formulario se reemplaza por el listado y el detalle se apila
      // encima: el "atrás" del navegador vuelve siempre al listado,
      // venga de donde venga (listado o menú de inicio).
      nav('/escuelas', { replace: true });
      nav(`/escuelas/${data.id}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo crear'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Crear escuela" backTo="/escuelas" />
      <AppCard>
        <Field label="Nombre *"><TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
        <Field label="CUE (si se conoce)"><TextInput value={cue} onChange={(e) => setCue(e.target.value)} /></Field>
        <AppButton label="Crear escuela" loading={saving} onClick={crear} />
      </AppCard>
    </div>
  );
}

// Alta directa de operativo (ruta /operativos/nuevo, espejo de crearOperativo).
// Mismos campos que la app móvil: nombre, escuela, fecha, lugar y notas.
export function OperativoCreate() {
  const nav = useNavigate();
  const toast = useToast();
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [escuela, setEscuela] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('escuela');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    v1Api.get('/escuelas/?activa=true').then((r) => setEscuelas(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setEscuelas([]));
  }, []);

  async function crear() {
    if (!escuela || !fecha || !lugar) return toast.push('error', 'Elegí escuela, fecha y lugar');
    setSaving(true);
    try {
      const { data } = await v1Api.post('/operativos/', {
        ...(nombre.trim() ? { nombre: nombre.trim() } : {}),
        escuela,
        fecha,
        lugar_realizacion: lugar,
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      });
      toast.push('ok', 'Operativo creado en Borrador');
      // Idem alta de escuela: el "atrás" vuelve siempre al listado.
      nav('/operativos', { replace: true });
      nav(`/operativos/${data.id}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo crear'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Crear operativo" backTo="/operativos" />
      <AppCard>
        <Field label="Nombre (opcional)">
          <TextInput placeholder="Ej: Operativo 2026" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Escuela *">
          <SelectInput value={escuela} onChange={(e) => setEscuela(e.target.value)}>
            <option value="">…</option>
            {escuelas.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </SelectInput>
        </Field>
        <Field label="Fecha *"><TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Lugar de realización *">
          <SelectInput value={lugar} onChange={(e) => setLugar(e.target.value)}>
            <option value="escuela">En la escuela</option>
            <option value="centro_salud">En el centro de salud</option>
            <option value="otros">Otros</option>
          </SelectInput>
        </Field>
        <Field label="Notas (opcional)">
          <textarea rows={3} placeholder="Añadí notas…" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>
        <AppButton label="Crear operativo" loading={saving} onClick={crear} />
      </AppCard>
    </div>
  );
}

// Rutas fuera del alcance de esta etapa (el perfil tutor está omitido,
// igual que en la guía de pruebas de la app móvil).
export function TutorFueraDeAlcance({ titulo }: { titulo: string }) {
  return (
    <EmptyState
      titulo={titulo}
      subtitulo="El perfil tutor está omitido en esta etapa: la escuela carga los datos de los alumnos."
    />
  );
}
