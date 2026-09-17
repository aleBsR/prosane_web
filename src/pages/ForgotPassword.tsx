import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiErrorMessage, authApi } from '../api/client';
import { AppButton, Field, TextInput, useToast } from '../components/ui';

export default function ForgotPassword() {
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setLoading(true);
    setError(null);
    try {
      await authApi.post('/reset-password/', { email: email.trim() });
      toast.push('ok', 'Si el correo está registrado, te enviamos un código de 6 dígitos (vence en 30 min).');
      nav('/reset-password', { state: { email: email.trim() } });
    } catch (e) {
      const msg = apiErrorMessage(e);
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
        </div>
        <div className="card">
          <h2 style={{ textAlign: 'center' }}>¿Olvidaste tu contraseña?</h2>
          <p style={{ textAlign: 'center', fontSize: 13 }}>
            Ingresá tu correo y te vamos a enviar un código de 6 dígitos para restablecerla.
          </p>
          <Field label="Correo electrónico">
            <TextInput
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error && <div className="form-error">{error}</div>}
          <AppButton label="ENVIAR CÓDIGO" loading={loading} disabled={!email.trim()} onClick={enviar} />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
