import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, Field, MIcon, Modal, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

// Etiquetas espejo de escuela_datos_screen.dart.
const SINO: Record<string, string> = { SI: 'Sí', NO: 'No', NO_SABE: 'No sabe' };
const SEXO: Record<string, string> = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };
const COBERTURA: Record<string, string> = {
  obra_social: 'Obra Social (incluye PAMI)',
  estatal: 'Programas o planes estatales',
  prepaga: 'Plan privado o Prepaga',
  sin_cobertura: 'No tiene',
};
const ULTIMA_CONSULTA: Record<string, string> = {
  menos_1_anio: 'Hace menos de 1 año',
  mas_1_anio: 'Hace más de 1 año',
  no_recuerda: 'No recuerda',
  NINGUNA: 'Ninguna',
};
const MOTIVO_NO_EXAMEN: Record<string, string> = {
  negativa_familiar: 'Negativa familiar',
  negativa_nino: 'Negativa del niño',
  ausente: 'Ausente',
  otros: 'Otros',
};
const LUGAR_EXAMEN: Record<string, string> = { escuela: 'En la escuela', centro_salud: 'En el centro de salud' };
const PERC_TALLA: Record<string, string> = { menor_3: 'Menor a 3', mayor_igual_3: 'Mayor o igual a 3' };
const PERC_IMC: Record<string, string> = {
  menor_3: 'Menor a 3 (emaciación)',
  entre_3_9: 'Entre 3 y 9 (riesgo de bajo peso)',
  entre_10_84: 'Entre 10 y 84 (normal)',
  entre_85_97: 'Entre 85 y 97 (sobrepeso)',
  mayor_97: 'Mayor a 97 (obesidad)',
};
const AUDIO: Record<string, string> = { pasa: 'Pasa', no_pasa: 'No pasa' };
const SALUD_BUCAL: Record<string, string> = { con_hallazgos: 'Con hallazgos', sin_hallazgos: 'Sin hallazgos', no_eval: 'No evaluado' };
const HALLAZGO_LABELS: Record<string, string> = {
  piel: 'Piel y faneras', partes_blandas: 'Partes blandas', cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio', abdominal: 'Abdominal',
  genitourinario_ninos: 'Genitourinario (Niños)', genitourinario_ninas: 'Genitourinario (Niñas)',
  osteoarticular: 'Osteoarticular', neurologico: 'Neurológico', salud_visual: 'Salud visual',
  salud_fonoaudiologica: 'Salud fonoaudiológica', icv: 'ICV',
  genitourinario: 'Genitourinario', fonoaudiologica: 'Fonoaudiológica',
};
const SISTEMAS = [
  'piel', 'partes_blandas', 'cardiovascular', 'respiratorio', 'abdominal',
  'genitourinario_ninos', 'genitourinario_ninas', 'osteoarticular', 'neurologico',
  'salud_visual', 'salud_fonoaudiologica', 'icv', 'genitourinario', 'fonoaudiologica',
];
const HALLAZGO_CHECK_LABELS: Record<string, Record<string, string>> = {
  piel: {
    nevo_derivacion: 'Nevos con criterio de derivación (Asimetría, bordes, color, diámetro, evolución)',
    escabiosis: 'Escabiosis', piodermitis: 'Piodermitis', pediculosis: 'Pediculosis', otro: 'Otro',
  },
  partes_blandas: {
    adenomegalia_localizada: 'Adenomegalia localizada',
    adenomegalias_generalizada: 'Adenomegalias generalizadas', otro: 'Otro',
  },
  cardiovascular: {
    presion_elevada: 'Presión arterial elevada',
    pulso_alterado: 'Ausencia o alteración del pulso humeral, radial o femoral (uni o bilateral)',
    soplo: 'Soplo', arritmia: 'Arritmia', otro: 'Otro',
  },
  respiratorio: {
    hallazgo_auscultatorio: 'Hallazgo auscultatorio', respiracion_bucal: 'Respiración bucal', otro: 'Otro',
  },
  abdominal: {
    hepatomegalia: 'Hepatomegalia', masa_palpable: 'Masa palpable', esplenomegalia: 'Esplenomegalia',
    hernias: 'Hernias', otro: 'Otro',
  },
  genitourinario_ninos: {
    pubertad_precoz: 'Signos de pubertad precoz (en niños menores de 9 años)',
    testiculo_no_descendido: 'Testículo/s no descendido/s', hernia: 'Hernia', fimosis: 'Fimosis',
    asimetria_testicular: 'Asimetría testicular', varicocele: 'Varicocele', otro: 'Otro',
  },
  genitourinario_ninas: {
    pubertad_precoz: 'Signos de pubertad precoz (en niñas menores de 8 años)', otro: 'Otro',
  },
  osteoarticular: {
    adams_positiva: 'Maniobra de Adams positiva', alteracion_marcha: 'Alteraciones de la marcha', otro: 'Otro',
  },
  neurologico: {
    paresias_focales: 'Paresias o signos focales', movimientos_anormales: 'Movimientos anormales', otro: 'Otro',
  },
  salud_visual: {
    disminucion_agudeza: 'Disminución de agudeza visual', estrabismo: 'Estrabismo',
    posicion_cabeza: 'Posición anormal de la cabeza', ojo_externo: 'Alteraciones del ojo externo', otro: 'Otro',
  },
  salud_fonoaudiologica: {
    audiometria_no_pasa: "'No pasa' Audiometría/barrido tonal",
    alteracion_lenguaje: 'Alteraciones en el lenguaje, habla y/o comunicación', otro: 'Otro',
  },
};
const DERIV_LABELS: Record<string, string> = {
  odontologia: 'Odontología', oftalmologia: 'Oftalmología', nutricion: 'Nutrición',
  neurologia: 'Neurología', cardiologia: 'Cardiología', fonoaudiologia: 'Fonoaudiología',
  psicologia: 'Psicología', otros: 'Otros',
};
const ESTADO_PIEZA: Record<string, string> = {
  '': 'Normal', ausente: 'Ausente', perdido: 'Perdido', extraido: 'Extraído',
  corona: 'Corona', protesis: 'Prótesis', implante: 'Implante',
  a_extraer: 'Para extraer', fractura_total: 'Fractura total',
};
const ESTADO_CARA: Record<string, string> = {
  '': 'Sana', caries: 'Caries', restauracion: 'Restauración', sellador: 'Sellador',
  fractura: 'Fractura', a_tratar: 'A tratar', tratada: 'Tratada',
};
const ESTADO_RAIZ: Record<string, string> = { '': 'Normal', conducto_realizado: 'Conducto realizado', conducto_pendiente: 'Conducto pendiente' };
const CARA_LABELS: Record<string, string> = {
  oclusal: 'Oclusal', mesial: 'Mesial', distal: 'Distal', vestibular: 'Vestibular', lingual: 'Lingual / palatina',
};

const txt = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
const mapVal = (labels: Record<string, string>, v: any) => {
  const k = txt(v);
  return labels[k] ?? k;
};
const siNo = (v: any) => (v === true ? 'Sí' : 'No');
const fmtFecha = (iso: any) => {
  const s = txt(iso).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
};

function Fila({ label, valor }: { label: string; valor: any }) {
  const v = txt(valor);
  return (
    <div style={{ display: 'flex', gap: 8, paddingBottom: 6, fontSize: 12 }}>
      <span style={{ width: 170, flexShrink: 0, color: 'var(--texto-suave)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{v === '' ? '—' : v}</span>
    </div>
  );
}

function TituloFicha({ icono, titulo }: { icono: string; titulo: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ color: 'var(--primario)' }}>
        <MIcon name={icono} size={18} />
      </span>
      <h3 style={{ margin: 0 }}>{titulo}</h3>
    </div>
  );
}

// Pantalla "Ver datos" espejo de escuela_datos_screen.dart: en solo lectura
// muestra la ficha completa (datos + cobertura + antecedentes + eval médica +
// eval odontológica); con permiso muestra el formulario de A y debajo la
// ficha de M y O.
export default function EscuelaDatos() {
  const { opId, alumnoId } = useParams();
  const nav = useNavigate();
  const { can, usuario } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noEditable, setNoEditable] = useState(true);
  const [raw, setRaw] = useState<any>(null);
  const [f, setF] = useState<any>({});
  const [paso, setPaso] = useState(0);
  // Sección escuela (paso 3): se carga junto pero solo se guarda si se visita.
  const [ePreocupa, setEPreocupa] = useState(false);
  const [eDetalle, setEDetalle] = useState('');
  const [eLenguaje, setELenguaje] = useState(false);
  const [eTratamiento, setETratamiento] = useState(false);
  const [eVisitado, setEVisitado] = useState(false);
  // Firma de lo último persistido para el dirty guard.
  const firmaGuardada = useRef('');

  // Pasos del wizard (A en 3 partes + E + revisión). Mismo orden que la app.
  const TITULOS_PASOS = [
    'Datos del niño', 'Domicilio y cobertura', 'Antecedentes',
    'Sección escuela', 'Revisión',
  ];

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setPreocupa = (v: boolean) => {
    setEPreocupa(v);
    if (!v) setEDetalle('');
  };

  // Firma del estado para detectar cambios sin guardar (dirty guard).
  function firmaActual(): string {
    return JSON.stringify({
      f, ePreocupa, eDetalle, eLenguaje, eTratamiento,
    });
  }
  function marcarGuardado() {
    firmaGuardada.current = firmaActual();
  }
  const tieneCambios = firmaActual() !== firmaGuardada.current;

  useEffect(() => {
    (async () => {
      try {
        const [op, datos, seccion] = await Promise.all([
          v1Api.get(`/operativos/${opId}/`),
          v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/datos/`),
          v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/seccion-escuela/`).catch(() => ({ data: {} })),
        ]);
        const bloqueado = op.data.estado === 'finalizado' || op.data.estado === 'cancelado';
        const puede = can('cargarAntecedentesNino') || usuario?.rolName === 'superadmin';
        setNoEditable(bloqueado || !puede);
        const d = datos.data ?? {};
        setRaw(d);
        setF({
          nombre: d.persona?.nombre ?? d.operativo_alumno?.nombre ?? '',
          apellido: d.persona?.apellido ?? d.operativo_alumno?.apellido ?? '',
          dni: d.persona?.dni ?? d.operativo_alumno?.dni ?? '',
          sexo: d.persona?.sexo ?? d.operativo_alumno?.sexo ?? '',
          fecha_nacimiento: (d.persona?.fecha_nacimiento ?? d.operativo_alumno?.fecha_nacimiento ?? '').slice(0, 10),
          edad: d.paciente?.edad ?? '',
          celular: d.paciente?.celular ?? '',
          tipo_cobertura: d.paciente?.tipo_cobertura ?? '',
          nombre_cobertura: d.paciente?.nombre_cobertura ?? '',
          localidad: d.domicilio?.localidad ?? '',
          nacio_prematuro: d.antecedentes?.nacio_prematuro ?? 'NO',
          peso_nacimiento: d.antecedentes?.peso_nacimiento ?? '',
          asma_espasmos: d.antecedentes?.asma_espasmos ?? 'NO',
          ultima_consulta_medica: d.antecedentes?.ultima_consulta_medica ?? 'NINGUNA',
          otros_problemas_salud: d.antecedentes?.otros_problemas_salud ?? '',
        });
        const sec = seccion.data ?? {};
        const preocupa = !!sec.escuela_preocupa_salud;
        const detalle = preocupa ? (sec.escuela_preocupa_detalle ?? '') : '';
        setEPreocupa(preocupa);
        setEDetalle(detalle);
        setELenguaje(!!sec.escuela_dificultad_lenguaje);
        setETratamiento(!!sec.escuela_bajo_tratamiento);
        firmaGuardada.current = JSON.stringify({
          f: {
            nombre: d.persona?.nombre ?? d.operativo_alumno?.nombre ?? '',
            apellido: d.persona?.apellido ?? d.operativo_alumno?.apellido ?? '',
            dni: d.persona?.dni ?? d.operativo_alumno?.dni ?? '',
            sexo: d.persona?.sexo ?? d.operativo_alumno?.sexo ?? '',
            fecha_nacimiento: (d.persona?.fecha_nacimiento ?? d.operativo_alumno?.fecha_nacimiento ?? '').slice(0, 10),
            edad: d.paciente?.edad ?? '',
            celular: d.paciente?.celular ?? '',
            tipo_cobertura: d.paciente?.tipo_cobertura ?? '',
            nombre_cobertura: d.paciente?.nombre_cobertura ?? '',
            localidad: d.domicilio?.localidad ?? '',
            nacio_prematuro: d.antecedentes?.nacio_prematuro ?? 'NO',
            peso_nacimiento: d.antecedentes?.peso_nacimiento ?? '',
            asma_espasmos: d.antecedentes?.asma_espasmos ?? 'NO',
            ultima_consulta_medica: d.antecedentes?.ultima_consulta_medica ?? 'NINGUNA',
            otros_problemas_salud: d.antecedentes?.otros_problemas_salud ?? '',
          },
          ePreocupa: preocupa, eDetalle: detalle,
          eLenguaje: !!sec.escuela_dificultad_lenguaje,
          eTratamiento: !!sec.escuela_bajo_tratamiento,
        });
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudo cargar'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  // Valida la sección actual (Siguiente bloqueante). Solo el paso 0
  // (datos del niño) tiene obligatorios.
  function validarPaso(p: number): string | null {
    if (p !== 0) return null;
    if (!String(f.nombre ?? '').trim() || !String(f.apellido ?? '').trim() ||
        !String(f.dni ?? '').trim()) {
      return 'Nombre, apellido y DNI son obligatorios';
    }
    if (!String(f.fecha_nacimiento ?? '').trim()) {
      return 'Seleccioná la fecha de nacimiento';
    }
    return null;
  }

  // Intenta avanzar validando la sección actual y persistiendo el avance
  // (autoguardado al Siguiente). Si falla la red se queda en el paso.
  // Al salir del paso E se incluye su guardado aunque sea la primera visita.
  async function intentarAvanzar() {
    const msg = validarPaso(paso);
    if (msg) {
      toast.push('error', msg);
      return;
    }
    const eAhora = eVisitado || paso === 3;
    if (paso === 3 && !eVisitado) setEVisitado(true);
    const ok = await guardarAvanceConE(eAhora);
    if (ok) setPaso(Math.min(paso + 1, 4));
  }

  function irAPaso(i: number) {
    if (i === 3) setEVisitado(true);
    setPaso(Math.max(0, Math.min(i, 4)));
  }

  async function guardar() {
    const msg = validarPaso(0);
    if (msg) {
      toast.push('error', msg);
      setPaso(0);
      return;
    }
    await enviar(false, 'Datos personales y familia guardados ✓ (A)', true, eVisitado);
  }

  // Guarda el avance sin validar todo ni marcar completado.
  // Devuelve si persistió (para el autoguardado al Siguiente).
  async function guardarAvanceConE(eIncluirE: boolean): Promise<boolean> {
    return enviar(true, 'Avance guardado', false, eIncluirE);
  }

  async function enviar(parcial: boolean, okMsg: string, completar: boolean, eIncluirE: boolean): Promise<boolean> {
    setSaving(true);
    try {
      await v1Api.patch(`/operativos/${opId}/alumnos/${alumnoId}/datos/`, {
        ...payload(),
        completar,
      });
      // La sección E solo se guarda si se visitó (paso 3).
      if (eIncluirE) {
        await v1Api.patch(`/operativos/${opId}/alumnos/${alumnoId}/seccion-escuela/`, {
          escuela_preocupa_salud: ePreocupa,
          escuela_preocupa_detalle: ePreocupa ? eDetalle : '',
          escuela_dificultad_lenguaje: eLenguaje,
          escuela_bajo_tratamiento: eTratamiento,
          completar,
        });
      }
      marcarGuardado();
      if (!parcial) toast.push('ok', okMsg);
      if (!parcial) nav(`/operativos/${opId}/alumnos/${alumnoId}`);
      return true;
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  function payload() {
    return {
        ...f,
        antecedentes: {
          nacio_prematuro: f.nacio_prematuro,
          peso_nacimiento: f.peso_nacimiento,
          asma_espasmos: f.asma_espasmos,
          otros_problemas_salud: f.otros_problemas_salud,
          ultima_consulta_medica: f.ultima_consulta_medica,
        },
      };
  }

  // Bloquea salidas (botón atrás, links, recarga) con cambios sin guardar.
  // NOTA: los hooks siempre antes de cualquier return anticipado.
  const blocker = useBlocker(tieneCambios && !noEditable && !loading);

  if (loading) return <AppCard>Cargando…</AppCard>;
  const ro = noEditable;
  const al = raw?.operativo_alumno ?? {};
  const per = raw?.persona ?? null;
  const pac = raw?.paciente ?? null;
  const dom = raw?.domicilio ?? null;
  const ant = raw?.antecedentes ?? null;
  const em = raw?.evaluacion_medica ?? null;
  const eo = raw?.evaluacion_odontologica ?? null;
  const fam = raw?.antecedente_familiar ?? null;
  const consent = raw?.consentimiento ?? null;
  const tutor = raw?.tutor ?? null;

  const fichaDatos = (
    <AppCard>
      <TituloFicha icono="person" titulo="Datos personales" />
      <Fila label="Nombre" valor={per?.nombre ?? al.nombre} />
      <Fila label="Apellido" valor={per?.apellido ?? al.apellido} />
      <Fila label="DNI" valor={per?.dni ?? al.dni} />
      <Fila label="Fecha de nacimiento" valor={fmtFecha(per?.fecha_nacimiento ?? al.fecha_nacimiento)} />
      <Fila label="Sexo" valor={mapVal(SEXO, per?.sexo ?? al.sexo)} />
      <Fila label="Edad" valor={pac?.edad} />
      <Fila label="Localidad" valor={dom?.localidad} />
    </AppCard>
  );

  const fichaCobertura = (
    <AppCard>
      <TituloFicha icono="phone" titulo="Cobertura y contacto" />
      <Fila label="Celular" valor={pac?.celular} />
      <Fila label="Teléfono fijo" valor={pac?.telefono_fijo} />
      <Fila label="¿Tiene CUD?" valor={mapVal(SINO, pac?.tiene_cud ?? 'NO')} />
      <Fila label="Tipo cobertura" valor={mapVal(COBERTURA, pac?.tipo_cobertura ?? '')} />
      <Fila label="Nombre cobertura" valor={pac?.nombre_cobertura} />
    </AppCard>
  );

  const fichaAntecedentes = ant ? (
    <AppCard>
      <TituloFicha icono="assignment" titulo="Antecedentes personales" />
      <Fila label="Nació prematuro" valor={mapVal(SINO, ant.nacio_prematuro ?? 'NO')} />
      <Fila label="Peso al nacer" valor={ant.peso_nacimiento} />
      <Fila label="Convulsiones/Epilepsia" valor={mapVal(SINO, ant.convulsiones_epilepsia ?? 'NO')} />
      <Fila label="Mareos/Desmayos" valor={mapVal(SINO, ant.mareos_desmayos ?? 'NO')} />
      <Fila label="Infecciones urinarias" valor={mapVal(SINO, ant.infecciones_urinarias ?? 'NO')} />
      <Fila label="Asma/Espasmos" valor={mapVal(SINO, ant.asma_espasmos ?? 'NO')} />
      <Fila label="Tuberculosis" valor={mapVal(SINO, ant.tuberculosis ?? 'NO')} />
      <Fila label="Diabetes" valor={mapVal(SINO, ant.diabetes ?? 'NO')} />
      <Fila label="Hipertensión" valor={mapVal(SINO, ant.hipertension ?? 'NO')} />
      <Fila label="Cardiopatía congénita" valor={mapVal(SINO, ant.cardiopatia_congenita ?? 'NO')} />
      <Fila label="Traumatismo/Internación" valor={mapVal(SINO, ant.traumatismo_internacion ?? 'NO')} />
      <Fila label="Diarrea frecuente" valor={mapVal(SINO, ant.diarrea_frecuente ?? 'NO')} />
      <Fila label="Infecciones de oído" valor={mapVal(SINO, ant.infecciones_oido ?? 'NO')} />
      <Fila label="¿Estuvo internado?" valor={mapVal(SINO, ant.internacion_previa ?? 'NO')} />
      {txt(ant.causa_hospitalizacion) !== '' && <Fila label="Causa de hospitalización" valor={ant.causa_hospitalizacion} />}
      <Fila label="Tratamiento actual" valor={mapVal(SINO, ant.tratamiento_actual ?? 'NO')} />
      {txt(ant.descripcion_tratamiento) !== '' && <Fila label="Descripción del tratamiento" valor={ant.descripcion_tratamiento} />}
      <Fila label="Última consulta médica" valor={mapVal(ULTIMA_CONSULTA, ant.ultima_consulta_medica ?? 'NINGUNA')} />
      {txt(ant.otros_problemas_salud) !== '' && <Fila label="Otros problemas de salud" valor={ant.otros_problemas_salud} />}
      <Fila label="Primera menstruación" valor={mapVal(SINO, ant.primera_menstruacion ?? 'NO')} />
      {txt(ant.edad_primera_menstruacion) !== '' && <Fila label="Edad primera menstruación" valor={ant.edad_primera_menstruacion} />}
    </AppCard>
  ) : null;

  const tutorNom = `${tutor?.nombre ?? ''} ${tutor?.apellido ?? ''}`.trim();
  const fichaFamilia = (fam || consent || tutor) ? (
    <AppCard>
      <TituloFicha icono="family_restroom" titulo="Familia y consentimiento" />
      {(tutorNom || tutor?.parentesco) && (
        <Fila
          label="Responsable"
          valor={[tutorNom, tutor?.parentesco ? `(${tutor.parentesco})` : '', tutor?.dni ? `DNI ${tutor.dni}` : ''].filter(Boolean).join(' ')}
        />
      )}
      {consent && (
        <Fila label="Consentimiento" valor={consent.aceptado ? 'Aceptado' : 'Pendiente'} />
      )}
      {fam?.problemas_salud === 'SI' && (
        <Fila label="Ant. familiares" valor={fam.detalle_problema_salud || 'Sí'} />
      )}
      {fam?.familiar_con_muerte_subita === 'SI' && (
        <Fila label="Muerte súbita familiar" valor="Sí" />
      )}
    </AppCard>
  ) : null;

  const hallazgoFilas = () => {
    const h = em?.hallazgos ?? {};
    const filas = [];
    for (const s of SISTEMAS) {
      const item = h[s];
      if (!item || typeof item !== 'object') continue;
      const estado = txt(item.estado);
      const detalle = txt(item.detalle);
      const labels = HALLAZGO_CHECK_LABELS[s] ?? {};
      const checks = Array.isArray(item.checks)
        ? item.checks.map((c: any) => labels[String(c)] ?? String(c)).filter((x: string) => x !== '')
        : [];
      if ((estado === '' || estado === 'no_eval') && detalle === '' && checks.length === 0) continue;
      filas.push(
        <Fila
          key={s}
          label={HALLAZGO_LABELS[s] ?? s}
          valor={[estado !== '' ? mapVal({ con: 'Con hallazgos', sin: 'Sin hallazgos', no_eval: 'No evaluado' }, estado) : '', ...checks, detalle !== '' ? detalle : ''].filter(Boolean).join(' — ')}
        />,
      );
    }
    if (filas.length === 0) filas.push(<Fila key="vacio" label="Hallazgos" valor="Sin hallazgos registrados" />);
    return filas;
  };

  const derivFilas = () => {
    const dv = em?.derivaciones ?? {};
    const filas = [];
    for (const [esp, item] of Object.entries<any>(dv)) {
      if (item && typeof item === 'object' && item.deriva === true) {
        filas.push(<Fila key={esp} label={`Deriva a ${DERIV_LABELS[esp] ?? esp}`} valor={item.motivo} />);
      }
    }
    if (filas.length === 0) filas.push(<Fila key="vacio" label="Derivaciones" valor="Sin derivaciones" />);
    return filas;
  };

  const fichaEvalMedica = em ? (
    <AppCard>
      <TituloFicha icono="medical_services" titulo="Evaluación médica" />
      {!em.completada && <div className="hint" style={{ fontStyle: 'italic', marginBottom: 6 }}>Pendiente de completar</div>}
      <Fila label="Profesional" valor={em.profesional} />
      <Fila label="Examen realizado" valor={siNo(em.examen_realizado)} />
      {txt(em.motivo_no_examen) !== '' && <Fila label="Motivo de no examen" valor={mapVal(MOTIVO_NO_EXAMEN, em.motivo_no_examen)} />}
      {txt(em.lugar_examen) !== '' && <Fila label="Lugar del examen" valor={mapVal(LUGAR_EXAMEN, em.lugar_examen)} />}
      <Fila label="Peso (kg)" valor={em.peso} />
      <Fila label="Talla (cm)" valor={em.talla} />
      <Fila label="IMC" valor={em.imc} />
      {txt(em.percentil_talla) !== '' && <Fila label="Percentil talla" valor={mapVal(PERC_TALLA, em.percentil_talla)} />}
      {txt(em.percentil_imc) !== '' && <Fila label="Percentil IMC" valor={mapVal(PERC_IMC, em.percentil_imc)} />}
      <Fila label="PAS (sistólica)" valor={em.pas} />
      <Fila label="PAD (diastólica)" valor={em.pad} />
      {txt(em.presion_clasificacion) !== '' && <Fila label="Clasificación presión" valor={em.presion_clasificacion} />}
      <Fila label="Agudeza evaluada" valor={siNo(em.agudeza_evaluada)} />
      <Fila label="Ojo derecho" valor={em.ojo_derecho} />
      <Fila label="Ojo izquierdo" valor={em.ojo_izquierdo} />
      <Fila label="Usa lentes" valor={siNo(em.usa_lentes)} />
      <Fila label="Audiometría realizada" valor={siNo(em.audiometria_realizada)} />
      {txt(em.audiometria_resultado) !== '' && <Fila label="Resultado audiometría" valor={mapVal(AUDIO, em.audiometria_resultado)} />}
      <Fila label="Trajo carnet" valor={siNo(em.trajo_carnet)} />
      <Fila label="Carnet completo" valor={siNo(em.carnet_completo)} />
      {txt(em.vacunas_aplicadas) !== '' && <Fila label="Vacunas aplicadas" valor={em.vacunas_aplicadas} />}
      {txt(em.vacunas_indicadas) !== '' && <Fila label="Vacunas indicadas" valor={em.vacunas_indicadas} />}
      {hallazgoFilas()}
      {derivFilas()}
    </AppCard>
  ) : null;

  const odontoPiezas = () => {
    const odo = eo?.odontograma;
    if (!odo || typeof odo !== 'object' || Object.keys(odo).length === 0) {
      return <Fila label="Odontograma" valor="Sin piezas cargadas" />;
    }
    return Object.entries<any>(odo).map(([pieza, item]) => {
      if (!item || typeof item !== 'object') return null;
      return (
        <div key={pieza}>
          <div style={{ fontSize: 12, fontWeight: 700, paddingTop: 4 }}>Pieza {pieza}</div>
          <Fila label="Estado general" valor={mapVal(ESTADO_PIEZA, item.estado_general)} />
          {item.caras && typeof item.caras === 'object' && Object.entries<any>(item.caras).map(([cara, v]) => (
            <Fila key={cara} label={CARA_LABELS[cara] ?? cara} valor={mapVal(ESTADO_CARA, v)} />
          ))}
          {txt(item.raiz) !== '' && <Fila label="Raíz / pulpa" valor={mapVal(ESTADO_RAIZ, item.raiz)} />}
          {txt(item.notas) !== '' && <Fila label="Notas" valor={item.notas} />}
        </div>
      );
    });
  };

  const fichaEvalOdonto = eo ? (
    <AppCard>
      <TituloFicha icono="health_and_safety" titulo="Evaluación odontológica" />
      {!eo.completada && <div className="hint" style={{ fontStyle: 'italic', marginBottom: 6 }}>Pendiente de completar</div>}
      <Fila label="Profesional" valor={eo.profesional} />
      {txt(eo.salud_bucal) !== '' && <Fila label="Salud bucal" valor={mapVal(SALUD_BUCAL, eo.salud_bucal)} />}
      <Fila label="Lesiones en tejidos blandos" valor={siNo(eo.lesiones_tejidos_blandos)} />
      <Fila label="Maloclusión" valor={siNo(eo.maloclusion)} />
      <Fila label="Fluorosis" valor={siNo(eo.fluorosis)} />
      <Fila label="Caries" valor={siNo(eo.caries)} />
      {txt(eo.otros) !== '' && <Fila label="Otros" valor={eo.otros} />}
      <Fila label="Topicación de flúor" valor={siNo(eo.topicacion_fluor)} />
      <Fila label="Enseñanza de cepillado" valor={siNo(eo.ensenanza_cepillado)} />
      <Fila label="Alta básica" valor={siNo(eo.alta_basica)} />
      <Fila label="CPO — Cariados (C)" valor={eo.cpo_c} />
      <Fila label="CPO — Perdidos (P)" valor={eo.cpo_p} />
      <Fila label="CPO — Obturados (O)" valor={eo.cpo_o} />
      <Fila label="ceo — Cariados (c)" valor={eo.ceo_c} />
      <Fila label="ceo — Extracción indicada (e)" valor={eo.ceo_e} />
      <Fila label="ceo — Obturados (o)" valor={eo.ceo_o} />
      {odontoPiezas()}
    </AppCard>
  ) : null;

  return (
    <div>
      <PageHeader title="Datos del alumno" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
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
      {ro ? (
        <>
          {ro && <div className="info-box ok">Solo lectura</div>}
          {fichaDatos}
          {fichaCobertura}
          {fichaAntecedentes}
          {fichaFamilia}
          {fichaEvalMedica}
          {fichaEvalOdonto}
        </>
      ) : (
        <>
          <AppCard>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Paso {Math.min(paso, 4) + 1} de 5 · {TITULOS_PASOS[Math.min(paso, 4)]}
            </div>
            <div style={{ height: 8, background: 'rgba(0,0,0,.08)', borderRadius: 4, margin: '8px 0' }}>
              <div style={{ width: `${((Math.min(paso, 4) + 1) / 5) * 100}%`, height: '100%', background: 'var(--primario)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TITULOS_PASOS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  title={t}
                  onClick={() => irAPaso(i)}
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
            <h3>Datos del niño</h3>
            <Field label="Nombre *"><TextInput value={f.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} /></Field>
            <Field label="Apellido *"><TextInput value={f.apellido ?? ''} onChange={(e) => set('apellido', e.target.value)} /></Field>
            <Field label="DNI *"><TextInput value={f.dni ?? ''} onChange={(e) => set('dni', e.target.value)} /></Field>
            <Field label="Fecha de nacimiento *"><TextInput type="date" value={(f.fecha_nacimiento ?? '').slice(0, 10)} onChange={(e) => set('fecha_nacimiento', e.target.value)} /></Field>
            <Field label="Sexo">
              <SelectInput value={f.sexo ?? ''} onChange={(e) => set('sexo', e.target.value)}>
                <option value="">…</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </SelectInput>
            </Field>
            <Field label="Edad"><TextInput type="number" value={f.edad ?? ''} onChange={(e) => set('edad', e.target.value)} /></Field>
          </AppCard>
          )}

          {paso === 1 && (
          <AppCard>
            <h3>Domicilio y cobertura</h3>
            <Field label="Celular de contacto"><TextInput value={f.celular ?? ''} onChange={(e) => set('celular', e.target.value)} /></Field>
            <Field label="Cobertura">
              <SelectInput value={f.tipo_cobertura ?? ''} onChange={(e) => set('tipo_cobertura', e.target.value)}>
                <option value="">…</option>
                <option value="obra_social">Obra Social</option>
                <option value="estatal">Estatal</option>
                <option value="prepaga">Prepaga</option>
                <option value="sin_cobertura">Sin cobertura</option>
              </SelectInput>
            </Field>
            <Field label="Nombre cobertura"><TextInput value={f.nombre_cobertura ?? ''} onChange={(e) => set('nombre_cobertura', e.target.value)} /></Field>
            <Field label="Localidad"><TextInput value={f.localidad ?? ''} onChange={(e) => set('localidad', e.target.value)} /></Field>
          </AppCard>
          )}

          {paso === 2 && (
          <AppCard>
            <h3>Antecedentes personales</h3>
            <Field label="Nació prematuro">
              <SelectInput value={f.nacio_prematuro ?? 'NO'} onChange={(e) => set('nacio_prematuro', e.target.value)}>
                <option value="SI">Sí</option><option value="NO">No</option><option value="NO_SABE">No sabe</option>
              </SelectInput>
            </Field>
            <Field label="Peso al nacer"><TextInput value={f.peso_nacimiento ?? ''} onChange={(e) => set('peso_nacimiento', e.target.value)} /></Field>
            <Field label="Asma / espasmos">
              <SelectInput value={f.asma_espasmos ?? 'NO'} onChange={(e) => set('asma_espasmos', e.target.value)}>
                <option value="SI">Sí</option><option value="NO">No</option><option value="NO_SABE">No sabe</option>
              </SelectInput>
            </Field>
            <Field label="Última consulta médica">
              <SelectInput value={f.ultima_consulta_medica ?? 'NINGUNA'} onChange={(e) => set('ultima_consulta_medica', e.target.value)}>
                <option value="menos_1_anio">Hace menos de 1 año</option>
                <option value="mas_1_anio">Hace más de 1 año</option>
                <option value="no_recuerda">No recuerda</option>
                <option value="NINGUNA">Ninguna</option>
              </SelectInput>
            </Field>
            <Field label="Otros problemas de salud"><TextInput value={f.otros_problemas_salud ?? ''} onChange={(e) => set('otros_problemas_salud', e.target.value)} /></Field>
          </AppCard>
          )}

          {paso === 3 && (
          <AppCard>
            <h3>Sección escuela (E)</h3>
            <Field label="¿Preocupa su salud?">
              <SelectInput value={ePreocupa ? 'true' : 'false'} onChange={(e) => setPreocupa(e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </SelectInput>
            </Field>
            {ePreocupa && (
              <Field label="Detalle de la preocupación">
                <TextInput value={eDetalle} onChange={(e) => setEDetalle(e.target.value)} />
              </Field>
            )}
            <Field label="¿Dificultad de lenguaje?">
              <SelectInput value={eLenguaje ? 'true' : 'false'} onChange={(e) => setELenguaje(e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </SelectInput>
            </Field>
            <Field label="¿Bajo tratamiento?">
              <SelectInput value={eTratamiento ? 'true' : 'false'} onChange={(e) => setETratamiento(e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </SelectInput>
            </Field>
          </AppCard>
          )}

          {paso === 4 && (
          <AppCard>
            <h3>Revisión</h3>
            {['Datos del niño', 'Domicilio y cobertura', 'Antecedentes', 'Sección escuela'].map((t, i) => (
              <div
                key={t}
                onClick={() => irAPaso(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}
              >
                <span style={{ color: 'green' }}>✓</span>
                <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
                <span style={{ color: '#999' }}>›</span>
              </div>
            ))}
          </AppCard>
          )}

          {paso === 4 && fichaEvalMedica}
          {paso === 4 && fichaEvalOdonto}

          <div style={{ height: 12 }} />
          <AppCard>
          <div className="wizard-nav">
            {paso > 0 && (
              <AppButton label="Atrás" secondary onClick={() => irAPaso(paso - 1)} />
            )}
            {paso < 4 ? (
              <AppButton label="Siguiente" loading={saving} onClick={intentarAvanzar} />
            ) : (
              <AppButton label="Guardar" loading={saving} onClick={guardar} />
            )}
          </div>
          </AppCard>
        </>
      )}
    </div>
  );
}
