import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import asistenciaService from '../../services/gestion-asistencia/asistenciaService.js';
import reporteService from '../../services/reportes/reporteService.js';
import estadoAsistenciaService from '../../services/gestion-asistencia/estadoAsistenciaService.js';
import metodoRegistroService from '../../services/gestion-asistencia/metodoRegistroService.js';
import docenteService from '../../services/gestion-academica/docenteService.js';
import api from '../../services/api.js';

const columns = [
  {
    header: 'Fecha',
    render: (row) => {
      const fecha = new Date(row.fecha_hora_registro);
      return fecha.toLocaleDateString('es-BO');
    },
  },
  {
    header: 'Hora',
    render: (row) => {
      const fecha = new Date(row.fecha_hora_registro);
      return fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    },
  },
  {
    header: 'Materia',
    render: (row) => row.horario_asignado?.grupo?.materia?.nombre || '-',
  },
  {
    header: 'Grupo',
    render: (row) =>
      row.horario_asignado?.grupo?.codigo_grupo ||
      row.horario_asignado?.grupo?.nombre ||
      '-',
  },
  {
    header: 'Estado',
    render: (row) => {
      const estado = row.estado;
      return (
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            backgroundColor: estado?.color || '#10B981',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {estado?.nombre || 'N/A'}
        </span>
      );
    },
    align: 'center',
  },
  {
    header: 'Método',
    render: (row) => row.metodo_registro?.nombre || '-',
  },
];

const emptyFilters = {
  periodo_id: '',
  grupo_id: '',
  materia_id: '',
  estado_id: '',
  metodo_registro_id: '',
  fecha_inicio: '',
  fecha_fin: '',
};

const itemsPerPage = 15;

export default function MiHistorialAsistenciaPage() {
  const [docente, setDocente] = useState(null);
  const [docenteLoading, setDocenteLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);
  const [asistencias, setAsistencias] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: itemsPerPage,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [metodos, setMetodos] = useState([]);

  const fetchDocente = useCallback(async () => {
    setDocenteLoading(true);
    try {
      const response = await docenteService.getCurrent();
      if (response.success) {
        setDocente(response.data);
        setError(null);
      } else {
        setError(response.message || 'No se pudo cargar tu perfil docente');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar tu perfil docente');
    } finally {
      setDocenteLoading(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    setCatalogsLoading(true);
    try {
      const [periodosResp, gruposResp, materiasResp] = await Promise.all([
        api.get('/periodos'),
        api.get('/grupos'),
        api.get('/materias'),
      ]);

      const toArray = (resp) => {
        const payload = resp?.data?.data ?? resp?.data ?? [];
        return Array.isArray(payload?.data) ? payload.data : payload;
      };

      setPeriodos(toArray(periodosResp));
      setGrupos(toArray(gruposResp));
      setMaterias(toArray(materiasResp));

      const estadosResp = await estadoAsistenciaService.getAll({ per_page: 100 });
      setEstados(Array.isArray(estadosResp.data?.data) ? estadosResp.data.data : []);

      const metodosResp = await metodoRegistroService.getAll({ per_page: 100 });
      setMetodos(Array.isArray(metodosResp.data?.data) ? metodosResp.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogsLoading(false);
    }
  }, []);

  const fetchAsistencias = useCallback(async () => {
    if (!docente?.persona_id) return;
    setLoading(true);
    try {
      const params = {
        page,
        per_page: itemsPerPage,
        docente_id: docente.persona_id,
        ...filters,
      };
      const { rows, meta: paged } = await asistenciaService.listarAsistencias(params);
      setAsistencias(rows);
      setMeta(paged);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar las asistencias');
    } finally {
      setLoading(false);
    }
  }, [filters, page, docente]);

  const fetchStats = useCallback(async () => {
    if (!docente?.persona_id) return;
    try {
      const response = await reporteService.generar({
        docente_id: docente.persona_id,
        ...filters,
      });
      if (response.success) {
        setStats(response.data?.estadisticas ?? null);
        setStatsError(null);
      } else {
        setStats(null);
        setStatsError(response.message || 'No se pudo generar el resumen');
      }
    } catch (err) {
      setStats(null);
      setStatsError('Error al calcular el resumen');
    }
  }, [docente, filters]);

  useEffect(() => {
    fetchDocente();
    cargarCatalogos();
  }, [fetchDocente, cargarCatalogos]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const summary = useMemo(() => {
    if (!stats) return null;
    return [
      { label: 'Total clases', value: stats.total_clases ?? 0 },
      { label: 'Presentes', value: stats.presentes ?? 0 },
      { label: 'Faltas', value: stats.faltas ?? 0 },
      { label: 'Justificadas', value: stats.justificadas ?? 0 },
      { label: '% Asistencia', value: `${stats.porcentaje_asistencia ?? 0}%` },
    ];
  }, [stats]);

  if (docenteLoading || catalogsLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Cargando tus datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi historial de asistencia"
        subtitle="Consulta tus registros personales y revisa las estadísticas por filtro"
      />

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <label className="text-xs font-semibold uppercase text-gray-500">Periodo</label>
          <select
            className="input"
            value={filters.periodo_id}
            onChange={(e) => handleFilterChange('periodo_id', e.target.value)}
          >
            <option value="">Todos</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold uppercase text-gray-500">Materia</label>
          <select
            className="input"
            value={filters.materia_id}
            onChange={(e) => handleFilterChange('materia_id', e.target.value)}
          >
            <option value="">Todas</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold uppercase text-gray-500">Grupo</label>
          <select
            className="input"
            value={filters.grupo_id}
            onChange={(e) => handleFilterChange('grupo_id', e.target.value)}
          >
            <option value="">Todos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.codigo_grupo || g.nombre || 'Grupo'}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs uppercase font-semibold text-gray-500">Desde</label>
              <input
                type="date"
                className="input"
                value={filters.fecha_inicio}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-gray-500">Hasta</label>
              <input
                type="date"
                className="input"
                value={filters.fecha_fin}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs uppercase font-semibold text-gray-500">Estado</label>
              <select
                className="input"
                value={filters.estado_id}
                onChange={(e) => handleFilterChange('estado_id', e.target.value)}
              >
                <option value="">Todos</option>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs uppercase font-semibold text-gray-500">Método</label>
              <select
                className="input"
                value={filters.metodo_registro_id}
                onChange={(e) => handleFilterChange('metodo_registro_id', e.target.value)}
              >
                <option value="">Todos</option>
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {statsError && <Alert type="warn" message={statsError} onClose={() => setStatsError(null)} />}

      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          {summary.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 text-center"
            >
              <div className="text-xs uppercase text-gray-500">{item.label}</div>
              <div className="text-2xl font-semibold mt-2 text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={asistencias}
        loading={loading}
        currentPage={meta.current_page}
        totalPages={meta.last_page}
        perPage={meta.per_page}
        total={meta.total}
        onPageChange={setPage}
        toolbar={null}
        searchTerm=""
        emptyMessage="No hay asistencias registradas con este filtro"
      />
    </div>
  );
}
