import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Tema claro/oscuro a nivel app (incluye /login y rutas públicas).
// Se guarda en localStorage['prosane-tema'] ('oscuro' | 'claro');
// sin preferencia se usa el brillo del sistema. Espejo de theme_controller.dart.
const CLAVE = 'prosane-tema';

interface TemaCtx {
  oscuro: boolean;
  alternar: () => void;
}

const Ctx = createContext<TemaCtx>({ oscuro: false, alternar: () => {} });

export const useTema = () => useContext(Ctx);

function leerInicial(): boolean {
  const guardado = localStorage.getItem(CLAVE);
  if (guardado === 'oscuro') return true;
  if (guardado === 'claro') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [oscuro, setOscuro] = useState(leerInicial);
  const alternar = useCallback(() => setOscuro((v) => !v), []);

  useEffect(() => {
    if (oscuro) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    localStorage.setItem(CLAVE, oscuro ? 'oscuro' : 'claro');
  }, [oscuro]);

  return <Ctx.Provider value={{ oscuro, alternar }}>{children}</Ctx.Provider>;
}
