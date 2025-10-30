import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function GenerarQRPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [horarios, setHorarios] = useState([]);
    const [selectedHorario, setSelectedHorario] = useState('');
    const [qrData, setQrData] = useState(null);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        loadHorarios();
    }, []);

    useEffect(() => {
        if (!qrData?.data?.fecha_expiracion) return;

        const interval = setInterval(() => {
            const expiracion = new Date(qrData.data.fecha_expiracion);
            const now = new Date();
            const diff = expiracion - now;

            if (diff <= 0) {
                setCountdown('Expirado');
                clearInterval(interval);
            } else {
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                setCountdown(`${minutes}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [qrData]);

    const loadHorarios = async () => {
        try {
            const response = await api.get('/horarios');
            setHorarios(response.data?.data?.data ?? response.data?.data ?? []);
        } catch (err) {
            console.error('Error cargando horarios:', err);
            setError(parseApiError(err));
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setQrData(null);

        try {
            const response = await api.post('/asistencias/generar-qr', {
                horario_asignado_id: parseInt(selectedHorario),
            });

            setQrData(response.data);
        } catch (err) {
            console.error('Error generando QR:', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (qrData?.data?.codigo_hash) {
            navigator.clipboard.writeText(qrData.data.codigo_hash);
            alert('CÃ³digo copiado al portapapeles');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">ðŸ“± Generar CÃ³digo QR</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Volver
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <form onSubmit={handleGenerate} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Horario <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedHorario}
                        onChange={(e) => setSelectedHorario(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar horario</option>
                        {horarios.filter((h) => h.modalidad?.nombre === 'Presencial').map((h) => (
                            <option key={h.id} value={h.id}>
                                {h.grupo?.materia?.nombre} - {h.grupo?.codigo_grupo} - {h.bloque_horario?.dia?.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                        Solo aparecen horarios presenciales
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !selectedHorario}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Generando...' : 'Generar CÃ³digo QR'}
                </button>
            </form>

            {qrData && (
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">âœ… CÃ³digo QR Generado</h2>

                        {qrData.data?.qr_image_url && (
                            <div className="flex justify-center mb-6">
                                <img
                                    src={qrData.data.qr_image_url}
                                    alt="QR Code"
                                    className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                                />
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-600 mb-2">CÃ³digo Hash:</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="text-sm font-mono bg-white px-4 py-2 rounded border border-gray-300 break-all">
                                    {qrData.data?.codigo_hash}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>

                        {countdown && (
                            <div className={`text-2xl font-bold ${countdown === 'Expirado' ? 'text-red-600' : 'text-green-600'}`}>
                                {countdown === 'Expirado' ? 'â° CÃ³digo Expirado' : `â±ï¸ Expira en: ${countdown}`}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GenerarQRPage;
