import React, { useId } from 'react';

export default function Modal({ open, title = '', onClose, children, footer }) {
  const headingId = useId();
  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby={title ? headingId : undefined}>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal-panel">
        {(title || onClose) && (
          <div className="modal-header">
            {title && <h3 id={headingId}>{title}</h3>}
            {onClose && (
              <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>
                {'×'}
              </button>
            )}
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

