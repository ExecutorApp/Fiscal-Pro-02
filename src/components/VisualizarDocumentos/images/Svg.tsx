import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';

const SvgViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'image.svg',
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
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [useInline, setUseInline] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Processar fonte SVG
  useEffect(() => {
    const processSvg = async () => {
      setLoading(true);
      setError(null);

      try {
        if (typeof src === 'string') {
          if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
            // URL - usar como img
            setUseInline(false);
          } else {
            // Texto SVG - usar inline
            setSvgContent(src);
            setUseInline(true);
          }
        } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
          // Ler conteúdo do arquivo
          const fileSource = src as File;
          const text = await fileSource.text();
          if (text.trim().startsWith('<svg')) {
            setSvgContent(text);
            setUseInline(true);
          } else {
            setUseInline(false);
          }
        } else {
          // ArrayBuffer - converter para blob URL
          setUseInline(false);
        }
      } catch (err) {
        setError('Erro ao processar SVG');
        onError?.(err);
      }
    };

    processSvg();
  }, [src, onError]);

  // Criar URL quando necessário
  const svgUrl = React.useMemo(() => {
    if (useInline) return '';
    
    try {
      return sourceToURL(src, 'image/svg+xml');
    } catch (err) {
      setError('Erro ao processar SVG');
      return '';
    }
  }, [src, useInline]);

  // Cleanup da URL quando componente desmonta
  useEffect(() => {
    return () => {
      if (!useInline && ((src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') || (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer'))) {
        revokeObjectURLBySource(src);
      }
    };
  }, [src, useInline]);

  // Extrair dimensões do SVG inline
  const extractSvgDimensions = useCallback((svgElement: SVGSVGElement) => {
    try {
      const viewBox = svgElement.viewBox.baseVal;
      if (viewBox.width && viewBox.height) {
        setDimensions({ width: viewBox.width, height: viewBox.height });
        return;
      }

      const width = svgElement.width.baseVal.value || svgElement.clientWidth;
      const height = svgElement.height.baseVal.value || svgElement.clientHeight;
      
      if (width && height) {
        setDimensions({ width, height });
      }
    } catch (error) {
      // Não conseguiu extrair dimensões
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
      let downloadUrl = svgUrl;
      
      if (useInline && svgContent) {
        // Criar blob para SVG inline
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (useInline && downloadUrl !== svgUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    }
  }, [svgUrl, fileName, onDownload, useInline, svgContent]);

  // Handlers para SVG inline
  const handleSvgLoad = useCallback(() => {
    if (svgRef.current) {
      extractSvgDimensions(svgRef.current);
    }
    setLoading(false);
    setError(null);
    onLoad?.();
  }, [onLoad, extractSvgDimensions]);

  // Handlers para img
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setLoading(false);
    setError(null);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError('Erro ao carregar SVG');
    onError?.(new Error('Erro ao carregar SVG'));
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

  // Effect para carregar SVG inline
  useEffect(() => {
    if (useInline && svgContent) {
      // Aguardar próximo tick para SVG ser renderizado
      const timer = setTimeout(() => {
        handleSvgLoad();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [useInline, svgContent, handleSvgLoad]);

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

  // Estilos comuns
  const commonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
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
        if (useInline) {
          handleSvgLoad();
        } else if (imgRef.current) {
          imgRef.current.src = svgUrl;
        }
      }}
      className={className}
    >
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {useInline && svgContent ? (
          <div
            style={commonStyle}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            onLoad={handleSvgLoad}
          />
        ) : (
          <img
            ref={imgRef}
            src={svgUrl}
            alt={fileName}
            style={{
              ...commonStyle,
              objectFit: fit
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            decoding="async"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
      
      {/* Informações do SVG */}
      {dimensions && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {dimensions.width} × {dimensions.height} • {zoom}%
          {useInline && ' • Inline'}
        </div>
      )}
    </ViewerShell>
  );
};

export default SvgViewer;