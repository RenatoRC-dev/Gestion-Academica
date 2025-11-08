import { useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaBook, FaBuilding, FaUsers, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/roles';
import { useState, useEffect } from 'react';
import metricasService from '../services/metricasService.js';

const MetricCard = ({ icon, title, value, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:scale-105 transition-transform"
    >
        <div className="text-3xl text-primary">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [metricas, setMetricas] = useState({
        total_docentes: 0,
        total_materias: 0,
        total_aulas: 0,
        total_grupos: 0,
        total_periodos: 0,
        total_usuarios: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetricas = async () => {
            try {
                setLoading(true);
                const data = await metricasService.obtenerMetricasGenerales();
                setMetricas(data);
                setError(null);
            } catch (err) {
                console.error('Error al obtener métricas:', err);
                setError(err.message || 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchMetricas();
    }, []);

    const roles = (user?.roles || []).map(r => typeof r === 'string' ? r.toLowerCase() : r.nombre?.toLowerCase());
    const isAdmin = roles.includes(ROLES.ADMIN);

    const handleRetry = () => {
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center">
                <span>Cargando métricas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center">
                <h2 className="text-xl text-red-600 mb-4">Error al cargar métricas</h2>
                <p className="mb-4 text-gray-600">{error}</p>
                <button
                    onClick={handleRetry}
                    className="btn btn-primary"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Dashboard Académico</h1>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Métricas del Sistema</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                        icon={<FaChalkboardTeacher />}
                        title="Docentes"
                        value={metricas.total_docentes}
                        onClick={() => navigate('/docentes')}
                    />
                    <MetricCard
                        icon={<FaBook />}
                        title="Materias"
                        value={metricas.total_materias}
                        onClick={() => navigate('/materias')}
                    />
                    <MetricCard
                        icon={<FaBuilding />}
                        title="Aulas"
                        value={metricas.total_aulas}
                        onClick={() => navigate('/aulas')}
                    />
                    <MetricCard
                        icon={<FaUsers />}
                        title="Grupos"
                        value={metricas.total_grupos}
                        onClick={() => navigate('/grupos')}
                    />
                    <MetricCard
                        icon={<FaCalendarAlt />}
                        title="Períodos"
                        value={metricas.total_periodos}
                        onClick={() => navigate('/periodos')}
                    />
                    <MetricCard
                        icon={<FaUserTie />}
                        title="Usuarios"
                        value={metricas.total_usuarios}
                        onClick={() => navigate('/usuarios')}
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <p className="text-gray-500">No hay actividad reciente registrada.</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
                    <div className="bg-white shadow-md rounded-lg p-4 grid grid-cols-2 gap-4">
                        {isAdmin && (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/horarios/generar')}
                                >
                                    Generar Horarios
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => navigate('/usuarios')}
                                >
                                    Gestionar Usuarios
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => navigate('/bitacora')}
                                >
                                    Ver Bitácora
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/asistencias/escanear-qr')}
                        >
                            Registrar Asistencia
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
