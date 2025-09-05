# PDR - Produto de Requisitos Detalhados
# Fiscal Pro

## 🎯 Objetivo do Projeto

O Fiscal Pro é uma solução completa para gestão fiscal e tributária, desenvolvida para automatizar e simplificar processos complexos de análise tributária, gestão de clientes e configuração de parâmetros fiscais.

### Objetivos Específicos
- Centralizar informações fiscais e tributárias
- Automatizar cálculos e análises tributárias
- Facilitar a gestão de clientes e leads
- Proporcionar visualização clara de documentos fiscais
- Otimizar fluxos de trabalho através de sistema Kanban

## 🏗️ Módulos e Features

### 1. Módulo de Gestão de Clientes
**Localização:** `src/components/ClientsContainer.tsx`, `src/components/ClientCard.tsx`

**Funcionalidades:**
- Cadastro e edição de clientes
- Visualização em cards com informações resumidas
- Sistema de paginação
- Filtros de busca
- Histórico de interações
- Gestão de leads

**Dados Gerenciados:**
- Informações pessoais/empresariais
- Dados de contato
- Status do cliente
- Histórico de atividades

### 2. Banco de Dados Fiscal
**Localização:** `src/components/BancoDeDados.tsx` e componentes BD-*

**Sub-módulos:**

#### 2.1 Tributação por Segmento
- **Arquivo:** `BD-SegmentoTributacao.tsx`
- **Função:** Configuração de alíquotas por segmento de negócio
- **Dados:** Segmentos, alíquotas, regras específicas

#### 2.2 Simples Nacional
- **Arquivo:** `BD-SimplesNacionalSegmentos.tsx`
- **Função:** Gestão de anexos e alíquotas do Simples Nacional
- **Dados:** Anexos, faixas de faturamento, alíquotas

#### 2.3 Lucro Real
- **Arquivo:** `BD-LucroReal.tsx`
- **Função:** Configurações para regime de Lucro Real
- **Dados:** Alíquotas, deduções, ajustes

#### 2.4 Tributação da Folha
- **Arquivo:** `BD-TributacaoFolha.tsx`
- **Função:** Gestão de encargos trabalhistas
- **Dados:** Percentuais, descrições, categorias

#### 2.5 Estados e ICMS
- **Arquivo:** `BD-EstadosICMS.tsx`
- **Função:** Configuração de ICMS por estado
- **Dados:** Estados, alíquotas internas/interestaduais

### 3. Análise de Dados
**Localização:** `src/components/AnaliseDeDados/`

**Funcionalidades:**
- Cruzamento de dados fiscais
- Análises comparativas
- Relatórios automatizados
- Simulações tributárias

### 4. Visualização de Documentos
**Localização:** `src/components/VisualizarDocumentos/`

**Suporte a Formatos:**
- PDF (via pdf.js)
- Documentos Word (via mammoth)
- Imagens (JPG, PNG, SVG)
- Arquivos de texto

**Funcionalidades:**
- Visualização inline
- Zoom e navegação
- Download de arquivos
- Fallback para formatos não suportados

### 5. Sistema Kanban
**Localização:** `src/components/Kanban/`

**Funcionalidades:**
- Gestão de tarefas e processos
- Drag and drop entre colunas
- Status personalizáveis
- Acompanhamento de progresso

### 6. Formulários e Upload
**Localização:** `src/components/FiscalProFormularios.tsx`

**Funcionalidades:**
- Upload de múltiplos arquivos
- Processamento automático
- Validação de formatos
- Histórico de uploads

## 📋 Regras de Negócio

### RN001 - Persistência de Dados
- Todos os dados devem ser persistidos no localStorage
- Backup automático a cada alteração
- Recuperação de dados em caso de falha

### RN002 - Validação de Alíquotas
- Alíquotas devem estar entre 0% e 100%
- Validação em tempo real durante entrada
- Formatação automática de percentuais

### RN003 - Gestão de Estados
- Controle de estado "sujo" (isDirty) para detectar alterações
- Confirmação antes de descartar alterações
- Salvamento automático opcional

### RN004 - Segurança de Dados
- Validação de entrada em todos os formulários
- Sanitização de dados antes do armazenamento
- Controle de acesso por funcionalidade

### RN005 - Responsividade
- Interface adaptável para desktop e mobile
- Componentes responsivos usando Tailwind CSS
- Otimização para diferentes resoluções

## 🔌 APIs e Integrações

### APIs Internas

#### Context APIs
- **SegmentosContext:** Gestão global de segmentos de tributação
- **EstadosICMSContext:** Estados e configurações de ICMS
- **ImpostoRendaContext:** Configurações de Imposto de Renda

#### Utilitários
- **dbImages:** Gestão de imagens e documentos
- **Formatação:** Funções para formatação de dados fiscais

### Integrações Externas
- **PDF.js:** Renderização de documentos PDF
- **Mammoth:** Conversão de documentos Word
- **Lucide React:** Biblioteca de ícones

## 🗺️ Roadmap

### Fase 1 - Concluída ✅
- [x] Estrutura base da aplicação
- [x] Módulos de banco de dados fiscal
- [x] Sistema de gestão de clientes
- [x] Visualizador de documentos

### Fase 2 - Em Desenvolvimento 🚧
- [ ] Melhorias no sistema de análise
- [ ] Otimizações de performance
- [ ] Testes automatizados
- [ ] Documentação técnica

### Fase 3 - Planejado 📋
- [ ] Integração com APIs externas
- [ ] Sistema de relatórios avançados
- [ ] Módulo de auditoria
- [ ] Dashboard executivo

### Fase 4 - Futuro 🔮
- [ ] Aplicativo mobile
- [ ] Inteligência artificial para análises
- [ ] Integração com ERPs
- [ ] API pública

## 🧪 Estratégia de Testes

### Testes Unitários
- Componentes React isolados
- Funções utilitárias
- Contextos e hooks customizados

### Testes de Integração
- Fluxos completos de usuário
- Integração entre módulos
- Persistência de dados

### Testes E2E
- Jornadas críticas do usuário
- Compatibilidade entre navegadores
- Performance e responsividade

## 📊 Métricas e KPIs

### Técnicas
- Tempo de carregamento < 3s
- Bundle size otimizado
- Cobertura de testes > 80%
- Zero erros de console

### Negócio
- Taxa de adoção por módulo
- Tempo médio de conclusão de tarefas
- Satisfação do usuário
- Redução de erros manuais