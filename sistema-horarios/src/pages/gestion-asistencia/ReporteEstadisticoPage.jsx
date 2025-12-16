import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import reporteEstadisticoService from '../../services/reportes/reporteEstadisticoService.js';

const MetricCard = ({ label, value }) => (
  <div className="section-card text-center space-y-1 bg-white border border-gray-200">
    <div className="text-xs uppercase text-gray-500">{label}</div>
    <div className="text-3xl font-semibold text-gray-900">{value}</div>
  </div>
);

export default function ReporteEstadisticoPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reporteEstadisticoService.obtenerMensual();
      if (response?.success) {
        setDatos(response.data);
      } else {
        setError(response?.message || 'No se pudo obtener el reporte mensual');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al obtener el reporte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await reporteEstadisticoService.exportarPDF();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reporte_estadistico_mensual_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo descargar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const cards = useMemo(() => {
    if (!datos) return [];
    return [
      { label: 'Docentes activos', value: datos.docentes_activos },
      { label: 'Aulas ocupadas (ahora)', value: datos.aulas_ocupadas },
      { label: 'Aulas libres (ahora)', value: datos.aulas_libres },
      { label: '% asistencia', value: `${datos.porcentaje_asistencia}%` },
    ];
  }, [datos]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporte mensual estático"
        subtitle="Resumen preparado del mes actual"
      >
        <button
          type="button"
          className="btn-secondary"
          disabled={exporting || loading || !datos}
          onClick={handleExport}
        >
          {exporting ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {loading && (
        <div className="section-card text-sm text-gray-500">
          Cargando datos del mes actual...
        </div>
      )}

      {!loading && datos && (
        <>
          <div className="text-sm text-gray-500">
            Actualizado al {datos.hora_actual} del día de hoy (ocupación calculada según horarios activos).
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{cards.map((card) => (
            <MetricCard key={card.label} label={card.label} value={card.value} />
          ))}</div>

          <section className="section-card space-y-3">
            <div className="text-sm font-semibold text-gray-800">Aulas libres en este momento</div>
            {datos.aulas_libres_detalles && datos.aulas_libres_detalles.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {datos.aulas_libres_detalles.map((aula) => (
                  <span key={`aula-${aula.id}`} className="badge-pill gray">
                    {aula.codigo_aula}
                    {aula.ubicacion ? ` · ${aula.ubicacion}` : ''}
                    {aula.piso ? ` (Piso ${aula.piso})` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">Todas las aulas están ocupadas ahora mismo.</div>
            )}
          </section>

          <section className="section-card space-y-3">
            <div className="text-sm text-gray-600">
              Periodo: {datos.periodo?.nombre} ({datos.periodo?.inicio} - {datos.periodo?.fin})
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="section-card text-center">
                <div className="text-xs uppercase text-gray-500">Total asistencias</div>
                <div className="text-2xl font-semibold text-gray-900">{datos.total_asistencias}</div>
              </div>
              <div className="section-card text-center">
                <div className="text-xs uppercase text-gray-500">Asistencias presentes</div>
                <div className="text-2xl font-semibold text-gray-900">{datos.presentes}</div>
              </div>
              <div className="section-card text-center">
                <div className="text-xs uppercase text-gray-500">Aulas totales</div>
                <div className="text-2xl font-semibold text-gray-900">{datos.aulas_totales}</div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
