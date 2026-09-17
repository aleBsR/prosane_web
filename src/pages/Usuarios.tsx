import { useEffect, useState } from 'react';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, EmptyState, Field, Modal, PageHeader, RowMenu, SelectInput, TextInput, useToast } from '../components/ui';

// ABM espejo de las pantallas móviles (usuarios_escuela / usuarios_ayudantes):
// filas con ⋯ (Editar), reenvío temporal dentro del diálogo de edición y
// botón "Nuevo usuario" abajo.
export function UsuariosEscuela() {
  return <UsuariosABM titulo="Usuarios de escuelas" endpoint="/usuarios/escuelas/" conEscuela subtituloVacio="Creá uno para asignarle una escuela" />;
}
export function UsuariosAyudantes() {
  return <UsuariosABM titulo="Usuarios ayudantes" endpoint="/usuarios/ayudantes/" conEscuela={false} subtituloVacio="Creá uno para asignarle tareas de gestión" />;
}

function UsuariosABM({ titulo, endpoint, conEscuela, subtituloVacio }: { titulo: string; endpoint: string; conEscuela: boolean; subtituloVacio: string }) {
  const toast = useToast();
  const [lista, setLista] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<any | 'nuevo' | null>(null);
  const [form, setForm] = useState({ email: '', email2: '', escuela: '' });
  const [saving, setSaving] = useState(false);
  const [reenv, setReenv] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await v1Api.get(endpoint);
      setLista(Array.isArray(data) ? data : data.results ?? []);
      if (conEscuela) {
        const e = await v1Api.get('/escuelas/');
        setEscuelas(Array.isArray(e.data) ? e.data : e.data.results ?? []);
      }
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrir(u: any | 'nuevo') {
    setEdit(u);
    setForm(
      u === 'nuevo'
        ? { email: '', email2: '', escuela: '' }
        : { email: u.email ?? '', email2: u.email ?? '', escuela: u.escuela ?? '' },
    );
  }

  async function guardar() {
    if (!form.email.includes('@')) {
      toast.push('error', 'Email inválido');
      return;
    }
    if (edit === 'nuevo' && form.email.toLowerCase() !== form.email2.toLowerCase()) {
      toast.push('error', 'Los correos no coinciden');
      return;
    }
    if (conEscuela && edit === 'nuevo' && !form.escuela) {
      toast.push('error', 'Elegí la escuela');
      return;
    }
    setSaving(true);
    try {
      if (edit === 'nuevo') {
        await v1Api.post(endpoint, { email: form.email.trim(), ...(conEscuela ? { escuela: form.escuela } : {}) });
        toast.push('ok', '¡Usuario creado! Se envió temporal por mail (72h).');
      } else {
        await v1Api.patch(`${endpoint}${(edit as any).id}/`, { email: form.email.trim(), ...(conEscuela && form.escuela ? { escuela: form.escuela } : {}) });
        toast.push('ok', 'Usuario actualizado');
      }
      setEdit(null);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  async function reenviar() {
    if (edit === 'nuevo') return;
    setReenv(true);
    try {
      await v1Api.post(`${endpoint}${(edit as any).id}/resend-temp/`);
      toast.push('ok', 'Contraseña temporal reenviada por mail (72h).');
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo reenviar'));
    } finally {
      setReenv(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  return (
    <div>
      <PageHeader title={titulo} backTo="/gestion-usuarios" />
      {lista.length === 0 ? (
        <EmptyState titulo={`No hay ${titulo.toLowerCase()}`} subtitulo={subtituloVacio} />
      ) : (
        lista.map((u: any) => (
          <div key={u.id} style={{ marginBottom: 12 }}>
            <AppCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>
                    {conEscuela ? u.escuela_nombre || 'Sin escuela asignada' : 'Ayudante'}
                  </div>
                  {!u.is_active && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>Cuenta desactivada</div>}
                </div>
                <RowMenu
                  entries={[{ value: 'editar', label: 'Editar', icon: 'edit' }]}
                  onSelect={(v) => {
                    if (v === 'editar') abrir(u);
                  }}
                />
              </div>
            </AppCard>
          </div>
        ))
      )}
      <AppButton label="Nuevo usuario" onClick={() => abrir('nuevo')} />
      {edit && (
        <Modal title={edit === 'nuevo' ? `Nuevo — ${titulo}` : 'Editar usuario'} saving={saving} onSave={guardar} onCancel={() => setEdit(null)}>
          <div className="info-box ok">Se enviará contraseña temporal por mail (72h).</div>
          <Field label="Email *"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {edit === 'nuevo' && (
            <Field label="Repetir email *"><TextInput type="email" value={form.email2} onChange={(e) => setForm({ ...form, email2: e.target.value })} /></Field>
          )}
          {conEscuela && (
            <Field label="Escuela *">
              <SelectInput value={form.escuela} onChange={(e) => setForm({ ...form, escuela: e.target.value })}>
                <option value="">…</option>
                {escuelas.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </SelectInput>
            </Field>
          )}
          {edit !== 'nuevo' && (
            <>
              <div className="info-box">La contraseña solo la gestiona el propio usuario. No es visible para el admin.</div>
              <AppButton label={reenv ? 'Reenviando…' : 'Reenviar temporal (72h)'} disabled={reenv} secondary onClick={reenviar} />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
