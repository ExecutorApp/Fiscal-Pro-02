# Documentação Técnica - Sistema VisualizarDocumentos

## Arquitetura do Sistema

### Visão Geral
O sistema VisualizarDocumentos foi projetado com uma arquitetura modular e extensível, seguindo os princípios SOLID e padrões de design modernos do React.

### Componentes Principais

#### 1. VisualizarDocumento (Orquestrador)
- **Responsabilidade**: Determinar qual viewer usar baseado no tipo de arquivo
- **Padrão**: Factory Pattern + Strategy Pattern
- **Lazy Loading**: Carrega viewers sob demanda para otimizar performance

#### 2. Viewers Especializados
Cada viewer implementa a interface `ViewerProps` e é responsável por um tipo específico de arquivo:

- **Jpeg/Png**: Visualização de imagens raster com zoom e pan
- **Svg**: Renderização de vetores com suporte a interatividade
- **Pdf**: Visualização de PDFs com navegação entre páginas
- **Excel**: Planilhas com suporte a múltiplas abas e busca
- **Csv**: Dados tabulares com ordenação e filtros
- **Text**: Arquivos de texto com syntax highlighting
- **Unknown**: Fallback para tipos não suportados

#### 3. Componentes Compartilhados

##### ViewerShell
```typescript
interface ViewerShellProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}
```
- Container padrão com estados de loading/error
- Layout responsivo
- Tratamento de acessibilidade

##### Toolbar
```typescript
interface ToolbarProps {
  title?: string;
  actions?: ToolbarAction[];
  className?: string;
}
```
- Barra de ferramentas reutilizável
- Sistema de ações plugável
- Suporte a ícones e tooltips

### Padrões de Design Implementados

#### 1. Factory Pattern
```typescript
export const resolveViewerByMimeOrExt = (
  mimeType?: string,
  fileName?: string
): ViewerType => {
  // Lógica de resolução baseada em MIME type e extensão
};
```

#### 2. Strategy Pattern
Cada viewer implementa uma estratégia específica de renderização:
```typescript
interface ViewerProps {
  src: string;
  fileName?: string;
  width?: string | number;
  height?: string | number;
  // ... outras props
}
```

#### 3. Observer Pattern
Eventos de carregamento e erro são propagados através de callbacks:
```typescript
onLoad?: (metadata?: any) => void;
onError?: (error: Error) => void;
```

#### 4. Adapter Pattern
Utilitários para conversão entre diferentes formatos de entrada:
```typescript
export const toObjectURL = (file: File): string;
export const toObjectURLFromBlob = (blob: Blob, mimeType?: string): string;
export const toObjectURLFromBuffer = (buffer: ArrayBuffer, mimeType: string): string;
```

### Gerenciamento de Estado

#### Estados Locais
Cada viewer gerencia seu próprio estado interno:
- Loading states
- Error handling
- Configurações específicas (zoom, página atual, etc.)

#### Props Drilling vs Context
- **Props**: Usado para configurações simples e callbacks
- **Context**: Evitado para manter componentes desacoplados

### Performance e Otimizações

#### 1. Lazy Loading
```typescript
const JpegViewer = lazy(() => import('./docs/Jpeg'));
const PngViewer = lazy(() => import('./docs/Png'));
// ... outros viewers
```

#### 2. Memoização
Componentes críticos usam `React.memo` e `useMemo`:
```typescript
export const VisualizarDocumento = memo<VisualizarDocumentoProps>(({ ... }) => {
  const ViewerComponent = useMemo(() => {
    return resolveViewerComponent(viewerType);
  }, [viewerType]);
  // ...
});
```

#### 3. Debouncing
Operações custosas como busca são debounced:
```typescript
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    // Lógica de busca
  }, 300),
  []
);
```

#### 4. Virtual Scrolling
Para grandes datasets (CSV, Excel):
```typescript
// Implementação de virtual scrolling para tabelas grandes
const visibleRows = useMemo(() => {
  const start = Math.floor(scrollTop / rowHeight);
  const end = Math.min(start + visibleCount, data.length);
  return data.slice(start, end);
}, [scrollTop, data, rowHeight, visibleCount]);
```

### Tratamento de Erros

#### Hierarquia de Error Boundaries
```typescript
// ViewerShell inclui error boundary interno
<ErrorBoundary fallback={<ErrorState />}>
  <ViewerComponent {...props} />
</ErrorBoundary>
```

#### Tipos de Erro
1. **Network Errors**: Falha no carregamento do arquivo
2. **Parse Errors**: Arquivo corrompido ou formato inválido
3. **Memory Errors**: Arquivo muito grande para processar
4. **Security Errors**: Tipo de arquivo bloqueado por segurança

### Acessibilidade (a11y)

#### ARIA Labels
```typescript
<div
  role="img"
  aria-label={`Visualizando ${fileName || 'documento'}`}
  aria-describedby="viewer-description"
>
```

#### Navegação por Teclado
- Tab navigation
- Atalhos específicos por viewer
- Focus management

#### Screen Reader Support
- Descrições semânticas
- Live regions para mudanças de estado
- Alternative text para conteúdo visual

### Extensibilidade

#### Adicionando Novos Viewers

1. **Criar o componente viewer**:
```typescript
// src/components/VisualizarDocumentos/docs/NovoViewer.tsx
export const NovoViewer: React.FC<ViewerProps> = ({ src, ...props }) => {
  return (
    <ViewerShell>
      {/* Implementação específica */}
    </ViewerShell>
  );
};
```

2. **Registrar no sistema**:
```typescript
// src/components/VisualizarDocumentos/utils/resolveViewer.ts
export const resolveViewerByMimeOrExt = (mimeType?: string, fileName?: string): ViewerType => {
  // Adicionar lógica para novo tipo
  if (mimeType === 'application/novo-tipo') return 'novo';
  // ...
};
```

3. **Adicionar lazy loading**:
```typescript
// src/components/VisualizarDocumentos/VisualizarDocumento.tsx
const NovoViewer = lazy(() => import('./docs/NovoViewer'));
```

#### Hooks Customizados

##### useFileLoader
```typescript
const useFileLoader = (src: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Implementação de carregamento
  
  return { data, loading, error, retry };
};
```

##### useViewerState
```typescript
const useViewerState = <T>(initialState: T) => {
  // Estado compartilhado entre viewers
  // Persistência local se necessário
  // Sincronização entre instâncias
};
```

### Testes

#### Estrutura de Testes
```
__tests__/
├── VisualizarDocumento.test.tsx    # Testes do componente principal
├── viewers/                        # Testes específicos por viewer
│   ├── Jpeg.test.tsx
│   ├── Pdf.test.tsx
│   └── ...
├── utils/                          # Testes de utilitários
│   ├── detectMime.test.ts
│   └── resolveViewer.test.ts
└── integration/                    # Testes de integração
    └── fullWorkflow.test.tsx
```

#### Mocks e Fixtures
```typescript
// __tests__/fixtures/
export const mockPdfFile = new File(['mock pdf'], 'test.pdf', {
  type: 'application/pdf'
});

export const mockImageFile = new File(['mock image'], 'test.jpg', {
  type: 'image/jpeg'
});
```

### Monitoramento e Debugging

#### Logs Estruturados
```typescript
const logger = {
  info: (message: string, metadata?: any) => {
    console.log(`[VisualizarDocumentos] ${message}`, metadata);
  },
  error: (message: string, error?: Error) => {
    console.error(`[VisualizarDocumentos] ${message}`, error);
  }
};
```

#### Performance Metrics
```typescript
const usePerformanceMetrics = () => {
  const trackLoadTime = (viewerType: ViewerType, duration: number) => {
    // Enviar métricas para analytics
  };
  
  const trackError = (viewerType: ViewerType, error: Error) => {
    // Tracking de erros
  };
};
```

### Considerações de Segurança

#### Sanitização de Entrada
- Validação de MIME types
- Verificação de extensões de arquivo
- Limite de tamanho de arquivo

#### Content Security Policy
```typescript
// Configurações CSP recomendadas
const cspDirectives = {
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: blob:",
  'object-src': "'none'",
};
```

#### Isolamento de Conteúdo
- Sandboxing para conteúdo não confiável
- Validação de URLs externas
- Prevenção de XSS em conteúdo dinâmico

### Roadmap Técnico

#### Próximas Funcionalidades
1. **Viewer para vídeos** (MP4, WebM)
2. **Viewer para áudio** (MP3, WAV)
3. **Viewer para arquivos compactados** (ZIP, RAR)
4. **Viewer para código** com syntax highlighting
5. **Viewer para markdown** com renderização

#### Melhorias de Performance
1. **Service Worker** para cache de arquivos
2. **Web Workers** para processamento pesado
3. **Streaming** para arquivos grandes
4. **Progressive loading** para PDFs e planilhas

#### Acessibilidade Avançada
1. **Modo alto contraste**
2. **Suporte a leitores de tela avançado**
3. **Navegação por voz**
4. **Zoom semântico** para usuários com baixa visão