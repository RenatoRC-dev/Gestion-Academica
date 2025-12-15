import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function EscanearQRPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [codigoQR, setCodigoQR] = useState('');
    const [asistenciaData, setAsistenciaData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!codigoQR.trim()) {
            setError('Por favor ingresa un código QR');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setAsistenciaData(null);

        try {
            const response = await api.post('/asistencias/escanear-qr', {
                codigo_qr: codigoQR.trim(),
            });

            setAsistenciaData(response.data?.data);
            setSuccess('✅ Asistencia registrada exitosamente');
            setCodigoQR('');
        } catch (err) {
            console.error('Error escaneando QR:', err);

            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 404) {
                setError('❌ Código QR no válido o no encontrado');
            } else if (status === 422) {
                setError(message || '⏰ Código QR expirado o ya utilizado');
            } else if (status === 403) {
                setError(message || '🔒 No tienes permisos para registrar esta asistencia');
            } else {
                setError(parseApiError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setCodigoQR(text.trim());
        } catch (err) {
            console.error('Error al pegar:', err);
            setError('No se pudo leer del portapapeles');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">📱 Escanear Código QR</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Volver
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código QR <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={codigoQR}
                            onChange={(e) => setCodigoQR(e.target.value)}
                            placeholder="Ingresa o pega el código QR"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={handlePaste}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            📋 Pegar
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Escanea el código QR o pégalo manualmente
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !codigoQR.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Procesando...' : 'Registrar Asistencia'}
                </button>
            </form>

            {asistenciaData && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
                        <span>✅</span> Asistencia Confirmada
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
                                    <span className="font-semibold text-gray-700">Aula:</span>
                                    <span className="ml-2 text-gray-900">
                                        {asistenciaData.horario.aula?.codigo_aula}
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

export default EscanearQRPage;