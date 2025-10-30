// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import authService from '../../services/authService.js';
import api from '../../services/api.js';

// Helpers persistencia
const saveAuth = ({ token, user }) => {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
};

const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const initialState = {
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
};

// Thunk: Login
export const doLogin = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await authService.login(email, password);

            if (response.success) {
                // Establecer header de autorización
                api.defaults.headers.common.Authorization = `Bearer ${response.token}`;

                // Obtener usuario completo con roles
                try {
                    const me = await authService.getCurrentUser();
                    if (me.success && me.user) {
                        return { token: response.token, user: me.user };
                    }
                } catch {}

                return { token: response.token, user: response.user };
            } else {
                return rejectWithValue(response.message);
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: Restaurar sesión
export const restoreSession = createAsyncThunk(
    'auth/restore',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.getCurrentUser();

            if (response.success) {
                return { user: response.user };
            } else {
                return rejectWithValue(response.message);
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: Logout seguro
export const doLogout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.logout();

            if (response.success) {
                return true;
            } else {
                return rejectWithValue(response.message);
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(doLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(doLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                saveAuth({ token: state.token, user: state.user });
            })
            .addCase(doLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'No se pudo iniciar sesión';
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            })

            // Restaurar sesión
            .addCase(restoreSession.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = !!state.token;
                saveAuth({ token: state.token, user: state.user });
            })
            .addCase(restoreSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || null;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                clearAuth();
            })

            // Logout
            .addCase(doLogout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                clearAuth();
            });
    }
});

export const { clearAuthError } = slice.actions;
export default slice.reducer;

// Selectores
const selectSlice = (st) => st.auth;
export const selectAuthUser = createSelector([selectSlice], (s) => s.user);
export const selectAuthToken = createSelector([selectSlice], (s) => s.token);
export const selectAuthLoading = createSelector([selectSlice], (s) => s.loading);
export const selectAuthError = createSelector([selectSlice], (s) => s.error);
export const selectIsAuthenticated = createSelector([selectSlice], (s) => s.isAuthenticated);
