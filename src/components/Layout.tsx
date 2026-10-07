import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePendientes } from '../pendientes/usePendientes';
import { MIcon } from './ui';

// Límite de errores: si una pantalla rompe en render, muestra el error en
// vez de dejar la página en blanco. Se reinicia al cambiar de ruta.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Algo falló en esta pantalla</h2>
          <p style={{ fontSize: 13 }}>
            Copiá el detalle de abajo y pasámelo para corregirlo.
          </p>
          <details style={{ fontSize: 12, marginBottom: 12 }}>
            <summary>Detalle técnico</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {String(this.state.error?.message ?? this.state.error)}
              {'\n'}
              {String((this.state.error as any)?.stack ?? '')}
            </pre>
          </details>
          <a className="btn" href="/inicio">Volver al inicio</a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Layout() {
  const { usuario, logout, can } = useAuth();
  const { items: pendientes } = usePendientes(can);
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [legalAbierto, setLegalAbierto] = useState(false);
  const [confirmSalir, setConfirmSalir] = useState(false);
  // Tema claro/oscuro: se guarda en localStorage; por defecto el del sistema.
  const [temaOscuro, setTemaOscuro] = useState(() => {
    const guardado = localStorage.getItem('prosane-tema');
    if (guardado === 'oscuro') return true;
    if (guardado === 'claro') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const inicial = (usuario?.nombre.trim().charAt(0) || '?').toUpperCase();

  async function salir() {
    setConfirmSalir(false);
    setMenuAbierto(false);
    await logout();
    nav('/login', { replace: true });
  }

  function irPerfil() {
    setMenuAbierto(false);
    nav('/usuario');
  }

  // Cerrar el menú al tocar fuera o con Escape (como Facebook).
  useEffect(() => {
    if (!menuAbierto) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuAbierto]);

  // Cerrar el modal legal con Escape.
  useEffect(() => {
    if (!legalAbierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLegalAbierto(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [legalAbierto]);

  // Aplica el tema al <html> y lo persiste.
  useEffect(() => {
    if (temaOscuro) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    localStorage.setItem('prosane-tema', temaOscuro ? 'oscuro' : 'claro');
  }, [temaOscuro]);

  return (
    <div className="gradient-page">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="logo" onClick={() => nav('/inicio')} title="Ir al inicio" style={{ cursor: 'pointer' }}>
            PROSANE
          </span>
          <nav className="nav">
            <NavLink to="/inicio">
              <MIcon name="home" /> Inicio
            </NavLink>
            <NavLink to="/pendientes">
              <MIcon name="notifications" /> Pendientes
              {pendientes.length > 0 && <span className="nav-badge">{pendientes.length}</span>}
            </NavLink>
          </nav>
          <div className="user" ref={menuRef}>
            <button
              className="theme-btn"
              title={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              onClick={() => setTemaOscuro((v) => !v)}
            >
              <MIcon name={temaOscuro ? 'light_mode' : 'dark_mode'} size={20} />
            </button>
            <button
              className="avatar"
              title={usuario?.nombre}
              aria-label="Abrir menú de usuario"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((v) => !v)}
            >
              {inicial}
            </button>
            {menuAbierto && (
              <div className="user-menu">
                <div className="user-menu-head">
                  <span className="avatar avatar-sm">{inicial}</span>
                  <div>
                    <strong>{usuario?.nombre}</strong>
                  </div>
                </div>
                <button className="user-menu-item" onClick={irPerfil}>
                  <MIcon name="person" size={18} /> Mi perfil
                </button>
                <button className="user-menu-item" onClick={() => { setMenuAbierto(false); setConfirmSalir(true); }}>
                  <MIcon name="logout" size={18} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="container">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
      <footer className="footer-legal">
        <strong>PROSANE Salta · Programa Nacional de Salud Escolar</strong>
        <button type="button" className="footer-link" onClick={() => setLegalAbierto(true)}>
          Protección de datos personales
        </button>
      </footer>
      {legalAbierto && (
        <div className="modal-backdrop" onClick={() => setLegalAbierto(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card">
              <h2 style={{ fontSize: 20, marginBottom: 16 }}>Protección de datos personales</h2>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                La información aquí contenida constituye dato personal sensible de salud,
                amparado por la Ley N° 25.326 de Protección de los Datos Personales y por la
                Ley N° 26.529 de Derechos del Paciente, Historia Clínica y Consentimiento
                Informado (y sus modificatorias). Su tratamiento, comunicación y conservación
                deben ajustarse a dichas normas; el acceso y la impresión de documentos quedan
                registrados y auditados.
              </p>
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setLegalAbierto(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmSalir && (
        <div className="modal-backdrop" onClick={() => setConfirmSalir(false)}>
          <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>Cerrar sesión</h2>
              <p style={{ fontSize: 14 }}>¿Estás seguro que querés cerrar sesión?</p>
              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmSalir(false)}>
                  No
                </button>
                <button type="button" className="btn" onClick={salir}>
                  Sí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
