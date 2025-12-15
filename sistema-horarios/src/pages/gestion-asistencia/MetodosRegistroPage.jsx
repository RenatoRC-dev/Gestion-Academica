import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import metodoRegistroService from '../../services/gestion-asistencia/metodoRegistroService.js';

export default function MetodosRegistroPage() {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', activo: true });
  const [successMsg, setSuccessMsg] = useState(null);

  const cargarMetodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await metodoRegistroService.getAll({
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
        setMetodos(data);
        setTotalResults(totalCount);
        setTotalPages(lastPage);
        setError(null);
      }
    } catch (err) {
      setError('Error al cargar métodos de registro');
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  useEffect(() => {
    cargarMetodos();
  }, [cargarMetodos]);

  const filtered = useMemo(() => {
    if (!search.trim()) return metodos;
    const needle = search.toLowerCase();
    return metodos.filter((metodo) => {
      const nombre = metodo.nombre?.toLowerCase() || '';
      const descripcion = metodo.descripcion?.toLowerCase() || '';
      return nombre.includes(needle) || descripcion.includes(needle);
    });
  }, [search, metodos]);

  const columns = [
    { header: 'Nombre', render: (row) => row.nombre ?? '-' },
    {
      header: 'Descripción',
      render: (row) => row.descripcion || '-',
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

  const openEdit = (metodo) => {
    setEditing(metodo);
    setForm({
      nombre: metodo.nombre || '',
      descripcion: metodo.descripcion || '',
      activo: metodo.activo !== undefined ? metodo.activo : true,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await metodoRegistroService.update(editing.id, form);

      if (response?.success || response?.data?.success) {
        setSuccessMsg('Método actualizado exitosamente');
        setOpenForm(false);
        setForm({ nombre: '', descripcion: '', activo: true });
        setEditing(null);
        await cargarMetodos();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar método');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (metodo) => {
    if (!metodo) return;
    setLoading(true);
    setError(null);
    try {
      const isActive = Boolean(metodo.activo);
      const payload = { activo: !isActive };

      const response = await metodoRegistroService.update(metodo.id, payload);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(`Método ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
        await cargarMetodos();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error cambiando el estado del método');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métodos de Registro"
        subtitle="Gestiona los métodos disponibles para registro de asistencia"
      />

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

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
        emptyMessage="Aún no hay métodos registrados"
        actions={(row) => (
          <button type="button" className="table-action-button" onClick={() => openEdit(row)}>
            Editar
          </button>
        )}
      />

      <Modal
        open={openForm}
        title="Editar método de registro"
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Información del Método</p>
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
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="input"
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  maxLength={255}
                />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <div className="flex items-center gap-2">
                  <input
                    id="metodo-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  <label htmlFor="metodo-activo" className="text-sm text-gray-600">
                    Método activo
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Actualizar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
