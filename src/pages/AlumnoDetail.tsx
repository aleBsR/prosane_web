import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppCard, MIcon, PageHeader, PostCard, useToast } from '../components/ui';

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
    <button key={to} className="post-action-btn" onClick={() => nav(to)}>
      <MIcon name={icono} size={16} /> {texto}
    </button>
  );

  const estadoKey = ['pendiente', 'presente', 'ausente', 'evaluado'].includes(estado)
    ? estado
    : 'pendiente';
  const estadoLabel =
    estadoKey === 'presente' ? 'Presente'
    : estadoKey === 'ausente' ? 'Ausente'
    : estadoKey === 'evaluado' ? 'Evaluado'
    : 'Pendiente';

  const puedeConstancia =
    estadoOp === 'finalizado' &&
    (alumno.completo || esAusente || esEvaluado) &&
    (can('verOperativo') || rol === 'superadmin');

  async function descargarPlanilla() {
    if (!opId || !alumnoId) return;
    try {
      const r = await v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/planilla/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `planilla-${alumno.dni || alumnoId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.push('ok', 'Planilla descargada');
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo generar (solo en operativo finalizado)'));
    }
  }
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
        body={undefined}
        menuEntries={[
          ...(puedeConstancia ? [{ value: 'planilla', label: 'Planilla PDF', icon: 'description' }] : []),
          ...(puedeVerFicha ? [{ value: 'datos', label: 'Ver datos', icon: 'visibility' }] : []),
        ]}
        onMenuSelected={(v) => {
          if (v === 'planilla') descargarPlanilla();
          else if (v === 'datos') nav(`${v}?soloLectura=1`);
          else nav(v);
        }}
        bannerIcon="person_outline"
        bannerTop={
          <>
            {puedeEstado && !esEvaluado ? (
              <div className="asistencia-row">
                <MIcon name="how_to_reg" size={14} />
                <span>Asistencia:</span>
                <select
                  className={`asistencia-select asistencia-select--${estadoKey}`}
                  value={estadoKey}
                  onChange={(e) => cambiarEstado(e.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                </select>
              </div>
            ) : (
              <div className="asistencia-row">
                <span className={`estado-pill estado-pill--${estadoKey}`}>
                  <MIcon name="how_to_reg" size={12} /> {estadoLabel}
                </span>
              </div>
            )}
            {esAusente && <p className="ausente-note">Ausente — no requiere evaluaciones</p>}
            {estadoOp !== 'finalizado' && !esPresente && !esAusente && !esEvaluado && (
              <div className="carga-hint">Marcá como Presente para habilitar la carga</div>
            )}
          </>
        }
        bannerChips={
          esPresente || esEvaluado
            ? [
                <span key="e" className={`tilde-chip ${escuelaHecha ? 'tilde-ok' : ''}`}>{escuelaHecha ? 'E ✓' : 'E'}</span>,
                <span key="a" className={`tilde-chip ${datosHechos ? 'tilde-ok' : ''}`}>{datosHechos ? 'A ✓' : 'A'}</span>,
                <span key="m" className={`tilde-chip ${medicaHecha ? 'tilde-ok' : ''}`}>{medicaHecha ? 'M ✓' : 'M'}</span>,
                <span key="o" className={`tilde-chip ${odontoHecha ? 'tilde-ok' : ''}`}>{odontoHecha ? 'O ✓' : 'O'}</span>,
              ]
            : []
        }
        bannerBottom={
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
