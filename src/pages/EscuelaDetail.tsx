import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppCard, EmptyState, Field, MIcon, Modal, PageHeader, PostCard, SelectInput, TextInput, useToast } from '../components/ui';
import { MODALIDADES, SECTORES } from './Escuelas';

// Detalle con formato de publicación, espejo de escuela_detail_screen.dart:
// avatar + título, franja con chips, menú ⋯ (editar/eliminar por permiso),
// datos y botones Ver cursos / Ver alumnos.
export default function EscuelaDetail() {
  const { escuelaId } = useParams();
  const { can } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [escuela, setEscuela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: '', cue: '', sector_gestion: '', modalidad_educativa: '', telefono: '', localidad: '', intercultural_bilingue: false, plurigrado_rural: false });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const puedeEditar = can('editarEscuela');
  const puedeEliminar = can('eliminarEscuela');
  const puedeVerAlumnos = can('verAlumnosEscuela');
  const puedeGestionarUsuariosEscuela = can('gestionarUsuariosEscuela');

  async function cargar() {
    try {
      const { data } = await v1Api.get(`/escuelas/${escuelaId}/`);
      if (data?.activa === false) {
        setLoading(false);
        toast.push('ok', 'La escuela ya no está disponible');
        nav('/escuelas', { replace: true });
        return;
      }
      setEscuela(data);
    } catch (e) {
      // 404 = escuela desactivada/borrada: volver al listado en vez de
      // quedar mostrando una escuela que ya no existe (atrás/URL directa).
      if ((e as any)?.response?.status === 404) {
        toast.push('ok', 'La escuela ya no está disponible');
        nav('/escuelas', { replace: true });
        return;
      }
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar la escuela'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuelaId]);

  function abrirEdicion() {
    setForm({
      nombre: escuela.nombre ?? '',
      cue: escuela.cue ?? '',
      sector_gestion: escuela.sector_gestion ?? '',
      modalidad_educativa: escuela.modalidad_educativa ?? '',
      telefono: escuela.telefono ?? '',
      localidad: escuela.localidad ?? escuela.domicilio?.localidad ?? '',
      intercultural_bilingue: !!escuela.intercultural_bilingue,
      plurigrado_rural: !!escuela.plurigrado_rural,
    });
    setEditing(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      toast.push('error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await v1Api.patch(`/escuelas/${escuelaId}/`, {
        nombre: form.nombre.trim(),
        ...(form.cue.trim() ? { cue: form.cue.trim() } : {}),
        ...(form.sector_gestion ? { sector_gestion: form.sector_gestion } : {}),
        ...(form.modalidad_educativa ? { modalidad_educativa: form.modalidad_educativa } : {}),
        ...(form.telefono.trim() ? { telefono: form.telefono.trim() } : {}),
        intercultural_bilingue: form.intercultural_bilingue,
        plurigrado_rural: form.plurigrado_rural,
        ...(form.localidad.trim() ? { domicilio: { localidad: form.localidad.trim() } } : {}),
      });
      toast.push('ok', 'Escuela actualizada');
      setEditing(false);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'Error al editar'));
    } finally {
      setSaving(false);
    }
  }

  async function eliminar() {
    try {
      await v1Api.delete(`/escuelas/${escuelaId}/`);
      toast.push('ok', 'Escuela eliminada');
      // replace en vez de push: no dejar el detalle de la escuela borrada
      // en el historial, así "atrás" no la vuelve a montar (espejo del
      // context.pop() del móvil tras eliminar).
      nav('/escuelas', { replace: true });
    } catch (e) {
      // El backend puede rechazar con 409 (usuarios/operativos asociados).
      toast.push('error', apiErrorMessage(e, 'No se pudo eliminar'));
      setConfirmDel(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  if (!escuela) return <EmptyState titulo="No se pudo cargar la escuela" />;

  const esPlurigrado = !!escuela.plurigrado_rural;
  const etiqueta = (opts: { value: string; label: string }[], v: any) =>
    opts.find((o) => o.value === v)?.label ?? (v || '—');
  const chips = [
    etiqueta(SECTORES, escuela.sector_gestion),
    etiqueta(MODALIDADES, escuela.modalidad_educativa),
    ...(esPlurigrado ? ['Plurigrado rural'] : []),
    ...(escuela.intercultural_bilingue ? ['Intercultural bilingüe'] : []),
  ];

  const dato = (t: string, v: any) => (
    <div className="post-dato">
      <strong>{t}: </strong>
      {v && String(v).trim() ? String(v) : '—'}
    </div>
  );

  return (
    <div>
      <PageHeader title="Detalle de escuela" backTo="/escuelas" />
      <PostCard
        avatarLetter={escuela.nombre}
        title={escuela.nombre}
        bannerIcon="school"
        bannerChips={chips}
          menuEntries={[
            ...(puedeEditar ? [{ value: 'editar', label: 'Editar', icon: 'edit' }] : []),
            ...(puedeGestionarUsuariosEscuela ? [{ value: 'usuarios', label: 'Usuarios escuela', icon: 'groups' }] : []),
            ...(puedeEliminar ? [{ value: 'eliminar', label: 'Eliminar', icon: 'delete', danger: true }] : []),
          ]}
          onMenuSelected={(v) => {
            if (v === 'editar') abrirEdicion();
            if (v === 'usuarios') nav(`/usuarios-escuela?escuela=${escuelaId}`);
            if (v === 'eliminar') setConfirmDel(true);
          }}
        body={
          <>
            {dato('CUE', escuela.cue)}
            {dato('Localidad', escuela.localidad ?? escuela.domicilio?.localidad)}
            {dato('Ámbito', escuela.ambito)}
            {dato('Teléfono', escuela.telefono)}
            {esPlurigrado && (
              <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic', color: 'var(--texto-suave)' }}>
                Escuela plurigrado rural: no necesita cursos. Los alumnos se registran sin curso.
              </div>
            )}
          </>
        }
        actions={
          <>
            {!esPlurigrado && (
              <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} onClick={() => nav(`/escuelas/${escuelaId}/cursos?nombre=${encodeURIComponent(escuela.nombre ?? '')}`)}>
                <MIcon name="menu_book" /> Ver cursos
              </button>
            )}
            {puedeVerAlumnos && (
              <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} onClick={() => nav(`/escuelas/${escuelaId}/alumnos?nombre=${encodeURIComponent(escuela.nombre ?? '')}`)}>
                <MIcon name="groups" /> Ver alumnos
              </button>
            )}
          </>
        }
      />

      {editing && (
        <Modal title="Editar escuela" saving={saving} onSave={guardar} onCancel={() => setEditing(false)}>
          <Field label="Nombre *">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="CUE">
            <TextInput value={form.cue} onChange={(e) => setForm({ ...form, cue: e.target.value })} />
          </Field>
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
          <Field label="Teléfono">
            <TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="Localidad">
            <TextInput value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} />
          </Field>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={form.intercultural_bilingue} onChange={(e) => setForm({ ...form, intercultural_bilingue: e.target.checked })} />
            Intercultural bilingüe
          </label>
          <div style={{ height: 8 }} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={form.plurigrado_rural} onChange={(e) => setForm({ ...form, plurigrado_rural: e.target.checked })} />
            Plurigrado rural
          </label>
        </Modal>
      )}

      {confirmDel && (
        <Modal title={`¿Eliminar ${escuela.nombre}?`} saveLabel="Sí" cancelLabel="No" onSave={eliminar} onCancel={() => setConfirmDel(false)}>
          La escuela se desactivará. Esta acción no se puede deshacer.
        </Modal>
      )}
    </div>
  );
}
