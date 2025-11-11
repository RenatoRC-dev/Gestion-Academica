import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import asistenciaService from '../../services/asistenciaService.js';
import reporteService from '../../services/reporteService.js';
import estadoAsistenciaService from '../../services/estadoAsistenciaService.js';
import metodoRegistroService from '../../services/metodoRegistroService.js';
import docenteService from '../../services/docenteService.js';
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
    header: 'Docente',
    render: (row) => {
      const persona = row.docente?.persona;
      return persona?.nombre_completo || '-';
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
  docente_id: '',
  periodo_id: '',
  grupo_id: '',
  materia_id: '',
  estado_id: '',
  metodo_registro_id: '',
  fecha_inicio: '',
  fecha_fin: '',
};

const itemsPerPage = 15;

export default function HistorialAsistenciaPage() {
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
  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [resumenError, setResumenError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [metodos, setMetodos] = useState([]);

  const fetchCatalogos = useCallback(async () => {
    try {
      const [docentesResp, periodosResp, gruposResp, materiasResp] = await Promise.all([
        docenteService.getDocentes({ per_page: 200 }),
        api.get('/periodos'),
        api.get('/grupos'),
        api.get('/materias'),
      ]);

      const toArray = (resp) => {
        const payload = resp?.data?.data ?? resp?.data ?? [];
        return Array.isArray(payload?.data) ? payload.data : payload;
      };

      setDocentes(toArray(docentesResp));
      setPeriodos(toArray(periodosResp));
      setGrupos(toArray(gruposResp));
      setMaterias(toArray(materiasResp));

      const estadosResp = await estadoAsistenciaService.getAll({ per_page: 100 });
      setEstados(Array.isArray(estadosResp.data?.data) ? estadosResp.data.data : []);

      const metodosResp = await metodoRegistroService.getAll({ per_page: 100 });
      setMetodos(Array.isArray(metodosResp.data?.data) ? metodosResp.data.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: itemsPerPage,
        ...filters,
      };
      const { rows, meta: paged } = await asistenciaService.listarAsistencias(params);
      setAsistencias(rows);
      setMeta(paged);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar el historial de asistencias');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const generateResumen = async () => {
    setResumenLoading(true);
    try {
      const response = await reporteService.generar(filters);
      if (response.success) {
        setResumen(response.data);
        setResumenError(null);
      } else {
        setResumen(null);
        setResumenError(response.message || 'No se pudo generar el resumen');
      }
    } catch (err) {
      setResumen(null);
      setResumenError('Error al generar el resumen');
    } finally {
      setResumenLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    setResumenError(null);
    try {
      let blob;
      if (format === 'pdf') {
        blob = await reporteService.exportarPDF(filters);
      } else {
        blob = await reporteService.exportarExcel(filters);
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `reporte_asistencias_${ext}_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudo exportar el reporte';
      setResumenError(message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const summary = useMemo(() => {
    if (!resumen?.estadisticas) return null;
    const stats = resumen.estadisticas;
    return [
      { label: 'Total clases', value: stats.total_clases ?? 0 },
      { label: 'Presentes', value: stats.presentes ?? 0 },
      { label: 'Faltas', value: stats.faltas ?? 0 },
      { label: 'Justificadas', value: stats.justificadas ?? 0 },
      { label: '% Asistencia', value: `${stats.porcentaje_asistencia ?? 0}%` },
    ];
  }, [resumen]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial general de asistencias"
        subtitle="Filtra y descarga el registro de todos los docentes"
      />

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {resumenError && <Alert type="warn" message={resumenError} onClose={() => setResumenError(null)} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-gray-500">Docente</label>
              <select
                className="input"
                value={filters.docente_id}
                onChange={(e) => handleFilterChange('docente_id', e.target.value)}
              >
                <option value="">Todos</option>
                {docentes.map((doc) => (
                  <option key={doc.persona_id} value={doc.persona_id}>
                    {doc.persona?.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-gray-500">Periodo</label>
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
            </div>
            <div>
              <label className="text-xs uppercase text-gray-500">Materia</label>
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
            </div>
            <div>
              <label className="text-xs uppercase text-gray-500">Grupo</label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase text-gray-500">Estado</label>
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
            <div>
              <label className="text-xs uppercase text-gray-500">Método</label>
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
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs uppercase text-gray-500">Desde</label>
                <input
                  type="date"
                  className="input"
                  value={filters.fecha_inicio}
                  onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase text-gray-500">Hasta</label>
                <input
                  type="date"
                  className="input"
                  value={filters.fecha_fin}
                  onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3">
          <button
            onClick={generateResumen}
            disabled={resumenLoading}
            className="btn-primary"
          >
            {resumenLoading ? 'Generando resumen…' : 'Generar resumen'}
          </button>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="btn-secondary"
            >
              {exporting ? 'Exportando PDF…' : 'Exportar PDF'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="btn-secondary"
            >
              {exporting ? 'Exportando Excel…' : 'Exportar Excel'}
            </button>
          </div>
        </div>
      </div>

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
        emptyMessage="No hay asistencias para los filtros aplicados"
      />
    </div>
  );
}
