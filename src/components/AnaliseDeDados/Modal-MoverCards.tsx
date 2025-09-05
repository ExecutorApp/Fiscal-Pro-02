import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { MenuItem } from './1.GerenciarDocumentos';

interface ModalMoverCardsProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToMove: MenuItem[];
  allData: MenuItem[];
  onConfirm: (destinationId: string | null, destinationType: 'categoria' | 'pasta') => void;
  activeTab: 'fisica' | 'juridica';
}

const ModalMoverCards: React.FC<ModalMoverCardsProps> = ({
  isOpen,
  onClose,
  itemsToMove,
  allData,
  onConfirm,
  activeTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<{
    id: string | null;
    type: 'categoria' | 'pasta';
    path: string;
  } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState(false);

  // Resetar estado quando abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedDestination(null);
      setExpandedItems(new Set());
      setShowTooltip(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Verificar se há itens para mover
  if (!itemsToMove || itemsToMove.length === 0) {
    console.error('ModalMoverCards: Nenhum item para mover!');
    return null;
  }

  // Contar pastas e arquivos
  const countItems = () => {
    let pastas = 0;
    let arquivos = 0;
    
    itemsToMove.forEach(item => {
      if (item.type === 'arquivo') {
        arquivos++;
      } else {
        pastas++;
      }
    });
    
    return { pastas, arquivos };
  };

  const { pastas, arquivos } = countItems();

  // Determinar o tipo dos itens sendo movidos
  const itemType = itemsToMove[0]?.type === 'arquivo' ? 'arquivo' : 
                   itemsToMove[0]?.type === 'categoria' ? 'categoria' : 'pasta';

  // Extrair IDs dos itens sendo movidos para validação
  const movingItemIds = new Set(itemsToMove.map(item => item.id));

  // Função para verificar se um destino é válido
  const isValidDestination = (destinationId: string | null, destinationType: 'categoria' | 'pasta'): boolean => {
    // Não pode mover para si mesmo
    if (movingItemIds.has(destinationId || '')) return false;

    // Se movendo categorias, só pode mover para raiz
    if (itemType === 'categoria' && destinationType !== 'categoria') return false;

    // Verificar se não está movendo pasta para dentro de si mesma ou suas filhas
    if (itemType === 'pasta' || itemType === 'categoria') {
      const checkDescendants = (items: MenuItem[]): boolean => {
        for (const item of items) {
          if (item.id === destinationId) return true;
          if (movingItemIds.has(item.id) && item.children) {
            if (checkDescendants(item.children)) return true;
          }
        }
        return false;
      };
      
      for (const movingItem of itemsToMove) {
        if (movingItem.children && checkDescendants(movingItem.children)) {
          return false;
        }
      }
    }

    return true;
  };

  // Filtrar categorias disponíveis
  const availableCategories = allData.filter(cat => 
    cat.type === 'categoria' && 
    !movingItemIds.has(cat.id) &&
    isValidDestination(cat.id, 'categoria')
  );

  // Toggle expansão de item
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Renderizar árvore de pastas com radio buttons
  const renderFolderTree = (items: MenuItem[], level: number = 0, path: string = ''): JSX.Element[] => {
    return items
      .filter(item => item.type !== 'arquivo' && !movingItemIds.has(item.id))
      .map(item => {
        const isExpanded = expandedItems.has(item.id);
        const hasChildren = item.children && item.children.length > 0 && 
                           item.children.some(child => child.type !== 'arquivo');
        const currentPath = path ? `${path} > ${item.label}` : item.label;
        const isSelected = selectedDestination?.id === item.id;
        const isValid = isValidDestination(item.id, 'pasta');

        return (
          <div key={item.id}>
            <div
              className={`flex items-center gap-2 py-2 px-3 rounded transition-colors ${
                !isValid ? 'opacity-50 cursor-not-allowed' : 
                isSelected ? 'bg-blue-100 border border-blue-300' : 
                'hover:bg-gray-100 cursor-pointer'
              }`}
              style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
              {/* Radio button */}
              <input
                type="radio"
                name="destination"
                checked={isSelected}
                onChange={() => {
                  if (isValid) {
                    setSelectedDestination({
                      id: item.id,
                      type: 'pasta',
                      path: currentPath
                    });
                  }
                }}
                disabled={!isValid}
                className="flex-shrink-0"
              />

              {/* Botão de expansão */}
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(item.id);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              
              {/* Ícone da pasta */}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
              
              {/* Nome da pasta */}
              <span 
                className={`text-sm flex-1 ${!isValid ? 'text-gray-400' : ''}`}
                onClick={() => {
                  if (isValid) {
                    setSelectedDestination({
                      id: item.id,
                      type: 'pasta',
                      path: currentPath
                    });
                  }
                }}
              >
                {item.label}
              </span>
            </div>
            
            {/* Renderizar filhos se expandido */}
            {isExpanded && hasChildren && item.children && (
              <div>
                {renderFolderTree(item.children, level + 1, currentPath)}
              </div>
            )}
          </div>
        );
      });
  };

  // Buscar a categoria selecionada
  const selectedCategoryData = allData.find(cat => cat.id === selectedCategory);

  const handleConfirm = () => {
    if (itemType === 'categoria') {
      // Categorias vão para a raiz
      onConfirm(null, 'categoria');
    } else if (selectedDestination) {
      onConfirm(selectedDestination.id, selectedDestination.type);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-[900px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Mover {itemsToMove.length} {itemsToMove.length === 1 ? 'item' : 'itens'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex">
          {/* Container Esquerdo */}
          <div className="w-[400px] p-6 border-r border-gray-200 flex flex-col">
            {/* Resumo dos itens selecionados */}
            <div 
              className="relative mb-4 flex-shrink-0"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 cursor-help">
                <p className="text-sm text-gray-700">
                  {pastas > 0 && `${pastas.toString().padStart(2, '0')} pasta${pastas !== 1 ? 's' : ''}`}
                  {pastas > 0 && arquivos > 0 && ', '}
                  {arquivos > 0 && `${arquivos.toString().padStart(2, '0')} arquivo${arquivos !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute z-10 left-0 top-full mt-2 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-sm">
                  <div className="text-xs">
                    {itemsToMove.map((item, index) => (
                      <div key={item.id} className="py-1">
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <div className="absolute -top-2 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-900"></div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 my-3 flex-shrink-0"></div>

            {/* Seleção de destino */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex-shrink-0">
                Selecione o destino:
              </h3>

              {itemType === 'categoria' ? (
                // Para categorias, mostrar apenas mensagem
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-shrink-0">
                  <p className="text-sm text-blue-800">
                    As categorias serão movidas para o nível principal da aba {activeTab === 'fisica' ? 'Física' : 'Jurídica'}.
                  </p>
                </div>
              ) : (
                // Dropdown de categoria
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria de destino:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedDestination(null);
                      setExpandedItems(new Set());
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Container Direito - Lista de pastas */}
          <div className="flex-1 p-6 flex flex-col">
            {selectedCategory && selectedCategoryData && itemType !== 'categoria' ? (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex-shrink-0">
                  Pastas disponíveis:
                </h3>
                <div className="flex-1 border border-gray-300 rounded-lg p-3 overflow-y-auto bg-gray-50">
                  {/* Opção de raiz da categoria */}
                  <div
                    className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-colors ${
                      selectedDestination?.id === selectedCategory && selectedDestination?.type === 'categoria'
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={selectedDestination?.id === selectedCategory && selectedDestination?.type === 'categoria'}
                      onChange={() => {
                        setSelectedDestination({
                          id: selectedCategory,
                          type: 'categoria',
                          path: selectedCategoryData.label
                        });
                      }}
                      className="flex-shrink-0"
                    />
                    <div className="w-5" />
                    <Folder className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedCategoryData.label} (Raiz)
                    </span>
                  </div>

                  {/* Pastas da categoria */}
                  {selectedCategoryData.children && selectedCategoryData.children.filter(child => child.type !== 'arquivo').length > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      {renderFolderTree(selectedCategoryData.children)}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                {!selectedCategory && itemType !== 'categoria' && (
                  <p className="text-sm text-gray-500">Selecione uma categoria para ver as pastas disponíveis</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {/* Caminho selecionado */}
          <div className="flex-1 mr-4">
            {selectedDestination && (
              <div className="text-sm text-green-700">
                <span className="font-medium">Destino:</span> {selectedDestination.path}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={itemType !== 'categoria' && !selectedDestination}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                itemType === 'categoria' || selectedDestination
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirmar Movimentação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMoverCards;