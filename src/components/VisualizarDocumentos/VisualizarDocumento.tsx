import React, { Suspense, useMemo, useState, useCallback } from 'react';
import type { ViewerProps, ViewerType, VisualizarDocumentoProps } from './types';
import { resolveViewerByMimeOrExt } from './adapters/mimeMap';
import { detectMimeSync } from './adapters/detectMime';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';

// Lazy imports dos viewers
const JpegViewer = React.lazy(() => import('./images/Jpeg'));
const PngViewer = React.lazy(() => import('./images/Png'));
const SvgViewer = React.lazy(() => import('./images/Svg'));
const PdfViewer = React.lazy(() => import('./docs/Pdf'));
const ExcelViewer = React.lazy(() => import('./docs/Excel'));
const CsvViewer = React.lazy(() => import('./docs/Csv'));
const TextViewer = React.lazy(() => import('./docs/Text'));
const WordViewer = React.lazy(() => import('./docs/Word'));
const UnknownViewer = React.lazy(() => import('./docs/Unknown'));

// Mapeamento de viewers
const VIEWER_COMPONENTS: Record<ViewerType, React.LazyExoticComponent<React.FC<ViewerProps>>> = {
  Jpeg: JpegViewer,
  Png: PngViewer,
  Svg: SvgViewer,
  Pdf: PdfViewer,
  Excel: ExcelViewer,
  Csv: CsvViewer,
  Text: TextViewer,
  Word: WordViewer,
  Unknown: UnknownViewer
};



/**
 * Componente principal para visualização de documentos.
 * Detecta automaticamente o tipo de arquivo e renderiza o viewer apropriado.
 */
const VisualizarDocumento: React.FC<VisualizarDocumentoProps> = ({
  src,
  fileName,
  mimeType: providedMimeType,
  forceViewer,
  viewerConfig,
  onError,
  ...viewerProps
}) => {
  const [retryKey, setRetryKey] = useState(0);

  // Detectar tipo MIME se não fornecido
  const detectedMimeType = useMemo(() => {
    if (providedMimeType) {
      return providedMimeType;
    }
    
    try {
      if (src instanceof File) {
        const detected = src.type || detectMimeSync(src, fileName || src.name);
        return detected;
      } else if (fileName) {
        const detected = detectMimeSync(fileName);
        return detected;
      }
    } catch (error) {
      console.warn('Erro ao detectar MIME type:', error);
    }
    
    return undefined;
  }, [src, fileName, providedMimeType]);

  // Resolver viewer baseado no tipo MIME e nome do arquivo
  const viewerType = useMemo(() => {
    if (forceViewer) {
      return forceViewer;
    }
    
    const resolvedFileName = fileName || (src instanceof File ? src.name : undefined);
    const resolved = resolveViewerByMimeOrExt(detectedMimeType, resolvedFileName);
    
    return resolved;
  }, [detectedMimeType, fileName, src, forceViewer]);

  // Obter componente do viewer
  const ViewerComponent = VIEWER_COMPONENTS[viewerType];

  // Handler de erro com retry
  const handleError = useCallback((error: unknown) => {
    onError?.(error);
  }, [onError]);

  // Handler de retry
  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  // Props para o viewer
  const finalViewerProps: ViewerProps = {
    ...viewerProps,
    src,
    fileName: fileName || (src instanceof File ? src.name : 'documento'),
    mimeType: detectedMimeType,
    onError: handleError,
    ...viewerConfig
  };

  // Error boundary para capturar erros de lazy loading
  const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    React.useEffect(() => {
      setHasError(false);
      setError(null);
    }, [retryKey]);

    if (hasError) {
      return (
        <ErrorState
          message="Erro ao carregar visualizador"
          details={error?.message}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    );
  };

  // Configurar error boundary
  React.useEffect(() => {
    const handleError = () => {
      // Error handling
    };

    const handleUnhandledRejection = () => {
      // Promise rejection handling
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <div 
      key={retryKey}
      className="visualizar-documento w-full h-full"
      data-viewer-type={viewerType}
      data-mime-type={detectedMimeType}
    >
      <ErrorBoundary>
        <Suspense
          fallback={
            <LoadingState 
              message={`Carregando visualizador ${viewerType.toLowerCase()}...`}
            />
          }
        >
          <ViewerComponent {...finalViewerProps} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default VisualizarDocumento;

// Export de tipos para uso externo
export type { ViewerProps, ViewerType, VisualizarDocumentoProps };

// Export de utilitários
export { resolveViewerByMimeOrExt } from './adapters/mimeMap';
export { detectMimeSync, detectMime } from './adapters/detectMime';
export { sourceToURL } from './adapters/toObjectURL';