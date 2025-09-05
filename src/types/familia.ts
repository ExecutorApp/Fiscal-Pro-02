// Interfaces para dados familiares

export interface PessoaFamiliar {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  regimeBens?: string;
}

export interface Conjuge extends PessoaFamiliar {
  profissao: string;
  rendaMensal: number;
}

export interface Filho extends PessoaFamiliar {
  conjugeAtivo: Conjuge | null;
  exConjuges: Conjuge[];
  filhos: Neto[];
}

export interface Neto extends PessoaFamiliar {
  profissao: string;
  rendaMensal: number;
}

export interface DadosFamiliares {
  conjugeAtivo: Conjuge | null;
  exConjuges: Conjuge[];
  filhos: Filho[];
}

// Tipos para validação de campos
export interface ErrosValidacao {
  nome?: string;
  email?: string;
  cpf?: string;
  celular?: string;
}

// Interface para estado do carrossel
export interface EstadoCarrossel {
  indiceAtivo: number;
  totalItens: number;
}

// Tipos para ações do formulário
export type AcaoFormulario = 
  | { tipo: 'ADICIONAR_FILHO' }
  | { tipo: 'REMOVER_FILHO'; indice: number }
  | { tipo: 'ATUALIZAR_FILHO'; indice: number; dados: Partial<Filho> }
  | { tipo: 'RESETAR_FILHOS' }
  | { tipo: 'RESETAR_CONJUGES_FILHOS' }
  | { tipo: 'RESETAR_NETOS' }
  | { tipo: 'ADICIONAR_NETO'; indiceFilho: number }
  | { tipo: 'REMOVER_NETO'; indiceFilho: number; indiceNeto: number }
  | { tipo: 'ATUALIZAR_NETO'; indiceFilho: number; indiceNeto: number; dados: Partial<Neto> }
  | { tipo: 'ADICIONAR_CONJUGE_ATIVO' }
  | { tipo: 'REMOVER_CONJUGE_ATIVO' }
  | { tipo: 'ATUALIZAR_CONJUGE_ATIVO'; dados: Partial<Conjuge> }
  | { tipo: 'MOVER_CONJUGE_PARA_EX' }
  | { tipo: 'ADICIONAR_EX_CONJUGE' }
  | { tipo: 'REMOVER_EX_CONJUGE'; indice: number }
  | { tipo: 'ATUALIZAR_EX_CONJUGE'; indice: number; dados: Partial<Conjuge> }
  | { tipo: 'PROMOVER_EX_PARA_CONJUGE'; indice: number }
  | { tipo: 'ADICIONAR_CONJUGE_FILHO'; indiceFilho: number }
  | { tipo: 'REMOVER_CONJUGE_FILHO'; indiceFilho: number; indiceConjuge: number }
  | { tipo: 'ATUALIZAR_CONJUGE_FILHO'; indiceFilho: number; indiceConjuge: number; dados: Partial<Conjuge> }
  | { tipo: 'ADICIONAR_CONJUGE_ATIVO_FILHO'; indiceFilho: number }
  | { tipo: 'REMOVER_CONJUGE_ATIVO_FILHO'; indiceFilho: number }
  | { tipo: 'ATUALIZAR_CONJUGE_ATIVO_FILHO'; indiceFilho: number; dados: Partial<Conjuge> }
  | { tipo: 'MOVER_CONJUGE_FILHO_PARA_EX'; indiceFilho: number }
  | { tipo: 'ADICIONAR_EX_CONJUGE_FILHO'; indiceFilho: number }
  | { tipo: 'REMOVER_EX_CONJUGE_FILHO'; indiceFilho: number; indice: number }
  | { tipo: 'ATUALIZAR_EX_CONJUGE_FILHO'; indiceFilho: number; indice: number; dados: Partial<Conjuge> }
  | { tipo: 'PROMOVER_EX_PARA_CONJUGE_FILHO'; indiceFilho: number; indice: number }
  | { tipo: 'SELECIONAR_FILHO'; indice: number }
  | { tipo: 'RESTAURAR_FILHOS_CONJUGE'; filhos: Filho[] }
  | { tipo: 'RESTAURAR_ESTADO_FILHO'; indiceFilho: number; conjuges: Conjuge[]; netos: Neto[] };

// Utilitários para geração de IDs únicos
export const gerarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Função para criar pessoa familiar vazia
export const criarPessoaVazia = (): PessoaFamiliar => ({
  id: gerarId(),
  nome: '',
  email: '',
  cpf: '',
  celular: ''
});

// Função para criar filho vazio
export const criarFilhoVazio = (): Filho => ({
  ...criarPessoaVazia(),
  conjugeAtivo: null,
  exConjuges: [],
  filhos: []
});

// Função para criar dados familiares vazios
export const criarDadosFamiliaresVazios = (): DadosFamiliares => ({
  conjugeAtivo: null,
  exConjuges: [],
  filhos: []
});