import React, { useEffect, useState } from 'react';

export default function SearchBar({ value = '', onChange, placeholder = 'Buscar…', delay = 300, className = '' }) {
  const [internal, setInternal] = useState(value ?? '');

  useEffect(() => {
    setInternal(value ?? '');
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => onChange?.(internal), delay);
    return () => clearTimeout(id);
  }, [internal, delay, onChange]);

  return (
    <input
      type="text"
      className={`input ${className}`.trim()}
      value={internal}
      onChange={(e) => setInternal(e.target.value)}
      placeholder={placeholder}
      aria-label="Buscar"
    />
  );
}

