export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "cpf"
  | "cnpj"
  | "telefone"
  | "email"
  | "cep";

export interface CampoDef {
  id: string;
  tipo: FieldType;
  label: string;
  // Para selects
  opcoes?: string[];
  // Validações simples
  obrigatorio?: boolean;
}

export interface AbaDef {
  id: string;
  nome: string;
  campos: CampoDef[];
}

export interface Empresa {
  id: string;
  nome: string;
  // dados por aba -> campo -> valor
  dados: Record<string, Record<string, any>>; // { abaId: { campoId: valor } }
}

export interface EstruturaEmpresas {
  abas: AbaDef[];
}

export interface EmpresasState {
  empresas: Empresa[];
  selecionadaId: string | null;
  estrutura: EstruturaEmpresas;
}