// src/pages/InicioPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function InicioPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido 👋</h1>
            <div className="card">
                <p className="text-gray-600">Seleccione una opción:</p>
                <div className="space-x-2 mt-4">
                    <Link to="/horarios" className="btn-primary">Ver Horarios</Link>
                    <Link to="/asistencias/generar-qr" className="btn-secondary">Generar QR</Link>
                    <Link to="/asistencias/escanear-qr" className="btn-secondary">Escanear QR</Link>
                </div>
            </div>
        </div>
    );
}

export default InicioPage;