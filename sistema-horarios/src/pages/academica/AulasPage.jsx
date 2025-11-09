// src/pages/academica/AulasPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchAulas,
  createAula,
  updateAula,
  deleteAula,
  selectAulas,
  selectAulasLoading,
  selectAulasError,
  selectAulasMeta,
  selectAulasSaving,
  selectAulasSaveError,
  selectAulasDeleteError,
  clearAulasError,
  clearAulasSaveError,
  clearAulasDeleteError,
} from '../../store/slices/aulasSlice.js';

const emptyForm = { nombre: '', capacidad: 1, ubicacion: '', piso: 1 };

export default function AulasPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const items = useSelector(selectAulas);
  const loading = useSelector(selectAulasLoading);
  const error = useSelector(selectAulasError);
  const meta = useSelector(selectAulasMeta);
  const saving = useSelector(selectAulasSaving);
  const saveError = useSelector(selectAulasSaveError);
  const deleteError = useSelector(selectAulasDeleteError);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [q, setQ] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchAulas({ page, per_page: perPage }));
  }, [dispatch, page, perPage]);

  useEffect(() => {
    if (saveError?.message) {
      toast.push(saveError.message, 'error');
    }
  }, [saveError, toast]);

  useEffect(() => {
    if (deleteError?.message) {
      toast.push(deleteError.message, 'error');
      dispatch(clearAulasDeleteError());
    }
  }, [deleteError, dispatch, toast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((row) =>
      [row.codigo_aula, row.ubicacion, row.piso?.toString()].some((field) =>
        field?.toLowerCase().includes(needle)
      )
    );
  }, [q, items]);

  const columns = [
    { header: 'Código', accessor: 'codigo_aula', sortable: true },
    { header: 'Capacidad', accessor: 'capacidad', align: 'center' },
    { header: 'Ubicación', accessor: 'ubicacion' },
    { header: 'Piso', accessor: 'piso', align: 'center' },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    dispatch(clearAulasSaveError());
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nombre: row?.codigo_aula ?? '',
      capacidad: row?.capacidad ?? 1,
      ubicacion: row?.ubicacion ?? '',
      piso: row?.piso ?? 1,
    });
    dispatch(clearAulasSaveError());
    setOpenForm(true);
  };

  const closeForm = () => setOpenForm(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.nombre.trim()) {
      toast.push('El código del aula es obligatorio', 'error');
      return;
    }
    try {
      if (editing) {
        await dispatch(updateAula({ id: editing.id, ...form })).unwrap();
        toast.push('Aula actualizada', 'success');
      } else {
        await dispatch(createAula(form)).unwrap();
        toast.push('Aula creada', 'success');
      }
      setOpenForm(false);
      dispatch(fetchAulas({ page, per_page: perPage }));
    } catch {}
  };

  const requestDelete = (row) => setConfirm({ open: true, row });

  const confirmDelete = async () => {
    const row = confirm.row;
    if (!row) return;
    try {
      await dispatch(deleteAula(row.id)).unwrap();
      toast.push('Aula eliminada', 'success');
      setConfirm({ open: false, row: null });
      dispatch(fetchAulas({ page, per_page: perPage }));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Aulas" subtitle="Controla la disponibilidad de espacios">
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nueva aula
        </button>
      </PageHeader>

      {error && (
        <Alert type="error" message={error} onClose={() => dispatch(clearAulasError())} />
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
        onPerPageChange={(value) => {
          setPerPage(value);
          setPage(1);
        }}
        searchTerm={q}
        onSearchChange={setQ}
        emptyMessage="Aún no se registraron aulas"
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
        title={editing ? 'Editar aula' : 'Nueva aula'}
        onClose={closeForm}
      >
        <form onSubmit={onSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Detalles del aula</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Código / Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="A-201"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Capacidad</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.capacidad}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, capacidad: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="form-field">
                <label>Ubicación</label>
                <input
                  className="input"
                  placeholder="Edificio central"
                  value={form.ubicacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, ubicacion: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>Piso</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.piso}
                  onChange={(e) => setForm((prev) => ({ ...prev, piso: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {saveError?.errors && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded">
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
        title="Eliminar aula"
        message={`¿Deseas eliminar el aula "${confirm.row?.codigo_aula ?? ''}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirm({ open: false, row: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
