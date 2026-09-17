import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, Field, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

const HALLAZGO_LABELS: Record<string, string> = {
  piel: 'Piel',
  partes_blandas: 'Partes blandas',
  cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio',
  abdominal: 'Abdominal',
  genitourinario: 'Genitourinario',
  osteoarticular: 'Osteoarticular',
  neurologico: 'Neurológico',
  salud_visual: 'Salud visual',
  fonoaudiologica: 'Fonoaudiológica',
  icv: 'ICV',
};
const HALLAZGO_SISTEMAS = Object.keys(HALLAZGO_LABELS);

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

// Formulario completo espejo de evaluacion_medica_screen.dart:
// examen clínico, antropometría (IMC automático), presión, agudeza/audiometría,
// hallazgos (11 sistemas), vacunación y derivaciones (8 especialidades).
export default function EvaluacionMedica() {
  const { opId, alumnoId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estadoOp, setEstadoOp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<any>({});
  const [hallazgos, setHallazgos] = useState<Record<string, { estado: string; detalle: string }>>({});
  const [derivs, setDerivs] = useState<Record<string, { deriva: boolean; motivo: string }>>({});

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const str = (v: any) => (v === null || v === undefined ? '' : String(v));
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
        setF({
          examen_realizado: d.examen_realizado ?? true,
          motivo_no_examen: d.motivo_no_examen ?? '',
          lugar_examen: d.lugar_examen ?? '',
          peso: str(d.peso),
          talla: str(d.talla),
          percentil_talla: d.percentil_talla ?? '',
          percentil_imc: d.percentil_imc ?? '',
          pas: str(d.pas),
          pad: str(d.pad),
          presion_clasificacion: d.presion_clasificacion ?? '',
          agudeza_evaluada: d.agudeza_evaluada ?? false,
          ojo_derecho: d.ojo_derecho ?? '',
          ojo_izquierdo: d.ojo_izquierdo ?? '',
          usa_lentes: d.usa_lentes ?? false,
          audiometria_realizada: d.audiometria_realizada ?? false,
          audiometria_resultado: d.audiometria_resultado ?? '',
          trajo_carnet: d.trajo_carnet ?? false,
          carnet_completo: d.carnet_completo ?? false,
          vacunas_aplicadas: d.vacunas_aplicadas ?? '',
          vacunas_indicadas: d.vacunas_indicadas ?? '',
        });
        const hRaw = d.hallazgos ?? {};
        const h: Record<string, { estado: string; detalle: string }> = {};
        for (const s of HALLAZGO_SISTEMAS) {
          h[s] = {
            estado: String(hRaw[s]?.estado ?? 'no_eval'),
            detalle: String(hRaw[s]?.detalle ?? ''),
          };
        }
        setHallazgos(h);
        const dRaw = d.derivaciones ?? {};
        const dv: Record<string, { deriva: boolean; motivo: string }> = {};
        for (const e of DERIV_ESPS) {
          dv[e] = { deriva: Boolean(dRaw[e]?.deriva), motivo: String(dRaw[e]?.motivo ?? '') };
        }
        setDerivs(dv);
      } catch (e) {
        setError(apiErrorMessage(e, 'No se pudo cargar la evaluación'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opId, alumnoId]);

  const noEditable = estadoOp === 'finalizado' || estadoOp === 'cancelado';
  const enCurso = estadoOp === 'en_curso';

  const numOrNull = (v: any) => (String(v ?? '').trim() === '' ? null : Number(String(v).replace(',', '.')));
  const intOrNull = (v: any) => (String(v ?? '').trim() === '' ? null : parseInt(String(v), 10));

  async function guardar() {
    setSaving(true);
    setError(null);
    try {
      await v1Api.put(`/operativos/${opId}/alumnos/${alumnoId}/evaluacion-medica/`, {
        examen_realizado: !!f.examen_realizado,
        motivo_no_examen: f.motivo_no_examen || '',
        lugar_examen: f.lugar_examen || '',
        trajo_carnet: !!f.trajo_carnet,
        carnet_completo: !!f.carnet_completo,
        vacunas_aplicadas: f.vacunas_aplicadas || '',
        vacunas_indicadas: f.vacunas_indicadas || '',
        peso: numOrNull(f.peso),
        talla: numOrNull(f.talla),
        imc: imc === '' ? null : Number(imc),
        percentil_talla: f.percentil_talla || '',
        percentil_imc: f.percentil_imc || '',
        pas: intOrNull(f.pas),
        pad: intOrNull(f.pad),
        presion_clasificacion: f.presion_clasificacion || '',
        agudeza_evaluada: !!f.agudeza_evaluada,
        ojo_derecho: f.ojo_derecho || '',
        ojo_izquierdo: f.ojo_izquierdo || '',
        usa_lentes: !!f.usa_lentes,
        audiometria_realizada: !!f.audiometria_realizada,
        audiometria_resultado: f.audiometria_resultado || '',
        hallazgos: Object.fromEntries(Object.entries(hallazgos).map(([k, v]) => [k, { estado: v.estado, detalle: v.detalle }])),
        derivaciones: Object.fromEntries(Object.entries(derivs).map(([k, v]) => [k, { deriva: v.deriva, motivo: v.motivo }])),
      });
      toast.push('ok', 'Evaluación guardada');
      nav(`/operativos/${opId}/alumnos/${alumnoId}`);
    } catch (e) {
      const msg = apiErrorMessage(e, 'No se pudo guardar la evaluación.');
      setError(msg);
      toast.push('error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  const ro = !enCurso;

  const check = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
      <input type="checkbox" checked={value} disabled={ro} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div>
      <PageHeader title="Evaluación médica" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
      {noEditable && <div className="info-box ok">🔒 Operativo finalizado — solo lectura</div>}
      {!noEditable && !enCurso && (
        <div className="info-box">Solo se puede cargar cuando el operativo está en curso</div>
      )}
      <div style={{ opacity: enCurso ? 1 : 0.85 }}>
        <AppCard>
          <h3>Examen clínico</h3>
          {check('Examen realizado', !!f.examen_realizado, (v) => set('examen_realizado', v))}
          {!f.examen_realizado && (
            <Field label="Motivo de no examen">
              <SelectInput value={f.motivo_no_examen || ''} disabled={ro} onChange={(e) => set('motivo_no_examen', e.target.value)}>
                <option value="">…</option>
                <option value="negativa_familiar">Negativa familiar</option>
                <option value="negativa_nino">Negativa del niño</option>
                <option value="ausente">Ausente</option>
                <option value="otros">Otros</option>
              </SelectInput>
            </Field>
          )}
          <Field label="Lugar del examen">
            <SelectInput value={f.lugar_examen || ''} disabled={ro} onChange={(e) => set('lugar_examen', e.target.value)}>
              <option value="">…</option>
              <option value="escuela">Escuela</option>
              <option value="centro_salud">Centro de salud</option>
            </SelectInput>
          </Field>
        </AppCard>

        <AppCard>
          <h3>Antropometría</h3>
          <Field label="Peso (kg)">
            <TextInput type="number" value={f.peso ?? ''} disabled={ro} onChange={(e) => set('peso', e.target.value)} />
          </Field>
          <Field label="Talla (cm)">
            <TextInput type="number" value={f.talla ?? ''} disabled={ro} onChange={(e) => set('talla', e.target.value)} />
          </Field>
          <Field label="IMC" hint="Se calcula automáticamente con peso y talla">
            <TextInput value={imc} disabled readOnly />
          </Field>
          <Field label="Percentil talla">
            <SelectInput value={f.percentil_talla || ''} disabled={ro} onChange={(e) => set('percentil_talla', e.target.value)}>
              <option value="">…</option>
              <option value="menor_3">Menor a 3</option>
              <option value="mayor_igual_3">Mayor o igual a 3</option>
            </SelectInput>
          </Field>
          <Field label="Percentil IMC">
            <SelectInput value={f.percentil_imc || ''} disabled={ro} onChange={(e) => set('percentil_imc', e.target.value)}>
              <option value="">…</option>
              <option value="menor_3">Menor a 3</option>
              <option value="entre_3_9">Entre 3 y 9</option>
              <option value="entre_10_84">Entre 10 y 84</option>
              <option value="entre_85_97">Entre 85 y 97</option>
              <option value="mayor_97">Mayor a 97</option>
            </SelectInput>
          </Field>
        </AppCard>

        <AppCard>
          <h3>Presión arterial</h3>
          <Field label="PAS (sistólica)">
            <TextInput type="number" value={f.pas ?? ''} disabled={ro} onChange={(e) => set('pas', e.target.value)} />
          </Field>
          <Field label="PAD (diastólica)">
            <TextInput type="number" value={f.pad ?? ''} disabled={ro} onChange={(e) => set('pad', e.target.value)} />
          </Field>
          <Field label="Clasificación">
            <TextInput value={f.presion_clasificacion ?? ''} disabled={ro} onChange={(e) => set('presion_clasificacion', e.target.value)} />
          </Field>
        </AppCard>

        <AppCard>
          <h3>Agudeza visual / Audiometría</h3>
          {check('Agudeza evaluada', !!f.agudeza_evaluada, (v) => set('agudeza_evaluada', v))}
          <Field label="Ojo derecho">
            <TextInput value={f.ojo_derecho ?? ''} disabled={ro} onChange={(e) => set('ojo_derecho', e.target.value)} />
          </Field>
          <Field label="Ojo izquierdo">
            <TextInput value={f.ojo_izquierdo ?? ''} disabled={ro} onChange={(e) => set('ojo_izquierdo', e.target.value)} />
          </Field>
          {check('Usa lentes', !!f.usa_lentes, (v) => set('usa_lentes', v))}
          {check('Audiometría realizada', !!f.audiometria_realizada, (v) => set('audiometria_realizada', v))}
          <Field label="Resultado audiometría">
            <SelectInput value={f.audiometria_resultado || ''} disabled={ro} onChange={(e) => set('audiometria_resultado', e.target.value)}>
              <option value="">…</option>
              <option value="pasa">Pasa</option>
              <option value="no_pasa">No pasa</option>
            </SelectInput>
          </Field>
        </AppCard>

        <AppCard>
          <h3>Hallazgos clínicos</h3>
          {HALLAZGO_SISTEMAS.map((s) => (
            <div key={s} style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: 13 }}>{HALLAZGO_LABELS[s]}</strong>
              <div style={{ height: 6 }} />
              <Field label="Estado">
                <SelectInput
                  value={hallazgos[s]?.estado ?? 'no_eval'}
                  disabled={ro}
                  onChange={(e) => setHallazgos((h) => ({ ...h, [s]: { ...h[s], estado: e.target.value } }))}
                >
                  <option value="con">Con hallazgos</option>
                  <option value="sin">Sin hallazgos</option>
                  <option value="no_eval">No evaluado</option>
                </SelectInput>
              </Field>
              <Field label="Detalle">
                <TextInput
                  value={hallazgos[s]?.detalle ?? ''}
                  disabled={ro}
                  onChange={(e) => setHallazgos((h) => ({ ...h, [s]: { ...h[s], detalle: e.target.value } }))}
                />
              </Field>
            </div>
          ))}
        </AppCard>

        <AppCard>
          <h3>Vacunación</h3>
          {check('Trajo carnet', !!f.trajo_carnet, (v) => set('trajo_carnet', v))}
          {check('Carnet completo', !!f.carnet_completo, (v) => set('carnet_completo', v))}
          <Field label="Vacunas aplicadas">
            <TextInput value={f.vacunas_aplicadas ?? ''} disabled={ro} onChange={(e) => set('vacunas_aplicadas', e.target.value)} />
          </Field>
          <Field label="Vacunas indicadas">
            <TextInput value={f.vacunas_indicadas ?? ''} disabled={ro} onChange={(e) => set('vacunas_indicadas', e.target.value)} />
          </Field>
        </AppCard>

        <AppCard>
          <h3>Derivaciones</h3>
          {DERIV_ESPS.map((e) => (
            <div key={e} style={{ marginBottom: 6 }}>
              {check(`Deriva a ${DERIV_LABELS[e]}`, !!derivs[e]?.deriva, (v) =>
                setDerivs((d) => ({ ...d, [e]: { ...d[e], deriva: v } })),
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
      </div>

      {enCurso && (
        <AppCard>
          {error && <div className="form-error">{error}</div>}
          <AppButton label="Guardar" loading={saving} onClick={guardar} />
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
