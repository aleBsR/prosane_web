import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiErrorMessage, authApi } from '../api/client';
import { AppButton, Field, PasswordReqs, TextInput, passwordChecks, useToast } from '../components/ui';

export default function ResetPassword() {
  const nav = useNavigate();
  const toast = useToast();
  const loc = useLocation() as { state?: { email?: string } };
  const [email, setEmail] = useState(loc.state?.email ?? '');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeOk = code.trim().length === 6;
  const c = passwordChecks(pw, confirm);
  const pwOk = c.largo && c.noNumerica && c.coinciden;

  async function confirmar() {
    if (pw !== confirm) {
      toast.push('error', 'La contraseña y la confirmación no coinciden');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.post('/reset-password/confirm/', {
        email: email.trim(),
        code: code.trim(),
        new_password: pw,
      });
      toast.push('ok', 'Contraseña restablecida. Ingresá con tu nueva clave.');
      nav('/login', { replace: true });
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
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="brand">
          <h1>PROSANE</h1>
        </div>
        <div className="card">
          <h2 style={{ textAlign: 'center' }}>Restablecer contraseña</h2>
          <p style={{ textAlign: 'center', fontSize: 13 }}>
            Ingresá el código que recibiste por correo y tu nueva contraseña.
          </p>
          <Field label="Correo electrónico">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Código (6 dígitos)">
            <TextInput value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Nueva contraseña">
            <TextInput type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <PasswordReqs pw={pw} confirm={confirm} />
          {error && <div className="form-error">{error}</div>}
          <AppButton
            label="RESTABLECER CONTRASEÑA"
            loading={loading}
            disabled={!codeOk || !pwOk}
            onClick={confirmar}
          />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
