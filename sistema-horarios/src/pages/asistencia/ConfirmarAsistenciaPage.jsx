import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import horarioService from '../../services/horarioService.js';
import asistenciaService from '../../services/asistenciaService.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function ConfirmarAsistenciaPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [horarios, setHorarios] = useState([]);
    const [horarioId, setHorarioId] = useState('');
    const [calendario, setCalendario] = useState([]);
    const [calendarioError, setCalendarioError] = useState(null);
    const [calendarioLoading, setCalendarioLoading] = useState(false);
    const [asistenciaData, setAsistenciaData] = useState(null);

    useEffect(() => {
        if (!horarioId) {
            setCalendario([]);
            setCalendarioError(null);
            return;
        }

        let active = true;
        setCalendarioLoading(true);
        setCalendarioError(null);

        const loadCalendario = async () => {
            try {
                const data = await horarioService.obtenerCalendario(horarioId);
                if (!active) return;
                setCalendario(data);
            } catch (err) {
                if (!active) return;
                setCalendarioError(parseApiError(err).message);
            } finally {
                if (active) setCalendarioLoading(false);
            }
        };

        loadCalendario();
        return () => {
            active = false;
        };
    }, [horarioId]);

    useEffect(() => {
        cargarHorariosVirtuales();
    }, []);

    const cargarHorariosVirtuales = async () => {
        try {
            const data = await asistenciaService.obtenerHorariosDisponibles(2, { virtualAutorizado: true });
            setHorarios(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error cargando horarios virtuales:', err);
            setError(parseApiError(err).message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!horarioId) {
            setError('Por favor selecciona un horario');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setAsistenciaData(null);

        try {
            const response = await api.post('/asistencias/confirmar-virtual', {
                horario_asignado_id: parseInt(horarioId),
            });

            setAsistenciaData(response.data?.data);
            setSuccess('✅ Asistencia virtual confirmada exitosamente');
            setHorarioId('');
        } catch (err) {
            console.error('Error confirmando asistencia:', err);

            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 400) {
                setError(message || '❌ Este horario no es virtual');
            } else if (status === 422) {
                setError(message || '⏰ Fuera de la ventana de confirmación permitida');
            } else if (status === 403) {
                setError(message || '🔒 No tienes permisos para confirmar esta asistencia');
            } else if (status === 404) {
                setError('❌ Horario no encontrado');
            } else {
                setError(parseApiError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">✅ Confirmar Asistencia Virtual</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Volver
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Solo puedes confirmar asistencia para clases virtuales autorizadas dentro de la ventana de tiempo permitida.
                        </p>
                    </div>
                </div>
            </div>

            {calendarioError && (
                <Alert type="warn" message={calendarioError} onClose={() => setCalendarioError(null)} />
            )}

            {calendario.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Calendario de clases</h2>
                        {calendarioLoading && <span className="text-xs text-gray-500">Actualizando...</span>}
                    </div>
                    <div className="grid gap-2">
                        {calendario.map((item) => {
                            const hoyFecha = new Date().toISOString().split('T')[0];
                            const isToday = item.fecha === hoyFecha;
                            return (
                                <div
                                    key={`${item.fecha}-${item.hora_inicio}`}
                                    className={`flex justify-between items-center rounded px-3 py-2 text-sm ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{item.dia}: {item.fecha}</div>
                                        <div className="text-gray-600">{item.hora_inicio} - {item.hora_fin}</div>
                                    </div>
                                    <div className="text-xs font-medium">
                                        {item.asistencia_registrada
                                            ? <span className="text-green-700">Registrada {item.estado && `(${item.estado})`}</span>
                                            : <span className="text-gray-500">Pendiente</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!horarios.length && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-sm font-semibold text-yellow-800">
                        No hay clases virtuales autorizadas disponibles.
                    </p>
                    <p className="text-sm text-yellow-700">
                        Contacta al administrador académico para habilitar la modalidad virtual de tus horarios.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Horario Virtual <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={horarioId}
                        onChange={(e) => setHorarioId(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar horario</option>
                        {horarios.map((h) => (
                            <option key={h.id} value={h.id}>
                                {h.grupo?.materia?.nombre} - {h.grupo?.codigo_grupo} - {h.bloque_horario?.dia?.nombre} {h.bloque_horario?.horario?.hora_inicio}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                        Solo se muestran horarios virtuales autorizados
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !horarioId}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Confirmando...' : 'Confirmar Asistencia'}
                </button>
            </form>

            {asistenciaData && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
                        <span>✅</span> Asistencia Virtual Confirmada
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold text-gray-700">Estado:</span>
                            <span className="ml-2 text-gray-900">{asistenciaData.estado}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-gray-700">Hora de Registro:</span>
                            <span className="ml-2 text-gray-900">
                                {new Date(asistenciaData.hora_registro).toLocaleString('es-ES')}
                            </span>
                        </div>

                        {asistenciaData.horario && (
                            <>
                                <div>
                                    <span className="font-semibold text-gray-700">Materia:</span>
                                    <span className="ml-2 text-gray-900">
                                        {asistenciaData.horario.grupo?.materia?.nombre}
                                    </span>
                                </div>

                                <div>
                                    <span className="font-semibold text-gray-700">Grupo:</span>
                                    <span className="ml-2 text-gray-900">
                                        {asistenciaData.horario.grupo?.codigo_grupo}
                                    </span>
                                </div>

                                <div>
                                    <span className="font-semibold text-gray-700">Modalidad:</span>
                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        Virtual
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConfirmarAsistenciaPage;
