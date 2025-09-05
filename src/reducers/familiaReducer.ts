import { DadosFamiliares, Filho, Conjuge, Neto, AcaoFormulario, criarFilhoVazio, criarPessoaVazia, gerarId } from '../types/familia';

// Funções auxiliares para criar tipos específicos
const criarConjugeVazio = (): Conjuge => ({
  ...criarPessoaVazia(),
  profissao: '',
  rendaMensal: 0
});

const criarNetoVazio = (): Neto => ({
  ...criarPessoaVazia(),
  profissao: '',
  rendaMensal: 0
});

/**
 * Reducer para gerenciar o estado da família seguindo as regras de cadeia de dependências
 * 
 * Regras implementadas:
 * 1. Cadeia em coluna: cada coluna depende da esquerda
 * 2. Cônjuge: N cônjuges. Ao trocar de cônjuge, as colunas 2/3/4 resetam; ao voltar, reaparecem os dados salvos
 * 3. Para cada cônjuge: N filhos. Cada filho guarda seu próprio estado
 * 4. Ao trocar de filho: colunas "cônjuge do filho" e "filhos do filho" resetam; ao voltar, restauram o estado salvo
 * 5. Remoções respeitam a cadeia (remover filho apaga cônjuge do filho e netos desse filho)
 */
export const familiaReducer = (state: DadosFamiliares, action: AcaoFormulario): DadosFamiliares => {
  switch (action.tipo) {
    // === AÇÕES DE CÔNJUGE ATIVO ===
    case 'ADICIONAR_CONJUGE_ATIVO': {
      const novoConjuge: Conjuge = {
        ...criarConjugeVazio(),
        id: gerarId()
      };
      
      return {
        ...state,
        conjugeAtivo: novoConjuge
      };
    }

    case 'REMOVER_CONJUGE_ATIVO': {
      return {
        ...state,
        conjugeAtivo: null,
        // Ao remover cônjuge ativo, resetar filhos (regra da cadeia)
        filhos: []
      };
    }

    case 'ATUALIZAR_CONJUGE_ATIVO': {
      if (!state.conjugeAtivo) {
        return state;
      }
      
      return {
        ...state,
        conjugeAtivo: {
          ...state.conjugeAtivo,
          ...action.dados
        }
      };
    }

    case 'MOVER_CONJUGE_PARA_EX': {
      if (!state.conjugeAtivo) {
        return state;
      }
      
      return {
        ...state,
        conjugeAtivo: null,
        exConjuges: [...state.exConjuges, state.conjugeAtivo],
        // Ao mover cônjuge para ex, resetar filhos (regra da cadeia)
        filhos: []
      };
    }

    // === AÇÕES DE EX-CÔNJUGES ===
    case 'ADICIONAR_EX_CONJUGE': {
      const novoExConjuge: Conjuge = {
        ...criarConjugeVazio(),
        id: gerarId()
      };
      
      return {
        ...state,
        exConjuges: [...state.exConjuges, novoExConjuge]
      };
    }

    case 'REMOVER_EX_CONJUGE': {
      if (action.indice < 0 || action.indice >= state.exConjuges.length) {
        return state;
      }
      
      const novosExConjuges = state.exConjuges.filter((_, index) => index !== action.indice);
      
      return {
        ...state,
        exConjuges: novosExConjuges
      };
    }

    case 'ATUALIZAR_EX_CONJUGE': {
      if (action.indice < 0 || action.indice >= state.exConjuges.length) {
        return state;
      }
      
      const novosExConjuges = [...state.exConjuges];
      novosExConjuges[action.indice] = {
        ...novosExConjuges[action.indice],
        ...action.dados
      };
      
      return {
        ...state,
        exConjuges: novosExConjuges
      };
    }

    case 'PROMOVER_EX_PARA_CONJUGE': {
      if (action.indice < 0 || action.indice >= state.exConjuges.length) {
        return state;
      }
      
      const exConjugePromovido = state.exConjuges[action.indice];
      const novosExConjuges = state.exConjuges.filter((_, index) => index !== action.indice);
      
      // Se já existe cônjuge ativo, mover para ex-cônjuges
      const novosExConjugesComAtual = state.conjugeAtivo 
        ? [...novosExConjuges, state.conjugeAtivo]
        : novosExConjuges;
      
      return {
        ...state,
        conjugeAtivo: exConjugePromovido,
        exConjuges: novosExConjugesComAtual,
        // Ao promover ex para cônjuge, resetar filhos (regra da cadeia)
        filhos: []
      };
    }

    // === AÇÕES DE FILHOS ===
    case 'ADICIONAR_FILHO': {
      const novoFilho: Filho = {
        ...criarFilhoVazio(),
        id: gerarId()
      };
      
      return {
        ...state,
        filhos: [...state.filhos, novoFilho]
      };
    }

    case 'REMOVER_FILHO': {
      if (action.indice < 0 || action.indice >= state.filhos.length) {
        return state;
      }
      
      // Remover filho respeitando a cadeia (remove cônjuges e netos do filho)
      const novosFilhos = state.filhos.filter((_, index) => index !== action.indice);
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'ATUALIZAR_FILHO': {
      if (action.indice < 0 || action.indice >= state.filhos.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indice] = {
        ...novosFilhos[action.indice],
        ...action.dados
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'RESETAR_FILHOS': {
      return {
        ...state,
        filhos: []
      };
    }

    case 'RESETAR_CONJUGES_FILHOS': {
      // Resetar cônjuges de todos os filhos
      const filhosResetados = state.filhos.map(filho => ({
        ...filho,
        exConjuges: []
      }));
      
      return {
        ...state,
        filhos: filhosResetados
      };
    }

    case 'RESETAR_NETOS': {
      // Resetar netos de todos os filhos
      const filhosResetados = state.filhos.map(filho => ({
        ...filho,
        filhos: []
      }));
      
      return {
        ...state,
        filhos: filhosResetados
      };
    }

    // === AÇÕES DE CÔNJUGES DE FILHOS ===
    case 'ADICIONAR_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const novoConjugeFilho: Conjuge = {
        ...criarConjugeVazio(),
        id: gerarId()
      };
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        exConjuges: [...novosFilhos[action.indiceFilho].exConjuges, novoConjugeFilho]
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'REMOVER_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indiceConjuge < 0 || action.indiceConjuge >= filho.exConjuges.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        exConjuges: filho.exConjuges.filter((_, index) => index !== action.indiceConjuge),
        // Ao remover cônjuge do filho, resetar netos (regra da cadeia)
        filhos: []
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'ATUALIZAR_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indiceConjuge < 0 || action.indiceConjuge >= filho.exConjuges.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      const novosConjuges = [...filho.exConjuges];
      novosConjuges[action.indiceConjuge] = {
        ...novosConjuges[action.indiceConjuge],
        ...action.dados
      };
      
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        exConjuges: novosConjuges
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    // === AÇÕES DE CÔNJUGE ATIVO DO FILHO ===
    case 'ADICIONAR_CONJUGE_ATIVO_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const novoConjugeFilho: Conjuge = {
        ...criarConjugeVazio(),
        id: gerarId()
      };
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        conjugeAtivo: novoConjugeFilho
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'REMOVER_CONJUGE_ATIVO_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        conjugeAtivo: null,
        // Ao remover cônjuge ativo do filho, resetar netos (regra da cadeia)
        filhos: []
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'ATUALIZAR_CONJUGE_ATIVO_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (!filho.conjugeAtivo) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        conjugeAtivo: {
          ...filho.conjugeAtivo,
          ...action.dados
        }
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'MOVER_CONJUGE_FILHO_PARA_EX': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (!filho.conjugeAtivo) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        conjugeAtivo: null,
        exConjuges: [...filho.exConjuges, filho.conjugeAtivo],
        // Ao mover cônjuge para ex, resetar netos (regra da cadeia)
        filhos: []
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    // === AÇÕES DE EX-CÔNJUGE DO FILHO ===
    case 'ADICIONAR_EX_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const novoExConjugeFilho: Conjuge = {
        ...criarConjugeVazio(),
        id: gerarId()
      };
      
      const novosFilhos = [...state.filhos];
      const filho = novosFilhos[action.indiceFilho];
      novosFilhos[action.indiceFilho] = {
        ...filho,
        exConjuges: [...filho.exConjuges, novoExConjugeFilho],
        filhos: [] // Reset dos filhos do filho (netos) ao adicionar ex-cônjuge
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'REMOVER_EX_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indice < 0 || action.indice >= filho.exConjuges.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        exConjuges: filho.exConjuges.filter((_, index) => index !== action.indice)
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'ATUALIZAR_EX_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indice < 0 || action.indice >= filho.exConjuges.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      const novosExConjuges = [...filho.exConjuges];
      novosExConjuges[action.indice] = {
        ...novosExConjuges[action.indice],
        ...action.dados
      };
      
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        exConjuges: novosExConjuges
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'PROMOVER_EX_PARA_CONJUGE_FILHO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indice < 0 || action.indice >= filho.exConjuges.length) {
        return state;
      }
      
      const exConjugePromovido = filho.exConjuges[action.indice];
      const novosExConjuges = filho.exConjuges.filter((_, index) => index !== action.indice);
      
      // Se já existe cônjuge ativo, mover para ex-cônjuges
      const novosExConjugesCompletos = filho.conjugeAtivo 
        ? [...novosExConjuges, filho.conjugeAtivo]
        : novosExConjuges;
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        conjugeAtivo: exConjugePromovido,
        exConjuges: novosExConjugesCompletos,
        // Ao promover ex para cônjuge ativo, resetar netos (regra da cadeia)
        filhos: []
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    // === AÇÕES DE NETOS ===
    case 'ADICIONAR_NETO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const novoNeto = criarNetoVazio();
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        filhos: [...novosFilhos[action.indiceFilho].filhos, novoNeto]
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'REMOVER_NETO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indiceNeto < 0 || action.indiceNeto >= filho.filhos.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        filhos: filho.filhos.filter((_, index) => index !== action.indiceNeto)
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    case 'ATUALIZAR_NETO': {
      if (action.indiceFilho < 0 || action.indiceFilho >= state.filhos.length) {
        return state;
      }
      
      const filho = state.filhos[action.indiceFilho];
      if (action.indiceNeto < 0 || action.indiceNeto >= filho.filhos.length) {
        return state;
      }
      
      const novosFilhos = [...state.filhos];
      const novosNetos = [...filho.filhos];
      novosNetos[action.indiceNeto] = {
        ...novosNetos[action.indiceNeto],
        ...action.dados
      };
      
      novosFilhos[action.indiceFilho] = {
        ...novosFilhos[action.indiceFilho],
        filhos: novosNetos
      };
      
      return {
        ...state,
        filhos: novosFilhos
      };
    }

    // === AÇÕES ESPECIAIS ===
    case 'RESTAURAR_FILHOS_CONJUGE': {
      // Ação especial para restaurar filhos de um cônjuge específico
      if ('filhos' in action && Array.isArray(action.filhos)) {
        return {
          ...state,
          filhos: action.filhos
        };
      }
      return state;
    }

    case 'RESTAURAR_ESTADO_FILHO': {
      // Ação especial para restaurar estado de um filho específico
      if ('indiceFilho' in action && 'conjuges' in action && 'netos' in action) {
        const { indiceFilho, conjuges, netos } = action;
        
        if (indiceFilho < 0 || indiceFilho >= state.filhos.length) {
          return state;
        }
        
        const novosFilhos = [...state.filhos];
        novosFilhos[indiceFilho] = {
          ...novosFilhos[indiceFilho],
          exConjuges: (conjuges as Conjuge[]) || [],
          filhos: (netos as Neto[]) || []
        };
        
        return {
          ...state,
          filhos: novosFilhos
        };
      }
      return state;
    }

    default:
      return state;
  }
};

export default familiaReducer;