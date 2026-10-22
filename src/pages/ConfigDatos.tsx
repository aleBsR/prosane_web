import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage, authApi, v1Api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppCard, Field, PageHeader, TextInput, useToast } from '../components/ui';

export default function ConfigDatos() {
  const nav = useNavigate();
  const { refrescarSesion, can } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validando, setValidando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [escuela, setEscuela] = useState('');
  const [rol, setRol] = useState('');
  const puedeValidar = can('validarMiMatricula');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authApi.get('/me/');
        const user = data?.user ?? {};
        setNombre(String(user.nombre ?? ''));
        setApellido(String(user.apellido ?? ''));
        setEmail(String(user.email ?? ''));
        setEscuela(String(user.escuela_nombre ?? ''));
        const roles = Array.isArray(data?.roles) ? data.roles : [];
        setRol(String(roles[0]?.label ?? ''));
      } catch (e) {
        toast.push('error', apiErrorMessage(e, 'No se pudo cargar el perfil'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validarRefeps() {
    if (!matricula.trim()) {
      toast.push('error', 'Ingresá tu matrícula o DNI para validar en REFEPS');
      return;
    }
    setValidando(true);
    try {
      const { data } = await v1Api.post('/profesionales/validar-mi-matricula/', { matricula: matricula.trim() });
      setNombre(String(data?.nombre ?? ''));
      setApellido(String(data?.apellido ?? ''));
      toast.push('ok', 'Datos traídos de REFEPS, revisá y tocá Guardar');
    } catch (e: any) {
      const code = e?.response?.status;
      toast.push('error', code === 404
        ? 'Matrícula no encontrada en REFEPS, cargá tus datos manual'
        : code === 503
          ? 'REFEPS no disponible ahora, cargá tus datos manual'
          : apiErrorMessage(e, 'No se pudo validar en REFEPS'));
    } finally {
      setValidando(false);
    }
  }

  async function guardar() {
    setSaving(true);
    try {
      await authApi.patch('/me/', { nombre: nombre.trim(), apellido: apellido.trim() });
      await refrescarSesion();
      toast.push('ok', 'Perfil actualizado');
      nav('/usuario/configuracion', { replace: true });
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppCard>Cargando…</AppCard>;
  return (
    <div>
      <PageHeader title="Datos personales" backTo="/usuario/configuracion" />
      <AppCard>
        <div className="hint" style={{ marginBottom: 12 }}>Actualizá tu nombre y apellido.</div>
        <Field label="Nombre"><TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
        <Field label="Apellido"><TextInput value={apellido} onChange={(e) => setApellido(e.target.value)} /></Field>
        {puedeValidar && (
          <>
            <Field label="Matrícula o DNI (para autocompletar desde REFEPS)"><TextInput value={matricula} onChange={(e) => setMatricula(e.target.value)} /></Field>
            <AppButton label="Validar en REFEPS" loading={validando} onClick={validarRefeps} />
          </>
        )}
        <Field label="Email (solo lectura)"><TextInput value={email} disabled /></Field>
        {escuela && <Field label="Escuela (solo lectura)"><TextInput value={escuela} disabled /></Field>}
        {rol && <Field label="Rol (solo lectura)"><TextInput value={rol} disabled /></Field>}
        <AppButton label="Guardar" loading={saving} onClick={guardar} />
      </AppCard>
    </div>
  );
}
