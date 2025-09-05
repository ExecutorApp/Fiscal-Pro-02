import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ViewerProps } from '../types';
import ViewerShell from '../common/ViewerShell';
import { sourceToURL, revokeObjectURLBySource } from '../adapters/toObjectURL';
import { ChevronUp, ChevronDown, Maximize, Plus, Minus, Download, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.min.mjs';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// Configurar worker do PDF.js usando versão legacy para melhor compatibilidade
if (typeof window !== 'undefined') {
  const baseUrl = window.location.origin;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${baseUrl}/pdf.worker.min.js`;
} else {
  // Fallback para ambientes sem window (SSR) - versão legacy
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/legacy/build/pdf.worker.min.js';
}

// Configuração adicional para melhor compatibilidade
if (typeof window !== 'undefined') {
  // Desabilitar algumas otimizações que podem causar problemas em navegadores externos
  (window as any).pdfjsLib = pdfjsLib;
}

const PdfViewer: React.FC<ViewerProps> = ({
  src,
  fileName = 'document.pdf',
  onLoad,
  onError,
  onDownload,
  allowDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setRenderedPages] = useState<Set<number>>(new Set());
  const [isManualPageChange, setIsManualPageChange] = useState(false);
  
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [, setPageTexts] = useState<Map<number, string>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  // const containerRef = useRef<HTMLDivElement>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const renderingPagesRef = useRef<Set<number>>(new Set());
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Criar URL do PDF
  const pdfUrl = React.useMemo(() => {
    try {
      return sourceToURL(src, 'application/pdf');
    } catch (err: unknown) {
      setError('Erro ao processar PDF');
      return '';
    }
  }, [src]);

  // Cleanup da URL quando componente desmonta
  useEffect(() => {
    return () => {
      if (src instanceof File || (src && typeof src === 'object' && src.constructor && src.constructor.name === 'ArrayBuffer')) {
        revokeObjectURLBySource(src);
      }
      // Cancelar todas as tarefas de renderização
      renderTasksRef.current.forEach(task => task.cancel());
      renderTasksRef.current.clear();
    };
  }, [src]);



  // Carregar documento PDF
  const loadPdfDocument = useCallback(async () => {
    if (!pdfUrl) {
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Carregando documento PDF...');
    setError(null);

    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      
      // Listener para progresso de carregamento
      loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 50; // 50% para carregamento do documento
          setLoadingProgress(percent);
          setLoadingMessage(`Carregando documento... ${Math.round(percent)}%`);
        }
      };
      
      const pdf = await loadingTask.promise;
      setLoadingProgress(50);
      setLoadingMessage('Processando páginas...');
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      // Otimização: Extrair texto apenas das primeiras páginas para carregamento mais rápido
      const newPageTexts = new Map<number, string>();
      const maxInitialPages = Math.min(5, pdf.numPages); // Carregar apenas as primeiras 5 páginas inicialmente
      
      for (let i = 1; i <= maxInitialPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        newPageTexts.set(i, pageText);
        
        // Atualizar progresso (50% + 40% para processamento de páginas iniciais)
        const pageProgress = 50 + (i / maxInitialPages) * 40;
        setLoadingProgress(pageProgress);
        setLoadingMessage(`Processando página ${i} de ${maxInitialPages}...`);
      }
      setPageTexts(newPageTexts);
      
      setLoadingProgress(95);
      setLoadingMessage('Preparando visualização...');
      
      // Carregar texto das páginas restantes em background (lazy loading)
      if (pdf.numPages > maxInitialPages) {
        setTimeout(async () => {
          for (let i = maxInitialPages + 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items
                .filter((item: any) => 'str' in item)
                .map((item: any) => item.str)
                .join(' ');
              setPageTexts(prev => new Map(prev).set(i, pageText));
            } catch (err) {
              // Erro silencioso no carregamento de texto em background
            }
          }
        }, 100);
      }
      
      setLoading(false);
      
      // Otimização: Renderizar apenas as primeiras páginas para carregamento mais rápido
      setTimeout(() => {
        const maxInitialRender = Math.min(3, pdf.numPages);
        // Renderizar apenas as primeiras páginas imediatamente
        for (let i = 1; i <= maxInitialRender; i++) {
          const canvas = canvasRefs.current.get(i);
          if (canvas) {
            renderPageImmediate(i, pdf).catch(() => {
              // Erro silencioso na renderização imediata
            });
          }
        }
        
        // Renderizar páginas restantes em background com delay
        if (pdf.numPages > maxInitialRender) {
          setTimeout(() => {
            for (let i = maxInitialRender + 1; i <= pdf.numPages; i++) {
              setTimeout(() => {
                const canvas = canvasRefs.current.get(i);
                if (canvas) {
                  renderPageImmediate(i, pdf).catch(() => {
                    // Erro silencioso na renderização em background
                  });
                }
              }, (i - maxInitialRender) * 50); // 50ms de delay entre cada página
            }
          }, 200);
        }
      }, 200);
      
      onLoad?.();
    } catch (err: unknown) {
      let errorMessage = 'Erro ao carregar PDF';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid PDF')) {
          errorMessage = 'Arquivo PDF inválido ou corrompido';
        } else if (err.message.includes('password')) {
          errorMessage = 'PDF protegido por senha não é suportado';
        } else if (err.message.includes('network')) {
          errorMessage = 'Erro de conexão ao carregar PDF';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Tempo limite excedido ao carregar PDF';
        } else {
          errorMessage = `Erro ao processar PDF: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      setLoadingProgress(0);
      setLoadingMessage('');
      onError?.(err);
    }
  }, [pdfUrl]);

  // Função para renderização imediata (sem dependências de estado)
  const renderPageImmediate = useCallback(async (pageNumber: number, pdfDoc: PDFDocumentProxy) => {
    const canvas = canvasRefs.current.get(pageNumber);
    if (!canvas) {
      return;
    }

    // Verificar se a página já está sendo renderizada
    if (renderingPagesRef.current.has(pageNumber)) {
      return;
    }

    // Marcar página como sendo renderizada
    renderingPagesRef.current.add(pageNumber);

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const context = canvas.getContext('2d');
      
      if (!context) {
        renderingPagesRef.current.delete(pageNumber);
        return;
      }

      const scale = zoom / 100;
      const viewport = page.getViewport({ scale, rotation });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        canvas: canvas,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      
      await renderTask.promise;
      
      // Marcar página como renderizada
      setRenderedPages(prev => new Set([...prev, pageNumber]));
    } catch (err: unknown) {
      console.error('Erro na renderização imediata da página:', err);
    } finally {
      // Remover página da lista de renderização
      renderingPagesRef.current.delete(pageNumber);
    }
  }, [zoom, rotation]);

  // Renderizar página específica
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocument) {
      return;
    }

    const canvas = canvasRefs.current.get(pageNumber);
    if (!canvas) {
      return;
    }

    // Verificar se a página já está sendo renderizada
    if (renderingPagesRef.current.has(pageNumber)) {
      return;
    }

    // Verificar se o canvas está pronto para renderização
    if (!canvas.getContext) {
      return;
    }

    // Marcar página como sendo renderizada
    renderingPagesRef.current.add(pageNumber);

    try {
      // Cancelar renderização anterior desta página
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        existingTask.cancel();
        renderTasksRef.current.delete(pageNumber);
      }

      const page = await pdfDocument.getPage(pageNumber);
      const context = canvas.getContext('2d');
      
      if (!context) {
        renderingPagesRef.current.delete(pageNumber);
        return;
      }

      const scale = zoom / 100;
      const viewport = page.getViewport({ scale, rotation });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        canvas: canvas,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      renderTasksRef.current.set(pageNumber, renderTask);
      
      await renderTask.promise;
      
      // Marcar página como renderizada
      setRenderedPages(prev => new Set([...prev, pageNumber]));
      renderTasksRef.current.delete(pageNumber);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'RenderingCancelledException') {
        // Log apenas erros críticos, não warnings de renderização
        if (!err.message.includes('cancelled')) {
          console.error(`Erro crítico ao renderizar página ${pageNumber}:`, err.message);
        }
      }
      renderTasksRef.current.delete(pageNumber);
    } finally {
      // Remover página da lista de renderização
      renderingPagesRef.current.delete(pageNumber);
    }
  }, [pdfDocument, zoom, rotation]);

  // Renderizar páginas com lazy loading otimizado
  const renderAllPages = useCallback(async () => {
    if (!pdfDocument || totalPages === 0) {
      return;
    }

    // Renderizar apenas as primeiras 3 páginas imediatamente
    const maxInitialRender = Math.min(3, totalPages);
    for (let i = 1; i <= maxInitialRender; i++) {
      await renderPage(i);
    }
    
    // Renderizar páginas restantes em background com delay
    if (totalPages > maxInitialRender) {
      setTimeout(() => {
        for (let i = maxInitialRender + 1; i <= totalPages; i++) {
          setTimeout(() => {
            renderPage(i).catch(() => {
              // Erro silencioso na renderização em background
            });
          }, (i - maxInitialRender) * 100); // 100ms de delay entre cada página
        }
      }, 300);
    }
  }, [pdfDocument, totalPages, renderPage]);

  // Efeitos
  useEffect(() => {
    loadPdfDocument();
  }, [loadPdfDocument]);

  // Efeito para recarregar quando src muda
  useEffect(() => {
    // Limpar estado anterior
    setPdfDocument(null);
    setTotalPages(0);
    setCurrentPage(1);
    setRenderedPages(new Set());
    canvasRefs.current.clear();
    
    // Cancelar tarefas de renderização em andamento
    renderTasksRef.current.forEach(task => task.cancel());
    renderTasksRef.current.clear();
    renderingPagesRef.current.clear();
    
    // Recarregar PDF
    if (src) {
      loadPdfDocument();
    }
  }, [src, loadPdfDocument]);

  // Efeito para renderização inicial - executa após o documento estar carregado
  useEffect(() => {
    if (pdfDocument && totalPages > 0) {
      // Aguardar um pequeno delay para garantir que os canvas estejam montados
      const timer = setTimeout(() => {
        renderAllPages();
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [pdfDocument, totalPages, renderAllPages]);

  // Re-renderizar quando zoom ou rotação mudam
  useEffect(() => {
    if (pdfDocument && totalPages > 0) {
      // Cancelar todas as renderizações em andamento
      renderTasksRef.current.forEach(task => {
        try {
          task.cancel();
        } catch (err: unknown) {
          // Ignorar erros de cancelamento
        }
      });
      renderTasksRef.current.clear();
      renderingPagesRef.current.clear();
      
      setRenderedPages(new Set()); // Limpar páginas renderizadas
      
      // Re-renderizar imediatamente
      renderAllPages();
    }
  }, [zoom, rotation, pdfDocument, totalPages, renderAllPages]);

  // Re-renderizar quando o modo tela cheia é ativado/desativado
  useEffect(() => {
    if (pdfDocument && totalPages > 0 && isFullscreen) {
      // Aguardar um pequeno delay para garantir que os novos canvas estejam montados
      const timer = setTimeout(() => {
        // Limpar referências antigas e forçar re-renderização
        setRenderedPages(new Set());
        renderAllPages();
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isFullscreen, pdfDocument, totalPages, renderAllPages]);

  // Detectar página atual baseada no scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || isManualPageChange) return;
      
      const container = scrollContainerRef.current;
      
      // Encontrar qual página está mais visível
      let visiblePage = 1;
      let maxVisibleArea = 0;
      
      for (let i = 1; i <= totalPages; i++) {
        const canvas = canvasRefs.current.get(i);
        if (!canvas) continue;
        
        const rect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const visibleTop = Math.max(rect.top, containerRect.top);
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
        const visibleArea = Math.max(0, visibleBottom - visibleTop);
        
        if (visibleArea > maxVisibleArea) {
          maxVisibleArea = visibleArea;
          visiblePage = i;
        }
      }
      
      if (visiblePage !== currentPage) {
        setCurrentPage(visiblePage);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [totalPages, currentPage, isManualPageChange]);

  // Scroll para uma página específica
  const scrollToPage = useCallback((pageNumber: number) => {
    const canvas = canvasRefs.current.get(pageNumber);
    const container = scrollContainerRef.current;
    
    if (canvas && container) {
      // Calcular a posição do canvas em relação ao container
      const containerRect = container.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calcular o offset necessário para centralizar a página
      const scrollTop = container.scrollTop;
      const targetScrollTop = scrollTop + (canvasRect.top - containerRect.top) - 20; // 20px de margem
      

      
      // Fazer scroll suave para a posição calculada
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // Handlers de navegação
  const handlePageClick = useCallback((pageNumber: number) => {
    setIsManualPageChange(true);
    setCurrentPage(pageNumber);
    
    // Usar scrollToPage para consistência na navegação
    setTimeout(() => {
      scrollToPage(pageNumber);
    }, 50); // Pequeno delay para garantir que o estado foi atualizado
    
    setTimeout(() => {
      setIsManualPageChange(false);
    }, 500);
  }, [scrollToPage]);

  // Gerar referências de canvas para todas as páginas
  const generateCanvasElements = useCallback(() => {
    const elements = [];
    for (let i = 1; i <= totalPages; i++) {
      elements.push(
        <div key={i} className="mb-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <canvas
            ref={(el) => {
              if (el) {
                canvasRefs.current.set(i, el);
              } else {
                canvasRefs.current.delete(i);
              }
            }}
            className="block shadow-lg border border-gray-300 rounded-lg"
            style={{
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '100%',
              display: 'block',
              margin: '0 auto',
              minHeight: '600px' // Altura mínima para evitar layout shift
            }}
          />
        </div>
      );
    }
    
    return elements;
  }, [totalPages]);

  // Handlers de zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev: number) => Math.min(300, prev + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev: number) => Math.max(25, prev - 25));
  }, []);

  // Handlers de controles

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [onDownload, pdfUrl, fileName]);

  // Scroll do carrossel de páginas
  const scrollCarousel = useCallback((direction: 'up' | 'down') => {
    if (!leftPanelRef.current) return;
    
    const scrollAmount = 60; // altura aproximada de uma aba
    const currentScroll = leftPanelRef.current.scrollTop;
    const maxScroll = leftPanelRef.current.scrollHeight - leftPanelRef.current.clientHeight;
    
    if (direction === 'up') {
      const newScroll = Math.max(0, currentScroll - scrollAmount);
      leftPanelRef.current.scrollTo({
        top: newScroll,
        behavior: 'smooth'
      });
    } else {
      const newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      leftPanelRef.current.scrollTo({
        top: newScroll,
        behavior: 'smooth'
      });
    }
  }, []);

  // O scroll do mouse agora funciona nativamente com overflow-auto

  // Renderizar abas de páginas usando useMemo para evitar re-renderizações desnecessárias
  const pageTabsElements = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;
      const tabContent = pageNumber.toString().padStart(2, '0');
      
      return (
        <button
          key={pageNumber}
          onClick={() => handlePageClick(pageNumber)}
          className={`
            w-full h-12 flex items-center justify-center text-sm font-medium rounded-md transition-colors
            ${
              pageNumber === currentPage
                ? 'bg-[#1777CF] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {tabContent}
        </button>
      );
    });
  }, [totalPages, currentPage]); // Dependências: só re-renderiza quando totalPages ou currentPage mudam

  if (loading) {
    return (
      <ViewerShell 
        loading={loading} 
        loadingMessage={loadingMessage}
        loadingProgress={loadingProgress}
        className={className}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">{loadingMessage}</div>
        </div>
      </ViewerShell>
    );
  }

  if (error) {
    return (
      <ViewerShell error={error} onRetry={loadPdfDocument} className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      </ViewerShell>
    );
  }

  return (
    <>
      {/* Elemento invisível para comunicar informações do PDF */}
      <div 
        data-pdf-info="true"
        data-current-page={currentPage}
        data-total-pages={totalPages}
        style={{ display: 'none' }}
      />

      <ViewerShell 
        className={`${className} ${isFullscreen ? '!w-screen !h-screen fixed inset-0 z-50 bg-white' : ''}`}
      >
        {/* Header com título e contador de páginas */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate pr-[10px]">{fileName || 'Documento PDF'}</h3>
                <p className="text-sm text-gray-500">Total de páginas: {totalPages.toString().padStart(2, '0')}</p>
              </div>
            </div>
            {isFullscreen && (
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Sair da tela cheia"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex relative" style={isFullscreen ? { padding: '10px', marginTop: '5px', marginBottom: '0px', height: 'calc(100vh - 85px)', gap: '10px', width: '100%' } : { marginTop: '10px', marginBottom: '10px', height: 'calc(100vh - 205px)', marginLeft: '10px', marginRight: '10px', gap: '10px', width: 'calc(100% - 20px)' }}>
          {/* Container Esquerdo - Carrossel de Páginas (Independente) */}
          <div 
            ref={carouselContainerRef}
            className="w-20 bg-gray-50 border border-gray-300 rounded-lg shadow-lg flex flex-col flex-shrink-0"
            style={{ maxHeight: '100%' }}
          >
            {/* Botão seta para cima - Sempre visível */}
             <button
               onClick={() => scrollCarousel('up')}
               className="h-8 flex items-center justify-center bg-white border border-gray-300 rounded-md mx-2 mt-2 mb-1 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
               style={{ width: 'calc(100% - 16px)' }}
             >
               <ChevronUp size={16} className="text-gray-600" />
             </button>
             
             {/* Carrossel de páginas - Área sem barra de rolagem */}
             <div 
               ref={leftPanelRef}
               className="flex-1 overflow-auto px-2 hide-scrollbar"
               style={{ 
                 minHeight: 0,
                 maxHeight: 'calc(100% - 80px)', // Espaço para as duas setas (48px cada)
                 scrollbarWidth: 'none', // Firefox
                 msOverflowStyle: 'none', // IE/Edge
               }}
             >
               <div className="space-y-1">
                 {pageTabsElements}
               </div>
             </div>
             
             {/* Botão seta para baixo - Sempre visível */}
             <button
               onClick={() => scrollCarousel('down')}
               className="h-8 flex items-center justify-center bg-white border border-gray-300 rounded-md mx-2 mb-2 mt-1 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
               style={{ width: 'calc(100% - 16px)' }}
             >
               <ChevronDown size={16} className="text-gray-600" />
             </button>
          </div>

          {/* Container Central - Visualização do PDF */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-gray-100 rounded-lg flex flex-col justify-start" 
            style={{ 
              padding: '10px'
            }}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {totalPages > 0 && generateCanvasElements()}
            </div>
          </div>

          {/* Container Direito - Controles (Independente) */}
          <div 
            className="w-20 bg-gray-50 border border-gray-300 rounded-lg shadow-lg flex flex-col items-center flex-shrink-0"
            style={{ maxHeight: '100%', padding: '10px' }}
          >
            {/* Botão Dividir Tela */}
            {!isFullscreen && (
              <button
                onClick={handleFullscreen}
                className="w-full h-10 flex items-center justify-center rounded-md mb-4 transition-colors shadow-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                title="Tela cheia"
              >
                <Maximize size={16} />
              </button>
            )}
            <div className="flex flex-col items-center space-y-3">
              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                className="w-full h-10 flex items-center justify-center bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                title="Aumentar zoom"
              >
                <Plus size={16} />
              </button>

              {/* Porcentagem do Zoom */}
              <div className="text-sm font-semibold text-gray-800 py-2 px-3 bg-white border border-gray-300 rounded-md shadow-sm min-w-[50px] text-center">
                {zoom}%
              </div>

              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                className="w-full h-10 flex items-center justify-center bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                title="Diminuir zoom"
              >
                <Minus size={16} />
              </button>
            </div>

            {/* Espaçador */}
            <div className="flex-1" />

            {/* Botão Download */}
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="w-full h-10 flex items-center justify-center bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                title="Download"
              >
                <Download size={16} />
              </button>
            )}
          </div>
        </div>
      </ViewerShell>
    );

  </>
);
};

export default PdfViewer;