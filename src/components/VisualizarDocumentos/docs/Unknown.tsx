import React, { useState, useCallback, useEffect } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';
import { FileQuestion, Download, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

const UnknownViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'unknown-file',
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
  const [previewAttempted, setPreviewAttempted] = useState(false);

  // Criar URL do arquivo
  const fileUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, mimeType || 'application/octet-stream');
    } catch (err) {
      setError('Erro ao processar arquivo');
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

  // Extrair informações do arquivo
  const extractFileInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let info: FileInfo;

      if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
        const fileSource = src as File;
        info = {
          name: fileSource.name,
          size: fileSource.size,
          type: fileSource.type || mimeType || 'application/octet-stream',
          lastModified: fileSource.lastModified
        };
      } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer') {
        info = {
          name: fileName,
          size: (src as ArrayBuffer).byteLength,
          type: mimeType || 'application/octet-stream'
        };
      } else if (typeof src === 'string') {
        // Para URLs, tentar obter informações via fetch HEAD
        try {
          const response = await fetch(src, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          const contentType = response.headers.get('content-type');
          
          info = {
            name: fileName,
            size: contentLength ? parseInt(contentLength, 10) : 0,
            type: contentType || mimeType || 'application/octet-stream'
          };
        } catch {
          // Fallback se HEAD falhar
          info = {
            name: fileName,
            size: 0,
            type: mimeType || 'application/octet-stream'
          };
        }
      } else {
        throw new Error('Tipo de fonte não suportado');
      }

      setFileInfo(info);
      setLoading(false);
      onLoad?.();
    } catch (err) {
      setLoading(false);
      setError('Erro ao analisar arquivo');
      onError?.(err);
    }
  }, [src, fileName, mimeType, onLoad, onError]);

  // Efeito para extrair informações
  useEffect(() => {
    extractFileInfo();
  }, [extractFileInfo]);

  // Handler de download
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileInfo?.name || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [fileUrl, fileName, fileInfo, onDownload]);

  // Tentar preview como texto
  const handlePreviewAsText = useCallback(async () => {
    if (!fileUrl || previewAttempted) return;
    
    setPreviewAttempted(true);
    
    try {
      const response = await fetch(fileUrl);
      const text = await response.text();
      
      // Verificar se parece ser texto legível
      const printableChars = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').length;
      const totalChars = text.length;
      const printableRatio = printableChars / totalChars;
      
      if (printableRatio > 0.7 && totalChars < 50000) {
        // Parece ser texto, mostrar preview
        return text.substring(0, 1000);
      }
    } catch {
      // Ignorar erro
    }
    
    return null;
  }, [fileUrl, previewAttempted]);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Obter ícone baseado no tipo MIME
  const getFileIcon = useCallback((type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('text/')) return FileText;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type === 'application/pdf') return FileText;
    return File;
  }, []);

  // Sugerir visualizadores alternativos
  const getSuggestions = useCallback((type: string) => {
    const suggestions: string[] = [];
    
    if (type.startsWith('image/')) {
      suggestions.push('Tente abrir com um visualizador de imagens');
    } else if (type.startsWith('text/') || type.includes('json') || type.includes('xml')) {
      suggestions.push('Tente abrir como arquivo de texto');
    } else if (type.includes('pdf')) {
      suggestions.push('Tente abrir com um leitor de PDF');
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      suggestions.push('Tente abrir com um editor de planilhas');
    } else if (type.startsWith('video/')) {
      suggestions.push('Tente abrir com um player de vídeo');
    } else if (type.startsWith('audio/')) {
      suggestions.push('Tente abrir com um player de áudio');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Faça o download para abrir com um aplicativo apropriado');
    }
    
    return suggestions;
  }, []);

  // Toolbar
  const toolbar = (
    <Toolbar
      download={handleDownload}
      allowDownload={allowDownload}
    />
  );

  const [textPreview, setTextPreview] = useState<string | null>(null);

  // Tentar preview quando componente carrega
  useEffect(() => {
    if (fileInfo && !previewAttempted) {
      handlePreviewAsText().then(setTextPreview);
    }
  }, [fileInfo, previewAttempted, handlePreviewAsText]);

  if (!fileInfo) {
    return (
      <ViewerShell
        toolbar={toolbar}
        loading={loading}
        error={error}
        onRetry={extractFileInfo}
        className={className}
      />
    );
  }

  const FileIcon = getFileIcon(fileInfo.type);
  const suggestions = getSuggestions(fileInfo.type);

  return (
    <ViewerShell
      toolbar={toolbar}
      loading={loading}
      error={error}
      onRetry={extractFileInfo}
      className={className}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          {/* Ícone do arquivo */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileQuestion className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          {/* Informações do arquivo */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 break-all">
              {fileInfo.name}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="font-mono">{fileInfo.type}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Tamanho:</span>
                <span>{formatFileSize(fileInfo.size)}</span>
              </div>
              
              {fileInfo.lastModified && (
                <div className="flex justify-between">
                  <span>Modificado:</span>
                  <span>{new Date(fileInfo.lastModified).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview de texto se disponível */}
          {textPreview && (
            <div className="mb-6 p-4 bg-gray-50 rounded border text-left">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-hidden">
                {textPreview}
                {textPreview.length >= 1000 && '...'}
              </pre>
            </div>
          )}

          {/* Sugestões */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Sugestões:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Botão de download */}
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Fazer Download
            </button>
          )}
        </div>

        {/* Informações técnicas */}
        <div className="mt-6 text-xs text-gray-500 text-center max-w-md">
          <p>
            Este tipo de arquivo não possui um visualizador específico disponível.
            Você pode fazer o download para abrir com um aplicativo apropriado.
          </p>
        </div>
      </div>
    </ViewerShell>
  );
};

export default UnknownViewer;