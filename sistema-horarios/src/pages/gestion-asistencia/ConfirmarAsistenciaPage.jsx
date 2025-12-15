import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import horarioService from '../../services/gestion-horarios/horarioService.js';
import asistenciaService from '../../services/gestion-asistencia/asistenciaService.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
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
    const load = async () => {
      try {
        const data = await asistenciaService.obtenerHorariosDisponibles(2, { virtualAutorizado: true });
        setHorarios(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(parseApiError(err));
      }
    };

    load();
  }, []);

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
        if (active) setCalendario(data);
      } catch (err) {
        if (active) setCalendarioError(parseApiError(err));
      } finally {
        if (active) setCalendarioLoading(false);
      }
    };

    loadCalendario();

    return () => {
      active = false;
    };
  }, [horarioId]);

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
        horario_asignado_id: Number(horarioId),
      });

      setAsistenciaData(response.data?.data);
      setSuccess('✅ Asistencia virtual confirmada exitosamente');
      setHorarioId('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 400) {
        setError(message || 'Este horario no es virtual');
      } else if (status === 422) {
        setError(message || 'Fuera de la ventana de confirmación habilitada');
      } else if (status === 403) {
        setError(message || 'No tienes permisos para confirmar esta asistencia');
      } else if (status === 404) {
        setError('Horario no encontrado');
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Confirmar asistencia virtual"
        subtitle="Selecciona tu horario virtual autorizado para registrar asistencia"
      >
        <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
          Volver
        </button>
      </PageHeader>

      {(error || success) && (
        <div className="space-y-2">
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        </div>
      )}

      <section className="section-card space-y-3">
        <div className="flex items-center gap-3">
          <span className="badge-pill green">Virtual</span>
          <p className="text-sm text-gray-600">
            Solo puedes confirmar asistencia para clases virtuales autorizadas dentro de la ventana permitida. Si no ves tus horarios, contacta al administrador académico.
          </p>
        </div>
      </section>

      {calendarioError && (
        <Alert type="warn" message={calendarioError} onClose={() => setCalendarioError(null)} />
      )}

      {calendario.length > 0 && (
        <section className="section-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Calendario de clases</h2>
            {calendarioLoading && (
              <span className="text-xs text-gray-500">Actualizando...</span>
            )}
          </div>
          <div className="space-y-2">
            {calendario.map((item) => {
              const hoyFecha = new Date().toISOString().split('T')[0];
              const isToday = item.fecha === hoyFecha;
              return (
                <div
                  key={`${item.fecha}-${item.hora_inicio}`}
                  className={`flex justify-between items-center rounded-2xl px-4 py-3 text-sm ${
                    isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{item.dia}: {item.fecha}</div>
                    <div className="text-gray-600">{item.hora_inicio} - {item.hora_fin}</div>
                  </div>
                  <div className="text-xs font-semibold">
                    {item.asistencia_registrada ? (
                      <span className="badge-pill green">
                        Registrada{item.estado ? ` (${item.estado})` : ''}
                      </span>
                    ) : (
                      <span className="badge-pill red">Pendiente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!horarios.length && (
        <section className="section-card">
          <p className="text-sm text-gray-600">
            No hay clases virtuales autorizadas disponibles. Contacta al administrador académico para habilitar la modalidad virtual en tus horarios.
          </p>
        </section>
      )}

      <section className="section-card space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Seleccionar horario virtual <span className="text-red-500">*</span>
            </label>
            <select
              value={horarioId}
              onChange={(e) => setHorarioId(e.target.value)}
              required
              className="filters-full input"
            >
              <option value="">Seleccionar horario</option>
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.grupo?.materia?.nombre} - {h.grupo?.codigo_grupo} - {h.bloque_horario?.dia?.nombre} {h.bloque_horario?.horario?.hora_inicio}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo se muestran horarios virtuales autorizados.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !horarioId}
            className="btn-primary"
          >
            {loading ? 'Confirmando...' : 'Confirmar asistencia'}
          </button>
        </form>

        {asistenciaData && (
          <div className="filters-card space-y-3">
            <div className="flex items-center gap-3">
              <span className="badge-pill green">Confirmada</span>
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
                    <p className="font-semibold text-gray-800">Modalidad</p>
                    <p>Virtual</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ConfirmarAsistenciaPage;
