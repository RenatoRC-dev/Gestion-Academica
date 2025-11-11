import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import estadoAsistenciaService from '../../services/estadoAsistenciaService.js';

const emptyForm = {
  nombre: '',
  descripcion: '',
  color: '#10B981',
  cuenta_como_falta: false,
  orden: 0,
  activo: true,
};

export default function EstadosAsistenciaPage() {
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
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
  }, [page, itemsPerPage]);

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
      header: 'Color',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: row.color || '#10B981',
              border: '1px solid #D1D5DB',
            }}
          />
          <span className="text-sm text-gray-600">{row.color || '#10B981'}</span>
        </div>
      ),
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
      header: 'Orden',
      render: (row) => row.orden ?? 0,
      align: 'center',
    },
    {
      header: 'Estado',
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleActivo(row)}
          aria-pressed={row.activo}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid #CBD5F5',
            backgroundColor: row.activo ? '#059669' : '#DC2626',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {row.activo ? 'Activo' : 'Desactivado'}
        </button>
      ),
      align: 'center',
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
      color: estado.color || '#10B981',
      cuenta_como_falta: estado.cuenta_como_falta !== undefined ? estado.cuenta_como_falta : false,
      orden: estado.orden ?? 0,
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
                <label>
                  Color <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="#10B981"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Orden</label>
                <input
                  type="number"
                  className="input"
                  value={form.orden}
                  onChange={(e) => setForm((prev) => ({ ...prev, orden: parseInt(e.target.value) || 0 }))}
                  min={0}
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
