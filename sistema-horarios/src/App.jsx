import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { ROLES } from './utils/roles.js';
import AppShell from './components/AppShell.jsx';

// Páginas
import LoginPage from './pages/auth/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Páginas de Administración
import UsuariosPage from './pages/administracion/UsuariosPage.jsx';
import RolesPage from './pages/administracion/RolesPage.jsx';
import BitacoraPage from './pages/administracion/BitacoraPage.jsx';

// Páginas Académicas
import PeriodosPage from './pages/academica/PeriodosPage.jsx';
import DocentesPage from './pages/academica/DocentesPage.jsx';
import AulasPage from './pages/academica/AulasPage.jsx';
import MateriasPage from './pages/academica/MateriasPage.jsx';
import GruposPage from './pages/academica/GruposPage.jsx';
import BloquesPage from './pages/academica/BloquesPage.jsx';
import AdministrativosPage from './pages/academica/AdministrativosPage.jsx';
import AreasAcademicasPage from './pages/academica/AreasAcademicasPage.jsx';

// Páginas de Horarios
import VisualizarHorarioPage from './pages/horarios/VisualizarHorarioPage.jsx';
import EditarHorarioPage from './pages/horarios/EditarHorarioPage.jsx';
import GenerarHorarioPage from './pages/horarios/GenerarHorarioPage.jsx';

// Páginas de Asistencia
import GenerarEscanearQRPage from './pages/asistencia/GenerarEscanearQRPage.jsx';
  import ConfirmarAsistenciaPage from './pages/asistencia/ConfirmarAsistenciaPage.jsx';

function Splash() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
            <div className="text-center">
                <div className="animate-pulse text-3xl font-semibold">Cargando sesión…</div>
                <div className="mt-2 text-sm text-gray-500">Verificando credenciales</div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100 text-gray-900">
                <AuthContent />
            </div>
        </BrowserRouter>
    );
}

function AuthContent() {
    const { user, loading } = useAuth();

    if (loading) return <Splash />;

    return (
        <>
            <AppShell>
                <Routes>
                    {/* Rutas públicas de auth */}
                    <Route
                        path="/login"
                        element={
                            user
                                ? <Navigate to="/dashboard" replace />
                                : <LoginPage />
                        }
                    />
                    {/* Rutas protegidas base */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* Horarios */}
                        <Route path="/horarios" element={<VisualizarHorarioPage />} />
                        <Route path="/horarios/editar/:id" element={<EditarHorarioPage />} />

                        {/* Asistencias */}
                        <Route path="/asistencias/qr" element={<GenerarEscanearQRPage />} />
                        <Route path="/asistencias/confirmar-virtual" element={<ConfirmarAsistenciaPage />} />
                    </Route>

                    {/* Rutas de Administración */}
                    <Route element={<ProtectedRoute requireRoles={[ROLES.ADMIN]} />}>
                        <Route path="/usuarios" element={<UsuariosPage />} />
                        <Route path="/roles" element={<RolesPage />} />
                        <Route path="/bitacora" element={<BitacoraPage />} />

                        {/* Rutas de Gestión Académica */}
                        <Route path="/periodos" element={<PeriodosPage />} />
                        <Route path="/docentes" element={<DocentesPage />} />
                        <Route path="/aulas" element={<AulasPage />} />
                        <Route path="/materias" element={<MateriasPage />} />
                        <Route path="/grupos" element={<GruposPage />} />
                        <Route path="/bloques" element={<BloquesPage />} />
                        <Route path="/administrativos" element={<AdministrativosPage />} />
                        <Route path="/horarios/generar" element={<GenerarHorarioPage />} />
                        <Route path="/areas-academicas" element={<AreasAcademicasPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AppShell>
        </>
    );
}
