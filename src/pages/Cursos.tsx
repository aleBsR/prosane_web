import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppCard, EmptyState, Field, Modal, PageHeader, TextInput, useToast } from '../components/ui';

export default function Cursos() {
  const { escuelaId } = useParams();
  const [sp] = useSearchParams();
  const toast = useToast();
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<any | 'nuevo' | null>(null);
  const [form, setForm] = useState({ grado: '', division: '', ciclo: '' });
  const [saving, setSaving] = useState(false);

  async function cargar() {
    if (!escuelaId) return;
    setLoading(true);
    try {
      const { data } = await v1Api.get(`/escuelas/${escuelaId}/cursos/`);
      setCursos(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudieron cargar los cursos'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuelaId]);

  function abrir(c: any | 'nuevo') {
    setEdit(c);
    setForm(
      c === 'nuevo'
        ? { grado: '', division: '', ciclo: '' }
        : { grado: c.sala_grado_anio ?? '', division: c.division ?? '', ciclo: String(c.ciclo_lectivo ?? '') },
    );
  }

  async function guardar() {
    if (!form.grado.trim() || !form.division.trim()) {
      toast.push('error', 'Completá grado y división');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        sala_grado_anio: form.grado.trim(),
        division: form.division.trim(),
        ...(form.ciclo ? { ciclo_lectivo: Number(form.ciclo) } : {}),
      };
      if (edit === 'nuevo') await v1Api.post(`/escuelas/${escuelaId}/cursos/`, payload);
      else await v1Api.patch(`/escuelas/${escuelaId}/cursos/${(edit as any).id}/`, payload);
      toast.push('ok', 'Curso guardado');
      setEdit(null);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(c: any) {
    if (!confirm(`¿Eliminar ${c.sala_grado_anio} ${c.division}?`)) return;
    try {
      await v1Api.delete(`/escuelas/${escuelaId}/cursos/${c.id}/`);
      toast.push('ok', 'Curso eliminado');
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo eliminar'));
    }
  }

  if (loading) return <AppCard>Cargando cursos…</AppCard>;
  return (
    <div>
      <PageHeader
        title={`Cursos${sp.get('nombre') ? ` — ${sp.get('nombre')}` : ''}`}
        backTo={escuelaId ? `/escuelas/${escuelaId}` : '/escuelas'}
        action={
          <button className="btn" style={{ width: 'auto', height: 40 }} onClick={() => abrir('nuevo')}>
            + Nuevo
          </button>
        }
      />
      {cursos.length === 0 ? (
        <EmptyState titulo="Sin cursos" />
      ) : (
        cursos.map((c: any) => (
          <AppCard key={c.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <strong style={{ flex: 1 }}>
                {c.sala_grado_anio} {c.division} {c.ciclo_lectivo ? `• ${c.ciclo_lectivo}` : ''}
              </strong>
              <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => abrir(c)}>
                Editar
              </button>
              <button className="btn btn-secondary" style={{ width: 'auto', color: 'var(--error)' }} onClick={() => eliminar(c)}>
                Eliminar
              </button>
            </div>
          </AppCard>
        ))
      )}
      {edit && (
        <Modal title={edit === 'nuevo' ? 'Agregar curso' : 'Editar curso'} saving={saving} onSave={guardar} onCancel={() => setEdit(null)}>
          <Field label="Grado / Sala (ej: 1°) *">
            <TextInput value={form.grado} onChange={(e) => setForm({ ...form, grado: e.target.value })} />
          </Field>
          <Field label="División (ej: A) *">
            <TextInput value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} />
          </Field>
          <Field label="Ciclo lectivo" hint="Ej: 2026">
            <TextInput type="number" value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
