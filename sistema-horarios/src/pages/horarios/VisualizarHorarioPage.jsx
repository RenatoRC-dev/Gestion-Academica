import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import horarioService from '../../services/horarioService.js';
import api from '../../services/api.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import Can from '../../components/Can.jsx';
import { parseApiError } from '../../utils/httpErrors.js';
import { ROLES } from '../../utils/roles';

function VisualizarHorarioPage() {
    const navigate = useNavigate();
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [docentesList, setDocentesList] = useState([]);
    const [materiasList, setMateriasList] = useState([]);
    const [gruposList, setGruposList] = useState([]);
    const [periodosList, setPeriodosList] = useState([]);
    const [filters, setFilters] = useState({
        docente_id: '',
        materia_id: '',
        grupo_id: '',
        pattern: '',
        periodo_id: '',
        activo: ''
    });

    useEffect(() => {
        fetchHorarios();
    }, [
        currentPage,
        perPage,
        searchTerm,
        filters.docente_id,
        filters.materia_id,
        filters.grupo_id,
        filters.pattern,
        filters.periodo_id,
        filters.activo,
    ]);

    useEffect(() => {
        loadCatalogs();
    }, []);

    const loadCatalogs = async () => {
        try {
            const [docentesRes, materiasRes, gruposRes, periodosRes] = await Promise.all([
                api.get('/docentes', { params: { per_page: 100 } }),
                api.get('/materias', { params: { per_page: 100 } }),
                api.get('/grupos', { params: { per_page: 100 } }),
                api.get('/periodos', { params: { per_page: 100 } }),
            ]);
            const docentes = docentesRes?.data?.data?.data ?? docentesRes?.data?.data ?? docentesRes?.data ?? [];
            const materias = materiasRes?.data?.data?.data ?? materiasRes?.data?.data ?? materiasRes?.data ?? [];
            const grupos = gruposRes?.data?.data?.data ?? gruposRes?.data?.data ?? gruposRes?.data ?? [];
            const periodos = periodosRes?.data?.data?.data ?? periodosRes?.data?.data ?? periodosRes?.data ?? [];
            setDocentesList(docentes);
            setMateriasList(materias);
            setGruposList(grupos);
            setPeriodosList(periodos);
        } catch (err) {
            console.error('Error cargando catálogos:', err);
        }
    };

    const fetchHorarios = async () => {
        setLoading(true);
        setError(null);

        try {
            const { rows, meta } = await horarioService.listarHorarios({
                page: currentPage,
                per_page: perPage,
                search: searchTerm.trim(),
                docente_id: filters.docente_id,
                materia_id: filters.materia_id,
                grupo_id: filters.grupo_id,
                pattern: filters.pattern,
                periodo_id: filters.periodo_id,
                activo: filters.activo,
            });

            setHorarios(rows);
            setTotal(meta.total);
            setTotalPages(meta.last_page);
        } catch (err) {
            console.error('Error cargando horarios:', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;

        try {
            await horarioService.eliminarHorario(id);
            fetchHorarios();
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const handleToggleActivo = async (row) => {
        try {
            await horarioService.actualizarHorario(row.id, { activo: !row.activo });
            fetchHorarios();
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const getModalidadBadge = (modalidad) => {
        const badges = {
            Presencial: 'bg-blue-100 text-blue-800',
            Virtual: 'bg-green-100 text-green-800',
            Híbrido: 'bg-purple-100 text-purple-800',
        };
        return badges[modalidad] || 'bg-gray-100 text-gray-800';
    };

    const columns = [
        {
            header: 'Docente',
            accessor: 'docente.persona.nombre_completo',
            sortable: true,
        },
        {
            header: 'Materia',
            accessor: 'grupo.materia.nombre',
            sortable: true,
        },
        {
            header: 'Grupo',
            accessor: 'grupo.codigo_grupo',
            sortable: true,
        },
        {
            header: 'Aula',
            accessor: 'aula.codigo_aula',
            sortable: true,
        },
        {
            header: 'Período',
            accessor: 'periodo.nombre',
        },
        {
            header: 'Día',
            render: (row) => row.bloque_horario?.dia?.nombre ?? row.bloqueHorario?.dia?.nombre ?? '-',
        },
        {
            header: 'Horario',
            render: (row) => {
                const bloque = row.bloque_horario ?? row.bloqueHorario;
                if (!bloque) return '-';
                return `${bloque.horario?.hora_inicio || ''} - ${bloque.horario?.hora_fin || ''}`;
            },
        },
        {
            header: 'Modalidad',
            render: (row) => {
                const modalidad = row.modalidad?.nombre || 'N/A';
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModalidadBadge(modalidad)}`}>
                        {modalidad}
                    </span>
                );
            },
        },
        {
            header: 'Autorizado',
            render: (row) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.virtual_autorizado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    {row.virtual_autorizado ? 'Sí' : 'No'}
                </span>
            ),
        },
        {
            header: 'Activo',
            render: (row) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.activo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    {row.activo ? 'Sí' : 'No'}
                </span>
            ),
        },
    ];

    const toolbarFilters = (
            <div className="flex flex-wrap gap-3 py-2">
                <div>
                    <label className="text-xs uppercase tracking-wide text-gray-500">Docente</label>
                    <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.docente_id}
                    onChange={(e) => handleFilterChange('docente_id', e.target.value)}
                >
                    <option value="">Todos los docentes</option>
                    {docentesList.map((doc) => (
                        <option key={doc.persona_id ?? doc.id} value={doc.persona_id ?? doc.id}>
                            {doc.persona?.nombre_completo || doc.nombre_completo || `Docente ${doc.id ?? doc.persona_id}`}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Materia</label>
                <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.materia_id}
                    onChange={(e) => handleFilterChange('materia_id', e.target.value)}
                >
                    <option value="">Todas las materias</option>
                    {materiasList.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                            {mat.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Grupo</label>
                <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.grupo_id}
                    onChange={(e) => handleFilterChange('grupo_id', e.target.value)}
                >
                    <option value="">Todos los grupos</option>
                    {gruposList.map((grupo) => (
                        <option key={grupo.id} value={grupo.id}>
                            {grupo.codigo_grupo}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Patrón</label>
                <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.pattern}
                    onChange={(e) => handleFilterChange('pattern', e.target.value)}
                >
                    <option value="">Todos los bloques</option>
                    <option value="LMV">LMV (Lun/Mié/Vie)</option>
                    <option value="MJ">MJ (Mar/Jue)</option>
                </select>
            </div>
            <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Semestre</label>
                <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.periodo_id}
                    onChange={(e) => handleFilterChange('periodo_id', e.target.value)}
                >
                    <option value="">Todos los semestres</option>
                    {periodosList.map((periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                            {periodo.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Estado</label>
                <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={filters.activo}
                    onChange={(e) => handleFilterChange('activo', e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                </select>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">📅 Horarios</h1>
                <div className="flex gap-2">
                    <Can roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
                        <button
                            onClick={() => navigate('/horarios/generar')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            + Generar Horario
                        </button>
                    </Can>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <DataTable
                columns={columns}
                data={horarios}
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
                onSearchChange={handleSearchChange}
                toolbar={toolbarFilters}
                emptyMessage="No hay horarios disponibles"
                actions={(row) => (
                <div className="flex gap-2">
                    <Can roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
                        <button
                            onClick={() => navigate(`/horarios/editar/${row.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                            Eliminar
                        </button>
                        <button
                            onClick={() => handleToggleActivo(row)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                            {row.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </Can>
                </div>
            )}
            />
        </div>
    );
}

export default VisualizarHorarioPage;
