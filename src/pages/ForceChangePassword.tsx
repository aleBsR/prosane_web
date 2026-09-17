import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage, authApi } from '../api/client';
import { AppButton, Field, PasswordReqs, TextInput, passwordChecks, useToast } from '../components/ui';

export default function ForceChangePassword() {
  const { refrescarSesion, logout } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [oldPw, setOldPw] = useState('');
  const [nw, setNw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiar() {
    if (!oldPw || !nw || !confirm) return setError('Completá todos los campos');
    const c = passwordChecks(nw, confirm);
    if (!c.coinciden) return setError('La nueva contraseña y la confirmación no coinciden');
    if (!c.largo) return setError('La nueva contraseña debe tener al menos 8 caracteres');
    if (!c.noNumerica) return setError('La contraseña no puede ser solo números');
    setLoading(true);
    setError(null);
    try {
      await authApi.post('/change-password/', { old_password: oldPw, new_password: nw });
      // Refrescar sesión para limpiar must_change_password y liberar el guard.
      await refrescarSesion();
      toast.push('ok', 'Contraseña actualizada. ¡Bienvenido!');
      nav('/inicio', { replace: true });
    } catch (e) {
      const msg = apiErrorMessage(e, 'No se pudo cambiar la contraseña');
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
          <p>Cambio de contraseña obligatorio</p>
        </div>
        <div className="card">
          <div className="info-box">
            Tu contraseña es temporal (vence en 72h) y debes cambiarla para continuar.
            <br />
            <em>Cada usuario gestiona su propia contraseña. El admin no puede verla.</em>
          </div>
          <PasswordReqs pw={nw} confirm={confirm} />
          <Field label="Contraseña temporal actual *">
            <TextInput type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          </Field>
          <Field label="Nueva contraseña *">
            <TextInput type="password" value={nw} onChange={(e) => setNw(e.target.value)} />
          </Field>
          <Field label="Confirmar nueva contraseña *">
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          {error && <div className="form-error">{error}</div>}
          <AppButton label="Cambiar contraseña" loading={loading} onClick={cambiar} />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await logout();
                nav('/login', { replace: true });
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
