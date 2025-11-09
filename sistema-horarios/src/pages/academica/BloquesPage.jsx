import React, { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import bloqueService from '../../services/bloqueService.js';
import api from '../../services/api.js';

const emptyForm = { dia_id: '', horario_id: '', activo: true };

export default function BloquesPage() {
  const [bloques, setBloques] = useState([]);
  const [dias, setDias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    cargarBloques();
    cargarCatalogos();
  }, []);

  const cargarBloques = async () => {
    setLoading(true);
    try {
    const response = await api.get('/bloques-horarios', { params: { per_page: 100 } });
      if (response.data.success) {
        setBloques(response.data.data.data || response.data.data || []);
      }
      setError(null);
    } catch (err) {
      setError('Error al cargar bloques horarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [resDias, resHorarios] = await Promise.all([api.get('/dias'), api.get('/horarios-franja')]);
      if (resDias.data.success) setDias(resDias.data.data || []);
      if (resHorarios.data.success) setHorarios(resHorarios.data.data || []);
    } catch {
      // ignorar
    }
  };

  const filtered = bloques.filter((bloque) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    const dia = bloque.dia?.nombre?.toLowerCase() || '';
    const horario = `${bloque.horario?.hora_inicio || ''} ${bloque.horario?.hora_fin || ''}`.toLowerCase();
    return dia.includes(needle) || horario.includes(needle);
  });

  const columns = [
    { header: 'Día', render: (row) => row.dia?.nombre ?? '-' },
    {
      header: 'Horario',
      render: (row) =>
        row.horario ? `${row.horario.hora_inicio} - ${row.horario.hora_fin}` : '-',
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (bloque) => {
    setEditing(bloque);
    setForm({
      dia_id: bloque.dia_id || '',
      horario_id: bloque.horario_id || '',
      activo: bloque.activo !== undefined ? bloque.activo : true,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editing) {
        await bloqueService.update(editing.id, form);
      } else {
        await bloqueService.create(form);
      }
      setOpenForm(false);
      setForm(emptyForm);
      cargarBloques();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar bloque horario');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm.id) return;
    setLoading(true);
    try {
      await bloqueService.remove(confirm.id);
      cargarBloques();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar bloque horario');
    } finally {
      setLoading(false);
      setConfirm({ open: false, id: null });
    }
  };

  const perPage = filtered.length || 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Bloques horarios" subtitle="Define la disponibilidad de franjas">
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo bloque
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={1}
        totalPages={1}
        perPage={perPage}
        total={filtered.length}
        onPageChange={() => {}}
        onPerPageChange={null}
        searchTerm={search}
        onSearchChange={setSearch}
        emptyMessage="Aún no hay bloques horarios registrados"
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
        title={editing ? 'Editar bloque horario' : 'Nuevo bloque horario'}
        onClose={() => setOpenForm(false)}
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-section">
            <p className="form-section-title">Asignación</p>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Día <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.dia_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, dia_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un día</option>
                  {dias.map((dia) => (
                    <option key={dia.id} value={dia.id}>
                      {dia.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>
                  Horario <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.horario_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, horario_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un horario</option>
                  {horarios.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hora_inicio} - {h.hora_fin}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Estado</label>
                <div className="flex items-center gap-2">
                  <input
                    id="bloque-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  <label htmlFor="bloque-activo" className="text-sm text-gray-600">
                    Bloque activo
                  </label>
                </div>
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
        title="Eliminar bloque"
        message="Esta acción eliminará el bloque seleccionado. ¿Continuar?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
