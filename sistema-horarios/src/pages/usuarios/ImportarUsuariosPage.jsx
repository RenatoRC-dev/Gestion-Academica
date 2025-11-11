import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, History } from 'lucide-react';
import importacionService from '../../services/importacionService';
import Alert from '../../components/Alert';

const ImportarUsuariosPage = () => {
    const [tipoImportacion, setTipoImportacion] = useState('docentes');
    const [archivo, setArchivo] = useState(null);
    const [validando, setValidando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [preview, setPreview] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const mostrarAlerta = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const handleDescargarPlantilla = async () => {
        try {
            await importacionService.descargarPlantilla(tipoImportacion);
            mostrarAlerta('success', 'Plantilla descargada exitosamente');
        } catch (error) {
            mostrarAlerta('error', 'Error al descargar plantilla: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleArchivoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
                mostrarAlerta('error', 'Solo se permiten archivos Excel (.xlsx, .xls) o CSV');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                mostrarAlerta('error', 'El archivo no debe superar los 5MB');
                return;
            }
            setArchivo(file);
            setPreview(null);
            setResultado(null);
        }
    };

    const handleValidar = async () => {
        if (!archivo) {
            mostrarAlerta('error', 'Debe seleccionar un archivo');
            return;
        }

        setValidando(true);
        try {
            const response = await importacionService.validar(archivo, tipoImportacion);
            if (response.success) {
                setPreview(response.data);
                mostrarAlerta('success', 'Validación completada');
            } else {
                mostrarAlerta('error', response.message || 'Error al validar archivo');
            }
        } catch (error) {
            mostrarAlerta('error', 'Error al validar: ' + (error.response?.data?.message || error.message));
            setPreview(null);
        } finally {
            setValidando(false);
        }
    };

    const handleImportar = async () => {
        if (!archivo) {
            mostrarAlerta('error', 'Debe seleccionar un archivo');
            return;
        }

        if (preview && preview.tiene_errores) {
            mostrarAlerta('error', 'El archivo tiene errores. Corrija los errores antes de importar');
            return;
        }

        setImportando(true);
        try {
            const response = await importacionService.importar(archivo, tipoImportacion);
            if (response.success) {
                setResultado(response.data);
                mostrarAlerta('success', response.message || 'Importación completada');
                setArchivo(null);
                setPreview(null);
                // Reset file input
                document.getElementById('archivo-input').value = '';
            } else {
                mostrarAlerta('error', response.message || 'Error al importar');
            }
        } catch (error) {
            mostrarAlerta('error', 'Error al importar: ' + (error.response?.data?.message || error.message));
        } finally {
            setImportando(false);
        }
    };

    const handleCargarHistorial = async () => {
        try {
            const response = await importacionService.historial({ tipo_importacion: tipoImportacion });
            if (response.success) {
                setHistorial(response.data);
                setMostrarHistorial(true);
            }
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar historial: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                {alert.show && <Alert type={alert.type} message={alert.message} />}

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <Upload className="w-8 h-8 text-indigo-600" />
                        Importación Masiva de Usuarios
                    </h1>

                    {/* Selector de Tipo */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Importación
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setTipoImportacion('docentes'); setPreview(null); setResultado(null); }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                                    tipoImportacion === 'docentes'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Docentes
                            </button>
                            <button
                                onClick={() => { setTipoImportacion('estudiantes'); setPreview(null); setResultado(null); }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                                    tipoImportacion === 'estudiantes'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Estudiantes
                            </button>
                            <button
                                onClick={() => { setTipoImportacion('usuarios'); setPreview(null); setResultado(null); }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                                    tipoImportacion === 'usuarios'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Usuarios
                            </button>
                        </div>
                    </div>

                    {/* Descargar Plantilla */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-800 mb-1">Plantilla Excel</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Descarga la plantilla de ejemplo para {tipoImportacion}. Completa los datos y súbela para importar.
                                </p>
                                <button
                                    onClick={handleDescargarPlantilla}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar Plantilla
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Subir Archivo */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar Archivo
                        </label>
                        <div className="flex gap-3">
                            <input
                                id="archivo-input"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleArchivoChange}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleValidar}
                                disabled={!archivo || validando}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                                {validando ? 'Validando...' : 'Validar'}
                            </button>
                        </div>
                        {archivo && (
                            <p className="mt-2 text-sm text-gray-600">
                                Archivo seleccionado: <span className="font-medium">{archivo.name}</span> ({(archivo.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    {/* Vista Previa */}
                    {preview && (
                        <div className="mb-6 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                {preview.tiene_errores ? (
                                    <><XCircle className="w-5 h-5 text-red-600" /> Vista Previa (Con Errores)</>
                                ) : (
                                    <><CheckCircle className="w-5 h-5 text-green-600" /> Vista Previa (Sin Errores)</>
                                )}
                            </h3>
                            <div className="mb-3 flex gap-4 text-sm">
                                <span className="font-medium">Total registros: {preview.total_registros}</span>
                                {preview.errores_preview?.length > 0 && (
                                    <span className="text-red-600 font-medium">Errores: {preview.errores_preview.length}</span>
                                )}
                            </div>

                            {/* Tabla de Preview */}
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="border p-2">Fila</th>
                                            {preview.encabezados?.map((enc, i) => (
                                                <th key={i} className="border p-2">{enc}</th>
                                            ))}
                                            <th className="border p-2">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.preview?.map((row, i) => (
                                            <tr key={i} className={row.valido ? '' : 'bg-red-50'}>
                                                <td className="border p-2 text-center">{row.fila}</td>
                                                {row.datos?.map((dato, j) => (
                                                    <td key={j} className="border p-2">{dato || '-'}</td>
                                                ))}
                                                <td className="border p-2 text-center">
                                                    {row.valido ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                            <span className="text-xs text-red-600">{row.error}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Botón Importar */}
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleImportar}
                                    disabled={importando || preview.tiene_errores}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                                >
                                    {importando ? (
                                        'Importando...'
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Confirmar Importación
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Resultado de Importación */}
                    {resultado && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-800">
                                <CheckCircle className="w-5 h-5" />
                                Importación Completada
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-3xl font-bold text-gray-800">{resultado.total_registros}</p>
                                    <p className="text-sm text-gray-600">Total</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-green-600">{resultado.exitosos}</p>
                                    <p className="text-sm text-gray-600">Exitosos</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-red-600">{resultado.fallidos}</p>
                                    <p className="text-sm text-gray-600">Fallidos</p>
                                </div>
                            </div>

                            {resultado.errores_detalle && resultado.errores_detalle.length > 0 && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-medium text-red-700">Ver errores ({resultado.errores_detalle.length})</summary>
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {resultado.errores_detalle.map((err, i) => (
                                            <li key={i} className="text-red-600">
                                                Fila {err.fila}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Historial */}
                    <div className="mt-6">
                        <button
                            onClick={handleCargarHistorial}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                            <History className="w-4 h-4" />
                            Ver Historial de Importaciones
                        </button>

                        {mostrarHistorial && historial.length > 0 && (
                            <div className="mt-4 border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Fecha</th>
                                            <th className="p-3 text-left">Tipo</th>
                                            <th className="p-3 text-center">Total</th>
                                            <th className="p-3 text-center">Exitosos</th>
                                            <th className="p-3 text-center">Fallidos</th>
                                            <th className="p-3 text-left">Archivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map((item, i) => (
                                            <tr key={i} className="border-t hover:bg-gray-50">
                                                <td className="p-3">{new Date(item.fecha_importacion).toLocaleString()}</td>
                                                <td className="p-3 capitalize">{item.tipo_importacion}</td>
                                                <td className="p-3 text-center">{item.total_registros}</td>
                                                <td className="p-3 text-center text-green-600 font-medium">{item.exitosos}</td>
                                                <td className="p-3 text-center text-red-600 font-medium">{item.fallidos}</td>
                                                <td className="p-3 text-sm text-gray-600">{item.archivo_original}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportarUsuariosPage;
