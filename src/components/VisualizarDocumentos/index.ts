// Componente principal
export { default } from './VisualizarDocumento';
export { default as VisualizarDocumento } from './VisualizarDocumento';

// Viewers específicos
export { default as JpegViewer } from './images/Jpeg';
export { default as PngViewer } from './images/Png';
export { default as SvgViewer } from './images/Svg';
export { default as PdfViewer } from './docs/Pdf';
export { default as ExcelViewer } from './docs/Excel';
export { default as CsvViewer } from './docs/Csv';
export { default as TextViewer } from './docs/Text';
export { default as UnknownViewer } from './docs/Unknown';

// Componentes comuns
export { default as ViewerShell } from './common/ViewerShell';
export { default as Toolbar } from './common/Toolbar';
export { default as LoadingState } from './common/LoadingState';
export { default as ErrorState } from './common/ErrorState';

// Componentes de visualização de imagem
export { default as ImageViewer } from './ImageViewer';
export { default as FullscreenImageViewer } from './FullscreenImageViewer';

// Adaptadores e utilitários
export { resolveViewerByMimeOrExt } from './adapters/mimeMap';
export { detectMime, detectMimeSync } from './adapters/detectMime';
export { sourceToURL, toObjectURL, revokeObjectURL, revokeObjectURLBySource, revokeAllObjectURLs, useObjectURL } from './adapters/toObjectURL';

// Tipos
export type { 
  ViewerProps, 
  ViewerType, 
  MimeType, 
  ToolbarProps, 
  LoadingStateProps, 
  ErrorStateProps, 
  ViewerShellProps 
} from './types';

// Re-export do tipo principal
export type { VisualizarDocumentoProps } from './VisualizarDocumento';

// Componente de exemplo