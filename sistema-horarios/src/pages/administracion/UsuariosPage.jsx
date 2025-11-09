// src/pages/administracion/UsuariosPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  selectUsuarios,
  selectUsuariosLoading,
  selectUsuariosError,
  selectUsuariosMeta,
  selectUsuariosSaving,
  selectUsuariosSaveError,
  selectUsuariosDeleting,
  selectUsuariosDeleteError,
  selectUsuariosPasswordTemp,
  clearUsuariosError,
  clearUsuariosSaveError,
  clearUsuariosDeleteError,
  clearUsuariosPasswordTemp,
} from '../../store/slices/usuariosSlice.js';
import UserRolesPanel from '../../components/UserRolesPanel.jsx';

const emptyForm = { nombre_completo: '', email: '', activo: true };

export default function UsuariosPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const usuarios = useSelector(selectUsuarios);
  const loading = useSelector(selectUsuariosLoading);
  const error = useSelector(selectUsuariosError);
  const meta = useSelector(selectUsuariosMeta);
  const saving = useSelector(selectUsuariosSaving);
  const saveError = useSelector(selectUsuariosSaveError);
  const deleting = useSelector(selectUsuariosDeleting);
  const deleteError = useSelector(selectUsuariosDeleteError);
  const passwordTemp = useSelector(selectUsuariosPasswordTemp);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, target: null });
  const [rolesOpen, setRolesOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsuarios({ page }));
  }, [dispatch, page]);

  useEffect(() => {
    if (saveError?.message) {
      toast.push(saveError.message, 'error');
    }
  }, [saveError, toast]);

  useEffect(() => {
    if (deleteError?.message) {
      toast.push(deleteError.message, 'error');
      dispatch(clearUsuariosDeleteError());
    }
  }, [deleteError, dispatch, toast]);

  useEffect(() => {
    if (passwordTemp) {
      toast.push(`Usuario creado. Contraseña temporal: ${passwordTemp}`, 'success');
      dispatch(clearUsuariosPasswordTemp());
    }
  }, [passwordTemp, dispatch, toast]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return usuarios;
    return usuarios.filter((user) =>
      [user.nombre_completo, user.email, user.roles?.map((r) => r.nombre).join(', ')]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }, [search, usuarios]);

  const perPage = meta?.per_page || 15;

  const columns = [
    { header: 'Nombre', accessor: 'nombre_completo', sortable: true },
    { header: 'Correo', accessor: 'email' },
    {
      header: 'Roles',
      render: (row) =>
        Array.isArray(row.roles) && row.roles.length > 0
          ? row.roles.map((r) => r.nombre).join(', ')
          : 'Sin roles',
    },
    {
      header: 'Estado',
      render: (row) => (
        <span className={row.activo ? 'text-green-600 font-semibold' : 'text-gray-500'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
      align: 'center',
    },
  ];

  const handleCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    dispatch(clearUsuariosSaveError());
    setOpenForm(true);
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      nombre_completo: row?.nombre_completo || '',
      email: row?.email || '',
      activo: !!row?.activo,
    });
    dispatch(clearUsuariosSaveError());
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.nombre_completo.trim() || !form.email.trim()) {
      toast.push('Nombre y correo son obligatorios', 'error');
      return;
    }

    try {
      if (editing) {
        await dispatch(updateUsuario({ id: editing.id, ...form })).unwrap();
        toast.push('Usuario actualizado', 'success');
      } else {
        await dispatch(createUsuario(form)).unwrap();
      }
      setOpenForm(false);
      setForm(emptyForm);
    } catch {}
  };

  const handleRoles = (user) => {
    setTargetUser(user);
    setRolesOpen(true);
  };

  const requestDelete = (user) => setConfirm({ open: true, target: user });

  const confirmDelete = async () => {
    const user = confirm.target;
    if (!user) return;
    try {
      await dispatch(deleteUsuario(user.id)).unwrap();
      toast.push('Usuario eliminado', 'success');
      setConfirm({ open: false, target: null });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" subtitle="Gestiona cuentas y permisos">
        <button type="button" className="btn-primary" onClick={handleCreate}>
          + Nuevo usuario
        </button>
      </PageHeader>

      {error && (
        <Alert type="error" message={error} onClose={() => dispatch(clearUsuariosError())} />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={meta?.page || page}
        totalPages={meta?.last_page || 1}
        perPage={perPage}
        total={meta?.total ?? filtered.length}
        onPageChange={setPage}
        onPerPageChange={null}
        searchTerm={search}
        onSearchChange={setSearch}
        emptyMessage="No hay usuarios registrados"
        actions={(row) => (
          <>
            <button type="button" className="table-action-button" onClick={() => handleRoles(row)}>
              Roles
            </button>
            <button type="button" className="table-action-button" onClick={() => handleEdit(row)}>
              Editar
            </button>
            <button
              type="button"
              className="table-action-button danger"
              onClick={() => requestDelete(row)}
            >
              Eliminar
            </button>
          </>
        )}
      />

      <Modal
        open={openForm}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Datos principales</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="María Pérez"
                  value={form.nombre_completo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label>
                  Correo institucional <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="usuario@gestion.edu"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <div className="flex items-center gap-2">
                  <input
                    id="usuario-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  <label htmlFor="usuario-activo" className="text-sm text-gray-600">
                    Usuario activo
                  </label>
                </div>
              </div>
            </div>
          </div>

          {saveError?.errors && (
            <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded">
              {Object.entries(saveError.errors).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpenForm(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {rolesOpen && targetUser && (
        <UserRolesPanel open={rolesOpen} onClose={() => setRolesOpen(false)} user={targetUser} />
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar usuario"
        message={`¿Deseas eliminar a "${confirm.target?.nombre_completo ?? confirm.target?.email ?? ''}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onCancel={() => setConfirm({ open: false, target: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
