// src/components/ConfirmDialog.jsx
import React from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title = 'Confirmar', message, onCancel, onConfirm, loading = false }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando…' : 'Confirmar'}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-700">{message}</p>
    </Modal>
  );
}

