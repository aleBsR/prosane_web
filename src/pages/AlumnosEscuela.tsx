import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, Field, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

export default function AlumnosEscuela() {
  const { escuelaId } = useParams();
  const [sp] = useSearchParams();
  const toast = useToast();
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(sp.get('registrar') === '1');
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', fecha_nacimiento: '', sexo: '', edad: '', curso_id: '', operativo_id: '' });
  const [cursos, setCursos] = useState<any[]>([]);
  const [operativos, setOperativos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await v1Api.get('/alumnos/');
      const lista = Array.isArray(data) ? data : data.results ?? [];
      setAlumnos(escuelaId ? lista.filter((a: any) => String(a.escuela?.id ?? a.escuela ?? '') === escuelaId) : lista);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudieron cargar los alumnos'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuelaId]);

  async function abrirNuevo() {
    try {
      const [c, o] = await Promise.all([v1Api.get('/escuelas/mi-escuela/').catch(() => ({ data: null })), v1Api.get('/operativos/')]);
      const ops = Array.isArray(o.data) ? o.data : o.data.results ?? [];
      setOperativos(ops);
      const esc: any = (c as any).data;
      if (esc?.cursos) setCursos(esc.cursos);
      else if (escuelaId) {
        const cc = await v1Api.get(`/escuelas/${escuelaId}/cursos/`);
        setCursos(Array.isArray(cc.data) ? cc.data : cc.data.results ?? []);
      }
    } catch {
      /* listas vacías */
    }
    setShowNew(true);
  }

  async function crear() {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.dni.trim() || !form.operativo_id) {
      toast.push('error', 'Completá nombre, apellido, DNI y operativo');
      return;
    }
    setSaving(true);
    try {
      await v1Api.post('/alumnos/', {
        persona: { nombre: form.nombre.trim(), apellido: form.apellido.trim(), dni: form.dni.trim(), tipo_dni: 'DNI', sexo: form.sexo || 'otro', fecha_nacimiento: form.fecha_nacimiento || undefined },
        edad: form.edad ? Number(form.edad) : 0,
        ...(form.curso_id ? { curso_id: form.curso_id } : {}),
        operativo_id: form.operativo_id,
      });
      toast.push('ok', '¡Alumno registrado!');
      setShowNew(false);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo registrar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando alumnos…</AppCard>;
  return (
    <div>
      <PageHeader
        title={`Alumnos${sp.get('nombre') ? ` — ${sp.get('nombre')}` : ''}`}
        backTo={escuelaId ? `/escuelas/${escuelaId}` : '/escuelas/mi-escuela'}
        action={
          <button className="btn" style={{ width: 'auto', height: 40 }} onClick={abrirNuevo}>
            + Registrar
          </button>
        }
      />
      {alumnos.length === 0 ? (
        <EmptyState titulo="Sin alumnos" />
      ) : (
        <AppCard>
          <div className="table-wrap">
            <table className="grid">
              <thead><tr><th>Alumno</th><th>DNI</th><th>Nacimiento</th></tr></thead>
              <tbody>
                {alumnos.map((a: any) => (
                  <tr key={a.id}>
                    <td>{a.apellido}, {a.nombre}</td>
                    <td>{a.dni}</td>
                    <td>{a.fecha_nacimiento ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>
      )}
      {showNew && (
        <Modal title="Registrar alumno" saving={saving} onSave={crear} onCancel={() => setShowNew(false)}>
          <Field label="Nombre *"><TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Apellido *"><TextInput value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} /></Field>
          <Field label="DNI *"><TextInput value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} /></Field>
          <Field label="Fecha de nacimiento *"><TextInput type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} /></Field>
          <Field label="Sexo *">
            <SelectInput value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="">…</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </SelectInput>
          </Field>
          <Field label="Edad *"><TextInput type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></Field>
          <Field label="Curso">
            <SelectInput value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value })}>
              <option value="">…</option>
              {cursos.map((c: any) => <option key={c.id} value={c.id}>{c.sala_grado_anio} {c.division}</option>)}
            </SelectInput>
          </Field>
          <Field label="Operativo *">
            <SelectInput value={form.operativo_id} onChange={(e) => setForm({ ...form, operativo_id: e.target.value })}>
              <option value="">…</option>
              {operativos.map((o: any) => <option key={o.id} value={o.id}>{o.nombre} • {o.fecha}</option>)}
            </SelectInput>
          </Field>
        </Modal>
      )}
    </div>
  );
}
