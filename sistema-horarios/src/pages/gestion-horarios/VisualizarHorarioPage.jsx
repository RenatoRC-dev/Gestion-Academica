import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import horarioService from '../../services/gestion-horarios/horarioService.js';
import api from '../../services/api.js';
import DataTable from '../../components/DataTable.jsx';
import Alert from '../../components/Alert.jsx';
import ActivoBadge from '../../components/ActivoBadge.jsx';
import Can from '../../components/Can.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { parseApiError } from '../../utils/httpErrors.js';
import { ROLES } from '../../utils/roles';

function VisualizarHorarioPage() {
    const navigate = useNavigate();
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        activo: '',
        search: ''
    });

    useEffect(() => {
        fetchHorarios();
    }, [
        currentPage,
        perPage,
        filters.docente_id,
        filters.materia_id,
        filters.grupo_id,
        filters.pattern,
        filters.periodo_id,
        filters.activo,
        filters.search
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
            const extract = (resp) =>
                resp?.data?.data?.data ?? resp?.data?.data ?? resp?.data ?? [];
            setDocentesList(extract(docentesRes));
            setMateriasList(extract(materiasRes));
            setGruposList(extract(gruposRes));
            setPeriodosList(extract(periodosRes));
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
                search: filters.search.trim(),
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
            header: 'Periodo',
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
                <ActivoBadge activo={row.activo} onToggle={() => handleToggleActivo(row)} disabled={loading} />
            ),
            align: 'center',
        },
    ];

    const toolbarFilters = (
        <div className="filters-card">
            <div className="filters-grid">
                <div>
                    <span className="filter-label">Buscar</span>
                    <input
                        className="filters-full input"
                        placeholder="Buscar por docente, materia o aula"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div>
                    <span className="filter-label">Docente</span>
                    <select
                        className="filters-full input"
                        value={filters.docente_id}
                        onChange={(e) => handleFilterChange('docente_id', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {docentesList.map((doc) => (
                            <option key={doc.persona_id ?? doc.id} value={doc.persona_id ?? doc.id}>
                                {doc.persona?.nombre_completo || doc.nombre_completo || `Docente ${doc.id ?? doc.persona_id}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="filter-label">Materia</span>
                    <select
                        className="filters-full input"
                        value={filters.materia_id}
                        onChange={(e) => handleFilterChange('materia_id', e.target.value)}
                    >
                        <option value="">Todas</option>
                        {materiasList.map((mat) => (
                            <option key={mat.id} value={mat.id}>
                                {mat.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="filter-label">Grupo</span>
                    <select
                        className="filters-full input"
                        value={filters.grupo_id}
                        onChange={(e) => handleFilterChange('grupo_id', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {gruposList.map((grupo) => (
                            <option key={grupo.id} value={grupo.id}>
                                {grupo.codigo_grupo}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="filter-label">Patrón</span>
                    <select
                        className="filters-full input"
                        value={filters.pattern}
                        onChange={(e) => handleFilterChange('pattern', e.target.value)}
                    >
                        <option value="">Todos los bloques</option>
                        <option value="LMV">LMV (Lun/Mié/Vie)</option>
                        <option value="MJ">MJ (Mar/Jue)</option>
                    </select>
                </div>
                <div>
                    <span className="filter-label">Periodo</span>
                    <select
                        className="filters-full input"
                        value={filters.periodo_id}
                        onChange={(e) => handleFilterChange('periodo_id', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {periodosList.map((periodo) => (
                            <option key={periodo.id} value={periodo.id}>
                                {periodo.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="filter-label">Estado</span>
                    <select
                        className="filters-full input"
                        value={filters.activo}
                        onChange={(e) => handleFilterChange('activo', e.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Horarios"
                subtitle="Visualiza y filtra horarios por docente, materia o periodo"
            >
                <Can roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
                    <button
                        onClick={() => navigate('/horarios/generar')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Generar Horario
                    </button>
                </Can>
            </PageHeader>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <div className="section-card space-y-4">
                {toolbarFilters}
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
                    toolbar={null}
                    emptyMessage="No hay horarios disponibles"
                    actions={(row) => (
                        <div className="flex gap-2">
                            <Can roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
                                <button
                                    onClick={() => navigate(`/horarios/editar/${row.id}`)}
                                    className="action-link"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(row.id)}
                                    className="action-link red"
                                >
                                    Eliminar
                                </button>
                            </Can>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

export default VisualizarHorarioPage;
