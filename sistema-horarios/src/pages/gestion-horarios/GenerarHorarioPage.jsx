import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

const emptyRestriccion = { docente_id: '', pisos: '' };
const emptyPreferencia = { docente_id: '', grupo_id: '', pattern: '' };

function GenerarHorarioPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('automatico');
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [restricciones, setRestricciones] = useState([emptyRestriccion]);
  const [preferencias, setPreferencias] = useState([emptyPreferencia]);
  const [resultado, setResultado] = useState(null);
  const [conflictosDetalle, setConflictosDetalle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const esPreferenciaCompleta = (pref) => Boolean(pref.docente_id && pref.grupo_id && pref.pattern);
  const preferenciasCompletas = preferencias.filter(esPreferenciaCompleta);
  const hayPreferenciaEnProceso = preferencias.some((pref) => pref.docente_id || pref.grupo_id || pref.pattern);
  const ultimaPreferenciaValida = preferencias.length === 0 || esPreferenciaCompleta(preferencias[preferencias.length - 1]);
  const puedeGenerarPreferencias = preferenciasCompletas.length > 0 || !hayPreferenciaEnProceso;

  useEffect(() => {
    const toRows = (resp) => {
      const payload = resp?.data?.data ?? resp?.data ?? [];
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.rows)) return payload.rows;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const load = async () => {
      try {
        const [periodosRes, docentesRes, gruposRes] = await Promise.all([
          api.get('/periodos', { params: { activo: true } }),
          api.get('/docentes', { params: { per_page: 100 } }),
          api.get('/grupos', { params: { per_page: 100 } }),
        ]);

        setPeriodos(toRows(periodosRes));
        setDocentes(toRows(docentesRes));
        setGrupos(toRows(gruposRes));
      } catch (err) {
        setError(parseApiError(err));
      }
    };

    load();
  }, []);

  const handleAddRestriccion = () => {
    setRestricciones((prev) => [...prev, emptyRestriccion]);
  };

  const handleAddPreferencia = () => {
    if (!ultimaPreferenciaValida) return;
    setPreferencias((prev) => [...prev, emptyPreferencia]);
  };

  const handlePreferenciaChange = (index, field, value) => {
    const normalized = field === 'pattern' ? (value || '') : value;
    setPreferencias((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: normalized } : item))
    );
  };

  const handleRestriccionChange = (index, field, value) => {
    setRestricciones((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerar = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setConflictosDetalle([]);
    setResultado(null);

    try {
      const payload = {
        periodo_id: Number(periodoId),
        restricciones_docentes: restricciones
          .filter((r) => r.docente_id)
          .map((r) => ({
            docente_id: Number(r.docente_id),
            pisos: r.pisos
              .split(',')
              .map((value) => Number(value.trim()))
              .filter((num) => !Number.isNaN(num)),
          })),
        preferencias: preferenciasCompletas.map((pref) => ({
          docente_id: Number(pref.docente_id),
          grupo_id: Number(pref.grupo_id),
          pattern: (pref.pattern || 'LMV').toUpperCase(),
        })),
      };

      const resp = await api.post('/horarios/generar', payload);
      const data = resp?.data?.data ?? resp?.data;
      setResultado(data);
      setSuccess('Horarios generados exitosamente');
    } catch (err) {
      const parsed = parseApiError(err);
      setConflictosDetalle(Array.isArray(parsed.conflictos) ? parsed.conflictos : []);
      setError(parsed.message || 'No se pudo generar el horario');
    } finally {
      setLoading(false);
    }
  };

  const handleModoChange = (value) => {
    setModo(value);
    setError(null);
    setSuccess(null);
    setResultado(null);
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
      <PageHeader
        title="Generar Horario"
        subtitle="Define preferencias, restricciones y genera los horarios automáticos"
      >
        <button
          type="button"
          onClick={() => navigate('/horarios')}
          className="btn-secondary"
        >
          Volver
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {conflictosDetalle.length > 0 && (
        <div className="section-card">
          <p className="font-semibold text-gray-800">Conflictos detectados</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
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

      <div className="section-card space-y-5">
        <div className="flex flex-wrap gap-3">
          {['automatico', 'manual'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleModoChange(option)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                modo === option
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {option === 'automatico' ? 'Automático' : 'Manual'}
            </button>
          ))}
        </div>

        {modo === 'automatico' && (
          <form onSubmit={handleGenerar} className="space-y-5">
            <div className="filters-card space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Período <span className="text-red-500">*</span>
                </label>
                <select
                  value={periodoId}
                  onChange={(e) => setPeriodoId(e.target.value)}
                  required
                  className="filters-full input"
                >
                  <option value="">Seleccionar período</option>
                  {periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Se generarán horarios automáticos para el período seleccionado.
                </p>
              </div>
            </div>

            <div className="filters-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-0.5">Restricciones docentes</p>
                  <p className="text-xs text-gray-500">Pisos no deseados</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRestriccion}
                  className="action-link"
                >
                  + Agregar restricción
                </button>
              </div>

              <div className="space-y-3">
                {restricciones.map((rest, index) => (
                  <div key={`rest-${index}`} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase text-gray-500">Docente</label>
                      <select
                        className="input"
                        value={rest.docente_id}
                        onChange={(e) => handleRestriccionChange(index, 'docente_id', e.target.value)}
                      >
                        <option value="">Seleccionar docente (opcional)</option>
                        {docentes.map((doc) => {
                          const docId = doc.persona_id ?? doc.id;
                          return (
                            <option key={docId} value={docId}>
                              {doc.persona?.nombre_completo || doc.nombre_completo || `Docente ${docId}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Pisos vetados</label>
                      <input
                        className="input"
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
            </div>

            <div className="filters-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-0.5">Preferencias</p>
                  <p className="text-xs text-gray-500">Docente + Grupo + Patrón</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPreferencia}
                  className={`action-link ${!ultimaPreferenciaValida ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!ultimaPreferenciaValida}
                >
                  + Agregar preferencia
                </button>
              </div>

              <div className="space-y-4">
                {preferencias.map((pref, index) => (
                  <div key={`pref-${index}`} className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-xs uppercase text-gray-500">Docente</label>
                      <select
                        className="input"
                        value={pref.docente_id}
                        onChange={(e) => handlePreferenciaChange(index, 'docente_id', e.target.value)}
                      >
                        <option value="">Seleccionar docente</option>
                        {docentes.map((doc) => {
                          const id = doc.id ?? doc.persona_id;
                          return (
                            <option key={`doc-${id}`} value={id}>
                              {doc.persona?.nombre_completo || doc.codigo_docente || `Docente ${id}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Grupo</label>
                      <select
                        className="input"
                        value={pref.grupo_id}
                        onChange={(e) => handlePreferenciaChange(index, 'grupo_id', e.target.value)}
                      >
                        <option value="">Seleccionar grupo</option>
                        {grupos.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>
                            {grupo.codigo_grupo} — {grupo.materia?.nombre || grupo.materia_nombre || 'Materia'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Patrón</label>
                      <select
                        className="input"
                        value={pref.pattern}
                        onChange={(e) => handlePreferenciaChange(index, 'pattern', e.target.value.toUpperCase())}
                      >
                        <option value="">Seleccionar patrón</option>
                        <option value="LMV">LMV (Lun/Mié/Vie)</option>
                        <option value="MJ">MJ (Mar/Jue)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/horarios')}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !periodoId || !puedeGenerarPreferencias}
                className="btn-primary"
              >
                {loading ? 'Generando...' : 'Generar horarios'}
              </button>
            </div>
          </form>
        )}

        {modo === 'manual' && (
          <div className="filters-card space-y-4">
            <p className="text-base text-gray-700">
              La edición manual permite ajustar bloques ya creados. Recuerda navegar al listado
              de horarios y editar el bloque específico para cambiar docente, aula o modalidad.
            </p>
            <button
              type="button"
              onClick={() => navigate('/horarios')}
              className="btn-secondary"
            >
              Ir a la edición manual
            </button>
          </div>
        )}
      </div>

      {resultado && (
        <div className="section-card">
          <h2 className="text-lg font-semibold text-gray-900">Resumen de la generación</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
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
