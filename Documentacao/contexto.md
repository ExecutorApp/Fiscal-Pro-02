# Contexto e Arquitetura
# Fiscal Pro

## 🏛️ Arquitetura Macro

```mermaid
graph TB
    subgraph "Frontend - React + TypeScript"
        A[App.tsx] --> B[Header]
        A --> C[Main Content]
        
        C --> D[Clientes]
        C --> E[Banco de Dados]
        C --> F[Formulários]
        C --> G[Análise]
        C --> H[Kanban]
        
        subgraph "Banco de Dados Fiscal"
            E --> E1[Segmentos]
            E --> E2[Simples Nacional]
            E --> E3[Lucro Real]
            E --> E4[Tributação Folha]
            E --> E5[Estados ICMS]
        end
        
        subgraph "Contextos Globais"
            I[SegmentosContext]
            J[EstadosICMSContext]
            K[ImpostoRendaContext]
        end
        
        D -.-> I
        E -.-> I
        E -.-> J
        E -.-> K
    end
    
    subgraph "Armazenamento"
        L[localStorage]
        M[Arquivos Locais]
    end
    
    subgraph "Bibliotecas Externas"
        N[PDF.js]
        O[Mammoth]
        P[Radix UI]
        Q[Tailwind CSS]
    end
    
    A -.-> L
    H --> M
    G --> N
    G --> O
    C --> P
    A --> Q
```

## 🔄 Fluxo de Telas Principais

### 1. Fluxo de Gestão de Clientes

```mermaid
flowchart TD
    A[Tela Inicial] --> B[Lista de Clientes]
    B --> C{Ação do Usuário}
    
    C -->|Novo Cliente| D[Modal Cadastro]
    C -->|Editar| E[Modal Edição]
    C -->|Visualizar| F[Detalhes do Cliente]
    C -->|Excluir| G[Modal Confirmação]
    
    D --> H[Validação]
    E --> H
    
    H -->|Válido| I[Salvar no localStorage]
    H -->|Inválido| J[Exibir Erros]
    
    I --> K[Atualizar Lista]
    J --> D
    J --> E
    
    G -->|Confirmar| L[Remover Cliente]
    G -->|Cancelar| B
    
    L --> K
    K --> B
    
    F --> M[Histórico]
    F --> N[Editar Cliente]
    N --> E
```

### 2. Fluxo de Configuração Fiscal

```mermaid
flowchart TD
    A[Banco de Dados] --> B{Selecionar Módulo}
    
    B -->|Segmentos| C[BD-SegmentoTributacao]
    B -->|Simples Nacional| D[BD-SimplesNacionalSegmentos]
    B -->|Lucro Real| E[BD-LucroReal]
    B -->|Tributação Folha| F[BD-TributacaoFolha]
    B -->|Estados ICMS| G[BD-EstadosICMS]
    
    C --> H[Listar Segmentos]
    D --> I[Listar Anexos]
    E --> J[Configurar Alíquotas]
    F --> K[Gerenciar Encargos]
    G --> L[Estados e Alíquotas]
    
    H --> M{Ação}
    I --> M
    J --> M
    K --> M
    L --> M
    
    M -->|Adicionar| N[Modal Novo Item]
    M -->|Editar| O[Modal Edição]
    M -->|Remover| P[Modal Confirmação]
    
    N --> Q[Validar Dados]
    O --> Q
    
    Q -->|Válido| R[Salvar]
    Q -->|Inválido| S[Exibir Erros]
    
    R --> T[Atualizar Context]
    T --> U[Persistir localStorage]
    U --> V[Atualizar UI]
    
    S --> N
    S --> O
    
    P -->|Confirmar| W[Remover Item]
    W --> T
```

### 3. Fluxo de Visualização de Documentos

```mermaid
flowchart TD
    A[Upload/Seleção] --> B[Detectar Tipo]
    
    B -->|PDF| C[PDF.js Viewer]
    B -->|Word| D[Mammoth Converter]
    B -->|Imagem| E[Image Viewer]
    B -->|Texto| F[Text Viewer]
    B -->|Outros| G[Download Only]
    
    C --> H[Renderizar PDF]
    D --> I[Converter para HTML]
    E --> J[Exibir Imagem]
    F --> K[Exibir Texto]
    
    H --> L[Controles de Navegação]
    I --> M[Exibir HTML]
    J --> N[Controles de Zoom]
    K --> O[Formatação]
    
    L --> P[Zoom, Página, Download]
    M --> Q[Scroll, Download]
    N --> R[Zoom, Rotação]
    O --> S[Quebra de Linha]
    
    G --> T[Botão Download]
    
    P --> U[Ações do Usuário]
    Q --> U
    R --> U
    S --> U
    T --> U
```

### 4. Fluxo de Análise de Dados

```mermaid
flowchart TD
    A[Módulo Análise] --> B[Selecionar Dados]
    
    B --> C[Dados de Clientes]
    B --> D[Configurações Fiscais]
    B --> E[Documentos]
    
    C --> F[Filtros e Parâmetros]
    D --> F
    E --> F
    
    F --> G[Processar Análise]
    
    G --> H[Cruzamento de Dados]
    H --> I[Cálculos Tributários]
    I --> J[Geração de Relatórios]
    
    J --> K{Tipo de Saída}
    
    K -->|Tabela| L[Exibir Grid]
    K -->|Gráfico| M[Renderizar Chart]
    K -->|Relatório| N[Gerar PDF/Excel]
    
    L --> O[Interações]
    M --> O
    N --> P[Download]
    
    O --> Q[Filtrar]
    O --> R[Ordenar]
    O --> S[Exportar]
    
    Q --> L
    R --> L
    S --> N
```

## 🗂️ Estrutura de Dados

### Modelo de Cliente
```typescript
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  cnpj?: string;
  status: 'ativo' | 'inativo' | 'lead';
  dataUltimaInteracao: Date;
  observacoes?: string;
  historico: HistoricoItem[];
}
```

### Modelo de Segmento Tributário
```typescript
interface SegmentoTributacao {
  id: string;
  descricao: string;
  aliquota: number;
  tipo: 'simples' | 'lucroReal' | 'lucroPresumido';
  ativo: boolean;
  dataAtualizacao: Date;
}
```

### Modelo de Estado ICMS
```typescript
interface EstadoICMS {
  uf: string;
  nome: string;
  aliquotaInterna: number;
  aliquotaInterestadual: number;
  observacoes?: string;
}
```

## 🔧 Padrões de Desenvolvimento

### Estrutura de Componentes