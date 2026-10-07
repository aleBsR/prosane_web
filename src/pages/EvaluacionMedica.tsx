import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

const HALLAZGO_LABELS: Record<string, string> = {
  piel: 'Piel y faneras',
  partes_blandas: 'Partes blandas',
  cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio',
  abdominal: 'Abdominal',
  genitourinario_ninos: 'Genitourinario (Niños)',
  genitourinario_ninas: 'Genitourinario (Niñas)',
  osteoarticular: 'Osteoarticular',
  neurologico: 'Neurológico',
  salud_visual: 'Salud visual',
  salud_fonoaudiologica: 'Salud fonoaudiológica',
  icv: 'ICV',
};
const HALLAZGO_SISTEMAS = Object.keys(HALLAZGO_LABELS);

const HALLAZGO_CHECKS: Record<string, { id: string; label: string }[]> = {
  piel: [
    { id: 'nevo_derivacion', label: 'Nevos con criterio de derivación (Asimetría, bordes, color, diámetro, evolución)' },
    { id: 'escabiosis', label: 'Escabiosis' },
    { id: 'piodermitis', label: 'Piodermitis' },
    { id: 'pediculosis', label: 'Pediculosis' },
    { id: 'otro', label: 'Otro' },
  ],
  partes_blandas: [
    { id: 'adenomegalia_localizada', label: 'Adenomegalia localizada' },
    { id: 'adenomegalias_generalizada', label: 'Adenomegalias generalizadas' },
    { id: 'otro', label: 'Otro' },
  ],
  cardiovascular: [
    { id: 'presion_elevada', label: 'Presión arterial elevada' },
    { id: 'pulso_alterado', label: 'Ausencia o alteración del pulso humeral, radial o femoral (uni o bilateral)' },
    { id: 'soplo', label: 'Soplo' },
    { id: 'arritmia', label: 'Arritmia' },
    { id: 'otro', label: 'Otro' },
  ],
  respiratorio: [
    { id: 'hallazgo_auscultatorio', label: 'Hallazgo auscultatorio' },
    { id: 'respiracion_bucal', label: 'Respiración bucal' },
    { id: 'otro', label: 'Otro' },
  ],
  abdominal: [
    { id: 'hepatomegalia', label: 'Hepatomegalia' },
    { id: 'masa_palpable', label: 'Masa palpable' },
    { id: 'esplenomegalia', label: 'Esplenomegalia' },
    { id: 'hernias', label: 'Hernias' },
    { id: 'otro', label: 'Otro' },
  ],
  genitourinario_ninos: [
    { id: 'pubertad_precoz', label: 'Signos de pubertad precoz (en niños menores de 9 años)' },
    { id: 'testiculo_no_descendido', label: 'Testículo/s no descendido/s' },
    { id: 'hernia', label: 'Hernia' },
    { id: 'fimosis', label: 'Fimosis' },
    { id: 'asimetria_testicular', label: 'Asimetría testicular' },
    { id: 'varicocele', label: 'Varicocele' },
    { id: 'otro', label: 'Otro' },
  ],
  genitourinario_ninas: [
    { id: 'pubertad_precoz', label: 'Signos de pubertad precoz (en niñas menores de 8 años)' },
    { id: 'otro', label: 'Otro' },
  ],
  osteoarticular: [
    { id: 'adams_positiva', label: 'Maniobra de Adams positiva' },
    { id: 'alteracion_marcha', label: 'Alteraciones de la marcha' },
    { id: 'otro', label: 'Otro' },
  ],
  neurologico: [
    { id: 'paresias_focales', label: 'Paresias o signos focales' },
    { id: 'movimientos_anormales', label: 'Movimientos anormales' },
    { id: 'otro', label: 'Otro' },
  ],
  salud_visual: [
    { id: 'disminucion_agudeza', label: 'Disminución de agudeza visual' },
    { id: 'estrabismo', label: 'Estrabismo' },
    { id: 'posicion_cabeza', label: 'Posición anormal de la cabeza' },
    { id: 'ojo_externo', label: 'Alteraciones del ojo externo' },
    { id: 'otro', label: 'Otro' },
  ],
  salud_fonoaudiologica: [
    { id: 'audiometria_no_pasa', label: "'No pasa' Audiometría/barrido tonal" },
    { id: 'alteracion_lenguaje', label: 'Alteraciones en el lenguaje, habla y/o comunicación' },
    { id: 'otro', label: 'Otro' },
  ],
};
const SIN_CHECKS = new Set(['icv']);
const SISTEMA_NOMBRES: Record<string, string> = {
  piel: 'piel y faneras',
  partes_blandas: 'partes blandas',
  cardiovascular: 'cardiovascular',
  respiratorio: 'respiratorio',
  abdominal: 'abdominal',
  genitourinario_ninos: 'genitourinario (niños)',
  genitourinario_ninas: 'genitourinario (niñas)',
  osteoarticular: 'osteoarticular',
  neurologico: 'neurológico',
  salud_visual: 'salud visual',
  salud_fonoaudiologica: 'salud fonoaudiológica',
  icv: 'ICV',
};

const DERIV_LABELS: Record<string, string> = {
  odontologia: 'Odontología',
  oftalmologia: 'Oftalmología',
  nutricion: 'Nutrición',
  neurologia: 'Neurología',
  cardiologia: 'Cardiología',
  fonoaudiologia: 'Fonoaudiología',
  psicologia: 'Psicología',
  otros: 'Otros',
};
const DERIV_ESPS = Object.keys(DERIV_LABELS);
const OJOS = Array.from({ length: 10 }, (_, i) => `${i + 1}/10`);

// Formulario espejo de la app: examen clínico condicional, antropometría y
// presión con toggle de evaluada, PAS/PAD con checks automáticos, agudeza con
// selects 1/10–10/10, audiometría condicional y cadena de vacunación.
// Todo lo visible según estas reglas es obligatorio al guardar.
export default function EvaluacionMedica() {
  const { opId, alumnoId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estadoOp, setEstadoOp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [f, setF] = useState<any>({});
  const [hallazgos, setHallazgos] = useState<Record<string, { estado: string; detalle: string; checks: string[] }>>({});
  const [derivs, setDerivs] = useState<Record<string, { deriva: boolean; motivo: string }>>({});
  const [aplicadas, setAplicadas] = useState('');
  const [indicadas, setIndicadas] = useState('');
  const [paso, setPaso] = useState(0);
  // Firma de lo último persistido para el dirty guard.
  const firmaGuardada = useRef('');

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  // Al alternar cada condición se limpian los dependientes (igual que la
  // app): no se guardan datos contradictorios (ej. presión no evaluada +
  // PAS/PAD) ni huérfanos ocultos.
  const setCampo = (k: string, v: any) => setF((p: any) => {
    const n = { ...p, [k]: v };
    if (k === 'examen_realizado') {
      if (v) n.motivo_no_examen = '';
      else n.lugar_examen = '';
    }
    if (k === 'antropometria_evaluada' && !v) {
      n.peso = ''; n.talla = ''; n.percentil_talla = ''; n.percentil_imc = '';
    }
    if (k === 'presion_evaluada' && !v) {
      n.pas = ''; n.pad = ''; n.presion_clasificacion = '';
    }
    if (k === 'agudeza_evaluada' && !v) {
      n.ojo_derecho = ''; n.ojo_izquierdo = ''; n.usa_lentes = false;
    }
    if (k === 'audiometria_realizada' && !v) {
      n.audiometria_resultado = '';
    }
    return n;
  });
  const setTrajoCarnet = (v: boolean) => {
    setF((p: any) => ({
      ...p,
      trajo_carnet: v,
      ...(!v ? { carnet_completo: false, vacunas_aplicadas: '', vacunas_indicadas: '' } : {}),
    }));
    if (!v) { setAplicadas(''); setIndicadas(''); }
  };
  const setCarnetCompleto = (v: boolean) => {
    setF((p: any) => ({
      ...p,
      carnet_completo: v,
      ...(v ? { vacunas_aplicadas: '', vacunas_indicadas: '' } : {}),
    }));
    if (v) { setAplicadas(''); setIndicadas(''); }
  };
  const str = (v: any) => (v === null || v === undefined ? '' : String(v));

  // Firma del estado para detectar cambios sin guardar (dirty guard).
  function firmaActual(): string {
    return JSON.stringify({ f, hallazgos, derivs, aplicadas, indicadas });
  }
  function marcarGuardado() {
    firmaGuardada.current = firmaActual();
  }
  const tieneCambios = firmaActual() !== firmaGuardada.current;

  const imc =
    Number(f.peso) > 0 && Number(f.talla) > 0
      ? (Number(f.peso) / (Number(f.talla) / 100) ** 2).toFixed(2)
      : '';

  useEffect(() => {
    (async () => {
      try {
        const [op, ev] = await Promise.all([
          v1Api.get(`/operativos/${opId}/`),
          v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/evaluacion-medica/`),
        ]);
        setEstadoOp(op.data.estado ?? '');
        const d = ev.data ?? {};
        const f0 = {
          examen_realizado: d.examen_realizado ?? true,
          motivo_no_examen: d.motivo_no_examen ?? '',
          lugar_examen: d.lugar_examen ?? '',
          antropometria_evaluada: d.antropometria_evaluada ?? true,
          peso: str(d.peso),
          talla: str(d.talla),
          percentil_talla: d.percentil_talla ?? '',
          percentil_imc: d.percentil_imc ?? '',
          presion_evaluada: d.presion_evaluada ?? true,
          pas: str(d.pas),
          pad: str(d.pad),
          presion_clasificacion: d.presion_clasificacion ?? '',
          agudeza_evaluada: !!d.agudeza_evaluada,
          ojo_derecho: d.ojo_derecho ?? '',
          ojo_izquierdo: d.ojo_izquierdo ?? '',
          usa_lentes: !!d.usa_lentes,
          audiometria_realizada: !!d.audiometria_realizada,
          audiometria_resultado: d.audiometria_resultado ?? '',
          trajo_carnet: !!d.trajo_carnet,
          carnet_completo: !!d.carnet_completo,
          vacunas_aplicadas: d.vacunas_aplicadas ?? '',
          vacunas_indicadas: d.vacunas_indicadas ?? '',
        };
        setF(f0);
        const ap = str(d.vacunas_aplicadas) !== '' ? 'si' : '';
        const ind = str(d.vacunas_indicadas) !== '' ? 'si' : '';
        setAplicadas(ap);
        setIndicadas(ind);
        const hRaw = d.hallazgos ?? {};
        const h: Record<string, { estado: string; detalle: string; checks: string[] }> = {};
        for (const s of HALLAZGO_SISTEMAS) {
          const estado = String(hRaw[s]?.estado ?? 'no_eval');
          // Sanea datos contradictorios legacy (estado != con + checks).
          h[s] = estado === 'con' ? {
            estado,
            detalle: String(hRaw[s]?.detalle ?? ''),
            checks: Array.isArray(hRaw[s]?.checks) ? hRaw[s].checks.map(String) : [],
          } : { estado, detalle: '', checks: [] };
        }
        setHallazgos(h);
        const dRaw = d.derivaciones ?? {};
        const dv: Record<string, { deriva: boolean; motivo: string }> = {};
        for (const e of DERIV_ESPS) {
          const deriva = Boolean(dRaw[e]?.deriva);
          dv[e] = { deriva, motivo: deriva ? String(dRaw[e]?.motivo ?? '') : '' };
        }
        setDerivs(dv);
        firmaGuardada.current = JSON.stringify({
          f: f0, hallazgos: h, derivs: dv, aplicadas: ap, indicadas: ind,
        });
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudo cargar la evaluación'));
        setErrorCarga(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  const noEditable = estadoOp === 'finalizado' || estadoOp === 'cancelado';
  const enCurso = estadoOp === 'en_curso';
  const ro = !enCurso;

  const numOrNull = (v: any) => (String(v ?? '').trim() === '' ? null : Number(String(v).replace(',', '.')));
  const intOrNull = (v: any) => (String(v ?? '').trim() === '' ? null : parseInt(String(v), 10));

  // Pasos del wizard (7 secciones + revisión). Mismo orden que la app.
  const TITULOS_PASOS = [
    'Examen clínico', 'Antropometría', 'Presión arterial',
    'Agudeza visual / Audiometría', 'Hallazgos clínicos', 'Vacunación',
    'Derivaciones', 'Revisión',
  ];

  // Intenta avanzar validando la sección actual; si está completa la
  // persiste antes de avanzar (autoguardado al Siguiente). Si falla la red
  // se queda en el paso con el error para reintentar.
  async function intentarAvanzar() {
    const msg = validarPaso(Math.min(paso, 7));
    if (msg) {
      setError(msg);
      toast.push('error', msg);
      return;
    }
    const ok = await guardarAvance();
    if (ok) {
      setError(null);
      setPaso(Math.min(paso + 1, 7));
    }
  }

  // Bloquea salidas (botón atrás, links, recarga) con cambios sin guardar.
  const blocker = useBlocker(tieneCambios && enCurso && !loading);

  // Valida solo una sección (botón Siguiente bloqueante).
  function validarPaso(paso: number): string | null {
    const falt: string[] = [];
    if (paso === 0) {
      if (f.examen_realizado) {
        if (!f.lugar_examen) falt.push('lugar del examen');
      } else if (!f.motivo_no_examen) {
        falt.push('motivo de no examen');
      }
    } else if (paso === 1) {
      if (f.antropometria_evaluada) {
        if (!String(f.peso ?? '').trim()) falt.push('peso');
        if (!String(f.talla ?? '').trim()) falt.push('talla');
        if (!f.percentil_talla) falt.push('percentil de talla');
        if (!f.percentil_imc) falt.push('percentil de IMC');
      }
    } else if (paso === 2) {
      if (f.presion_evaluada) {
        if (!String(f.pas ?? '').trim()) falt.push('PAS');
        if (!String(f.pad ?? '').trim()) falt.push('PAD');
      }
    } else if (paso === 3) {
      if (f.agudeza_evaluada) {
        if (!f.ojo_derecho) falt.push('ojo derecho');
        if (!f.ojo_izquierdo) falt.push('ojo izquierdo');
      }
      if (f.audiometria_realizada && !f.audiometria_resultado) falt.push('resultado de audiometría');
    } else if (paso === 4) {
      for (const [s, h] of Object.entries(hallazgos)) {
        if (h.estado !== 'con' || SIN_CHECKS.has(s)) continue;
        if (h.checks.length === 0) falt.push(`al menos un hallazgo en ${SISTEMA_NOMBRES[s] ?? s}`);
        else if (h.checks.includes('otro') && !String(h.detalle ?? '').trim()) {
          falt.push(`detalle de "otro" en ${SISTEMA_NOMBRES[s] ?? s}`);
        }
      }
    } else if (paso === 5) {
      if (f.trajo_carnet && !f.carnet_completo) {
        if (!aplicadas) falt.push('si se aplicaron vacunas');
        else if (aplicadas === 'si' && !String(f.vacunas_aplicadas ?? '').trim()) falt.push('detalle de vacunas aplicadas');
        else if (aplicadas === 'no' && !indicadas) falt.push('si se indicaron vacunas faltantes');
        else if (aplicadas === 'no' && indicadas === 'si' && !String(f.vacunas_indicadas ?? '').trim()) {
          falt.push('detalle de vacunas faltantes');
        }
      }
    }
    // Paso 6 (derivaciones): sin obligatorios. Paso 7 (revisión): agregado.
    return falt.length === 0 ? null : `Faltan campos obligatorios: ${falt.join(', ')}.`;
  }

  function validar(): string | null {
    const falt: string[] = [];
    for (let paso = 0; paso < 7; paso++) {
      const msg = validarPaso(paso);
      if (msg == null) continue;
      falt.push(...msg.replace(/^Faltan campos obligatorios: /, '').replace(/\.$/, '').split(', '));
    }
    return falt.length === 0 ? null : `Faltan campos obligatorios: ${falt.join(', ')}.`;
  }

  async function guardar() {
    const msg = validar();
    if (msg) {
      setError(msg);
      toast.push('error', msg);
      return;
    }
    await enviar(false, 'Evaluación guardada', true);
  }

  // Guarda el avance sin validar todo (wizard): persiste lo cargado sin
  // marcar la evaluación como completada. Devuelve si persistió.
  async function guardarAvance(): Promise<boolean> {
    return enviar(true, 'Avance guardado', false);
  }

  async function enviar(parcial: boolean, okMsg: string, completar: boolean): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await v1Api.put(`/operativos/${opId}/alumnos/${alumnoId}/evaluacion-medica/`, {
        ...payload(),
        completar,
      });
      marcarGuardado();
      if (!parcial) toast.push('ok', okMsg);
      if (!parcial) nav(`/operativos/${opId}/alumnos/${alumnoId}`);
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
      examen_realizado: !!f.examen_realizado,
        motivo_no_examen: f.motivo_no_examen || '',
        lugar_examen: f.lugar_examen || '',
        antropometria_evaluada: !!f.antropometria_evaluada,
        trajo_carnet: !!f.trajo_carnet,
        carnet_completo: !!f.carnet_completo,
        vacunas_aplicadas: aplicadas === 'no' ? '' : f.vacunas_aplicadas || '',
        vacunas_indicadas: aplicadas !== 'no' || indicadas !== 'si' ? '' : f.vacunas_indicadas || '',
        peso: numOrNull(f.peso),
        talla: numOrNull(f.talla),
        imc: imc === '' ? null : Number(imc),
        percentil_talla: f.percentil_talla || '',
        percentil_imc: f.percentil_imc || '',
        presion_evaluada: !!f.presion_evaluada,
        pas: intOrNull(f.pas),
        pad: intOrNull(f.pad),
        presion_clasificacion: f.presion_clasificacion || '',
        agudeza_evaluada: !!f.agudeza_evaluada,
        ojo_derecho: f.ojo_derecho || '',
        ojo_izquierdo: f.ojo_izquierdo || '',
        usa_lentes: !!f.usa_lentes,
        audiometria_realizada: !!f.audiometria_realizada,
        audiometria_resultado: f.audiometria_resultado || '',
        hallazgos: Object.fromEntries(
          Object.entries(hallazgos).map(([k, v]) => [k, { estado: v.estado, detalle: v.detalle, checks: v.checks }]),
        ),
        derivaciones: Object.fromEntries(Object.entries(derivs).map(([k, v]) => [k, { deriva: v.deriva, motivo: v.motivo }])),
      };
  }

  if (loading) return <AppCard>Cargando…</AppCard>;

  const check = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
      <input type="checkbox" checked={value} disabled={ro} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  const checkFijo = (label: string, value: boolean) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '2px 0' }}>
      <input type="checkbox" checked={value} disabled />
      {label}
    </label>
  );

  // Checks automáticos de PAS/PAD (uno por par: PC y mmHg).
  const checksPresion = (valor: any, umbral: number) => {
    const v = parseInt(String(valor ?? '').trim(), 10);
    const ok = !isNaN(v);
    return (
      <>
        {checkFijo('PC Menor a 90', ok && v < 90)}
        {checkFijo('PC Mayor a 90', ok && v >= 90)}
        {checkFijo(`Menor a ${umbral} mmHg`, ok && v < umbral)}
        {checkFijo(`Mayor o igual a ${umbral} mmHg`, ok && v >= umbral)}
      </>
    );
  };

  const siNo = (label: string, value: string, onChange: (v: string) => void) => (
    <Field label={label}>
      <SelectInput value={value} disabled={ro} onChange={(e) => onChange(e.target.value)}>
        <option value="">…</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </SelectInput>
    </Field>
  );

  const mostrarCarnet = !!f.trajo_carnet;
  const mostrarAplicadas = !!f.trajo_carnet && !f.carnet_completo;

  return (
    <div>
      <PageHeader title="Evaluación médica" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
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
      {errorCarga && (
        <div className="form-error" style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
          No se pudieron cargar los datos. Revisá la conexión con el backend y recargá la página.
        </div>
      )}
      {noEditable && <div className="info-box ok">🔒 Operativo finalizado — solo lectura</div>}
      {!noEditable && !enCurso && (
        <div className="info-box">Solo se puede cargar cuando el operativo está en curso</div>
      )}
      <div style={{ opacity: enCurso ? 1 : 0.85 }}>
        <AppCard>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Paso {Math.min(paso, 7) + 1} de 8 · {TITULOS_PASOS[Math.min(paso, 7)]}
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,.08)', borderRadius: 4, margin: '8px 0' }}>
            <div style={{ width: `${((Math.min(paso, 7) + 1) / 8) * 100}%`, height: '100%', background: 'var(--primario)', borderRadius: 4 }} />
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
          <h3>Examen clínico</h3>
          {check('Examen realizado', !!f.examen_realizado, (v) => setCampo('examen_realizado', v))}
          {!f.examen_realizado && (
            <Field label="Motivo de no examen *">
              <SelectInput value={f.motivo_no_examen || ''} disabled={ro} onChange={(e) => set('motivo_no_examen', e.target.value)}>
                <option value="">…</option>
                <option value="negativa_familiar">Negativa familiar</option>
                <option value="negativa_nino">Negativa del niño</option>
                <option value="ausente">Ausente</option>
                <option value="otros">Otros</option>
              </SelectInput>
            </Field>
          )}
          {!!f.examen_realizado && (
            <Field label="Lugar del examen *">
              <SelectInput value={f.lugar_examen || ''} disabled={ro} onChange={(e) => set('lugar_examen', e.target.value)}>
                <option value="">…</option>
                <option value="escuela">Escuela</option>
                <option value="centro_salud">Centro de salud</option>
              </SelectInput>
            </Field>
          )}
        </AppCard>
        )}

        {paso === 1 && (
        <AppCard>
          <h3>Antropometría</h3>
          {check('Sección evaluada', !!f.antropometria_evaluada, (v) => setCampo('antropometria_evaluada', v))}
          {!f.antropometria_evaluada && <div className="hint" style={{ fontStyle: 'italic' }}>Sección no evaluada.</div>}
          {!!f.antropometria_evaluada && (
            <>
              <Field label="Peso (kg) *">
                <TextInput type="number" value={f.peso ?? ''} disabled={ro} onChange={(e) => set('peso', e.target.value)} />
              </Field>
              <Field label="Talla (cm) *">
                <TextInput type="number" value={f.talla ?? ''} disabled={ro} onChange={(e) => set('talla', e.target.value)} />
              </Field>
              <Field label="IMC" hint="Se calcula automáticamente con peso y talla">
                <TextInput value={imc} disabled readOnly />
              </Field>
              <Field label="Percentil talla *">
                <SelectInput value={f.percentil_talla || ''} disabled={ro} onChange={(e) => set('percentil_talla', e.target.value)}>
                  <option value="">…</option>
                  <option value="menor_3">Menor a 3</option>
                  <option value="mayor_igual_3">Mayor o igual a 3</option>
                </SelectInput>
              </Field>
              <Field label="Percentil IMC *">
                <SelectInput value={f.percentil_imc || ''} disabled={ro} onChange={(e) => set('percentil_imc', e.target.value)}>
                  <option value="">…</option>
                  <option value="menor_3">Menor a 3</option>
                  <option value="entre_3_9">Entre 3 y 9</option>
                  <option value="entre_10_84">Entre 10 y 84</option>
                  <option value="entre_85_97">Entre 85 y 97</option>
                  <option value="mayor_97">Mayor a 97</option>
                </SelectInput>
              </Field>
            </>
          )}
        </AppCard>
        )}

        {paso === 2 && (
        <AppCard>
          <h3>Presión arterial</h3>
          {check('Sección evaluada', !!f.presion_evaluada, (v) => setCampo('presion_evaluada', v))}
          {!f.presion_evaluada && <div className="hint" style={{ fontStyle: 'italic' }}>Sección no evaluada.</div>}
          {!!f.presion_evaluada && (
            <>
              <Field label="PAS (sistólica) *">
                <TextInput type="number" value={f.pas ?? ''} disabled={ro} onChange={(e) => set('pas', e.target.value)} />
              </Field>
              {checksPresion(f.pas, 130)}
              <Field label="PAD (diastólica) *">
                <TextInput type="number" value={f.pad ?? ''} disabled={ro} onChange={(e) => set('pad', e.target.value)} />
              </Field>
              {checksPresion(f.pad, 80)}
              <Field label="Clasificación">
                <TextInput value={f.presion_clasificacion ?? ''} disabled={ro} onChange={(e) => set('presion_clasificacion', e.target.value)} />
              </Field>
            </>
          )}
        </AppCard>
        )}

        {paso === 3 && (
        <AppCard>
          <h3>Agudeza visual / Audiometría</h3>
          {check('Agudeza evaluada', !!f.agudeza_evaluada, (v) => setCampo('agudeza_evaluada', v))}
          {!!f.agudeza_evaluada && (
            <>
              <Field label="Ojo derecho *">
                <SelectInput value={f.ojo_derecho || ''} disabled={ro} onChange={(e) => set('ojo_derecho', e.target.value)}>
                  <option value="">…</option>
                  {OJOS.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectInput>
              </Field>
              <Field label="Ojo izquierdo *">
                <SelectInput value={f.ojo_izquierdo || ''} disabled={ro} onChange={(e) => set('ojo_izquierdo', e.target.value)}>
                  <option value="">…</option>
                  {OJOS.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectInput>
              </Field>
            </>
          )}
          {check('Usa lentes', !!f.usa_lentes, (v) => set('usa_lentes', v))}
          {check('Audiometría realizada', !!f.audiometria_realizada, (v) => setCampo('audiometria_realizada', v))}
          {!!f.audiometria_realizada && (
            <Field label="Resultado audiometría *">
              <SelectInput value={f.audiometria_resultado || ''} disabled={ro} onChange={(e) => set('audiometria_resultado', e.target.value)}>
                <option value="">…</option>
                <option value="pasa">Pasa</option>
                <option value="no_pasa">No pasa</option>
              </SelectInput>
            </Field>
          )}
        </AppCard>
        )}

        {paso === 4 && (
        <AppCard>
          <h3>Hallazgos clínicos</h3>
          {HALLAZGO_SISTEMAS.map((s) => {
            const h = hallazgos[s] ?? { estado: 'no_eval', detalle: '', checks: [] };
            const conHallazgos = h.estado === 'con';
            const checks = HALLAZGO_CHECKS[s] ?? [];
            const toggleCheck = (id: string, on: boolean) => {
              const next = on ? [...h.checks, id] : h.checks.filter((c) => c !== id);
              setHallazgos((hh) => ({
                ...hh,
                [s]: { ...h, checks: next, detalle: next.includes('otro') ? h.detalle : '' },
              }));
            };
            return (
              <div key={s} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{HALLAZGO_LABELS[s]}</strong>
                <div style={{ height: 6 }} />
                <Field label="Estado">
                  <SelectInput
                    value={h.estado}
                    disabled={ro}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHallazgos((hh) => ({
                        ...hh,
                        [s]: v === 'con' ? { ...h, estado: 'con' } : { estado: v, detalle: '', checks: [] },
                      }));
                    }}
                  >
                    <option value="con">Con hallazgos</option>
                    <option value="sin">Sin hallazgos</option>
                    <option value="no_eval">No evaluado</option>
                  </SelectInput>
                </Field>
                {conHallazgos && checks.map((c) => (
                  <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '2px 0' }}>
                    <input
                      type="checkbox"
                      checked={h.checks.includes(c.id)}
                      disabled={ro}
                      onChange={(e) => toggleCheck(c.id, e.target.checked)}
                    />
                    {c.label}
                  </label>
                ))}
                {conHallazgos && h.checks.includes('otro') && (
                  <Field label="¿Cuál? *">
                    <TextInput
                      value={h.detalle}
                      disabled={ro}
                      onChange={(e) => setHallazgos((hh) => ({ ...hh, [s]: { ...h, detalle: e.target.value } }))}
                    />
                  </Field>
                )}
              </div>
            );
          })}
        </AppCard>
        )}

        {paso === 5 && (
        <AppCard>
          <h3>Vacunación</h3>
          {check('Trajo carnet', !!f.trajo_carnet, (v) => setTrajoCarnet(v))}
          {!mostrarCarnet && <div className="hint" style={{ fontStyle: 'italic' }}>Sin carnet: no se cargan más datos de vacunación.</div>}
          {mostrarCarnet && check('Carnet completo', !!f.carnet_completo, (v) => setCarnetCompleto(v))}
          {mostrarAplicadas && siNo('¿Se aplicaron vacunas? *', aplicadas, (v) => {
            setAplicadas(v);
            if (v === 'no') {
              set('vacunas_aplicadas', '');
              setIndicadas('');
              set('vacunas_indicadas', '');
            }
          })}
          {mostrarAplicadas && aplicadas === 'si' && (
            <Field label="¿Cuáles? *">
              <TextInput value={f.vacunas_aplicadas ?? ''} disabled={ro} onChange={(e) => set('vacunas_aplicadas', e.target.value)} />
            </Field>
          )}
          {mostrarAplicadas && aplicadas === 'no' && siNo('¿Se indicaron vacunas faltantes? *', indicadas, (v) => {
            setIndicadas(v);
            if (v === 'no') set('vacunas_indicadas', '');
          })}
          {mostrarAplicadas && aplicadas === 'no' && indicadas === 'si' && (
            <Field label="¿Cuáles? *">
              <TextInput value={f.vacunas_indicadas ?? ''} disabled={ro} onChange={(e) => set('vacunas_indicadas', e.target.value)} />
            </Field>
          )}
        </AppCard>
        )}

        {paso === 6 && (
        <AppCard>
          <h3>Derivaciones</h3>
          {DERIV_ESPS.map((e) => (
            <div key={e} style={{ marginBottom: 6 }}>
              {check(`Deriva a ${DERIV_LABELS[e]}`, !!derivs[e]?.deriva, (v) =>
                setDerivs((d) => ({ ...d, [e]: { deriva: v, motivo: v ? (d[e]?.motivo ?? '') : '' } })),
              )}
              {derivs[e]?.deriva && (
                <Field label="Motivo">
                  <TextInput
                    value={derivs[e]?.motivo ?? ''}
                    disabled={ro}
                    onChange={(ev) => setDerivs((d) => ({ ...d, [e]: { ...d[e], motivo: ev.target.value } }))}
                  />
                </Field>
              )}
            </div>
          ))}
        </AppCard>
        )}

        {paso === 7 && (
        <AppCard>
          <h3>Revisión</h3>
          {TITULOS_PASOS.slice(0, 7).map((t, i) => {
            const ok = validarPaso(i) == null;
            return (
              <div
                key={t}
                onClick={() => setPaso(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}
              >
                <span style={{ color: ok ? 'green' : 'orange' }}>{ok ? '✓' : '!'}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
                <span style={{ color: '#999' }}>›</span>
              </div>
            );
          })}
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
            {paso < 7 ? (
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
    </div>
  );
}
