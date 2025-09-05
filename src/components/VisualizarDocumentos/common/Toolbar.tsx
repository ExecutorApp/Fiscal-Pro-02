import React, { useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  RotateCw
} from 'lucide-react';
import type { ToolbarProps } from '../types';

const Toolbar: React.FC<ToolbarProps> = ({
  fileName,
  fileType,
  zoomIn,
  zoomOut,
  resetZoom,
  download,
  allowDownload = true,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  rotate,
  className = ''
}) => {
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn?.();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut?.();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom?.();
      }
      
      // Paginação
      else if (e.key === 'PageUp') {
        e.preventDefault();
        onPrevPage?.();
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        onNextPage?.();
      }
      

      
      // Rotação
      else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rotate?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom, onPrevPage, onNextPage, rotate]);

  return (
    <div className={`flex items-center gap-2 p-2 border-b border-gray-200 ${className}`}>
      {/* Título e tipo do arquivo */}
      <div className="flex flex-col mr-4">
        <div className="text-sm font-medium text-gray-900">
          {fileName || 'Documento'}
        </div>
        <div className="text-xs text-gray-500 uppercase">
          {fileType || 'ARQUIVO'}
        </div>
      </div>
      {/* Controles de zoom */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
        {zoomIn && (
          <button
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In (+)"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}
        
        {zoomOut && (
          <button
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out (-)"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        )}
        
        {resetZoom && (
          <button
            onClick={resetZoom}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Reset Zoom (0)"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controles de paginação */}
      {(currentPage !== undefined && totalPages !== undefined) && (
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página Anterior (Page Up)"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 px-2 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próxima Página (Page Down)"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Rotação */}
      {rotate && (
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={rotate}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Rotacionar (R)"
            aria-label="Rotacionar imagem"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Download */}
      {download && allowDownload && (
        <button
          onClick={download}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Download"
          aria-label="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toolbar;