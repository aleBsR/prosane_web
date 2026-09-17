import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePendientes } from '../pendientes/usePendientes';
import { MIcon } from './ui';

export default function Layout() {
  const { usuario, logout, can } = useAuth();
  const { items: pendientes } = usePendientes(can);
  const nav = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const inicial = (usuario?.nombre.trim().charAt(0) || '?').toUpperCase();

  async function salir() {
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
            <NavLink to="/usuario">
              <MIcon name="person" /> Perfil
            </NavLink>
          </nav>
          <div className="user" ref={menuRef}>
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
                <button className="user-menu-item" onClick={salir}>
                  <MIcon name="logout" size={18} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
