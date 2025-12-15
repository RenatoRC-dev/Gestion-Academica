import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Alert from '../../components/Alert.jsx';
import ActivoBadge from '../../components/ActivoBadge.jsx';
import bloqueService from '../../services/gestion-horarios/bloqueService.js';
import api from '../../services/api.js';

const emptyForm = { dia_id: '', horario_id: '', activo: true };

export default function BloquesPage() {
  const [bloques, setBloques] = useState([]);
  const [dias, setDias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [successMsg, setSuccessMsg] = useState(null);

  const cargarBloques = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/bloques-horarios', {
        params: { page, per_page: itemsPerPage },
      });
      if (response.data.success) {
        const payload = response.data.data;
        const data = payload?.data ?? payload ?? [];
        setBloques(data);
        const lastPage = Math.max(1, payload?.last_page ?? 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        const totalCount = payload?.total ?? data.length;
        setBloques(data);
        setTotalResults(totalCount);
        setTotalPages(lastPage);
        setError(null);
      }
    } catch (err) {
      setError('Error al cargar bloques horarios');
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  const cargarCatalogos = async () => {
    try {
      const [resDias, resHorarios] = await Promise.all([api.get('/dias'), api.get('/horarios-franja')]);
      if (resDias.data.success) setDias(resDias.data.data || []);
      if (resHorarios.data.success) setHorarios(resHorarios.data.data || []);
    } catch {
      // ignorar
    }
  };

  useEffect(() => {
    cargarBloques();
  }, [cargarBloques]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return bloques;
    const needle = search.toLowerCase();
    return bloques.filter((bloque) => {
      const dia = bloque.dia?.nombre?.toLowerCase() || '';
      const horario = `${bloque.horario?.hora_inicio || ''} ${bloque.horario?.hora_fin || ''}`.toLowerCase();
      return dia.includes(needle) || horario.includes(needle);
    });
  }, [search, bloques]);

const columns = [
    { header: 'Día', render: (row) => row.dia?.nombre ?? '-' },
    {
      header: 'Horario',
      render: (row) =>
        row.horario ? `${row.horario.hora_inicio} - ${row.horario.hora_fin}` : '-',
    },
    {
      header: 'Activo',
      render: (row) => (
        <ActivoBadge activo={row.activo} onToggle={() => toggleActivo(row)} disabled={loading} />
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
      const response = editing
        ? await bloqueService.update(editing.id, form)
        : await bloqueService.create(form);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(editing ? 'Bloque horario actualizado exitosamente' : 'Bloque horario creado exitosamente');
        setOpenForm(false);
        setForm(emptyForm);
        setEditing(null);
        await cargarBloques();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar bloque horario');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (bloque) => {
    if (!bloque) return;
    setLoading(true);
    setError(null);
    try {
      // ✅ CORRECCIÓN: Enviar boolean en lugar de 0/1
      const isActive = Boolean(bloque.activo);
      const payload = { activo: !isActive };

      const response = await bloqueService.update(bloque.id, payload);

      if (response?.success || response?.data?.success) {
        setSuccessMsg(`Bloque horario ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
        await cargarBloques();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error cambiando el estado del bloque');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm.id) return;
    setLoading(true);
    setError(null);
    try {
      await bloqueService.remove(confirm.id);
      setSuccessMsg('Bloque horario eliminado exitosamente');
      await cargarBloques();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar bloque horario');
    } finally {
      setLoading(false);
      setConfirm({ open: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bloques horarios" subtitle="Define la disponibilidad de franjas">
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo bloque
        </button>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        perPage={itemsPerPage}
        total={totalResults}
        onPageChange={setPage}
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
