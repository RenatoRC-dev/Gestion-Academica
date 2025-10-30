import React, { useMemo } from 'react';

function DataTable({
    columns = [],
    data = [],
    loading = false,
    currentPage = 1,
    totalPages = 1,
    perPage = 10,
    total = 0,
    onPageChange = () => { },
    onPerPageChange = () => { },
    searchTerm = '',
    onSearchChange = () => { },
    sortColumn = '',
    sortDirection = 'asc',
    onSort = () => { },
    emptyMessage = 'No hay datos disponibles',
    actions = null,
}) {
    const renderCellContent = (row, column) => {
        if (!row || typeof row !== 'object') return '-';

        if (column.render) {
            return column.render(row);
        }
        if (column.accessor) {
            const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], row);
            return value !== null && value !== undefined ? value : '-';
        }
        return '-';
    };

    const handleSort = (column) => {
        if (!column.sortable) return;
        const newDirection = sortColumn === column.accessor && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(column.accessor, newDirection);
    };

    const safeData = useMemo(() =>
        Array.isArray(data) ? data.filter(row => row && typeof row === 'object') : [],
        [data]
    );

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="animate-pulse p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {onSearchChange && (
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.header}</span>
                                        {column.sortable && sortColumn === column.accessor && (
                                            <span className="text-blue-600">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {safeData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            safeData.map((row, rowIndex) => (
                                <tr key={row?.id || rowIndex} className="hover:bg-gray-50">
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {renderCellContent(row, column)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {total > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-700">
                            Mostrando {Math.min((currentPage - 1) * perPage + 1, total)} a{' '}
                            {Math.min(currentPage * perPage, total)} de {total} resultados
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={perPage}
                                onChange={(e) => onPerPageChange(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => onPageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    ««
                                </button>
                                <button
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    ‹
                                </button>

                                <span className="px-3 py-1 text-sm text-gray-700">
                                    Página {currentPage} de {totalPages}
                                </span>

                                <button
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => onPageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    »»
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;