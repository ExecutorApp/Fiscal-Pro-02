import React, { useEffect } from 'react';
import { 
  Download,
  Plus,
  Minus,
  Maximize2,
  X
} from 'lucide-react';

interface ExcelToolbarProps {
  fileName?: string;
  currentSheetName?: string;
  currentSheetIndex?: number;
  totalSheets?: number;
  onPrevSheet?: () => void;
  onNextSheet?: () => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onDownload?: () => void;
  allowDownload?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

const ExcelToolbar: React.FC<ExcelToolbarProps> = ({
  fileName = 'Documento',
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
  onDownload,
  allowDownload = true,
  onFullscreen,
  isFullscreen = false,
  className = ''
}) => {
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onZoomIn?.();
      } else if (e.key === '-') {
        e.preventDefault();
        onZoomOut?.();
      }
      
      // Fullscreen
      else if (e.key === 'F11') {
        e.preventDefault();
        onFullscreen?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onFullscreen]);

  return (
    <div className={`flex items-center justify-between gap-4 p-3 border-b border-gray-200 ${className}`}>
      {/* Informações do arquivo - Esquerda */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate pr-[10px]">{fileName}</h3>
        </div>
      </div>

      {/* Controles de zoom e botões - Direita */}
      <div className="flex items-center gap-4">
        {/* Controles de zoom */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
          <button
            onClick={onZoomOut}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors bg-white border border-gray-300"
            title="Diminuir Zoom (-)"
            aria-label="Diminuir zoom"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <div className="px-3 py-[6px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded min-w-[60px] text-center">
            {zoomLevel}%
          </div>
          
          <button
            onClick={onZoomIn}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors bg-white border border-gray-300"
            title="Aumentar Zoom (+)"
            aria-label="Aumentar zoom"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Controles da direita */}
        <div className="flex items-center gap-1">
          {/* Fullscreen */}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors bg-white border border-gray-300"
              title="Tela Cheia (F11)"
              aria-label="Abrir em tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Download */}
          {onDownload && allowDownload && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors bg-white border border-gray-300"
              title="Download"
              aria-label="Baixar arquivo"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Botão para sair da tela cheia */}
          {isFullscreen && onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors bg-white border border-gray-300"
              title="Sair da tela cheia"
              aria-label="Sair da tela cheia"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelToolbar;