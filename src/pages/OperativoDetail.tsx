import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, EmptyState, Field, MIcon, Modal, PageHeader, PostCard, SelectInput, TextInput, useToast } from '../components/ui';
import { ESTADO_LABEL } from './Operativos';

function contar(n: number, singular: string, plural?: string) {
  return `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`;
}

// Detalle espejo de operativo_detail_screen.dart: post de cabecera, botones
// según estado, tarjeta de profesionales, tarjeta de alumnos con buscador,
// filtro por curso y filas clicables.
export default function OperativoDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const [op, setOp] = useState<any>(null);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [completitud, setCompletitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAsignar, setShowAsignar] = useState(false);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [asig, setAsig] = useState({ profesional: '', rol: 'medico' });
  const [busqueda, setBusqueda] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('Todos');
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const puedeImportarCsv = can('importarNominaOperativo');

  async function cargar() {
    if (!id) return;
    setLoading(true);
    try {
      const [d, a] = await Promise.all([
        v1Api.get(`/operativos/${id}/`),
        v1Api.get(`/operativos/${id}/alumnos/`),
      ]);
      setOp(d.data);
      setAlumnos(Array.isArray(a.data) ? a.data : a.data.results ?? []);
      try {
        const c = await v1Api.get(`/operativos/${id}/completitud/`);
        setCompletitud(c.data);
      } catch {
        setCompletitud(null);
      }
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cargar el operativo'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function accionEstado(accion: 'confirmar' | 'iniciar' | 'finalizar' | 'cancelar') {
    if (!id) return;
    try {
      if (accion === 'cancelar') await v1Api.delete(`/operativos/${id}/`);
      else await v1Api.post(`/operativos/${id}/${accion}/`);
      toast.push('ok', '¡Operativo actualizado!');
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cambiar el estado'));
    }
  }

  async function abrirAsignar() {
    try {
      const { data } = await v1Api.get('/operativos/profesionales-disponibles/');
      setDisponibles(Array.isArray(data) ? data : []);
    } catch {
      setDisponibles([]);
    }
    setShowAsignar(true);
  }

  async function asignar() {
    if (!id || !asig.profesional) return;
    try {
      await v1Api.post(`/operativos/${id}/profesionales/asignar/`, {
        profesional: asig.profesional,
        rol_en_operativo: asig.rol,
      });
      toast.push('ok', 'Profesional asignado');
      setShowAsignar(false);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo asignar'));
    }
  }

  async function importarCsv(file: File) {
    if (!id) return;
    const fd = new FormData();
    fd.append('archivo', file);
    setImportando(true);
    try {
      const { data } = await v1Api.post(`/operativos/${id}/alumnos/importar-csv/`, fd);
      toast.push('ok', `Nómina importada: ${data.creados ?? '?'} creados`);
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo importar el CSV'));
    } finally {
      setImportando(false);
    }
  }

  async function exportar(formato: 'pdf' | 'excel' | 'csv') {
    if (!id) return;
    setExportando(true);
    try {
      const r = await v1Api.get(`/operativos/${id}/export/`, { params: { formato }, responseType: 'blob' });
      const ext = formato === 'pdf' ? 'pdf' : formato === 'csv' ? 'csv' : 'xlsx';
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `operativo-${id}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.push('ok', `Exportado ${formato}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo exportar'));
    } finally {
      setExportando(false);
    }
  }

  if (loading) return <AppCard>Cargando operativo…</AppCard>;
  if (!op) return <EmptyState titulo="Operativo no encontrado" />;

  const titulo = op.nombre ?? op.escuela?.nombre ?? 'Operativo';
  const profs: any[] = op.profesionales_asignados ?? [];
  const estado: string = op.estado ?? '';

  // Alumnos: filtro por curso + búsqueda + agrupado (igual que la app).
  const labelCurso = (a: any) => (a.curso_display?.trim() ? a.curso_display.trim() : 'Sin curso');
  const cursos = [...new Set(alumnos.map(labelCurso))].sort((a, b) => {
    if (a === 'Sin curso') return 1;
    if (b === 'Sin curso') return -1;
    const na = Number((a.match(/\d+/) ?? ['0'])[0]);
    const nb = Number((b.match(/\d+/) ?? ['0'])[0]);
    return na !== nb ? na - nb : a.localeCompare(b);
  });
  const q = busqueda.trim().toLowerCase();
  const filtrados = alumnos
    .filter((a) => (filtroCurso === 'Todos' ? true : labelCurso(a) === filtroCurso))
    .filter((a) =>
      q === '' ? true : `${a.nombre ?? ''} ${a.apellido ?? ''} ${a.dni ?? ''} ${a.apellido ?? ''} ${a.nombre ?? ''}`.toLowerCase().includes(q),
    );
  const grupos = new Map<string, any[]>();
  for (const a of filtrados) {
    const k = labelCurso(a);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(a);
  }
  for (const lista of grupos.values()) {
    lista.sort((a, b) =>
      String(a.apellido ?? '').localeCompare(String(b.apellido ?? '')) ||
      String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')) ||
      String(a.dni ?? '').localeCompare(String(b.dni ?? '')),
    );
  }

  const total = Number(completitud?.total_alumnos ?? 0);
  const completos = Number(completitud?.completos ?? 0);
  const puedeFinalizar = Boolean(completitud?.puede_finalizar);

  return (
    <div>
      <PageHeader title="Detalle del operativo" backTo="/operativos" />

      <PostCard
        avatarLetter={titulo}
        title={titulo}
        subtitle={`${op.fecha ?? ''} • ${op.lugar_realizacion ?? ''}`}
        bannerIcon="event_note"
        bannerChips={[
          ESTADO_LABEL[estado] ?? estado,
          contar(op.alumnos_count ?? alumnos.length, 'alumno'),
          contar(profs.length, 'profesional', 'profesionales'),
        ]}
      />

      {estado === 'confirmado' && (
        <AppCard>
          <div className="actions-row" style={{ marginTop: 0 }}>
            <AppButton label="Iniciar" onClick={() => accionEstado('iniciar')} />
            <AppButton label="Cancelar" secondary onClick={() => accionEstado('cancelar')} />
          </div>
        </AppCard>
      )}

      {estado === 'en_curso' && (
        <>
          <AppCard>
            <h3>{completos}/{total} alumnos completos</h3>
            {!puedeFinalizar && <div className="hint">Faltan evaluaciones para finalizar</div>}
          </AppCard>
          <AppCard>
            <div className="actions-row" style={{ marginTop: 0 }}>
              <AppButton label="Finalizar" disabled={!puedeFinalizar} onClick={() => accionEstado('finalizar')} />
              <AppButton label="Cancelar" secondary onClick={() => accionEstado('cancelar')} />
            </div>
          </AppCard>
        </>
      )}

      {estado === 'finalizado' && (
        <AppCard>
          <h3>Operativo finalizado — Descargas</h3>
          <div className="hint">Constancias y resúmenes disponibles</div>
          <div className="actions-row">
            <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} disabled={exportando} onClick={() => exportar('pdf')}>
              <MIcon name="picture_as_pdf" /> Exportar PDF
            </button>
            <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} disabled={exportando} onClick={() => exportar('excel')}>
              <MIcon name="table_chart" /> Exportar Excel
            </button>
            <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} disabled={exportando} onClick={() => exportar('csv')}>
              <MIcon name="description" /> Exportar CSV
            </button>
          </div>
        </AppCard>
      )}

      <AppCard>
        <h3>Profesionales ({profs.length})</h3>
        {profs.length === 0 ? (
          <div className="hint">Sin profesionales asignados</div>
        ) : (
          profs.map((p: any, i: number) => {
            const nom = `${p.profesional_nombre ?? ''} ${p.profesional_apellido ?? ''}`.trim();
            return <div key={i} style={{ fontSize: 13, marginTop: 6 }}>{nom || p.profesional_email || 'Profesional'} ({p.rol_en_operativo})</div>;
          })
        )}
        {estado === 'borrador' && (
          <div className="actions-row">
            <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13 }} onClick={() => accionEstado('confirmar')}>
              <MIcon name="check_circle" /> Confirmar operativo
            </button>
            <button className="btn btn-icon" style={{ width: 'auto', height: 44, fontSize: 13, background: 'var(--campo)', color: 'var(--primario)' }} onClick={abrirAsignar}>
              <MIcon name="person_add" /> Asignar profesional
            </button>
          </div>
        )}
      </AppCard>

      <AppCard>
        <h3>Alumnos ({op.alumnos_count ?? alumnos.length})</h3>
        {puedeImportarCsv && (
          <>
            <div style={{ fontSize: 13, margin: '8px 0' }}>Importar nómina desde CSV</div>
            <label className="btn" style={{ width: 'auto', height: 44, fontSize: 13, cursor: 'pointer', opacity: importando ? 0.5 : 1 }}>
              {importando ? 'Importando…' : 'Seleccionar archivo CSV'}
              <input
                type="file"
                accept=".csv"
                hidden
                disabled={importando}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importarCsv(f);
                  e.target.value = '';
                }}
              />
            </label>
          </>
        )}
        <div style={{ height: 12 }} />
        {alumnos.length === 0 ? (
          <div className="hint">Aún no hay alumnos cargados.</div>
        ) : (
          <>
            <div className="search-row">
              <Field label="Buscar alumno">
                <TextInput placeholder="Nombre, apellido o DNI" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </Field>
              <Field label="Curso">
                <SelectInput value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}>
                  <option value="Todos">Todos los cursos</option>
                  {cursos.map((c) => <option key={c} value={c}>{c}</option>)}
                </SelectInput>
              </Field>
            </div>
            {q !== '' && <div className="hint">{filtrados.length} resultado(s) para "{busqueda}"</div>}
            {filtrados.length === 0 ? (
              <div className="hint" style={{ textAlign: 'center' }}>
                {q !== '' ? `Sin resultados para "${busqueda}"` : 'Sin alumnos en este filtro'}
              </div>
            ) : (
              [...grupos.entries()].map(([curso, lista]) => (
                <div key={curso}>
                  <div className="curso-header">
                    <MIcon name="menu_book" /> {curso} ({lista.length})
                  </div>
                  {lista.map((a: any) => (
                    <Link key={a.id} to={`/operativos/${id}/alumnos/${a.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 8 }}>
                      <AppCard>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {[a.apellido, a.nombre].filter(Boolean).join(', ')}
                            </div>
                            {a.dni && <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)' }}>DNI {a.dni}</div>}
                          </div>
                          <span className={`badge ${a.completo ? 'ok' : ''}`}>{a.completo ? 'Completo' : 'Pendiente'}</span>
                          <MIcon name="chevron_right" />
                        </div>
                      </AppCard>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </AppCard>

      {showAsignar && (
        <Modal title="Asignar profesional" saveLabel="Asignar" onSave={asignar} onCancel={() => setShowAsignar(false)}>
          <Field label="Profesional">
            <SelectInput value={asig.profesional} onChange={(e) => setAsig({ ...asig, profesional: e.target.value })}>
              <option value="">Elegí…</option>
              {disponibles.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {`${p.nombre || ''} ${p.apellido || ''}`.trim() || p.email}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Rol en el operativo">
            <SelectInput value={asig.rol} onChange={(e) => setAsig({ ...asig, rol: e.target.value })}>
              <option value="medico">Médico</option>
              <option value="odontologo">Odontólogo</option>
              <option value="ayudante">Ayudante</option>
            </SelectInput>
          </Field>
        </Modal>
      )}
    </div>
  );
}
