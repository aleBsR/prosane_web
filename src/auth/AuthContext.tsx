import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, setOnLogout, tokenStore } from '../api/client';

export interface Accion {
  name: string;
  label: string;
  icon: string;
  color: string;
  category?: string;
  showInMenu?: boolean;
}

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rolName: string;
  rolLabel: string;
  mustChangePassword: boolean;
}

interface AuthState {
  loading: boolean;
  usuario: UsuarioSesion | null;
  permisos: Set<string>;
  acciones: Accion[];
  login: (email: string, password: string, recordarme?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refrescarSesion: () => Promise<void>;
  can: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function parseMe(data: any): { usuario: UsuarioSesion; acciones: Accion[] } {
  const user = data?.user ?? {};
  const roles = Array.isArray(data?.roles) ? data.roles : [];
  const actions = Array.isArray(data?.actions) ? data.actions : [];
    let nombre = [user.nombre, user.apellido]
      .filter((s) => typeof s === 'string' && s.trim() !== '')
      .join(' ');
    if (!nombre) {
      // Sin Persona vinculada no hay nombre real: mostrar la parte legible
      // del email ("superadmin@..." → "Superadmin") en vez del correo crudo.
      const base = String(user.email ?? '')
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .trim();
      nombre = base ? base.charAt(0).toUpperCase() + base.slice(1) : String(user.email ?? '');
    }
  return {
    usuario: {
      id: String(user.id ?? ''),
      email: String(user.email ?? ''),
      nombre: nombre || String(user.email ?? ''),
      rolName: String(roles[0]?.name ?? ''),
      rolLabel: String(roles[0]?.label ?? ''),
      mustChangePassword: Boolean(user.must_change_password ?? false),
    },
    acciones: actions.map((a: any) => ({
      name: String(a.name ?? a.nombre ?? ''),
      label: String(a.label ?? a.name ?? ''),
      icon: String(a.icon ?? 'bolt'),
      color: String(a.color ?? '#7C5CFC'),
      category: a.category ?? a.categoria,
      showInMenu: a.show_in_menu ?? a.showInMenu ?? true,
    })),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [acciones, setAcciones] = useState<Accion[]>([]);

  const refrescarSesion = useCallback(async () => {
    const { data } = await authApi.get('/me/');
    const parsed = parseMe(data);
    setUsuario(parsed.usuario);
    setAcciones(parsed.acciones);
  }, []);

  const logoutLocal = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
    setAcciones([]);
  }, []);

  useEffect(() => {
    setOnLogout(logoutLocal);
    // Hidratar sesión (como app.dart): si hay tokens, intentar /me/.
    (async () => {
      if (tokenStore.access) {
        try {
          await refrescarSesion();
        } catch {
          tokenStore.clear();
        }
      }
      setLoading(false);
    })();
    return () => setOnLogout(null);
  }, [logoutLocal, refrescarSesion]);

  const login = useCallback(
    async (email: string, password: string, recordarme = false) => {
      const { data } = await authApi.post('/token/', { email, password });
      tokenStore.save(data.access, data.refresh, recordarme);
      try {
        await refrescarSesion();
      } catch {
        // Login atómico como en la app: si /me/ falla, no dejar tokens huérfanos.
        tokenStore.clear();
        throw new Error('No se pudo cargar la sesión. Probá de nuevo.');
      }
    },
    [refrescarSesion],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    if (refresh) {
      try {
        await authApi.post('/logout/', { refresh });
      } catch {
        // best-effort: el logout local procede igual (offline-first).
      }
    }
    logoutLocal();
  }, [logoutLocal]);

  const permisos = useMemo(() => new Set(acciones.map((a) => a.name)), [acciones]);
  const can = useCallback((p: string) => permisos.has(p), [permisos]);

  const value = useMemo(
    () => ({ loading, usuario, permisos, acciones, login, logout, refrescarSesion, can }),
    [loading, usuario, permisos, acciones, login, logout, refrescarSesion, can],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
