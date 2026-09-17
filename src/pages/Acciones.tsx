import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Accion } from '../auth/AuthContext';
import { EmptyState, MIcon, useToast } from '../components/ui';

// Los nombres que manda el backend (authentication/actions_map.py) ya son
// Material Symbols: se usan directo, igual que accionIcon() en la app.
function iconFor(name: string): string {
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
  return conocidos.has(name) ? name : 'bolt';
}

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
    case 'gestionarCursos':
      return '/escuelas/mi-escuela';
    case 'verAlumnosEscuela':
      return '/escuelas/alumnos';
    case 'registrarAlumnoEscuela':
      return '/escuelas/alumnos?registrar=1';
    case 'verGestionUsuarios':
      return '/gestion-usuarios';
    case 'gestionarUsuariosEscuela':
      return '/usuarios-escuela';
    case 'gestionarProfesionales':
      return '/profesionales';
    case 'gestionarAyudantes':
      return '/usuarios-ayudantes';
    default:
      return null;
  }
}

export default function Acciones() {
  const { acciones, usuario } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const menu = acciones.filter((a) => a.showInMenu !== false);

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

  function go(a: Accion) {
    if (a.name === 'registrarHijo' && usuario && !(usuario as any).consentimientoAceptado) {
      toast.push('info', 'Primero aceptá el consentimiento para registrar a tu hijo/a.');
      nav('/consentimiento');
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
          <div className="group-title">{cat.toUpperCase()}</div>
          <div className="card">
            {items.map((a) => (
              <button key={a.name} className="tile" onClick={() => go(a)}>
                <span className="dot" style={{ background: a.color }}>
                  <MIcon name={iconFor(a.icon)} />
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
