import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, EmptyState, Field, MIcon, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

// Fila compacta espejo del listado de alumnos del operativo: nombre, DNI,
// insignia y ›. El detalle completo (y pendientes) vive en AlumnoEscuelaDetail.
function AlumnoRow({ alumno: a, escuelaId }: { alumno: any; escuelaId?: string }) {
  const persona = a.persona ?? {};
  const nombre = [persona.apellido ?? a.apellido, persona.nombre ?? a.nombre].filter(Boolean).join(', ');
  const dni = persona.dni ?? a.dni ?? '';
  const tipoDni = persona.tipo_dni ?? 'DNI';
  const to = escuelaId
    ? `/escuelas/alumnos/${a.id}?escuelaId=${escuelaId}`
    : `/escuelas/alumnos/${a.id}`;
  return (
    <div style={{ marginBottom: 12 }}>
      <AppCard>
        <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nombre}
            </div>
            {dni && <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{tipoDni} {dni}</div>}
          </div>
          <span className={`badge ${a.tutor ? 'ok' : ''}`}>{a.tutor ? 'Completo' : 'Pendiente'}</span>
          <MIcon name="chevron_right" />
        </Link>
      </AppCard>
    </div>
  );
}

export default function AlumnosEscuela() {
  const { escuelaId } = useParams();
  const [sp] = useSearchParams();
  const toast = useToast();
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(sp.get('registrar') === '1');
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', fecha_nacimiento: '', sexo: '', edad: '', curso_id: '', operativo_id: '' });
  const [tutor, setTutor] = useState({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', parentesco: '', sexo: '', fecha_nacimiento: '' });
  const [cursos, setCursos] = useState<any[]>([]);
  const [operativos, setOperativos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [validando, setValidando] = useState<string | null>(null);
  // null = pendiente de validar (campos bloqueados), 'ok' | 'manual'.
  const [valA, setValA] = useState<string | null>(null);
  const [valT, setValT] = useState<string | null>(null);

  // Valida el DNI en RENAPER y autocompleta. Si no existe (404) o el
  // servicio falla, habilita igual para carga manual.
  async function validarRena(per: 'alumno' | 'tutor') {
    const esTutor = per === 'tutor';
    const dni = (esTutor ? tutor.dni : form.dni).trim();
    const sexo = esTutor ? tutor.sexo : form.sexo;
    const tipo = esTutor ? tutor.tipo_dni : form.tipo_dni;
    if (!dni) {
      toast.push('error', 'Ingresá el DNI primero');
      return;
    }
    setValidando(per);
    try {
      const params = new URLSearchParams({ dni, ...(sexo ? { sexo } : {}), ...(tipo ? { tipo_dni: tipo } : {}) });
      const { data } = await v1Api.get(`/validar-dni/?${params}`);
      const d: any = data?.persona ?? data ?? {};
      const apellido = d.apellido ?? d.apellidos ?? d.lastName ?? '';
      const nombres = d.nombres ?? d.nombre ?? d.firstName ?? '';
      const fecha = d.fecha_nacimiento ?? d.fechaNacimiento ?? d.fecha_nac ?? d.f_nac ?? '';
      const sx = String(d.sexo ?? d.idSexo ?? '').toUpperCase();
      const sexoUi = sx === 'M' || sx === 'MASCULINO' || sx === '1' ? 'masculino' : sx === 'F' || sx === 'FEMENINO' || sx === '2' ? 'femenino' : '';
      if (esTutor) {
        setTutor((t) => ({
          ...t,
          ...(apellido ? { apellido: String(apellido) } : {}),
          ...(nombres ? { nombre: String(nombres) } : {}),
          ...(sexoUi ? { sexo: sexoUi } : {}),
          ...(fecha ? { fecha_nacimiento: String(fecha).slice(0, 10) } : {}),
        }));
        setValT('ok');
      } else {
        setForm((f) => ({
          ...f,
          ...(apellido ? { apellido: String(apellido) } : {}),
          ...(nombres ? { nombre: String(nombres) } : {}),
          ...(sexoUi ? { sexo: sexoUi } : {}),
          ...(fecha ? { fecha_nacimiento: String(fecha).slice(0, 10) } : {}),
        }));
        setValA('ok');
      }
      toast.push('ok', 'Datos de RENAPER cargados');
    } catch (e: any) {
      const manual = e?.response?.status === 404;
      if (esTutor) setValT('manual');
      else setValA('manual');
      toast.push(
        manual ? 'info' : 'error',
        manual
          ? 'No está en RENAPER: cargá los datos manual'
          : apiErrorMessage(e, 'Sin conexión con RENAPER: cargá manual'),
      );
    } finally {
      setValidando(null);
    }
  }

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
    setTutor({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', parentesco: '', sexo: '', fecha_nacimiento: '' });
    setValA(null);
    setValT(null);
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

  function tutorIncompleto(t: typeof tutor) {
    return ![t.nombre, t.apellido, t.dni, t.parentesco, t.sexo, t.fecha_nacimiento].every((v) => v.trim() !== '');
  }

  function tutorPayload(t: typeof tutor) {
    if (!t.nombre.trim() && !t.apellido.trim() && !t.dni.trim() && !t.parentesco && !t.sexo && !t.fecha_nacimiento) return undefined;
    return {
      persona: {
        nombre: t.nombre.trim(), apellido: t.apellido.trim(), dni: t.dni.trim(),
        tipo_dni: t.tipo_dni || 'DNI', sexo: t.sexo || 'otro', fecha_nacimiento: t.fecha_nacimiento || undefined,
      },
      parentesco: t.parentesco || 'madre',
    };
  }

  async function crear() {
    if (!form.dni.trim() || !form.operativo_id) {
      toast.push('error', 'Completá DNI y operativo');
      return;
    }
    if (!valA) {
      toast.push('error', 'Validá el DNI del alumno primero');
      return;
    }
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.push('error', 'Completá nombre y apellido');
      return;
    }
    if (!valT) {
      toast.push('error', 'Validá el DNI del tutor primero');
      return;
    }
    if (tutorIncompleto(tutor)) {
      toast.push('error', 'Completá todos los datos del tutor (obligatorio)');
      return;
    }
    const tp = tutorPayload(tutor);
    setSaving(true);
    try {
      await v1Api.post('/alumnos/', {
        persona: { nombre: form.nombre.trim(), apellido: form.apellido.trim(), dni: form.dni.trim(), tipo_dni: form.tipo_dni || 'DNI', sexo: form.sexo || 'otro', fecha_nacimiento: form.fecha_nacimiento || undefined },
        edad: form.edad ? Number(form.edad) : 0,
        ...(form.curso_id ? { curso_id: form.curso_id } : {}),
        operativo_id: form.operativo_id,
        ...(tp ? { tutor: tp } : {}),
      });
      toast.push('ok', '¡Alumno registrado!');
      setShowNew(false);
      setTutor({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', parentesco: '', sexo: '', fecha_nacimiento: '' });
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
        <>
          {alumnos.some((a: any) => !a.tutor) && (
            <>
              <div className="group-title">DATOS PENDIENTES</div>
              {alumnos.filter((a: any) => !a.tutor).map((a: any) => (
                <AlumnoRow key={a.id} alumno={a} escuelaId={escuelaId} />
              ))}
            </>
          )}
          <div className="group-title">ALUMNOS</div>
          {alumnos.filter((a: any) => a.tutor).map((a: any) => (
            <AlumnoRow key={a.id} alumno={a} escuelaId={escuelaId} />
          ))}
        </>
      )}
      {showNew && (
        <Modal title="Registrar alumno" saving={saving} onSave={crear} onCancel={() => setShowNew(false)}>
          <Field label="Tipo de documento *">
            <SelectInput value={form.tipo_dni} onChange={(e) => setForm({ ...form, tipo_dni: e.target.value })}>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
            </SelectInput>
          </Field>
          <Field label="DNI *">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextInput value={form.dni} onChange={(e) => { setForm({ ...form, dni: e.target.value }); setValA(null); }} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <AppButton label={validando === 'alumno' ? '…' : 'Validar'} disabled={!form.dni.trim() || validando !== null} onClick={() => validarRena('alumno')} />
              </div>
            </div>
            {!valA && <span className="hint">Validá el DNI para autocompletar. Si no está en RENAPER, igual podés cargar manual.</span>}
          </Field>
          <Field label="Nombre *"><TextInput value={form.nombre} disabled={!valA} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Apellido *"><TextInput value={form.apellido} disabled={!valA} onChange={(e) => setForm({ ...form, apellido: e.target.value })} /></Field>
          <Field label="Fecha de nacimiento *"><TextInput type="date" value={form.fecha_nacimiento} disabled={!valA} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} /></Field>
          <Field label="Sexo *">
            <SelectInput value={form.sexo} disabled={!valA} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
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
          <div className="info-box">Adulto responsable (obligatorio)</div>
          <Field label="Tipo de documento del tutor">
            <SelectInput value={tutor.tipo_dni} onChange={(e) => setTutor({ ...tutor, tipo_dni: e.target.value })}>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
            </SelectInput>
          </Field>
          <Field label="DNI del tutor">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextInput value={tutor.dni} onChange={(e) => { setTutor({ ...tutor, dni: e.target.value }); setValT(null); }} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <AppButton label={validando === 'tutor' ? '…' : 'Validar'} disabled={!tutor.dni.trim() || validando !== null} onClick={() => validarRena('tutor')} />
              </div>
            </div>
            {!valT && <span className="hint">Validá el DNI para autocompletar. Si no está en RENAPER, igual podés cargar manual.</span>}
          </Field>
          <Field label="Nombre del tutor"><TextInput value={tutor.nombre} disabled={!valT} onChange={(e) => setTutor({ ...tutor, nombre: e.target.value })} /></Field>
          <Field label="Apellido del tutor"><TextInput value={tutor.apellido} disabled={!valT} onChange={(e) => setTutor({ ...tutor, apellido: e.target.value })} /></Field>
          <Field label="Parentesco">
            <SelectInput value={tutor.parentesco} disabled={!valT} onChange={(e) => setTutor({ ...tutor, parentesco: e.target.value })}>
              <option value="">…</option>
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="tutor_legal">Tutor/a legal</option>
              <option value="otro">Otro</option>
            </SelectInput>
          </Field>
          <Field label="Sexo del tutor">
            <SelectInput value={tutor.sexo} disabled={!valT} onChange={(e) => setTutor({ ...tutor, sexo: e.target.value })}>
              <option value="">…</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </SelectInput>
          </Field>
          <Field label="Fecha de nacimiento del tutor"><TextInput type="date" value={tutor.fecha_nacimiento} disabled={!valT} onChange={(e) => setTutor({ ...tutor, fecha_nacimiento: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
