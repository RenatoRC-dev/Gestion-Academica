// src/services/authService.js
import api from './api.js';
import { setAuthToken, clearAuthToken } from './api.js';

export async function login(email, password) {
    try {
        const resp = await api.post('/login', { email, password });

        if (resp.data.success && resp.data.token) {
            // Guardar token
            setAuthToken(resp.data.token);

            // Guardar información del usuario
            localStorage.setItem('user', JSON.stringify(resp.data.user));

            return {
                success: true,
                user: resp.data.user,
                token: resp.data.token,
                message: resp.data.message || 'Inicio de sesión exitoso'
            };
        } else {
            return {
                success: false,
                message: resp.data.message || 'Error en el inicio de sesión'
            };
        }
    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Error de conexión'
        };
    }
}

export async function getCurrentUser() {
    try {
        const resp = await api.get('/user');

        if (resp.data.success) {
            return {
                success: true,
                user: resp.data.data || resp.data.user
            };
        } else {
            return {
                success: false,
                message: resp.data.message || 'No se pudo obtener el usuario'
            };
        }
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);

        // Si hay un error de autenticación, limpiar token
        if (error.response?.status === 401) {
            clearAuthToken();
            localStorage.removeItem('user');
        }

        return {
            success: false,
            message: error.response?.data?.message || 'Error de autenticación'
        };
    }
}

export async function changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    const resp = await api.post('/user/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
    });
    return resp.data;
}

export async function recoverPassword(email) {
    const resp = await api.post('/password/recuperar', { email });
    return resp.data;
}

export async function logout() {
    try {
        const resp = await api.post('/logout');

        // Limpiar token y datos de usuario
        clearAuthToken();
        localStorage.removeItem('user');

        return {
            success: true,
            message: resp.data.message || 'Sesión cerrada exitosamente'
        };
    } catch (error) {
        console.error('Error de cierre de sesión:', error);

        // Limpiar token independientemente del error
        clearAuthToken();
        localStorage.removeItem('user');

        return {
            success: false,
            message: error.response?.data?.message || 'Error cerrando sesión'
        };
    }
}

// Export default para compatibilidad con AuthContext
const authService = { login, getCurrentUser, changePassword, recoverPassword, logout };
export default authService;
