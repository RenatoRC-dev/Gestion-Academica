import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import Can from '../../components/Can.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function DocentesPage() {
    const navigate = useNavigate();
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDocente, setCurrentDocente] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        ci: '',
        telefono_contacto: '',
        direccion: '',
        codigo_docente: '',
        password: '',
    });

    useEffect(() => {
        fetchDocentes();
    }, [currentPage, perPage]);

    const fetchDocentes = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/docentes', {
                params: { page: currentPage, per_page: perPage }
            });

            // Backend devuelve { success, data: { data:[], total, last_page, current_page, per_page } }
            const payload = response.data?.data || {};
            setDocentes(Array.isArray(payload.data) ? payload.data : []);
            setTotal(payload.total ?? 0);
            setTotalPages(payload.last_page ?? 1);
        } catch (err) {
            console.error('Error cargando docentes:', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setIsEditing(false);
        setCurrentDocente(null);
        setFormData({
            nombre_completo: '',
            email: '',
            ci: '',
            telefono_contacto: '',
            direccion: '',
            codigo_docente: '',
            password: '',
        });
        setValidationErrors({});
        setModalOpen(true);
    };

    const handleEdit = (docente) => {
        setIsEditing(true);
        setCurrentDocente(docente);
        setFormData({
            nombre_completo: docente.persona?.nombre_completo || '',
            email: docente.persona?.usuario?.email || '',
            ci: docente.persona?.ci || '',
            telefono_contacto: docente.persona?.telefono_contacto || '',
            direccion: docente.persona?.direccion || '',
            codigo_docente: docente.codigo_docente || '',
            password: '',
        });
        setValidationErrors({});
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este docente?')) return;

        try {
            await api.delete(`/docentes/${id}`);
            fetchDocentes();
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        setError(null);

        try {
            if (isEditing && currentDocente) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.put(`/docentes/${currentDocente.persona_id}`, payload);
            } else {
                await api.post('/docentes', formData);
            }

            setModalOpen(false);
            fetchDocentes();
        } catch (err) {
            console.error('Error guardando docente:', err);

            if (err.response?.status === 422) {
                setValidationErrors(err.response?.data?.errors || {});
            } else {
                setError(parseApiError(err));
            }
        }
    };

    const columns = [
        {
            header: 'Código',
            accessor: 'codigo_docente',
            sortable: true,
        },
        {
            header: 'Nombre Completo',
            accessor: 'persona.nombre_completo',
            sortable: true,
        },
        {
            header: 'CI',
            accessor: 'persona.ci',
        },
        {
            header: 'Email',
            accessor: 'persona.usuario.email',
        },
        {
            header: 'Teléfono',
            accessor: 'persona.telefono_contacto',
        },
    ];

    const filteredDocentes = searchTerm
        ? docentes.filter((d) =>
            d.persona?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.codigo_docente?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : docentes;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">👨‍🏫 Docentes</h1>
                <Can roles={['admin', 'coordinador']}>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Nuevo Docente
                    </button>
                </Can>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <DataTable
                columns={columns}
                data={filteredDocentes}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                total={total}
                onPageChange={setCurrentPage}
                onPerPageChange={(val) => {
                    setPerPage(val);
                    setCurrentPage(1);
                }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                emptyMessage="No hay docentes registrados"
                actions={(row) => (
                    <Can roles={['admin', 'coordinador']}>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(row)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(row.persona_id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                                Eliminar
                            </button>
                        </div>
                    </Can>
                )}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={isEditing ? 'Editar Docente' : 'Nuevo Docente'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.nombre_completo} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.email} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CI <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.ci}
                            onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.ci} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código Docente <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.codigo_docente}
                            onChange={(e) => setFormData({ ...formData, codigo_docente: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.codigo_docente} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="text"
                            value={formData.telefono_contacto}
                            onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.telefono_contacto} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FieldErrorList errors={validationErrors.direccion} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña {!isEditing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {isEditing && <p className="text-xs text-gray-500 mt-1">Dejar en blanco para no cambiar</p>}
                        <FieldErrorList errors={validationErrors.password} />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default DocentesPage;
