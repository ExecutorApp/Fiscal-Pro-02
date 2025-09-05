// Types comuns para todos os viewers
export interface ViewerProps {
  src: string | File | ArrayBuffer;
  fileName?: string;
  mimeType?: string;
  width?: number | string;
  height?: number | string;
  fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: (err: unknown) => void;
  onDownload?: () => void;
  allowDownload?: boolean;
  className?: string;
}

export type ViewerType = 'Jpeg' | 'Png' | 'Svg' | 'Pdf' | 'Excel' | 'Csv' | 'Text' | 'Word' | 'Unknown';

export type MimeType = 
  | 'image/jpeg'
  | 'image/png' 
  | 'image/svg+xml'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel'
  | 'text/csv'
  | 'text/plain'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/octet-stream';

export interface ToolbarProps {
  fileName?: string;
  fileType?: string;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
  download?: () => void;
  allowDownload?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  rotate?: () => void;
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  progress?: number;
  className?: string;
}

export interface ErrorStateProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

export interface ViewerShellProps {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export interface VisualizarDocumentoProps extends Omit<ViewerProps, 'mimeType'> {
  src: string | File | ArrayBuffer;
  fileName?: string;
  mimeType?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: (error: unknown) => void;
  onDownload?: () => void;
  allowDownload?: boolean;
  className?: string;
  forceViewer?: ViewerType;
  viewerConfig?: {
    initialPage?: number;
    initialSheet?: string | number;
    initialZoom?: number;
    encoding?: string;
    delimiter?: string;
    hasHeader?: boolean;
  };
}