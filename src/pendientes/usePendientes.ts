import { useCallback, useEffect, useState } from 'react';
import { v1Api } from '../api/client';

export interface Pendiente {
  titulo: string;
  subtitulo: string;
  ruta: string;
  icono: string;
}

function tituloOperativo(o: any): string {
  return o.nombre?.trim() ? o.nombre : o.escuela_nombre ?? 'Operativo';
}

// Espejo de pendientes_count_provider.dart: perfil escuela + operativos
// (borradores sin confirmar para verOperativo; confirmados/en curso para
// profesionales). Sin red o sin permiso, cada fuente se oculta.
export function usePendientes(can: (p: string) => boolean) {
  const [items, setItems] = useState<Pendiente[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const found: Pendiente[] = [];
    if (can('verMiEscuela')) {
      try {
        const { data } = await v1Api.get('/escuelas/mi-escuela/');
        if (data && data.perfil_completo === false) {
          const falt = Array.isArray(data.campos_faltantes) && data.campos_faltantes.length > 0
            ? data.campos_faltantes.join(', ')
            : 'datos del establecimiento';
          found.push({
            titulo: 'Datos de mi escuela',
            subtitulo: `Completá los datos obligatorios: ${falt}`,
            ruta: '/escuelas/mi-escuela',
            icono: 'school',
          });
        }
      } catch {
        /* se oculta */
      }
    }
    const puedeVer = can('verOperativo');
    const esProfesional = can('cargarEvaluacionMedica') || can('cargarEvaluacionOdontologica');
    if (puedeVer || esProfesional) {
      try {
        const { data } = await v1Api.get('/operativos/');
        const ops = Array.isArray(data) ? data : data.results ?? [];
        if (puedeVer) {
          for (const o of ops) {
            if (o.estado === 'borrador') {
              found.push({
                titulo: tituloOperativo(o),
                subtitulo: 'Operativo sin confirmar — completá y confirmalo',
                ruta: `/operativos/${o.id}`,
                icono: 'assignment_late',
              });
            }
          }
        }
        if (esProfesional) {
          for (const o of ops) {
            if (o.estado === 'confirmado' || o.estado === 'en_curso') {
              found.push({
                titulo: tituloOperativo(o),
                subtitulo: 'Tenés alumnos por evaluar',
                ruta: `/operativos/${o.id}`,
                icono: 'medical_services',
              });
            }
          }
        }
      } catch {
        /* se oculta */
      }
    }
    setItems(found);
    setLoading(false);
  }, [can]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { items, loading, recargar: cargar };
}
