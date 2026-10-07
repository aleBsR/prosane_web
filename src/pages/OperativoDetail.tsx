import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppCard, EmptyState, Field, MIcon, Modal, PageHeader, PostCard, SelectInput, TextInput, useToast } from '../components/ui';
import { ESTADO_LABEL } from './Operativos';

function contar(n: number, singular: string, plural?: string) {
  return `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`;
}

type AccionEstado = 'confirmar' | 'iniciar' | 'finalizar' | 'cancelar';

// Textos del modal de confirmación (espejo del móvil). Los botones son
// Sí/No para que sirva en general sin malinterpretarse.
const CONFIRMAR_TEXTO: Record<AccionEstado, { titulo: string; mensaje: string }> = {
  confirmar: {
    titulo: '¿Confirmar operativo?',
    mensaje: 'El operativo pasará a Confirmado y quedará listo para iniciar.',
  },
  iniciar: {
    titulo: '¿Iniciar operativo?',
    mensaje: 'El operativo pasará a En curso y se habilitará la carga de evaluaciones.',
  },
  finalizar: {
    titulo: '¿Finalizar operativo?',
    mensaje: 'El operativo se cerrará y ya no se podrán cargar evaluaciones.',
  },
  cancelar: {
    titulo: '¿Cancelar operativo?',
    mensaje: 'El operativo se cancelará. Esta acción no se puede deshacer.',
  },
};

// Detalle espejo de operativo_detail_screen.dart: post de cabecera, botones
// según estado, tarjeta de profesionales, tarjeta de alumnos con buscador,
// filtro por curso y filas clicables.
export default function OperativoDetail() {
  const { id } = useParams();
  const { can, usuario } = useAuth();
  const esSuper = usuario?.rolName === 'superadmin';
  const nav = useNavigate();
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
  const [pendiente, setPendiente] = useState<AccionEstado | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: '', fecha: '', lugar_realizacion: 'escuela', notas: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

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

  async function accionEstado(accion: AccionEstado) {
    if (!id) return;
    try {
      if (accion === 'cancelar') await v1Api.delete(`/operativos/${id}/`);
      else await v1Api.post(`/operativos/${id}/${accion}/`);
      toast.push('ok', '¡Operativo actualizado!');
      cargar();
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cambiar el estado'));
    } finally {
      setPendiente(null);
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

  async function abrirEdicion() {
    setForm({
      nombre: op?.nombre ?? '',
      fecha: op?.fecha ?? '',
      lugar_realizacion: op?.lugar_realizacion ?? 'escuela',
      notas: op?.notas ?? '',
    });
    setEditing(true);
  }

  async function guardarEdicion() {
    if (!id) return;
    if (!form.fecha) {
      toast.push('error', 'La fecha es obligatoria');
      return;
    }
    setSaving(true);
    try {
      await v1Api.patch(`/operativos/${id}/`, {
        ...(form.nombre.trim() ? { nombre: form.nombre.trim() } : { nombre: '' }),
        fecha: form.fecha,
        lugar_realizacion: form.lugar_realizacion,
        notas: form.notas,
      });
      toast.push('ok', 'Operativo actualizado');
      setEditing(false);
      cargar();
    } catch (e) {
      // El backend responde 409 si está finalizado o cancelado.
      toast.push('error', apiErrorMessage(e, 'No se pudo editar'));
    } finally {
      setSaving(false);
    }
  }

  async function eliminar() {
    if (!id) return;
    try {
      await v1Api.delete(`/operativos/${id}/`);
      toast.push('ok', 'Operativo cancelado');
      // replace: no dejar el detalle del operativo cancelado en el
      // historial (igual que al eliminar una escuela).
      nav('/operativos', { replace: true });
    } catch (e) {
      // El backend responde 409 si ya está finalizado o cancelado.
      toast.push('error', apiErrorMessage(e, 'No se pudo eliminar'));
      setConfirmDel(false);
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

  // Editar/Eliminar (igual que en escuelas): solo con permiso y si el
  // operativo sigue editable (el backend responde 409 en finalizado o
  // cancelado). Eliminar cancela el operativo (DELETE).
  const editable = estado !== 'finalizado' && estado !== 'cancelado';
  const puedeEditar = (can('editarOperativo') || esSuper) && editable;
  const puedeEliminar = (can('cancelarOperativo') || esSuper) && editable;

  const estadoBtn = (texto: string, accion: AccionEstado, disabled?: boolean) => (
    <button key={texto} className="post-action-btn" disabled={disabled} onClick={() => setPendiente(accion)}>
      {texto}
    </button>
  );

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
        bannerBottom={
          <>
            {estado === 'borrador' && (can('confirmarOperativo') || esSuper) && estadoBtn('Confirmar operativo', 'confirmar')}
            {estado === 'confirmado' && (
              <>
                {(can('iniciarOperativo') || esSuper) && estadoBtn('Iniciar', 'iniciar')}
                {(can('cancelarOperativo') || esSuper) && estadoBtn('Cancelar', 'cancelar')}
              </>
            )}
            {estado === 'en_curso' && (
              <>
                {(can('finalizarOperativo') || esSuper) && estadoBtn('Finalizar', 'finalizar', !puedeFinalizar)}
                {(can('cancelarOperativo') || esSuper) && estadoBtn('Cancelar', 'cancelar')}
              </>
            )}
          </>
        }
        menuEntries={[
          ...(puedeEditar ? [{ value: 'editar', label: 'Editar', icon: 'edit' }] : []),
          ...(puedeEliminar ? [{ value: 'eliminar', label: 'Eliminar', icon: 'delete', danger: true }] : []),
        ]}
        onMenuSelected={(v) => {
          if (v === 'editar') abrirEdicion();
          if (v === 'eliminar') setConfirmDel(true);
        }}
      />

      {estado === 'en_curso' && (
        <AppCard>
          <h3>{completos}/{total} alumnos completos</h3>
          {!puedeFinalizar && <div className="hint">Faltan evaluaciones para finalizar</div>}
        </AppCard>
      )}

      <AppCard>
        <h3>Derivaciones</h3>
        <div className="hint">Derivaciones generadas en las evaluaciones (Anexo I)</div>
        <div className="actions-row">
          <button className="post-action-btn post-action-btn--secondary" onClick={() => nav(`/operativos/${id}/derivaciones`)}>
            <MIcon name="medical_services" size={16} /> Ver derivaciones
          </button>
        </div>
      </AppCard>

      {estado === 'finalizado' && (
        <AppCard>
          <h3>Operativo finalizado — Descargas</h3>
          <div className="hint">Constancias y resúmenes disponibles</div>
          <div className="actions-row">
            <button className="post-action-btn" disabled={exportando} onClick={() => exportar('pdf')}>
              <MIcon name="picture_as_pdf" size={16} /> Exportar PDF
            </button>
            <button className="post-action-btn" disabled={exportando} onClick={() => exportar('excel')}>
              <MIcon name="table_chart" size={16} /> Exportar Excel
            </button>
            <button className="post-action-btn" disabled={exportando} onClick={() => exportar('csv')}>
              <MIcon name="description" size={16} /> Exportar CSV
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
            <button className="post-action-btn post-action-btn--secondary" onClick={abrirAsignar}>
              <MIcon name="person_add" size={16} /> Asignar profesional
            </button>
          </div>
        )}
      </AppCard>

      <AppCard>
        <h3>Alumnos ({op.alumnos_count ?? alumnos.length})</h3>
        {puedeImportarCsv && estado === 'borrador' && (
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
                            {a.dni && <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>DNI {a.dni}</div>}
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

      {pendiente && (
        <Modal
          title={CONFIRMAR_TEXTO[pendiente].titulo}
          saveLabel="Sí"
          cancelLabel="No"
          onSave={() => accionEstado(pendiente)}
          onCancel={() => setPendiente(null)}
        >
          <p style={{ fontSize: 14 }}>{CONFIRMAR_TEXTO[pendiente].mensaje}</p>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar operativo" saving={saving} onSave={guardarEdicion} onCancel={() => setEditing(false)}>
          <Field label="Nombre">
            <TextInput placeholder="Ej: Operativo 2026" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Fecha *">
            <TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
          <Field label="Lugar de realización">
            <SelectInput value={form.lugar_realizacion} onChange={(e) => setForm({ ...form, lugar_realizacion: e.target.value })}>
              <option value="escuela">En la escuela</option>
              <option value="centro_salud">En el centro de salud</option>
              <option value="otros">Otros</option>
            </SelectInput>
          </Field>
          <Field label="Notas">
            <textarea rows={3} placeholder="Añadí notas…" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Field>
        </Modal>
      )}

      {confirmDel && (
        <Modal title={`¿Eliminar ${titulo}?`} saveLabel="Sí" cancelLabel="No" onSave={eliminar} onCancel={() => setConfirmDel(false)}>
          El operativo se cancelará. Esta acción no se puede deshacer.
        </Modal>
      )}

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
              <option value="administrativo">Administrativo</option>
            </SelectInput>
          </Field>
        </Modal>
      )}
    </div>
  );
}
