import React from 'react';

export default function EmptyState({ title = 'Sin registros', message, action }) {
  return (
    <div className="emptystate">
      <div className="emptystate-title">{title}</div>
      {message && <div className="emptystate-msg">{message}</div>}
      {action && <div className="emptystate-action">{action}</div>}
    </div>
  );
}

