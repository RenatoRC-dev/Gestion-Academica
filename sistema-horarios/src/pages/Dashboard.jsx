import { useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaBook, FaBuilding, FaUsers, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import metricasService from '../services/reportes/metricasService.js';
import horarioService from '../services/gestion-horarios/horarioService.js';
import Alert from '../components/Alert.jsx';
import { parseApiError } from '../utils/httpErrors.js';
import { useAuth } from '../context/AuthContext.jsx';

const MetricCard = ({ icon, title, value, description, onClick }) => (
  <button type="button" onClick={onClick} className="metric-card">
    <span className="metric-card-icon">{icon}</span>
    <span className="metric-card-body">
      <span className="metric-card-label">{title}</span>
      <span className="metric-card-value">{value}</span>
      <span className="metric-card-description">{description}</span>
    </span>
  </button>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    total_docentes: 0,
    total_materias: 0,
    total_aulas: 0,
    total_grupos: 0,
    total_periodos: 0,
    total_usuarios: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendario, setCalendario] = useState([]);
  const [calendarioLoading, setCalendarioLoading] = useState(false);
  const [calendarioError, setCalendarioError] = useState(null);
  const { user } = useAuth();
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
        .filter(Boolean)
    : [];
  const esDocente = normalizedRoles.includes('docente');

  const stripDiacritics = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const formatTime = (value) => {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  const buildHorarioMatrix = (agenda) => {
    const orderedDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    const formatSlot = (item) =>
      `${formatTime(item.hora_inicio)} - ${formatTime(item.hora_fin)}`;
    const slots = Array.from(new Set(agenda.map((item) => formatSlot(item)))).sort();
    const matrix = slots.map((slot) => ({
      slot,
      cells: orderedDays.map((dia) => ({
        entries: agenda.filter(
          (item) =>
            stripDiacritics(item.dia) === stripDiacritics(dia) &&
            `${formatTime(item.hora_inicio)} - ${formatTime(item.hora_fin)}` === slot
        ),
      })),
    }));
    return { orderedDays, matrix };
  };

  const buildHorarioHtml = (orderedDays, matrix) => {
    const rowsHtml = matrix
      .map(({ slot, cells }) => {
        const cellsHtml = cells
          .map(({ entries }) => {
            if (!entries.length) {
              return `<td class="empty-slot">&#8212;</td>`;
            }
            return `<td>
              ${entries
                .map(
                  (entry) => `
                    <div class="entry-name">${entry.materia}</div>
                    <ul class="slot-list">
                      <li>Aula: ${entry.aula}</li>
                    </ul>`
                )
                .join('')}
            </td>`;
          })
          .join('');
        return `<tr>
          <td class="slot-label">${slot}</td>
          ${cellsHtml}
        </tr>`;
      })
      .join('');
    return `
      <table class="horario-table">
        <thead>
          <tr>
            <th class="slot-label">Horario</th>
            ${orderedDays.map((dia) => `<th>${dia}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>`;
  };

  const handlePrintHorario = (agenda) => {
    if (!agenda || !agenda.length) {
      return;
    }
    const { orderedDays, matrix } = buildHorarioMatrix(agenda);
    const entriesHtml = buildHorarioHtml(orderedDays, matrix);
    const html = `
      <html>
        <head>
          <title>Horario del docente</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 32px; background: #fff; color: #111827; }
            h2 { margin-top: 0; font-size: 24px; }
            .horario-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .horario-table th, .horario-table td { border: 1px solid #d1d5db; padding: 12px; vertical-align: top; }
            .horario-table th { text-transform: uppercase; font-size: 12px; color: #6b7280; }
            .slot-label { width: 10%; background: #f3f4f6; font-weight: 600; }
            .slot-list { margin: 0; padding-left: 16px; list-style: disc; color: #1f2937; }
            .slot-list li + li { margin-top: 4px; }
            .entry-name { font-weight: 600; margin-bottom: 4px; color: #1f2937; }
            .empty-slot { text-align: center; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h2>Horario del docente</h2>
              <p>${user?.nombre_completo || 'Docente'}</p>
            </div>
            <div style="text-align:right; font-size:12px; color:#6b7280;">
              ${new Date().toLocaleString('es-BO')}
            </div>
          </div>
          ${entriesHtml}
        </body>
      </html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      window.print();
    }
  };

  const handleExportExcel = (agenda) => {
    if (!agenda || !agenda.length) {
      return;
    }
    const { orderedDays, matrix } = buildHorarioMatrix(agenda);
    const tableHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          ${buildHorarioHtml(orderedDays, matrix)}
        </body>
      </html>`;
    const uri = `data:application/vnd.ms-excel;base64,${window.btoa(
      unescape(encodeURIComponent(tableHtml))
    )}`;
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'horario_docente.xls';
    link.click();
  };

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        setLoading(true);
        const data = await metricasService.obtenerMetricasGenerales();
        setMetricas(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetricas();
  }, []);

  useEffect(() => {
    if (!esDocente) return;

    let active = true;
    setCalendario([]);
    setCalendarioError(null);
    setCalendarioLoading(true);

    horarioService
      .calendarioDocente()
      .then((data) => {
        if (!active) return;
        setCalendario(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!active) return;
        setCalendarioError(parseApiError(err).message);
      })
      .finally(() => {
        if (active) setCalendarioLoading(false);
      });

    return () => {
      active = false;
    };
  }, [esDocente]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center">
        <span>Cargando métricas</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center">
        <h2 className="text-xl text-red-600 mb-4">Error al cargar mÃ©tricas</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <button onClick={handleRetry} className="btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  const cards = [
    { icon: <FaChalkboardTeacher />, title: 'Docentes', value: metricas.total_docentes, description: 'Registrados', to: '/docentes' },
    { icon: <FaBook />, title: 'Materias', value: metricas.total_materias, description: 'En catálogo', to: '/materias' },
    { icon: <FaBuilding />, title: 'Aulas', value: metricas.total_aulas, description: 'Registradas', to: '/aulas' },
    { icon: <FaUsers />, title: 'Grupos', value: metricas.total_grupos, description: 'Programados', to: '/grupos' },
    { icon: <FaCalendarAlt />, title: 'Perí­odos', value: metricas.total_periodos, description: 'Activos', to: '/periodos' },
    { icon: <FaUserTie />, title: 'Usuarios', value: metricas.total_usuarios, description: 'Con acceso', to: '/usuarios' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Académico</h1>
        <p className="text-gray-500">Resumen general de la gestión actual</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Métricas del sistema</h2>
        <div className="metrics-grid">
          {cards.map((card) => (
            <MetricCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              value={card.value}
              description={card.description}
              onClick={() => navigate(card.to)}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {esDocente ? 'Tu calendario de clases' : 'Actividad reciente'}
            </h2>
            <p className="text-sm text-gray-500">
              {esDocente
                ? 'Las próximas clases programadas para tu horario académico'
                : 'Los eventos se mostrarán aquí­ en cuanto existan'}
            </p>
          </div>
        </div>

        {esDocente ? (
          <>
            {calendarioError && (
              <Alert type="warn" message={calendarioError} onClose={() => setCalendarioError(null)} />
            )}
            <div className="space-y-4">
              {calendarioLoading && <p className="text-sm text-gray-500">Cargando calendario...</p>}
              {!calendarioLoading && calendario.length === 0 && (
                <p className="text-sm text-gray-500">Todaví­a no se asignaron clases para tu horario.</p>
              )}
              {!calendarioLoading && calendario.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Horario activo</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintHorario(calendario)}
                        className="btn-secondary px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        Imprimir/Exportar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportExcel(calendario)}
                        className="btn-secondary px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        Exportar Excel
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-700">
                      <thead className="bg-gray-100 uppercase text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Materia</th>
                          <th className="px-3 py-2">Grupo</th>
                          <th className="px-3 py-2">Aula</th>
                          <th className="px-3 py-2">Día</th>
                          <th className="px-3 py-2">Horario</th>
                          <th className="px-3 py-2">Modalidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendario.map((item) => (
                          <tr key={item.id} className="border-t last:border-b hover:bg-gray-50">
                            <td className="px-3 py-2">{item.materia}</td>
                            <td className="px-3 py-2">{item.grupo}</td>
                            <td className="px-3 py-2">{item.aula}</td>
                            <td className="px-3 py-2">{item.dia}</td>
                            <td className="px-3 py-2">{item.hora_inicio} - {item.hora_fin}</td>
                            <td className="px-3 py-2">{item.modalidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No hay actividad registrada aÃºn. Cuando se generen movimientos los verÃ¡s aquÃ­.
          </div>
        )}
      </section>
    </div>
  );
}
