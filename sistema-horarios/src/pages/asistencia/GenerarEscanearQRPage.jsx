import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function GenerarEscanearQRPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [selectedHorario, setSelectedHorario] = useState('');

  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [codigoQR, setCodigoQR] = useState('');
  const [asistenciaData, setAsistenciaData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/horarios');
        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setHorarios(rows);
      } catch (err) {
        console.error('Error cargando horarios:', err);
        setGenError(parseApiError(err).message);
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
    setGenError(null);
    setQrData(null);

    try {
      const response = await api.post('/asistencias/generar-qr', {
        horario_asignado_id: Number(selectedHorario),
      });
      setQrData(response.data);
    } catch (err) {
      console.error('Error generando QR:', err);
      setGenError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();

    if (!codigoQR.trim()) {
      setScanError('Por favor ingresa un código QR');
      return;
    }

    setScanLoading(true);
    setScanError(null);
    setScanSuccess(null);
    setAsistenciaData(null);

    try {
      const response = await api.post('/asistencias/escanear-qr', {
        codigo_qr: codigoQR.trim(),
      });

      setAsistenciaData(response.data?.data);
      setScanSuccess('Asistencia registrada exitosamente');
      setCodigoQR('');
    } catch (err) {
      console.error('Error escaneando QR:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 404) {
        setScanError('Código QR no válido o no encontrado');
      } else if (status === 422) {
        setScanError(message || 'Código QR expirado o ya utilizado');
      } else if (status === 403) {
        setScanError(message || 'No tienes permisos para registrar esta asistencia');
      } else {
        setScanError(parseApiError(err).message);
      }
    } finally {
      setScanLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCodigoQR(text.trim());
    } catch (err) {
      console.error('Error al pegar:', err);
      setScanError('No se pudo leer del portapapeles');
    }
  };

  const horariosPresenciales = horarios.filter((h) => {
    const nombre = h?.modalidad?.nombre || h?.modalidad_nombre || '';
    const id = h?.modalidad_id;
    return (typeof nombre === 'string' && nombre.toLowerCase().includes('presencial')) || id === 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Generar y Escanear Código QR</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="grid gap-6">
        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          {genError && <Alert type="error" message={genError} onClose={() => setGenError(null)} />}
          <form onSubmit={handleGenerate} className="space-y-4">
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
                {horariosPresenciales.map((h) => {
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
                      onClick={() => navigator.clipboard.writeText(qrData.data?.codigo_hash ?? '')}
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
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          {(scanError || scanSuccess) && (
            <Alert
              type={scanError ? 'error' : 'success'}
              message={scanError || scanSuccess}
              onClose={() => (scanError ? setScanError(null) : setScanSuccess(null))}
            />
          )}
          <form onSubmit={handleScanSubmit} className="space-y-4">
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
                  Pegar
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Escanea el código QR o pégalo manualmente</p>
            </div>

            <button
              type="submit"
              disabled={scanLoading || !codigoQR.trim()}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanLoading ? 'Procesando...' : 'Registrar Asistencia'}
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
                      <span className="ml-2 text-gray-900">{asistenciaData.horario.grupo?.materia?.nombre}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-gray-700">Grupo:</span>
                      <span className="ml-2 text-gray-900">{asistenciaData.horario.grupo?.codigo_grupo}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-gray-700">Aula:</span>
                      <span className="ml-2 text-gray-900">{asistenciaData.horario.aula?.codigo_aula}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default GenerarEscanearQRPage;
