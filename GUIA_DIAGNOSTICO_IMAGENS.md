# Guia de Diagnóstico - Problema de Reconhecimento de Imagens

## Objetivo
Identificar por que as imagens não estão sendo reconhecidas quando clicadas no menu lateral.

## Passos para Diagnóstico

### 1. Abrir o Console do Navegador
- Pressione **F12** para abrir as ferramentas de desenvolvedor
- Vá para a aba **Console**
- Mantenha o console aberto durante todo o teste

### 2. Verificar se há Dados no Menu
- Ao carregar a página, você deve ver logs como:
  ```
  🔍 [MENU DEBUG] Dados do menu para aba fisica : [...]
  🔍 [MENU DEBUG] Imagens encontradas nos dados: [...]
  ```
- **Se não aparecer nenhum log**: O problema é que não há dados salvos no localStorage
- **Se aparecer mas sem imagens**: O problema é que as imagens não foram salvas corretamente

### 3. Testar Upload de Nova Imagem (se necessário)
- Se não há imagens nos dados, faça upload de uma nova imagem:
  1. Clique no ícone de configurações (⚙️) no menu lateral
  2. Crie uma nova categoria ou use uma existente
  3. Faça upload de uma imagem JPEG ou PNG
  4. Verifique se aparecem logs de diagnóstico durante o upload

### 4. Testar Clique nas Imagens
- Clique em qualquer item do menu lateral (especialmente imagens)
- Você deve ver logs como:
  ```
  🔍 [MENU COLLAPSED DEBUG] Item clicado: {...}
  🔍 [MENU COLLAPSED DEBUG] Item sem filhos - chamando onSectionChange
  🔍 [DIAGNÓSTICO] Item clicado: {...}
  ```

### 5. Analisar os Logs

#### Cenário A: Nenhum log aparece ao clicar
- **Problema**: O evento de clique não está sendo capturado
- **Causa provável**: Problema na estrutura do menu ou dados vazios

#### Cenário B: Logs do menu aparecem, mas não os de diagnóstico
- **Problema**: O item não está sendo passado para `handleDocumentSelect`
- **Causa provável**: Problema na função `onSectionChange`

#### Cenário C: Todos os logs aparecem, mas imagem não carrega
- **Problema**: Erro no carregamento dos metadados do IndexedDB
- **Causa provável**: `storageKey` inválido ou dados corrompidos no IndexedDB

#### Cenário D: Logs mostram `hasChildren: true` para arquivos
- **Problema**: Arquivos sendo tratados como se tivessem filhos
- **Causa provável**: Estrutura de dados incorreta

### 6. Informações Importantes nos Logs

Para cada item clicado, verifique:
- **id**: Identificador único do item
- **label**: Nome do arquivo
- **type**: Deve ser 'arquivo' para imagens
- **hasChildren**: Deve ser `false` para arquivos
- **storageKey**: Deve existir para imagens salvas no IndexedDB
- **imageType**: Tipo MIME da imagem

### 7. Próximos Passos Baseados no Diagnóstico

**Se o problema for dados vazios:**
- Fazer upload de novas imagens
- Verificar se o localStorage está funcionando

**Se o problema for estrutura incorreta:**
- Corrigir a lógica de `hasChildren`
- Ajustar a passagem de dados entre componentes

**Se o problema for IndexedDB:**
- Verificar se as imagens foram salvas corretamente
- Implementar fallbacks para `dataUrl`

**Se o problema for eventos:**
- Corrigir a captura de eventos de clique
- Ajustar a função `onSectionChange`

## Como Reportar o Problema

Quando reportar o problema, inclua:
1. **Todos os logs** que aparecem no console
2. **Qual cenário** (A, B, C ou D) melhor descreve o que você observa
3. **Screenshots** da tela e do console
4. **Passos exatos** que você seguiu

Com essas informações, poderemos identificar e corrigir o problema específico.