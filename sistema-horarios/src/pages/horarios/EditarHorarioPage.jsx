import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import ConflictosList from '../../components/ConflictosList.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function EditarHorarioPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [conflictos, setConflictos] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        docente_id: '',
        aula_id: '',
        grupo_id: '',
        bloque_horario_id: '',
        modalidad_id: '',
    });

    const [catalogos, setCatalogos] = useState({
        docentes: [],
        aulas: [],
        grupos: [],
        bloques: [],
        modalidades: [],
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [horarioRes, docentesRes, aulasRes, gruposRes, bloquesRes] = await Promise.all([
                api.get(`/horarios/${id}`),
                api.get('/docentes'),
                api.get('/aulas'),
                api.get('/grupos'),
                api.get('/bloques-horarios'),
            ]);

            const horario = horarioRes.data?.data || horarioRes.data;

            setFormData({
                docente_id: horario.docente_id || '',
                aula_id: horario.aula_id || '',
                grupo_id: horario.grupo_id || '',
                bloque_horario_id: horario.bloque_horario_id || '',
                modalidad_id: horario.modalidad_id || 1,
            });

            setCatalogos({
                docentes: (docentesRes.data?.data?.data ?? docentesRes.data?.data ?? []),
                aulas: (aulasRes.data?.data?.data ?? aulasRes.data?.data ?? []),
                grupos: (gruposRes.data?.data?.data ?? gruposRes.data?.data ?? []),
                bloques: (bloquesRes.data?.data?.data ?? bloquesRes.data?.data ?? []),
                modalidades: [
                    { id: 1, nombre: 'Presencial' },
                    { id: 2, nombre: 'Virtual' },
                    { id: 3, nombre: 'HÃ­brido' },
                ],
            });
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setValidationErrors((prev) => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setConflictos([]);
        setValidationErrors({});

        try {
            await api.put(`/horarios/${id}`, formData);
            navigate('/horarios');
        } catch (err) {
            console.error('Error actualizando horario:', err);

            const status = err.response?.status;

            if (status === 409) {
                setConflictos(err.response?.data?.conflictos || []);
                setError('Se detectaron conflictos de horario');
            } else if (status === 422) {
                setValidationErrors(err.response?.data?.errors || {});
                setError('Por favor corrige los errores en el formulario');
            } else {
                setError(parseApiError(err));
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">âœï¸ Editar Horario</h1>
                <button
                    onClick={() => navigate('/horarios')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {conflictos.length > 0 && <ConflictosList conflictos={conflictos} />}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Docente <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="docente_id"
                            value={formData.docente_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar docente</option>
                            {Array.isArray(catalogos.docentes) && catalogos.docentes.map((d) => (
                                <option key={(d.id ?? d.persona_id)} value={(d.id ?? d.persona_id)}>
                                    {d.persona?.nombre_completo || d.codigo_docente}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.docente_id} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aula <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="aula_id"
                            value={formData.aula_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar aula</option>
                            {Array.isArray(catalogos.aulas) && catalogos.aulas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.codigo_aula} - Cap: {a.capacidad}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.aula_id} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grupo <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="grupo_id"
                            value={formData.grupo_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar grupo</option>
                            {Array.isArray(catalogos.grupos) && catalogos.grupos.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.codigo_grupo} - {g.materia?.nombre}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.grupo_id} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bloque Horario <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="bloque_horario_id"
                            value={formData.bloque_horario_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar bloque</option>
                            {Array.isArray(catalogos.bloques) && catalogos.bloques.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.dia?.nombre} {b.horario?.hora_inicio} - {b.horario?.hora_fin}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.bloque_horario_id} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modalidad <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="modalidad_id"
                            value={formData.modalidad_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {catalogos.modalidades.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.modalidad_id} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/horarios')}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditarHorarioPage;
