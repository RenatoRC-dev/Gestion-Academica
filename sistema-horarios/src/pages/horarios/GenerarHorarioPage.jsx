import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function GenerarHorarioPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const periodosRes = await api.get('/periodos');
        const p = periodosRes?.data?.data;
        const rows = Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
        setPeriodos(rows);
      } catch (err) {
        setError(parseApiError(err));
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResultado(null);
    try {
      const resp = await api.post('/horarios/generar', { periodo_id: parseInt(periodoId) });
      const data = resp?.data?.data ?? resp?.data;
      setResultado(data);
      setSuccess('Horarios generados exitosamente');
      setTimeout(() => navigate('/horarios'), 1200);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Generar Horario</h1>
        <button
          onClick={() => navigate('/horarios')}
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
            Período <span className="text-red-500">*</span>
          </label>
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar período</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Se generarán horarios automáticos para el período seleccionado.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/horarios')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !periodoId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generando...' : 'Generar Horarios'}
          </button>
        </div>
      </form>

      {resultado && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {resultado.grupos_procesados != null && (
              <li>Grupos procesados: {resultado.grupos_procesados}</li>
            )}
            {resultado.asignaciones_creadas != null && (
              <li>Asignaciones creadas: {resultado.asignaciones_creadas}</li>
            )}
            {resultado.tasa_exito && (
              <li>Tasa de éxito: {resultado.tasa_exito}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GenerarHorarioPage;

