import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import { AppButton, Field, TextInput, useToast } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      toast.push('ok', '¡Bienvenido!');
      nav('/inicio', { replace: true });
    } catch (err) {
      const msg = apiErrorMessage(err, 'Credenciales incorrectas');
      setError(msg);
      toast.push('error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <h1>PROSANE</h1>
          <p>Programa Nacional de Salud Escolar • Salta</p>
        </div>
        <div className="card">
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
              <TextInput
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            {error && <div className="form-error">{error}</div>}
            <AppButton
              label="INGRESAR"
              type="submit"
              loading={loading}
              disabled={!email.trim() || !password}
            />
          </form>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
