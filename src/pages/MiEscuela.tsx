import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';
import { MODALIDADES, SECTORES } from './Escuelas';

export default function MiEscuela() {
  const toast = useToast();
  const [escuela, setEscuela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', cue: '', sector_gestion: '', modalidad_educativa: '', telefono: '', localidad: '' });
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await v1Api.get('/escuelas/mi-escuela/');
      setEscuela(data);
      setForm({
        nombre: data.nombre ?? '',
        cue: data.cue ?? '',
        sector_gestion: data.sector_gestion ?? '',
        modalidad_educativa: data.modalidad_educativa ?? '',
        telefono: data.telefono ?? '',
        localidad: data.localidad ?? data.domicilio?.localidad ?? '',
      });
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar tu escuela'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardar() {
    setSaving(true);
    try {
      await v1Api.patch('/escuelas/mi-escuela/', {
        nombre: form.nombre,
        cue: form.cue || undefined,
        sector_gestion: form.sector_gestion || undefined,
        modalidad_educativa: form.modalidad_educativa || undefined,
        telefono: form.telefono || undefined,
        ...(form.localidad ? { domicilio: { localidad: form.localidad } } : {}),
      });
      toast.push('ok', 'Escuela actualizada');
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  if (!escuela) return <AppCard>No tenés escuela asignada.</AppCard>;
  const faltantes: string[] = [];
  if (!form.cue) faltantes.push('CUE');
  if (!form.sector_gestion) faltantes.push('sector de gestión');
  if (!form.modalidad_educativa) faltantes.push('modalidad educativa');
  if (!form.telefono) faltantes.push('teléfono');
  if (!form.localidad) faltantes.push('localidad');

  return (
    <div>
      <PageHeader title="Mi escuela" backTo="/inicio" />
      {faltantes.length > 0 && (
        <AppCard>
          <div className="info-box" style={{ border: '1px solid var(--error)' }}>
            <strong>Completar datos obligatorios:</strong> faltan {faltantes.join(', ')}.
          </div>
        </AppCard>
      )}
      <AppCard>
        <h2>{escuela.nombre}</h2>
        <Field label="Nombre *"><TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
        <Field label="CUE"><TextInput value={form.cue} onChange={(e) => setForm({ ...form, cue: e.target.value })} /></Field>
        <Field label="Sector de gestión">
          <SelectInput value={form.sector_gestion} onChange={(e) => setForm({ ...form, sector_gestion: e.target.value })}>
            <option value="">…</option>
            {SECTORES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Modalidad educativa">
          <SelectInput value={form.modalidad_educativa} onChange={(e) => setForm({ ...form, modalidad_educativa: e.target.value })}>
            <option value="">…</option>
            {MODALIDADES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Teléfono"><TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
        <Field label="Localidad"><TextInput value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} /></Field>
        <AppButton label="Guardar" loading={saving} onClick={guardar} />
        <div className="actions-row">
          <Link className="btn" style={{ width: 'auto', height: 44, fontSize: 13 }} to={`/escuelas/${escuela.id}/cursos?nombre=${encodeURIComponent(escuela.nombre ?? '')}`}>
            Ver cursos
          </Link>
          <Link className="btn" style={{ width: 'auto', height: 44, fontSize: 13 }} to="/escuelas/alumnos">
            Alumnos de mi escuela
          </Link>
        </div>
      </AppCard>
    </div>
  );
}
