import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import asistenciaService from '../../services/asistenciaService.js';
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
    const load = async () => {
      try {
        const rows = await asistenciaService.obtenerHorariosDisponibles(1);
        setHorarios(rows);
      } catch (err) {
        console.error('Error cargando horarios:', err);
        setError(parseApiError(err));
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!qrData?.data?.fecha_expiracion) return;
    const interval = setInterval(() => {
      const expiracion = new Date(qrData.data.fecha_expiracion);
      const diff = expiracion.getTime() - Date.now();
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

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrData(null);
    try {
      const response = await api.post('/asistencias/generar-qr', {
        horario_asignado_id: Number(selectedHorario),
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
    const code = qrData?.data?.codigo_hash;
    if (code) navigator.clipboard.writeText(code);
  };

  const horariosDisponibles = horarios;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Generar Código QR</h1>
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
            {horariosDisponibles.map((h) => {
              const bloque = h?.bloque_horario || h?.bloqueHorario;
              const dia = bloque?.dia?.nombre || '-';
              return (
                <option key={h.id} value={h.id}>
                  {h.grupo?.materia?.nombre} - {h.grupo?.codigo_grupo} - {dia}
                </option>
              );
            })}
          </select>
          <p className="text-sm text-gray-500 mt-1">Solo aparecen horarios presenciales</p>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedHorario}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generando...' : 'Generar Código QR'}
        </button>
        </form>

      {!horariosDisponibles.length && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm font-semibold text-yellow-800">
            No hay clases presenciales disponibles en la ventana actual.
          </p>
          <p className="text-sm text-yellow-700">
            Asegúrate de estar dentro de ±15 minutos del inicio de una clase para generar un QR.
          </p>
        </div>
      )}

      {qrData && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Código QR Generado</h2>

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
              <p className="text-sm text-gray-600 mb-2">Código Hash:</p>
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
                {countdown === 'Expirado' ? 'Código Expirado' : `Expira en: ${countdown}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerarQRPage;
