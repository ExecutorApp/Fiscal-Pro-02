/**
 * Componente FullscreenImageViewer para visualização em tela cheia
 * Reutiliza o mesmo src do ImageViewer principal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { ImageMetadata } from '../../utils/dbImages';

interface FullscreenImageViewerProps {
  isOpen: boolean;
  src: string;
  metadata: ImageMetadata | null;
  onClose: () => void;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  isOpen,
  src,
  metadata,
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset do estado quando abrir
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setShowControls(true);
    }
  }, [isOpen]);

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
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    resetHideControlsTimer();
    
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoom, dragStart, resetHideControlsTimer]);

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

  // Controles de zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
    resetHideControlsTimer();
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
    resetHideControlsTimer();
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    resetHideControlsTimer();
  };

  // Controles de rotação
  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
    resetHideControlsTimer();
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
    resetHideControlsTimer();
  };

  // Controle de arrastar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
    resetHideControlsTimer();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download da imagem
  const handleDownload = () => {
    if (src && metadata) {
      const link = document.createElement('a');
      link.href = src;
      link.download = metadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
      {/* Overlay para fechar */}
      <div 
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      
      {/* Container da imagem */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {src && (
          <img
            ref={imgRef}
            src={src}
            alt={metadata?.name || 'Imagem'}
            className="max-w-none transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      
      {/* Header com controles */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="text-white">
            {metadata && (
              <>
                <h3 className="text-lg font-medium">{metadata.name}</h3>
                <p className="text-sm text-gray-300">
                  {metadata.type.split('/')[1].toUpperCase()} • {(metadata.size / 1024).toFixed(1)} KB
                </p>
              </>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Toolbar inferior */}
      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={handleZoomOut}
          className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
          title="Diminuir zoom"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleResetZoom}
          className="px-3 py-2 text-white hover:bg-white/20 rounded-md transition-colors text-sm font-medium min-w-[60px]"
          title="Resetar zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        
        <button
          onClick={handleZoomIn}
          className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
          title="Aumentar zoom"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-white/30 mx-2"></div>
        
        <button
          onClick={handleRotateLeft}
          className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
          title="Girar para esquerda"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleRotateRight}
          className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
          title="Girar para direita"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-white/30 mx-2"></div>
        
        <button
          onClick={handleDownload}
          className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
      
      {/* Instruções */}
      <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <p>Use a roda do mouse para zoom • Arraste para mover • ESC para fechar</p>
      </div>
    </div>
  );
};

export default FullscreenImageViewer;