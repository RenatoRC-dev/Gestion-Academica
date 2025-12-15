import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../components/PageHeader.jsx';
import Modal from '../../components/Modal.jsx';
import Alert from '../../components/Alert.jsx';
import DataTable from '../../components/DataTable.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ActivoBadge from '../../components/ActivoBadge.jsx';
import {
  fetchTiposAula,
  selectTiposAula,
  selectTiposAulaLoading,
  selectTiposAulaPagination,
  selectTiposAulaError,
  createTipoAula,
  updateTipoAula,
  deleteTipoAula,
} from '../../store/slices/gestion-academica/tipoAulaSlice.js';

const emptyForm = {
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function TiposAulaPage() {
  const dispatch = useDispatch();
  const tipos = useSelector(selectTiposAula);
  const loading = useSelector(selectTiposAulaLoading);
  const pagination = useSelector(selectTiposAulaPagination);
  const error = useSelector(selectTiposAulaError);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ activo: '' });
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    dispatch(fetchTiposAula({
      page,
      per_page: pagination.per_page || 15,
      activo: filters.activo === '' ? undefined : filters.activo === 'true',
    }));
  }, [dispatch, page, filters, pagination.per_page]);

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Descripción', accessor: 'descripcion' },
    {
      header: 'Activo',
      align: 'center',
      render: (row) => (
        <ActivoBadge activo={row.activo} onToggle={() => handleToggleActivo(row)} />
      ),
    },
  ];

  const handleToggleActivo = async (tipo) => {
    await dispatch(updateTipoAula({ id: tipo.id, changes: { activo: !tipo.activo } })).unwrap();
    setSuccessMsg(`Tipo de aula ${tipo.nombre} ${tipo.activo ? 'desactivado' : 'activado'}`);
    dispatch(fetchTiposAula({ page, per_page: pagination.per_page || 15 }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (tipo) => {
    setEditing(tipo);
    setForm({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      activo: tipo.activo,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        await dispatch(updateTipoAula({ id: editing.id, changes: form })).unwrap();
        setSuccessMsg('Tipo de aula actualizado correctamente');
      } else {
        await dispatch(createTipoAula(form)).unwrap();
        setSuccessMsg('Tipo de aula creado correctamente');
      }
      setOpenForm(false);
      dispatch(fetchTiposAula({ page, per_page: pagination.per_page || 15 }));
    } catch (err) {
      // errors handled through slice
    }
  };

  const handleDelete = async () => {
    if (!confirm.id) return;
    try {
      await dispatch(deleteTipoAula(confirm.id)).unwrap();
      setSuccessMsg('Tipo de aula eliminado correctamente');
      dispatch(fetchTiposAula({ page, per_page: pagination.per_page || 15 }));
    } catch (err) {
      // handled via slice
    } finally {
      setConfirm({ open: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de aula"
        subtitle="Gestiona las clasificaciones que utilizan las aulas"
      >
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo tipo
        </button>
      </PageHeader>

      {(error || successMsg) && (
        <div className="space-y-2">
          {error && <Alert type="error" message={error} />}
          {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}
        </div>
      )}

      <div className="filters-card">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            className="filters-full input"
            placeholder="Filtrar por nombre"
            value={filters.nombre || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, nombre: e.target.value }))}
          />
          <select
            className="filters-full input max-w-[200px]"
            value={filters.activo}
            onChange={(e) => setFilters((prev) => ({ ...prev, activo: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tipos}
        loading={loading}
        currentPage={page}
        totalPages={pagination.last_page || 1}
        perPage={pagination.per_page || 15}
        total={pagination.total || tipos.length}
        onPageChange={setPage}
        toolbar={null}
        emptyMessage="Aún no hay tipos de aula configurados"
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
        title={editing ? 'Editar tipo de aula' : 'Nuevo tipo de aula'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Información principal</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>
              <div className="form-field flex items-center gap-3">
                <input
                  id="tipo-activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                />
                <label htmlFor="tipo-activo">Tipo activo</label>
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
        title="Eliminar tipo de aula"
        message="Esta acción eliminará el tipo de aula seleccionado. ¿Continuar?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
