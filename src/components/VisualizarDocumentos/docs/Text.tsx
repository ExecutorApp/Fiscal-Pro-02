import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';

interface TextData {
  content: string;
  lines: string[];
  encoding: string;
  size: number;
}

const TextViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'document.txt',
  width = '100%',
  height = '100%',
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [textData, setTextData] = useState<TextData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ line: number; start: number; end: number }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);

  
  const textRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Criar URL do arquivo
  const fileUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'text/plain');
    } catch (err) {
      setError('Erro ao processar arquivo de texto');
      return '';
    }
  }, [src]);

  // Cleanup da URL quando componente desmonta
  useEffect(() => {
    return () => {
      if (src instanceof File || (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer')) {
        revokeObjectURLBySource(src);
      }
    };
  }, [src]);

  // Detectar encoding
  const detectEncoding = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    
    // BOM UTF-8
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'utf-8';
    }
    
    // BOM UTF-16 LE
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return 'utf-16le';
    }
    
    // BOM UTF-16 BE
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return 'utf-16be';
    }
    
    // Tentar detectar UTF-8 vs Latin-1
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(buffer);
      return 'utf-8';
    } catch {
      return 'latin1';
    }
  }, []);

  // Carregar arquivo de texto
  const loadTextFile = useCallback(async () => {
    if (!fileUrl) {
      return;
    }
    setLoading(true);
    setError(undefined);

    try {
      let content: string;
      let detectedEncoding = 'utf-8';
      let size = 0;
      
      if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
        const fileSource = src as File;
        size = fileSource.size;
        const buffer = await fileSource.arrayBuffer();
        detectedEncoding = detectEncoding(buffer);
        const decoder = new TextDecoder(detectedEncoding);
        content = decoder.decode(buffer);
      } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer') {
        size = src.byteLength;
        detectedEncoding = detectEncoding(src);
        const decoder = new TextDecoder(detectedEncoding);
        content = decoder.decode(src);
      } else if (typeof src === 'string') {
        if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/')) {
          const response = await fetch(src);
          const buffer = await response.arrayBuffer();
          size = buffer.byteLength;
          detectedEncoding = detectEncoding(buffer);
          const decoder = new TextDecoder(detectedEncoding);
          content = decoder.decode(buffer);
        } else {
          content = src;
          size = new Blob([content]).size;
        }
      } else {
        throw new Error('Formato de fonte não suportado');
      }

      // Dividir em linhas
      const lines = content.split(/\r?\n/);
      
      const newTextData = {
        content,
        lines,
        encoding: detectedEncoding,
        size
      };
      
      setTextData(newTextData);

      setLoading(false);
      onLoad?.();
    } catch (err) {
      setLoading(false);
      setError('Erro ao carregar arquivo de texto');
      onError?.(err);
    }
  }, [fileUrl, src, detectEncoding, onLoad, onError]);

  // Efeito para carregar arquivo
  useEffect(() => {
    if (!src) {
      return;
    }
    loadTextFile();
  }, [loadTextFile, src]);

  // Handler de download
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [fileUrl, fileName, onDownload]);

  // Busca de texto
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    
    if (!text.trim() || !textData) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: Array<{ line: number; start: number; end: number }> = [];
    const searchLower = text.toLowerCase();
    
    textData.lines.forEach((line, lineIndex) => {
      const lineLower = line.toLowerCase();
      let startIndex = 0;
      
      while (true) {
        const foundIndex = lineLower.indexOf(searchLower, startIndex);
        if (foundIndex === -1) break;
        
        results.push({
          line: lineIndex,
          start: foundIndex,
          end: foundIndex + text.length
        });
        
        startIndex = foundIndex + 1;
      }
    });
    
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    // Rolar para primeiro resultado
    if (results.length > 0) {
      scrollToLine(results[0].line);
    }
  }, [textData]);



  // Rolar para linha específica
  const scrollToLine = useCallback((lineNumber: number) => {
    if (textRef.current && containerRef.current) {
      const lineHeight = fontSize * 1.5; // Aproximação da altura da linha
      const scrollTop = lineNumber * lineHeight;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [fontSize]);

  // Controles de zoom (tamanho da fonte)
  const handleZoomIn = useCallback(() => {
    setFontSize(prev => Math.min(24, prev + 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFontSize(prev => Math.max(8, prev - 2));
  }, []);

  const handleResetZoom = useCallback(() => {
    setFontSize(14);
  }, []);

  // Renderizar conteúdo com destaque de busca
  const renderContent = useMemo(() => {
    if (!textData) return '';
    
    if (searchResults.length === 0 || !searchText) {
      return textData.lines.map((line, index) => (
        <div key={index} className="flex">
          {showLineNumbers && (
            <span className="text-gray-400 text-right pr-4 select-none" style={{ minWidth: '4em' }}>
              {index + 1}
            </span>
          )}
          <span>{line || '\u00A0'}</span>
        </div>
      ));
    }
    
    // Renderizar com destaque de busca
    return textData.lines.map((line, lineIndex) => {
      const lineResults = searchResults.filter(result => result.line === lineIndex);
      
      if (lineResults.length === 0) {
        return (
          <div key={lineIndex} className="flex">
            {showLineNumbers && (
              <span className="text-gray-400 text-right pr-4 select-none" style={{ minWidth: '4em' }}>
                {lineIndex + 1}
              </span>
            )}
            <span>{line || '\u00A0'}</span>
          </div>
        );
      }
      
      // Dividir linha em segmentos com destaque
      const segments: React.ReactNode[] = [];
      let lastEnd = 0;
      
      lineResults.forEach((result, resultIndex) => {
        // Texto antes do resultado
        if (result.start > lastEnd) {
          segments.push(line.substring(lastEnd, result.start));
        }
        
        // Texto destacado
        const isCurrentResult = searchResults.findIndex(r => 
          r.line === lineIndex && r.start === result.start
        ) === currentSearchIndex;
        
        segments.push(
          <mark 
            key={`highlight-${resultIndex}`}
            className={isCurrentResult ? 'bg-orange-300' : 'bg-yellow-200'}
          >
            {line.substring(result.start, result.end)}
          </mark>
        );
        
        lastEnd = result.end;
      });
      
      // Texto após último resultado
      if (lastEnd < line.length) {
        segments.push(line.substring(lastEnd));
      }
      
      return (
        <div key={lineIndex} className="flex">
          {showLineNumbers && (
            <span className="text-gray-400 text-right pr-4 select-none" style={{ minWidth: '4em' }}>
              {lineIndex + 1}
            </span>
          )}
          <span>{segments.length > 0 ? segments : '\u00A0'}</span>
        </div>
      );
    });
  }, [textData, searchResults, searchText, currentSearchIndex, showLineNumbers]);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Toolbar customizada
  const toolbar = (
    <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
      <Toolbar
        zoomIn={handleZoomIn}
        zoomOut={handleZoomOut}
        resetZoom={handleResetZoom}
        download={handleDownload}
        allowDownload={allowDownload}
        searchValue={searchText}
        onSearchChange={(value: string) => setSearchText(value)}
        onSearchSubmit={handleSearch}
      />
      
      <div className="flex items-center gap-2 ml-auto text-sm">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showLineNumbers}
            onChange={(e) => setShowLineNumbers(e.target.checked)}
          />
          Números de linha
        </label>
        
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={wordWrap}
            onChange={(e) => setWordWrap(e.target.checked)}
          />
          Quebra de linha
        </label>
        

      </div>
    </div>
  );

  return (
    <ViewerShell
      toolbar={toolbar}
      loading={loading}
      error={error}
      onRetry={loadTextFile}
      className={className}
    >
      <div 
        ref={containerRef}
        className="w-full h-full overflow-auto bg-white"
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      >
        <pre
          ref={textRef}
          className={`p-4 font-mono text-sm leading-relaxed ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {renderContent}
        </pre>
      </div>
      
      {/* Informações do arquivo */}
      {textData && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {textData.lines.length} linhas • {formatFileSize(textData.size)} • {textData.encoding}
          {searchResults.length > 0 && ` • ${searchResults.length} resultados`}
        </div>
      )}
    </ViewerShell>
  );
};

export default TextViewer;