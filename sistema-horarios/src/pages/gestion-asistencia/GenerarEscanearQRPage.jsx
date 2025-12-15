import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
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
        const payload = response.data?.data ?? response.data ?? [];
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload)
              ? payload
              : [];
        setHorarios(rows);
      } catch (err) {
        setGenError(parseApiError(err));
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!qrData?.data?.fecha_expiracion) return undefined;
    const interval = setInterval(() => {
      if (!qrData?.data?.fecha_expiracion) return;
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

  const horariosPresenciales = horarios.filter((h) => {
    const nombre = h?.modalidad?.nombre || h?.modalidad_nombre || '';
    const id = h?.modalidad_id;
    return (
      (typeof nombre === 'string' && nombre.toLowerCase().includes('presencial')) ||
      id === 1
    );
  });

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
      setGenError(parseApiError(err));
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
      const status = err.response?.status;
      if (status === 404) {
        setScanError('Código QR no válido o no encontrado');
      } else if (status === 422) {
        setScanError('Código QR expirado o ya utilizado');
      } else if (status === 403) {
        setScanError('No tienes permisos para registrar esta asistencia');
      } else {
        setScanError(parseApiError(err));
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
      setScanError('No se pudo leer del portapapeles');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generar y Escanear Código QR"
        subtitle="Administra los códigos QR presenciales y registra la asistencia al instante"
      >
        <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          Volver
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="section-card space-y-5">
          {genError && <Alert type="error" message={genError} onClose={() => setGenError(null)} />}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Seleccionar horario presencial <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedHorario}
                onChange={(e) => setSelectedHorario(e.target.value)}
                required
                className="filters-full input"
              >
                <option value="">Seleccionar horario</option>
                {horariosPresenciales.map((h) => {
                  const bloque = h?.bloque_horario || h?.bloqueHorario;
                  const dia = bloque?.dia?.nombre || '-';
                  return (
                    <option key={h.id} value={h.id}>
                      {h.grupo?.materia?.nombre || 'Materia'} - {h.grupo?.codigo_grupo || 'Grupo'} - {dia}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">Solo aparecen horarios presenciales</p>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedHorario}
              className="btn-primary"
            >
              {loading ? 'Generando...' : 'Generar Código QR'}
            </button>
          </form>

          {qrData && (
            <div className="filters-card space-y-5">
              <div className="text-center">
                {qrData.data?.qr_image_url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={qrData.data.qr_image_url}
                      alt="QR Code"
                      className="w-52 h-52 border border-gray-200 rounded-lg"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-1">Código Hash</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <code className="text-xs font-mono bg-white px-3 py-1 rounded border border-gray-200 break-all">
                    {qrData.data?.codigo_hash}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(qrData.data?.codigo_hash ?? '')}
                    className="action-link"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {countdown && (
                <div className="text-center text-base font-semibold">
                  {countdown === 'Expirado' ? (
                    <span className="text-red-600">Código expirado</span>
                  ) : (
                    <span className="text-green-600">Expira en: {countdown}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="section-card space-y-5">
          {(scanError || scanSuccess) && (
            <Alert
              type={scanError ? 'error' : 'success'}
              message={scanError || scanSuccess}
              onClose={() => (scanError ? setScanError(null) : setScanSuccess(null))}
            />
          )}

          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Código QR <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={codigoQR}
                  onChange={(e) => setCodigoQR(e.target.value)}
                  placeholder="Ingresa o pega el código QR"
                  className="flex-1 input"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="btn-secondary"
                >
                  Pegar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Escanea el código QR o pégalo manualmente.
              </p>
            </div>

            <button
              type="submit"
              disabled={scanLoading || !codigoQR.trim()}
              className="btn-primary"
            >
              {scanLoading ? 'Procesando...' : 'Registrar asistencia'}
            </button>
          </form>

          {asistenciaData && (
            <div className="filters-card space-y-4">
              <div className="flex items-center gap-3">
                <span className="badge-pill green">Asistencia confirmada</span>
                <span className="text-sm text-gray-600">
                  {new Date(asistenciaData.hora_registro).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-800">Estado</p>
                  <p>{asistenciaData.estado}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Método</p>
                  <p>{asistenciaData.metodo_registro?.nombre || 'QR'}</p>
                </div>
                {asistenciaData.horario && (
                  <>
                    <div>
                      <p className="font-semibold text-gray-800">Materia</p>
                      <p>{asistenciaData.horario.grupo?.materia?.nombre}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Grupo</p>
                      <p>{asistenciaData.horario.grupo?.codigo_grupo}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Aula</p>
                      <p>{asistenciaData.horario.aula?.codigo_aula}</p>
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
