// src/utils/httpErrors.js
/**
 * Normaliza errores de Axios/Laravel para mostrarlos en UI.
 * Devuelve: { status, message, errors, conflictos, data }
 */
export function parseApiError(error) {
    const status = error?.response?.status || 0;
    const data = error?.response?.data || {};
    const message =
        data?.message ||
        error?.message ||
        (status ? `Error HTTP ${status}` : 'Error de red');

    // Laravel validation errors: { errors: {campo:[..]}}
    const errors = data?.errors || null;

    // Nuestros controladores de Horarios usan { conflictos: [...] } con 409
    const conflictos = data?.conflictos || null;

    return { status, message, errors, conflictos, data };
}

/** Convierte { campo:[..] } a una lista [{k,v}] para render simple */
export function flattenValidation(errors) {
    if (!errors || typeof errors !== 'object') return [];
    const out = [];
    Object.entries(errors).forEach(([k, v]) => {
        const arr = Array.isArray(v) ? v : [String(v)];
        arr.forEach((msg) => out.push({ field: k, message: msg }));
    });
    return out;
}