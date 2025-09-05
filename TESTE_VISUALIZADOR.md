# 🧪 Guia de Teste - Sistema de Visualização de Documentos

## Como Testar o Sistema

### Opção 1: Teste Rápido (Recomendado)

1. **Substitua temporariamente o App.tsx:**
   ```tsx
   import React from 'react'
   import TesteVisualizador from './pages/TesteVisualizador'

   function App() {
     return <TesteVisualizador />
   }

   export default App
   ```

2. **Execute o projeto:**
   ```bash
   npm run dev
   ```

3. **Acesse:** `http://localhost:5173`

### Opção 2: Integração no Layout Existente

1. **Adicione ao App.tsx existente:**
   ```tsx
   import { ExemploUso } from './components/VisualizarDocumentos'
   
   // Adicione onde desejar testar:
   <ExemploUso />
   ```

## 📋 Checklist de Testes

### ✅ Upload de Arquivos
- [ ] **PDF:** Teste com documentos PDF (navegação, zoom, busca)
- [ ] **Excel:** Teste com planilhas (.xlsx/.xls) - múltiplas abas
- [ ] **CSV:** Teste com dados tabulares - ordenação e busca
- [ ] **Imagens:** Teste JPG, PNG, SVG, GIF - zoom e rotação
- [ ] **Texto:** Teste arquivos .txt - numeração de linhas, busca
- [ ] **JSON/XML:** Teste arquivos estruturados
- [ ] **Arquivos grandes:** Teste performance com arquivos > 10MB
- [ ] **Arquivos corrompidos:** Teste tratamento de erro

### ✅ URLs de Documentos
- [ ] **URLs públicas:** Teste com documentos online
- [ ] **Data URLs:** Teste com dados inline (exemplos fornecidos)
- [ ] **URLs inválidas:** Teste tratamento de erro
- [ ] **CORS:** Teste com URLs que podem ter problemas de CORS

### ✅ Funcionalidades dos Viewers
- [ ] **Zoom:** In/Out, ajuste automático, zoom específico
- [ ] **Navegação:** Páginas (PDF), abas (Excel), resultados de busca
- [ ] **Busca:** Texto em PDF, Excel, CSV, arquivos de texto
- [ ] **Rotação:** Imagens e documentos
- [ ] **Download:** Todos os tipos de arquivo
- [ ] **Responsividade:** Teste em diferentes tamanhos de tela
- [ ] **Acessibilidade:** Navegação por teclado, leitores de tela

### ✅ Estados e Tratamento de Erro
- [ ] **Loading:** Indicadores de carregamento
- [ ] **Erro:** Mensagens de erro claras
- [ ] **Retry:** Funcionalidade de tentar novamente
- [ ] **Fallback:** Viewer genérico para tipos não suportados

## 🎯 Cenários de Teste Específicos

### 1. Performance
```javascript
// Teste com arquivo grande
const arquivoGrande = new File([new ArrayBuffer(50 * 1024 * 1024)], 'teste.pdf', {
  type: 'application/pdf'
});
```

### 2. Múltiplos Formatos
- Teste sequencial de diferentes tipos
- Verificar limpeza de memória entre trocas

### 3. Integração
- Teste dentro de modais
- Teste com diferentes props
- Teste de eventos (onLoad, onError)

## 🐛 Problemas Conhecidos e Soluções

### PDF.js não carrega
- **Causa:** CDN indisponível
- **Solução:** Verificar conexão ou usar CDN alternativo

### Excel com muitas abas
- **Causa:** Performance em planilhas complexas
- **Solução:** Implementar paginação de abas

### CORS em URLs externas
- **Causa:** Política de CORS do servidor
- **Solução:** Usar proxy ou servidor local

## 📊 Métricas de Performance

### Tempos Esperados
- **PDF pequeno (< 1MB):** < 2s
- **Excel médio (< 5MB):** < 3s
- **Imagem (< 2MB):** < 1s
- **Texto (< 1MB):** < 0.5s

### Uso de Memória
- **Lazy loading:** Viewers carregam apenas quando necessário
- **Cleanup:** URLs de objeto são limpas automaticamente
- **Cache:** Bibliotecas externas são cacheadas

## 🔧 Debugging

### Console Logs
```javascript
// Ativar logs detalhados
localStorage.setItem('debug-visualizador', 'true');

// Ver logs de performance
console.time('load-document');
// ... carregar documento
console.timeEnd('load-document');
```

### Network Tab
- Verificar carregamento de bibliotecas externas
- Monitorar tamanho de arquivos transferidos
- Verificar cache de recursos

## 📝 Relatório de Teste

Após os testes, documente:

1. **Formatos testados:** Lista dos tipos de arquivo
2. **Funcionalidades verificadas:** Zoom, busca, navegação, etc.
3. **Performance:** Tempos de carregamento observados
4. **Problemas encontrados:** Bugs ou limitações
5. **Sugestões:** Melhorias ou novos recursos

## 🚀 Próximos Passos

Após validação:
1. Integrar no sistema principal
2. Adicionar testes automatizados
3. Otimizar performance
4. Expandir formatos suportados
5. Melhorar acessibilidade