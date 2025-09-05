import React, { useRef, useEffect, useState } from 'react';
import ModalComentarios from './Modal-Comentarios';

/*
--------------------------------------------------------
  Componente: Modal de Editar Card - Versão Completa
--------------------------------------------------------
- Modal contextual que aparece ao clicar nos 3 pontos do card
- Posicionamento dinâmico baseado na posição do botão
- Ordem: Dropdowns no topo, ações na parte inferior
- Seções: Mover para coluna, Tags, depois Editar/Análise/Histórico/Excluir
- Dropdown para seleção de colunas disponíveis
- Dropdown para seleção de tags disponíveis
- Overlay para fechar ao clicar fora
- Estilização moderna e consistente
- Callbacks para todas as ações
- Separadores visuais entre seções
*/

interface Tag { 
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface ModalEditarProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAnalytics?: () => void;
  onHistory?: () => void;
  onDelete: () => void;
  onMoveToColumn: (columnId: string) => void;
  availableColumns: Status[];
  buttonRef: React.RefObject<HTMLButtonElement>;
  
  // Props opcionais para compatibilidade
  currentColumnId?: string;
  onUpdateTags?: (tagIds: string[]) => void;
  availableTags?: Tag[];
  currentTags?: string[];
  
  // Props para próxima etapa
  isLastColumnOfStage?: boolean;
  nextStageName?: string;
  onMoveToNextStage?: () => void;
  
  // Props para comentários
  commentsCount?: number;
  onOpenComments?: () => void;
}

export const ModalEditar: React.FC<ModalEditarProps> = ({
  isOpen,
  onClose,
  onEdit,
  onAnalytics,
  onHistory,
  onDelete,
  onMoveToColumn,
  availableColumns,
  buttonRef,
  currentColumnId = '',
  onUpdateTags,
  availableTags = [],
  currentTags = [], 
  isLastColumnOfStage = false,
  nextStageName = '01 | Proposta enviada',
  onMoveToNextStage,
  commentsCount = 0,
  onOpenComments,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showManageTagsDropdown, setShowManageTagsDropdown] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [searchColumn, setSearchColumn] = useState('');
  const [loadedTags, setLoadedTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [columnDropdownHeight, setColumnDropdownHeight] = useState(200);
  const [tagDropdownHeight, setTagDropdownHeight] = useState(200);

  // Função para abrir modal de comentários
  const handleOpenComments = () => {
    console.log('🔍 handleOpenComments chamada!');
 if (onOpenComments) {
   onOpenComments();
   onClose();
 }
  };


  // Função para calcular altura disponível do dropdown
  const calculateDropdownHeight = (buttonElement: HTMLElement) => {
    if (!menuRef.current) return 200;
    
    const modalRect = menuRef.current.getBoundingClientRect();
    const buttonRect = buttonElement.getBoundingClientRect();
    
    const availableSpace = modalRect.bottom - buttonRect.bottom - 20;
    return Math.max(120, Math.min(availableSpace, 350));
  };

  // Recalcular altura quando dropdowns abrirem
  useEffect(() => {
    if (showColumnsDropdown) {
      requestAnimationFrame(() => {
        const button = document.querySelector('[data-dropdown="columns"]') as HTMLElement;
        if (button) {
          const height = calculateDropdownHeight(button);
          setColumnDropdownHeight(height);
        }
      });
    }
  }, [showColumnsDropdown]);

  useEffect(() => {
    if (showManageTagsDropdown) {
      requestAnimationFrame(() => {
        const button = document.querySelector('[data-dropdown="tags"]') as HTMLElement;
        if (button) {
          const modalRect = menuRef.current?.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          if (modalRect) {
            const availableSpace = modalRect.bottom - buttonRect.bottom - 30;
            const height = Math.max(120, Math.min(availableSpace, 350));
            setTagDropdownHeight(height);
          }
        }
      });
    }
  }, [showManageTagsDropdown]);

  const loadTagsFromLocalStorage = (): Tag[] => {
    try {
      const savedTags = localStorage.getItem('kanban-tags-config');
      if (!savedTags) return [];
      const parsed = JSON.parse(savedTags);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(tag => tag && tag.id && tag.name && tag.color);
    } catch (error) {
      console.error('Erro ao carregar tags do localStorage:', error);
      return [];
    }
  };

  // Carregar tags do localStorage quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const tagsFromStorage = loadTagsFromLocalStorage();
      setLoadedTags(tagsFromStorage);
    }
  }, [isOpen]);

  // Usar tags de props ou localStorage
  const effectiveTags = availableTags.length > 0 ? availableTags : loadedTags;

  // Calcular posição do modal baseado no botão de referência
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const modalWidth = 280;
      const modalHeight = 540;
      const padding = 8;

      let top = buttonRect.bottom + padding;
      let left;
      
      if (!buttonRect || typeof buttonRect.left !== 'number' || typeof buttonRect.width !== 'number') {
        left = padding;
      } else {
        const buttonCenterX = buttonRect.left + (buttonRect.width / 2);
        const columnCenterX = buttonCenterX;
        left = columnCenterX - (modalWidth / 2);
        
        if (left + modalWidth > buttonRect.left - 15) {
          left = buttonRect.left - modalWidth - 15;
        }
      }

      if (top + modalHeight > viewportHeight - padding) {
        top = buttonRect.top - modalHeight - padding;
        if (top < padding) {
          top = Math.max(padding, (viewportHeight - modalHeight) / 2);
        }
      }

      if (typeof left === 'number') {
        if (left < padding) {
          left = padding;
        }
        if (left + modalWidth > viewportWidth - padding) {
          left = viewportWidth - modalWidth - padding;
        }
      } else {
        left = padding;
      }
      
      const safeLeft = Math.max(padding, Math.min(left, viewportWidth - modalWidth - padding));
      const safeTop = Math.max(padding, Math.min(top, viewportHeight - modalHeight - padding));

      setPosition({ top: safeTop, left: safeLeft });
    }
  }, [isOpen, buttonRef]);

  // Fechar modal ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, buttonRef]);

  // Fechar dropdowns ao clicar fora deles
  useEffect(() => {
    const handleClickOutsideDropdowns = (event: MouseEvent) => {
      if (
        showColumnsDropdown &&
        columnsDropdownRef.current &&
        !columnsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowColumnsDropdown(false);
      }
      
      if (
        showManageTagsDropdown &&
        tagsDropdownRef.current &&
        !tagsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowManageTagsDropdown(false);
      }
    };

    if (isOpen && (showColumnsDropdown || showManageTagsDropdown)) {
      document.addEventListener('mousedown', handleClickOutsideDropdowns);
      return () => {
        document.removeEventListener('mousedown', handleClickOutsideDropdowns);
      };
    }
  }, [isOpen, showColumnsDropdown, showManageTagsDropdown]);

  // Resetar dropdowns quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setShowColumnsDropdown(false);
      setShowManageTagsDropdown(false);
      setSelectedTags(currentTags);
      setSearchColumn('');
    } else {
      setSelectedTags(currentTags);
    }
  }, [isOpen]);

  // Função para selecionar tag (apenas uma)
  const handleSelectTag = (tagId: string) => {
    setSelectedTag(tagId);
    setShowManageTagsDropdown(false);
    
    if (onUpdateTags) {
      onUpdateTags(tagId ? [tagId] : []);
    }
  };

  // Função para mover para coluna e fechar modal
  const handleMoveToColumn = (columnId: string) => {
    onMoveToColumn(columnId);
    onClose();
  };

  if (!isOpen) return null;

  // Filtrar colunas disponíveis (excluir a atual)
  const otherColumns = availableColumns.filter(col => col.id !== currentColumnId);
  
  // Filtrar colunas baseado na busca
  const filteredColumns = otherColumns.filter(column => {
    const originalIndex = availableColumns.findIndex(col => col.id === column.id);
    const columnNumber = (originalIndex + 1).toString().padStart(2, '0');
    
    return column.name.toLowerCase().includes(searchColumn.toLowerCase()) ||
           columnNumber.includes(searchColumn);
  });
  
  // Filtrar tags ativas
  const activeTags = effectiveTags.filter(tag => tag.isActive);

  return (
    <>
      {/* Overlay transparente para fechar ao clicar fora */}
      <div className="fixed inset-0 z-[45]" onClick={onClose} />
      
      {/* Modal */}
      <div
        ref={menuRef}
        className="fixed z-[60] w-[280px] h-[540px] bg-white rounded-[12px] shadow-[0px_8px_32px_rgba(0,0,0,0.12)] border border-gray-200 py-[8px] overflow-hidden font-inter flex flex-col"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex-1 overflow-y-auto">
        
        {/* ============ DROPDOWNS NO TOPO ============ */}
        
        {/* Seção - Mover para */}
        <div className="px-[16px] py-[8px] relative" ref={columnsDropdownRef}>
          <div className="flex items-center gap-[8px]">
            <div className="w-[20px] h-[20px] flex items-center justify-center ml-[5px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.27 22.75H4.23c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v15.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-20c-1.27 0-1.48.34-1.48 1.35v15.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35zM19.77 15.75h-4.04c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v8.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-13c-1.27 0-1.48.34-1.48 1.35v8.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-[14px] font-medium text-gray-700">Mover para:</span>
          </div>
          
          <div className="mt-[8px] relative">
            <button
              onClick={() => {
                setShowColumnsDropdown(!showColumnsDropdown);
                setSearchColumn('');
                setShowManageTagsDropdown(false);
              }}
              data-dropdown="columns"
              className="w-full px-[12px] py-[10px] bg-gray-50 border border-gray-200 rounded-[8px] text-left hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-[13px] text-gray-600"
            >
              <span>Escolha uma coluna</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform duration-200 ${showColumnsDropdown ? 'rotate-180' : ''}`}
              >
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            {/* Dropdown Mover para */}
            {showColumnsDropdown && (
              <div 
                className="absolute top-full left-0 right-0 mt-[4px] bg-white border border-gray-200 rounded-[8px] shadow-lg overflow-hidden z-10"
                style={{ maxHeight: `${columnDropdownHeight}px` }}
              >
                <div className="p-[8px] border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Buscar coluna..."
                    value={searchColumn}
                    onChange={(e) => setSearchColumn(e.target.value)}
                    className="w-full px-[8px] py-[6px] border border-gray-200 rounded-[4px] text-[12px] focus:outline-none focus:border-blue-300"
                    autoFocus
                  />
                </div>
                
                <div className="overflow-y-auto" style={{ maxHeight: `${columnDropdownHeight - 60}px` }}>
                  {filteredColumns.length > 0 ? (
                    filteredColumns.map((column, index) => {
                      const originalIndex = availableColumns.findIndex(col => col.id === column.id);
                      const columnNumber = (originalIndex + 1).toString().padStart(2, '0');
                      const totalColumns = availableColumns.length.toString().padStart(2, '0');
                      
                      return (
                        <div key={column.id}>
                          <button
                            onClick={() => handleMoveToColumn(column.id)}
                            className="flex items-center gap-[8px] w-full px-[12px] py-[12px] text-left hover:bg-white transition-colors duration-200"
                          >
                            <span className="text-[12px] font-bold text-gray-500 flex-shrink-0">
                              {columnNumber}/{totalColumns}
                            </span>
                            <span className="text-[12px] text-gray-400 flex-shrink-0">|</span>
                            <span className="text-[13px] text-gray-700 font-medium truncate">
                              {column.name}
                            </span>
                          </button>
                          {index < filteredColumns.length - 1 && (
                            <div className="h-[1px] bg-gray-200 mx-[12px]" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-[12px] py-[12px] text-[13px] text-gray-500 italic bg-gray-50">
                      {searchColumn ? 'Nenhuma coluna encontrada' : 'Todas as colunas estão sendo utilizadas'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Separador */}
        <div className="h-[1px] bg-gray-100 my-[4px]" />

        {/* Seção - Tags */}
        <div className="px-[16px] py-[8px] relative" ref={tagsDropdownRef}>
          <div className="flex items-center gap-[8px]">
            <div className="w-[20px] h-[20px] flex items-center justify-center ml-[5px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <span className="text-[14px] font-medium text-gray-700">Tags:</span>
          </div>
          
          <div className="mt-[8px] relative">
            <button
              onClick={() => {
                setShowManageTagsDropdown(!showManageTagsDropdown);
                setShowColumnsDropdown(false);
              }}
              data-dropdown="tags"
              className="w-full px-[12px] py-[10px] bg-gray-50 border border-gray-200 rounded-[8px] text-left transition-colors duration-200 flex items-center justify-between text-[13px] hover:bg-gray-100 text-gray-600 cursor-pointer"
            >
              <span className="flex items-center gap-[8px] min-w-0 flex-1">
                {selectedTag ? (
                  <>
                    <div 
                      className="w-[10px] h-[10px] rounded-[3px] flex-shrink-0" 
                      style={{backgroundColor: effectiveTags.find(tag => tag.id === selectedTag)?.color || '#gray'}}
                    />
                    <span className="text-gray-700 font-medium truncate">
                      {effectiveTags.find(tag => tag.id === selectedTag)?.name || 'Tag selecionada'}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Escolha uma tag</span>
                )}
              </span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform duration-200 flex-shrink-0 ml-[8px] ${showManageTagsDropdown ? 'rotate-180' : ''}`}
              >
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            {/* Dropdown Tags */}
            {showManageTagsDropdown && (
              <div 
                className="absolute top-full left-0 right-0 mt-[4px] bg-gray-50 border border-gray-200 rounded-[8px] shadow-lg overflow-y-auto z-[70]"
                style={{ maxHeight: `${tagDropdownHeight}px` }}
              >
                {effectiveTags.length === 0 ? (
                  <div className="px-[12px] py-[16px] text-center">
                    <div className="text-[12px] text-gray-400 mb-[8px]">
                      Nenhuma tag configurada
                    </div>
                    <div className="text-[11px] text-gray-300">
                      Configure tags nas configurações do Kanban
                    </div>
                  </div>
                ) : activeTags.length === 0 ? (
                  <div className="px-[12px] py-[16px] text-center">
                    <div className="text-[12px] text-gray-400 mb-[8px]">
                      Nenhuma tag ativa
                    </div>
                    <div className="text-[11px] text-gray-300">
                      Ative tags nas configurações do Kanban
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSelectTag('')}
                      className={`flex items-center gap-[8px] w-full px-[12px] py-[10px] text-left transition-colors duration-200 ${
                        selectedTag === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-[12px] font-medium">Nenhuma</span>
                    </button>
                    
                    <div className="h-[1px] bg-gray-200 mx-[8px]" />
                    
                    {activeTags.map((tag, index) => (
                      <div key={tag.id}>
                        <button
                          onClick={() => handleSelectTag(tag.id)}
                          className={`flex items-center gap-[8px] w-full px-[12px] py-[10px] text-left transition-colors duration-200 ${
                            selectedTag === tag.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div 
                            className="w-[10px] h-[10px] rounded-[3px]" 
                            style={{backgroundColor: tag.color}}
                          />
                          <span className="text-[12px] font-medium">{tag.name}</span>
                        </button>
                        
                        {index < activeTags.length - 1 && (
                          <div className="h-[1px] bg-gray-200 mx-[8px]" />
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
		 
        {/* Separador */}
        <div className="h-[1px] bg-gray-100 my-[8px]" />

        {/* ============ AÇÕES NA PARTE INFERIOR ============ */}

        {/* Botão Editar */}
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="m18.5 2.5 a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium">Editar</span>
        </button>

        {/* Botão Comentários */}
        <button
          onClick={handleOpenComments}
          className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium">Comentários</span>
          {commentsCount > 0 && (
            <div className="ml-auto bg-blue-600 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-[6px]">
              {commentsCount > 99 ? '99+' : commentsCount}
            </div>
          )}
        </button>

        {/* Botão Análise de dados */}
        <button
          onClick={() => {
            if (onAnalytics) {
              onAnalytics();
              onClose();
            }
          }}
          className={`flex items-center gap-[12px] w-full px-[16px] py-[12px] text-left transition-colors duration-200 ${
            onAnalytics ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8">
              <g>
                <path d="M15.5 59h-9A1.5 1.5 0 0 1 5 57.5v-17A1.5 1.5 0 0 1 6.5 39h9a1.5 1.5 0 0 1 1.5 1.5v17a1.5 1.5 0 0 1-1.5 1.5zM7 57h8V41H7zM29.5 59h-9a1.5 1.5 0 0 1-1.5-1.5v-25a1.5 1.5 0 0 1 1.5-1.5h9a1.5 1.5 0 0 1 1.5 1.5v25a1.5 1.5 0 0 1-1.5 1.5zM21 57h8V33h-8zM43.5 59h-9a1.5 1.5 0 0 1-1.5-1.5v-37a1.5 1.5 0 0 1 1.5-1.5h9a1.5 1.5 0 0 1 1.5 1.5v37a1.5 1.5 0 0 1-1.5 1.5zM35 57h8V21h-8zM57.5 59h-9a1.5 1.5 0 0 1-1.5-1.5v-51A1.5 1.5 0 0 1 48.5 5h9A1.5 1.5 0 0 1 59 6.5v51a1.5 1.5 0 0 1-1.5 1.5zM49 57h8V7h-8z"/>
              </g>
            </svg>
          </div>
          <span className="text-[14px] font-medium">Análise de dados</span>
        </button>

        {/* Botão Histórico */}
        <button
          onClick={() => {
            if (onHistory) {
              onHistory();
              onClose();
            }
          }}
          className={`flex items-center gap-[12px] w-full px-[16px] py-[12px] text-left transition-colors duration-200 ${
            onHistory ? 'hover:bg-gray-50 text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="w-[22px] h-[22px] flex items-center justify-center">
            <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <g>
                <path d="M13.1 1A10.927 10.927 0 0 0 2.566 9.223l-.732-1.107a1 1 0 1 0-1.668 1.1l2.2 3.334a1.084 1.084 0 0 0 .634.425 1.024 1.024 0 0 0 .756-.145l3.3-2.223a1 1 0 1 0-1.115-1.659L4.44 9.96A8.909 8.909 0 1 1 13.1 21a8.892 8.892 0 0 1-7.281-3.822 1 1 0 1 0-1.64 1.143A10.881 10.881 0 0 0 24 12 10.963 10.963 0 0 0 13.1 1z"/>
                <path d="M13 5.95a1 1 0 0 0-1 1V12a1.04 1.04 0 0 0 .293.707l3 3.027a1.013 1.013 0 0 0 1.414.007 1 1 0 0 0 .006-1.414L14 11.589V6.95a1 1 0 0 0-1-1z"/>
              </g>
            </svg>
          </div>
          <span className="text-[14px] font-medium">Histórico</span>
        </button>

        {/* Botão Excluir */}
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-left hover:bg-red-50 transition-colors duration-200 text-red-600"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 19" fill="none">
              <path d="M6.4 7.86364C6.81027 7.86364 7.14841 8.17949 7.19462 8.5864L7.2 8.68182V13.5909C7.2 14.0428 6.84183 14.4091 6.4 14.4091C5.98973 14.4091 5.65159 14.0932 5.60538 13.6863L5.6 13.5909V8.68182C5.6 8.22995 5.95817 7.86364 6.4 7.86364Z" fill="#DC2626"/>
              <path d="M10.3946 8.5864C10.3484 8.17949 10.0103 7.86364 9.6 7.86364C9.15817 7.86364 8.8 8.22995 8.8 8.68182V13.5909L8.80538 13.6863C8.85159 14.0932 9.18973 14.4091 9.6 14.4091C10.0418 14.4091 10.4 14.0428 10.4 13.5909V8.68182L10.3946 8.5864Z" fill="#DC2626"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M9.6 0.5C10.8781 0.5 11.9229 1.52184 11.9959 2.81032L12 2.95455V3.77273H15.2C15.6418 3.77273 16 4.13904 16 4.59091C16 5.0105 15.6912 5.35632 15.2933 5.40359L15.2 5.40909H14.4V16.0455C14.4 17.3526 13.4009 18.4212 12.141 18.4958L12 18.5H4C2.72186 18.5 1.67707 17.4782 1.60407 16.1897L1.6 16.0455V5.40909H0.8C0.358172 5.40909 0 5.04278 0 4.59091C0 4.17132 0.308832 3.82549 0.706703 3.77823L0.8 3.77273H4V2.95455C4 1.64735 4.99914 0.578823 6.25898 0.504167L6.4 0.5H9.6ZM3.2 5.40909V16.0455C3.2 16.465 3.50883 16.8109 3.9067 16.8581L4 16.8636H12C12.4103 16.8636 12.7484 16.5478 12.7946 16.1409L12.8 16.0455V5.40909H3.2ZM10.4 3.77273H5.6V2.95455L5.60538 2.85913C5.65159 2.45221 5.98973 2.13636 6.4 2.13636H9.6L9.6933 2.14187C10.0912 2.18913 10.4 2.53495 10.4 2.95455V3.77273Z" fill="#DC2626"/>
            </svg>
          </div>
          <span className="text-[14px] font-medium">Excluir</span>
        </button>

        {/* Separador para próxima etapa */}
        <div className="h-[1px] bg-gray-100 my-[4px]" />

        {/* Seção Passar para próxima etapa */}
        <div className="px-[16px] py-[10px]">
          <div className="flex items-center gap-[10px] mb-[6px]">
            <div className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0">
              <svg 
                width="16" 
                height="14" 
                viewBox="0 0 18 15" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={isLastColumnOfStage && onMoveToNextStage ? 'text-blue-600' : 'text-gray-400'}
              >
                <path d="M16.7333 0.5H14.4219H8.16719C8.01992 0.5 7.90052 0.616341 7.90052 0.759833V3.34839H6.36563C6.21836 3.34839 6.09896 3.46473 6.09896 3.60822V5.7663H4.56393C4.41667 5.7663 4.29727 5.88264 4.29727 6.02614V8.71403H3.17031C3.02305 8.71403 2.90365 8.83037 2.90365 8.97386V11.3969H1.26667C1.1194 11.3969 1 11.5132 1 11.6567V14.2402C1 14.3837 1.1194 14.5 1.26667 14.5H16.7333C16.8806 14.5 17 14.3837 17 14.2402V0.759833C17 0.616341 16.8806 0.5 16.7333 0.5ZM14.1552 1.01967V3.34839H12.6202H8.43385V1.01967H14.1552ZM8.16719 3.86805H12.3535V5.7663H10.8186H6.63229V3.86805H8.16719ZM6.36563 6.28597H10.552V8.71403H9.42487H4.8306V6.28597H6.36563ZM4.56393 9.2337H9.1582V11.3969H7.52135H3.43698V9.2337H4.56393ZM1.53333 11.9165H3.17031H7.25469V13.9803H1.53333V11.9165ZM16.4667 13.9803H7.78802V11.9165H9.42487C9.57214 11.9165 9.69154 11.8002 9.69154 11.6567V9.2337H10.8186C10.9659 9.2337 11.0853 9.11736 11.0853 8.97386V6.28597H12.6202C12.7674 6.28597 12.8868 6.16963 12.8868 6.02614V3.86805H14.4219C14.5691 3.86805 14.6885 3.75171 14.6885 3.60822V1.01967H16.4667V13.9803Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"/>
              </svg>
            </div>
            <div className={`text-[13px] font-regular ${
              isLastColumnOfStage && onMoveToNextStage ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Passar para próxima etapa:
            </div>
          </div>
          
          <button
            onClick={() => {
              if (isLastColumnOfStage && onMoveToNextStage) {
                onMoveToNextStage();
                onClose();
              }
            }}
            className={`w-full px-[10px] py-[8px] rounded-[6px] border text-[11px] font-medium transition-colors duration-200 text-left ${
              isLastColumnOfStage && onMoveToNextStage 
                ? 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isLastColumnOfStage || !onMoveToNextStage}
          >
            {nextStageName}
          </button>
        </div>

        </div>
      </div>
    </>
  );
};

export default ModalEditar;