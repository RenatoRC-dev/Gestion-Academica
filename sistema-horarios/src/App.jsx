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
import UsuariosPage from './pages/gestion-usuarios/UsuariosPage.jsx';
import RolesPage from './pages/gestion-usuarios/RolesPage.jsx';
import BitacoraPage from './pages/gestion-usuarios/BitacoraPage.jsx';
import ImportarUsuariosPage from './pages/gestion-usuarios/ImportarUsuariosPage.jsx';

// Páginas Académicas
import PeriodosPage from './pages/gestion-academica/PeriodosPage.jsx';
import DocentesPage from './pages/gestion-academica/DocentesPage.jsx';
import AulasPage from './pages/gestion-academica/AulasPage.jsx';
import MateriasPage from './pages/gestion-academica/MateriasPage.jsx';
import GruposPage from './pages/gestion-academica/GruposPage.jsx';
import BloquesPage from './pages/gestion-academica/BloquesPage.jsx';
import AdministrativosPage from './pages/gestion-academica/AdministrativosPage.jsx';
import AreasAcademicasPage from './pages/gestion-academica/AreasAcademicasPage.jsx';
import AreasAdministrativasPage from './pages/gestion-academica/AreasAdministrativasPage.jsx';
import TiposAulaPage from './pages/gestion-academica/TiposAulaPage.jsx';

// Páginas de Horarios
import VisualizarHorarioPage from './pages/gestion-horarios/VisualizarHorarioPage.jsx';
import EditarHorarioPage from './pages/gestion-horarios/EditarHorarioPage.jsx';
import GenerarHorarioPage from './pages/gestion-horarios/GenerarHorarioPage.jsx';

// Páginas de Asistencia
import GenerarEscanearQRPage from './pages/gestion-asistencia/GenerarEscanearQRPage.jsx';
import ConfirmarAsistenciaPage from './pages/gestion-asistencia/ConfirmarAsistenciaPage.jsx';
import EstadosAsistenciaPage from './pages/gestion-asistencia/EstadosAsistenciaPage.jsx';
import MetodosRegistroPage from './pages/gestion-asistencia/MetodosRegistroPage.jsx';
import RegistrarAsistenciaPage from './pages/gestion-asistencia/RegistrarAsistenciaPage.jsx';
import HistorialAsistenciaPage from './pages/gestion-asistencia/HistorialAsistenciaPage.jsx';
import MiHistorialAsistenciaPage from './pages/gestion-asistencia/MiHistorialAsistenciaPage.jsx';
import ReporteEstadisticoPage from './pages/gestion-asistencia/ReporteEstadisticoPage.jsx';

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

                    <Route element={<ProtectedRoute requireRoles={[ROLES.DOCENTE]} />}>
                        <Route path="/asistencias/mihistorial" element={<MiHistorialAsistenciaPage />} />
                    </Route>

                    {/* Rutas de Administración */}
                    <Route element={<ProtectedRoute requireRoles={[ROLES.ADMIN]} />}>
                        <Route path="/usuarios" element={<UsuariosPage />} />
                        <Route path="/usuarios/importar" element={<ImportarUsuariosPage />} />
                        <Route path="/roles" element={<RolesPage />} />
                        <Route path="/bitacora" element={<BitacoraPage />} />

                        {/* Rutas de Gestión Académica */}
                        <Route path="/periodos" element={<PeriodosPage />} />
                        <Route path="/docentes" element={<DocentesPage />} />
                        <Route path="/aulas" element={<AulasPage />} />
                        <Route path="/tipos-aula" element={<TiposAulaPage />} />
                        <Route path="/materias" element={<MateriasPage />} />
                        <Route path="/grupos" element={<GruposPage />} />
                        <Route path="/bloques" element={<BloquesPage />} />
                        <Route path="/administrativos" element={<AdministrativosPage />} />
                        <Route path="/horarios/generar" element={<GenerarHorarioPage />} />
                        <Route path="/areas-academicas" element={<AreasAcademicasPage />} />
                        <Route path="/areas-administrativas" element={<AreasAdministrativasPage />} />
                        <Route path="/asistencias/historial" element={<HistorialAsistenciaPage />} />
                        <Route path="/asistencias/reporte-estadistico" element={<ReporteEstadisticoPage />} />

                        {/* Rutas de Asistencia (Admin) */}
                        <Route path="/asistencias/registrar" element={<RegistrarAsistenciaPage />} />
                        <Route path="/asistencias/estados" element={<EstadosAsistenciaPage />} />
                        <Route path="/asistencias/metodos" element={<MetodosRegistroPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AppShell>
        </>
    );
}
