import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import { AppButton, AppSwitch, Field, PasswordInput, TextInput } from '../components/ui';

// Espejo de login_screen.dart:
// título "Bienvenido" + subtítulo, email, contraseña con ojo, Recordarme,
// "¿Olvidaste tu contraseña?", error centrado sobre el botón,
// "INICIAR SESIÓN" y "Regístrese aquí".
export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password, recordarme);
      nav('/inicio', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Credenciales incorrectas'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="card">
          <h2 className="login-title">Bienvenido</h2>
          <p className="login-subtitle">Ingresá con tu cuenta para continuar</p>
          <form onSubmit={submit}>
            <Field label="Correo electrónico">
              <TextInput
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </Field>
            <Field label="Contraseña">
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <AppSwitch value={recordarme} onChanged={setRecordarme} label="Recordarme" />
            <Link className="login-link" to="/forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
            {error && <div className="form-error">{error}</div>}
            <AppButton label="INICIAR SESIÓN" type="submit" loading={loading} />
          </form>
          <Link className="login-link" to="/signup">
            Regístrese aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
