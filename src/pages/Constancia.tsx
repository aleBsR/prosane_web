import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { v1Api, apiErrorMessage } from '../api/client';
import { AppButton, AppCard, PageHeader, useToast } from '../components/ui';

export default function Constancia() {
  const { opId, alumnoId } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function descargar() {
    setLoading(true);
    try {
      const r = await v1Api.get(`/operativos/${opId}/alumnos/${alumnoId}/constancia/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `constancia-${alumnoId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.push('ok', 'Constancia descargada');
    } catch (e) {
      toast.push('error', apiErrorMessage(e, 'No se pudo generar (solo en operativo finalizado)'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Constancia PDF" backTo={`/operativos/${opId}/alumnos/${alumnoId}`} />
      <AppCard>
        <p style={{ fontSize: 13 }}>Documento generado desde operativo finalizado — PROSANE Salta.</p>
        <AppButton label="Descargar constancia" loading={loading} onClick={descargar} />
      </AppCard>
    </div>
  );
}
