// src/pages/academica/PeriodosPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchPeriodos,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
  selectPeriodos,
  selectPeriodosLoading,
  selectPeriodosError,
  selectPeriodosPagination,
} from '../../store/slices/periodosSlice.js';

const emptyForm = { id: null, nombre: '', fecha_inicio: '', fecha_fin: '', activo: true };

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value.slice(0, 10);
  return date.toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function PeriodosPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const periodos = useSelector(selectPeriodos);
  const loading = useSelector(selectPeriodosLoading);
  const error = useSelector(selectPeriodosError);
  const pagination = useSelector(selectPeriodosPagination);
  const { creating, updating, deleting } = useSelector((state) => state.periodos);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [openForm, setOpenForm] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const isEditing = form.id !== null;

  useEffect(() => {
    dispatch(fetchPeriodos({ page }));
  }, [dispatch, page]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return periodos;
    return periodos.filter((periodo) =>
      [periodo.nombre, periodo.fecha_inicio, periodo.fecha_fin]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }, [search, periodos]);

  const columns = [
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    { header: 'Inicio', render: (row) => formatDate(row.fecha_inicio) },
    { header: 'Fin', render: (row) => formatDate(row.fecha_fin) },
    {
      header: 'Estado',
      render: (row) => (
        <span className={row.activo ? 'text-green-600 font-semibold' : 'text-gray-500'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setForm(emptyForm);
    setOpenForm(true);
  };

  const handleEdit = (row) => {
    setForm({
      id: row.id,
      nombre: row.nombre || '',
      fecha_inicio: (row.fecha_inicio || '').slice(0, 10),
      fecha_fin: (row.fecha_fin || '').slice(0, 10),
      activo: !!row.activo,
    });
    setOpenForm(true);
  };

  const handleDelete = (row) => setConfirm({ open: true, id: row.id });

  const submitDelete = async () => {
    const id = confirm.id;
    if (!id) return;
    const res = await dispatch(deletePeriodo(id));
    if (!res.error) {
      toast.push('Período eliminado', 'success');
    }
    setConfirm({ open: false, id: null });
  };

  const validateForm = () => {
    if (!form.nombre?.trim()) {
      toast.push('El nombre del período es obligatorio', 'error');
      return false;
    }
    if (!form.fecha_inicio || !form.fecha_fin) {
      toast.push('Debes definir las fechas de inicio y fin', 'error');
      return false;
    }
    const start = new Date(form.fecha_inicio);
    const end = new Date(form.fecha_fin);
    if (start > end) {
      toast.push('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      nombre: form.nombre.trim(),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      activo: !!form.activo,
    };

    if (isEditing) {
      const res = await dispatch(updatePeriodo({ id: form.id, changes: payload }));
      if (!res.error) {
        toast.push('Período actualizado', 'success');
        setOpenForm(false);
        setForm(emptyForm);
      }
    } else {
      const res = await dispatch(createPeriodo(payload));
      if (!res.error) {
        toast.push('Período creado', 'success');
        setOpenForm(false);
        setForm(emptyForm);
      }
    }
  };

  const perPage = pagination?.per_page || 15;

  return (
    <div className="space-y-6">
      <PageHeader title="Períodos académicos" subtitle="Gestiona ciclos y fechas clave">
        <button type="button" className="btn-primary" onClick={handleCreate}>
          + Nuevo período
        </button>
      </PageHeader>

      {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={pagination?.current_page || page}
        totalPages={pagination?.last_page || 1}
        perPage={perPage}
        total={pagination?.total ?? filtered.length}
        onPageChange={setPage}
        onPerPageChange={null}
        searchTerm={search}
        onSearchChange={setSearch}
        emptyMessage="No hay períodos registrados"
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
        open={openForm}
        title={isEditing ? 'Editar período' : 'Nuevo período'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Datos del período</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="2025 - Semestre I"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>
                  Fecha de inicio <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>
                  Fecha de fin <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <div className="flex items-center gap-2">
                  <input
                    id="periodo-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  <label htmlFor="periodo-activo" className="text-sm text-gray-600">
                    Activo para asignaciones
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpenForm(false)}
              disabled={creating || updating}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={creating || updating}>
              {creating || updating ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar período"
        message="¿Deseas eliminar este período? Esta acción no se puede deshacer."
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={submitDelete}
      />
    </div>
  );
}
