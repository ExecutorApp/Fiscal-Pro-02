import { useState, useCallback } from 'react';
import { DadosFamiliares, Filho, Conjuge, criarDadosFamiliaresVazios } from '../types/familia';

/**
 * Hook para gerenciar estados individuais de cônjuges e filhos com persistência no localStorage
 * Implementa as regras de cadeia de dependências e reset/restauração
 */
export const useFamiliaEstados = (clienteId?: string) => {
  const [dadosFamilia, setDadosFamilia] = useState<DadosFamiliares>(criarDadosFamiliaresVazios());
  const [filhoSelecionado, setFilhoSelecionado] = useState(0);
  const [conjugeFilhoSelecionado, setConjugeFilhoSelecionado] = useState(0);
  const [netoSelecionado, setNetoSelecionado] = useState(0);

  // Chaves para localStorage baseadas no clienteId
  const getChaveConjugeAtivo = () => 
    clienteId ? `familia_conjuge_ativo_${clienteId}` : 'familia_conjuge_ativo';
  
  const getChaveExConjuge = (indiceExConjuge: number) => 
    clienteId ? `familia_ex_conjuge_${clienteId}_${indiceExConjuge}` : `familia_ex_conjuge_${indiceExConjuge}`;
  
  const getChaveFilho = (indiceFilho: number) => 
    clienteId ? `familia_filho_${clienteId}_${indiceFilho}` : `familia_filho_${indiceFilho}`;
  
  const getChaveEstadoFilho = (indiceFilho: number) => 
    clienteId ? `familia_estado_filho_${clienteId}_${indiceFilho}` : `familia_estado_filho_${indiceFilho}`;

  const getChaveGeral = () => 
    clienteId ? `familia_geral_${clienteId}` : 'familia_geral';

  const getChaveIndicesConjugeAtivo = () => 
    clienteId ? `familia_indices_conjuge_ativo_${clienteId}` : 'familia_indices_conjuge_ativo';
  
  const getChaveIndicesExConjuge = (indiceExConjuge: number) => 
    clienteId ? `familia_indices_ex_conjuge_${clienteId}_${indiceExConjuge}` : `familia_indices_ex_conjuge_${indiceExConjuge}`;

  // Chaves para netos específicos por cônjuge do filho
  const getChaveNetosConjugeFilho = (indiceFilho: number, indiceConjuge: number) => 
    clienteId ? `familia_netos_filho_${clienteId}_${indiceFilho}_conjuge_${indiceConjuge}` : `familia_netos_filho_${indiceFilho}_conjuge_${indiceConjuge}`;
  
  const getChaveNetosConjugeAtivoFilho = (indiceFilho: number) => 
    clienteId ? `familia_netos_filho_${clienteId}_${indiceFilho}_conjuge_ativo` : `familia_netos_filho_${indiceFilho}_conjuge_ativo`;

  /**
   * Salva os índices selecionados do cônjuge ativo
   */
  const salvarIndicesConjugeAtivo = useCallback((indices: { filhoSelecionado: number, conjugeFilhoSelecionado: number, netoSelecionado: number }) => {
    try {
      const chave = getChaveIndicesConjugeAtivo();
      const estado = {
        ...indices,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log('Índices do cônjuge ativo salvos:', chave, indices);
    } catch (error) {
      console.error('Erro ao salvar índices do cônjuge ativo:', error);
    }
  }, [clienteId]);

  /**
   * Carrega os índices selecionados do cônjuge ativo
   */
  const carregarIndicesConjugeAtivo = useCallback((): { filhoSelecionado: number, conjugeFilhoSelecionado: number, netoSelecionado: number } | null => {
    try {
      const chave = getChaveIndicesConjugeAtivo();
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log('Índices do cônjuge ativo carregados:', chave, estado);
        return {
          filhoSelecionado: estado.filhoSelecionado || 0,
          conjugeFilhoSelecionado: estado.conjugeFilhoSelecionado || 0,
          netoSelecionado: estado.netoSelecionado || 0
        };
      }
    } catch (error) {
      console.error('Erro ao carregar índices do cônjuge ativo:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva os índices selecionados de um ex-cônjuge
   */
  const salvarIndicesExConjuge = useCallback((indiceExConjuge: number, indices: { filhoSelecionado: number, conjugeFilhoSelecionado: number, netoSelecionado: number, abaFilhoAtiva?: 'conjuge' | 'ex' }) => {
    try {
      const chave = getChaveIndicesExConjuge(indiceExConjuge);
      const estado = {
        ...indices,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log(`💾 [DEBUG LOCALSTORAGE] Índices do ex-cônjuge ${indiceExConjuge} salvos:`, chave, estado);
      console.log(`💾 [DEBUG LOCALSTORAGE] Estado completo salvo:`, JSON.stringify(estado, null, 2));
    } catch (error) {
      console.error('Erro ao salvar índices do ex-cônjuge:', error);
    }
  }, [clienteId]);

  /**
   * Carrega os índices selecionados de um ex-cônjuge
   */
  const carregarIndicesExConjuge = useCallback((indiceExConjuge: number): { filhoSelecionado: number, conjugeFilhoSelecionado: number, netoSelecionado: number, abaFilhoAtiva?: 'conjuge' | 'ex' } | null => {
    try {
      const chave = getChaveIndicesExConjuge(indiceExConjuge);
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log(`📂 [DEBUG LOCALSTORAGE] Índices do ex-cônjuge ${indiceExConjuge} carregados:`, chave, estado);
        console.log(`📂 [DEBUG LOCALSTORAGE] Estado da aba carregado:`, estado.abaFilhoAtiva);
        const resultado = {
          filhoSelecionado: estado.filhoSelecionado || 0,
          conjugeFilhoSelecionado: estado.conjugeFilhoSelecionado || 0,
          netoSelecionado: estado.netoSelecionado || 0,
          abaFilhoAtiva: estado.abaFilhoAtiva
        };
        console.log(`📂 [DEBUG LOCALSTORAGE] Resultado final:`, resultado);
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao carregar índices do ex-cônjuge:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva o estado específico do cônjuge ativo
   */
  const salvarEstadoConjugeAtivo = useCallback((filhos: Filho[]) => {
    try {
      const chave = getChaveConjugeAtivo();
      const estado = {
        filhos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log('Estado do cônjuge ativo salvo:', chave);
    } catch (error) {
      console.error('Erro ao salvar estado do cônjuge ativo:', error);
    }
  }, [clienteId]);

  /**
   * Carrega o estado específico do cônjuge ativo
   */
  const carregarEstadoConjugeAtivo = useCallback((): Filho[] | null => {
    try {
      const chave = getChaveConjugeAtivo();
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log('Estado do cônjuge ativo carregado:', chave);
        return estado.filhos || [];
      }
    } catch (error) {
      console.error('Erro ao carregar estado do cônjuge ativo:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva o estado específico de um ex-cônjuge
   */
  const salvarEstadoExConjuge = useCallback((indiceExConjuge: number, filhos: Filho[]) => {
    try {
      const chave = getChaveExConjuge(indiceExConjuge);
      const estado = {
        filhos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log(`Estado do ex-cônjuge ${indiceExConjuge} salvo:`, chave);
    } catch (error) {
      console.error('Erro ao salvar estado do ex-cônjuge:', error);
    }
  }, [clienteId]);

  /**
   * Carrega o estado específico de um ex-cônjuge
   */
  const carregarEstadoExConjuge = useCallback((indiceExConjuge: number): Filho[] | null => {
    try {
      const chave = getChaveExConjuge(indiceExConjuge);
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log(`Estado do ex-cônjuge ${indiceExConjuge} carregado:`, chave);
        return estado.filhos || [];
      }
    } catch (error) {
      console.error('Erro ao carregar estado do ex-cônjuge:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva o estado específico de um filho (cônjuges e netos)
   */
  const salvarEstadoFilho = useCallback((indiceFilho: number, filho: Filho, indices?: { conjugeFilhoSelecionado?: number, netoSelecionado?: number }) => {
    try {
      const chave = getChaveFilho(indiceFilho);
      const estado = {
        conjuges: filho.exConjuges,
        filhos: filho.filhos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      
      // Salvar também os índices selecionados para este filho
      const chaveEstado = getChaveEstadoFilho(indiceFilho);
      const estadoSelecao = {
        conjugeFilhoSelecionado: indices?.conjugeFilhoSelecionado ?? conjugeFilhoSelecionado,
        netoSelecionado: indices?.netoSelecionado ?? netoSelecionado,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chaveEstado, JSON.stringify(estadoSelecao));
      
      console.log(`Estado do filho ${indiceFilho} salvo:`, chave, estado, estadoSelecao);
    } catch (error) {
      console.error('Erro ao salvar estado do filho:', error);
    }
  }, [conjugeFilhoSelecionado, netoSelecionado, clienteId]);

  /**
   * Carrega o estado específico de um filho
   */
  const carregarEstadoFilho = useCallback((indiceFilho: number): { conjuges: Conjuge[], filhos: any[], indices?: { conjugeFilhoSelecionado: number, netoSelecionado: number } } | null => {
    try {
      const chave = getChaveFilho(indiceFilho);
      const estadoSalvo = localStorage.getItem(chave);
      
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        
        // Carregar também os índices selecionados
        const chaveEstado = getChaveEstadoFilho(indiceFilho);
        const estadoSelecaoSalvo = localStorage.getItem(chaveEstado);
        let indices = undefined;
        
        if (estadoSelecaoSalvo) {
          const estadoSelecao = JSON.parse(estadoSelecaoSalvo);
          indices = {
            conjugeFilhoSelecionado: estadoSelecao.conjugeFilhoSelecionado || 0,
            netoSelecionado: estadoSelecao.netoSelecionado || 0
          };
        }
        
        console.log(`Estado do filho ${indiceFilho} carregado:`, chave);
        return {
          conjuges: estado.conjuges || [],
          filhos: estado.filhos || [],
          indices
        };
      }
    } catch (error) {
      console.error('Erro ao carregar estado do filho:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Remove estado específico do cônjuge ativo
   */
  const removerEstadoConjugeAtivo = useCallback(() => {
    try {
      const chave = getChaveConjugeAtivo();
      localStorage.removeItem(chave);
      console.log('Estado do cônjuge ativo removido:', chave);
    } catch (error) {
      console.error('Erro ao remover estado do cônjuge ativo:', error);
    }
  }, [clienteId]);

  /**
   * Remove estado específico de um ex-cônjuge
   */
  const removerEstadoExConjuge = useCallback((indiceExConjuge: number) => {
    try {
      const chave = getChaveExConjuge(indiceExConjuge);
      localStorage.removeItem(chave);
      console.log(`Estado do ex-cônjuge ${indiceExConjuge} removido:`, chave);
    } catch (error) {
      console.error('Erro ao remover estado do ex-cônjuge:', error);
    }
  }, [clienteId]);

  /**
   * Remove estado específico de um filho
   */
  const removerEstadoFilho = useCallback((indiceFilho: number) => {
    try {
      const chave = getChaveFilho(indiceFilho);
      const chaveEstado = getChaveEstadoFilho(indiceFilho);
      localStorage.removeItem(chave);
      localStorage.removeItem(chaveEstado);
      console.log(`Estado do filho ${indiceFilho} removido:`, chave);
    } catch (error) {
      console.error('Erro ao remover estado do filho:', error);
    }
  }, [clienteId]);

  /**
   * Salva o estado geral da família (cônjuge ativo, ex-cônjuges e índices principais)
   */
  const salvarEstadoGeral = useCallback((dados: DadosFamiliares, indices?: { filhoSelecionado?: number }) => {
    try {
      const chave = getChaveGeral();
      const estado = {
        conjugeAtivo: dados.conjugeAtivo,
        exConjuges: dados.exConjuges,
        filhoSelecionado: indices?.filhoSelecionado ?? filhoSelecionado,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log('Estado geral da família salvo:', chave, estado);
    } catch (error) {
      console.error('Erro ao salvar estado geral:', error);
    }
  }, [filhoSelecionado, clienteId]);

  /**
   * Carrega o estado geral da família
   */
  const carregarEstadoGeral = useCallback((): { dados: DadosFamiliares, indices?: { filhoSelecionado: number } } | null => {
    try {
      const chave = getChaveGeral();
      const estadoSalvo = localStorage.getItem(chave);
      
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log('Estado geral da família carregado:', chave);
        
        return {
          dados: {
            conjugeAtivo: estado.conjugeAtivo || null,
            exConjuges: estado.exConjuges || [],
            filhos: [] // Filhos serão carregados individualmente
          },
          indices: {
            filhoSelecionado: estado.filhoSelecionado || 0
          }
        };
      }
    } catch (error) {
      console.error('Erro ao carregar estado geral:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva netos específicos para um cônjuge ativo do filho
   */
  const salvarNetosConjugeAtivoFilho = useCallback((indiceFilho: number, netos: any[]) => {
    try {
      const chave = getChaveNetosConjugeAtivoFilho(indiceFilho);
      const estado = {
        netos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log(`Netos do cônjuge ativo do filho ${indiceFilho} salvos:`, chave);
    } catch (error) {
      console.error('Erro ao salvar netos do cônjuge ativo do filho:', error);
    }
  }, [clienteId]);

  /**
   * Carrega netos específicos de um cônjuge ativo do filho
   */
  const carregarNetosConjugeAtivoFilho = useCallback((indiceFilho: number): any[] | null => {
    try {
      const chave = getChaveNetosConjugeAtivoFilho(indiceFilho);
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log(`Netos do cônjuge ativo do filho ${indiceFilho} carregados:`, chave);
        return estado.netos || [];
      }
    } catch (error) {
      console.error('Erro ao carregar netos do cônjuge ativo do filho:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Salva netos específicos para um ex-cônjuge do filho
   */
  const salvarNetosConjugeFilho = useCallback((indiceFilho: number, indiceConjuge: number, netos: any[]) => {
    try {
      const chave = getChaveNetosConjugeFilho(indiceFilho, indiceConjuge);
      const estado = {
        netos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(chave, JSON.stringify(estado));
      console.log(`Netos do ex-cônjuge ${indiceConjuge} do filho ${indiceFilho} salvos:`, chave);
    } catch (error) {
      console.error('Erro ao salvar netos do ex-cônjuge do filho:', error);
    }
  }, [clienteId]);

  /**
   * Carrega netos específicos de um ex-cônjuge do filho
   */
  const carregarNetosConjugeFilho = useCallback((indiceFilho: number, indiceConjuge: number): any[] | null => {
    try {
      const chave = getChaveNetosConjugeFilho(indiceFilho, indiceConjuge);
      const estadoSalvo = localStorage.getItem(chave);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log(`Netos do ex-cônjuge ${indiceConjuge} do filho ${indiceFilho} carregados:`, chave);
        return estado.netos || [];
      }
    } catch (error) {
      console.error('Erro ao carregar netos do ex-cônjuge do filho:', error);
    }
    return null;
  }, [clienteId]);

  /**
   * Remove netos específicos de um cônjuge ativo do filho
   */
  const removerNetosConjugeAtivoFilho = useCallback((indiceFilho: number) => {
    try {
      const chave = getChaveNetosConjugeAtivoFilho(indiceFilho);
      localStorage.removeItem(chave);
      console.log(`Netos do cônjuge ativo do filho ${indiceFilho} removidos:`, chave);
    } catch (error) {
      console.error('Erro ao remover netos do cônjuge ativo do filho:', error);
    }
  }, [clienteId]);

  /**
   * Remove netos específicos de um ex-cônjuge do filho
   */
  const removerNetosConjugeFilho = useCallback((indiceFilho: number, indiceConjuge: number) => {
    try {
      const chave = getChaveNetosConjugeFilho(indiceFilho, indiceConjuge);
      localStorage.removeItem(chave);
      console.log(`Netos do ex-cônjuge ${indiceConjuge} do filho ${indiceFilho} removidos:`, chave);
    } catch (error) {
      console.error('Erro ao remover netos do ex-cônjuge do filho:', error);
    }
  }, [clienteId]);

  return {
    // Estados
    dadosFamilia,
    setDadosFamilia,
    filhoSelecionado,
    setFilhoSelecionado,
    conjugeFilhoSelecionado,
    setConjugeFilhoSelecionado,
    netoSelecionado,
    setNetoSelecionado,
    
    // Funções de persistência
    salvarEstadoConjugeAtivo,
    carregarEstadoConjugeAtivo,
    salvarEstadoExConjuge,
    carregarEstadoExConjuge,
    removerEstadoConjugeAtivo,
    removerEstadoExConjuge,
    salvarEstadoFilho,
    carregarEstadoFilho,
    removerEstadoFilho,
    salvarEstadoGeral,
    carregarEstadoGeral,
    salvarIndicesConjugeAtivo,
    carregarIndicesConjugeAtivo,
    salvarIndicesExConjuge,
    carregarIndicesExConjuge,
    
    // Funções específicas para netos por cônjuge
    salvarNetosConjugeAtivoFilho,
    carregarNetosConjugeAtivoFilho,
    salvarNetosConjugeFilho,
    carregarNetosConjugeFilho,
    removerNetosConjugeAtivoFilho,
    removerNetosConjugeFilho
  };
};

export default useFamiliaEstados;