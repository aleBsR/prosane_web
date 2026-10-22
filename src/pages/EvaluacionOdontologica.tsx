import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

const PERMANENTES = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
];
const TEMPORARIAS = [
  '55', '54', '53', '52', '51',
  '61', '62', '63', '64', '65',
  '85', '84', '83', '82', '81',
  '71', '72', '73', '74', '75',
];
const ESTADOS_GENERALES = [
  { value: '', label: 'Normal' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'extraido', label: 'Extraído' },
  { value: 'corona', label: 'Corona' },
  { value: 'protesis', label: 'Prótesis' },
  { value: 'implante', label: 'Implante' },
  { value: 'a_extraer', label: 'Para extraer' },
  { value: 'fractura_total', label: 'Fractura total' },
];
const ESTADOS_CARA = [
  { value: '', label: 'Sana' },
  { value: 'caries', label: 'Caries' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'sellador', label: 'Sellador' },
  { value: 'fractura', label: 'Fractura' },
  { value: 'a_tratar', label: 'A tratar' },
  { value: 'tratada', label: 'Tratada' },
];
const ESTADOS_RAIZ = [
  { value: '', label: 'Normal' },
  { value: 'conducto_realizado', label: 'Conducto realizado' },
  { value: 'conducto_pendiente', label: 'Conducto pendiente' },
];
const CARAS = [
  { value: 'oclusal', label: 'Oclusal' },
  { value: 'mesial', label: 'Mesial' },
  { value: 'distal', label: 'Distal' },
  { value: 'vestibular', label: 'Vestibular' },
  { value: 'lingual', label: 'Lingual / palatina' },
];
const BLOQUEADAS = new Set(['ausente', 'perdido', 'extraido']);

interface Pieza {
  estadoGeneral: string;
  caras: Record<string, string>;
  raiz: string;
  notas: string;
}
const piezaVacia = (): Pieza => ({ estadoGeneral: '', caras: {}, raiz: '', notas: '' });

// Dibujo del diente espejo de _DientePainter (pieza_dental_widget.dart):
// corona 38x36 con 5 caras coloreadas (vestibular, lingual, mesial, distal,
// oclusal) + raíz triangular coloreada por su estado.
function Diente({ numero, pieza }: { numero: string; pieza: Pieza }) {
  const VERDE = '#81c784';
  const AZUL = '#64b5f6';
  const ROJO = '#e57373';
  const GRIS = '#bdbdbd';
  const BORDE = 'rgba(0,0,0,.54)';

  const colorCara = (cara: string) => {
    const e = pieza.caras[cara] ?? '';
    if (['caries', 'fractura', 'a_tratar'].includes(e)) return ROJO;
    if (['restauracion', 'sellador', 'tratada'].includes(e)) return AZUL;
    return VERDE;
  };
  const colorPiezaBase = () => {
    if (BLOQUEADAS.has(pieza.estadoGeneral)) return GRIS;
    const caras = Object.values(pieza.caras);
    if (
      pieza.estadoGeneral === 'a_extraer' || pieza.estadoGeneral === 'fractura_total' ||
      caras.some((e) => ['caries', 'fractura', 'a_tratar'].includes(e)) ||
      pieza.raiz === 'conducto_pendiente'
    ) {
      return ROJO;
    }
    if (
      pieza.estadoGeneral !== '' ||
      caras.some((e) => ['restauracion', 'sellador', 'tratada'].includes(e)) ||
      pieza.raiz === 'conducto_realizado'
    ) {
      return AZUL;
    }
    return VERDE;
  };
  const colorRaiz = () => {
    if (pieza.raiz === 'conducto_pendiente') return ROJO;
    if (pieza.raiz === 'conducto_realizado') return AZUL;
    return 'rgba(255,255,255,.7)';
  };

  // Geometría del painter: corona x5 y3 w38 h36 rx12, franjas de 7 y 10.
  const clipId = `corona-${numero}`;
  const conCaras = pieza.estadoGeneral === '';
  return (
    <svg width="48" height="58" viewBox="0 0 48 58">
      <defs>
        <clipPath id={clipId}>
          <rect x="5" y="3" width="38" height="36" rx="12" />
        </clipPath>
      </defs>
      <rect x="5" y="3" width="38" height="36" rx="12" fill={conCaras ? VERDE : colorPiezaBase()} />
      {conCaras && (
        <g clipPath={`url(#${clipId})`}>
          <rect x="5" y="3" width="38" height="7" fill={colorCara('vestibular')} />
          <rect x="5" y="32" width="38" height="7" fill={colorCara('lingual')} />
          <rect x="5" y="10" width="10" height="22" fill={colorCara('mesial')} />
          <rect x="33" y="10" width="10" height="22" fill={colorCara('distal')} />
          <rect x="15" y="10" width="18" height="22" fill={colorCara('oclusal')} />
        </g>
      )}
      <rect x="5" y="3" width="38" height="36" rx="12" fill="none" stroke={BORDE} strokeWidth="1" />
      <path d="M17 41 L21 55 L24 43.5 L27 55 L31 41 Z" fill={colorRaiz()} stroke={BORDE} strokeWidth="1" />
      <g stroke="rgba(0,0,0,.15)" strokeWidth="1">
        <line x1="5" y1="10" x2="43" y2="10" />
        <line x1="5" y1="32" x2="43" y2="32" />
        <line x1="15" y1="10" x2="15" y2="32" />
        <line x1="33" y1="10" x2="33" y2="32" />
      </g>
    </svg>
  );
}

// Formulario completo espejo de evaluacion_odontologica_screen.dart:
// salud bucal, prácticas, índice CPO/ceo y odontograma con editor por pieza.
export default function EvaluacionOdontologica() {
  const { opId, alumnoId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estadoOp, setEstadoOp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<any>({});
  const [otrosMarcado, setOtrosMarcado] = useState(false);
  const [odonto, setOdonto] = useState<Record<string, Pieza>>({});
  const [editPieza, setEditPieza] = useState<string | null>(null);
  const [ep, setEp] = useState<Pieza>(piezaVacia());
  const [paso, setPaso] = useState(0);
  // Firma de lo último persistido para el dirty guard.
  const firmaGuardada = useRef('');

  // Pasos del wizard (3 secciones + revisión). Mismo orden que la app.
  const TITULOS_PASOS = ['Salud bucal', 'Prácticas e índices', 'Odontograma', 'Revisión'];

  // En odontológica no hay obligatorios: Siguiente persiste el avance
  // (autoguardado). Si falla la red se queda en el paso para reintentar.
  async function intentarAvanzar() {
    const ok = await guardarAvance();
    if (ok) {
      setError(null);
      setPaso(Math.min(paso + 1, 3));
    }
  }

  // Firma del estado para detectar cambios sin guardar (dirty guard).
  function firmaActual(): string {
    return JSON.stringify({ f, otrosMarcado, odonto });
  }
  function marcarGuardado() {
    firmaGuardada.current = firmaActual();
  }
  const tieneCambios = firmaActual() !== firmaGuardada.current;

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));  // Al salir de "Con hallazgos" se limpian checks y Otros para no guardar
  // datos contradictorios (ej. "Sin hallazgos" + caries).
  const setSaludBucal = (v: string) => {
    if (v === 'con_hallazgos') {
      set('salud_bucal', v);
      return;
    }
    setF((p: any) => ({
      ...p,
      salud_bucal: v,
      lesiones_tejidos_blandos: false,
      maloclusion: false,
      fluorosis: false,
      caries: false,
      otros: '',
    }));
    setOtrosMarcado(false);
  };
  const setOtrosCheck = (v: boolean) => {
    setOtrosMarcado(v);
    // Al desmarcar se borra el texto para no guardarlo huérfano.
    if (!v) set('otros', '');
  };

  useEffect(() => {
    (async () => {
      try {
        const [op, ev] = await Promise.all([
          v1Api.get(`/operativos/${opId}/`),
          v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/evaluacion-odontologica/`),
        ]);
        setEstadoOp(op.data.estado ?? '');
        const d = ev.data ?? {};
        const f0 = {
          // Sin valor guardado (nueva o legacy) se asume "No evaluado".
          salud_bucal: d.salud_bucal || 'no_eval',
          lesiones_tejidos_blandos: !!d.lesiones_tejidos_blandos,
          maloclusion: !!d.maloclusion,
          fluorosis: !!d.fluorosis,
          caries: !!d.caries,
          otros: d.otros ?? '',
          topicacion_fluor: !!d.topicacion_fluor,
          ensenanza_cepillado: !!d.ensenanza_cepillado,
          alta_basica: !!d.alta_basica,
          cpo_c: !!d.cpo_c, cpo_p: !!d.cpo_p, cpo_o: !!d.cpo_o,
          ceo_c: !!d.ceo_c, ceo_e: !!d.ceo_e, ceo_o: !!d.ceo_o,
        };
        setF(f0);
        const om = (d.otros ?? '') !== '';
        setOtrosMarcado(om);
        const raw = d.odontograma ?? {};
        const map: Record<string, Pieza> = {};
        for (const [k, v] of Object.entries<any>(raw)) {
          map[k] = {
            estadoGeneral: String(v?.estado_general ?? ''),
            caras: Object.fromEntries(Object.entries<string>(v?.caras ?? {}).map(([ck, cv]) => [ck, String(cv)])),
            raiz: String(v?.raiz ?? ''),
            notas: String(v?.notas ?? ''),
          };
        }
        setOdonto(map);
        firmaGuardada.current = JSON.stringify({
          f: f0, otrosMarcado: om, odonto: map,
        });
      } catch {
        // Sin evaluación previa: se parte de un estado vacío editable.
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  const noEditable = estadoOp === 'finalizado' || estadoOp === 'cancelado';
  const enCurso = estadoOp === 'en_curso';
  const ro = !enCurso;

  // Bloquea salidas (botón atrás, links, recarga) con cambios sin guardar.
  const blocker = useBlocker(tieneCambios && enCurso && !loading && !saving);
  const pieza = (n: string) => odonto[n] ?? piezaVacia();

  function abrirPieza(n: string) {
    if (ro) return;
    setEp({ ...piezaVacia(), ...pieza(n), caras: { ...pieza(n).caras } });
    setEditPieza(n);
  }

  function guardarPieza() {
    if (!editPieza) return;
    const bloqueada = BLOQUEADAS.has(ep.estadoGeneral);
    setOdonto((o) => ({
      ...o,
      [editPieza]: {
        estadoGeneral: ep.estadoGeneral,
        caras: bloqueada ? {} : ep.caras,
        raiz: bloqueada ? '' : ep.raiz,
        notas: ep.notas,
      },
    }));
    setEditPieza(null);
  }

  async function guardar() {
    await enviar(false, 'Evaluación guardada', true);
  }

  // Guarda el avance sin marcar la evaluación como completada.
  // Devuelve si persistió (para el autoguardado al Siguiente).
  async function guardarAvance(): Promise<boolean> {
    return enviar(true, 'Avance guardado', false);
  }

  async function enviar(parcial: boolean, okMsg: string, completar: boolean): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await v1Api.put(`/operativos/${opId}/alumnos/${alumnoId}/evaluacion-odontologica/`, {
        ...payload(),
        completar,
      });
      marcarGuardado();
      if (!parcial) toast.push('ok', okMsg);
      if (!parcial) {
        nav(`/operativos/${opId}`, { replace: true });
        nav(`/operativos/${opId}/alumnos/${alumnoId}`);
      }
      return true;
    } catch (e) {
      const m = apiErrorMessage(e, 'No se pudo guardar la evaluación.');
      setError(m);
      toast.push('error', m);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function payload() {
    return {
        salud_bucal: f.salud_bucal || 'no_eval',
        lesiones_tejidos_blandos: !!f.lesiones_tejidos_blandos,
        maloclusion: !!f.maloclusion,
        fluorosis: !!f.fluorosis,
        caries: !!f.caries,
        otros: otrosMarcado ? (f.otros || '') : '',
        topicacion_fluor: !!f.topicacion_fluor,
        ensenanza_cepillado: !!f.ensenanza_cepillado,
        alta_basica: !!f.alta_basica,
        cpo_c: !!f.cpo_c, cpo_p: !!f.cpo_p, cpo_o: !!f.cpo_o,
        ceo_c: !!f.ceo_c, ceo_e: !!f.ceo_e, ceo_o: !!f.ceo_o,
        odontograma: Object.fromEntries(
          Object.entries(odonto).map(([k, p]) => [
            k,
            {
              estado_general: p.estadoGeneral || null,
              caras: Object.fromEntries(Object.entries(p.caras).filter(([, v]) => v)),
              raiz: p.raiz || null,
              notas: p.notas,
            },
          ]),
        ),
      };
  }

  if (loading) return <AppCard>Cargando…</AppCard>;

  const check = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
      <input type="checkbox" checked={value} disabled={ro} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  const cuadrante = (titulo: string, piezas: string[]) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{titulo}</div>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {piezas.map((n) => (
          <button
            key={n}
            onClick={() => abrirPieza(n)}
            disabled={ro}
            style={{
              minWidth: 58,
              border: '1px solid rgba(0,0,0,.2)',
              borderRadius: 10,
              background: '#fff',
              padding: '3px 2px',
              cursor: ro ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
            title={`Pieza ${n}`}
          >
            <Diente numero={n} pieza={pieza(n)} />
            <div style={{ fontSize: 11 }}>{n}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const denticion = (titulo: string, piezas: string[]) => (
    <div style={{ marginBottom: 10 }}>
      <strong style={{ fontSize: 13 }}>Dentición {titulo}</strong>
      <div style={{ height: 6 }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Lado derecho</div>
          {cuadrante(titulo === 'Permanente' ? 'Superior (18 → 11)' : 'Superior (55 → 51)', piezas.slice(0, piezas.length / 4))}
          {cuadrante(titulo === 'Permanente' ? 'Inferior (48 → 41)' : 'Inferior (85 → 81)', piezas.slice(piezas.length / 2, (piezas.length / 4) * 3))}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Lado izquierdo</div>
          {cuadrante(titulo === 'Permanente' ? 'Superior (21 → 28)' : 'Superior (61 → 65)', piezas.slice(piezas.length / 4, piezas.length / 2))}
          {cuadrante(titulo === 'Permanente' ? 'Inferior (31 → 38)' : 'Inferior (71 → 75)', piezas.slice((piezas.length / 4) * 3))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Evaluación odontológica" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
      {blocker.state === 'blocked' && (
        <Modal
          title="Salir sin guardar?"
          saveLabel="Salir"
          cancelLabel="Seguir editando"
          onSave={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        >
          <p style={{ fontSize: 14 }}>Tenés cambios sin guardar. Si salís ahora se pierden.</p>
        </Modal>
      )}
      {noEditable && <div className="info-box ok">🔒 Operativo finalizado — solo lectura</div>}
      {!noEditable && !enCurso && (
        <div className="info-box">Solo se puede cargar cuando el operativo está en curso</div>
      )}
      <div style={{ opacity: enCurso ? 1 : 0.85 }}>
        <AppCard>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Paso {Math.min(paso, 3) + 1} de 4 · {TITULOS_PASOS[Math.min(paso, 3)]}
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,.08)', borderRadius: 4, margin: '8px 0' }}>
            <div style={{ width: `${((Math.min(paso, 3) + 1) / 4) * 100}%`, height: '100%', background: 'var(--primario)', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TITULOS_PASOS.map((t, i) => (
              <button
                key={t}
                type="button"
                title={t}
                onClick={() => setPaso(i)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: i === paso ? 'var(--primario)' : 'rgba(0,0,0,.08)',
                  color: i === paso ? '#fff' : 'inherit',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </AppCard>
        <div style={{ height: 12 }} />
        {paso === 0 && (
        <AppCard>
          <h3>Salud bucal</h3>
          <Field label="Estado">
            <SelectInput value={f.salud_bucal || 'no_eval'} disabled={ro} onChange={(e) => setSaludBucal(e.target.value)}>
              <option value="con_hallazgos">Con hallazgos</option>
              <option value="sin_hallazgos">Sin hallazgos</option>
              <option value="no_eval">No evaluado</option>
            </SelectInput>
          </Field>
          {f.salud_bucal === 'con_hallazgos' && (
            <>
              {check('Lesiones sospechosas en tejidos blandos', !!f.lesiones_tejidos_blandos, (v) => set('lesiones_tejidos_blandos', v))}
              {check('Maloclusión', !!f.maloclusion, (v) => set('maloclusion', v))}
              {check('Fluorosis', !!f.fluorosis, (v) => set('fluorosis', v))}
              {check('Caries', !!f.caries, (v) => set('caries', v))}
              {check('Otros', otrosMarcado, setOtrosCheck)}
              {otrosMarcado && (
                <Field label="¿Cuáles?">
                  <TextInput value={f.otros ?? ''} disabled={ro} onChange={(e) => set('otros', e.target.value)} />
                </Field>
              )}
            </>
          )}
        </AppCard>
        )}

        {paso === 1 && (
        <>
        <AppCard>
          <h3>Prácticas</h3>
          {check('Topicación de flúor', !!f.topicacion_fluor, (v) => set('topicacion_fluor', v))}
          {check('Enseñanza de cepillado', !!f.ensenanza_cepillado, (v) => set('ensenanza_cepillado', v))}
          {check('Alta básica', !!f.alta_basica, (v) => set('alta_basica', v))}
        </AppCard>

        <AppCard>
          <h3>Índice CPO/ceo</h3>
          <strong style={{ fontSize: 13 }}>CPO (dentición permanente)</strong>
          {check('Cariados (C)', !!f.cpo_c, (v) => set('cpo_c', v))}
          {check('Perdidos (P)', !!f.cpo_p, (v) => set('cpo_p', v))}
          {check('Obturados (O)', !!f.cpo_o, (v) => set('cpo_o', v))}
          <strong style={{ fontSize: 13, marginTop: 8, display: 'block' }}>ceo (dentición temporaria)</strong>
          {check('Cariados (c)', !!f.ceo_c, (v) => set('ceo_c', v))}
          {check('Con extracción indicada (e)', !!f.ceo_e, (v) => set('ceo_e', v))}
          {check('Obturados (o)', !!f.ceo_o, (v) => set('ceo_o', v))}
        </AppCard>
        </>
        )}

        {paso === 2 && (
        <AppCard>
          <h3>Odontograma</h3>
          {denticion('Permanente', PERMANENTES)}
          {denticion('Temporaria', TEMPORARIAS)}
          <div style={{ fontSize: 11 }}>Verde: normal · Azul: tratado · Rojo: pendiente · Gris: ausente</div>
        </AppCard>
        )}

        {paso === 3 && (
        <AppCard>
          <h3>Revisión</h3>
          {['Salud bucal', 'Prácticas e índices', 'Odontograma'].map((t, i) => (
            <div
              key={t}
              onClick={() => setPaso(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}
            >
              <span style={{ color: 'green' }}>✓</span>
              <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
              <span style={{ color: '#999' }}>›</span>
            </div>
          ))}
        </AppCard>
        )}
      </div>

      <div style={{ height: 12 }} />
      {enCurso && (
        <AppCard>
          {error && <div className="form-error">{error}</div>}
          <div className="wizard-nav">
            {paso > 0 && (
              <AppButton label="Atrás" secondary onClick={() => setPaso(Math.max(0, paso - 1))} />
            )}
            {paso < 3 ? (
              <AppButton label="Siguiente" loading={saving} onClick={intentarAvanzar} />
            ) : (
              <AppButton label="Guardar" loading={saving} onClick={guardar} />
            )}
          </div>
        </AppCard>
      )}
      {!enCurso && error && (
        <AppCard>
          <div className="form-error">{error}</div>
        </AppCard>
      )}

      {editPieza && (
        <Modal title={`Pieza ${editPieza}`} saveLabel="Guardar pieza" onSave={guardarPieza} onCancel={() => setEditPieza(null)}>
          <Field label="Estado general">
            <SelectInput
              value={ep.estadoGeneral}
              onChange={(e) => {
                const v = e.target.value;
                setEp((p) => ({ ...p, estadoGeneral: v, caras: BLOQUEADAS.has(v) ? {} : p.caras, raiz: BLOQUEADAS.has(v) ? '' : p.raiz }));
              }}
            >
              {ESTADOS_GENERALES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </SelectInput>
          </Field>
          {!BLOQUEADAS.has(ep.estadoGeneral) && (
            <>
              <strong style={{ fontSize: 13 }}>Caras</strong>
              {CARAS.map((c) => (
                <Field key={c.value} label={c.label}>
                  <SelectInput
                    value={ep.caras[c.value] ?? ''}
                    onChange={(e) => setEp((p) => ({ ...p, caras: { ...p.caras, [c.value]: e.target.value } }))}
                  >
                    {ESTADOS_CARA.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </SelectInput>
                </Field>
              ))}
              <Field label="Raíz / pulpa">
                <SelectInput value={ep.raiz} onChange={(e) => setEp((p) => ({ ...p, raiz: e.target.value }))}>
                  {ESTADOS_RAIZ.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectInput>
              </Field>
            </>
          )}
          <Field label="Notas">
            <TextInput value={ep.notas} onChange={(e) => setEp((p) => ({ ...p, notas: e.target.value }))} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
