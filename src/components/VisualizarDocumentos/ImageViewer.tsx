/**
 * Componente ImageViewer para visualização de imagens locais
 * Gerencia carregamento de imagens via IndexedDB com fallback para Data URL
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, RotateCw, ZoomIn, ZoomOut, RefreshCw, AlertCircle } from 'lucide-react';
import { ImageMetadata, getImageURL, revokeImageURL } from '../../utils/dbImages';
import FullscreenImageViewer from './FullscreenImageViewer';

type ViewerState = 'idle' | 'loading' | 'success' | 'error';

interface ImageViewerProps {
  metadata: ImageMetadata | null;
  className?: string;
  onFullscreen?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  metadata,
  className = '',
  onFullscreen
}) => {
  const [state, setState] = useState<ViewerState>('idle');
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const loadingControllerRef = useRef<AbortController | null>(null);
  const currentUrlRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Funções auxiliares sem useCallback para evitar re-criações
  const cleanupUrl = () => {
    if (currentUrlRef.current) {
      revokeImageURL(currentUrlRef.current);
      currentUrlRef.current = '';
    }
  };

  const cancelLoading = () => {
    if (loadingControllerRef.current) {
      loadingControllerRef.current.abort();
      loadingControllerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetViewer = () => {
    setState('idle');
    setSrc('');
    setError('');
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Carregar nova imagem - SOLUÇÃO DETERMINÍSTICA RADICAL
  const loadImage = async (imageMetadata: ImageMetadata) => {
    // Iniciando carregamento da imagem
    
    // Cancelar carregamento anterior
    cancelLoading();
    cleanupUrl();
    resetViewer();
    
    // Estado resetado para loading
    setState('loading');
    
    try {
      // Carregando imagem
      
      // Usar getImageURL que carrega do IndexedDB ou fallback
      const { getImageURL } = await import('../../utils/dbImages');
      const finalUrl = await getImageURL(imageMetadata);
      
      // URL da imagem obtida
      
      // Definir a URL e aguardar o carregamento
      currentUrlRef.current = finalUrl;
      setSrc(finalUrl);
      
      // Se for dataUrl, definir sucesso imediatamente
      if (finalUrl.startsWith('data:')) {
        // DataURL detectada, carregamento imediato
        setState('success');
      } else {
        // URL externa, aguardando carregamento
        // Timeout de segurança para evitar loop infinito
        timeoutRef.current = setTimeout(() => {
          // Timeout atingido, assumindo sucesso
          setState('success');
        }, 5000);
      }
      
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
      setState('error');
      setError('Erro ao carregar imagem');
    }
  };

  // Effect para carregar imagem quando metadata muda
  useEffect(() => {
    if (metadata) {
      loadImage(metadata);
    } else {
      cancelLoading();
      cleanupUrl();
      resetViewer();
    }
  }, [metadata]); // Removido loadImage das dependências para evitar loop

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (loadingControllerRef.current) {
        loadingControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (currentUrlRef.current) {
        revokeImageURL(currentUrlRef.current);
      }
    };
  }, []); // Cleanup direto sem dependências

  // Handlers da imagem
  const handleImageLoad = () => {
    // Imagem carregada com sucesso
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState('success');
  };

  const handleImageError = () => {
    // Erro ao carregar imagem
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState('error');
    setError('Falha ao carregar a imagem. Verifique se o arquivo ainda existe.');
  };

  // Controles de zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Controles de rotação
  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Tela cheia
  const handleFullscreen = () => {
    if (src && state === 'success') {
      setIsFullscreen(true);
      onFullscreen?.();
    }
  };

  // Tentar novamente
  const handleRetry = () => {
    if (metadata) {
      loadImage(metadata);
    }
  };



  return (
    <>
      <div className={`relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-full ${className}`}>
        {/* Estado: Idle */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm">Selecione uma imagem para visualizar</p>
            </div>
          </div>
        )}

        {/* Estado: Loading */}
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Carregando imagem...</p>
            </div>
          </div>
        )}

        {/* Estado: Error */}
        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto p-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar imagem</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Estado: Success - Renderizar imagem quando há src */}
        {src && (
          <div className="absolute inset-0">
            <img
              ref={imgRef}
              src={src}
              alt={metadata?.name || 'Imagem'}
              className="w-full h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          </div>
        )}
        
        {/* Toolbar - apenas quando imagem carregada com sucesso */}
        {state === 'success' && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium"
              title="Resetar zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button
              onClick={handleRotateRight}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Girar para direita"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Informações da imagem */}
        {metadata && state === 'success' && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
            <div className="font-medium">{metadata.name}</div>
            <div className="text-xs text-gray-300">
              {metadata.type.split('/')[1].toUpperCase()} • {(metadata.size / 1024).toFixed(1)} KB
            </div>
          </div>
        )}
      </div>

      {/* FullscreenImageViewer */}
       <FullscreenImageViewer
         isOpen={isFullscreen}
         src={src}
         metadata={metadata}
         onClose={() => setIsFullscreen(false)}
       />
    </>
  );
};

export default ImageViewer;