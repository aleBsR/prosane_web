import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppCard, Field, MIcon, PageHeader, PostCard, SelectInput, useToast } from '../components/ui';

export default function AlumnoDetail() {
  const { opId, alumnoId } = useParams();
  const { can, usuario } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [alumno, setAlumno] = useState<any>(null);
  const [estadoOp, setEstadoOp] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!opId || !alumnoId) return;
    setLoading(true);
    try {
      const [op, lista] = await Promise.all([
        v1Api.get(`/operativos/${opId}/`),
        v1Api.get(`/operativos/${opId}/alumnos/`),
      ]);
      setEstadoOp(op.data.estado ?? '');
      const found = (Array.isArray(lista.data) ? lista.data : lista.data.results ?? []).find(
        (a: any) => String(a.id) === alumnoId,
      );
      setAlumno(found ?? null);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar el alumno'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  async function cambiarEstado(v: string) {
    if (!opId || !alumnoId) return;
    try {
      await v1Api.patch(`/operativos/${opId}/alumnos/${alumnoId}/`, { estado: v });
      toast.push('ok', `Asistencia: ${v}`);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo actualizar la asistencia'));
    }
  }

  if (loading) return <AppCard>Cargando alumno…</AppCard>;
  if (!alumno) return <AppCard>Alumno no encontrado</AppCard>;

  const estado: string = alumno.estado ?? 'pendiente';
  const esAusente = estado === 'ausente';
  const esEvaluado = estado === 'evaluado';
  const esPresente = estado === 'presente';
  const enCurso = estadoOp === 'en_curso';
  const mutable = estadoOp !== 'finalizado' && estadoOp !== 'cancelado';
  const puedeVerOModificar = (esPresente || esEvaluado) && mutable;
  const rol = usuario?.rolName ?? '';
  const puedeEstado =
    (can('gestionarEstadoAlumnoEnOperativo') || rol === 'superadmin') && mutable;

  const medicaHecha = !!alumno.medica_completada;
  const odontoHecha = !!alumno.odontologica_completada;
  const escuelaHecha = !!alumno.escuela_completado;
  const datosHechos = !!alumno.antecedentes_completado;

  const btn = (icono: string, texto: string, to: string) => (
    <button key={to} className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} onClick={() => nav(to)}>
      <MIcon name={icono} /> {texto}
    </button>
  );

  const puedeConstancia =
    estadoOp === 'finalizado' &&
    (alumno.completo || esAusente || esEvaluado) &&
    (can('verOperativo') || rol === 'superadmin');
  const puedeVerFicha =
    (estadoOp === 'finalizado' || enCurso) &&
    (alumno.completo || esAusente || esEvaluado) &&
    (can('verOperativo') || can('cargarAntecedentesNino') || rol === 'superadmin');

  return (
    <div>
      <PageHeader title="Detalle del alumno" backTo={`/operativos/${opId}`} />
      <PostCard
        avatarLetter={alumno.nombre || alumno.apellido}
        title={[alumno.apellido, alumno.nombre].filter(Boolean).join(', ')}
        subtitle={[alumno.dni ? `DNI ${alumno.dni}` : '', alumno.curso_display].filter(Boolean).join(' • ')}
        trailing={
          <span className={`badge ${alumno.completo ? 'ok' : ''}`}>
            {alumno.completo ? 'Completo' : 'Pendiente'}
          </span>
        }
        menuEntries={[
          ...(puedeConstancia ? [{ value: 'constancia', label: 'Constancia PDF', icon: 'picture_as_pdf' }] : []),
          ...(puedeVerFicha ? [{ value: 'datos', label: 'Ver datos', icon: 'visibility' }] : []),
        ]}
        onMenuSelected={(v) => nav(v)}
        body={
          <>
            {(esPresente || esEvaluado) && (
              <div style={{ marginBottom: 8 }}>
                <span className={`chip ${escuelaHecha ? 'ok' : ''}`}>{escuelaHecha ? 'E ✓' : 'E'}</span>
                <span className={`chip ${datosHechos ? 'ok' : ''}`}>{datosHechos ? 'A ✓' : 'A'}</span>
                <span className={`chip ${medicaHecha ? 'ok' : ''}`}>{medicaHecha ? 'M ✓' : 'M'}</span>
                <span className={`chip ${odontoHecha ? 'ok' : ''}`}>{odontoHecha ? 'O ✓' : 'O'}</span>
              </div>
            )}
            {esAusente && <p style={{ fontSize: 12, fontStyle: 'italic' }}>Ausente — no requiere evaluaciones</p>}
            {puedeEstado && !esEvaluado ? (
              <Field label="Asistencia">
                <SelectInput value={['pendiente', 'presente', 'ausente'].includes(estado) ? estado : 'pendiente'} onChange={(e) => cambiarEstado(e.target.value)}>
                  <option value="pendiente">Pendiente</option>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                </SelectInput>
              </Field>
            ) : (
              <div style={{ fontSize: 13 }}>Asistencia: <strong>{estado}</strong></div>
            )}
            {estadoOp !== 'finalizado' && !esPresente && !esAusente && !esEvaluado && (
              <div className="hint">Marcá como Presente para habilitar la carga</div>
            )}
          </>
        }
        actions={
          puedeVerOModificar ? (
            <>
              {can('cargarEvaluacionMedica') && enCurso && btn(medicaHecha ? 'visibility' : 'medical_services', medicaHecha ? 'Ver / editar eval. médica' : 'Evaluación médica', 'medica')}
              {can('cargarEvaluacionOdontologica') && enCurso && btn(odontoHecha ? 'visibility' : 'health_and_safety', odontoHecha ? 'Ver / editar eval. odonto.' : 'Eval. odontológica', 'odontologica')}
              {can('cargarSeccionEscuela') && btn(escuelaHecha ? 'visibility' : 'school', escuelaHecha ? 'Ver / editar sec. escuela' : 'Sección escuela', 'escuela')}
              {(can('cargarAntecedentesNino') || rol === 'superadmin') && btn(datosHechos ? 'visibility' : 'family_restroom', datosHechos ? 'Ver / editar datos' : 'Datos de Alumno', 'datos')}
            </>
          ) : undefined
        }
      />
    </div>
  );
}
