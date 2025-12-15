import { useState } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import importacionService from '../../services/gestion-usuarios/importacionService';
import Alert from '../../components/Alert';

const ImportarUsuariosPage = () => {
    const [archivo, setArchivo] = useState(null);
    const [resultados, setResultados] = useState(null);
    const [validando, setValidando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [preview, setPreview] = useState(null);

    const mensaje = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const descargarPlantilla = async () => {
        try {
            await importacionService.descargarPlantilla('docentes');
            mensaje('success', 'Plantilla descargada. Revisa la carpeta de descargas.');
        } catch (error) {
            mensaje('error', 'Error descargando plantilla: ' + (error.response?.data?.message || error.message));
        }
    };

    const onArchivoSeleccionado = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const extensiones = /\.(xlsx|xls|csv)$/i;
        if (!extensiones.test(file.name)) {
            mensaje('error', 'El archivo debe ser Excel o CSV.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            mensaje('error', 'El archivo no debe exceder 5 MB.');
            return;
        }
        setArchivo(file);
        setPreview(null);
        setResultados(null);
    };

    const validarArchivo = async () => {
        if (!archivo) {
            mensaje('error', 'Selecciona un archivo antes de validar.');
            return;
        }
        setValidando(true);
        try {
            const response = await importacionService.validar(archivo);
            if (response.success) {
                setPreview(response.data);
                mensaje('success', 'Archivo validado correctamente.');
            } else {
                mensaje('error', response.message || 'No se pudo validar el archivo.');
            }
        } catch (error) {
            mensaje('error', 'Error al validar: ' + (error.response?.data?.message || error.message));
        } finally {
            setValidando(false);
        }
    };

    const importarArchivo = async () => {
        if (!archivo) {
            mensaje('error', 'Debes seleccionar un archivo para importar.');
            return;
        }
        if (preview?.tiene_errores) {
            mensaje('error', 'Corrige los errores detectados antes de importar.');
            return;
        }
        setImportando(true);
        try {
            const response = await importacionService.importar(archivo);
            if (response.success) {
                setResultados(response.data);
                mensaje('success', response.message || 'Importación completada.');
            } else {
                mensaje('error', response.message || 'No se pudo completar la importación.');
            }
        } catch (error) {
            mensaje('error', 'Error al importar: ' + (error.response?.data?.message || error.message));
        } finally {
            setImportando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {alert.show && <Alert type={alert.type} message={alert.message} />}

                <section className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-8">
                    <header className="flex items-center gap-3">
                        <Upload className="w-9 h-9 text-indigo-600" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 font-semibold">Ayuda</p>
                            <h1 className="text-3xl font-bold text-gray-900">Importación masiva de docentes</h1>
                        </div>
                    </header>

                    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-lg font-semibold text-gray-900">Plantilla oficial</p>
                            <p className="text-sm text-gray-600">
                                Descarga la plantilla con CI, correo institucional y datos base. La contraseña será igual al CI.
                            </p>
                        </div>
                        <button
                            onClick={descargarPlantilla}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-600 border border-indigo-100 text-sm font-semibold hover:bg-indigo-50 transition"
                        >
                            <Download className="w-4 h-4" />
                            Descargar plantilla
                        </button>
                    </div>

                    <div className="bg-gray-100 rounded-2xl p-6 space-y-4">
                        <p className="text-sm font-semibold text-gray-700">Carga el archivo</p>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex-1 min-w-[220px]">
                                <input
                                    id="archivo-input"
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={onArchivoSeleccionado}
                                    className="hidden"
                                />
                                <div className="px-4 py-3 border border-transparent rounded-2xl bg-white flex justify-between items-center text-sm text-gray-600 hover:border-indigo-300 cursor-pointer">
                                    <span>{archivo ? archivo.name : 'Seleccionar archivo'}</span>
                                    <span className="text-xs text-indigo-500 uppercase tracking-wider">Explorar</span>
                                </div>
                            </label>
                            <button
                                onClick={validarArchivo}
                                disabled={!archivo || validando}
                                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                                {validando ? 'Validando...' : 'Validar archivo'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Tamaño: {archivo ? `${(archivo.size / 1024).toFixed(2)} KB` : 'N/A'}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <button
                            onClick={importarArchivo}
                            disabled={!archivo || importando}
                            className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            {importando ? 'Importando...' : 'Importar docentes'}
                        </button>
                        <button
                            onClick={() => mensaje('info', 'Historial próximo a implementarse.')}
                            className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                        >
                            Ver historial
                        </button>
                    </div>

                    {preview && (
                        <div className="space-y-4">
                            <div className="px-5 py-3 rounded-2xl border border-yellow-200 bg-yellow-50 text-sm text-gray-700">
                                {preview.tiene_errores
                                    ? `Se detectaron ${preview.errores_preview?.length || 0} error(es). Corrige las filas indicadas antes de continuar.`
                                    : `Archivo validado (${preview.total_registros} registros listos).`}
                            </div>
                            {preview.errores_preview?.length > 0 && (
                                <div className="px-5 py-3 rounded-2xl border border-red-200 bg-red-50 text-sm text-gray-700">
                                    <p className="font-semibold text-red-600">Errores detallados</p>
                                    <ul className="mt-2 space-y-2 list-disc list-inside">
                                        {preview.errores_preview.map((error) => (
                                            <li key={`${error.fila}-${error.error}`}>
                                                Fila {error.fila}: {error.error}. Si es CI o teléfono, escríbelo como texto (por ejemplo, precede con ') para que Excel no convierta el valor en número.
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {resultados && (
                        <div className="px-5 py-3 rounded-2xl border border-blue-100 bg-blue-50 text-sm text-gray-700">
                            {resultados.mensaje || 'Importación procesada. Busca los detalles en el historial.'}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ImportarUsuariosPage;
