import { useEffect, useState } from 'react';
import bloqueService from '../../services/bloqueService.js';
import api from '../../services/api.js';

function BloquesPage() {
    const [bloques, setBloques] = useState([]);
    const [dias, setDias] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        dia_id: '',
        horario_id: '',
        activo: true
    });

    useEffect(() => {
        cargarBloques();
        cargarCatalogos();
    }, []);

    const cargarBloques = async () => {
        setLoading(true);
        try {
            const response = await api.get('/bloques-horarios');
            if (response.data.success) {
                setBloques(response.data.data.data || response.data.data || []);
            }
        } catch (err) {
            setError('Error al cargar bloques horarios');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cargarCatalogos = async () => {
        try {
            const [resDias, resHorarios] = await Promise.all([
                api.get('/dias'),
                api.get('/horarios-franja')
            ]);

            if (resDias.data.success) {
                setDias(resDias.data.data || []);
            }
            if (resHorarios.data.success) {
                setHorarios(resHorarios.data.data || []);
            }
        } catch (err) {
            console.error('Error al cargar catálogos:', err);
        }
    };

    const abrirModal = (bloque = null) => {
        if (bloque) {
            setEditando(bloque);
            setFormData({
                dia_id: bloque.dia_id || '',
                horario_id: bloque.horario_id || '',
                activo: bloque.activo !== undefined ? bloque.activo : true
            });
        } else {
            setEditando(null);
            setFormData({
                dia_id: '',
                horario_id: '',
                activo: true
            });
        }
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditando(null);
        setFormData({
            dia_id: '',
            horario_id: '',
            activo: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (editando) {
                await bloqueService.update(editando.id, formData);
            } else {
                await bloqueService.create(formData);
            }
            cargarBloques();
            cerrarModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar bloque horario');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este bloque horario?')) return;

        setLoading(true);
        setError(null);

        try {
            await bloqueService.remove(id);
            cargarBloques();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar bloque horario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">⏰ Bloques Horarios</h1>
                <button
                    onClick={() => abrirModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    + Nuevo Bloque
                </button>
            </div>

            {error && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
                {loading ? (
                    <div className="py-10 text-center">Cargando…</div>
                ) : bloques.length === 0 ? (
                    <div className="py-10 text-center text-gray-600">No hay bloques horarios registrados</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-left">
                                    <th className="p-3">#</th>
                                    <th className="p-3">Día</th>
                                    <th className="p-3">Horario</th>
                                    <th className="p-3">Activo</th>
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bloques.map((bloque, idx) => (
                                    <tr key={bloque.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3">{idx + 1}</td>
                                        <td className="p-3">{bloque.dia?.nombre || '—'}</td>
                                        <td className="p-3">
                                            {bloque.horario?.hora_inicio} - {bloque.horario?.hora_fin}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                bloque.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {bloque.activo ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-3 space-x-2">
                                            <button
                                                onClick={() => abrirModal(bloque)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bloque.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">
                            {editando ? 'Editar Bloque Horario' : 'Nuevo Bloque Horario'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Día de la semana *
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={formData.dia_id}
                                    onChange={(e) => setFormData({ ...formData, dia_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un día</option>
                                    {dias.map((dia) => (
                                        <option key={dia.id} value={dia.id}>
                                            {dia.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Franja horaria *
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={formData.horario_id}
                                    onChange={(e) => setFormData({ ...formData, horario_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione una franja</option>
                                    {horarios.map((horario) => (
                                        <option key={horario.id} value={horario.id}>
                                            {horario.hora_inicio} - {horario.hora_fin}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="mr-2"
                                />
                                <label htmlFor="activo" className="text-sm text-gray-700">
                                    Bloque activo
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BloquesPage;
