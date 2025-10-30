import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.js';
import { doLogin, restoreSession, doLogout } from '../store/slices/authSlice.js';

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading, error } = useSelector(state => state.auth);

    const login = async (email, password) => {
        try {
            const result = await dispatch(doLogin({ email, password }));

            if (result.payload?.success) {
                navigate('/dashboard');
                return result.payload;
            } else {
                throw new Error(result.payload?.message || 'Error de inicio de sesión');
            }
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await dispatch(doLogout());
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
            throw err;
        }
    };

    const checkAuth = async () => {
        try {
            if (!isAuthenticated) {
                const result = await dispatch(restoreSession());
                return result.payload?.success;
            }
            return true;
        } catch (err) {
            console.error('Auth check error:', err);
            navigate('/login');
            return false;
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        checkAuth
    };
};