import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetricas } from '../store/metricasSlice.js';
import { FaChalkboardTeacher, FaBook, FaBuilding, FaUsers, FaCalendarAlt, FaUserTie } from 'react-icons/fa';

const MetricaCard = ({ icono, titulo, valor }) => (
  <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4">
    <div className="text-3xl text-primary">{icono}</div>
    <div>
      <p className="text-gray-500 text-sm">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  </div>
);

const MetricasCards = () => {
  const dispatch = useDispatch();
  const { data: metricas, loading, error } = useSelector((state) => state.metricas);

  useEffect(() => {
    dispatch(fetchMetricas());
  }, [dispatch]);

  if (loading) return <div>Cargando métricas...</div>;
  if (error) return <div>Error al cargar métricas</div>;
  if (!metricas) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricaCard
        icono={<FaChalkboardTeacher />}
        titulo="Docentes"
        valor={metricas.total_docentes}
      />
      <MetricaCard
        icono={<FaBook />}
        titulo="Materias"
        valor={metricas.total_materias}
      />
      <MetricaCard
        icono={<FaBuilding />}
        titulo="Aulas"
        valor={metricas.total_aulas}
      />
      <MetricaCard
        icono={<FaUsers />}
        titulo="Grupos"
        valor={metricas.total_grupos}
      />
      <MetricaCard
        icono={<FaCalendarAlt />}
        titulo="Períodos"
        valor={metricas.total_periodos}
      />
      <MetricaCard
        icono={<FaUserTie />}
        titulo="Usuarios"
        valor={metricas.total_usuarios}
      />
    </div>
  );
};

export default MetricasCards;