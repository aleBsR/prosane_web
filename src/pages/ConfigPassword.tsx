import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage, authApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, Field, PageHeader, PasswordReqs, TextInput, passwordChecks, useToast } from '../components/ui';

export default function ConfigPassword() {
  const nav = useNavigate();
  const { refrescarSesion } = useAuth();
  const toast = useToast();
  const [oldPw, setOldPw] = useState('');
  const [nw, setNw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function cambiar() {
    const c = passwordChecks(nw, confirm);
    if (!oldPw || !nw) return toast.push('error', 'Completá todos los campos');
    if (!c.coinciden) return toast.push('error', 'No coinciden');
    if (!c.largo) return toast.push('error', 'Mínimo 8 caracteres');
    if (!c.noNumerica) return toast.push('error', 'La contraseña no puede ser solo números');
    setSaving(true);
    try {
      await authApi.post('/change-password/', { old_password: oldPw, new_password: nw });
      await refrescarSesion();
      setOldPw('');
      setNw('');
      setConfirm('');
      toast.push('ok', 'Contraseña actualizada');
      nav('/usuario/configuracion');
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo cambiar'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Cambiar contraseña" backTo="/usuario/configuracion" />
      <AppCard>
        <div className="hint" style={{ marginBottom: 12 }}>Usá tu contraseña actual para confirmar el cambio.</div>
        <PasswordReqs pw={nw} confirm={confirm} />
        <Field label="Contraseña actual"><TextInput type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} /></Field>
        <Field label="Nueva contraseña"><TextInput type="password" value={nw} onChange={(e) => setNw(e.target.value)} /></Field>
        <Field label="Confirmar"><TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <AppButton label="Actualizar contraseña" loading={saving} onClick={cambiar} />
      </AppCard>
    </div>
  );
}
