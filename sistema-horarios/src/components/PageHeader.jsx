import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="ph">
      <div>
        <h1 className="ph-title">{title}</h1>
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      <div className="ph-actions">{children}</div>
    </div>
  );
}

