import React, { useState, useCallback, useEffect } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import ExcelToolbar from '../common/ExcelToolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';
import { FileText, Download, ExternalLink, Info, AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

interface ConversionResult {
  html: string;
  messages: Array<{ type: string; message: string; }>;
}

const WordViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'document.docx',
  mimeType,
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Criar URL do arquivo
  const fileUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (err) {
      setError('Erro ao processar documento Word');
      return '';
    }
  }, [src, mimeType]);

  // Cleanup da URL quando componente desmonta
  useEffect(() => {
    return () => {
      if ((src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') || (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer')) {
        revokeObjectURLBySource(src);
      }
    };
  }, [src]);

  // Converter documento Word para HTML usando Mammoth.js
  const convertWordDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConversionResult(null);

    try {
      let info: FileInfo;
      let mammothInput: any;

      if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
        const fileSource = src as File;
        info = {
          name: fileSource.name,
          size: fileSource.size,
          type: fileSource.type || mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          lastModified: fileSource.lastModified
        };
        
        // Converter File para ArrayBuffer para Mammoth
        const arrayBuffer = await fileSource.arrayBuffer();
        mammothInput = { arrayBuffer };
      } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer') {
        const arrayBuffer = src as ArrayBuffer;
        info = {
          name: fileName,
          size: arrayBuffer.byteLength,
          type: mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        mammothInput = { arrayBuffer };
      } else if (typeof src === 'string') {
        // Para URLs, fazer fetch do arquivo
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Erro ao carregar documento: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        info = {
          name: fileName,
          size: contentLength ? parseInt(contentLength, 10) : arrayBuffer.byteLength,
          type: contentType || mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        mammothInput = { arrayBuffer };
      } else {
        throw new Error('Tipo de fonte não suportado');
      }

      setFileInfo(info);

      // Verificar se é um arquivo .docx (Mammoth só suporta .docx)
      const isDocx = info.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     info.name.toLowerCase().endsWith('.docx');
      
      if (!isDocx) {
        throw new Error('Apenas arquivos .docx são suportados para visualização. Arquivos .doc precisam ser convertidos.');
      }

      // Converter usando Mammoth.js
      const result = await mammoth.convertToHtml(mammothInput, {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh"
        ],
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: false
      });

      setConversionResult({
        html: result.value,
        messages: result.messages
      });
      
      setLoading(false);
      onLoad?.();
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao converter documento Word';
      setError(errorMessage);
      onError?.(err);
    }
  }, [src, fileName, mimeType, onLoad, onError]);

  // Carregar e converter documento
  useEffect(() => {
    convertWordDocument();
  }, [convertWordDocument]);

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar data
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Determinar se é .doc ou .docx
  const getDocumentType = (): string => {
    if (fileInfo?.type === 'application/msword' || fileName.toLowerCase().endsWith('.doc')) {
      return 'Microsoft Word 97-2003 (.doc)';
    }
    return 'Microsoft Word (.docx)';
  };

  // Handler de download
  const handleDownload = useCallback(() => {
    if (!fileUrl || !fileInfo) return;

    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileInfo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload?.();
    } catch (err) {
      console.error('Erro ao fazer download:', err);
    }
  }, [fileUrl, fileInfo, onDownload]);

  // Handler de retry
  const handleRetry = useCallback(() => {
    convertWordDocument();
  }, [convertWordDocument]);

  // Toggle entre HTML e texto simples
  const toggleView = useCallback(() => {
    setShowRawText(prev => !prev);
  }, [showRawText]);

  // Funções de controle de zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  }, []);

  // Função de fullscreen
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      
      // Fullscreen
      else if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFullscreen]);

  // Toolbar com ExcelToolbar
  const toolbar = (
    <div className="flex flex-col">
      <ExcelToolbar
        fileName={fileInfo?.name || fileName}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onDownload={allowDownload ? handleDownload : undefined}
        allowDownload={allowDownload}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
      />

    </div>
  );

  if (loading) {
    return (
      <ViewerShell
        toolbar={toolbar}
        loading={true}
        loadingMessage="Convertendo documento Word..."
        className={className}
      >
        <div />
      </ViewerShell>
    );
  }

  if (error) {
    return (
      <ViewerShell
        toolbar={toolbar}
        error={error}
        onRetry={handleRetry}
        className={className}
      >
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
          {/* Fallback para arquivos .doc ou outros erros */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {fileInfo?.name || fileName}
            </h2>
            <p className="text-gray-600 mb-4">
              {getDocumentType()}
            </p>
            
            {fileInfo && (
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  <span>Tamanho: {formatFileSize(fileInfo.size)}</span>
                </div>
                {fileInfo.lastModified && (
                  <div className="flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    <span>Modificado: {formatDate(fileInfo.lastModified)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de ação para fallback */}
          <div className="flex gap-3">
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Documento
              </button>
            )}
            
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em Nova Aba
            </button>
          </div>
        </div>
      </ViewerShell>
    );
  }

  if (!conversionResult) {
    return (
      <ViewerShell
        toolbar={toolbar}
        className={className}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Nenhum conteúdo disponível</p>
        </div>
      </ViewerShell>
    );
  }

  return (
    <ViewerShell
      toolbar={toolbar}
      className={`${className} ${isFullscreen ? '!w-screen !h-screen fixed inset-0 z-50 bg-white' : ''}`}
    >
      {/* Conteúdo do documento */}
      <div 
        className="h-full overflow-auto"
        style={isFullscreen ? { padding: '10px', margin: '0' } : {}}
      >
          {showRawText ? (
            <div className="p-6">
              <pre 
                className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded-lg"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoomLevel}%`
                }}
              >
                {conversionResult.html.replace(/<[^>]*>/g, '').trim()}
              </pre>
            </div>
          ) : (
            <div className="p-6">
              <div 
                className="prose prose-sm max-w-none"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151',
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoomLevel}%`
                }}
                dangerouslySetInnerHTML={{ __html: conversionResult.html }}
              />
            </div>
          )}
      </div>
    </ViewerShell>
  );
};

export default WordViewer;