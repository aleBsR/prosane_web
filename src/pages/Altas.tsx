import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, EmptyState, Field, MIcon, PageHeader, SelectInput, TextInput, useToast } from '../components/ui';

// Alta directa de escuela (ruta /escuelas/nuevo, espejo de crearEscuela).
export function EscuelaCreate() {
  const nav = useNavigate();
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [cue, setCue] = useState('');
  const [saving, setSaving] = useState(false);

  async function crear() {
    if (!nombre.trim()) return toast.push('error', 'El nombre es obligatorio');
    setSaving(true);
    try {
      const { data } = await v1Api.post('/escuelas/', { nombre: nombre.trim(), ...(cue ? { cue } : {}) });
      toast.push('ok', 'Escuela creada');
      nav(`/escuelas/${data.id}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo crear'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Crear escuela" backTo="/escuelas" />
      <AppCard>
        <Field label="Nombre *"><TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
        <Field label="CUE (si se conoce)"><TextInput value={cue} onChange={(e) => setCue(e.target.value)} /></Field>
        <AppButton label="Crear escuela" loading={saving} onClick={crear} />
      </AppCard>
    </div>
  );
}

// Alta directa de operativo (ruta /operativos/nuevo, espejo de crearOperativo).
export function OperativoCreate() {
  const nav = useNavigate();
  const toast = useToast();
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [escuela, setEscuela] = useState('');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    v1Api.get('/escuelas/').then((r) => setEscuelas(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => setEscuelas([]));
  }, []);

  async function crear() {
    if (!escuela || !fecha) return toast.push('error', 'Elegí escuela y fecha');
    setSaving(true);
    try {
      const { data } = await v1Api.post('/operativos/', { escuela, fecha, lugar_realizacion: 'escuela' });
      toast.push('ok', 'Operativo creado en Borrador');
      nav(`/operativos/${data.id}`);
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo crear'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Crear operativo" backTo="/operativos" />
      <AppCard>
        <Field label="Escuela *">
          <SelectInput value={escuela} onChange={(e) => setEscuela(e.target.value)}>
            <option value="">…</option>
            {escuelas.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </SelectInput>
        </Field>
        <Field label="Fecha *"><TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <AppButton label="Crear operativo" loading={saving} onClick={crear} />
      </AppCard>
    </div>
  );
}

// Rutas fuera del alcance de esta etapa (el perfil tutor está omitido,
// igual que en la guía de pruebas de la app móvil).
export function TutorFueraDeAlcance({ titulo }: { titulo: string }) {
  return (
    <EmptyState
      titulo={titulo}
      subtitulo="El perfil tutor está omitido en esta etapa: la escuela carga los datos de los alumnos."
    />
  );
}

// Gestión de usuarios, espejo de gestion_usuarios_screen.dart: tarjetas de
// opción con ícono, título, subtítulo y ›, cada una visible según permiso.
export function GestionUsuarios() {
  const { can } = useAuth();
  const nav = useNavigate();

  const opciones = [
    can('gestionarUsuariosEscuela') && {
      icon: 'school',
      titulo: 'Usuarios de escuelas',
      subtitulo: 'Asignar escuelas y gestionar cuentas de escuela',
      to: '/usuarios-escuela',
    },
    can('gestionarAyudantes') && {
      icon: 'support_agent',
      titulo: 'Ayudantes',
      subtitulo: 'Crear y gestionar usuarios ayudantes',
      to: '/usuarios-ayudantes',
    },
    can('gestionarProfesionales') && {
      icon: 'medical_services',
      titulo: 'Profesionales',
      subtitulo: 'Médicos y odontólogos del sistema',
      to: '/profesionales',
    },
  ].filter(Boolean) as { icon: string; titulo: string; subtitulo: string; to: string }[];

  return (
    <div>
      <PageHeader title="Gestión de usuarios" backTo="/inicio" />
      {opciones.length === 0 ? (
        <EmptyState titulo="Sin permisos de gestión" subtitulo="No tenés acciones de usuarios asignadas." />
      ) : (
        opciones.map((o) => (
          <div key={o.to} style={{ marginBottom: 12 }}>
            <AppCard>
              <div className="school-card-click" onClick={() => nav(o.to)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 4 }}>
                <span style={{ background: 'rgba(124,92,252,.1)', borderRadius: 12, padding: 10, lineHeight: 1, color: 'var(--primario)' }}>
                  <MIcon name={o.icon} size={28} />
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{o.titulo}</div>
                  <div style={{ fontSize: 12, color: 'rgba(45,45,58,.6)', marginTop: 4 }}>{o.subtitulo}</div>
                </span>
                <span style={{ fontSize: 20 }}>›</span>
              </div>
            </AppCard>
          </div>
        ))
      )}
    </div>
  );
}
