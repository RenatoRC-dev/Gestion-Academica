// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow text-center">
                <h1 className="text-3xl font-bold">404 — Página no encontrada</h1>
                <p className="text-gray-600 mt-2">La ruta a la que intentaste acceder no existe o no tienes permisos.</p>
                <div className="mt-6 space-x-2">
                    <Link to="/" className="btn-primary">Ir al inicio</Link>
                    <Link to="/login" className="btn-secondary">Iniciar sesión</Link>
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;