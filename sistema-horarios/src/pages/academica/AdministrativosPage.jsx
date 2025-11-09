import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

const emptyForm = {
  nombre_completo: '',
  email: '',
  ci: '',
  telefono_contacto: '',
  direccion: '',
  cargo: '',
  area_administrativa_id: '',
};

export default function AdministrativosPage() {
  const [administrativos, setAdministrativos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchAdministrativos();
  }, [currentPage, perPage]);

  const fetchAdministrativos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/administrativos', {
        params: { page: currentPage, per_page: perPage },
      });
      const payload = response.data?.data || {};
      setAdministrativos(Array.isArray(payload.data) ? payload.data : []);
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
    setCurrentItem(null);
    setFormData(emptyForm);
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setFormData({
      nombre_completo: item.persona?.nombre_completo ?? '',
      email: item.persona?.usuario?.email ?? '',
      ci: item.persona?.ci ?? '',
      telefono_contacto: item.persona?.telefono_contacto ?? '',
      direccion: item.persona?.direccion ?? '',
      cargo: item.cargo ?? '',
      area_administrativa_id: item.area_administrativa_id ?? '',
    });
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm('¿Deseas eliminar al administrativo seleccionado?');
    if (!confirmed) return;

    try {
      await api.delete(`/administrativos/${item.persona_id}`);
      fetchAdministrativos();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationErrors({});
    setError(null);

    try {
      if (isEditing && currentItem) {
        await api.put(`/administrativos/${currentItem.persona_id}`, formData);
      } else {
        await api.post('/administrativos', formData);
      }
      setModalOpen(false);
      fetchAdministrativos();
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response?.data?.errors || {});
      } else {
        setError(parseApiError(err));
      }
    }
  };

  const columns = [
    { header: 'Cargo', accessor: 'cargo', sortable: true },
    { header: 'Nombre', accessor: 'persona.nombre_completo', sortable: true },
    { header: 'Correo', accessor: 'persona.usuario.email' },
    { header: 'CI', accessor: 'persona.ci' },
    { header: 'Teléfono', accessor: 'persona.telefono_contacto' },
    {
      header: 'Área',
      accessor: 'areaAdministrativa.nombre',
      render: (row) => row.areaAdministrativa?.nombre ?? '-',
    },
  ];

  const filtered = searchTerm
    ? administrativos.filter((item) => {
        const needle = searchTerm.trim().toLowerCase();
        return (
          item.persona?.nombre_completo?.toLowerCase().includes(needle) ||
          item.persona?.ci?.toLowerCase().includes(needle) ||
          item.persona?.usuario?.email?.toLowerCase().includes(needle) ||
          item.cargo?.toLowerCase().includes(needle)
        );
      })
    : administrativos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrativos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona a los administrativos y sus datos de contacto
          </p>
        </div>
        <button type="button" onClick={handleCreate} className="btn-primary">
          + Nuevo administrativo
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={filtered}
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
        emptyMessage="Aún no hay administrativos registrados"
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
        title={isEditing ? 'Editar administrativo' : 'Nuevo administrativo'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Información principal</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre_completo: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.nombre_completo} />
              </div>
              <div className="form-field">
                <label>
                  Correo institucional <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.email} />
              </div>
              <div className="form-field">
                <label>
                  CI <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={formData.ci}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ci: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.ci} />
              </div>
              <div className="form-field">
                <label>Cargo</label>
                <input
                  className="input"
                  value={formData.cargo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cargo: e.target.value }))}
                />
                <FieldErrorList errors={validationErrors.cargo} />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input
                  className="input"
                  value={formData.telefono_contacto}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefono_contacto: e.target.value }))
                  }
                />
              </div>
              <div className="form-field">
                <label>Dirección</label>
                <textarea
                  className="input"
                  rows="2"
                  value={formData.direccion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>Área administrativa (ID)</label>
                <input
                  className="input"
                  type="number"
                  value={formData.area_administrativa_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      area_administrativa_id: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                  placeholder="Opcional"
                />
                <FieldErrorList errors={validationErrors.area_administrativa_id} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
