import { Link } from 'react-router-dom';

// El registro de tutores está fuera del alcance de esta etapa en la web
// (igual que el perfil tutor: ver TutorFueraDeAlcance). Existe como ruta
// pública para que el link "Regístrese aquí" del login no quede roto.
export default function Signup() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="card empty">
          <h3>Registro</h3>
          <p>El registro de tutores está omitido en esta etapa: la escuela carga los datos de los alumnos.</p>
          <Link className="login-link" to="/login">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
