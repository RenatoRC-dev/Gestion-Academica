import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Modal from '../../components/Modal.jsx';
import Alert from '../../components/Alert.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import DataTable from '../../components/DataTable.jsx';
import asistenciaService from '../../services/asistenciaService.js';
import api from '../../services/api.js';

const emptyForm = {
  horario_asignado_id: '',
  docente_id: '',
  estado_id: '',
  fecha_hora_registro: '',
  observaciones: '',
};

export default function RegistrarAsistenciaPage() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Catálogos
  const [periodos, setPeriodos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estados, setEstados] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({
    periodo_id: '',
    grupo_id: '',
    materia_id: '',
    docente_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado_id: '',
  });

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 15;

  // Modal
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Confirm Dialog
  const [confirm, setConfirm] = useState({ open: false, id: null });

  // Cargar catálogos
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [resPeriodos, resGrupos, resMaterias, resDocentes, resEstados] = await Promise.all([
        api.get('/periodos'),
        api.get('/grupos'),
        api.get('/materias'),
        api.get('/docentes'),
        api.get('/estados-asistencia'),
      ]);

      if (resPeriodos.data.success) {
        const data = resPeriodos.data.data?.data || resPeriodos.data.data || [];
        setPeriodos(data);
      }
      if (resGrupos.data.success) {
        const data = resGrupos.data.data?.data || resGrupos.data.data || [];
        setGrupos(data);
      }
      if (resMaterias.data.success) {
        const data = resMaterias.data.data?.data || resMaterias.data.data || [];
        setMaterias(data);
      }
      if (resDocentes.data.success) {
        const data = resDocentes.data.data?.data || resDocentes.data.data || [];
        setDocentes(data);
      }
      if (resEstados.data.success) {
        const data = resEstados.data.data?.data || resEstados.data.data || [];
        setEstados(data.filter((e) => e.activo));
      }
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  // Cargar asistencias con filtros
  const cargarAsistencias = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: itemsPerPage,
        ...filters,
      };

      const response = await asistenciaService.listarAsistencias(params);
      setAsistencias(response.rows);
      setTotalPages(response.meta.last_page);
      setTotalResults(response.meta.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar asistencias');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    cargarAsistencias();
  }, [cargarAsistencias]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

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

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      fecha_hora_registro: new Date().toISOString().slice(0, 16),
    });
    setOpenForm(true);
  };

  const openEdit = (asistencia) => {
    setEditing(asistencia);
    setForm({
      horario_asignado_id: asistencia.horario_asignado_id || '',
      docente_id: asistencia.docente_id || '',
      estado_id: asistencia.estado_id || '',
      fecha_hora_registro: asistencia.fecha_hora_registro
        ? new Date(asistencia.fecha_hora_registro).toISOString().slice(0, 16)
        : '',
      observaciones: asistencia.observaciones || '',
    });
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = editing
        ? {
            estado_id: form.estado_id,
            observaciones: form.observaciones,
          }
        : form;

      const response = editing
        ? await asistenciaService.update(editing.id, payload)
        : await asistenciaService.create(payload);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(
          editing
            ? 'Asistencia actualizada exitosamente'
            : 'Asistencia registrada exitosamente'
        );
        setOpenForm(false);
        setForm(emptyForm);
        setEditing(null);
        await cargarAsistencias();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al guardar asistencia';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm.id) return;
    setLoading(true);
    setError(null);
    try {
      await asistenciaService.remove(confirm.id);
      setSuccessMsg('Asistencia eliminada exitosamente');
      await cargarAsistencias();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar asistencia');
    } finally {
      setLoading(false);
      setConfirm({ open: false, id: null });
    }
  };

  // Obtener fecha actual para validaciones
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Asistencia Manual"
        subtitle="Gestiona manualmente los registros de asistencia docente"
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nueva asistencia
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Periodo</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <label className="text-xs uppercase tracking-wide text-gray-500">Grupo</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
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

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Materia</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <label className="text-xs uppercase tracking-wide text-gray-500">Docente</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={filters.docente_id}
              onChange={(e) => handleFilterChange('docente_id', e.target.value)}
            >
              <option value="">Todos</option>
              {docentes.map((d) => (
                <option key={d.persona_id} value={d.persona_id}>
                    {d.persona?.nombre_completo || '-'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Estado</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <label className="text-xs uppercase tracking-wide text-gray-500">Fecha inicio</label>
            <input
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Fecha fin</label>
            <input
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={asistencias}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        perPage={itemsPerPage}
        total={totalResults}
        onPageChange={setPage}
        emptyMessage="No hay asistencias registradas con estos filtros"
        actions={(row) => (
          <>
            <button type="button" className="table-action-button" onClick={() => openEdit(row)}>
              Editar
            </button>
            <button
              type="button"
              className="table-action-button danger"
              onClick={() => setConfirm({ open: true, id: row.id })}
            >
              Eliminar
            </button>
          </>
        )}
      />

      {/* Modal Formulario */}
      <Modal
        open={openForm}
        title={editing ? 'Editar asistencia' : 'Registrar nueva asistencia'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">
              {editing ? 'Modificar datos de asistencia' : 'Datos de la asistencia'}
            </p>
            <div className="form-grid">
              {!editing && (
                <>
                  <div className="form-field">
                    <label>
                      Docente <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.docente_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, docente_id: e.target.value }))}
                      required
                    >
                      <option value="">Seleccionar docente</option>
                      {docentes.map((d) => (
                        <option key={d.persona_id} value={d.persona_id}>
                      {d.persona?.nombre_completo || '-'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Horario Asignado <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.horario_asignado_id}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, horario_asignado_id: e.target.value }))
                      }
                      required
                    >
                      <option value="">Seleccionar horario</option>
                      {/* Se puede cargar dinámicamente según filtros */}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Use los filtros arriba para buscar el horario específico
                    </p>
                  </div>

                  <div className="form-field">
                    <label>
                      Fecha y Hora <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={form.fecha_hora_registro}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, fecha_hora_registro: e.target.value }))
                      }
                      max={today}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-field">
                <label>
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.estado_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, estado_id: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar estado</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field col-span-full">
                <label>Observaciones</label>
                <textarea
                  className="input"
                  value={form.observaciones}
                  onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  placeholder="Información adicional sobre esta asistencia..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {editing ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title="Eliminar asistencia"
        message="Esta acción eliminará el registro de asistencia seleccionado. ¿Continuar?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
