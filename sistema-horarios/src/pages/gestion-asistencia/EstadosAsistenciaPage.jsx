import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import estadoAsistenciaService from '../../services/gestion-asistencia/estadoAsistenciaService.js';
import ActivoBadge from '../../components/ActivoBadge.jsx';

const emptyForm = {
  nombre: '',
  descripcion: '',
  cuenta_como_falta: false,
  activo: true,
};

export default function EstadosAsistenciaPage() {
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [successMsg, setSuccessMsg] = useState(null);

  const cargarEstados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await estadoAsistenciaService.getAll({
        page,
        per_page: itemsPerPage,
        activo: activoFilter !== '' ? activoFilter : undefined,
      });
      if (response.success) {
        const payload = response.data;
        const data = payload?.data ?? payload ?? [];
        const lastPage = Math.max(1, payload?.last_page ?? 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        const totalCount = payload?.total ?? data.length;
        setEstados(data);
        setTotalResults(totalCount);
        setTotalPages(lastPage);
        setError(null);
      }
    } catch (err) {
      setError('Error al cargar estados de asistencia');
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, activoFilter]);

  useEffect(() => {
    cargarEstados();
  }, [cargarEstados]);

  const filtered = useMemo(() => {
    if (!search.trim()) return estados;
    const needle = search.toLowerCase();
    return estados.filter((estado) => {
      const nombre = estado.nombre?.toLowerCase() || '';
      const descripcion = estado.descripcion?.toLowerCase() || '';
      return nombre.includes(needle) || descripcion.includes(needle);
    });
  }, [search, estados]);

  const columns = [
    { header: 'Nombre', render: (row) => row.nombre ?? '-' },
    {
      header: 'Descripción',
      render: (row) => row.descripcion || '-',
    },
    {
      header: 'Cuenta como falta',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.cuenta_como_falta
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.cuenta_como_falta ? 'Sí' : 'No'}
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Estado',
      align: 'center',
      render: (row) => (
        <ActivoBadge activo={row.activo} onToggle={() => toggleActivo(row)} />
      ),
    },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (estado) => {
    setEditing(estado);
    setForm({
      nombre: estado.nombre || '',
      descripcion: estado.descripcion || '',
      cuenta_como_falta: estado.cuenta_como_falta !== undefined ? estado.cuenta_como_falta : false,
      activo: estado.activo !== undefined ? estado.activo : true,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = editing
        ? await estadoAsistenciaService.update(editing.id, form)
        : await estadoAsistenciaService.create(form);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(
          editing ? 'Estado actualizado exitosamente' : 'Estado creado exitosamente'
        );
        setOpenForm(false);
        setForm(emptyForm);
        setEditing(null);
        await cargarEstados();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar estado');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (estado) => {
    if (!estado) return;
    setLoading(true);
    setError(null);
    try {
      const isActive = Boolean(estado.activo);
      const payload = { activo: !isActive };

      const response = await estadoAsistenciaService.update(estado.id, payload);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(`Estado ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
        await cargarEstados();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error cambiando el estado');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm.id) return;
    setLoading(true);
    setError(null);
    try {
      await estadoAsistenciaService.remove(confirm.id);
      setSuccessMsg('Estado eliminado exitosamente');
      await cargarEstados();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar estado');
    } finally {
      setLoading(false);
      setConfirm({ open: false, id: null });
    }
  };

  const toolbar = (
    <div className="filters-card">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="filters-full input"
          placeholder="Buscar por nombre o descripción"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filters-full input max-w-[200px]"
          value={activoFilter}
          onChange={(e) => {
            setActivoFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estados de Asistencia"
        subtitle="Gestiona los estados disponibles para registro de asistencia"
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo estado
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        perPage={itemsPerPage}
        total={totalResults}
        onPageChange={setPage}
        searchTerm={search}
        onSearchChange={setSearch}
        toolbar={toolbar}
        emptyMessage="Aún no hay estados registrados"
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

      <Modal
        open={openForm}
        title={editing ? 'Editar estado de asistencia' : 'Nuevo estado de asistencia'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Información del Estado</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Presente, Falta, Justificada"
                  required
                  maxLength={50}
                />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <input
                  type="text"
                  className="input"
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción breve"
                  maxLength={255}
                />
              </div>
              <div className="form-field">
                <label>Configuración</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="cuenta-falta"
                      type="checkbox"
                      checked={form.cuenta_como_falta}
                      onChange={(e) => setForm((prev) => ({ ...prev, cuenta_como_falta: e.target.checked }))}
                    />
                    <label htmlFor="cuenta-falta" className="text-sm text-gray-600">
                      Cuenta como falta
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="estado-activo"
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                    />
                    <label htmlFor="estado-activo" className="text-sm text-gray-600">
                      Estado activo
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar estado"
        message="Esta acción eliminará el estado seleccionado. ¿Continuar?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
