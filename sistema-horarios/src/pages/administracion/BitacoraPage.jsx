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
} from '../../store/slices/bitacoraSlice.js';

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
      [entry.accion, entry.modelo, entry.usuario?.nombre_completo]
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
    { header: 'Acción', accessor: 'accion' },
    { header: 'Detalle', render: (row) => row.modelo ?? row.detalle ?? '-' },
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
