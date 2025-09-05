import { MenuItem } from './1.GerenciarDocumentos';

export const useMovimentacao = (
  activeTab: 'fisica' | 'juridica',
  getCurrentData: () => MenuItem[],
  setCurrentData: (data: MenuItem[]) => void,
  setItemsToMove: React.Dispatch<React.SetStateAction<MenuItem[]>>,
  setShowMoveModal: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectionMode: React.Dispatch<React.SetStateAction<{
    active: boolean;
    type: 'arquivo' | 'pasta' | 'categoria' | null;
    parentId: string | null;
    items: Set<string>;
  }>>,
  numeracaoAutomatica: boolean,
  renumerarItens: (items: MenuItem[], autoNumerar: boolean) => MenuItem[],
  saveToLocalStorage: (key: string, data: any) => void,
  STORAGE_KEY_JURIDICA: string,
  STORAGE_KEY_FISICA: string,
  setJuridicaData: React.Dispatch<React.SetStateAction<MenuItem[]>>,
  setFisicaData: React.Dispatch<React.SetStateAction<MenuItem[]>>
) => {
  // Função para mover item para cima
  const moveItemUp = (itemId: string) => {
    const moveUpRecursive = (items: MenuItem[], parentItems?: MenuItem[]): MenuItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId && i > 0) {
          // Se encontrou o item e não é o primeiro
          const newItems = [...items];
          const targetIndex = i - 1;
          [newItems[targetIndex], newItems[i]] = [newItems[i], newItems[targetIndex]];
          return parentItems ? parentItems : newItems;
        }
        
        if (items[i].children) {
          const newChildren = moveUpRecursive(items[i].children, items);
          if (newChildren !== items[i].children) {
            const newItems = [...items];
            newItems[i] = { ...newItems[i], children: newChildren };
            return parentItems ? parentItems : newItems;
          }
        }
      }
      return items;
    };
    
    const newData = moveUpRecursive(getCurrentData());
    
    // Verificar se o item movido é um arquivo
    const findItem = (items: MenuItem[], id: string): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const movedItem = findItem(newData, itemId);
    const isFile = movedItem?.type === 'arquivo';
    
    // Só renumerar se NÃO for arquivo e numeração automática estiver ativa
    let dataFinal = newData;
    if (numeracaoAutomatica && !isFile) {
      // Criar uma cópia profunda para garantir atualização
      dataFinal = JSON.parse(JSON.stringify(newData));
      dataFinal = renumerarItens(dataFinal, true);
    }
    
    setCurrentData(dataFinal);
    
    // Salvar no localStorage
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }
  };

  // Função para mover item para baixo
  const moveItemDown = (itemId: string) => {
    const moveDownRecursive = (items: MenuItem[], parentItems?: MenuItem[]): MenuItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId && i < items.length - 1) {
          // Se encontrou o item e não é o último
          const newItems = [...items];
          const targetIndex = i + 1;
          [newItems[i], newItems[targetIndex]] = [newItems[targetIndex], newItems[i]];
          return parentItems ? parentItems : newItems;
        }
        
        if (items[i].children) {
          const newChildren = moveDownRecursive(items[i].children, items);
          if (newChildren !== items[i].children) {
            const newItems = [...items];
            newItems[i] = { ...newItems[i], children: newChildren };
            return parentItems ? parentItems : newItems;
          }
        }
      }
      return items;
    };
    
    const newData = moveDownRecursive(getCurrentData());
    
    // Verificar se o item movido é um arquivo
    const findItem = (items: MenuItem[], id: string): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const movedItem = findItem(newData, itemId);
    const isFile = movedItem?.type === 'arquivo';

    // Só renumerar se NÃO for arquivo e numeração automática estiver ativa
    let dataFinal = newData;
    if (numeracaoAutomatica && !isFile) {
      // Criar uma cópia profunda para garantir atualização
      dataFinal = JSON.parse(JSON.stringify(newData));
      dataFinal = renumerarItens(dataFinal, true);
    }

    setCurrentData(dataFinal);
    
    // Salvar no localStorage
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }
  };

  // Função para mover item (modal será implementado depois)
  const handleMoveItem = (itemId: string) => {
    console.log('=== handleMoveItem chamado ===');
    console.log('itemId:', itemId);

    // Encontrar o item e seu contexto
    const findItemContext = (items: MenuItem[], parentId: string | null = null): {
      item: MenuItem | null;
      parent: MenuItem | null;
      siblings: MenuItem[];
    } | null => {
      for (const item of items) {
        if (item.id === itemId) {
          return {
            item,
            parent: null,
            siblings: items
          };
        }
        if (item.children) {
          for (let i = 0; i < item.children.length; i++) {
            if (item.children[i].id === itemId) {
              return {
                item: item.children[i],
                parent: item,
                siblings: item.children
              };
            }
          }
          const found = findItemContext(item.children, item.id);

          if (found) {
            return {
              ...found,
              parent: item
            };
          }
        }
      }
      return null;
    };
    
    const context = findItemContext(getCurrentData());
    console.log('context:', context);
    if (!context || !context.item) return;
    
    const { item, siblings } = context;
    console.log('item:', item);
    
    // Se for categoria, mover imediatamente
    if (item.type === 'categoria') {
      console.log('Movendo categoria:', item);
      setItemsToMove([item]);
      console.log('showMoveModal será true');
      setShowMoveModal(true);
      return;
    }
    
    // Para arquivos e pastas, entrar em modo de seleção
    const itemType = item.type === 'arquivo' ? 'arquivo' : 'pasta';
    const parentId = context.parent?.id || null;
    
    // Filtrar apenas itens do mesmo tipo e mesmo nível
    const eligibleItems = siblings.filter(s => 
      (s.type === 'arquivo' && itemType === 'arquivo') ||
      (s.type === 'pasta' && itemType === 'pasta')
    );
    
    console.log('Entrando em modo de seleção');
    console.log('Tipo:', itemType);
    console.log('Parent ID:', parentId);
    console.log('Itens elegíveis:', eligibleItems.length);
    
    // Ativar modo de seleção
    setSelectionMode({
      active: true,
      type: itemType,
      parentId: parentId,
      items: new Set([itemId]) // Pré-selecionar o item clicado
    });
  };

  // Função para executar a movimentação
  const executeMove = (destinationId: string | null, destinationType: 'categoria' | 'pasta') => {
    console.log('=== executeMove CHAMADO ===');
    console.log('Destino ID:', destinationId);
    console.log('Tipo de destino:', destinationType);
    console.log('Itens para mover:', itemsToMove);
    
    if (!itemsToMove || itemsToMove.length === 0) {
      console.error('Nenhum item para mover!');
      return;
    }
    
    const currentData = getCurrentData();
    
    // Função auxiliar para remover itens da estrutura
    const removeItems = (items: MenuItem[], idsToRemove: Set<string>): MenuItem[] => {
      return items
        .filter(item => !idsToRemove.has(item.id))
        .map(item => ({
          ...item,
          children: item.children ? removeItems(item.children, idsToRemove) : item.children
        }));
    };
    
    // Função auxiliar para adicionar itens ao destino
    const addItemsToDestination = (items: MenuItem[], targetId: string | null, itemsToAdd: MenuItem[]): MenuItem[] => {
      if (targetId === null) {
        // Adicionar no nível raiz
        return [...items, ...itemsToAdd];
      }
      
      return items.map(item => {
        if (item.id === targetId) {
          // Adicionar como filhos deste item
          return {
            ...item,
            children: [...(item.children || []), ...itemsToAdd],
            isExpanded: true // Expandir automaticamente
          };
        }
        if (item.children) {
          return {
            ...item,
            children: addItemsToDestination(item.children, targetId, itemsToAdd)
          };
        }
        return item;
      });
    };
    
    // Criar conjunto de IDs para remover
    const idsToRemove = new Set(itemsToMove.map(item => item.id));
    
    console.log('IDs para remover:', Array.from(idsToRemove));
    
    // Passo 1: Remover os itens de suas posições atuais
    let newData = removeItems(currentData, idsToRemove);
    
    console.log('Dados após remoção:', newData);
    
    // Passo 2: Adicionar os itens ao destino
    newData = addItemsToDestination(newData, destinationId, itemsToMove);
    
    console.log('Dados após adição:', newData);
    
    // Verificar se houve mudanças
    if (JSON.stringify(newData) === JSON.stringify(currentData)) {
      console.warn('Nenhuma mudança detectada na estrutura de dados');
      alert('Erro ao mover os itens. Por favor, tente novamente.');
      return;
    }
    
    console.log('Movimentação concluída com sucesso!');
    console.log('Nova estrutura de dados:', newData);
    
    // Renumerar se necessário
    let dataFinal = newData;
    if (numeracaoAutomatica) {
      console.log('Aplicando renumeração automática...');
      dataFinal = renumerarItens(newData, true);
    }
    
    // Atualizar o estado principal
    setCurrentData(dataFinal);
    
    // Forçar atualização dos estados específicos das abas
    if (activeTab === 'juridica') {
      setJuridicaData([...dataFinal]);
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      setFisicaData([...dataFinal]);
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }
    
    // Limpar estado do modal e seleção
    setShowMoveModal(false);
    setItemsToMove([]);
    setSelectionMode({
      active: false,
      type: null,
      parentId: null,
      items: new Set()
    });
    
    // Log final para debug
    console.log('=== MOVIMENTAÇÃO FINALIZADA ===');
    console.log('Dados salvos no localStorage');
  };

  return {
    moveItemUp,
    moveItemDown,
    handleMoveItem,
    executeMove
  };
};