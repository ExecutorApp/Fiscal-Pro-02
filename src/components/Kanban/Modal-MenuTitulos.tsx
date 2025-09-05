import React, { useState, useEffect, useRef } from 'react';
import { ModalConfiguracao } from './Modal-Configuracao';
import ModalTempoColuna from './Modal-TempoColuna';

import { 
  X, 
  Trash2, 
  Calendar, 
  ChevronUp, 
  ChevronDown,
  AlertTriangle,
  GripVertical,
  ArrowUpDown,
  Tag,
  Clock,
  Plus
} from 'lucide-react';
import { ModalCriarTagColuna } from './Modal-CriarTagColuna';

// Função utilitária para classes CSS
function cn(...inputs: any[]): string {
  const clsx = (...inputs: any[]) => {
    const classes = [];
    for (const input of inputs) {
      if (typeof input === 'string') {
        classes.push(input);
      } else if (Array.isArray(input)) {
        classes.push(...input);
      } else if (typeof input === 'object' && input !== null) {
        for (const key in input) {
          if (input[key]) {
            classes.push(key);
          }
        }
      }
    }
    return classes.join(' ');
  };
  
  return clsx(...inputs);
}

interface Column {
  id: string;
  name: string;
  index: number;
}

interface ModalMenuTitulosProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  columnTitle: string;
  columnIndex: number;
  totalColumns: number;
  columns?: Column[];
  onRenameColumn: (columnId: string, newName: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumns?: (newColumnsOrder: Column[]) => void;
  onMoveColumn?: (columnId: string, direction: 'up' | 'down') => void;
  onSortCards: (columnId: string, sortType: 'recent' | 'oldest') => void;
}

const ModalMenuTitulos: React.FC<ModalMenuTitulosProps> = ({
  isOpen,
  onClose,
  columnId,
  columnTitle,
  columnIndex,
  totalColumns,
  columns,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumns,
  onMoveColumn,
  onSortCards
}) => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<'config' | 'reorder' | 'tags' | 'tempo'>('config');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editColumnName, setEditColumnName] = useState(columnTitle);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showInlineTagCreator, setShowInlineTagCreator] = useState(false);
  
  // Estados para a aba Tags
 const [columnTags, setColumnTags] = useState<Array<{id: string, name: string, color: string, isActive: boolean}>>([]);
 const [draggedTag, setDraggedTag] = useState<{id: string, name: string, color: string, isActive: boolean} | null>(null);
 const [dragOverTagIndex, setDragOverTagIndex] = useState<number | null>(null);
 const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState(false);
 const [tagToDelete, setTagToDelete] = useState<{id: string, name: string, color: string, isActive: boolean} | null>(null);
 const [editingTag, setEditingTag] = useState<{id: string, name: string, color: string, isActive: boolean} | null>(null);
 const [isEditMode, setIsEditMode] = useState(false);
 const tagsContainerRef = useRef<HTMLDivElement>(null);
 
  // Estado para controlar se a inicialização foi completada
 const [initialLoadComplete, setInitialLoadComplete] = useState(false);
 
  // Estado para tags originais (para comparação de mudanças)
 const [originalColumnTags, setOriginalColumnTags] = useState<Array<{id: string, name: string, color: string, isActive: boolean}>>([]);


  // Constante para chave do localStorage específica por coluna
 const COLUMN_TAGS_STORAGE_KEY = `kanban-column-tags-${columnId}`;

 // Função para salvar tags da coluna no localStorage
 const saveColumnTagsToLocalStorage = (tags: Array<{id: string, name: string, color: string, isActive: boolean}>) => {
   try {
          if (!tags || !Array.isArray(tags)) {
       console.warn(`?? Tentativa de salvar dados inválidos para coluna ${columnId}`);
       return;
     }

     const dataToSave = {
       timestamp: new Date().toISOString(),
       version: "1.0",
       columnId: columnId,
       tags: tags
     };
	 console.log(`💾 Salvando ${tags.length} tags na chave ${COLUMN_TAGS_STORAGE_KEY}:`, dataToSave);
     localStorage.setItem(COLUMN_TAGS_STORAGE_KEY, JSON.stringify(dataToSave));
     console.log(`✅ Salvamento concluído com sucesso!`);
   } catch (error) {
     console.error(`❌ Erro ao salvar tags da coluna ${columnId}:`, error);
   }
 };

 // Função para carregar tags da coluna do localStorage
 const loadColumnTagsFromLocalStorage = (): Array<{id: string, name: string, color: string, isActive: boolean}> => {
   try {
     const savedData = localStorage.getItem(COLUMN_TAGS_STORAGE_KEY);
     if (!savedData) return [];
     
     const parsedData = JSON.parse(savedData);
     if (!parsedData.tags || !Array.isArray(parsedData.tags)) return [];
     
     // Validar estrutura das tags
     const validTags = parsedData.tags.filter(tag => 
       tag && 
       typeof tag.id === 'string' && 
       typeof tag.name === 'string' && 
       typeof tag.color === 'string' && 
       typeof tag.isActive === 'boolean'
     );
     
     console.log(`? Tags da coluna ${columnId} carregadas do localStorage:`, validTags);
     return validTags;
   } catch (error) {
     console.error(`? Erro ao carregar tags da coluna ${columnId} do localStorage:`, error);
     return [];
   }
 };

 // Função para comparar tags (deep comparison)
 const compareTagsArrays = (current: Array<{id: string, name: string, color: string, isActive: boolean}>, original: Array<{id: string, name: string, color: string, isActive: boolean}>): boolean => {
   try {
     // Primeira verificação: tamanhos diferentes
     if (current.length !== original.length) return true;
     
     // Segunda verificação: comparação item por item
     return current.some((currentTag, index) => {
       const originalTag = original[index];
       if (!originalTag) return true;
       
       return (
         currentTag.id !== originalTag.id ||
         currentTag.name !== originalTag.name ||
         currentTag.color !== originalTag.color ||
         currentTag.isActive !== originalTag.isActive
       );
     });
   } catch (error) {
     console.error('Erro ao comparar tags:', error);
     return false;
   }
 };

  
  // Estados para tags universais
  const [useUniversalTags, setUseUniversalTags] = useState(false);
  const [showKanbanConfigModal, setShowKanbanConfigModal] = useState(false);
  
  // Estados para controle de barra de rolagem na aba reorder
 const [hasScrollbar, setHasScrollbar] = useState(false);
 const reorderContainerRef = useRef<HTMLDivElement>(null);
 const modalRef = useRef<HTMLDivElement>(null);
 
  // Carregar tags da coluna do localStorage quando modal abrir
 useEffect(() => {
   if (isOpen) { 
     console.log(`?? Carregando tags para coluna ${columnId}...`);
     setInitialLoadComplete(false); // Reset flag de inicialização
    const savedColumnTags = loadColumnTagsFromLocalStorage();
     console.log(`?? Tags carregadas:`, savedColumnTags);
    setColumnTags(savedColumnTags);
	
	     // Salvar estado original para comparação de mudanças
     setOriginalColumnTags(JSON.parse(JSON.stringify(savedColumnTags)));
     console.log(`?? Estado original das tags salvo:`, savedColumnTags);

     
     // Marca inicialização como completa após pequeno delay
     setTimeout(() => {
       setInitialLoadComplete(true);
       console.log(`? Inicialização completa para coluna ${columnId}`);
     }, 100);
  } else {
    // Reset quando modal fecha
    setInitialLoadComplete(false);
	setOriginalColumnTags([]);
  }
 }, [isOpen, columnId]);

 // Salvar tags automaticamente quando columnTags mudar
 useEffect(() => {
      // Só salva após inicialização completa e se realmente há mudanças
   if (isOpen && columnTags !== undefined && initialLoadComplete) {

     saveColumnTagsToLocalStorage(columnTags);
   }
 }, [columnTags, isOpen, columnId]);
 
  // useEffect de debug para monitorar o estado
 useEffect(() => {
   console.log(`?? Debug Estado:`, {
     isOpen,
     columnId,
     tagsCount: columnTags.length,
	 originalTagsCount: originalColumnTags.length,
     initialLoadComplete,
	 hasChanges: compareTagsArrays(columnTags, originalColumnTags),
     tags: columnTags
   });
 }, [columnTags, originalColumnTags, isOpen, columnId, initialLoadComplete]);

 // useEffect de debug para estado de edição
 useEffect(() => {
   if (isEditMode && editingTag) {
     console.log(`?? Modo de edição ativo:`, {
       editingTagId: editingTag.id,
       editingTagName: editingTag.name,
       isEditMode: isEditMode
     });
   }
 }, [isEditMode, editingTag]);


  // Gerar colunas localmente se não fornecidas
  const localColumns = React.useMemo(() => 
    columns || Array.from({ length: totalColumns }, (_, index) => ({
      id: `column${index}`,
      name: index === columnIndex ? columnTitle : `Coluna ${index + 1}`,
      index
    })), [columns, totalColumns, columnIndex, columnTitle]
  );
  
  const [reorderColumns, setReorderColumns] = useState<Column[]>(localColumns);
  const [originalColumns, setOriginalColumns] = useState<Column[]>(localColumns);
  const [draggedItem, setDraggedItem] = useState<Column | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortType, setSortType] = useState<'recent' | 'oldest'>('recent');
  
  // Verificar se as funcionalidades de reordenação estão disponíveis
  const canReorder = true;

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setShowDeleteConfirm(false);
      setReorderColumns(localColumns);
      setOriginalColumns(localColumns);
      setActiveTab('config');
      setEditColumnName(columnTitle);
    }
  }, [isOpen, columnTitle, localColumns]);

 // Verificar scroll quando colunas da aba reorder mudam
 useEffect(() => {
   if (activeTab === 'reorder') {
     checkReorderScrollbar();
   }
 }, [reorderColumns, activeTab]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
     if (event.key === 'Escape' && !showDeleteConfirm && !showUnsavedChangesModal) {
       handleClose();
     }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
   }, [isOpen, showDeleteConfirm, showUnsavedChangesModal]);

  const handleClose = () => {
     if (hasUnsavedChanges) {
     setShowUnsavedChangesModal(true);
     return;
   }
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

 const handleForceClose = () => {
   setShowUnsavedChangesModal(false);
   setIsAnimating(false);
   setTimeout(() => {
     onClose();
   }, 200);
 };

 const handleStayInModal = () => {
   setShowUnsavedChangesModal(false);
 };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDeleteColumn(columnId);
      handleClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleSortCards = (type: 'recent' | 'oldest') => {
    setSortType(type);
    onSortCards(columnId, type);
  };

  // Funções para Tags
  const handleOpenCreateTagModal = () => {
    setShowCreateTagModal(true);
  };

  const handleCloseCreateTagModal = () => {
    setShowCreateTagModal(false);
   
   // Resetar estado de edição ao fechar modal
   setEditingTag(null);
   setIsEditMode(false);
  };

 const handleCreateTag = (newTag: Omit<{id: string, name: string, color: string, isActive: boolean}, 'id'>) => {
   // Verificar se está em modo de edição
   if (isEditMode && editingTag) {
     // MODO EDIÇÃO: Atualizar tag existente
     const updatedTag = {
       ...editingTag, // Preservar ID original
       name: newTag.name,
       color: newTag.color,
       isActive: newTag.isActive
     };
     
     console.log(`?? Editando tag existente (ID: ${editingTag.id}):`, updatedTag);
     
     setColumnTags(prev => {
       const updatedTags = prev.map(tag => 
         tag.id === editingTag.id ? updatedTag : tag
       );
       console.log(`?? Tag atualizada no array. Total: ${updatedTags.length} tags`);
       return updatedTags;
     });
     
     // Resetar estado de edição
     setEditingTag(null);
     setIsEditMode(false);
     
   } else {
     // MODO CRIAÇÃO: Criar nova tag
     const tagWithId = {
       ...newTag,
       isActive: true,
       id: `tag-${columnId}-${Date.now()}`, // ID único incluindo columnId
     };
     
     console.log(`? Criando nova tag para coluna ${columnId}:`, tagWithId);
     console.log(`?? Estado antes da criação:`, { current: columnTags.length, original: originalColumnTags.length });
     
     setColumnTags(prev => {
       const updatedTags = [...prev, tagWithId];
       console.log(`?? Nova tag adicionada. Total: ${updatedTags.length} tags`);
       return updatedTags;
     });
   }
 };

 // Função para alternar ativação da tag
 const handleToggleTag = (tagId: string) => {
   setColumnTags(prev => {
     const updatedTags = prev.map(tag => 
       tag.id === tagId ? { ...tag, isActive: !tag.isActive } : tag
     );
	 const toggledTag = updatedTags.find(t => t.id === tagId);
	 console.log(`🔘 Tag "${toggledTag?.name}" (${tagId}) ${toggledTag?.isActive ? 'ativada' : 'desativada'}`);
     return updatedTags;
   });
 };
 
  // Função para abrir o modal de configurações do Kanban na aba Tags
 const handleOpenKanbanConfig = () => {
   setShowKanbanConfigModal(true);
 };

 // Função para fechar o modal de configurações do Kanban
 const handleCloseKanbanConfig = () => {
   setShowKanbanConfigModal(false);
 };


 // Função para editar tag
 const handleEditTag = (tag: {id: string, name: string, color: string, isActive: boolean}) => {
   console.log(`🖊️ Iniciando edição da tag:`, tag);
   setEditingTag(tag);
   setIsEditMode(true);
   setShowCreateTagModal(true);
   console.log(`📝 Estado de edição ativado para tag ID: ${tag.id}`);
 };

 // Função para remover tag
 const handleRemoveTag = (tag: {id: string, name: string, color: string, isActive: boolean}) => {
   setTagToDelete(tag);
   setShowDeleteTagConfirm(true);
 };

 // Função para confirmar exclusão da tag
 const handleConfirmDeleteTag = () => {
   if (!tagToDelete) return;
   
   setColumnTags(prev => {
     const updatedTags = prev.filter(tag => tag.id !== tagToDelete.id);
     console.log(`??? Tag ${tagToDelete.name} removida da coluna ${columnId}`);
     return updatedTags;
   });
   setShowDeleteTagConfirm(false);
   setTagToDelete(null);
 };

 // Função para cancelar exclusão
 const handleCancelDeleteTag = () => {
   setShowDeleteTagConfirm(false);
   setTagToDelete(null);
 };

 // Função para verificar se há barra de rolagem
 const checkTagsScrollbar = () => {
   if (tagsContainerRef.current) {
     const element = tagsContainerRef.current;
     const hasScroll = element.scrollHeight > element.clientHeight;
     setHasScrollbar(hasScroll);
   }
 };

 // Drag and Drop functions
  const handleTagDragStart = (e: React.DragEvent, tag: {id: string, name: string, color: string, isActive: boolean}) => {
   setDraggedTag(tag);

   e.dataTransfer.effectAllowed = 'move';
   e.dataTransfer.setData('text/html', '');
 };

 const handleTagDragOver = (e: React.DragEvent, index: number) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'move';
   
   if (!draggedTag) return;
   const draggedIndex = columnTags.findIndex(tag => tag.id === draggedTag.id);
   
   if (draggedIndex === index) {
     setDragOverTagIndex(null);
     return;
   }
   
   setDragOverTagIndex(index);
 };

   const handleTagDragLeave = (e: React.DragEvent) => {
   const rect = e.currentTarget.getBoundingClientRect();
   const x = e.clientX;
   const y = e.clientY;
   
   if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
     setDragOverTagIndex(null);
   }
 };

 const handleTagDrop = (e: React.DragEvent, targetIndex: number) => {
   e.preventDefault();
   if (!draggedTag) return;

   const draggedIndex = columnTags.findIndex(tag => tag.id === draggedTag.id);
   
   if (draggedIndex === -1 || draggedIndex === targetIndex) {
    setDraggedTag(null);
    setDragOverTagIndex(null);
     return;
   }

   const newTags = [...columnTags];
   const [removed] = newTags.splice(draggedIndex, 1);
   
   let insertIndex = targetIndex;
   if (draggedIndex < targetIndex) {
     insertIndex = targetIndex - 1;
   }
   
   insertIndex = insertIndex > newTags.length ? newTags.length : insertIndex;
   newTags.splice(insertIndex, 0, removed);

   setColumnTags(newTags);
  setDraggedTag(null);
  setDragOverTagIndex(null);
 };

 const handleTagDragEnd = () => {
   setDraggedTag(null);
   setDragOverTagIndex(null);
 };

 const handleTagDropAtEnd = (e: React.DragEvent) => {
   handleTagDrop(e, columnTags.length);
 };

  const handleDeleteTag = (tagId: string) => {
    setColumnTags(columnTags.filter(tag => tag.id !== tagId));
  };

  // Drag and Drop functions
  const handleDragStart = (e: React.DragEvent, column: Column) => {
    setDraggedItem(column);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem) return;
    
    const draggedIndex = reorderColumns.findIndex(col => col.id === draggedItem.id);
    
    if (draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }
    
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = reorderColumns.findIndex(col => col.id === draggedItem.id);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newColumns = [...reorderColumns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    
    const insertIndex = targetIndex > newColumns.length ? newColumns.length : targetIndex;
    newColumns.splice(insertIndex, 0, removed);

    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      index
    }));

    setReorderColumns(updatedColumns);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDropAtEnd = (e: React.DragEvent) => {
    handleDrop(e, reorderColumns.length);
  };

  const formatColumnNumber = (index: number) => {
    return (index + 1).toString().padStart(2, '0');
  };

  // Verificar se há mudanças não salvas
  const hasUnsavedChanges = React.useMemo(() => {
    if (activeTab === 'config') {
      return editColumnName.trim() !== columnTitle;
    } else if (activeTab === 'reorder') {
      if (reorderColumns.length !== originalColumns.length) return true;
      
      return reorderColumns.some((col, index) => {
        const originalCol = originalColumns[index];
        return !originalCol || col.id !== originalCol.id || col.name !== originalCol.name;
      });
    } else if (activeTab === 'tags') {
      // Verificar se há mudanças reais nas tags
      if (!initialLoadComplete) return false; // Não considerar mudanças até inicialização completa
      return compareTagsArrays(columnTags, originalColumnTags);
    }
    return false;
  }, [activeTab, editColumnName, columnTitle, reorderColumns, originalColumns, columnTags, originalColumnTags, initialLoadComplete]);

 // Função para verificar se há barra de rolagem na aba reorder
 const checkReorderScrollbar = () => {
   if (reorderContainerRef.current) {
     const element = reorderContainerRef.current;
     const hasScroll = element.scrollHeight > element.clientHeight;
     setHasScrollbar(hasScroll);
   }
 };

  const handleColumnNameChange = (targetColumnId: string, newName: string) => {
    setReorderColumns(prev => 
      prev.map(col => 
        col.id === targetColumnId ? { ...col, name: newName } : col
      )
    );
  };

  const handleSaveChanges = () => {
    if (activeTab === 'config') {
      // Salvar mudanças do nome da coluna
      if (editColumnName.trim() !== columnTitle) {
        onRenameColumn(columnId, editColumnName.trim());
      }
    } else if (activeTab === 'reorder') {
      // Salvar reordenação de colunas
      if (onReorderColumns) {
        onReorderColumns(reorderColumns);
      }
      
      // Salvar mudanças de nome que possam ter sido feitas
      reorderColumns.forEach(column => {
        const originalColumn = originalColumns.find(orig => orig.id === column.id);
        if (originalColumn && column.name !== originalColumn.name) {
          onRenameColumn(column.id, column.name);
        }
      });
    } else if (activeTab === 'tags') {
     // Tags já são salvas automaticamente via useEffect
     // Atualizar estado original para o atual (reseta mudanças)
     setOriginalColumnTags(JSON.parse(JSON.stringify(columnTags)));
     console.log(`?? Estado original das tags atualizado após salvamento:`, columnTags);

    } else if (activeTab === 'tempo') {
      // TODO: Implementar salvamento para tempo
      console.log('Salvando configurações de tempo:', {
        timeControlEnabled,
        maxTime,
        timeUnit,
        timeExceededAction,
        moveToColumnId
      });
    }
    
   // Forçar fechamento sem verificar alterações não salvas (acabou de salvar)
   setIsAnimating(false);
   setTimeout(() => {
     onClose();
   }, 200);
  };

  const handleCancel = () => {
    if (activeTab === 'reorder') {
      setReorderColumns(originalColumns);
      setDraggedItem(null);
      setDragOverIndex(null);
    } else if (activeTab === 'tags') {
    
     // Restaurar tags para o estado original
     setColumnTags(JSON.parse(JSON.stringify(originalColumnTags)));
     console.log(`?? Tags da coluna ${columnId} restauradas para estado original:`, originalColumnTags);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
  <>
  
     <style jsx>{`
     .modern-scrollbar {
       scrollbar-width: thin;
       scrollbar-color: #CBD5E1 transparent;
     }
     .modern-scrollbar::-webkit-scrollbar {
       width: 6px;
     }
     .modern-scrollbar::-webkit-scrollbar-track {
       background: transparent;
     }
     .modern-scrollbar::-webkit-scrollbar-thumb {
       background-color: #CBD5E1;
       border-radius: 3px;
       border: none;
     }
     .modern-scrollbar::-webkit-scrollbar-thumb:hover {
       background-color: #94A3B8;
     }
     .modern-scrollbar::-webkit-scrollbar-corner {
       background: transparent;
     }
     
     /* Drag and Drop feedback */
     .dragging {
       opacity: 0.5;
       transform: rotate(2deg);
     }
     
     .drag-over {
       border-color: #1777CF !important;
       border-width: 2px !important;
       background-color: rgba(23, 119, 207, 0.05) !important;
     }
   `}</style>

    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
      isAnimating ? 'bg-black bg-opacity-40' : 'bg-transparent'
    }`}>
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg mx-4 h-[600px] flex flex-col transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Configurações da Coluna
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="flex justify-center px-6 pb-5">
            <div className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-600">
              <button
                onClick={() => setActiveTab('config')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-gray-700 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
                  activeTab === 'config'
                    ? "bg-white text-[#1777CF] shadow-sm"
                    : ""
                )}
              >
                Configurações
              </button>
              <button
                onClick={() => setActiveTab('reorder')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-gray-700 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
                  activeTab === 'reorder'
                    ? "bg-white text-[#1777CF] shadow-sm"
                    : ""
                )}
              >
                Reordenar
              </button> 
              <button
                onClick={() => setActiveTab('tags')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-gray-700 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50 ml-[0px]",
                  activeTab === 'tags'
                    ? "bg-white text-[#1777CF] shadow-sm"
                    : ""
                )}
              >
                <Tag size={16} className="mr-1" />
                Tags
              </button>
              <button
                onClick={() => setActiveTab('tempo')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-gray-700 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
                  activeTab === 'tempo'
                    ? "bg-white text-[#1777CF] shadow-sm"
                    : ""
                )}
              >
                <Clock size={16} className="mr-1" />
                Tempo
              </button>
            </div>
          </div>

          {activeTab === 'reorder' && (
            <div className="px-6 pb-4">
              <div className="text-center text-sm text-gray-600">
                Arraste para reordenar ou edite os nomes diretamente
              </div>
            </div>
          )}
        </div>

        <div className="px-[20px] pt-2.5 pb-4 flex-1 overflow-hidden">
          {/* Aba Configurações */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Nome da Coluna */}
              <div className="space-y-3">
                <h4 className="font-medium ml-[5px] text-gray-700">Nome da Coluna</h4>
                <input
                  type="text"
                  value={editColumnName}
                  onChange={(e) => setEditColumnName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#1777CF] transition-colors duration-200 text-gray-800"
                  placeholder="Digite o nome da coluna"
                />
              </div>

              {/* Divisória */}
              <hr className="border-gray-200" />
 
              {/* Organizar Cards por Data */}
              <div className="space-y-3">
                <h4 className="font-medium ml-[5px] text-gray-700">Organizar Cards por Data</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSortCards('recent')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                      sortType === 'recent'
                        ? 'bg-[#1777CF] border-[#1777CF] text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      sortType === 'recent' ? 'border-white' : 'border-gray-300'
                    }`}>
                      {sortType === 'recent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium">Recentes Primeiro</span>
                  </button>
                  <button
                    onClick={() => handleSortCards('oldest')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                      sortType === 'oldest'
                        ? 'bg-[#1777CF] border-[#1777CF] text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      sortType === 'oldest' ? 'border-white' : 'border-gray-300'
                    }`}>
                      {sortType === 'oldest' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium">Mais Antigos Primeiro</span>
                  </button>
                </div>
              </div>

              {/* Divisória */}
              <hr className="border-gray-200" />

              {/* Zona de Perigo */}
              <div className="space-y-3">
                <h4 className="font-medium ml-[5px] text-gray-700">Zona de Perigo</h4>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-all duration-200"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-medium">Excluir Coluna</span>
                </button>
              </div>
            </div>
          )}

          {/* Aba Reordenar */} 
          {activeTab === 'reorder' && ( 
            <div className="space-y-[0px] mt-[-10px]">     
              <div className="bg-gray-50 rounded-lg p-[10px] my-[0px] overflow-y-auto h-[320px]"> 
                <div 
                 ref={reorderContainerRef}
                 className={`overflow-y-auto h-[300px] ${hasScrollbar ? 'pr-[10px]' : 'pr-0'}`}
                 onScroll={checkReorderScrollbar}
               > 

                <div className="space-y-[10px]">
                  {reorderColumns.map((column, index) => (
                    <React.Fragment key={column.id}> 
                      {draggedItem && dragOverIndex === index && (
                        <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                      )}
                      
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, column)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-center gap-3 p-3 bg-white border rounded-lg transition-all duration-200 cursor-move select-none ${
                          column.id === columnId
                            ? 'border-[#1777CF]/50 bg-[#1777CF]/5'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        } ${draggedItem?.id === column.id ? 'opacity-40 scale-95 rotate-1' : ''}`}
                      >
                        <GripVertical size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                        
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                              column.id === columnId
                                ? 'bg-[#1777CF] text-white'
                                : 'bg-[#1777CF]/10 text-[#1777CF]'
                            }`}>
                              {formatColumnNumber(index)}
                            </span> 
                          </div>
                          
                          <div className="text-gray-400 font-medium text-sm">|</div>
                          
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                              className="w-full bg-transparent border-none outline-none font-medium text-gray-800 focus:bg-gray-50 rounded-lg pl-2 py-1 transition-colors text-sm"
                              placeholder="Nome da coluna"
                            />
                          </div>
                        </div>
                        
                        {column.id === columnId && (
                          <div className="text-xs text-[#1777CF] flex-shrink-0 bg-[#1777CF]/10 px-2 py-1 rounded font-medium">
                            Atual
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                  
                  {draggedItem && dragOverIndex === reorderColumns.length && (
                    <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                  )}
                  
                  {draggedItem && (
                    <div
                      onDragOver={(e) => handleDragOver(e, reorderColumns.length)}
                      onDrop={handleDropAtEnd}
                      className="h-4 w-full"
                    />
                  )}
                </div>
              </div>
                </div>
              </div>
          )}

          {/* Aba Tags */}
          {activeTab === 'tags' && (
           <div className="pl-[0px] pr-[0px] pt-[0px] pb-[0px] h-full"> 
             <div className="space-y-4 h-full flex flex-col">
               {/* Header da seção */}
               <div className="flex items-center justify-between">
                 <div className="flex-1">
                   <h3 className="text-lg font-semibold text-gray-900 ml-[10px]">
                     Gerenciar Tags
                   </h3>
                   <p className="text-sm text-gray-600 ml-[10px]">
                     Crie tags personalizadas
                   </p>
                 </div>
                 
                 {/* Container dos controles à direita */}
                 <div className="flex items-center gap-3">
                   {/* Toggle Switch para Tags Universais */}
                   <div className="flex items-center gap-2">
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         checked={useUniversalTags}
                         onChange={(e) => setUseUniversalTags(e.target.checked)}
                         className="sr-only peer"
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1777CF]"></div>
                     </label>
                   </div>

                   {/* Botão de Ícone de Tag */}
                   <button
                     onClick={handleOpenKanbanConfig}
                     className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 shadow-sm"
                     title="Abrir Configurações do Kanban"
                   >
                     <Tag size={18} className="text-gray-600" />
                   </button>

                   {/* Botão Adicionar Tag */}
                   <button
                     onClick={handleOpenCreateTagModal}
                     className="flex items-center gap-2 px-4 py-2 bg-[#1777CF] text-white rounded-lg text-sm font-medium hover:bg-[#1777CF]/90 transition-all duration-200 shadow-sm shrink-0"
                   >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                       <line x1="12" y1="5" x2="12" y2="19"/>
                       <line x1="5" y1="12" x2="19" y2="12"/>
                     </svg>
                     Adicionar Tag
                   </button>
                 </div>
               </div>

               {/* Container das Tags - Altura fixa com scroll interno */}
               <div className="flex-1 min-h-0">
                 <div className="bg-gray-50 rounded-xl p-4 h-full overflow-hidden">
                   {columnTags && columnTags.length > 0 ? (
                     <div 
                       ref={tagsContainerRef}
                       className={`h-full overflow-y-auto ${hasScrollbar ? 'pr-[10px]' : 'pr-0'}`} 
                       style={{ scrollBehavior: 'auto' }}
                       onScroll={checkTagsScrollbar}
                     >
                       <div className="space-y-[10px]">
                         {columnTags.map((tag, index) => {
                           if (!tag || !tag.id) return null;
                           return (
                             <React.Fragment key={tag.id}>
                               {draggedTag && dragOverTagIndex === index && (
                                 <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                               )}
                               
                               <div
                                 draggable={true}
                                onDragStart={(e) => handleTagDragStart(e, tag)}
                                onDragOver={(e) => handleTagDragOver(e, index)}
                                onDragLeave={handleTagDragLeave}
                                onDrop={(e) => handleTagDrop(e, index)}
                                onDragEnd={handleTagDragEnd}
                                 className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-move select-none ${
                                   draggedTag?.id === tag.id ? 'opacity-40 scale-95 rotate-1' : ''
                                 }`}
                               >
                                 {/* Drag Handle */}
                                 <div className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex-shrink-0">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                     <circle cx="9" cy="12" r="1"/>
                                     <circle cx="9" cy="5" r="1"/>
                                     <circle cx="9" cy="19" r="1"/>
                                     <circle cx="15" cy="12" r="1"/>
                                     <circle cx="15" cy="5" r="1"/>
                                     <circle cx="15" cy="19" r="1"/>
                                   </svg>
                                 </div>

                                 {/* Toggle Switch iOS Style */}
                                 <div 
                                   className="relative cursor-pointer"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleToggleTag(tag.id);
                                   }}
                                 >
                                   <input
                                     type="checkbox"
                                     checked={tag.isActive}
                                     onChange={(e) => {
                                       e.stopPropagation();
                                       handleToggleTag(tag.id);
                                     }}
                                     className="sr-only peer"
                                   />
                                   <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none transition-all duration-200 peer-checked:bg-[#1777CF]"></div>
                                   <div className="absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-200 peer-checked:translate-x-4 peer-checked:border-white"></div>
                                 </div>

                                 {/* Quadrado da Cor da Tag */}
                                 <div
                                   className="w-4 h-4 rounded-[4px] transition-all duration-200"
                                   style={{ backgroundColor: tag.color, opacity: tag.isActive ? 1 : 0.4 }}
                                 />
                                 
                                 {/* Nome da Tag */}
                                 <div className="flex-1">
                                   <span className="text-sm font-medium text-gray-900">
                                     {tag.name}
                                   </span>
                                 </div>

                                 {/* Edit Button */}
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (tag.isActive) {
                                       handleEditTag(tag);
                                     }
                                   }}
                                   className={tag.isActive 
                                     ? "p-1.5 hover:bg-blue-50 rounded-full transition-all duration-200 group cursor-pointer" 
                                     : "p-1.5 rounded-full transition-all duration-200 group cursor-not-allowed opacity-50"
                                   }
                                 >
                                   <svg 
                                     width="16" 
                                     height="16" 
                                     viewBox="0 0 24 24" 
                                     fill="none" 
                                     stroke="currentColor" 
                                     strokeWidth="2" 
                                     className={tag.isActive 
                                       ? "text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
                                       : "text-gray-300 transition-colors duration-200"
                                     }
                                   >
                                     <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                     <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                   </svg>
                                 </button>

                                 {/* Remove Button */}
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleRemoveTag(tag);
                                   }}
                                   className="p-1.5 hover:bg-red-50 rounded-full transition-all duration-200 group"
                                 >
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-red-500 transition-colors duration-200">
                                     <polyline points="3,6 5,6 21,6"/>
                                     <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                                   </svg>
                                 </button>
                               </div>
                             </React.Fragment>
                           );
                         })}
                         
                        {draggedTag && dragOverTagIndex === columnTags.length && (
                           <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                         )}
                         
                         {draggedTag && (
                           <div
                            onDragOver={(e) => handleTagDragOver(e, columnTags.length)}
                            onDrop={handleTagDropAtEnd}
                             className="h-4 w-full"
                           />
                         )}
                       </div>
                     </div>
) : (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
      <svg 
        width="28" 
        height="28" 
        viewBox="0 0 256.313 256.313" 
        fill="currentColor" 
        className="text-gray-400"
      >
        <path d="M163.854 250.072c-8.365 8.322-21.87 8.322-30.192 0L16.047 139.762c-6.576-6.168-14.414-17.856-14.979-26.853-1.512-24.34-.446-70.947.294-95.657C1.628 8.246 9.2.696 18.212.489c31.568-.734 98.452-1.518 104.669 4.705l129.52 117.179c8.316 8.322.772 29.371-7.609 37.736l-80.938 89.963zM60.789 36.284c-7.054-7.038-18.46-7.038-25.52 0-7.038 7.06-7.038 18.46 0 25.498 7.065 7.044 18.471 7.044 25.52 0 7.044-7.038 7.044-18.444 0-25.498z"/>
      </svg>
    </div>
    <p className="text-sm text-gray-600 mb-2">Nenhuma tag criada ainda</p>
    <p className="text-xs text-gray-500">Clique em "Adicionar Tag" para começar</p>
  </div>
)}
                 </div>
               </div>
             </div>
           </div>
          )}
        </div>
		 {/* Aba Tempo */}
         {activeTab === 'tempo' && (
           <ModalTempoColuna
             isOpen={activeTab === 'tempo'}
             onClose={() => setActiveTab('config')}
             columnId={columnId}
             columnTitle={columnTitle}
           />
         )}


       {/* Botões de Ação - Para abas config, reorder e tags */}
       {(activeTab === 'config' || activeTab === 'reorder' || activeTab === 'tags') && (
          <div className="bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between p-6">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                  hasUnsavedChanges
                    ? 'bg-[#1777CF] hover:bg-[#1777CF]/90 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Salvar Alterações 
              </button>
            </div>
          </div>
        )}
      </div> 
    </div>
   
      {/* Modal de Criação de Tag da Coluna */}
      <ModalCriarTagColuna
        isOpen={showCreateTagModal}
        onClose={handleCloseCreateTagModal}
        onAddTag={handleCreateTag}
		columnId={columnId}
       editingTag={editingTag}
       isEditMode={isEditMode}
      />
	  
	{/* Modal de Configurações do Kanban */}
   {showKanbanConfigModal && (
     <ModalConfiguracao
       isOpen={showKanbanConfigModal}
       onClose={handleCloseKanbanConfig}
       onSave={(config) => {
         // Implementar lógica de salvamento das configurações
         console.log('Configurações salvas:', config);
         handleCloseKanbanConfig();
       }}
       currentConfig={{
         displayMode: 'date-time',
         showCardInfo: true,
         tags: [],
         showTags: true
       }}
	   initialTab="tags"
     />
   )}

   {/* Modal de Confirmação de Exclusão - Independente */}
   {showDeleteConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div 
          className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
           <div className="text-center">
            {/* Ícone centralizado no topo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
            </div>
            
            {/* Título centralizado */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirmar exclusão
            </h3>
            
            {/* Mensagem centralizada */}
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Esta ação não pode ser desfeita e todos os cards desta coluna serão perdidos.
            </p>
          </div>
         <div className="flex gap-4 mt-6">
           <button
             onClick={() => setShowDeleteConfirm(false)}
             className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
           >
             Cancelar
           </button>
           <button
             onClick={handleDelete}
             className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
           >
             Confirmar
           </button>
         </div>
       </div>
     </div>
   )}
   
   {/* Modal de Confirmação de Alterações Não Salvas */}
   {showUnsavedChangesModal && (
     <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
       <div 
         className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300"
         onClick={(e) => e.stopPropagation()}
       >
         <div className="text-center">
           {/* Ícone centralizado no topo */}
           <div className="flex justify-center mb-4">
             <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
               <AlertTriangle size={24} className="text-orange-500" />
             </div>
           </div>
           
           {/* Título centralizado */}
           <h3 className="text-lg font-semibold text-gray-900 mb-3">
             Alterações Não Salvas
           </h3>
           
           {/* Mensagem centralizada */}
           <p className="text-sm text-gray-600 mb-8 leading-relaxed">
             Você fez alterações que ainda não foram salvas. Deseja sair sem salvar?
           </p>
         </div>
         <div className="flex gap-4 mt-6">
           <button
             onClick={handleStayInModal}
             className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
           >
             Voltar
           </button>
           <button
             onClick={handleForceClose}
             className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
           >
             Sair sem Salvar
           </button>
         </div>
       </div>
     </div>
   )}
   {/* Modal de Confirmação de Exclusão de Tag */}
   {showDeleteTagConfirm && (
     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
       <div 
         className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300"
         onClick={(e) => e.stopPropagation()}
       >
         <div className="text-center">
           <div className="flex justify-center mb-4">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
               <AlertTriangle size={24} className="text-red-500" />
             </div>
           </div>
           
           <h3 className="text-lg font-semibold text-gray-900 mb-3">
             Confirmar exclusão
           </h3>
           
           <p className="text-sm text-gray-600 mb-8 leading-relaxed">
             Tem certeza que deseja excluir a tag "{tagToDelete?.name}"? Esta ação não pode ser desfeita.
           </p>
         </div>
         
         <div className="flex gap-4 mt-6">
           <button
             onClick={handleCancelDeleteTag}
             className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
           >
             Cancelar
           </button>
           <button
             onClick={handleConfirmDeleteTag}
             className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
           >
             Excluir Tag
           </button>
         </div>
       </div>
     </div>
   )} 
   </>
 );
};

export default ModalMenuTitulos; 