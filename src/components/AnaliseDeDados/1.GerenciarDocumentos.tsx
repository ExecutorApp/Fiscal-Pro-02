import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import ModalCriarCategoria, { NovaCategoria } from './Modal-CriarCategoria';
import ModalMoverCards from './Modal-MoverCards';
import ModalConfirmarExclusao from './8.ModalConfirmarExclusao';
import CategoriaItem from './2.CategoriaItem';
import { useDocumentosData } from './4.UseDocumentosData';
import { useMovimentacao } from './5.UseMovimentacao';
import { useRenumeracao } from './6.UseRenumeracao';
import { 
  handleFileUpload,
  handleEditarCategoria,
  handleEditarSubcategoria,
  handleCriarSubcategoria,
  handleSalvarNovaCategoria,
  startEditing,
  saveEdit,
  cancelEdit
} from './7.MenuActions';

export interface MenuItem {
  id: string;
  label: string;
  type?: 'categoria' | 'empresa' | 'pasta' | 'arquivo' | 'subcategoria' | 'formulario';
  viewMode?: 'sanfona' | 'pasta';
  showNumber?: boolean;
  numberBgColor?: string;
  numberTextColor?: string;
  folderColor?: string;
  folderType?: 'transparente' | 'colorida';
  isExpanded?: boolean;
  children?: MenuItem[];
  // Campos específicos para imagens armazenadas no IndexedDB
  storageKey?: string;
  imageType?: string;
  imageSize?: number;
  createdAt?: string;
  // Campo para armazenar dados em formato dataUrl (fallback)
  dataUrl?: string;
  fileType?: string;
  fileSize?: number;
}

interface GerenciarDocumentosProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MenuItem[]) => void;
  empresasData: MenuItem[];
}



const GerenciarDocumentos: React.FC<GerenciarDocumentosProps> = ({
  isOpen,
  onClose,
  onSave,
  empresasData = []
}) => {
  const [activeTab, setActiveTab] = useState<'fisica' | 'juridica'>('juridica');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [originalExtension, setOriginalExtension] = useState('');
  const [showCriarCategoriaModal, setShowCriarCategoriaModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  
  // Estados para edição de categoria
  const [categoriaEditando, setCategoriaEditando] = useState<MenuItem | null>(null);
  const [modoEdicao, setModoEdicao] = useState<'criar' | 'editar'>('criar');
  const [tipoModal, setTipoModal] = useState<'categoria' | 'subcategoria'>('categoria');
  const [categoriaPaiId, setCategoriaPaiId] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Estado para controle de upload
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para controle de seleção e movimentação
  const [selectionMode, setSelectionMode] = useState<{
    active: boolean;
    type: 'arquivo' | 'pasta' | 'categoria' | null;
    parentId: string | null;
    items: Set<string>;
  }>({
    active: false,
    type: null,
    parentId: null,
    items: new Set()
  });
  
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<MenuItem[]>([]);

  // Custom hooks
  const {
    fisicaData,
    juridicaData,
    setFisicaData,
    setJuridicaData,
    numeracaoAutomatica,
    setNumeracaoAutomatica,
    saveToLocalStorage,
    loadFromLocalStorage,
    STORAGE_KEY_JURIDICA,
    STORAGE_KEY_FISICA,
    STORAGE_KEY_ACTIVE_TAB,
    STORAGE_KEY_AUTO_NUMBER
  } = useDocumentosData(isOpen, activeTab);

  const {
    renumerarItens,
    normalizarPropriedadesNumeracao,
    getProximoNumeroCategoria,
    renumerarSubcategorias
  } = useRenumeracao();

  const {
    moveItemUp,
    moveItemDown,
    handleMoveItem,
    executeMove
  } = useMovimentacao(
    activeTab,
    getCurrentData,
    setCurrentData,
    setItemsToMove,
    setShowMoveModal,
    setSelectionMode,
    numeracaoAutomatica,
    renumerarItens,
    saveToLocalStorage,
    STORAGE_KEY_JURIDICA,
    STORAGE_KEY_FISICA,
    setJuridicaData,
    setFisicaData
  );

  // Debug: monitorar mudanças no estado
  React.useEffect(() => {
    console.log('showMoveModal mudou para:', showMoveModal);
    console.log('itemsToMove:', itemsToMove);
  }, [showMoveModal, itemsToMove]);

  // Inicializar dados quando o modal abrir
  React.useEffect(() => {
    if (isOpen) {
      // Carregar dados salvos do localStorage
      const dadosJuridicaSalvos = loadFromLocalStorage(STORAGE_KEY_JURIDICA);
      const dadosFisicaSalvos = loadFromLocalStorage(STORAGE_KEY_FISICA);
      
      // Função para limpar duplicatas recursivamente
      const limparDuplicatas = (items: MenuItem[]): MenuItem[] => {
        const seen = new Set<string>();
        return items.filter(item => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          if (item.children) {
            item.children = limparDuplicatas(item.children);
          }
          return true;
        });
      };   
      
      if (dadosJuridicaSalvos.length > 0) {
        const dadosNormalizados = normalizarPropriedadesNumeracao(limparDuplicatas(dadosJuridicaSalvos));
        setJuridicaData(dadosNormalizados);
      } else if (juridicaData.length === 0) {
        // Usar dados de exemplo apenas se não houver dados salvos
        const exemploJuridica = createExampleData();
        setJuridicaData(exemploJuridica);
      }
      
      if (dadosFisicaSalvos.length > 0) {
        const dadosNormalizados = normalizarPropriedadesNumeracao(dadosFisicaSalvos);
        setFisicaData(dadosNormalizados);
      }
    }
  }, [isOpen]);

  function getCurrentData() {
    const data = activeTab === 'fisica' ? fisicaData : juridicaData;
   // Função recursiva para remover duplicatas em todos os níveis
   const removeDuplicatesRecursive = (items: MenuItem[]): MenuItem[] => {
     if (!items || items.length === 0) return items;
     
     // Remover duplicatas no nível atual baseando-se no ID
     const uniqueItems = items.filter((item, index, self) =>
       index === self.findIndex((t) => t.id === item.id)
     );
     
     // Processar filhos recursivamente
     return uniqueItems.map(item => ({
       ...item,
       children: item.children ? removeDuplicatesRecursive(item.children) : item.children
     }));
   };
   
   return removeDuplicatesRecursive(data);

  }

  function setCurrentData(data: MenuItem[]) {
    if (activeTab === 'fisica') {
      setFisicaData(data);
    } else {
      setJuridicaData(data);
    }
  }

  const createExampleData = (): MenuItem[] => {
    return [
      {
        id: 'categoria-empresas-1',
        label: '01 Empresas',
        type: 'categoria',
        viewMode: 'sanfona',
        showNumber: true,
        isExpanded: false,
        children: []
      },
      {
        id: 'categoria-empresas-2',
        label: '02 Empresas',
        type: 'categoria',
        viewMode: 'sanfona',
        showNumber: true,
        isExpanded: false,
        children: []
      },
      {
        id: 'categoria-formulas-3',
        label: 'Formulas',
        type: 'categoria',
        viewMode: 'sanfona',
        showNumber: false,
        isExpanded: false,
        children: []
      },
      {
        id: 'categoria-aaa-4',
        label: 'Aaa',
        type: 'categoria',
        viewMode: 'sanfona',
        showNumber: false,
        isExpanded: false,
        children: []
      },
      {
        id: 'categoria-aaa-5',
        label: 'Aaa',
        type: 'categoria',
        viewMode: 'sanfona',
        showNumber: false,
        isExpanded: true,
        children: [
          {
            id: 'subcategoria-aaa-1',
            label: 'Aaa',
            type: 'pasta',
            showNumber: false,
            children: []
          }
        ]
      }
    ];
  };

  const handleClose = () => {
    setEditingItemId(null);
    setEditingText('');
    onClose();
  };

  const handleSave = () => {
    // Salvar no localStorage apenas quando clicar em "Salvar Alterações"
    saveToLocalStorage(STORAGE_KEY_JURIDICA, juridicaData);
    saveToLocalStorage(STORAGE_KEY_FISICA, fisicaData);
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTab);
    
    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(new Event('localDataUpdated'));
    
    // Chamar onSave com os dados da aba ativa
    if (activeTab === 'juridica') {
      onSave(juridicaData);
    } else {
      onSave(fisicaData);
    }

    handleClose();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !editingItemId) {
      handleClose();
    }
  };

  const toggleCategoriaExpansion = (categoriaId: string) => {
    const updateCategoriaRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === categoriaId) {
          const newExpanded = !item.isExpanded;
          
          // Se a categoria está fechando, fechar todas as subcategorias também
          const updateAllChildren = (children: MenuItem[]): MenuItem[] => {
            return children.map(child => ({
              ...child,
              isExpanded: newExpanded ? child.isExpanded : false,
              children: child.children ? updateAllChildren(child.children) : child.children
            }));
          };

          return { 
            ...item, 
            isExpanded: newExpanded,
            children: item.children ? updateAllChildren(item.children) : item.children
          };
        }
        
        if (item.children) {
          return {
            ...item,
            children: updateCategoriaRecursive(item.children)
          };
        }
        
        return item;
      });
    };
    
    setCurrentData(updateCategoriaRecursive(getCurrentData()));
  };

  const toggleSubcategoriaExpansion = (subcategoriaId: string) => {
    const updateItemRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === subcategoriaId) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children) {
          return {
            ...item,
            children: updateItemRecursive(item.children)
          };
        }
        return item;
      });
    };
    
    setCurrentData(updateItemRecursive(getCurrentData()));
  };

  const handleDeleteClick = (itemId: string, itemName: string) => {
    setItemToDelete({ id: itemId, name: itemName });
    setShowDeleteModal(true);
  };

  const deleteItem = (itemId: string) => {
    const deleteItemRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => item.id !== itemId).map(item => ({
        ...item,
        children: item.children ? deleteItemRecursive(item.children) : item.children
      }));
    };

    const newData = deleteItemRecursive(getCurrentData());
    // Renumerar apenas se numeração automática estiver ativa
    const dataFinal = numeracaoAutomatica ? renumerarItens(newData, true) : newData;
    setCurrentData(dataFinal);
    
    // Salvar no localStorage
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Preparar props para os handlers
  const actionHandlers = {
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, parentId: string) => 
      handleFileUpload(e, parentId, setUploadingFiles, setCurrentData, getCurrentData, fileInputRefs),
    handleEditarCategoria: (categoria: MenuItem) => 
      handleEditarCategoria(categoria, setCategoriaEditando, setModoEdicao, setTipoModal, setShowCriarCategoriaModal),
    handleEditarSubcategoria: (subcategoria: MenuItem) =>
      handleEditarSubcategoria(subcategoria, setCategoriaEditando, setModoEdicao, setTipoModal, setCategoriaPaiId, setShowCriarCategoriaModal),
    handleCriarSubcategoria: (categoriaPaiId: string) =>
      handleCriarSubcategoria(categoriaPaiId, setCategoriaEditando, setModoEdicao, setTipoModal, setCategoriaPaiId, setShowCriarCategoriaModal),
    handleSalvarNovaCategoria: (novaCategoria: NovaCategoria) =>
      handleSalvarNovaCategoria(
        novaCategoria, modoEdicao, categoriaEditando, tipoModal, categoriaPaiId,
        getCurrentData, setCurrentData, numeracaoAutomatica, renumerarItens,
        activeTab, saveToLocalStorage, STORAGE_KEY_JURIDICA, STORAGE_KEY_FISICA,
        setCategoriaEditando, setModoEdicao, setTipoModal, setShowCriarCategoriaModal,
        setCategoriaPaiId
      ),
    startEditing: (itemId: string, itemLabel: string) =>
      startEditing(itemId, itemLabel, setEditingItemId, setEditingText, setOriginalText, setOriginalExtension),
    saveEdit: () =>
      saveEdit(editingItemId, editingText, originalExtension, getCurrentData, setCurrentData, numeracaoAutomatica, renumerarItens, setEditingItemId, setEditingText),
    cancelEdit: () =>
      cancelEdit(setEditingItemId, setEditingText)
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay para bloquear cliques durante edição */}
      {editingItemId && (
        <div 
          className="fixed inset-0 bg-transparent z-40"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
        onClick={handleModalClick}
      >
        <div className="bg-white rounded-2xl shadow-xl w-[1100px] h-[calc(100vh-20px)] max-h-[calc(100vh-20px)] flex flex-col overflow-hidden">
		
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
   <h2 className="text-xl font-bold text-gray-900">Gerenciar Documentos</h2>
   <button
     onClick={handleClose}
     className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
   >
     <X className="w-5 h-5 text-gray-500" />
   </button>
 </div>

 {/* Header com layout reorganizado: Criar Categoria (esquerda), Abas (centro), Cancelar/Salvar (direita) */}
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
   {/* Extrema Esquerda - Botão Criar Categoria */}
   <div className="flex gap-2">
     <button
       onClick={() => {
         setTipoModal('categoria');
         setModoEdicao('criar');
         setCategoriaEditando(null);
         setShowCriarCategoriaModal(true);
       }}
       className="ml-[0px] px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1777CF]/90 transition-colors flex items-center gap-2"
     >
       <Plus className="w-4 h-4" />
       Criar Categoria
     </button>
   </div>

   {/* Centro - Abas Física/Jurídica */}
   <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
     <button
       onClick={() => setActiveTab('fisica')}
       className={`py-2 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
         activeTab === 'fisica'
           ? 'bg-white text-blue-600 shadow-sm'
           : 'text-gray-600 hover:text-gray-900'
       }`}
     >
       Física
     </button>
     <button
       onClick={() => setActiveTab('juridica')}
       className={`py-2 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
         activeTab === 'juridica'
           ? 'bg-white text-blue-600 shadow-sm'
           : 'text-gray-600 hover:text-gray-900'
       }`}
     >
       Jurídica
     </button>
   </div>

   {/* Extrema Direita - Botões Cancelar e Salvar Alterações */}
   <div className="flex items-center gap-3">
     <button
       onClick={handleClose}
       className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
     >
       Cancelar
     </button>
     <button
       onClick={handleSave}
       className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:[#1777CF]/90 transition-colors text-sm font-medium"
     >
       Salvar Alterações
     </button>
   </div>
 </div>


          <div className="flex-1 bg-white mt-[10px] mb-0 mr-[10px] overflow-y-auto" style={{ scrollbarColor: '#D3DBEB white' }}>
           {/* Container de seleção - aparece quando em modo de seleção */}
           {selectionMode.active && (
             <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4 flex items-center justify-between">
               <div className="text-sm text-gray-700">
                 {selectionMode.items.size} {selectionMode.type === 'arquivo' ? 'arquivo(s)' : 'pasta(s)'} selecionado(s)
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={() => {
                     setSelectionMode({
                       active: false,
                       type: null,
                       parentId: null,
                       items: new Set()
                     });
                   }}
                   className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button
                   onClick={() => {
                     const items = Array.from(selectionMode.items).map(id => {
                       const findItem = (items: MenuItem[]): MenuItem | null => {
                         for (const item of items) {
                           if (item.id === id) return item;
                           if (item.children) {
                             const found = findItem(item.children);
                             if (found) return found;
                           }
                         }
                         return null;
                       };
                       return findItem(getCurrentData());
                     }).filter(Boolean) as MenuItem[];
                     
                     setItemsToMove(items);
                     setShowMoveModal(true);
                   }}
                   disabled={selectionMode.items.size === 0}
                   className={`px-4 py-2 text-sm rounded transition-colors ${
                     selectionMode.items.size === 0
                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       : 'bg-blue-500 text-white hover:bg-blue-600'
                   }`}
                 >
                   Mover ({selectionMode.items.size})
                 </button>
               </div>
             </div>
           )}
           
           {/* Conteúdo Principal - Container com scroll visível */}
           <div className="flex-1 pl-[15px] pr-[5px] pt-[0px] pb-[0px] overflow-y-auto" style={{height: 'calc(100vh - 205px)'}}>
             <div className="bg-white pr-[5px] space-y-[50px] min-h-[calc(100vh-250px)]">
               <div className="py-0 space-y-[10px] pb-[0px]">
                 {getCurrentData().map(categoria => (
                   <CategoriaItem
                     key={categoria.id}
                     categoria={categoria}
                     editingItemId={editingItemId}
                     editingText={editingText}
                     uploadingFiles={uploadingFiles}
                     fileInputRefs={fileInputRefs}
                     selectionMode={selectionMode}
                     toggleCategoriaExpansion={toggleCategoriaExpansion}
                     toggleSubcategoriaExpansion={toggleSubcategoriaExpansion}
                     moveItemUp={moveItemUp}
                     moveItemDown={moveItemDown}
                     handleMoveItem={handleMoveItem}
                     handleDeleteClick={handleDeleteClick}
                     setSelectionMode={setSelectionMode}
                     setCategoriaPaiId={setCategoriaPaiId}
                     setTipoModal={setTipoModal}
                     setModoEdicao={setModoEdicao}
                     setCategoriaEditando={setCategoriaEditando}
                     setShowCriarCategoriaModal={setShowCriarCategoriaModal}
                     {...actionHandlers}
                   />
                 ))}
               </div>
             </div>
           </div>

          </div>
        </div>
      </div>


      
      {/* Modal Criar Categoria */}
      <ModalCriarCategoria
        isOpen={showCriarCategoriaModal}
        onClose={() => {
          console.log('🔵 Modal fechando - preservando estados'); 
          setShowCriarCategoriaModal(false);
          setTimeout(() => {
            setCategoriaEditando(null);
            setModoEdicao('criar');
            setTipoModal('categoria');
            setCategoriaPaiId(null);
            setIsProcessing(false);
          }, 100);
        }}
        onSave={(novaCategoria) => {
          console.log('👉 Modal onSave DISPARADO');
          actionHandlers.handleSalvarNovaCategoria(novaCategoria);
        }}
        proximoNumero={getProximoNumeroCategoria()}
        modoEdicao={modoEdicao} 
        tipoModal={tipoModal}
        categoriaParaEditar={categoriaEditando ? 
          (() => {
            let titulo = categoriaEditando.label;
            let estilo: 'simples' | 'numerado' | 'pasta' = 'simples';
            let numeroAtual = '';
            
            if (categoriaEditando.showNumber && categoriaEditando.label.match(/^\d{2}\s/)) {
              numeroAtual = categoriaEditando.label.substring(0, 2);  
              titulo = categoriaEditando.label.substring(3);
              estilo = 'numerado';
            } else if (categoriaEditando.folderColor) {
              estilo = 'pasta';
            }
            
            return { titulo, estilo, numeroAtual };
          })() : undefined}
        numeracaoAutomaticaGlobal={numeracaoAutomatica}
        onNumeracaoAutomaticaChange={(value: boolean) => {
          setNumeracaoAutomatica(value);
          localStorage.setItem(STORAGE_KEY_AUTO_NUMBER, JSON.stringify(value));
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmarExclusao
        isOpen={showDeleteModal}
        itemToDelete={itemToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
       
      {/* Modal de Mover Cards */}
      {showMoveModal && itemsToMove.length > 0 && (
        <ModalMoverCards
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setItemsToMove([]); 
          }}
          itemsToMove={itemsToMove}
          allData={getCurrentData()}
          onConfirm={executeMove}
          activeTab={activeTab}
        />
      )} 
    </>
  );
};

export default GerenciarDocumentos;