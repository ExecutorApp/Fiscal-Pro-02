import React, { useState, useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import VisualizarDocumento from '../VisualizarDocumentos/VisualizarDocumento';

interface FullscreenViewerProps {
  isOpen: boolean;
  src: string | File;
  fileName: string;
  mimeType?: string;
  onClose: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  isOpen,
  src,
  fileName,
  mimeType,
  onClose
}) => {
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide dos controles
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    setShowControls(true);
    
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Mostrar controles ao mover o mouse
  const handleMouseMove = useCallback(() => {
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  // Iniciar timer quando abrir
  useEffect(() => {
    if (isOpen) {
      resetHideControlsTimer();
    }
    
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isOpen, resetHideControlsTimer]);

  // Download do arquivo
  const handleDownload = () => {
    if (src && fileName) {
      if (typeof src === 'string') {
        const link = document.createElement('a');
        link.href = src;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Para File objects
        const url = URL.createObjectURL(src);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Substituir revogação imediata por agendada para evitar net::ERR_ABORTED
        // @ts-ignore
        if (typeof window.requestIdleCallback === 'function') {
          // @ts-ignore
          window.requestIdleCallback(() => {
            try { URL.revokeObjectURL(url); } catch {}
          }, { timeout: 2000 });
        } else {
          window.setTimeout(() => {
            try { URL.revokeObjectURL(url); } catch {}
          }, 1000);
        }
      }
    }
    resetHideControlsTimer();
  };

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Overlay para fechar */}
      <div 
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      
      {/* Container do conteúdo com margem de 10px */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-[10px]"
        onMouseMove={handleMouseMove}
      >
        <div className="w-full h-full bg-white rounded-lg overflow-hidden">
          <VisualizarDocumento
            src={src}
            fileName={fileName}
            mimeType={mimeType}
            width="100%"
            height="100%"
            fit="contain"
            allowDownload={false}
          />
        </div>
      </div>
      
      {/* Header com controles */}
      <div className={`absolute top-[10px] left-[10px] right-[10px] bg-gradient-to-b from-black/70 to-transparent p-6 transition-opacity duration-300 rounded-t-lg ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-lg font-medium">{fileName}</h3>
            <p className="text-sm text-gray-300">
              {mimeType ? mimeType.split('/')[1].toUpperCase() : 'Arquivo'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Instruções */}
      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <p>ESC para fechar • Clique fora do conteúdo para sair</p>
      </div>
    </div>
  );
};

export default FullscreenViewer;