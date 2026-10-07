import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, MIcon, Modal, PageHeader, PostCard, SelectInput, TextInput, useToast } from '../components/ui';
import { MODALIDADES, SECTORES } from './Escuelas';

// Espejo de mi_escuela_screen.dart: tarjeta de solo lectura (avatar, CUE,
// chips, cursos) + aviso y diálogo de completar solo si el perfil está
// incompleto. Acciones: gestionar cursos y ver operativos.
export default function MiEscuela() {
  const nav = useNavigate();
  const toast = useToast();
  const [escuela, setEscuela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
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
      toast.push('ok', '¡Datos de la escuela actualizados!');
      setEditando(false);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  if (!escuela) return <AppCard>No tenés escuela asignada.</AppCard>;

  const titulo = escuela.nombre ?? 'Escuela';
  const cursos: any[] = escuela.cursos ?? [];
  const esPlurigrado = !!escuela.plurigrado_rural;
  const perfilCompleto = escuela.perfil_completo === true;
  const faltantes: string[] = escuela.campos_faltantes ?? [];
  const subtitulo = [escuela.cue ? `CUE ${escuela.cue}` : ''].filter(Boolean).join(' • ');

  const btn = (icono: string, texto: string, to: string) => (
    <button key={to} className="post-action-btn" onClick={() => nav(to)}>
      <MIcon name={icono} size={16} /> {texto}
    </button>
  );

  return (
    <div>
      <PageHeader title="Mi escuela" backTo="/inicio" />
      {!perfilCompleto && (
        <AppCard>
          <div className="info-box" style={{ border: '1px solid var(--error)' }}>
            <strong>Completá los datos de tu escuela (obligatorio)</strong>
            <div style={{ marginTop: 4 }}>
              Falta: {faltantes.length > 0 ? faltantes.join(', ') : 'datos del establecimiento'}.
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <AppButton label="Completar datos" onClick={() => setEditando(true)} />
          </div>
        </AppCard>
      )}
      <PostCard
        avatarLetter={titulo}
        title={titulo}
        subtitle={subtitulo}
        bannerIcon="school"
        bannerChips={[
          `${cursos.length} curso${cursos.length === 1 ? '' : 's'}`,
          ...(esPlurigrado ? ['Plurigrado rural'] : []),
        ]}
        bannerBottom={
          <>
            {!esPlurigrado && escuela.id && btn('menu_book', 'Gestionar cursos', `/escuelas/${escuela.id}/cursos?nombre=${encodeURIComponent(titulo)}`)}
            {btn('event_note', 'Ver operativos', '/operativos')}
          </>
        }
        body={
          esPlurigrado ? (
            <p style={{ fontSize: 12, fontStyle: 'italic' }}>
              Escuela plurigrado rural: no necesita cursos. Los alumnos se registran sin curso.
            </p>
          ) : undefined
        }
      />
      {editando && (
        <Modal title="Completar datos de mi escuela" saving={saving} onSave={guardar} onCancel={() => setEditando(false)}>
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
        </Modal>
      )}
    </div>
  );
}
