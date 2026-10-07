import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, MIcon, Modal, PageHeader, PostCard, SelectInput, TextInput, useToast } from '../components/ui';

// Detalle del alumno de escuela, espejo de AlumnoDetail (operativo):
// post de cabecera con datos en la franja y carga de pendientes adentro.
export default function AlumnoEscuelaDetail() {
  const { alumnoId } = useParams();
  const [sp] = useSearchParams();
  const escuelaId = sp.get('escuelaId') ?? '';
  const toast = useToast();
  const [alumno, setAlumno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTutor, setShowTutor] = useState(false);
  const [tutor, setTutor] = useState({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', parentesco: '', sexo: '', fecha_nacimiento: '' });
  const [saving, setSaving] = useState(false);
  const [validando, setValidando] = useState(false);
  const [valT, setValT] = useState<string | null>(null);

  async function validarTutor() {
    if (!tutor.dni.trim()) {
      toast.push('error', 'Ingresá el DNI primero');
      return;
    }
    setValidando(true);
    try {
      const params = new URLSearchParams({ dni: tutor.dni.trim(), ...(tutor.sexo ? { sexo: tutor.sexo } : {}), tipo_dni: tutor.tipo_dni || 'DNI' });
      const { data } = await v1Api.get(`/validar-dni/?${params}`);
      const d: any = data?.persona ?? data ?? {};
      const apellido = d.apellido ?? d.apellidos ?? d.lastName ?? '';
      const nombres = d.nombres ?? d.nombre ?? d.firstName ?? '';
      const fecha = d.fecha_nacimiento ?? d.fechaNacimiento ?? d.fecha_nac ?? d.f_nac ?? '';
      const sx = String(d.sexo ?? d.idSexo ?? '').toUpperCase();
      const sexoUi = sx === 'M' || sx === 'MASCULINO' || sx === '1' ? 'masculino' : sx === 'F' || sx === 'FEMENINO' || sx === '2' ? 'femenino' : '';
      setTutor((t) => ({
        ...t,
        ...(apellido ? { apellido: String(apellido) } : {}),
        ...(nombres ? { nombre: String(nombres) } : {}),
        ...(sexoUi ? { sexo: sexoUi } : {}),
          ...(fecha ? { fecha_nacimiento: String(fecha).slice(0, 10) } : {}),
        }));
      setValT('ok');
      toast.push('ok', 'Datos de RENAPER cargados');
    } catch (e: any) {
      const manual = e?.response?.status === 404;
      setValT('manual');
      toast.push(
        manual ? 'info' : 'error',
        manual
          ? 'No está en RENAPER: cargá los datos manual'
          : apiErrorMessage(e, 'Sin conexión con RENAPER: cargá manual'),
      );
    } finally {
      setValidando(false);
    }
  }

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await v1Api.get('/alumnos/');
      const lista = Array.isArray(data) ? data : data.results ?? [];
      setAlumno(lista.find((a: any) => String(a.id) === alumnoId) ?? null);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar el alumno'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId]);

  async function guardarTutor() {
    if (!alumno) return;
    if (!valT) {
      toast.push('error', 'Validá el DNI del tutor primero');
      return;
    }
    if ([tutor.nombre, tutor.apellido, tutor.dni, tutor.parentesco, tutor.sexo, tutor.fecha_nacimiento].some((v) => !v.trim())) {
      toast.push('error', 'Completá todos los datos del tutor');
      return;
    }
    setSaving(true);
    try {
      await v1Api.post(`/alumnos/${alumno.id}/tutor/`, {
        persona: {
          nombre: tutor.nombre.trim(), apellido: tutor.apellido.trim(), dni: tutor.dni.trim(),
          tipo_dni: tutor.tipo_dni || 'DNI', sexo: tutor.sexo, fecha_nacimiento: tutor.fecha_nacimiento,
        },
        parentesco: tutor.parentesco,
      });
      toast.push('ok', 'Tutor vinculado');
      setShowTutor(false);
      setTutor({ nombre: '', apellido: '', dni: '', tipo_dni: 'DNI', parentesco: '', sexo: '', fecha_nacimiento: '' });
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo vincular'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando alumno…</AppCard>;
  if (!alumno) return <AppCard>Alumno no encontrado</AppCard>;

  const persona = alumno.persona ?? {};
  const nombre = [persona.apellido, persona.nombre].filter(Boolean).join(', ');
  const tieneTutor = !!alumno.tutor;
  const tel = [alumno.celular ? `Cel: ${alumno.celular}` : '', alumno.telefono_fijo ? `Tel: ${alumno.telefono_fijo}` : ''].filter(Boolean).join(' • ');
  const cobertura = [alumno.tipo_cobertura, alumno.nombre_cobertura].filter(Boolean).join(' — ');

  return (
    <div>
      <PageHeader title="Detalle del alumno" backTo={escuelaId ? `/escuelas/${escuelaId}/alumnos` : '/escuelas/alumnos'} />
      <PostCard
        avatarLetter={persona.nombre || persona.apellido}
        title={nombre}
        subtitle={[persona.dni ? `${persona.tipo_dni ?? 'DNI'} ${persona.dni}` : '', alumno.escuela_nombre].filter(Boolean).join(' • ')}
        trailing={
          <span className={`badge ${tieneTutor ? 'ok' : ''}`}>
            {tieneTutor ? 'Completo' : 'Pendiente'}
          </span>
        }
        bannerIcon="person_outline"
        bannerTop={
          <>
            <div style={{ fontSize: 13 }}>Fecha de nacimiento: <strong>{persona.fecha_nacimiento ?? ''}</strong></div>
            <div style={{ fontSize: 13 }}>Edad: <strong>{alumno.edad ?? ''}</strong> · Sexo: <strong>{persona.sexo ?? ''}</strong></div>
            {alumno.domicilio?.localidad && <div style={{ fontSize: 13 }}>Localidad: <strong>{alumno.domicilio.localidad}</strong></div>}
            {tel && <div style={{ fontSize: 13 }}>{tel}</div>}
            {cobertura && <div style={{ fontSize: 13 }}>Cobertura: <strong>{cobertura}</strong></div>}
            {alumno.tiene_cud && <div style={{ fontSize: 13 }}>CUD: <strong>{alumno.tiene_cud}</strong></div>}
          </>
        }
        bannerChips={
          tieneTutor
            ? [`Tutor: ${[alumno.tutor.apellido, alumno.tutor.nombre].filter(Boolean).join(', ')}`, `DNI ${alumno.tutor.dni ?? ''}`]
            : []
        }
        bannerBottom={
          !tieneTutor ? (
            <button className="post-action-btn" onClick={() => setShowTutor(true)}>
              <MIcon name="family_restroom" size={16} /> Agregar tutor
            </button>
          ) : undefined
        }
      />
      {showTutor && (
        <Modal title="Agregar tutor" saveLabel="Vincular" saving={saving} onSave={guardarTutor} onCancel={() => setShowTutor(false)}>
          <Field label="Tipo de documento *">
            <SelectInput value={tutor.tipo_dni} onChange={(e) => setTutor({ ...tutor, tipo_dni: e.target.value })}>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
            </SelectInput>
          </Field>
          <Field label="DNI *">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextInput value={tutor.dni} onChange={(e) => { setTutor({ ...tutor, dni: e.target.value }); setValT(null); }} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <AppButton label={validando ? '…' : 'Validar'} disabled={!tutor.dni.trim() || validando} onClick={validarTutor} />
              </div>
            </div>
            {!valT && <span className="hint">Validá el DNI para autocompletar. Si no está en RENAPER, igual podés cargar manual.</span>}
          </Field>
          <Field label="Nombre *"><TextInput value={tutor.nombre} disabled={!valT} onChange={(e) => setTutor({ ...tutor, nombre: e.target.value })} /></Field>
          <Field label="Apellido *"><TextInput value={tutor.apellido} disabled={!valT} onChange={(e) => setTutor({ ...tutor, apellido: e.target.value })} /></Field>
          <Field label="Parentesco *">
            <SelectInput value={tutor.parentesco} disabled={!valT} onChange={(e) => setTutor({ ...tutor, parentesco: e.target.value })}>
              <option value="">…</option>
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="tutor_legal">Tutor/a legal</option>
              <option value="otro">Otro</option>
            </SelectInput>
          </Field>
          <Field label="Sexo *">
            <SelectInput value={tutor.sexo} disabled={!valT} onChange={(e) => setTutor({ ...tutor, sexo: e.target.value })}>
              <option value="">…</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </SelectInput>
          </Field>
          <Field label="Fecha de nacimiento *"><TextInput type="date" value={tutor.fecha_nacimiento} disabled={!valT} onChange={(e) => setTutor({ ...tutor, fecha_nacimiento: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
