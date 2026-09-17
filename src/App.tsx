import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForceChangePassword from './pages/ForceChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Acciones from './pages/Acciones';
import Operativos from './pages/Operativos';
import OperativoDetail from './pages/OperativoDetail';
import AlumnoDetail from './pages/AlumnoDetail';
import EvaluacionMedica from './pages/EvaluacionMedica';
import EvaluacionOdontologica from './pages/EvaluacionOdontologica';
import SeccionEscuela from './pages/SeccionEscuela';
import EscuelaDatos from './pages/EscuelaDatos';
import Constancia from './pages/Constancia';
import Escuelas from './pages/Escuelas';
import EscuelaDetail from './pages/EscuelaDetail';
import Cursos from './pages/Cursos';
import MiEscuela from './pages/MiEscuela';
import AlumnosEscuela from './pages/AlumnosEscuela';
import Profesionales from './pages/Profesionales';
import { UsuariosAyudantes, UsuariosEscuela } from './pages/Usuarios';
import Perfil from './pages/Perfil';
import Configuracion from './pages/Configuracion';
import ConfigDatos from './pages/ConfigDatos';
import ConfigPassword from './pages/ConfigPassword';
import Pendientes from './pages/Pendientes';
import { EscuelaCreate, GestionUsuarios, OperativoCreate, TutorFueraDeAlcance } from './pages/Altas';

// Espejo de app_router.dart:
// - sin sesión → /login (salvo rutas públicas de auth)
// - con must_change_password → solo /change-password (+ logout/me implícitos)
// - /change-password sin must_change → /inicio
function RequireAuth() {
  const { loading, usuario } = useAuth();
  if (loading) return <div className="login-wrap"><p style={{ color: '#fff' }}>Cargando…</p></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

function RequireChangePassword() {
  const { loading, usuario } = useAuth();
  if (loading) return <div className="login-wrap"><p style={{ color: '#fff' }}>Cargando…</p></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!usuario.mustChangePassword) return <Navigate to="/inicio" replace />;
  return <Outlet />;
}

function PublicOnly() {
  const { loading, usuario } = useAuth();
  if (loading) return <div className="login-wrap"><p style={{ color: '#fff' }}>Cargando…</p></div>;
  if (usuario) return <Navigate to={usuario.mustChangePassword ? '/change-password' : '/inicio'} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            <Route element={<RequireChangePassword />}>
              <Route path="/change-password" element={<ForceChangePassword />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/inicio" element={<Acciones />} />
                <Route path="/pendientes" element={<Pendientes />} />
                <Route path="/usuario" element={<Perfil />} />
                <Route path="/usuario/configuracion" element={<Configuracion />} />
                <Route path="/usuario/configuracion/datos" element={<ConfigDatos />} />
                <Route path="/usuario/configuracion/password" element={<ConfigPassword />} />
                <Route path="/operativos" element={<Operativos />} />
                <Route path="/operativos/nuevo" element={<OperativoCreate />} />
                <Route path="/operativos/:id" element={<OperativoDetail />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId" element={<AlumnoDetail />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId/medica" element={<EvaluacionMedica />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId/odontologica" element={<EvaluacionOdontologica />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId/escuela" element={<SeccionEscuela />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId/datos" element={<EscuelaDatos />} />
                <Route path="/operativos/:opId/alumnos/:alumnoId/constancia" element={<Constancia />} />
                <Route path="/escuelas" element={<Escuelas />} />
                <Route path="/escuelas/nuevo" element={<EscuelaCreate />} />
                <Route path="/escuelas/mi-escuela" element={<MiEscuela />} />
                <Route path="/escuelas/alumnos" element={<AlumnosEscuela />} />
                <Route path="/escuelas/:escuelaId" element={<EscuelaDetail />} />
                <Route path="/escuelas/:escuelaId/cursos" element={<Cursos />} />
                <Route path="/escuelas/:escuelaId/alumnos" element={<AlumnosEscuela />} />
                <Route path="/profesionales" element={<Profesionales />} />
                <Route path="/usuarios-escuela" element={<UsuariosEscuela />} />
                <Route path="/usuarios-ayudantes" element={<UsuariosAyudantes />} />
                <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
                <Route path="/hijos" element={<TutorFueraDeAlcance titulo="Mis hijos" />} />
                <Route path="/hijos/nuevo" element={<TutorFueraDeAlcance titulo="Registrar hijo" />} />
                <Route path="/consentimiento" element={<TutorFueraDeAlcance titulo="Consentimiento" />} />
                <Route path="/antecedentes-familiares" element={<TutorFueraDeAlcance titulo="Antecedentes familiares" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
