import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import horarioService from '../../services/horarioService.js';
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

    useEffect(() => {
        fetchHorarios();
    }, [currentPage, perPage]);

    const fetchHorarios = async () => {
        setLoading(true);
        setError(null);

        try {
            const { rows, meta } = await horarioService.listarHorarios({ page: currentPage, per_page: perPage });

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

    const filteredHorarios = useMemo(() => {
        if (!searchTerm) return horarios;

        const term = searchTerm.toLowerCase();
        return horarios.filter((h) =>
            h.docente?.persona?.nombre_completo?.toLowerCase().includes(term) ||
            h.grupo?.codigo_grupo?.toLowerCase().includes(term) ||
            h.aula?.codigo_aula?.toLowerCase().includes(term) ||
            h.grupo?.materia?.nombre?.toLowerCase().includes(term)
        );
    }, [horarios, searchTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;

        try {
            await horarioService.eliminarHorario(id);
            fetchHorarios();
        } catch (err) {
            setError(parseApiError(err));
        }
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
            header: 'Día',
            accessor: 'bloque_horario.dia.nombre',
        },
        {
            header: 'Horario',
            render: (row) => {
                const bloque = row.bloque_horario;
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
    ];

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
                data={filteredHorarios}
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
                        </Can>
                    </div>
                )}
            />
        </div>
    );
}

export default VisualizarHorarioPage;