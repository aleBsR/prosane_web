import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Accion } from '../auth/AuthContext';
import { v1Api } from '../api/client';
import { EmptyState, MIcon, useToast } from '../components/ui';

// Los nombres que manda el backend (authentication/actions_map.py) ya son
// Material Symbols: se usan directo, igual que accionIcon() en la app.
// Las tres gestiones de usuarios vienen con icono genérico del backend:
// se pisan con los que tenía el submenú (school/support_agent/medical_services).
function iconFor(actionName: string, backendIcon: string): string {
  switch (actionName) {
    case 'gestionarUsuariosEscuela':
      return 'school';
    case 'gestionarAdministrativos':
      return 'support_agent';
    case 'verAuditoria':
      return 'history';    case 'gestionarProfesionales':
      return 'medical_services';
    default:
      break;
  }
  const conocidos = new Set([
    'people',
    'clinical_notes',
    'assignment_add',
    'draw',
    'dentistry',
    'straighten',
    'description',
    'how_to_reg',
    'school',
    'menu_book',
    'groups',
    'person_add',
    'manage_accounts',
  ]);
  return conocidos.has(backendIcon) ? backendIcon : 'bolt';
}

// Etiquetas lindas para categorías internas del backend.
const CATEGORY_LABELS: Record<string, string> = {
  auditoria: 'Seguridad y auditoría',
};

// Misma navegación que acciones_screen.dart según el nombre de la acción.
export function routeForAction(name: string): string | null {
  switch (name) {
    case 'registrarHijo':
      return '/hijos/nuevo';
    case 'verHijos':
      return '/hijos';
    case 'darConsentimiento':
      return '/consentimiento';
    case 'cargarAntecedentesFamiliares':
      return '/antecedentes-familiares';
    case 'crearEscuela':
      return '/escuelas/nuevo';
    case 'crearOperativo':
      return '/operativos/nuevo';
    case 'verOperativo':
      return '/operativos';
    case 'verEscuelas':
      return '/escuelas';
    case 'verMiEscuela':
      return '/escuelas/mi-escuela';
    case 'verAlumnosEscuela':
      return '/escuelas/alumnos';
    case 'registrarAlumnoEscuela':
      return '/escuelas/alumnos?registrar=1';
    case 'gestionarUsuariosEscuela':
      return '/usuarios-escuela';
    case 'gestionarProfesionales':
      return '/profesionales';
    case 'gestionarAdministrativos':
      return '/usuarios-administrativos';
    case 'verAuditoria':
      return '/auditoria';
    default:
      return null;
  }
}

export default function Acciones() {
  const { acciones, usuario } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  // Sin submenú: inicio lleva directo a cada gestión (escuela, administrativos,
  // profesionales). Se oculta verGestionUsuarios aunque el backend la envíe.
  const menu = acciones.filter((a) => a.showInMenu !== false && a.name !== 'verGestionUsuarios');

  if (menu.length === 0) {
    return (
      <EmptyState
        titulo="No tenés acciones disponibles todavía"
        subtitulo="Cuando te asignen un rol, vas a ver acá lo que podés hacer."
      />
    );
  }

  const grupos = new Map<string, Accion[]>();
  for (const a of menu) {
    const cat = a.category || 'General';
    if (!grupos.has(cat)) grupos.set(cat, []);
    grupos.get(cat)!.push(a);
  }

  async function go(a: Accion) {
    if (a.name === 'registrarHijo' && usuario && !(usuario as any).consentimientoAceptado) {
      toast.push('info', 'Primero aceptá el consentimiento para registrar a tu hijo/a.');
      nav('/consentimiento');
      return;
    }
    // Espejo móvil: gestionarCursos va directo a los cursos de mi escuela.
    if (a.name === 'gestionarCursos') {
      try {
        const { data } = await v1Api.get('/escuelas/mi-escuela/');
        if (data?.id) {
          nav(`/escuelas/${data.id}/cursos?nombre=${encodeURIComponent(data.nombre ?? '')}`);
          return;
        }
      } catch {
        /* cae al fallback */
      }
      nav('/escuelas/mi-escuela');
      return;
    }
    const r = routeForAction(a.name);
    if (r) nav(r);
    else toast.push('info', `${a.label} — próximamente`);
  }

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: 24, margin: '6px 4px 4px' }}>Acciones</h1>
      {[...grupos.entries()].map(([cat, items]) => (
        <div key={cat}>
          <div className="group-title">{(CATEGORY_LABELS[cat] ?? cat).toUpperCase()}</div>
          <div className="card">
            {items.map((a) => (
                <button key={a.name} className="tile" onClick={() => go(a)}>
                  <span className="dot" style={{ background: a.color }}>
                    <MIcon name={iconFor(a.name, a.icon)} />
                  </span>
                  {a.label}
                </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
