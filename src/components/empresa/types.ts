export type FieldType =
  | "text" // legado
  | "number" // legado
  | "text_short"
  | "text_long"
  | "date"
  | "cpf_cnpj"
  | "cpf"
  | "cnpj"
  | "telefone"
  | "email"
  | "cep"
  | "integer"
  | "integer_text"
  | "ie"
  | "im"
  | "regras_negocio"
  | "select"
  | "radio"
  | "checkbox";

export interface CampoDef {
  id: string;
  tipo: FieldType;
  label: string;
  // Para selects
  opcoes?: string[];
  // Validações simples
  obrigatorio?: boolean;
  // Placeholder opcional para inputs/selects
  placeholder?: string;
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