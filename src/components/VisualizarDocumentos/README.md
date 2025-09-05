# VisualizarDocumentos

Sistema modular e extensível para visualização de documentos com suporte a múltiplos formatos.

## Características

- **Detecção automática de tipo**: Identifica automaticamente o tipo de arquivo baseado no MIME type e extensão
- **Viewers especializados**: Cada tipo de arquivo tem seu próprio viewer otimizado
- **Lazy loading**: Componentes são carregados sob demanda para melhor performance
- **Extensível**: Fácil adição de novos tipos de arquivo
- **Responsivo**: Interface adaptável a diferentes tamanhos de tela
- **Acessível**: Suporte a navegação por teclado e leitores de tela

## Formatos Suportados

### Imagens
- **JPEG/JPG**: Viewer com zoom, pan, rotação
- **PNG**: Viewer com suporte a transparência
- **SVG**: Renderização inline com fallback

### Documentos
- **PDF**: Visualização com paginação, zoom, busca de texto
- **Excel (XLSX/XLS)**: Visualização de planilhas com múltiplas abas
- **CSV**: Tabela com busca, ordenação e configuração de delimitadores
- **Texto (TXT)**: Viewer com detecção de encoding e numeração de linhas

### Outros
- **Arquivos desconhecidos**: Viewer genérico com informações do arquivo e sugestões

## Uso Básico

```tsx
import VisualizarDocumento from './components/VisualizarDocumentos';

// Usando com URL
<VisualizarDocumento
  src="https://example.com/documento.pdf"
  fileName="documento.pdf"
  width="100%"
  height="600px"
  allowDownload={true}
/>

// Usando com File object
<VisualizarDocumento
  src={fileObject}
  width="100%"
  height="600px"
  onLoad={() => console.log('Carregado!')}
  onError={(error) => console.error('Erro:', error)}
/>

// Usando com ArrayBuffer
<VisualizarDocumento
  src={arrayBuffer}
  fileName="documento.xlsx"
  mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
/>
```

## Props Principais

| Prop | Tipo | Descrição |
|------|------|-----------|
| `src` | `string \| File \| ArrayBuffer` | Fonte do documento |
| `fileName` | `string` | Nome do arquivo (usado para detecção de tipo) |
| `mimeType` | `string` | Tipo MIME (opcional, será detectado automaticamente) |
| `width` | `number \| string` | Largura do viewer |
| `height` | `number \| string` | Altura do viewer |
| `fit` | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | Como ajustar o conteúdo |
| `allowDownload` | `boolean` | Se permite download |
| `onLoad` | `() => void` | Callback quando carrega |
| `onError` | `(error: unknown) => void` | Callback de erro |
| `forceViewer` | `ViewerType` | Forçar um viewer específico |

## Configurações Específicas

### PDF
```tsx
<VisualizarDocumento
  src="documento.pdf"
  viewerConfig={{
    initialPage: 2, // Página inicial
  }}
/>
```

### Excel
```tsx
<VisualizarDocumento
  src="planilha.xlsx"
  viewerConfig={{
    initialSheet: "Dados", // Aba inicial
  }}
/>
```

### CSV
```tsx
<VisualizarDocumento
  src="dados.csv"
  viewerConfig={{
    delimiter: ";", // Delimitador personalizado
    hasHeader: true, // Se tem cabeçalho
  }}
/>
```

### Imagens
```tsx
<VisualizarDocumento
  src="imagem.jpg"
  viewerConfig={{
    initialZoom: 150, // Zoom inicial em %
  }}
/>
```

## Viewers Individuais

Você também pode usar os viewers específicos diretamente:

```tsx
import { PdfViewer, ExcelViewer, JpegViewer } from './components/VisualizarDocumentos';

<PdfViewer
  src="documento.pdf"
  fileName="documento.pdf"
  onLoad={() => console.log('PDF carregado')}
/>
```

## Utilitários

### Detecção de Tipo MIME
```tsx
import { detectMime, detectMimeSync } from './components/VisualizarDocumentos';

// Assíncrono (recomendado)
const mimeType = await detectMime(file, 'documento.pdf');

// Síncrono (apenas para extensões)
const mimeType = detectMimeSync(null, 'documento.pdf');
```

### Resolução de Viewer
```tsx
import { resolveViewerByMimeOrExt } from './components/VisualizarDocumentos';

const viewerType = resolveViewerByMimeOrExt('application/pdf', 'documento.pdf');
// Retorna: 'Pdf'
```

### Gerenciamento de URLs de Objeto
```tsx
import { sourceToURL, revokeObjectURL } from './components/VisualizarDocumentos';

// Criar URL
const url = sourceToURL(file);

// Limpar URL
revokeObjectURL(url);
```

## Estrutura do Projeto

```
VisualizarDocumentos/
├── index.ts                 # Exports principais
├── VisualizarDocumento.tsx  # Componente orquestrador
├── types.ts                 # Definições de tipos
├── adapters/               # Utilitários
│   ├── mimeMap.ts          # Mapeamento de tipos
│   ├── detectMime.ts       # Detecção de MIME
│   └── toObjectURL.ts      # Gerenciamento de URLs
├── common/                 # Componentes comuns
│   ├── ViewerShell.tsx     # Layout base
│   ├── Toolbar.tsx         # Barra de ferramentas
│   ├── LoadingState.tsx    # Estado de carregamento
│   └── ErrorState.tsx      # Estado de erro
├── images/                 # Viewers de imagem
│   ├── Jpeg.tsx
│   ├── Png.tsx
│   └── Svg.tsx
└── docs/                   # Viewers de documento
    ├── Pdf.tsx
    ├── Excel.tsx
    ├── Csv.tsx
    ├── Text.tsx
    └── Unknown.tsx
```

## Extensibilidade

Para adicionar suporte a um novo tipo de arquivo:

1. **Criar o viewer**: Implemente um componente que aceite `ViewerProps`
2. **Atualizar mapeamentos**: Adicione o tipo em `mimeMap.ts`
3. **Registrar o viewer**: Adicione no `VIEWER_COMPONENTS` em `VisualizarDocumento.tsx`
4. **Exportar**: Adicione no `index.ts`

Exemplo:
```tsx
// docs/Word.tsx
const WordViewer: React.FC<ViewerProps> = ({ src, fileName, ...props }) => {
  // Implementação do viewer
  return <ViewerShell>...</ViewerShell>;
};

// mimeMap.ts
const MIME_TO_VIEWER: Record<string, ViewerType> = {
  // ...
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
};

// VisualizarDocumento.tsx
const VIEWER_COMPONENTS = {
  // ...
  Word: React.lazy(() => import('./docs/Word')),
};
```

## Performance

- **Lazy loading**: Viewers são carregados apenas quando necessários
- **Memoização**: Componentes usam React.memo e useMemo
- **Cleanup automático**: URLs de objeto são limpas automaticamente
- **Debounce**: Operações de busca e zoom são debounced

## Acessibilidade

- **Navegação por teclado**: Suporte completo a atalhos
- **ARIA labels**: Elementos têm labels apropriados
- **Contraste**: Cores seguem diretrizes WCAG
- **Leitores de tela**: Estrutura semântica adequada

## Troubleshooting

### Arquivo não carrega
1. Verifique se o arquivo existe e é acessível
2. Confirme se o tipo MIME está correto
3. Verifique o console para erros de CORS

### Viewer incorreto
1. Force um viewer específico com `forceViewer`
2. Verifique se o mapeamento em `mimeMap.ts` está correto
3. Confirme a extensão do arquivo

### Performance lenta
1. Verifique o tamanho do arquivo (limite de 50MB)
2. Use lazy loading para múltiplos viewers
3. Considere implementar paginação para arquivos grandes