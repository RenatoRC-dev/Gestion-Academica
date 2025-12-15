import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import areasAcademicasService from '../../services/gestion-academica/areasAcademicasService.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import ActivoBadge from '../../components/ActivoBadge.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

const emptyForm = {
  nombre: '',
  descripcion: '',
  activo: true,
};

function AreasAcademicasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', activo: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, [currentPage, perPage, filters.search, filters.activo]);

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);

    try {
      const activoParam = filters.activo === '' ? undefined : filters.activo === 'true';
      const { rows, meta } = await areasAcademicasService.listar({
        page: currentPage,
        per_page: perPage,
        search: filters.search.trim(),
        activo: activoParam,
      });
      setAreas(rows);
      setTotal(meta.total);
      setTotalPages(meta.last_page);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (area = null) => {
    setCurrentArea(area);
    setIsEditing(Boolean(area));
    setFormData(area ? {
      nombre: area.nombre ?? '',
      descripcion: area.descripcion ?? '',
      activo: area.activo ?? true,
    } : emptyForm);
    setValidationErrors({});
    setModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setValidationErrors({});
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && currentArea) {
        await areasAcademicasService.actualizar(currentArea.id, formData);
        setSuccess('Área académica actualizada correctamente');
      } else {
        await areasAcademicasService.crear(formData);
        setSuccess('Área académica creada correctamente');
      }
      setModalOpen(false);
      fetchAreas();
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response?.data?.errors || {});
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (area) => {
    if (!window.confirm('¿Eliminar esta área académica?')) return;
    try {
      await areasAcademicasService.eliminar(area.id);
      setSuccess('Área eliminada correctamente');
      fetchAreas();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleToggleActivo = async (area) => {
    if (!area) return;
    setLoading(true);
    setError(null);
    try {
      await areasAcademicasService.actualizar(area.id, { activo: !area.activo });
      setSuccess(`Área académica ${area.activo ? 'desactivada' : 'activada'} correctamente`);
      await fetchAreas();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    {
      header: 'Descripción',
      render: (row) => row.descripcion || '-',
    },
    {
      header: 'Docentes',
      render: (row) => (row.docentes_count ?? 0),
    },
    {
      header: 'Activo',
      render: (row) => (
        <ActivoBadge activo={row.activo} onToggle={() => handleToggleActivo(row)} disabled={loading} />
      ),
      align: 'center',
    },
  ];

  const toolbar = (
    <div className="filters-card space-y-3">
      <div className="flex flex-wrap gap-3">
        <input
          className="filters-full input"
          placeholder="Buscar por nombre"
          value={filters.search}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, search: e.target.value }));
            setCurrentPage(1);
          }}
        />
        <select
          className="filters-full input"
          value={filters.activo}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, activo: e.target.value }));
            setCurrentPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áreas académicas"
        subtitle="Registra y gestiona las áreas asociadas a los docentes"
      >
        <button type="button" className="btn-primary" onClick={() => handleOpenModal()}>
          + Nueva área
        </button>
      </PageHeader>

      {(error || success) && (
        <div className="space-y-2">
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        </div>
      )}

      <DataTable
        columns={columns}
        data={areas}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        total={total}
        onPageChange={setCurrentPage}
        onPerPageChange={(value) => {
          setPerPage(value);
          setCurrentPage(1);
        }}
        toolbar={toolbar}
        searchTerm={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        emptyMessage="No hay áreas académicas registradas"
        actions={(row) => (
          <div className="flex gap-2 flex-wrap">
            <button className="action-link" onClick={() => handleOpenModal(row)}>
              Editar
            </button>
            <button className="action-link" onClick={() => handleToggleActivo(row)}>
              {row.activo ? 'Desactivar' : 'Activar'}
            </button>
            <button className="action-link red" onClick={() => handleDelete(row)}>
              Eliminar
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        title={isEditing ? 'Editar área académica' : 'Nueva área académica'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
            <FieldErrorList errors={validationErrors.nombre} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
            <FieldErrorList errors={validationErrors.descripcion} />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="activo"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={formData.activo}
              onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Área activa
            </label>
          </div>

          <FieldErrorList errors={validationErrors.activo} />

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AreasAcademicasPage;
