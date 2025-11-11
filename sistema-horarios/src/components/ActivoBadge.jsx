import React from 'react';

export default function ActivoBadge({ activo, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      className={`activo-badge ${activo ? 'activo' : 'inactivo'}`}
      onClick={onToggle}
      aria-pressed={activo}
      disabled={disabled}
    >
      {activo ? 'Sí' : 'No'}
    </button>
  );
}
