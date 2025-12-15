import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
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
    console.log('➕ ABRIENDO CREACIÓN de nueva área');
    setIsEditing(false);
    setCurrentArea(null);
    setFormData(emptyForm);
    setValidationErrors({});
    setModalOpen(true);
    console.log('✅ Estado actualizado - isEditing:', false, 'currentArea:', null);
  };

  const handleEdit = (area) => {
    console.log('📝 ABRIENDO EDICIÓN de área:', area);
    setIsEditing(true);
    setCurrentArea(area);
    setFormData({
      nombre: area.nombre ?? '',
      descripcion: area.descripcion ?? '',
      activo: area.activo ?? true,
    });
    setValidationErrors({});
    setModalOpen(true);
    console.log('✅ Estado actualizado - isEditing:', true, 'currentArea:', area, 'formData:', {
      nombre: area.nombre,
      descripcion: area.descripcion,
      activo: area.activo,
    });
  };

  const handleDelete = async (area) => {
    const confirmed = window.confirm(`¿Deseas eliminar el área "${area.nombre}"?`);
    if (!confirmed) return;

    try {
      console.log('🗑️ ELIMINANDO área ID:', area.id);
      const response = await api.delete(`/areas-administrativas/${area.id}`);
      console.log('✅ Respuesta delete:', response.data);
      setSuccess('Área administrativa eliminada correctamente');

      // Forzar recarga de la lista
      setLoading(true);
      await fetchAreas();
    } catch (err) {
      console.error('❌ Error al eliminar:', err.response?.data || err.message);
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
        console.log('🔄 ACTUALIZANDO área ID:', currentArea.id, 'con datos:', formData);
        await api.put(`/areas-administrativas/${currentArea.id}`, formData);
        setSuccess('Área administrativa actualizada correctamente');
      } else {
        console.log('✨ CREANDO nueva área con datos:', formData);
        await api.post('/areas-administrativas', formData);
        setSuccess('Área administrativa creada correctamente');
      }
      handleCloseModal();
      await fetchAreas();
    } catch (err) {
      console.error('❌ Error en submit:', err.response?.data || err.message);
      if (err.response?.status === 422) {
        setValidationErrors(err.response?.data?.errors || {});
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setSaving(false);
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {row.activo ? 'Sí' : 'No'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Áreas Administrativas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra y gestiona las áreas administrativas de la institución
          </p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          + Nueva área
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage="Aún no hay áreas administrativas registradas"
        actions={(row) => (
          <>
            <button type="button" className="table-action-button" onClick={() => handleEdit(row)}>
              Editar
            </button>
            <button
              type="button"
              className="table-action-button danger"
              onClick={() => handleDelete(row)}
            >
              Eliminar
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={isEditing ? `Editar área administrativa (ID: ${currentArea?.id})` : 'Nueva área administrativa'}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          {/* Debug info */}
          <div style={{ padding: '0.5rem', background: '#f0f0f0', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1rem' }}>
            <div>🔍 DEBUG: isEditing = {String(isEditing)}</div>
            <div>🔍 DEBUG: currentArea.id = {currentArea?.id || 'null'}</div>
            <div>🔍 DEBUG: formData = {JSON.stringify(formData)}</div>
          </div>

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
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={formData.activo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
                />
                <span className="ml-2">Área activa</span>
              </label>
            </div>
            <FieldErrorList errors={validationErrors.activo} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : (isEditing ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
