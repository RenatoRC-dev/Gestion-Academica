import React from 'react';

export default function Loader({ label = 'Cargando…' }) {
  return (
    <div className="loader">
      <div className="loader-dot" />
      <div className="loader-dot" />
      <div className="loader-dot" />
      <span className="loader-label">{label}</span>
    </div>
  );
}

