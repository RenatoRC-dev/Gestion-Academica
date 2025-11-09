import React, { useMemo } from 'react';

function DataTable({
  columns = [],
  data = [],
  loading = false,
  currentPage = 1,
  totalPages = 1,
  perPage = 10,
  total = 0,
  onPageChange = () => {},
  onPerPageChange,
  searchTerm = '',
  onSearchChange,
  sortColumn = '',
  sortDirection = 'asc',
  onSort = () => {},
  emptyMessage = 'No hay datos disponibles',
  actions = null,
  toolbar = null,
}) {
  const renderCellContent = (row, column) => {
    if (!row || typeof row !== 'object') return '-';
    if (column.render) return column.render(row);
    if (column.accessor) {
      const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], row);
      return value !== null && value !== undefined ? value : '-';
    }
    return '-';
  };

  const handleSort = (column) => {
    if (!column.sortable || !column.accessor) return;
    const newDirection =
      sortColumn === column.accessor && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.accessor, newDirection);
  };

  const safeData = useMemo(
    () => (Array.isArray(data) ? data.filter((row) => row && typeof row === 'object') : []),
    [data]
  );

  const hasSearch = typeof onSearchChange === 'function';
  const hasToolbar = hasSearch || Boolean(toolbar);
  const start = total === 0 ? 0 : Math.min((currentPage - 1) * perPage + 1, total);
  const end = Math.min(currentPage * perPage, total);

  const goToPage = (page) => {
    const safeTotalPages = totalPages || 1;
    const safePage = Math.min(Math.max(page, 1), safeTotalPages);
    onPageChange(safePage);
  };

  const canChangePageSize = typeof onPerPageChange === 'function';

  return (
    <div className="table-card">
      {hasToolbar && (
        <div className="table-card-toolbar">
          {hasSearch && (
            <label className="table-search">
              <span className="sr-only">Buscar</span>
              <input
                type="search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="table-search-input"
              />
            </label>
          )}
          {toolbar && <div className="table-toolbar-slot">{toolbar}</div>}
        </div>
      )}

      <div className="table-scroll">
        {loading ? (
          <div className="table-loading">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="table-loading-row" />
            ))}
          </div>
        ) : (
          <table className="ga-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={column.sortable ? 'sortable' : undefined}
                    onClick={() => handleSort(column)}
                    style={{ width: column.width }}
                  >
                    <span>{column.header}</span>
                    {column.sortable && sortColumn === column.accessor && (
                      <span className="ga-table-sort" aria-hidden>
                        {sortDirection === 'asc' ? '?' : '?'}
                      </span>
                    )}
                  </th>
                ))}
                {actions && (
                  <th scope="col" className="text-right" aria-label="Acciones">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {safeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="table-empty"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                safeData.map((row, rowIndex) => (
                  <tr key={row?.id || rowIndex}>
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {renderCellContent(row, column)}
                      </td>
                    ))}
                    {actions && (
                      <td className="table-actions-cell">{actions(row)}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="table-pagination">
          <div className="table-pagination-info">
            Mostrando {start} a {end} de {total} resultados
          </div>
          <div className="table-pagination-controls">
            {canChangePageSize && (
              <label className="table-per-page">
                <span>Filas</span>
                <select
                  value={perPage}
                  onChange={(e) => onPerPageChange(Number(e.target.value))}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="table-pagination-buttons">
              <button onClick={() => goToPage(1)} disabled={currentPage <= 1}>
                {'«'}
              </button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                {'‹'}
              </button>
              <span>
                {'Página'} {currentPage} de {totalPages || 1}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= (totalPages || 1)}
              >
                {'›'}
              </button>
              <button
                onClick={() => goToPage(totalPages || 1)}
                disabled={currentPage >= (totalPages || 1)}
              >
                {'»'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

