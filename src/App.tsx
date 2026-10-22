import { Navigate, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { TemaProvider } from './theme/TemaContext';
import { ToastProvider } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForceChangePassword from './pages/ForceChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Acciones from './pages/Acciones';
import Operativos from './pages/Operativos';
import OperativoDetail from './pages/OperativoDetail';
import AlumnoDetail from './pages/AlumnoDetail';
import Derivaciones from './pages/Derivaciones';
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
import AlumnoEscuelaDetail from './pages/AlumnoEscuelaDetail';
import Profesionales from './pages/Profesionales';
import { UsuariosAdministrativos, UsuariosEscuela } from './pages/Usuarios';
import Auditoria from './pages/Auditoria';
import Perfil from './pages/Perfil';
import Configuracion from './pages/Configuracion';
import ConfigDatos from './pages/ConfigDatos';
import ConfigPassword from './pages/ConfigPassword';
import Pendientes from './pages/Pendientes';
import { EscuelaCreate, OperativoCreate, TutorFueraDeAlcance } from './pages/Altas';

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

// Data router (necesario para useBlocker del dirty guard en los wizards).
const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  {
    element: <RequireChangePassword />,
    children: [
      { path: '/change-password', element: <ForceChangePassword /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/inicio', element: <Acciones /> },
          { path: '/pendientes', element: <Pendientes /> },
          { path: '/usuario', element: <Perfil /> },
          { path: '/usuario/configuracion', element: <Configuracion /> },
          { path: '/usuario/configuracion/datos', element: <ConfigDatos /> },
          { path: '/usuario/configuracion/password', element: <ConfigPassword /> },
          { path: '/operativos', element: <Operativos /> },
          { path: '/operativos/nuevo', element: <OperativoCreate /> },
          { path: '/operativos/:id', element: <OperativoDetail /> },
          { path: '/operativos/:id/derivaciones', element: <Derivaciones /> },
          { path: '/operativos/:opId/alumnos/:alumnoId', element: <AlumnoDetail /> },
          { path: '/operativos/:opId/alumnos/:alumnoId/medica', element: <EvaluacionMedica /> },
          { path: '/operativos/:opId/alumnos/:alumnoId/odontologica', element: <EvaluacionOdontologica /> },
          { path: '/operativos/:opId/alumnos/:alumnoId/escuela', element: <SeccionEscuela /> },
          { path: '/operativos/:opId/alumnos/:alumnoId/datos', element: <EscuelaDatos /> },
          { path: '/operativos/:opId/alumnos/:alumnoId/constancia', element: <Constancia /> },
          { path: '/escuelas', element: <Escuelas /> },
          { path: '/escuelas/nuevo', element: <EscuelaCreate /> },
          { path: '/escuelas/mi-escuela', element: <MiEscuela /> },
          { path: '/escuelas/alumnos', element: <AlumnosEscuela /> },
          { path: '/escuelas/alumnos/:alumnoId', element: <AlumnoEscuelaDetail /> },
          { path: '/escuelas/:escuelaId', element: <EscuelaDetail /> },
          { path: '/escuelas/:escuelaId/cursos', element: <Cursos /> },
          { path: '/escuelas/:escuelaId/alumnos', element: <AlumnosEscuela /> },
          { path: '/profesionales', element: <Profesionales /> },
          { path: '/usuarios-escuela', element: <UsuariosEscuela /> },
          { path: '/usuarios-administrativos', element: <UsuariosAdministrativos /> },
          { path: '/auditoria', element: <Auditoria /> },
          { path: '/hijos', element: <TutorFueraDeAlcance titulo="Mis hijos" /> },
          { path: '/hijos/nuevo', element: <TutorFueraDeAlcance titulo="Registrar hijo" /> },
          { path: '/consentimiento', element: <TutorFueraDeAlcance titulo="Consentimiento" /> },
          { path: '/antecedentes-familiares', element: <TutorFueraDeAlcance titulo="Antecedentes familiares" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default function App() {
  return (
    <TemaProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </TemaProvider>
  );
}
