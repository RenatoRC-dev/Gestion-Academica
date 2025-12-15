// src/pages/administracion/BitacoraPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/DataTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import {
  fetchBitacora,
  selectBitacora,
  selectBitacoraLoading,
  selectBitacoraError,
  selectBitacoraMeta,
} from '../../store/slices/gestion-usuarios/bitacoraSlice.js';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value.toString().replace('T', ' ').slice(0, 19);
  return date.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const actionLabels = {
  POST: 'Creación/ingreso',
  PUT: 'Modificación',
  DELETE: 'Eliminación',
};

const formatChanges = (row) => {
  if (!Array.isArray(row.cambios) || !row.cambios.length) {
    return null;
  }
  return (
    <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
      {row.cambios.map((item) => (
        <li key={`${item.campo}-${item.antes}-${item.despues}`}>
          <span className="font-semibold">{item.campo}</span>: {item.antes} → {item.despues}
        </li>
      ))}
    </ul>
  );
};

const formatDetail = (row) => {
  const hasChanges = Array.isArray(row.cambios) && row.cambios.length > 0;
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {row.descripcion && (
        <p className="text-sm font-semibold text-gray-800">{row.descripcion}</p>
      )}
      {hasChanges ? (
        formatChanges(row)
      ) : (
        <p className="text-xs text-gray-500">Sin detalles adicionales</p>
      )}
    </div>
  );
};

export default function BitacoraPage() {
  const dispatch = useDispatch();
  const rows = useSelector(selectBitacora);
  const loading = useSelector(selectBitacoraLoading);
  const error = useSelector(selectBitacoraError);
  const meta = useSelector(selectBitacoraMeta);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchBitacora({ page }));
  }, [dispatch, page]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((entry) =>
      [entry.descripcion, entry.tabla_afectada, entry.usuario?.nombre_completo, entry.accion]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }, [search, rows]);

  const columns = [
    { header: 'Fecha / hora', render: (row) => formatDateTime(row.fecha_hora || row.created_at) },
    {
      header: 'Usuario',
      render: (row) => row.usuario?.nombre_completo || row.usuario_nombre || 'Sistema',
    },
    {
      header: 'Evento',
      render: (row) => actionLabels[row.accion?.toUpperCase()] || row.accion || 'Registro',
    },
    { header: 'Tabla', accessor: 'tabla_afectada' },
    { header: 'Detalle', render: (row) => formatDetail(row) },
  ];

  const perPage = meta?.per_page || 15;

  return (
    <div className="space-y-6">
      <PageHeader title="Bitácora" subtitle="Registro de acciones recientes" />

      {error && <Alert type="error" message={error} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        currentPage={meta?.page || page}
        totalPages={meta?.last_page || 1}
        perPage={perPage}
        total={meta?.total ?? filtered.length}
        onPageChange={setPage}
        onPerPageChange={null}
        searchTerm={search}
        onSearchChange={setSearch}
        emptyMessage="Todavía no hay registros en la bitácora"
      />
    </div>
  );
}
