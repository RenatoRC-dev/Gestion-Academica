import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function GenerarHorarioPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('automatico');
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [restricciones, setRestricciones] = useState([{ docente_id: '', pisos: '' }]);
  const [preferencias, setPreferencias] = useState([{ docente_id: '', grupo_id: '', pattern: '' }]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [conflictosDetalle, setConflictosDetalle] = useState([]);

  const esPreferenciaCompleta = (pref) => Boolean(pref.docente_id && pref.grupo_id && pref.pattern);
  const preferenciasCompletas = preferencias.filter(esPreferenciaCompleta);
  const hayPreferenciaEnProceso = preferencias.some((pref) => pref.docente_id || pref.grupo_id);
  const ultimaPreferenciaValida = preferencias.length === 0 || esPreferenciaCompleta(preferencias[preferencias.length - 1]);
  const puedeGenerarPreferencias =
    preferenciasCompletas.length > 0 || !hayPreferenciaEnProceso;

  useEffect(() => {
    const load = async () => {
      try {
        const periodosRes = await api.get('/periodos', { params: { activo: true } });
        const p = periodosRes?.data?.data;
        const rows = Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
        setPeriodos(rows);

        const docentesRes = await api.get('/docentes', { params: { per_page: 100 } });
        const dPayload = docentesRes?.data?.data;
        const dRows = Array.isArray(dPayload?.data) ? dPayload.data : Array.isArray(dPayload) ? dPayload : [];
        setDocentes(dRows);
        const gruposRes = await api.get('/grupos', { params: { per_page: 100 } });
        const gPayload = gruposRes?.data?.data;
        const gRows = Array.isArray(gPayload?.data) ? gPayload.data : Array.isArray(gPayload) ? gPayload : [];
        setGrupos(gRows);
      } catch (err) {
      setError(parseApiError(err).message);
      }
    };
    load();
  }, []);

  const handleAddRestriccion = () => {
        setRestricciones([...restricciones, { docente_id: '', pisos: '' }]);
  };
  const handleAddPreferencia = () => {
    if (!ultimaPreferenciaValida) {
      return;
    }
    setPreferencias([...preferencias, { docente_id: '', grupo_id: '', pattern: '' }]);
  };
  const handlePreferenciaChange = (index, field, value) => {
    const normalizedValue = field === 'pattern' ? value.toUpperCase() : value;
    setPreferencias((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: normalizedValue } : item))
    );
  };

  const handleRestriccionChange = (index, field, value) => {
    setRestricciones((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResultado(null);
    setConflictosDetalle([]);

    try {
      const payload = {
        periodo_id: parseInt(periodoId),
        restricciones_docentes: restricciones
          .filter((r) => r.docente_id)
          .map((r) => ({
            docente_id: parseInt(r.docente_id),
            pisos: r.pisos
              .split(',')
              .map((v) => parseInt(v.trim()))
              .filter((num) => !Number.isNaN(num)),
          })),
        preferencias: preferenciasCompletas.map((p) => ({
          docente_id: parseInt(p.docente_id, 10),
          grupo_id: parseInt(p.grupo_id, 10),
          pattern: (p.pattern || 'LMV').toUpperCase(),
        })),
      };

      const resp = await api.post('/horarios/generar', payload);
      const data = resp?.data?.data ?? resp?.data;
      setResultado(data);
      setSuccess('Horarios generados exitosamente');
    } catch (err) {
      const parsed = parseApiError(err);
      console.error('Conflictos al generar horario', parsed.conflictos);
      setConflictosDetalle(Array.isArray(parsed.conflictos) ? parsed.conflictos : []);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModoChange = (value) => {
    setModo(value);
    setResultado(null);
    setError(null);
    setSuccess(null);
    setConflictosDetalle([]);
  };

  const resumen = useMemo(() => {
    if (!resultado) return null;
    return [
      resultado.grupos_procesados != null && `Grupos procesados: ${resultado.grupos_procesados}`,
      resultado.asignaciones_creadas != null && `Asignaciones creadas: ${resultado.asignaciones_creadas}`,
      resultado.tasa_exito && `Tasa de éxito: ${resultado.tasa_exito}`,
    ].filter(Boolean);
  }, [resultado]);

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
      {conflictosDetalle.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 space-y-1">
          <p className="font-semibold">Detalles del conflicto:</p>
          <ul className="list-disc pl-5 space-y-1">
            {conflictosDetalle.map((item, index) => (
              <li key={`conf-${index}`}>
                {item.grupo_id ? `Grupo ${item.grupo_id}: ` : ''}
                {item.razon || 'Conflicto sin detalle'}
                {Array.isArray(item.bloques) && item.bloques.length > 0
                  ? ` (Bloques: ${item.bloques.join(', ')})`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex gap-3">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg ${modo === 'automatico' ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}
            onClick={() => handleModoChange('automatico')}
          >
            Automático
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg ${modo === 'manual' ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}
            onClick={() => handleModoChange('manual')}
          >
            Manual
          </button>
        </div>

        {modo === 'automatico' && (
          <form onSubmit={handleGenerar} className="space-y-6">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Restricciones docentes (pisos no deseados)</p>
                <button
                  type="button"
                  className="text-blue-600 text-sm"
                  onClick={handleAddRestriccion}
                >
                  + Agregar restricción
                </button>
            </div>
            {restricciones.map((rest, index) => (
                <div key={`rest-${index}`} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500">Docente</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={rest.docente_id}
                      onChange={(e) => handleRestriccionChange(index, 'docente_id', e.target.value)}
                    >
                      <option value="">Seleccionar docente (opcional)</option>
                      {docentes.map((doc) => (
                        <option key={doc.persona_id} value={doc.persona_id}>
                          {doc.persona?.nombre_completo || `Docente ${doc.persona_id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500">Pisos vetados</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={rest.pisos}
                      placeholder="Ej: 4,5"
                      onChange={(e) => handleRestriccionChange(index, 'pisos', e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Separa por comas, p. ej. 4,5.
                    </p>
                  </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Preferencias (docente + grupo)</p>
                <button
                  type="button"
                  className={`text-blue-600 text-sm ${!ultimaPreferenciaValida ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={handleAddPreferencia}
                  disabled={!ultimaPreferenciaValida}
                >
                  + Agregar preferencia
                </button>
            </div>
            {preferencias.map((pref, index) => (
              <div key={`pref-${index}`} className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500">Docente</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={pref.docente_id}
                    onChange={(e) => handlePreferenciaChange(index, 'docente_id', e.target.value)}
                  >
                    <option value="">Seleccionar docente</option>
                    {docentes.map((doc) => (
                      <option key={(doc.id ?? doc.persona_id)} value={(doc.id ?? doc.persona_id)}>
                        {doc.persona?.nombre_completo || doc.codigo_docente}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500">Grupo</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={pref.grupo_id}
                    onChange={(e) => handlePreferenciaChange(index, 'grupo_id', e.target.value)}
                  >
                    <option value="">Seleccionar grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.codigo_grupo} — {grupo.materia?.nombre}
                      </option>
                    ))}
                    </select>
                  </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500">Patrón</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={pref.pattern}
                    onChange={(e) => handlePreferenciaChange(index, 'pattern', e.target.value)}
                  >
                    <option value="">Seleccionar patrón</option>
                    <option value="LMV">LMV (Lunes/Mié/Vier)</option>
                    <option value="MJ">MJ (Martes/Jue)</option>
                  </select>
                </div>
              </div>
            ))}
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
                disabled={loading || !periodoId || !puedeGenerarPreferencias}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generando...' : 'Generar Horarios'}
              </button>
            </div>
          </form>
        )}

        {modo === 'manual' && (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 space-y-4">
            <p className="text-base text-gray-600">
              La opción manual permite editar asignaciones existentes (CU12). Navega al módulo de
              horarios y selecciona un bloque para ajustarlo (docente, aula, bloque o modalidad).
            </p>
            <button
              type="button"
              onClick={() => navigate('/horarios')}
              className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Ir a edición manual
            </button>
          </div>
        )}
      </div>

      {resultado && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {resumen.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GenerarHorarioPage;
