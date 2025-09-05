import React, { useState, useEffect, useRef } from 'react';
import { ModalCriarTag } from './Modal-CriarTag'; // ← Importação do componente separado

interface Tag {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface KanbanConfig {
  displayMode: 'date-time' | 'date-only' | 'time-only'; 
  showCardInfo: boolean;
  tags: Tag[];
  showTags: boolean;
}

interface ModalConfiguracaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: KanbanConfig) => void;
  currentConfig: KanbanConfig;
  initialTab?: 'display' | 'tags';
}

export const ModalConfiguracao: React.FC<ModalConfiguracaoProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  initialTab = 'display',
}) => {
	
   // Verificação de segurança para currentConfig
  if (!currentConfig) {
    console.warn('ModalConfiguracao: currentConfig é undefined');
    return null;
  }
	
  // Constante para chave do localStorage
  const TAGS_STORAGE_KEY = 'kanban-tags-config';

   const [config, setConfig] = useState<KanbanConfig>(() => currentConfig || {
   displayMode: 'date-time',
   showCardInfo: true,
   tags: [],
   showTags: true
 });

  const [activeTab, setActiveTab] = useState<'display' | 'tags'>(initialTab);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<Tag | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  
 // Estados para controle de mudanças e botão de salvar
 const [originalConfig, setOriginalConfig] = useState<KanbanConfig | null>(null);
 const [hasChanges, setHasChanges] = useState(false);
 const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  
 // Estado para controle do modal de confirmação
 const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

 // Verificar scroll quando modal abre
 useEffect(() => {
   if (isOpen) {
     setTimeout(checkScrollbar, 100); // Timeout para garantir que o DOM está renderizado
     
     // Observer para mudanças no tamanho do conteúdo
     const observer = new ResizeObserver(() => {
       checkScrollbar();
     });
     
     if (tagsContainerRef.current) {
       observer.observe(tagsContainerRef.current);
     }
     
     return () => {
       observer.disconnect();
     };
   }
 }, [isOpen]);

 // Armazenar configuração original quando modal abrir
 useEffect(() => {
   if (isOpen && currentConfig) {
     setOriginalConfig(JSON.parse(JSON.stringify(currentConfig)));
     setHasChanges(false);
     setIsSaveDisabled(true);
	 
	 // Garantir que config está sincronizado com currentConfig
     const savedTags = loadTagsFromLocalStorage();
     const configToSet = {
       ...currentConfig,
       tags: savedTags.length > 0 ? savedTags : currentConfig.tags || []
     };
     setConfig(configToSet);
     setOriginalConfig(JSON.parse(JSON.stringify(configToSet)));
   }
 }, [isOpen, currentConfig]);

  const saveTagsToLocalStorage = (tags: Tag[]) => {
    try {
	if (!tags || !Array.isArray(tags)) return;
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Erro ao salvar tags no localStorage:', error);
    }
  };

  // Função para carregar tags do localStorage
  const loadTagsFromLocalStorage = (): Tag[] => {
    try {
      const savedTags = localStorage.getItem(TAGS_STORAGE_KEY);
          if (!savedTags) return [];
     const parsed = JSON.parse(savedTags);
     if (!Array.isArray(parsed)) return [];
     return parsed.filter(tag => tag && tag.id && tag.name && tag.color);

    } catch (error) {
      console.error('Erro ao carregar tags do localStorage:', error);
      return [];
    }
  };

  // Carregar tags do localStorage na inicialização e mesclar com currentConfig
  useEffect(() => {
	  if (!currentConfig) return;
    const savedTags = loadTagsFromLocalStorage();
   // Usar as tags do currentConfig se não houver originalConfig ainda
   if (!originalConfig) {
     setConfig(prev => ({
       ...currentConfig,
       tags: savedTags.length > 0 ? savedTags : currentConfig.tags || []
     }));
   }
  }, [currentConfig]);
  
   // Verificar scroll quando tags mudam
 useEffect(() => {
   checkScrollbar();
 }, [config.tags]);

 // Resetar estados quando modal principal fechar
 useEffect(() => {
   if (!isOpen) {
     setShowUnsavedChangesModal(false);
     setOriginalConfig(null);
     setHasChanges(false);
     setIsSaveDisabled(true);
   }
 }, [isOpen]);
 
  // Resetar aba quando modal abrir
 useEffect(() => {
   if (isOpen) {
     setActiveTab(initialTab);
   }
 }, [isOpen, initialTab]);

  // Função para adicionar nova tag (recebe dados do Modal-CriarTag)
  const handleAddTag = (newTag: Omit<Tag, 'id'>) => {
      if (isEditMode && editingTag) {
      handleSaveEditTag(newTag);
      return;
    }

    const tagWithId: Tag = {
      ...newTag,
      id: `tag-${Date.now()}`,
    };

    setConfig(prev => {
      const updatedTags = [...(prev.tags || []), tagWithId];
      return {
        ...prev,
        tags: updatedTags,
      };
    });
  };

  // Função para remover tag
 const handleRemoveTag = (tag: Tag) => {
   setTagToDelete(tag);
   setShowDeleteConfirm(true);
 };

 // Função para confirmar exclusão da tag
 const handleConfirmDelete = () => {
   if (!tagToDelete) return;
   
   setConfig(prev => {
     const updatedTags = prev.tags?.filter(tag => tag.id !== tagToDelete.id) || [];
     return {
       ...prev,
       tags: updatedTags,
     };
   });
   
   setShowDeleteConfirm(false);
   setTagToDelete(null);
 };
 
 // Função para cancelar exclusão
 const handleCancelDelete = () => {
   setShowDeleteConfirm(false);
   setTagToDelete(null);
 };

  // Função para alternar ativação da tag
  const handleToggleTag = (tagId: string) => {
    setConfig(prev => {
      const updatedTags = prev.tags?.map(tag => 
        tag.id === tagId ? { ...tag, isActive: !tag.isActive } : tag
      ) || [];
      return {
        ...prev,
        tags: updatedTags,
      };
    });
  };

  // Função para editar tag
  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsEditMode(true);
    setIsAddTagModalOpen(true);
  };

  // Função para salvar edição da tag
  const handleSaveEditTag = (updatedTag: Omit<Tag, 'id'>) => {
    if (!editingTag) return;
    
   const updatedTags = config.tags?.map(tag => 
     tag.id === editingTag.id 
       ? { ...editingTag, ...updatedTag }
       : tag
   ) || [];
   
   const newConfig = {
     ...config,
     tags: updatedTags,
   };
   
   setConfig(newConfig);
   setEditingTag(null);
   setIsEditMode(false);
   setIsAddTagModalOpen(false);
  };

  // Função para fechar modal e resetar estados
  const handleCloseTagModal = () => {
    setIsAddTagModalOpen(false);
    setEditingTag(null);
    setIsEditMode(false);
  };

 // Drag and Drop functions (copiadas do Modal-MenuTitulos.tsx)
 const handleDragStart = (e: React.DragEvent, tag: Tag) => {
   setDraggedItem(tag);
   e.dataTransfer.effectAllowed = 'move';
   e.dataTransfer.setData('text/html', '');
 };

 const handleDragOver = (e: React.DragEvent, index: number) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'move';
   
   if (!draggedItem) return;
   
   const draggedIndex = config.tags.findIndex(tag => tag.id === draggedItem.id);
   
   if (draggedIndex === index) {
     setDragOverIndex(null);
     return;
   }
   
     // Detectar se está arrastando para cima ou para baixo
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseY = e.clientY;
  const cardMiddle = rect.top + (rect.height / 2);
  
  // Se está na metade superior do card, inserir antes (index)
  // Se está na metade inferior do card, inserir depois (index + 1)
  if (mouseY < cardMiddle) {
    setDragOverIndex(index);
  } else {
    setDragOverIndex(index + 1);
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

   const draggedIndex = config.tags.findIndex(tag => tag.id === draggedItem.id);
  
  // Calcular posição real baseada na detecção de posição
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseY = e.clientY;
  const cardMiddle = rect.top + (rect.height / 2);
  
  let actualTargetIndex = targetIndex;
  if (mouseY >= cardMiddle) {
    actualTargetIndex = targetIndex + 1;
  }
  
  if (draggedIndex === -1 || draggedIndex === actualTargetIndex) {

     setDraggedItem(null);
     setDragOverIndex(null);
     return;
   }

   const newTags = [...config.tags];
   const [removed] = newTags.splice(draggedIndex, 1);
   
     // Ajustar índice se estamos movendo para baixo
  let insertIndex = actualTargetIndex;
  if (draggedIndex < actualTargetIndex) {
    insertIndex = actualTargetIndex - 1;
  }
  
  insertIndex = insertIndex > newTags.length ? newTags.length : insertIndex;

   newTags.splice(insertIndex, 0, removed);

   setConfig(prev => ({
     ...prev,
     tags: newTags
   }));
   setDraggedItem(null);
   setDragOverIndex(null);
 };

 const handleDragEnd = () => {
   setDraggedItem(null);
   setDragOverIndex(null);
 };

 const handleDropAtEnd = (e: React.DragEvent) => {
   handleDrop(e, config.tags.length);
 };

  // Função para verificar se há mudanças reais nas configurações
 const compareConfigs = (current: KanbanConfig, original: KanbanConfig | null): boolean => {
   if (!original || !current) return false; // Se não há original, não há mudanças
   
    console.log('?? Comparando configs:', { 
    current: JSON.stringify(current, null, 2), 
    original: JSON.stringify(original, null, 2) 
  });
  
   // Verificar propriedades básicas
   if (current.displayMode !== original.displayMode ||
       current.showCardInfo !== original.showCardInfo ||
       current.showTags !== original.showTags) {
	   console.log('✅ Mudança detectada nas propriedades básicas');   
     return true;
   }
   
   // Verificar tags - com verificação de existência
   const currentTags = current.tags || [];
   const originalTags = original.tags || [];
   
   if (currentTags.length !== originalTags.length) {
   console.log('✅ Mudança detectada no número de tags');
     return true;
   }
   
   // Verificar cada tag individualmente
   for (let i = 0; i < currentTags.length; i++) {
     const currentTag = currentTags[i];
     const originalTag = originalTags[i];
     
     if (!currentTag || !originalTag) {
	 console.log('✅ Mudança detectada - tag undefined');
       return true;
     }
     
     if (currentTag.id !== originalTag.id ||
         currentTag.name !== originalTag.name ||
         currentTag.color !== originalTag.color ||
         currentTag.isActive !== originalTag.isActive) {
	     console.log('✅ Mudança detectada na tag:', { currentTag, originalTag });
       return true;
     }
   }
   
   console.log('❌ Nenhuma mudança detectada');
   return false;
 };

// Função para verificar se há barra de rolagem
 const checkScrollbar = () => {
   if (tagsContainerRef.current) {
     const element = tagsContainerRef.current;
     const hasScroll = element.scrollHeight > element.clientHeight;
     setHasScrollbar(hasScroll);
   }
 };

  const handleSave = () => {
	  if (isSaveDisabled) return; // Não executar se botão estiver desabilitado
	  setShowUnsavedChangesModal(false); // Garantir que modal de confirmação seja fechado
	  
   // Salvar tags no localStorage apenas quando confirmar salvamento
   if (config.tags) {
     saveTagsToLocalStorage(config.tags);
   }

    onSave(config);
    onClose();
  };

  const handleCancel = () => {
   if (hasChanges && !isSaveDisabled) {
     setShowUnsavedChangesModal(true);
   } else {
     // Restaurar configuração original completamente
     if (originalConfig) {
       setConfig(originalConfig);
       // Restaurar tags no localStorage para o estado original
       if (originalConfig.tags) {
         saveTagsToLocalStorage(originalConfig.tags);
       }
     } else if (currentConfig) {
       setConfig(currentConfig);
       // Restaurar tags no localStorage para currentConfig
       if (currentConfig.tags) {
         saveTagsToLocalStorage(currentConfig.tags);
       }
     }
     
     setHasChanges(false);
     setIsSaveDisabled(true);
     onClose();
   }
  };

 // Detectar mudanças sempre que config ou originalConfig mudar
 useEffect(() => {
   // Se não há originalConfig ainda, manter botão desabilitado
   if (!originalConfig) {
     setHasChanges(false);
     setIsSaveDisabled(true);
     return;
   }
   
   const changesDetected = compareConfigs(config, originalConfig);
   setHasChanges(changesDetected);
   setIsSaveDisabled(!changesDetected);

 }, [config, originalConfig]);

  // Garantir que o botão inicie desabilitado quando modal abre
 useEffect(() => {
   if (isOpen) {
     setHasChanges(false);
     setIsSaveDisabled(true);
   }
 }, [isOpen]);
 
  // Função para fechar o modal com verificação de mudanças
 const handleCloseModal = () => {
   if (hasChanges && !isSaveDisabled) {
     setShowUnsavedChangesModal(true);
   } else {
     onClose();
   }
 };
 
 // Função para forçar fechamento sem salvar
 const handleForceClose = () => {
   // Restaurar configuração original completamente
   if (originalConfig) {
     setConfig(originalConfig);
     // Restaurar tags no localStorage para o estado original
     if (originalConfig.tags) {
       saveTagsToLocalStorage(originalConfig.tags);
     }
   } else if (currentConfig) {
     setConfig(currentConfig);
     // Restaurar tags no localStorage para currentConfig
     if (currentConfig.tags) {
       saveTagsToLocalStorage(currentConfig.tags);
     }
   }
   
   setHasChanges(false);
   setIsSaveDisabled(true);
   setShowUnsavedChangesModal(false);
   onClose();

 };
 
 // Função para voltar ao modal principal
 const handleStayInModal = () => {
   setShowUnsavedChangesModal(false);
 };

  if (!isOpen) return null;

  return (
    <>
	
	 <style>{`
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
     border-color: #007AFF !important;
     border-width: 2px !important;
     background-color: rgba(0, 122, 255, 0.05) !important;
   }

   /* Drag handle específico */
   .drag-handle {
     user-select: none;
     -webkit-user-select: none;
     -moz-user-select: none;
     -ms-user-select: none;
   }

 `}</style>

      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={handleCloseModal}
      >
        {/* Modal Principal - Altura fixa */}
        <div 
          className="bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.12)] w-full max-w-2xl h-[600px] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Altura fixa */}
          <div className="flex items-center justify-between px-[25px] pt-[20px] shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Configurações do Kanban
              </h2>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tabs - Centralizadas */}
          <div className="flex justify-center border-b border-gray-100 shrink-0 py-[20px]">
            <div className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 w-[240px]">
              <button
                onClick={() => setActiveTab('display')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all hover:text-gray-700 flex-1 ${
                  activeTab === 'display'
                    ? 'bg-white text-[#007AFF] shadow-sm'
                    : ''
                }`}
              >
                Exibição
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all hover:text-gray-700 flex-1 ${
                  activeTab === 'tags'
                    ? 'bg-white text-[#007AFF] shadow-sm'
                    : ''
                }`}
              >
                Tags
              </button>
            </div>
          </div>

          {/* Content - Flex grow para ocupar espaço restante */}
          <div className="flex-1 overflow-y-auto modern-scrollbar pr-[10px] mr-[10px] my-[10px]">
            {/* Aba de Exibição */}
            {activeTab === 'display' && (
             <div className="pl-6 pr-1 pt-[10px] pb-6 h-full">
                <div className="space-y-6">
                 
				 {/* Seção: Controle de Visibilidade */}
                  <div className="space-y-[10px]">
                    <h3 className="text-lg font-semibold text-gray-900 ml-[10px]">
                      Controle de Visibilidade
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Mostrar informações de tempo */}
                      <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 cursor-pointer transition-all duration-200">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={config.showCardInfo}
                            onChange={(e) => setConfig(prev => ({ ...prev, showCardInfo: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none transition-all duration-200 peer-checked:bg-[#007AFF]"></div>
                          <div className="absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-200 peer-checked:translate-x-4 peer-checked:border-white"></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            Mostrar informações de tempo nos cards
                          </div>
                          <div className="text-xs text-gray-500">
                            Quando desabilitado, as informações de data/tempo ficam ocultas
                          </div>
                        </div>
                      </label>

                 {/* Seção: Modo de Exibição - Aparece apenas quando showCardInfo está ativo */}
                 {config.showCardInfo && (
                   <div className="space-y-[10px] ml-0 mt-[10px]">
                     <h4 className="text-md font-medium text-gray-700 ml-[10px]">
                       Modo de Exibição de Data/Tempo
                     </h4>
                     
                     <div className="grid grid-cols-3 gap-3">
                       {/* Data + Tempo */}
                                             <label className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                        config.displayMode === 'date-time'
                          ? 'border-[#007AFF] bg-white'
                          : 'border-gray-200 hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5'
                      }`}>

                         <input
                           type="radio"
                           name="displayMode"
                           value="date-time"
                           checked={config.displayMode === 'date-time'}
                           onChange={(e) => setConfig(prev => ({ ...prev, displayMode: e.target.value as any }))}
                           className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-0 focus:ring-offset-0"
                         />
                         <div className="text-center">
                           <div className="font-medium text-gray-900 text-sm mb-1">
                             Data + Tempo
                           </div>
                           <div className="text-xs text-gray-500">
                             "14/09/25 - 5D 15h32"
                           </div>
                         </div>
                       </label>

                       {/* Apenas Data */}
                                             <label className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                        config.displayMode === 'date-only'
                          ? 'border-[#007AFF] bg-white'
                          : 'border-gray-200 hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5'
                      }`}>

                         <input
                           type="radio"
                           name="displayMode"
                           value="date-only"
                           checked={config.displayMode === 'date-only'}
                           onChange={(e) => setConfig(prev => ({ ...prev, displayMode: e.target.value as any }))}
                           className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-0 focus:ring-offset-0"
                         />
                         <div className="text-center">
                           <div className="font-medium text-gray-900 text-sm mb-1">
                             Apenas Data
                           </div>
                           <div className="text-xs text-gray-500">
                             "Entrada: 14/09/25"
                           </div>
                         </div>
                       </label>

                       {/* Apenas Tempo */}
                                             <label className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                        config.displayMode === 'time-only'
                          ? 'border-[#007AFF] bg-white'
                          : 'border-gray-200 hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5'
                      }`}>

                         <input
                           type="radio"
                           name="displayMode"
                           value="time-only"
                           checked={config.displayMode === 'time-only'}
                           onChange={(e) => setConfig(prev => ({ ...prev, displayMode: e.target.value as any }))}
                           className="w-4 h-4 text-[#007AFF] border-gray-300 focus:ring-0 focus:ring-offset-0"
                         />
                         <div className="text-center">
                           <div className="font-medium text-gray-900 text-sm mb-1">
                             Apenas Tempo
                           </div>
                           <div className="text-xs text-gray-500">
                             "5D 15h32"
                           </div>
                         </div>
                       </label>
                     </div>
                   </div>
                 )}

                      {/* Exibir Tags */}
                      <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 cursor-pointer transition-all duration-200">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={config.showTags}
                            onChange={(e) => setConfig(prev => ({ ...prev, showTags: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none transition-all duration-200 peer-checked:bg-[#007AFF]"></div>
                          <div className="absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-200 peer-checked:translate-x-4 peer-checked:border-white"></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            Exibir Tags nos Cards
                          </div>
                          <div className="text-xs text-gray-500">
                            Quando habilitado, as tags ativas são exibidas nos cards do Kanban
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aba de Tags */}
            {activeTab === 'tags' && (
              <div className="pl-[20px] pr-[0px] pt-[10px] pb-[0px] h-full"> 
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header da seção */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 ml-[10px]">
                        Gerenciar Tags
                      </h3>
                      <p className="text-sm text-gray-600 ml-[10px]">
                        Organize seus cards com tags personalizadas
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddTagModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0056CC] transition-all duration-200 shadow-sm shrink-0"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Adicionar Tag
                    </button>			

                  </div>

                  {/* Container das Tags - Altura fixa com scroll interno */}
                  <div className="flex-1 min-h-0">
                    <div className="bg-gray-50 rounded-xl p-4 h-full overflow-hidden">
                      {config.tags && config.tags.length > 0 ? (
                        <div 
                        ref={tagsContainerRef}
                        className={`h-full overflow-y-auto ${hasScrollbar ? 'pr-[10px]' : 'pr-0'}`} 
                        style={{ scrollBehavior: 'auto' }}
                        onScroll={checkScrollbar}
                      >

                        <div className="space-y-[10px]">
                             {config.tags.map((tag, index) => {
                             if (!tag || !tag.id) return null;
                             return (

                              <React.Fragment key={tag.id}>
                               {draggedItem && dragOverIndex === index && (
                                 <div className="h-1 bg-[#007AFF] rounded-full transition-all duration-200"></div>
                               )}
                               
                               <div
                                 draggable={true}
                                 onDragStart={(e) => handleDragStart(e, tag)}
                                 onDragOver={(e) => handleDragOver(e, index)}
                                 onDragLeave={handleDragLeave}
                                 onDrop={(e) => handleDrop(e, index)}
                                 onDragEnd={handleDragEnd}
                                 className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-move select-none ${
                                   draggedItem?.id === tag.id ? 'opacity-40 scale-95 rotate-1' : ''
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
                                   <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none transition-all duration-200 peer-checked:bg-[#007AFF]"></div>
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
						   
						    {draggedItem && dragOverIndex === config.tags.length && (
                            <div className="h-1 bg-[#007AFF] rounded-full transition-all duration-200"></div>
                          )}
                          
                          {draggedItem && (
                            <div
                              onDragOver={(e) => handleDragOver(e, config.tags.length)}
                              onDrop={handleDropAtEnd}
                              className="h-4 w-full"
                            />
                          )}

						  {/* Zona de Drop Final */}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                              <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma tag criada
                          </h4>
                          <p className="text-gray-600 text-sm max-w-sm">
                            Clique em "Adicionar Tag" para criar sua primeira tag
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Altura fixa, centralizado */}
    <div className="border-t border-gray-100 px-8 py-4 bg-gray-50 shrink-0">
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
         disabled={isSaveDisabled}
         className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm ${
           isSaveDisabled
             ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
             : 'bg-[#007AFF] text-white hover:bg-[#0056CC] hover:shadow-md'
         }`}

        >
          Salvar Alterações
        </button>
      </div>
    </div>

        </div>
      </div>

      {/* Modal de Criar Tag - Usando componente separado */}
      <ModalCriarTag
        isOpen={isAddTagModalOpen}
       onClose={handleCloseTagModal}
       onAddTag={handleAddTag}
       editingTag={editingTag} 
       isEditMode={isEditMode}
      />
	  
	       {/* Modal de Confirmação de Alterações Não Salvas */}
     {showUnsavedChangesModal && (
       <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
         <div 
           className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="text-center">
             {/* Ícone centralizado no topo */}
             <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                   <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                   <path d="M12 9v4"/>
                   <path d="m12 17 .01 0"/>
                 </svg>
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
           
           {/* Botões */}
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
	  
	       {/* Modal de Confirmação de Exclusão */}
     {showDeleteConfirm && (
       <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
         <div 
           className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="text-center">
             {/* Ícone centralizado no topo */}
             <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                   <polyline points="3,6 5,6 21,6"/>
                   <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                 </svg>
               </div>
             </div>
             
             {/* Título centralizado */}
             <h3 className="text-lg font-semibold text-gray-900 mb-3">
               Excluir Tag
             </h3>
             
             {/* Mensagem centralizada */}
             <p className="text-sm text-gray-600 mb-8 leading-relaxed">
               Tem certeza que deseja excluir a tag <span className="font-semibold text-gray-900">"{tagToDelete?.name}"</span>? 
               Esta ação não pode ser desfeita.
             </p>
           </div>
           
           <div className="flex gap-4 mt-6">
             <button
               onClick={handleCancelDelete}
               className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
             >
               Cancelar
             </button>
             <button
               onClick={handleConfirmDelete}
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