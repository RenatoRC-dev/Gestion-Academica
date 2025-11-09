// src/pages/academica/GruposPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import {
  fetchGrupos,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  selectGrupos,
  selectGruposLoading,
  selectGruposError,
  selectGruposMeta,
  selectGruposSaving,
  selectGruposSaveError,
  selectGruposDeleteError,
  clearGruposError,
  clearGruposSaveError,
  clearGruposDeleteError,
} from '../../store/slices/gruposSlice.js';
import { fetchMaterias, selectMaterias } from '../../store/slices/materiasSlice.js';
import { fetchPeriodos, selectPeriodos } from '../../store/slices/periodosSlice.js';

const emptyForm = { materia_id: '', periodo_id: '', codigo: '', cantidad_maxima: 1 };

export default function GruposPage() {
  const dispatch = useDispatch();
  const toast = useToast();

  const grupos = useSelector(selectGrupos);
  const loading = useSelector(selectGruposLoading);
  const error = useSelector(selectGruposError);
  const meta = useSelector(selectGruposMeta);
  const saving = useSelector(selectGruposSaving);
  const saveError = useSelector(selectGruposSaveError);
  const deleteError = useSelector(selectGruposDeleteError);

  const materias = useSelector(selectMaterias);
  const periodos = useSelector(selectPeriodos);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [q, setQ] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchGrupos({ page, per_page: perPage }));
  }, [dispatch, page, perPage]);

  useEffect(() => {
    if (!materias?.length) {
      dispatch(fetchMaterias({ page: 1 }));
    }
    if (!periodos?.length) {
      dispatch(fetchPeriodos({ page: 1 }));
    }
  }, [dispatch, materias?.length, periodos?.length]);

  useEffect(() => {
    if (saveError?.message) {
      toast.push(saveError.message, 'error');
    }
  }, [saveError, toast]);

  useEffect(() => {
    if (deleteError?.message) {
      toast.push(deleteError.message, 'error');
      dispatch(clearGruposDeleteError());
    }
  }, [deleteError, dispatch, toast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return grupos;
    return grupos.filter((grupo) => {
      const materiaNombre = grupo.materia?.nombre || '';
      const periodoNombre = grupo.periodo?.nombre || grupo.periodo?.codigo || '';
      return (
        grupo.codigo_grupo?.toLowerCase().includes(needle) ||
        materiaNombre.toLowerCase().includes(needle) ||
        periodoNombre.toLowerCase().includes(needle)
      );
    });
  }, [q, grupos]);

  const columns = [
    { header: 'Código', accessor: 'codigo_grupo', sortable: true },
    {
      header: 'Materia',
      render: (row) => row.materia?.nombre ?? row.materia?.codigo_materia ?? '-',
    },
    {
      header: 'Periodo',
      render: (row) => row.periodo?.nombre ?? row.periodo?.codigo ?? '-',
    },
    { header: 'Cupo', accessor: 'cupo_maximo', align: 'center' },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    dispatch(clearGruposSaveError());
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      materia_id: row?.materia_id ?? row?.materia?.id ?? '',
      periodo_id: row?.periodo_academico_id ?? row?.periodo?.id ?? '',
      codigo: row?.codigo_grupo ?? '',
      cantidad_maxima: row?.cupo_maximo ?? 1,
    });
    dispatch(clearGruposSaveError());
    setOpenForm(true);
  };

  const closeForm = () => setOpenForm(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.materia_id || !form.periodo_id || !form.codigo.trim()) {
      toast.push('Materia, periodo y código son obligatorios', 'error');
      return;
    }
    try {
      if (editing) {
        await dispatch(updateGrupo({ id: editing.id, ...form })).unwrap();
        toast.push('Grupo actualizado', 'success');
      } else {
        await dispatch(createGrupo(form)).unwrap();
        toast.push('Grupo creado', 'success');
      }
      setOpenForm(false);
      dispatch(fetchGrupos({ page, per_page: perPage }));
    } catch {}
  };

  const requestDelete = (row) => setConfirm({ open: true, row });

  const confirmDelete = async () => {
    const row = confirm.row;
    if (!row) return;
    try {
      await dispatch(deleteGrupo(row.id)).unwrap();
      toast.push('Grupo eliminado', 'success');
      setConfirm({ open: false, row: null });
      dispatch(fetchGrupos({ page, per_page: perPage }));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Grupos" subtitle="Administra los grupos académicos">
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo grupo
        </button>
      </PageHeader>

      {error && (
        <Alert type="error" message={error} onClose={() => dispatch(clearGruposError())} />
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
        emptyMessage="No hay grupos registrados"
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
        title={editing ? 'Editar grupo' : 'Nuevo grupo'}
        onClose={closeForm}
      >
        <form onSubmit={onSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Asignación</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Materia <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.materia_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, materia_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.codigo_materia} - {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>
                  Periodo <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.periodo_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, periodo_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un periodo</option>
                  {periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.nombre ?? periodo.codigo ?? `Periodo ${periodo.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <p className="form-section-title">Datos del grupo</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Código de grupo <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="GRP-01"
                  value={form.codigo}
                  onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Cupo máximo</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.cantidad_maxima}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cantidad_maxima: Number(e.target.value) }))
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
        title="Eliminar grupo"
        message={`¿Deseas eliminar el grupo "${confirm.row?.codigo_grupo ?? ''}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirm({ open: false, row: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
