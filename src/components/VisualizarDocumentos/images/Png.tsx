import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';

const PngViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'image.png',
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
  const [hasTransparency, setHasTransparency] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Criar URL da imagem
  const imageUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'image/png');
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

  // Detectar transparência em PNG
  const detectTransparency = useCallback((img: HTMLImageElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.min(img.naturalWidth, 100);
      canvas.height = Math.min(img.naturalHeight, 100);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Verificar se algum pixel tem alpha < 255
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          setHasTransparency(true);
          return;
        }
      }
      setHasTransparency(false);
    } catch (error) {
      // Se não conseguir detectar, assume que pode ter transparência
      setHasTransparency(true);
    }
  }, []);

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
    detectTransparency(img);
    setLoading(false);
    setError(null);
    onLoad?.();
  }, [onLoad, detectTransparency]);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError('Erro ao carregar imagem PNG');
    onError?.(new Error('Erro ao carregar imagem PNG'));
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

  // Background pattern para mostrar transparência
  const backgroundStyle = hasTransparency ? {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%), 
      linear-gradient(-45deg, #ccc 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #ccc 75%), 
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  } : {};

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
        style={backgroundStyle}
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
          {hasTransparency && ' • Transparência'}
        </div>
      )}
    </ViewerShell>
  );
};

export default PngViewer;