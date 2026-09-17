import { useEffect, useState } from 'react';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, EmptyState, Field, Modal, PageHeader, RowMenu, SelectInput, TextInput, useToast } from '../components/ui';

export default function Profesionales() {
  const toast = useToast();
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<any | 'nuevo' | null>(null);
  const [form, setForm] = useState({ email: '', email2: '', rol: 'medico', matricula: '', nombre: '', apellido: '' });
  const [saving, setSaving] = useState(false);
  const [validando, setValidando] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await v1Api.get('/profesionales/');
      setLista(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudieron cargar los profesionales'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrir(p: any | 'nuevo') {
    setEdit(p);
    setForm(
      p === 'nuevo'
        ? { email: '', email2: '', rol: 'medico', matricula: '', nombre: '', apellido: '' }
        : { email: p.email ?? '', email2: p.email ?? '', rol: p.rol ?? 'medico', matricula: p.matricula ?? '', nombre: p.nombre ?? '', apellido: p.apellido ?? '' },
    );
  }

  async function validarMatricula() {
    if (!form.matricula.trim()) return;
    setValidando(true);
    try {
      const { data } = await v1Api.post('/profesionales/validar-matricula/', { matricula: form.matricula.trim() });
      setForm((f) => ({
        ...f,
        nombre: f.nombre || data.nombre || '',
        apellido: f.apellido || data.apellido || '',
        rol: /odont/i.test(data.profesion ?? '') ? 'odontologo' : f.rol,
      }));
      toast.push('ok', `Matrícula válida: ${data.nombre ?? ''} ${data.apellido ?? ''} (${data.profesion ?? ''})`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'Matrícula no encontrada en REFEPS (podés cargarla manual)'));
    } finally {
      setValidando(false);
    }
  }

  async function guardar() {
    if (!form.email.includes('@') || !form.matricula.trim() || !form.rol) {
      toast.push('error', 'Completá email, rol y matrícula');
      return;
    }
    if (edit === 'nuevo' && form.email.toLowerCase() !== form.email2.toLowerCase()) {
      toast.push('error', 'Los correos no coinciden');
      return;
    }
    setSaving(true);
    try {
      if (edit === 'nuevo') {
        await v1Api.post('/profesionales/', { email: form.email.trim(), rol: form.rol, matricula: form.matricula.trim(), nombre: form.nombre.trim(), apellido: form.apellido.trim() });
        toast.push('ok', '¡Profesional creado! Se envió temporal por mail (72h).');
      } else {
        await v1Api.patch(`/profesionales/${(edit as any).id}/`, { email: form.email.trim(), rol: form.rol, matricula: form.matricula.trim(), nombre: form.nombre.trim(), apellido: form.apellido.trim() });
        toast.push('ok', 'Profesional actualizado');
      }
      setEdit(null);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  const [reenv, setReenv] = useState(false);

  async function reenviar() {
    if (edit === 'nuevo') return;
    setReenv(true);
    try {
      await v1Api.post(`/profesionales/${(edit as any).id}/resend-temp/`);
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
      <PageHeader title="Profesionales" backTo="/gestion-usuarios" />
      {lista.length === 0 ? (
        <EmptyState titulo="No hay profesionales" subtitulo="Creá uno para comenzar" />
      ) : (
        lista.map((p: any) => (
          <div key={p.id} style={{ marginBottom: 12 }}>
            <AppCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`${p.nombre || ''} ${p.apellido || ''}`.trim() || p.email}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>{p.email}</div>
                  <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>
                    {p.rol === 'medico' ? 'Médico' : p.rol === 'odontologo' ? 'Odontólogo' : p.rol} · Mat. {p.matricula}
                  </div>
                  {!p.is_active && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>Cuenta desactivada</div>}
                </div>
                <RowMenu
                  entries={[{ value: 'editar', label: 'Editar', icon: 'edit' }]}
                  onSelect={(v) => {
                    if (v === 'editar') abrir(p);
                  }}
                />
              </div>
            </AppCard>
          </div>
        ))
      )}
      <AppButton label="Nuevo profesional" onClick={() => abrir('nuevo')} />
      {edit && (
        <Modal title={edit === 'nuevo' ? 'Nuevo profesional' : 'Editar profesional'} saving={saving} onSave={guardar} onCancel={() => setEdit(null)}>
          <div className="info-box ok">Se enviará contraseña temporal por mail (72h).</div>
          <Field label="Email *"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {edit === 'nuevo' && (
            <Field label="Repetir email *"><TextInput type="email" value={form.email2} onChange={(e) => setForm({ ...form, email2: e.target.value })} /></Field>
          )}
          <Field label="Rol *">
            <SelectInput value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="medico">Médico</option>
              <option value="odontologo">Odontólogo</option>
            </SelectInput>
          </Field>
          <Field label="Matrícula *">
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
              </div>
              <AppButton label={validando ? '…' : 'Validar'} disabled={!form.matricula.trim()} onClick={validarMatricula} />
            </div>
          </Field>
          <Field label="Nombre" hint="Se autocompleta por matrícula">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Apellido" hint="Se autocompleta por matrícula">
            <TextInput value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </Field>
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
