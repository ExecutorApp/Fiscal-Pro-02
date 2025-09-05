import { MenuItem } from './1.GerenciarDocumentos';

export const useRenumeracao = () => {
  // Função genérica para renumerar itens
  const renumerarItens = (items: MenuItem[], autoNumerar: boolean = true): MenuItem[] => {
    return items.map((item, index) => {
      // Se é arquivo, não faz nada
      if (item.type === 'arquivo') {
        return item;
      }
      
      let updatedItem = { ...item };
      
      // Se tem showNumber true E autoNumerar está true, aplica numeração
      if (item.showNumber === true && autoNumerar) {
        let nomeOriginal = item.label;
        
        // Remove número anterior se existir
        if (item.label.match(/^\d{2}\s/)) {
          nomeOriginal = item.label.substring(3);
        }
        
        // Usa o índice real (posição) + 1 para a numeração
        // Isso considera TODOS os itens (exceto arquivos), não apenas os numerados
        const numeroNovo = (index + 1).toString().padStart(2, '0');
        
        updatedItem.label = `${numeroNovo} ${nomeOriginal}`;
      }
      
      // Se tem filhos, renumera recursivamente (reinicia contador para cada grupo)
      if (updatedItem.children && updatedItem.children.length > 0) {
        updatedItem.children = renumerarItens(updatedItem.children, autoNumerar);
      }
      
      return updatedItem;
    });
  };

  // Função para garantir que todos os itens numerados tenham showNumber definido
  const normalizarPropriedadesNumeracao = (items: MenuItem[]): MenuItem[] => {
    return items.map(item => {
      // Se tem numeração no label mas não tem showNumber, adicionar
      if (item.label && item.label.match(/^\d{2}\s/) && !item.showNumber) {
        item.showNumber = true;
      }
      
      // Processar filhos recursivamente
      if (item.children && item.children.length > 0) {
        item.children = normalizarPropriedadesNumeracao(item.children);
      }
      
      return item;
    });
  };

  // Função para renumerar todas as categorias sequencialmente
  const renumerarCategorias = (
    currentData: MenuItem[], 
    setCurrentData: (data: MenuItem[]) => void,
    numeracaoAutomatica: boolean,
    activeTab: 'fisica' | 'juridica',
    saveToLocalStorage: (key: string, data: any) => void,
    STORAGE_KEY_JURIDICA: string,
    STORAGE_KEY_FISICA: string
  ) => {
    const dataRenumerada = renumerarItens(currentData, numeracaoAutomatica);
    setCurrentData(dataRenumerada);
    
    // Salvar no localStorage
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataRenumerada);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataRenumerada);
    }
  };

  // Função para obter o próximo número de categoria
  const getProximoNumeroCategoria = () => {
    // Esta função precisa receber getCurrentData como parâmetro quando chamada
    return 1; // Valor padrão, será calculado no componente
  };

  // Função para obter o próximo número de subcategoria dentro de uma categoria pai
  const getProximoNumeroSubcategoria = (categoriaPaiId: string, currentData: MenuItem[]) => {
    // Encontrar a categoria pai
    const findCategoriaPai = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.id === categoriaPaiId) return item;
        if (item.children) {
          const found = findCategoriaPai(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const categoriaPai = findCategoriaPai(currentData);
    if (!categoriaPai || !categoriaPai.children) return 1;
    
    // Contar TODAS as subcategorias/empresas (exceto arquivos)
    const subcategorias = categoriaPai.children.filter(child => 
      child.type !== 'arquivo'
    );
    
    const proximoNumero = subcategorias.length + 1;
    
    return proximoNumero;
  };

  // Função para renumerar subcategorias dentro de uma categoria
  const renumerarSubcategorias = (categoriaPaiId: string, currentData: MenuItem[]) => {
    const updateCategoriasRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === categoriaPaiId && item.children) {
          let contador = 1;
          const subcategoriasRenumeradas = item.children.map((subcategoria) => {
            if (subcategoria.type !== 'arquivo' && subcategoria.showNumber) {
              // Remover número antigo se existir
              let nomeOriginal = subcategoria.label;
              if (subcategoria.label.match(/^\d{2}\s/)) {
                nomeOriginal = subcategoria.label.substring(3);
              }
              
              const numeroNovo = contador.toString().padStart(2, '0');
              contador++;
              
              return {
                ...subcategoria,
                label: `${numeroNovo} ${nomeOriginal}`
              };
            }
            return subcategoria;
          });
          
          return {
            ...item,
            children: subcategoriasRenumeradas
          };
        }
        
        if (item.children) {
          return {
            ...item,
            children: updateCategoriasRecursive(item.children)
          };
        }
        
        return item;
      });
    };
    
    return updateCategoriasRecursive(currentData);
  };

  // Função para obter a posição de uma categoria
  const getPositionCategoria = (categoriaId: string, currentData: MenuItem[]): number => {
    const categoriasNumeradas = currentData.filter(item => item.type === 'categoria' && item.showNumber);
    const index = categoriasNumeradas.findIndex(cat => cat.id === categoriaId);
    return index + 1;
  };

  return {
    renumerarItens,
    normalizarPropriedadesNumeracao,
    renumerarCategorias,
    getProximoNumeroCategoria,
    getProximoNumeroSubcategoria,
    renumerarSubcategorias,
    getPositionCategoria
  };
};