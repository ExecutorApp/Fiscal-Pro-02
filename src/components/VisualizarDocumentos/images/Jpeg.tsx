import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';

const JpegViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'image.jpg',
  width = '100%',
  height = '100%',
  fit = 'contain',
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Criar URL da imagem
  const imageUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'image/jpeg');
    } catch (err) {
      setError('Erro ao processar imagem');
      return '';
    }
  }, [src]);

  // Cleanup da URL quando componente desmonta
  useEffect(() => {
    return () => {
      if ((src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') || (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer')) {
      revokeObjectURLBySource(src);
    }
    };
  }, [src]);

  // Handlers de zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(500, prev + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(25, prev - 25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(100);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Handler de rotação
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Handler de download
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      // Download padrão
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [imageUrl, fileName, onDownload]);

  // Handlers da imagem
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setLoading(false);
    setError(null);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError('Erro ao carregar imagem JPEG');
    onError?.(new Error('Erro ao carregar imagem JPEG'));
  }, [onError]);

  // Handlers de drag para pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  }, [zoom, translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 100) {
      setTranslate({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom com scroll do mouse
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  }, [handleZoomIn, handleZoomOut]);

  // Toolbar
  const toolbar = (
    <Toolbar
      zoomIn={handleZoomIn}
      zoomOut={handleZoomOut}
      resetZoom={handleResetZoom}
      rotate={handleRotate}
      download={handleDownload}
      allowDownload={allowDownload}
    />
  );

  // Estilos da imagem
  const imageStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectFit: fit,
    transform: `scale(${zoom / 100}) rotate(${rotation}deg) translate(${translate.x}px, ${translate.y}px)`,
    cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    maxWidth: '100%',
    maxHeight: '100%'
  };

  return (
    <ViewerShell
      toolbar={toolbar}
      loading={loading}
      error={error}
      onRetry={() => {
        setLoading(true);
        setError(null);
        if (imageRef.current) {
          imageRef.current.src = imageUrl;
        }
      }}
      className={className}
    >
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden bg-gray-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={fileName}
          style={imageStyle}
          onLoad={handleImageLoad}
          onError={handleImageError}
          decoding="async"
          loading="lazy"
          draggable={false}
        />
      </div>
      
      {/* Informações da imagem */}
      {dimensions && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {dimensions.width} × {dimensions.height} • {zoom}%
        </div>
      )}
    </ViewerShell>
  );
};

export default JpegViewer;