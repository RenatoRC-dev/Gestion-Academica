import { useState } from 'react';
import { Download } from 'lucide-react';
import importacionService from '../../services/gestion-usuarios/importacionService';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader.jsx';

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
    <div className="space-y-6">
      <PageHeader
        title="Importación masiva de docentes"
        subtitle="Sube un Excel o CSV para registrar múltiples docentes a la vez"
      />

      {alert.show && <Alert type={alert.type} message={alert.message} />}

      <section className="section-card space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Plantilla oficial</h2>
            <p className="text-sm text-gray-600">
              Descarga la plantilla que incluye CI, correo institucional y datos base. La contraseña de inicio se iguala al CI.
            </p>
          </div>
          <button
            onClick={descargarPlantilla}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition"
          >
            <Download className="w-4 h-4" />
            Descargar plantilla
          </button>
        </div>

        <div className="filters-card space-y-4">
          <div>
            <p className="filter-label">Carga el archivo</p>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                id="archivo-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onArchivoSeleccionado}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('archivo-input')?.click()}
                className="btn-secondary px-6 py-2 rounded-2xl"
              >
                Seleccionar archivo
              </button>
              <button
                onClick={validarArchivo}
                disabled={!archivo || validando}
                className="btn-secondary px-6 py-2 rounded-2xl"
              >
                {validando ? 'Validando...' : 'Validar archivo'}
              </button>
              <div className="text-sm text-gray-500">
                {archivo ? archivo.name : 'Ningún archivo seleccionado'}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Extensiones permitidas: .xlsx / .xls / .csv · Máximo 5 MB · Tamaño actual:{' '}
              {archivo ? `${(archivo.size / 1024).toFixed(2)} KB` : 'N/A'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={importarArchivo}
              disabled={!archivo || importando || preview?.tiene_errores}
              className="btn-primary px-5 py-3 flex-1 min-w-[200px]"
            >
              {importando ? 'Importando...' : 'Importar docentes'}
            </button>
            <button
              onClick={() => mensaje('info', 'Historial próximo a implementarse.')}
              className="btn-secondary px-5 py-3 flex-1 min-w-[200px]"
            >
              Ver historial
            </button>
          </div>
        </div>

        {preview && (
          <div className="filters-card space-y-3">
            <p className="text-sm text-gray-700 font-semibold">
              {preview.tiene_errores
                ? `Se detectaron ${preview.errores_preview?.length || 0} error(es). Corrige los registros señalados.`
                : `Archivo validado (${preview.total_registros || 0} registros listos).`}
            </p>
            {preview.errores_preview?.length > 0 && (
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-red-600">Errores detallados</p>
                <ul className="list-disc list-inside space-y-1">
                  {preview.errores_preview.map((error) => (
                    <li key={`${error.fila}-${error.error}`}>
                      Fila {error.fila}: {error.error}. Si es CI o teléfono, escríbelo como texto para evitar conversiones automáticas.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {resultados && (
          <div className="filters-card bg-blue-50 border-blue-100">
            <p className="text-sm text-blue-800">
              {resultados.mensaje || 'Importación procesada. Revisa el historial para ver los detalles.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ImportarUsuariosPage;
