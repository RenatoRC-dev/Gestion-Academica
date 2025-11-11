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
  codigo_docente: '',
  areas: [],
};

function DocentesPage() {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocente, setCurrentDocente] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState(emptyForm);
  const [areasOptions, setAreasOptions] = useState([]);

  useEffect(() => {
    fetchDocentes();
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchAreasOptions();
  }, []);

  const fetchAreasOptions = async () => {
    try {
      const response = await api.get('/areas-academicas', {
        params: { per_page: 100, activo: true },
      });
      const payload = response.data?.data || {};
      const options = Array.isArray(payload.data) ? payload.data : [];
      setAreasOptions(options);
    } catch (err) {
      console.error('Error cargando áreas académicas:', err);
    }
  };

  const fetchDocentes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/docentes', {
        params: { page: currentPage, per_page: perPage },
      });

      const payload = response.data?.data || {};
      setDocentes(Array.isArray(payload.data) ? payload.data : []);
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
    setCurrentDocente(null);
    setFormData(emptyForm);
    setValidationErrors({});
    setModalOpen(true);
  };

  const toggleAreaSelection = (areaId) => {
    setFormData((prev) => {
      const current = prev.areas ?? [];
      const next = current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId];
      return { ...prev, areas: next };
    });
  };

  const handleEdit = (docente) => {
    setIsEditing(true);
    setCurrentDocente(docente);
    setFormData({
      nombre_completo: docente.persona?.nombre_completo || '',
      email: docente.persona?.usuario?.email || '',
      ci: docente.persona?.ci || '',
      telefono_contacto: docente.persona?.telefono_contacto || '',
      direccion: docente.persona?.direccion || '',
      codigo_docente: docente.codigo_docente || '',
      areas: (docente.areas ?? []).map((area) => area.id),
    });
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (personaId) => {
    const confirmed = window.confirm('¿Deseas eliminar al docente seleccionado?');
    if (!confirmed) return;

    try {
      await api.delete(`/docentes/${personaId}`);
      fetchDocentes();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationErrors({});
    setError(null);

    try {
      if (isEditing && currentDocente) {
        await api.put(`/docentes/${currentDocente.persona_id}`, formData);
      } else {
        await api.post('/docentes', formData);
      }

      setModalOpen(false);
      fetchDocentes();
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response?.data?.errors || {});
      } else {
        setError(parseApiError(err));
      }
    }
  };

  const columns = [
    { header: 'Código', accessor: 'codigo_docente', sortable: true },
    { header: 'Nombre completo', accessor: 'persona.nombre_completo', sortable: true },
    { header: 'Correo institucional', accessor: 'persona.usuario.email' },
    { header: 'CI', accessor: 'persona.ci' },
    { header: 'Teléfono', accessor: 'persona.telefono_contacto' },
    {
      header: 'Áreas',
      render: (row) => {
        if (!row.areas || row.areas.length === 0) {
          return '-';
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.areas.map((area) => (
              <span key={area.id} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {area.nombre}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  const filteredDocentes = searchTerm
    ? docentes.filter((docente) => {
        const needle = searchTerm.trim().toLowerCase();
        return (
          docente.persona?.nombre_completo?.toLowerCase().includes(needle) ||
          docente.codigo_docente?.toLowerCase().includes(needle) ||
          docente.persona?.usuario?.email?.toLowerCase().includes(needle)
        );
      })
    : docentes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Docentes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona la información de los docentes registrados
          </p>
        </div>
        <button type="button" onClick={handleCreate} className="btn-primary">
          + Nuevo docente
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={filteredDocentes}
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
        emptyMessage="Aún no hay docentes registrados"
        actions={(row) => (
          <>
            <button type="button" className="table-action-button" onClick={() => handleEdit(row)}>
              Editar
            </button>
            <button
              type="button"
              className="table-action-button danger"
              onClick={() => handleDelete(row.persona_id)}
            >
              Eliminar
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={isEditing ? 'Editar docente' : 'Nuevo docente'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Información del docente</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="tel"
                  placeholder="María Pérez"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre_completo: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.nombre_completo} />
              </div>

              <div className="form-field">
                <label>
                  CI <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="12345678"
                  value={formData.ci}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ci: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.ci} />
              </div>

              <div className="form-field">
                <label>
                  Código docente <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="DOC101"
                  value={formData.codigo_docente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo_docente: e.target.value }))
                  }
                  required
                />
                <FieldErrorList errors={validationErrors.codigo_docente} />
              </div>

              <div className="form-field">
                <label>Teléfono</label>
                <input
                  className="input"
                  type="text"
                  placeholder="+591 70000000"
                  value={formData.telefono_contacto}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefono_contacto: e.target.value }))
                  }
                />
                <FieldErrorList errors={validationErrors.telefono_contacto} />
              </div>

              <div className="form-field form-field-full">
                <label>Dirección</label>
                <textarea
                  className="input"
                  rows="2"
                  placeholder="Av. Siempre Viva 123"
                  value={formData.direccion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
                />
                <FieldErrorList errors={validationErrors.direccion} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <p className="form-section-title">Credenciales de acceso</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Correo institucional <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="docente@gestion.edu"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <FieldErrorList errors={validationErrors.email} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <p className="form-section-title">Áreas académicas</p>
            <div className="grid grid-cols-2 gap-2">
              {areasOptions.length === 0 && (
                <p className="text-sm text-gray-500 col-span-2">Aún no hay áreas registradas</p>
              )}
              {areasOptions.map((area) => (
                <label
                  key={area.id}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={formData.areas?.includes(area.id)}
                    onChange={() => toggleAreaSelection(area.id)}
                  />
                  <span>{area.nombre}</span>
                </label>
              ))}
            </div>
            <FieldErrorList errors={validationErrors.areas} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Actualizar docente' : 'Crear docente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DocentesPage;
