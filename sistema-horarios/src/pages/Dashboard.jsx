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
  const esDocente = Array.isArray(user?.roles) && user.roles.includes('docente');

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
        <span>Cargando métricas…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center">
        <h2 className="text-xl text-red-600 mb-4">Error al cargar métricas</h2>
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
    { icon: <FaCalendarAlt />, title: 'Períodos', value: metricas.total_periodos, description: 'Activos', to: '/periodos' },
    { icon: <FaUserTie />, title: 'Usuarios', value: metricas.total_usuarios, description: 'Con acceso', to: '/usuarios' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard académico</h1>
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
                : 'Los eventos se mostrarán aquí en cuanto existan'}
            </p>
          </div>
        </div>

        {esDocente ? (
          <>
            {calendarioError && (
              <Alert type="warn" message={calendarioError} onClose={() => setCalendarioError(null)} />
            )}
            <div className="space-y-2">
              {calendarioLoading && <p className="text-sm text-gray-500">Cargando calendario...</p>}
              {!calendarioLoading && calendario.length === 0 && (
                <p className="text-sm text-gray-500">No hay clases próximas en los siguientes 14 días.</p>
              )}
              {calendario.slice(0, 5).map((item) => (
                <div
                  key={`${item.horario_id ?? 'h'}-${item.fecha}-${item.hora_inicio}`}
                  className="rounded border border-gray-200 px-3 py-2 flex justify-between items-center bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {item.dia} · {item.fecha}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.hora_inicio} - {item.hora_fin}
                    </div>
                  </div>
                  <div className="text-xs font-medium">
                    {item.asistencia_registrada ? (
                      <span className="text-green-700">Registrada {item.estado && `(${item.estado})`}</span>
                    ) : (
                      <span className="text-gray-500">Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No hay actividad registrada aún. Cuando se generen movimientos los verás aquí.
          </div>
        )}
      </section>
    </div>
  );
}
