import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  selectRoles,
  selectRolesLoading,
  selectRolesError,
  selectRolesMeta,
  selectRolesSaving,
  selectRolesSaveError,
  selectRolesDeleteError,
  clearRolesError,
  clearRolesSaveError,
} from '../../store/slices/gestion-usuarios/rolesSlice.js';

const emptyForm = { nombre: '', descripcion: '' };

export default function RolesPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const roles = useSelector(selectRoles);
  const loading = useSelector(selectRolesLoading);
  const error = useSelector(selectRolesError);
  const meta = useSelector(selectRolesMeta);
  const saving = useSelector(selectRolesSaving);
  const saveError = useSelector(selectRolesSaveError);
  const deleteError = useSelector(selectRolesDeleteError);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    dispatch(fetchRoles({ page }));
  }, [dispatch, page]);

  useEffect(() => {
    if (error) {
      toast.push(error, 'error');
      dispatch(clearRolesError());
    }
  }, [error, toast, dispatch]);

  useEffect(() => {
    if (saveError?.message) {
      toast.push(saveError.message, 'error');
    }
  }, [saveError, toast]);

  useEffect(() => {
    if (deleteError?.message) {
      toast.push(deleteError.message, 'error');
    }
  }, [deleteError, toast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter((role) =>
      [role.nombre, role.descripcion]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }, [q, roles]);

  const columns = [
    { header: 'ID', accessor: 'id', align: 'center' },
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    { header: 'Descripción', accessor: 'descripcion' },
  ];

  const openModal = (role = null) => {
    setEditing(role);
    setForm({
      nombre: role?.nombre ?? '',
      descripcion: role?.descripcion ?? '',
    });
    dispatch(clearRolesSaveError());
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        await dispatch(updateRole({ id: editing.id, ...form })).unwrap();
        toast.push('Rol actualizado', 'success');
      } else {
        await dispatch(createRole(form)).unwrap();
        toast.push('Rol creado', 'success');
      }
      setModalOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm.id) return;
    try {
      await dispatch(deleteRole(confirm.id)).unwrap();
      toast.push('Rol eliminado', 'success');
    } catch {}
    setConfirm({ open: false, id: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona el catálogo de roles del sistema</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => openModal(null)}>
          + Nuevo rol
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <input
            className="input max-w-sm"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-sm text-gray-500">
            {meta?.total ? `Mostrando ${filtered.length} de ${meta.total}` : 'Paginación del servidor'}
          </span>
        </div>

        {error && <Alert type="error" message={error} onClose={() => dispatch(clearRolesError())} />}

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          currentPage={meta?.current_page || page}
          totalPages={meta?.last_page || 1}
          perPage={meta?.per_page || 15}
          total={meta?.total || filtered.length}
          onPageChange={(next) => setPage(next)}
          onPerPageChange={null}
          searchTerm={q}
          onSearchChange={setQ}
          emptyMessage="No hay roles registrados"
          actions={(row) => (
            <>
              <button type="button" className="table-action-button" onClick={() => openModal(row)}>
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
      </div>

      <Modal open={modalOpen} title={editing ? 'Editar rol' : 'Nuevo rol'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Detalles</p>
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
                <FieldErrorList errors={saveError?.errors?.nombre} />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  className="input"
                  rows="2"
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
                <FieldErrorList errors={saveError?.errors?.descripcion} />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar rol"
        message="¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer."
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
