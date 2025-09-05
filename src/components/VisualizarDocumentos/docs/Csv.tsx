import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import Toolbar from '../common/Toolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';

interface CsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
}

interface CsvConfig {
  delimiter: string;
  hasHeaders: boolean;
  encoding: string;
}

const CsvViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'data.csv',
  width = '100%',
  height = '100%',
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [config, setConfig] = useState<CsvConfig>({
    delimiter: ',',
    hasHeaders: true,
    encoding: 'utf-8'
  });
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ row: number; col: number }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Criar URL do arquivo
  const fileUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'text/csv');
    } catch (err) {
      setError('Erro ao processar arquivo CSV');
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

  // Detectar delimitador automaticamente
  const detectDelimiter = useCallback((text: string): string => {
    const delimiters = [',', ';', '\t', '|'];
    const sample = text.split('\n').slice(0, 5).join('\n');
    
    let bestDelimiter = ',';
    let maxCount = 0;
    
    delimiters.forEach(delimiter => {
      const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  }, []);

  // Parser CSV simples
  const parseCsv = useCallback((text: string, delimiter: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Aspas duplas escapadas
            current += '"';
            i++; // Pular próximo caractere
          } else {
            // Alternar estado das aspas
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          // Delimitador fora das aspas
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Adicionar última célula
      row.push(current.trim());
      rows.push(row);
    }
    
    return rows;
  }, []);

  // Carregar e processar arquivo CSV
  const loadCsvFile = useCallback(async () => {
    if (!fileUrl) return;

    setLoading(true);
    setError(null);

    try {
      let text: string;
      
      if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
        const fileSource = src as File;
        text = await fileSource.text();
      } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer') {
        const decoder = new TextDecoder(config.encoding);
        text = decoder.decode(src);
      } else if (typeof src === 'string') {
        if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
          const response = await fetch(src);
          text = await response.text();
        } else {
          text = src;
        }
      } else {
        throw new Error('Formato de fonte não suportado');
      }

      // Detectar delimitador se não especificado
      const delimiter = config.delimiter === 'auto' ? detectDelimiter(text) : config.delimiter;
      
      // Atualizar config com delimitador detectado
      setConfig(prev => ({ ...prev, delimiter }));
      
      // Fazer parse do CSV
      const parsedRows = parseCsv(text, delimiter);
      
      if (parsedRows.length === 0) {
        throw new Error('Arquivo CSV vazio');
      }
      
      // Separar cabeçalhos e dados
      let headers: string[] = [];
      let rows: string[][] = [];
      
      if (config.hasHeaders && parsedRows.length > 0) {
        headers = parsedRows[0];
        rows = parsedRows.slice(1);
      } else {
        // Gerar cabeçalhos automáticos (A, B, C, ...)
        const maxCols = Math.max(...parsedRows.map(row => row.length));
        headers = Array.from({ length: maxCols }, (_, i) => 
          String.fromCharCode(65 + (i % 26))
        );
        rows = parsedRows;
      }
      
      // Normalizar número de colunas
      const maxCols = headers.length;
      const normalizedRows = rows.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxCols) {
          normalizedRow.push('');
        }
        return normalizedRow.slice(0, maxCols);
      });
      
      setCsvData({
        headers,
        rows: normalizedRows,
        totalRows: normalizedRows.length,
        totalCols: maxCols
      });
      
      setLoading(false);
      onLoad?.();
    } catch (err) {
      setLoading(false);
      setError('Erro ao carregar arquivo CSV');
      onError?.(err);
    }
  }, [fileUrl, src, config, detectDelimiter, parseCsv, onLoad, onError]);

  // Efeito para carregar arquivo
  useEffect(() => {
    loadCsvFile();
  }, [loadCsvFile]);

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
    
    if (!text.trim() || !csvData) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: Array<{ row: number; col: number }> = [];
    const searchLower = text.toLowerCase();
    
    // Buscar nos cabeçalhos
    csvData.headers.forEach((header, colIndex) => {
      if (header.toLowerCase().includes(searchLower)) {
        results.push({ row: -1, col: colIndex }); // -1 indica cabeçalho
      }
    });
    
    // Buscar nas células
    csvData.rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.toLowerCase().includes(searchLower)) {
          results.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    // Ir para primeira célula com resultado
    if (results.length > 0) {
      const firstResult = results[0];
      setSelectedCell(firstResult);
    }
  }, [csvData]);

  // Navegar nos resultados da busca
  const handleSearchNext = useCallback(() => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      setSelectedCell(searchResults[nextIndex]);
    }
  }, [searchResults, currentSearchIndex]);

  const handleSearchPrev = useCallback(() => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      setSelectedCell(searchResults[prevIndex]);
    }
  }, [searchResults, currentSearchIndex]);

  // Ordenação
  const handleSort = useCallback((columnIndex: number) => {
    if (!csvData) return;
    
    const newDirection = sortConfig?.column === columnIndex && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column: columnIndex, direction: newDirection });
  }, [csvData, sortConfig]);

  // Dados ordenados
  const sortedData = useMemo(() => {
    if (!csvData || !sortConfig) return csvData;
    
    const sortedRows = [...csvData.rows].sort((a, b) => {
      const aValue = a[sortConfig.column] || '';
      const bValue = b[sortConfig.column] || '';
      
      // Tentar converter para número
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Comparação de string
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return {
      ...csvData,
      rows: sortedRows
    };
  }, [csvData, sortConfig]);

  // Toolbar
  const toolbar = (
    <Toolbar
      download={handleDownload}
      allowDownload={allowDownload}
      searchValue={searchText}
      onSearchChange={setSearchText}
      onSearchSubmit={handleSearch}
      searchResults={searchResults.length}
      currentSearchIndex={currentSearchIndex + 1}
      onSearchNext={handleSearchNext}
      onSearchPrev={handleSearchPrev}
    />
  );

  return (
    <ViewerShell
      toolbar={toolbar}
      loading={loading}
      error={error}
      onRetry={loadCsvFile}
      className={className}
    >
      <div className="w-full h-full flex flex-col bg-white">
        {/* Configurações */}
        <div className="flex items-center gap-4 p-2 border-b bg-gray-50 text-sm">
          <label className="flex items-center gap-2">
            Delimitador:
            <select
              value={config.delimiter}
              onChange={(e) => setConfig(prev => ({ ...prev, delimiter: e.target.value }))}
              className="border rounded px-2 py-1"
            >
              <option value=",">Vírgula (,)</option>
              <option value=";">Ponto e vírgula (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.hasHeaders}
              onChange={(e) => setConfig(prev => ({ ...prev, hasHeaders: e.target.checked }))}
            />
            Primeira linha são cabeçalhos
          </label>
        </div>

        {/* Tabela */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }}
        >
          {sortedData && (
            <table ref={tableRef} className="border-collapse w-full">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="w-12 h-8 border border-gray-300 text-xs font-medium text-gray-600">#</th>
                  {sortedData.headers.map((header, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(index)}
                      className="min-w-32 h-8 border border-gray-300 text-xs font-medium text-gray-600 px-2 cursor-pointer hover:bg-gray-200"
                      title={`Clique para ordenar por ${header}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{header}</span>
                        {sortConfig?.column === index && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => {
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                      const isSearchResult = searchResults.some(
                        result => result.row === rowIndex && result.col === colIndex
                      );
                      
                      return (
                        <td
                          key={colIndex}
                          onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                          className={`min-w-32 h-8 border border-gray-300 px-2 text-xs cursor-pointer ${
                            isSelected ? 'bg-blue-100 border-blue-500' : 
                            isSearchResult ? 'bg-yellow-100' : 
                            'hover:bg-gray-50'
                          }`}
                          title={cell}
                        >
                          <div className="truncate">
                            {cell}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Informações do arquivo */}
      {sortedData && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {sortedData.totalRows} linhas × {sortedData.totalCols} colunas
          {searchResults.length > 0 && ` • ${searchResults.length} resultados`}
        </div>
      )}
    </ViewerShell>
  );
};

export default CsvViewer;