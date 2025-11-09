// src/pages/academica/MateriasPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
  selectMaterias,
  selectMateriasLoading,
  selectMateriasError,
  selectMateriasMeta,
  selectMateriasSaving,
  selectMateriasSaveError,
  selectMateriasDeleteError,
  clearMateriasError,
  clearMateriasSaveError,
  clearMateriasDeleteError,
} from '../../store/slices/materiasSlice.js';

const emptyForm = { codigo: '', nombre: '', creditos: 1, horas_teoricas: 0 };

export default function MateriasPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const items = useSelector(selectMaterias);
  const loading = useSelector(selectMateriasLoading);
  const error = useSelector(selectMateriasError);
  const meta = useSelector(selectMateriasMeta);
  const saving = useSelector(selectMateriasSaving);
  const saveError = useSelector(selectMateriasSaveError);
  const deleteError = useSelector(selectMateriasDeleteError);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [q, setQ] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchMaterias({ page, per_page: perPage }));
  }, [dispatch, page, perPage]);

  useEffect(() => {
    if (saveError?.message) {
      toast.push(saveError.message, 'error');
    }
  }, [saveError, toast]);

  useEffect(() => {
    if (deleteError?.message) {
      toast.push(deleteError.message, 'error');
      dispatch(clearMateriasDeleteError());
    }
  }, [deleteError, dispatch, toast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) =>
      [it.codigo_materia, it.nombre].some((field) => field?.toLowerCase().includes(needle))
    );
  }, [q, items]);

  const columns = [
    { header: 'Código', accessor: 'codigo_materia', sortable: true },
    { header: 'Nombre', accessor: 'nombre', sortable: true },
    { header: 'Créditos', accessor: 'creditos', align: 'center' },
    { header: 'Horas teóricas', accessor: 'horas_teoricas', align: 'center' },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    dispatch(clearMateriasSaveError());
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      codigo: row?.codigo_materia ?? '',
      nombre: row?.nombre ?? '',
      creditos: row?.creditos ?? 1,
      horas_teoricas: row?.horas_teoricas ?? 0,
    });
    dispatch(clearMateriasSaveError());
    setOpenForm(true);
  };

  const closeForm = () => setOpenForm(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.codigo.trim()) {
      toast.push('Nombre y código son obligatorios', 'error');
      return;
    }
    try {
      if (editing) {
        await dispatch(updateMateria({ id: editing.id, ...form })).unwrap();
        toast.push('Materia actualizada', 'success');
      } else {
        await dispatch(createMateria(form)).unwrap();
        toast.push('Materia creada', 'success');
      }
      setOpenForm(false);
      dispatch(fetchMaterias({ page, per_page: perPage }));
    } catch {}
  };

  const requestDelete = (row) => setConfirm({ open: true, row });

  const confirmDelete = async () => {
    const row = confirm.row;
    if (!row) return;
    try {
      await dispatch(deleteMateria(row.id)).unwrap();
      toast.push('Materia eliminada', 'success');
      setConfirm({ open: false, row: null });
      dispatch(fetchMaterias({ page, per_page: perPage }));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Materias" subtitle="Gestiona el catálogo de materias">
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nueva materia
        </button>
      </PageHeader>

      {error && (
        <Alert type="error" message={error} onClose={() => dispatch(clearMateriasError())} />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={meta?.current_page || page}
        totalPages={meta?.last_page || 1}
        perPage={perPage}
        total={meta?.total ?? filtered.length}
        onPageChange={setPage}
        onPerPageChange={(value) => {
          setPerPage(value);
          setPage(1);
        }}
        searchTerm={q}
        onSearchChange={setQ}
        emptyMessage="No hay materias registradas"
        actions={(row) => (
          <>
            <button type="button" className="table-action-button" onClick={() => openEdit(row)}>
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
        title={editing ? 'Editar materia' : 'Nueva materia'}
        onClose={closeForm}
      >
        <form onSubmit={onSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Datos de la materia</p>
          <div className="form-grid">
            <div className="form-field">
              <label>
                Código <span className="text-red-500">*</span>
              </label>
                <input
                  className="input"
                  placeholder="MAT101"
                  value={form.codigo}
                  onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Matemáticas I"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Créditos</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.creditos}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, creditos: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="form-field">
                <label>Horas teóricas</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.horas_teoricas}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, horas_teoricas: Number(e.target.value) }))
                  }
                />
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
            <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar materia"
        message={`¿Deseas eliminar la materia "${confirm.row?.nombre ?? confirm.row?.codigo_materia ?? ''}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirm({ open: false, row: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
