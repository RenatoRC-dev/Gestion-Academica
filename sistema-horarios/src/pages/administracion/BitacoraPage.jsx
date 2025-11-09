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

const actionLabels = {
  POST: 'Creación/ingreso',
  PUT: 'Modificación',
  DELETE: 'Eliminación',
};

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const buildDiff = (prev, next) => {
  if (!prev && !next) return null;
  const keys = new Set([...(prev ? Object.keys(prev) : []), ...(next ? Object.keys(next) : [])]);
  const changes = [];
  keys.forEach((key) => {
    const before = prev ? prev[key] : undefined;
    const after = next ? next[key] : undefined;
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    changes.push(`${key}: ${before ?? '-'} → ${after ?? '-'}`);
  });
  return changes.length ? changes.join('; ') : null;
};

const formatDetail = (row) => {
  const lines = [];
  if (row.tabla_afectada) {
    lines.push(`Tabla: ${row.tabla_afectada}${row.registro_id ? ` (ID ${row.registro_id})` : ''}`);
  }
  if (row.descripcion) {
    lines.push(row.descripcion);
  }
  const prev = parseJson(row.datos_anteriores);
  const next = parseJson(row.datos_nuevos);
  const diff = buildDiff(prev, next);
  if (diff) {
    lines.push(diff);
  }
  if (!lines.length) {
    return '-';
  }
  return (
    <div className="text-sm leading-snug space-y-1">
      {lines.map((text, index) => (
        <div key={`${text}-${index}`}>{text}</div>
      ))}
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
