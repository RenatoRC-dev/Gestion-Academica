import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Alert from '../../components/Alert.jsx';
import ConflictosList from '../../components/ConflictosList.jsx';
import FieldErrorList from '../../components/FieldErrorList.jsx';
import { parseApiError } from '../../utils/httpErrors.js';

function GenerarHorarioPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [conflictos, setConflictos] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        docente_id: '',
        aula_id: '',
        grupo_id: '',
        bloque_horario_id: '',
        periodo_id: '',
        modalidad_id: '1',
    });

    const [catalogos, setCatalogos] = useState({
        docentes: [],
        aulas: [],
        grupos: [],
        bloques: [],
        periodos: [],
        modalidades: [
            { id: 1, nombre: 'Presencial' },
            { id: 2, nombre: 'Virtual' },
            { id: 3, nombre: 'HÃ­brido' },
        ],
    });

    useEffect(() => {
        loadCatalogos();
    }, []);

    const loadCatalogos = async () => {
        try {
            const [docentesRes, aulasRes, gruposRes, bloquesRes, periodosRes] = await Promise.all([
                api.get('/docentes'),
                api.get('/aulas'),
                api.get('/grupos'),
                api.get('/bloques-horarios'),
                api.get('/periodos'),
            ]);

            const rows = (payload) => {
                const p = payload?.data;
                if (Array.isArray(p)) return p;
                if (Array.isArray(p?.data)) return p.data;
                return [];
            };

            setCatalogos((prev) => ({
                ...prev,
                docentes: rows(docentesRes.data),
                aulas: rows(aulasRes.data),
                grupos: rows(gruposRes.data),
                bloques: rows(bloquesRes.data),
                periodos: rows(periodosRes.data),
            }));
        } catch (err) {
            console.error('Error cargando catÃ¡logos:', err);
            setError(parseApiError(err));
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
        setSuccess(null);
        setConflictos([]);
        setValidationErrors({});

        try {
            const payload = {
                docente_id: parseInt(formData.docente_id),
                aula_id: parseInt(formData.aula_id),
                grupo_id: parseInt(formData.grupo_id),
                bloque_horario_id: parseInt(formData.bloque_horario_id),
                periodo_id: parseInt(formData.periodo_id),
                modalidad_id: parseInt(formData.modalidad_id),
            };

            await api.post('/horarios/generar', payload);
            setSuccess('Horario generado exitosamente');

            setTimeout(() => {
                navigate('/horarios');
            }, 1500);
        } catch (err) {
            console.error('Error generando horario:', err);

            const status = err.response?.status;

            if (status === 409) {
                setConflictos(err.response?.data?.conflictos || []);
                setError('Se detectaron conflictos de horario. Revise los detalles a continuaciÃ³n.');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">ðŸŽ¯ Generar Horario</h1>
                <button
                    onClick={() => navigate('/horarios')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Volver
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message={success} />}
            {conflictos.length > 0 && <ConflictosList conflictos={conflictos} />}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="periodo_id"
                            value={formData.periodo_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar período</option>
                            {Array.isArray(catalogos.periodos) && catalogos.periodos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        <FieldErrorList errors={validationErrors.periodo_id} />
                    </div>
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
                                    {a.codigo_aula} - Capacidad: {a.capacidad} - {a.tipo_aula?.nombre}
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
                                    {b.dia?.nombre} - {b.horario?.hora_inicio} a {b.horario?.hora_fin}
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
                        {submitting ? 'Generando...' : 'Generar Horario'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default GenerarHorarioPage;



