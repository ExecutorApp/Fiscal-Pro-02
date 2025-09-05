import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import ExcelToolbar from '../common/ExcelToolbar';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';


// Tipos para SheetJS
interface WorkSheet {
  [key: string]: any;
}



// Tipos para dados da planilha
interface CellData {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date' | 'formula';
  formula?: string;
}

interface SheetData {
  name: string;
  data: { [key: string]: CellData };
  range: { rows: number; cols: number };
}

// Declaração global para XLSX
declare global {
  interface Window {
    XLSX?: any;
  }
}

const ExcelViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'spreadsheet.xlsx',
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Referências para elementos do DOM para freeze panes
  const headerRowRef = useRef<HTMLDivElement>(null);
  const headerColRef = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Configurações de células
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 32;
  const HEADER_HEIGHT = 32;
  const ROW_HEADER_WIDTH = 48;

  // Criar URL do arquivo
  const fileUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (err) {
      setError('Erro ao processar arquivo Excel');
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

  // Carregar XLSX.js se não estiver disponível
  const loadXlsx = useCallback(async () => {
    if (window.XLSX) return window.XLSX;

    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          if (window.XLSX) {
            resolve(window.XLSX);
          } else {
            reject(new Error('XLSX.js não carregou corretamente'));
          }
        };
        script.onerror = () => reject(new Error('Erro ao carregar XLSX.js'));
        document.head.appendChild(script);
      });
    } catch (error) {
      throw new Error('XLSX.js não disponível');
    }
  }, []);

  // Converter célula para dados tipados
  const convertCellData = useCallback((cell: any): CellData => {
    if (!cell) {
      return { value: '', type: 'string' };
    }

    const { v: value, t: type, f: formula } = cell;
    
    let cellType: CellData['type'] = 'string';
    let cellValue = value;

    switch (type) {
      case 'n':
        cellType = 'number';
        break;
      case 'b':
        cellType = 'boolean';
        break;
      case 'd':
        cellType = 'date';
        break;
      case 's':
      case 'str':
        cellType = 'string';
        break;
      default:
        if (formula) {
          cellType = 'formula';
        }
    }

    return {
      value: cellValue ?? '',
      type: cellType,
      formula
    };
  }, []);

  // Processar planilha
  const processWorksheet = useCallback((worksheet: WorkSheet, name: string): SheetData => {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error('XLSX não disponível');

    const MAX_ROWS = 2000;
    const MAX_COLS = 52;
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const data: { [key: string]: CellData } = {};

    for (let row = 0; row < MAX_ROWS; row++) {
      for (let col = 0; col < MAX_COLS; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && row <= range.e.r && col <= range.e.c && row >= range.s.r && col >= range.s.c) {
          data[cellAddress] = convertCellData(cell);
        } else {
          data[cellAddress] = { value: '', type: 'string' };
        }
      }
    }

    return {
      name,
      data,
      range: {
        rows: MAX_ROWS,
        cols: MAX_COLS
      }
    };
  }, [convertCellData]);

  // Gerar colunas (A, B, C, ...)
  const getColumnLabel = useCallback((index: number): string => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }, []);

  // Formatar valor da célula
  const formatCellValue = useCallback((cell: CellData): string => {
    if (!cell) return '';
    
    if (cell.type === 'formula' && cell.formula) {
      return `=${cell.formula}`;
    }
    
    if (cell.type === 'date' && cell.value instanceof Date) {
      return cell.value.toLocaleDateString();
    }
    
    if (cell.type === 'number' && typeof cell.value === 'number') {
      return cell.value.toLocaleString();
    }
    
    if (cell.type === 'boolean') {
      return cell.value ? 'TRUE' : 'FALSE';
    }
    
    return String(cell.value ?? '');
  }, []);

  // Função para sincronizar rolagem entre elementos
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollLeft = target.scrollLeft;
    const scrollTop = target.scrollTop;
    
    // Usar requestAnimationFrame para sincronizar todas as transformações no mesmo frame
    requestAnimationFrame(() => {
      // Sincronizar rolagem horizontal do cabeçalho de colunas
      if (headerRowRef.current) {
        const headerContent = headerRowRef.current.firstChild as HTMLElement;
        if (headerContent) {
          headerContent.style.transform = `translateX(-${scrollLeft}px)`;
        }
      }
      
      // Sincronizar rolagem vertical do cabeçalho de linhas
      if (headerColRef.current) {
        const headerContent = headerColRef.current.firstChild as HTMLElement;
        if (headerContent) {
          headerContent.style.transform = `translateY(-${scrollTop}px)`;
        }
      }
      
      // Sincronizar com a barra inferior
      if (bottomScrollRef.current) {
        bottomScrollRef.current.scrollLeft = scrollLeft;
      }
    });

  }, []);

 // Função para sincronizar a barra inferior com o conteúdo
 const handleBottomScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
   const target = e.target as HTMLDivElement;
   if (contentRef.current) {
     contentRef.current.scrollLeft = target.scrollLeft;
   }
 }, []);

  // Renderizar cabeçalho de coluna (A, B, C...)
  const renderColumnHeaders = useCallback(() => {
    const sheet = sheets[currentSheetIndex];
    if (!sheet) return null;
    
    const headers = [];
    for (let col = 0; col < sheet.range.cols; col++) {
      headers.push(
        <div
          key={`col-${col}`}
          className="flex items-center justify-center border border-gray-300 bg-gray-100 font-medium text-gray-700 text-sm"
          style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
        >
          {getColumnLabel(col)}
        </div>
      );
    }
    return headers;
  }, [sheets, currentSheetIndex, getColumnLabel]);

  // Renderizar cabeçalho de linha (1, 2, 3...)
  const renderRowHeaders = useCallback(() => {
    const sheet = sheets[currentSheetIndex];
    if (!sheet) return null;
    
    const headers = [];
    for (let row = 0; row < sheet.range.rows; row++) {
      headers.push(
        <div
          key={`row-${row}`}
          className="flex items-center justify-center border border-gray-300 bg-gray-100 font-medium text-gray-700 text-sm"
          style={{ width: ROW_HEADER_WIDTH, height: CELL_HEIGHT }}
        >
          {row + 1}
        </div>
      );
    }
    return headers;
  }, [sheets, currentSheetIndex]);

  // Renderizar conteúdo da tabela
  const renderTableContent = useCallback(() => {
    const sheet = sheets[currentSheetIndex];
    if (!sheet) return null;
    
    const cells = [];
    const maxRows = Math.min(sheet.range.rows, 2000);
    const maxCols = Math.min(sheet.range.cols, 52);
    
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const cellKey = `${getColumnLabel(col)}${row + 1}`;
        const cellData = sheet.data[cellKey];
        const value = cellData ? formatCellValue(cellData) : '';
        
        cells.push(
          <div
            key={cellKey}
            className="flex-shrink-0 border-r border-b border-gray-300 flex items-center px-2 text-sm"
            style={{
              position: 'absolute',
              left: col * CELL_WIDTH,
              top: row * CELL_HEIGHT,
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              backgroundColor: 'white',
              color: 'black'
            }}
            title={cellKey}
          >
            <span className="truncate">{value}</span>
          </div>
        );
      }
    }
    
    return cells;
  }, [sheets, currentSheetIndex, formatCellValue, getColumnLabel]);

  // Carregar arquivo Excel
  const loadExcelFile = useCallback(async () => {
    if (!fileUrl) return;

    console.log('[ExcelViewer] Iniciando carregamento do arquivo:', { 
      sourceType: typeof src, 
      fileName: src instanceof File ? src.name : 'N/A',
      fileSize: src instanceof File ? src.size : 'N/A',
      fileUrl
    });

    setLoading(true);
    setError(undefined);

    try {
      const XLSX = await loadXlsx();
      console.log('[ExcelViewer] Biblioteca XLSX carregada com sucesso');
      
      let arrayBuffer: ArrayBuffer;
      
      if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer') {
        console.log('[ExcelViewer] Usando ArrayBuffer direto, tamanho:', (src as ArrayBuffer).byteLength);
        arrayBuffer = src as ArrayBuffer;
      } else if (src && typeof src === 'object' && src.constructor && src.constructor.name === 'File') {
        console.log('[ExcelViewer] Convertendo File para ArrayBuffer...');
        const fileSource = src as File;
        arrayBuffer = await fileSource.arrayBuffer();
        console.log('[ExcelViewer] File convertido, tamanho:', arrayBuffer.byteLength);
      } else {
        console.log('[ExcelViewer] Fazendo fetch do arquivo via URL:', fileUrl);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Erro ao carregar arquivo');
        arrayBuffer = await response.arrayBuffer();
        console.log('[ExcelViewer] Arquivo carregado via URL, tamanho:', arrayBuffer.byteLength);
      }

      console.log('[ExcelViewer] Processando workbook...');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log('[ExcelViewer] Workbook processado, abas encontradas:', workbook.SheetNames);

      const processedSheets = workbook.SheetNames.map((name: string) => {
        console.log('[ExcelViewer] Processando aba:', name);
        return processWorksheet(workbook.Sheets[name], name);
      });
      console.log('[ExcelViewer] Todas as abas processadas com sucesso');
      setSheets(processedSheets);

      if (onLoad) onLoad();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      if (onError) onError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [fileUrl, src, loadXlsx, processWorksheet, onLoad, onError]);

  useEffect(() => {
    loadExcelFile();
  }, [loadExcelFile]);



  const handlePrevSheet = useCallback(() => {
    setCurrentSheetIndex((prev: number) => Math.max(0, prev - 1));
  }, []);

  const handleNextSheet = useCallback(() => {
    setCurrentSheetIndex((prev: number) => Math.min(sheets.length - 1, prev + 1));
  }, [sheets.length]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev: number) => Math.min(200, prev + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev: number) => Math.max(25, prev - 25));
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    // Implementar lógica de busca quando necessário
  }, []);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    }
  }, [onDownload]);

  const toolbar = (
    <>
      {/* Header com título e contador de abas */}

      
      <ExcelToolbar
        fileName={fileName ?? ''}
        currentSheetName={sheets[currentSheetIndex]?.name ?? ''}
        currentSheetIndex={currentSheetIndex}
        totalSheets={sheets.length}
        onPrevSheet={handlePrevSheet}
        onNextSheet={handleNextSheet}
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onDownload={handleDownload}
        allowDownload={allowDownload}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
      />
    </>
  );

  if (!sheets[currentSheetIndex]) {
    return (
      <ViewerShell
        toolbar={toolbar}
        loading={loading}
        error={error ?? undefined}
        onRetry={loadExcelFile}
        className={className}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Carregando planilha...</div>
        </div>
      </ViewerShell>
    );
  }

  return (
    <ViewerShell
      toolbar={toolbar}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadExcelFile}
      className={`${className} ${isFullscreen ? '!w-screen !h-screen fixed inset-0 z-50 bg-white' : ''}`}
    >
      <style>{`
        .excel-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }
		
		.hide-horizontal-scrollbar {
         overflow-x: hidden;
         overflow-y: auto;
         scrollbar-width: thin;
         scrollbar-color: #c1c1c1 #f1f1f1;
       }
       
       /* Webkit browsers - manter apenas barra vertical */
       .hide-horizontal-scrollbar::-webkit-scrollbar {
         width: 17px;
         height: 0px;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar:vertical {
         width: 17px;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar:horizontal {
         height: 0px;
         display: none;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-track {
         background: #f1f1f1;
         border: 1px solid #d4d4d4;
         border-radius: 0;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-track:horizontal {
         display: none;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-thumb {
         background: linear-gradient(to bottom, #e8e8e8 0%, #c1c1c1 50%, #a6a6a6 100%);
         border: 1px solid #a6a6a6;
         border-radius: 0;
         box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-thumb:horizontal {
         display: none;
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
         background: linear-gradient(to bottom, #d4d4d4 0%, #a6a6a6 50%, #8c8c8c 100%);
       }
       
       .hide-horizontal-scrollbar::-webkit-scrollbar-corner {
         background: #f1f1f1;
         border: 1px solid #d4d4d4;
       }

        .excel-scrollbar::-webkit-scrollbar {
          width: 17px;
          height: 17px;
        }
        .excel-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border: 1px solid #d4d4d4;
          border-radius: 0;
        }
        .excel-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #e8e8e8 0%, #c1c1c1 50%, #a6a6a6 100%);
          border: 1px solid #a6a6a6;
          border-radius: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .excel-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d4d4d4 0%, #a6a6a6 50%, #8c8c8c 100%);
        }
        .excel-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(to bottom, #a6a6a6 0%, #8c8c8c 50%, #707070 100%);
        }
        .excel-scrollbar::-webkit-scrollbar-corner {
          background: #f1f1f1;
          border: 1px solid #d4d4d4;
        }
        .excel-scrollbar::-webkit-scrollbar-button {
          background: linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 100%);
          border: 1px solid #d4d4d4;
          height: 17px;
          width: 17px;
          border-radius: 0;
        }
        .excel-scrollbar::-webkit-scrollbar-button:hover {
          background: linear-gradient(to bottom, #e8e8e8 0%, #d4d4d4 100%);
        }
        .excel-scrollbar::-webkit-scrollbar-button:active {
          background: linear-gradient(to bottom, #d4d4d4 0%, #c1c1c1 100%);
        }
      `}</style>
      

      
      <div className="w-full h-full bg-white overflow-hidden">
        <div className="relative w-full h-full">
          {/* Canto superior esquerdo fixo */}
          <div
            ref={cornerRef}
            className="absolute top-0 left-0 bg-gray-100 border border-gray-300 z-30"
            style={{
              width: ROW_HEADER_WIDTH,
              height: HEADER_HEIGHT
            }}
          />

          {/* Cabeçalho de coluna com rolagem horizontal */}
          <div
            ref={headerRowRef}
           className="absolute top-0 left-0 bg-white overflow-hidden z-20"
            style={{
              marginLeft: ROW_HEADER_WIDTH,
              height: HEADER_HEIGHT,
              width: `calc(100% - ${ROW_HEADER_WIDTH}px)`
            }}
          >
            <div 
              className="flex"
         style={{ 
           width: (sheets[currentSheetIndex]?.range.cols || 0) * CELL_WIDTH,
           willChange: 'transform'
         }}

            >
              {renderColumnHeaders()}
            </div>
          </div>

          {/* Cabeçalho de linha com rolagem vertical */}
          <div
            ref={headerColRef}
            className="absolute top-0 left-0 bg-white overflow-hidden z-20"
            style={{
              marginTop: HEADER_HEIGHT,
              width: ROW_HEADER_WIDTH,
              height: `calc(100% - ${HEADER_HEIGHT}px - 48px)`
            }}
          >
            <div 
              className="flex flex-col"
         style={{ 
           height: (sheets[currentSheetIndex]?.range.rows || 0) * CELL_HEIGHT,
           willChange: 'transform'
         }}

            >
              {renderRowHeaders()}
            </div>
          </div>

          {/* Área de conteúdo com rolagem */}
          <div
            ref={contentRef}
            className="absolute bg-white overflow-auto hide-horizontal-scrollbar excel-scrollbar z-10"
            style={{
              marginLeft: ROW_HEADER_WIDTH,
              marginTop: HEADER_HEIGHT,
              width: `calc(100% - ${ROW_HEADER_WIDTH}px)`,
              height: `calc(100% - ${HEADER_HEIGHT}px - 48px)`
            }}
            onScroll={handleScroll}
          >
            <div
              className="relative"
              style={{
                width: (sheets[currentSheetIndex]?.range.cols || 0) * CELL_WIDTH,
                height: (sheets[currentSheetIndex]?.range.rows || 0) * CELL_HEIGHT
              }}
            >
              {renderTableContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Faixa de navegação por abas na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center gap-4">
        {/* Controle de Navegação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevSheet}
            disabled={currentSheetIndex === 0}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Planilha anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {String(currentSheetIndex + 1).padStart(2, '0')} / {String(sheets.length).padStart(2, '0')}
          </span>
          <button
            onClick={handleNextSheet}
            disabled={currentSheetIndex === sheets.length - 1}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próxima planilha"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

{/* Título da aba atual */}
   <div className="text-sm font-medium text-gray-700 whitespace-nowrap px-2 border-r border-gray-300 truncate" 
     style={{ 
       maxWidth: '300px',
       minWidth: '100px' 
     }}
   >
     {sheets[currentSheetIndex]?.name || 'SIMPLES NACIONAL'}
   </div>

   {/* Barra de Rolagem Horizontal - FUNCIONAL */}
   <div 
     ref={bottomScrollRef}
     className="flex-1 overflow-x-auto excel-scrollbar" 
     onScroll={handleBottomScroll}
     style={{ 
       scrollbarWidth: 'thin',
       scrollbarColor: '#c1c1c1 #f1f1f1',
       height: '17px'
     }}
   >
     <div style={{ width: `${(sheets[currentSheetIndex]?.range.cols || 52) * CELL_WIDTH}px`, height: '1px' }} />
   </div>
 </div>
</ViewerShell>
  );
};

export default ExcelViewer;