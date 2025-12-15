import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../services/api.js';
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

export default function AreasAdministrativasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, [currentPage, perPage, searchTerm]);

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/areas-administrativas', {
        params: { page: currentPage, per_page: perPage, search: searchTerm },
      });
      const payload = response.data?.data || {};
      setAreas(Array.isArray(payload.data) ? payload.data : []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.last_page ?? 1);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentArea(null);
    setFormData(emptyForm);
    setValidationErrors({});
    setModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const handleEdit = (area) => {
    setIsEditing(true);
    setCurrentArea(area);
    setFormData({
      nombre: area.nombre ?? '',
      descripcion: area.descripcion ?? '',
      activo: area.activo ?? true,
    });
    setValidationErrors({});
    setModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async (area) => {
    const confirmed = window.confirm(`¿Deseas eliminar el área "${area.nombre}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/areas-administrativas/${area.id}`);
      setSuccess('Área administrativa eliminada correctamente');
      fetchAreas();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setCurrentArea(null);
    setFormData(emptyForm);
    setValidationErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setValidationErrors({});
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && currentArea && currentArea.id) {
        await api.put(`/areas-administrativas/${currentArea.id}`, formData);
        setSuccess('Área administrativa actualizada correctamente');
      } else {
        await api.post('/areas-administrativas', formData);
        setSuccess('Área administrativa creada correctamente');
      }
      handleCloseModal();
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

  const handleToggleActivo = async (area) => {
    if (!area) return;
    setLoading(true);
    setError(null);
    try {
      await api.put(`/areas-administrativas/${area.id}`, { activo: !area.activo });
      setSuccess(`Área administrativa ${area.activo ? 'desactivada' : 'activada'} correctamente`);
      await fetchAreas();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    { header: 'Descripción', accessor: 'descripcion', render: (row) => row.descripcion || '-' },
    {
      header: 'Usuarios',
      accessor: 'administrativos_count',
      render: (row) => row.administrativos_count ?? 0,
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
    <div className="filters-card">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          className="filters-full input"
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áreas administrativas"
        subtitle="Registra y gestiona las áreas administrativas de la institución"
      >
        <button type="button" className="btn-primary" onClick={handleCreate}>
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
        searchTerm={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        emptyMessage="Aún no hay áreas administrativas registradas"
        actions={(row) => (
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="action-link" onClick={() => handleEdit(row)}>
              Editar
            </button>
            <button type="button" className="action-link red" onClick={() => handleDelete(row)}>
              Eliminar
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        title={isEditing ? `Editar área administrativa (ID: ${currentArea?.id})` : 'Nueva área administrativa'}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-section">
            <p className="form-section-title">Información principal</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.nombre} />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="input"
                  rows="2"
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
                <FieldErrorList errors={validationErrors.descripcion} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-field flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={formData.activo}
                onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
              />
              <span className="ml-3">Área activa</span>
            </div>
            <FieldErrorList errors={validationErrors.activo} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
