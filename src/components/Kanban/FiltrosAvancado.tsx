import React, { useState, useEffect, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

/*
--------------------------------------------------------
  Componente: Filtros Avançados - Responsabilidade Isolada
--------------------------------------------------------
- Contém toda a lógica e UI dos filtros avançados
- Dropdowns de Produtos e Etapas com estrutura idêntica
- Lógica de contagem de clientes por filtro
- Botão de toggle para exibir/ocultar filtros
- Interface de props para comunicação com componente pai
- NOVO: Barra de busca avançada de clientes à esquerda
- NOVO: Botão "+ Nova Coluna" à direita dos filtros
- NOVO: Funcionalidade de navegação direta para cliente
*/

interface Client {
  id: number
  name: string
  photo: string
  whatsapp: string
  estado: string
  formularios: number
  livroCaixa: number
  isCustomLead: boolean
  createdAt?: string
}

interface FiltrosAvancadoProps {
  showAdvancedFilters: boolean
  selectedProduto: string
  selectedEtapa: string
  selectedFase: string
  filteredClients: Client[]
  onToggleAdvancedFilters: () => void
  onSelectedProdutoChange: (value: string) => void
  onSelectedEtapaChange: (value: string) => void
  onSelectedFaseChange: (value: string) => void
  onNovaEtapaClick: () => void
}

export const FiltrosAvancado: React.FC<FiltrosAvancadoProps> = ({
  showAdvancedFilters,
  selectedProduto,
  selectedEtapa,
  selectedFase,
  filteredClients,
  onToggleAdvancedFilters,
  onSelectedProdutoChange,
  onSelectedEtapaChange,
  onSelectedFaseChange,
  onNovaEtapaClick
}) => {

  // Estados para filtros de busca
  const [searchProduto, setSearchProduto] = useState('')
  const [searchEtapa, setSearchEtapa] = useState('')
  
  // Estados para busca avançada de clientes
  const [clientSearch, setClientSearch] = useState('')
  const [showClientResults, setShowClientResults] = useState(false)
  const [filteredClientResults, setFilteredClientResults] = useState<Client[]>([])
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false)
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false)

  const clientSearchRef = useRef<HTMLInputElement>(null)
  const produtoDropdownRef = useRef<HTMLDivElement>(null)
  const etapaDropdownRef = useRef<HTMLDivElement>(null)
  const clientResultsRef = useRef<HTMLDivElement>(null)

  
    // Função para capitalizar primeira letra
  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    setClientSearch(capitalizedValue);
  };

  // Função para capitalizar primeira letra - Etapas
  const handleEtapaSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    setSearchEtapa(capitalizedValue);
  };

  const handleProdutoSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    setSearchProduto(capitalizedValue);
  };


  // Refs para inputs de pesquisa dos dropdowns
  const searchProdutoRef = useRef<HTMLInputElement>(null)
  const searchEtapaRef = useRef<HTMLInputElement>(null)

  /*
  --------------------------------------------------------
    Lista Expandida de Produtos para Testes de Rolagem
  --------------------------------------------------------
  */
  const produtosDisponiveis = [
    { value: 'declaracao-ir', label: 'Declaração de Imposto de Renda' },
    { value: 'contabilidade', label: 'Contabilidade Empresarial' },
    { value: 'consultoria', label: 'Consultoria Fiscal e Tributária' },
    { value: 'auditoria', label: 'Auditoria Contábil' },
    { value: 'planejamento-tributario', label: 'Planejamento Tributário Estratégico para Empresas de Médio e Grande Porte' },
    { value: 'folha-pagamento', label: 'Gestão de Folha de Pagamento' },
    { value: 'fiscal', label: 'Assessoria Fiscal' },
    { value: 'societario', label: 'Direito Societário' },
    { value: 'trabalhista', label: 'Consultoria Trabalhista' },
    { value: 'previdenciario', label: 'Consultoria Previdenciária' }
  ]

  /*
  --------------------------------------------------------
    Lista Expandida de Etapas para Testes de Rolagem
  --------------------------------------------------------
  */
  const etapasDisponiveis = [
    { value: 'todas', label: 'Todas as Etapas' },
    { value: 'contato', label: 'Contato Inicial' },
    { value: 'agendamento', label: 'Agendamento' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechamento', label: 'Fechamento' },
    { value: 'contrato', label: 'Assinatura de Contrato' },
    { value: 'apresentacao-tecnica', label: 'Contato Inicial com Cliente para Apresentação de Proposta Técnica e Comercial' },
    { value: 'analise-credito', label: 'Análise de Crédito' },
    { value: 'aprovacao-interna', label: 'Aprovação Interna' },
    { value: 'documentacao', label: 'Coleta de Documentação' }
  ]

  // Filtrar produtos e etapas baseado na busca
  const produtosFiltrados = produtosDisponiveis.filter(produto =>
    produto.label.toLowerCase().includes(searchProduto.toLowerCase())
  )

  const etapasFiltradas = etapasDisponiveis.filter(etapa =>
    etapa.label.toLowerCase().includes(searchEtapa.toLowerCase())
  )

  /*
  --------------------------------------------------------
    Lógica de Busca Avançada de Clientes
  --------------------------------------------------------
  */
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setFilteredClientResults([])
      setShowClientResults(false)
      return
    }

    const results = filteredClients.filter(client => 
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.whatsapp.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.estado.toLowerCase().includes(clientSearch.toLowerCase())
    ).slice(0, 10) // Aumentar para 10 resultados para testar scroll

    setFilteredClientResults(results)
    setShowClientResults(results.length > 0)
  }, [clientSearch, filteredClients])

  // Função para determinar produto/etapa/fase do cliente baseado nos dados
  const getClientInfo = (client: Client) => {
    let produto = 'Não definido'
    let etapa = 'Contato Inicial'
    let fase = 'Inicial'

    // Expandir lógica para criar mais variedade nos dados de teste
    const randomVariation = client.id % 3;

    // Lógica para determinar produto
    if (client.formularios > 0 && client.livroCaixa > 0) {
      produto = randomVariation === 0 ? 'Consultoria Fiscal e Tributária' : 
                randomVariation === 1 ? 'Planejamento Tributário Estratégico' : 'Auditoria Contábil'
    } else if (client.formularios > 0) {
      produto = randomVariation === 0 ? 'Declaração de Imposto de Renda' : 
                randomVariation === 1 ? 'Gestão de Folha de Pagamento' : 'Assessoria Fiscal'
    } else if (client.livroCaixa > 0) {
      produto = randomVariation === 0 ? 'Contabilidade Empresarial' : 
                randomVariation === 1 ? 'Direito Societário' : 'Consultoria Trabalhista'
    } else {
      produto = 'Consultoria Previdenciária'
    }

    // Lógica para determinar etapa
    if (client.formularios >= 10 && client.livroCaixa >= 7) {
      etapa = 'Assinatura de Contrato'
    } else if (client.formularios >= 8 && client.livroCaixa >= 5) {
      etapa = 'Fechamento'
    } else if (client.formularios >= 5 || client.livroCaixa >= 3) {
      etapa = randomVariation === 0 ? 'Proposta' : 
              randomVariation === 1 ? 'Apresentação Técnica' : 'Negociação'
    } else if (client.formularios >= 2 && client.livroCaixa >= 1) {
      etapa = randomVariation === 0 ? 'Reunião' : 
              randomVariation === 1 ? 'Análise de Crédito' : 'Aprovação Interna'
    } else if (client.formularios > 0 || client.livroCaixa > 0) {
      etapa = randomVariation === 0 ? 'Agendamento' : 'Coleta de Documentação'
    }

    // Lógica para determinar fase
    if (client.formularios <= 2) {
      fase = randomVariation === 0 ? 'Inicial' : 'Qualificação'
    } else if (client.formularios <= 5) {
      fase = randomVariation === 0 ? 'Desenvolvimento' : 'Análise'
    } else if (client.livroCaixa >= 4) {
      fase = randomVariation === 0 ? 'Entregue' : 'Concluído'
    } else {
      fase = randomVariation === 0 ? 'Finalização' : 'Implementação'
    }

    return { produto, etapa, fase }
  }

  // Função para selecionar cliente
  const handleClientSelect = (client: Client) => {
    const clientInfo = getClientInfo(client)
    
    // Efeito visual de feedback
    console.log(`🎯 Cliente selecionado: ${client.name}`)
    console.log(`📍 Navegando para: ${clientInfo.produto} → ${clientInfo.etapa} → ${clientInfo.fase}`)
    
    // Atualizar filtros baseado no cliente selecionado
    if (clientInfo.produto === 'Declaração IR') {
      onSelectedProdutoChange('declaracao-ir')
    } else if (clientInfo.produto === 'Contabilidade') {
      onSelectedProdutoChange('contabilidade')
    } else if (clientInfo.produto === 'Consultoria Fiscal') {
      onSelectedProdutoChange('consultoria')
    }

    // Atualizar etapa
    const etapaValue = etapasDisponiveis.find(e => e.label === clientInfo.etapa)?.value || 'contato'
    onSelectedEtapaChange(etapaValue)

    // Limpar busca e fechar resultados
    setClientSearch('')
    setShowClientResults(false)

    // Feedback visual para o usuário
    if (clientSearchRef.current) {
      clientSearchRef.current.placeholder = `Navegando para ${client.name}...`
      setTimeout(() => {
        if (clientSearchRef.current) {
          clientSearchRef.current.placeholder = 'Digite para buscar clientes...'
        }
      }, 2000)
    }
  }

  // Limpar busca quando dropdown fecha
  useEffect(() => {
    if (!showAdvancedFilters) {
      setSearchProduto('')
      setSearchEtapa('')
    }
  }, [showAdvancedFilters])

  // Manter foco nos inputs de pesquisa dos dropdowns
  useEffect(() => {
    const handleFocusSearch = () => {
      // Garantir que o foco permaneça no input durante a digitação
      if (searchProdutoRef.current && document.activeElement === searchProdutoRef.current) {
        setTimeout(() => {
          if (searchProdutoRef.current) {
            searchProdutoRef.current.focus()
          }
        }, 0)
      }
      if (searchEtapaRef.current && document.activeElement === searchEtapaRef.current) {
        setTimeout(() => {
          if (searchEtapaRef.current) {
            searchEtapaRef.current.focus()
          }
        }, 0)
      }
    }

    document.addEventListener('input', handleFocusSearch)
    return () => document.removeEventListener('input', handleFocusSearch)
  }, [])

  // Fechar resultados quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {	 
	 const target = event.target as Element
     // Se clicou fora da área de busca de clientes (usando closest para verificar ancestrais)
     if (clientSearchRef.current && !target.closest('.w-\\[280px\\]')) {
       setShowClientResults(false)
       setClientSearch('')
     }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

 // Fechar dropdown de produtos quando clicar fora
 useEffect(() => {
   const handleClickOutsideDropdown = (event: MouseEvent) => {
     if (
       produtoDropdownRef.current && 
       !produtoDropdownRef.current.contains(event.target as Node)
     ) {
       setShowProdutoDropdown(false)
     }
   }

   document.addEventListener('mousedown', handleClickOutsideDropdown)
   return () => document.removeEventListener('mousedown', handleClickOutsideDropdown)
 }, [])

 // Fechar dropdown de etapas quando clicar fora
 useEffect(() => {
   const handleClickOutsideEtapaDropdown = (event: MouseEvent) => {
     if (
       etapaDropdownRef.current && 
       !etapaDropdownRef.current.contains(event.target as Node)
     ) {
       setShowEtapaDropdown(false)
     }
   }

   document.addEventListener('mousedown', handleClickOutsideEtapaDropdown)
   return () => document.removeEventListener('mousedown', handleClickOutsideEtapaDropdown)
 }, [])

  /*
  --------------------------------------------------------
    Funções para Calcular Contadores dos Dropdowns
  --------------------------------------------------------
  */
  const getClientCountByProduct = (productValue: string): number => {
    if (productValue === 'todos') return filteredClients.length;
    
    return filteredClients.filter(client => {
      if (productValue === 'declaracao-ir') return client.formularios > 0;
      if (productValue === 'contabilidade') return client.livroCaixa > 0;
      if (productValue === 'consultoria') return client.formularios > 0 && client.livroCaixa > 0;
      if (productValue === 'auditoria') return client.formularios >= 8;
      if (productValue === 'planejamento-tributario') return client.formularios >= 10 && client.livroCaixa >= 7;
      if (productValue === 'folha-pagamento') return client.livroCaixa >= 3;
      if (productValue === 'fiscal') return client.formularios >= 3;
      if (productValue === 'societario') return client.formularios >= 6 && client.livroCaixa >= 4;
      if (productValue === 'trabalhista') return client.formularios >= 4;
      if (productValue === 'previdenciario') return client.formularios >= 2 && client.livroCaixa >= 1;
      return false;
    }).length;
  };

  const getClientCountByEtapa = (etapaValue: string): number => {
    if (etapaValue === 'todas') return filteredClients.length;
    
    return filteredClients.filter(client => {
      if (etapaValue === 'contato') return client.formularios === 0 && client.livroCaixa === 0;
      if (etapaValue === 'agendamento') return client.formularios > 0 || client.livroCaixa > 0;
      if (etapaValue === 'reuniao') return client.formularios >= 2 && client.livroCaixa >= 1;
      if (etapaValue === 'proposta') return client.formularios >= 5 || client.livroCaixa >= 3;
      if (etapaValue === 'negociacao') return client.formularios >= 3 && client.livroCaixa >= 2;
      if (etapaValue === 'fechamento') return client.formularios >= 8 && client.livroCaixa >= 5;
      if (etapaValue === 'contrato') return client.formularios >= 10 && client.livroCaixa >= 7;
      if (etapaValue === 'apresentacao-tecnica') return client.formularios >= 1;
      if (etapaValue === 'analise-credito') return client.formularios >= 4 && client.livroCaixa >= 1;
      if (etapaValue === 'aprovacao-interna') return client.formularios >= 6 && client.livroCaixa >= 3;
      if (etapaValue === 'documentacao') return client.formularios >= 2;
      return false;
    }).length;
  };
  
   const getClientCountByEtapaValue = (etapaValue: string): number => {
   if (etapaValue === 'todas') return filteredClients.length;
   
   return filteredClients.filter(client => {
     if (etapaValue === 'contato') return client.formularios === 0 && client.livroCaixa === 0;
     if (etapaValue === 'agendamento') return client.formularios > 0 || client.livroCaixa > 0;
     if (etapaValue === 'reuniao') return client.formularios >= 2 && client.livroCaixa >= 1;
     if (etapaValue === 'proposta') return client.formularios >= 5 || client.livroCaixa >= 3;
     if (etapaValue === 'negociacao') return client.formularios >= 3 && client.livroCaixa >= 2;
     if (etapaValue === 'fechamento') return client.formularios >= 8 && client.livroCaixa >= 5;
     if (etapaValue === 'contrato') return client.formularios >= 10 && client.livroCaixa >= 7;
     if (etapaValue === 'apresentacao-tecnica') return client.formularios >= 1;
     if (etapaValue === 'analise-credito') return client.formularios >= 4 && client.livroCaixa >= 1;
     if (etapaValue === 'aprovacao-interna') return client.formularios >= 6 && client.livroCaixa >= 3;
     if (etapaValue === 'documentacao') return client.formularios >= 2;
     return false;
   }).length;
 };

  // Função auxiliar para garantir que sempre temos um valor válido para contagem
  const getSafeProductCount = (productValue: string): number => {
    try {
      return getClientCountByProduct(productValue) || 0;
    } catch (error) {
      return 0;
    }
  };

  // Funções para obter labels dos itens selecionados
  const getSelectedProdutoLabel = (value: string) => {
    const produto = produtosDisponiveis.find(p => p.value === value);
    return produto ? produto.label : 'Selecione';
  };
  
   // Função para obter o índice do produto selecionado
 const getSelectedProdutoIndex = (value: string) => {
   const index = produtosDisponiveis.findIndex(p => p.value === value);
   return index !== -1 ? index + 1 : 0;
 };

 // Função para obter o índice da etapa selecionada
 const getSelectedEtapaIndex = (value: string) => {
   const index = etapasDisponiveis.findIndex(e => e.value === value);
   return index !== -1 ? index + 1 : 0;
 };

  const getSelectedEtapaLabel = (value: string) => {
    const etapa = etapasDisponiveis.find(e => e.value === value);
    return etapa ? etapa.label : 'Selecione';
  };

  return (
    <>
	  <style>{`
	    {/* Função utilitária para capitalizar primeira letra */}
  {(() => {
    const capitalizeFirstLetter = (str) => {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    window.capitalizeFirstLetter = capitalizeFirstLetter;
    return null;
  })()}

    /* FORÇA REMOÇÃO GLOBAL DE TODOS OS CHECKS DO RADIX SELECT */
    [data-radix-select-item-indicator] {
      display: none !important;
      position: absolute !important;
      left: -9999px !important;
      opacity: 0 !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      pointer-events: none !important;
    }
    
    /* Remove check de todos os SelectItems */
    [data-radix-select-item] > span:first-child {
      display: none !important;
    }
    
    /* Remove qualquer SVG de check */
    [data-radix-select-item] svg[data-radix-select-item-indicator] {
      display: none !important;
    }
    
    /* Remove espaço do indicador */
    [data-radix-select-item] {
      padding-left: 12px !important;
    }
  `}</style>

      <style>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #E5E7EB transparent;
        }
		
     /* FORÇA REMOÇÃO COMPLETA DE CHECKS - VERSÃO MAIS AGRESSIVA */
    [data-radix-select-item] [data-radix-select-item-indicator] {
      display: none !important;
      position: absolute !important;
      left: -9999px !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
    }

    [data-radix-select-item]:before,
    [data-radix-select-item]:after {
      display: none !important;
    }

    /* Remove indicador em qualquer estado */
    [data-radix-select-item][data-state="checked"] [data-radix-select-item-indicator],
    [data-radix-select-item][data-state="unchecked"] [data-radix-select-item-indicator] {
      display: none !important;
    }

        .modern-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 2px;
          border: none;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #D1D5DB;
        }
        
        /* Customização do SelectItem para remover check e ajustar layout */
        [data-radix-select-item] {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px !important;
          position: relative !important;
          outline: none !important;
        }
        
        /* Remoção completa do check/indicator */
        [data-radix-select-item] > span[data-radix-select-item-indicator] {
          display: none !important;
        }
        
        [data-radix-select-item]:before {
          display: none !important;
        }
        
        [data-radix-select-item] svg[data-radix-select-item-indicator] {
          display: none !important;
        }
        
        [data-radix-select-item][data-state="checked"]:before {
          display: none !important;
        }
        
        [data-radix-select-item][data-state="checked"] svg {
          display: none !important;
        }
        
        [data-radix-select-item] [data-radix-select-item-indicator] {
          display: none !important;
        }
        
		    /* ESTILOS ADICIONAIS PARA REMOÇÃO COMPLETA DO CHECK */
    [data-radix-select-item] span[data-radix-select-item-indicator],
    [data-radix-select-item-indicator],
    [data-state="checked"] [data-radix-select-item-indicator],
    .radix-select-item-indicator {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
    }

    /* Remover qualquer check mark ou ícone de seleção */
    [data-radix-select-item] svg:first-child,
    [data-radix-select-item] span:first-child svg {
      display: none !important;
    }

    /* Garantir que não há espaço reservado para o indicador */
    [data-radix-select-item] > span:first-child {
      margin-right: 0 !important;
      padding-right: 0 !important;
    }

    /* Força remoção em todos os contextos */
    * [data-radix-select-item-indicator] {
      display: none !important;
    }

    /* Remove todos os SVGs de indicação */
    [data-radix-select-item] > svg:first-child {
      display: none !important;
    }

    /* Remove espaçamento do indicador */
    [data-radix-select-item] {
      padding-left: 12px !important;
    }

        /* Largura fixa do dropdown */
        [data-radix-select-content] {
          width: var(--radix-select-trigger-width) !important;
          max-width: var(--radix-select-trigger-width) !important;
          min-width: var(--radix-select-trigger-width) !important;
        }
        
        [data-radix-select-item][data-highlighted] {
          background-color: #F9FAFB !important;
          outline: none !important;
        }
		

      `}</style> 

{/* Contêiner de Filtros Avançados - SEMPRE VISÍVEL */}
        <div 
          className="bg-[#FFFFFF] rounded-[10px] flex items-center gap-[12px] px-[0px] mb-[15px]"
          style={{
            height: '44px'
          }}
  onClick={(e) => e.stopPropagation()}
>
          
          {/* Barra de Busca Avançada de Clientes - NOVA */}
          <div className="w-[280px] flex-shrink-0 relative">
            <div className="relative">
              <div className="absolute left-[5px] top-1/2 transform -translate-y-1/2 w-[32px] h-[32px] flex items-center justify-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                ref={clientSearchRef}
                type="text"
                placeholder="Digite para buscar clientes..."
                value={clientSearch}
                onChange={handleClientSearchChange}
                onBlur={() => {
                 // Delay para permitir clique nos resultados
                 setTimeout(() => {
                   setShowClientResults(false)
                   setClientSearch('')
                 }, 150)
               }}
			   
                className="w-full h-[44px] pl-[35px] pr-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] text-[14px] font-inter text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                style={{ 
                  boxShadow: 'none',
                  outline: 'none'
                }}
              />
            </div>

            {/* Resultados da Busca de Clientes - REDESENHADO COM CABEÇALHO E ESTRUTURA MELHORADA */}
            {showClientResults && (
              <div 
                ref={clientResultsRef}
                className="absolute top-[48px] left-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] shadow-xl z-[50] overflow-hidden"
                style={{
                  width: 'calc(100vw - 60px)', // Largura total menos margens (35px esq + 78px dir)
                  left: '0px', // Compensar para alinhar com o início da tela
                  boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  maxHeight: '400px' // Aumentar altura máxima
                }}
              >
                <style>{`
                  .modern-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #E5E7EB transparent;
                  }
                  .modern-scrollbar::-webkit-scrollbar {
                    width: 4px;
                  }
                  .modern-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .modern-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #E5E7EB;
                    border-radius: 2px;
                    border: none;
                  }
                  .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #D1D5DB;
                  }
                  .client-results-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 16px;
                    align-items: center;
                    width: 100%;
                  }
                  .text-truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                `}</style>

                {/* Cabeçalho das Colunas */}
                <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-[16px]">
                  <div className="grid grid-cols-4 gap-4 w-full">
                    <div className="text-[#374151] text-[12px] font-semibold uppercase tracking-wider">
                      Dados dos Clientes
                    </div>
                    <div className="text-[#374151] text-[12px] font-semibold uppercase tracking-wider">
                      Produto
                    </div>
                    <div className="text-[#374151] text-[12px] font-semibold uppercase tracking-wider">
                      Etapas
                    </div>
                    <div className="text-[#374151] text-[12px] font-semibold uppercase tracking-wider">
                      Fases
                    </div>
                  </div>
                </div>

                {/* Lista de Resultados */}
                <div className="my-[5px]">
                <div className="max-h-[320px] overflow-y-auto modern-scrollbar">
                  {filteredClientResults.length > 0 ? (
                    filteredClientResults.map((client, index) => {
                      const clientInfo = getClientInfo(client)
                      return (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="p-[16px] hover:bg-[#F8FAFC] cursor-pointer border-b border-[#F3F4F6] last:border-b-0 transition-all duration-200 group"
                        >
                          <div className="grid grid-cols-4 gap-4 w-full">
                            {/* Dados dos Clientes - Coluna 1 */}
                            <div className="flex items-center gap-[12px] min-w-0">
                              {/* Foto do Cliente */}
                              <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {client.photo ? (
                                  <img src={client.photo} alt={client.name} className="w-full h-full object-cover" />
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                )}
                              </div>
                              
                              {/* Nome e WhatsApp */}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-[#374151] group-hover:text-[#1777CF] text-[14px] text-truncate transition-colors duration-200" title={client.name}>
                                  {client.name}
                                </div>
                                <div className="text-[#6B7280] text-[12px] mt-[1px] text-truncate" title={client.whatsapp}>
                                  {client.whatsapp}
                                </div>
                              </div>
                            </div>

                            {/* Produto - Coluna 2 */}
                            <div className="min-w-0">
                              <div className="text-[#6B7280] group-hover:text-[#1777CF] text-[12px] font-mono font-semibold transition-colors duration-200">
                                {String(index + 1).padStart(2, '0')}/{String(filteredClientResults.length).padStart(2, '0')}
                              </div>
                              <div className="text-[#374151] text-[13px] font-medium text-truncate mt-[1px]" title={clientInfo.produto}>
                                {clientInfo.produto}
                              </div>
                            </div>

                            {/* Etapas - Coluna 3 */}
                            <div className="min-w-0">
                              <div className="text-[#6B7280] group-hover:text-[#1777CF] text-[12px] font-mono font-semibold transition-colors duration-200">
                                {String(index + 1).padStart(2, '0')}/{String(filteredClientResults.length).padStart(2, '0')}
                              </div>
                              <div className="text-[#374151] text-[13px] font-medium text-truncate mt-[1px]" title={clientInfo.etapa}>
                                {clientInfo.etapa}
                              </div>
                            </div>

                            {/* Fases - Coluna 4 */}
                            <div className="min-w-0">
                              <div className="text-[#6B7280] group-hover:text-[#1777CF] text-[12px] font-mono font-semibold transition-colors duration-200">
                                {String(index + 1).padStart(2, '0')}/{String(filteredClientResults.length).padStart(2, '0')}
                              </div>
                              <div className="text-[#374151] text-[13px] font-medium text-truncate mt-[1px]" title={clientInfo.fase}>
                                {clientInfo.fase}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-[32px] text-center">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-[16px]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                      </div>
                      <div className="text-[#6B7280] text-[16px] font-medium mb-[4px]">Nenhum cliente encontrado</div>
                      <div className="text-[#9CA3AF] text-[14px]">Tente buscar por nome, telefone ou estado</div>
                    </div>               
                  )}
                </div>
                   </div>
              </div>
            )}
          </div>
          
          {/* Dropdown - Produtos*/}
         <div className="flex-1 min-w-0">
        <div className="relative" ref={produtoDropdownRef}>
          <button
           className="w-full h-[44px] px-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] text-[#374151] font-medium font-inter text-[15px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0"
            onClick={() => setShowProdutoDropdown(!showProdutoDropdown)}
          >
            {/* Texto truncado com espaçamento mínimo */}
           <div className="flex-1 min-w-0">
              <span className="truncate block text-left">
	<span
   className="inline-block relative mr-[6px]" 
   style={{ verticalAlign: 'middle', marginTop: '-1px' }}
   title="Produtos"
 >

   <svg 
     width="18" 
     height="15" 
     viewBox="0 0 18 15" 
     fill="none" 
     xmlns="http://www.w3.org/2000/svg" 
     className="cursor-pointer"
	 title="Produtos"
   >
   <path d="M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355ZM1.17986 13.3565V3.79869C1.17986 3.54157 1.39062 3.3318 1.64897 3.3318L4.60638 3.33519V8.75863V13.8233L1.64897 13.82C1.39062 13.8233 1.17986 13.6136 1.17986 13.3565ZM4.60638 13.8233V8.75863V3.33519H4.26645V13.8233H4.60638ZM13.7302 13.8233V3.33519H13.3902V13.8233H13.7302ZM16.8167 13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902V3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565Z" fill="#6B7280"/>
   <path d="M4.60638 3.33519L1.64897 3.3318C1.39062 3.3318 1.17986 3.54157 1.17986 3.79869V13.3565C1.17986 13.6136 1.39062 13.8233 1.64897 13.82L4.60638 13.8233M4.60638 3.33519H4.26645V13.8233H4.60638M4.60638 3.33519V8.75863V13.8233M13.3902 3.33519H13.7302V13.8233H13.3902M13.3902 3.33519V13.8233M13.3902 3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355Z" stroke="#6B7280" strokeWidth="0.2"/>
    </svg>
 </span>

 <span className="text-[#6B7280] text-[14px] font-mono font-normal mr-[6px] inline">
   {getSelectedProdutoIndex(selectedProduto).toString().padStart(2, '0')} <span className="text-[10px]">|</span>
 </span>
{getSelectedProdutoLabel(selectedProduto)}
              </span>
            </div>
            
            {/* Grupo: Seta + Avatar + Número */}
            <div className="flex items-center gap-[0px] flex-shrink-0 ml-[10px]">
              {/* Seta */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
               
              {/* Avatar */}
              <div className="w-[24px] h-[24px] flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              
              {/* Número identificador */}
              <span className="text-[14px] text-[#6B7280] font-medium">
                {getClientCountByProduct(selectedProduto).toString().padStart(2, '0')}
              </span>
            </div>

          </button>
          
          {showProdutoDropdown && (
            <div className="absolute top-[48px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[320px] overflow-hidden z-50">
              {/* Barra de Busca - Produtos */}
              <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="relative">
                  <input
                    ref={searchProdutoRef}
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchProduto}
                    onChange={handleProdutoSearchChange}
                    className="w-full h-[36px] px-[12px] pl-[36px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[6px] text-[14px] font-inter text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                        style={{ 
                          boxShadow: 'none',
                          outline: 'none'
                        }}

                  />
                  <div className="absolute left-[10px] top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Lista de Produtos SEM CHECK */}
              <div className="my-[5px]">
              <div className="max-h-[240px] overflow-y-auto modern-scrollbar">
                {produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto, index) => (
                    <div key={produto.value}>
                      <div
                        onClick={() => {
                          onSelectedProdutoChange(produto.value)
                          setShowProdutoDropdown(false)
                        }}
                        className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px] py-[12px] px-[12px] flex items-center justify-between"
                      >
                        <div className="flex items-center min-w-0 group" style={{ maxWidth: 'calc(100% - 50px)' }}>
                          <span className="text-[#6B7280] group-hover:text-[#1777CF] text-[14px] font-mono font-normal mr-[8px] flex-shrink-0 transition-colors duration-200">
                            {String(index + 1).padStart(2, '0')} <span className="text-[10px]">|</span>
                          </span>
                          <span 
                            className="text-[#374151] text-[14px] font-medium truncate" 
                            title={produto.label}
                            style={{ maxWidth: 'calc(100% - 0px)' }}
                          >
                            {produto.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-[4px] flex-shrink-0 ml-[10px]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="text-[14px] text-[#6B7280] font-regular">
                            {getClientCountByProduct(produto.value).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      {index < produtosFiltrados.length - 1 && (
                        <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-[16px] text-center text-[#6B7280] text-[14px] font-inter">
                    Nenhum produto encontrado
                  </div>
                )}
                  </div>
              </div>
            </div>
          )}
        </div>
          </div>

          {/* Dropdown - Etapas */}
          <div className="flex-1 min-w-0">
         <div className="relative" ref={etapaDropdownRef}>
          <button
           className="w-full h-[44px] px-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] text-[#374151] font-medium font-inter text-[15px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0"
            onClick={() => setShowEtapaDropdown(!showEtapaDropdown)}
          >
            {/* Texto truncado com espaçamento mínimo */}
           <div className="flex-1 min-w-0">
              <span className="truncate block text-left">
               <span
                 className="inline-block relative mr-[6px]" 
                 style={{ verticalAlign: 'middle', marginTop: '-1px' }}
                 title="Etapas"
               >
                 <svg 
                   width="18" 
                   height="15" 
                   viewBox="0 0 18 15" 
                   fill="none" 
                   xmlns="http://www.w3.org/2000/svg"
                   className="cursor-pointer"
                 >
                   <path d="M16.7333 0.5H14.4219H8.16719C8.01992 0.5 7.90052 0.616341 7.90052 0.759833V3.34839H6.36563C6.21836 3.34839 6.09896 3.46473 6.09896 3.60822V5.7663H4.56393C4.41667 5.7663 4.29727 5.88264 4.29727 6.02614V8.71403H3.17031C3.02305 8.71403 2.90365 8.83037 2.90365 8.97386V11.3969H1.26667C1.1194 11.3969 1 11.5132 1 11.6567V14.2402C1 14.3837 1.1194 14.5 1.26667 14.5H16.7333C16.8806 14.5 17 14.3837 17 14.2402V0.759833C17 0.616341 16.8806 0.5 16.7333 0.5ZM14.1552 1.01967V3.34839H12.6202H8.43385V1.01967H14.1552ZM8.16719 3.86805H12.3535V5.7663H10.8186H6.63229V3.86805H8.16719ZM6.36563 6.28597H10.552V8.71403H9.42487H4.8306V6.28597H6.36563ZM4.56393 9.2337H9.1582V11.3969H7.52135H3.43698V9.2337H4.56393ZM1.53333 11.9165H3.17031H7.25469V13.9803H1.53333V11.9165ZM16.4667 13.9803H7.78802V11.9165H9.42487C9.57214 11.9165 9.69154 11.8002 9.69154 11.6567V9.2337H10.8186C10.9659 9.2337 11.0853 9.11736 11.0853 8.97386V6.28597H12.6202C12.7674 6.28597 12.8868 6.16963 12.8868 6.02614V3.86805H14.4219C14.5691 3.86805 14.6885 3.75171 14.6885 3.60822V1.01967H16.4667V13.9803Z" fill="#6B7280" stroke="#6B7280" strokeWidth="0.3"/>
                 </svg>
               </span>


               <span className="text-[#6B7280] text-[14px] font-mono font-normal mr-[6px] inline">
                 {getSelectedEtapaIndex(selectedEtapa).toString().padStart(2, '0')} <span className="text-[10px]">|</span>
               </span>
               {getSelectedEtapaLabel(selectedEtapa)}
              </span>
            </div>
            
            {/* Grupo: Seta + Avatar + Número */}
            <div className="flex items-center gap-[0px] flex-shrink-0 ml-[10px]">
              {/* Seta */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
               
              {/* Avatar */}
              <div className="w-[24px] h-[24px] flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              
              {/* Número identificador */}
              <span className="text-[14px] text-[#6B7280] font-medium">
                {getClientCountByEtapaValue(selectedEtapa).toString().padStart(2, '0')}
              </span>
            </div>

          </button>
          
          {showEtapaDropdown && (
            <div className="absolute top-[48px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[320px] overflow-hidden z-50">
              {/* Barra de Busca - Etapas */}
              <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="relative">
                  <input
                    ref={searchEtapaRef}
                    type="text"
                    placeholder="Buscar etapas..."
                    value={searchEtapa}
                    onChange={handleEtapaSearchChange}
                    className="w-full h-[36px] px-[12px] pl-[36px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[6px] text-[14px] font-inter text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                        style={{ 
                          boxShadow: 'none',
                          outline: 'none'
                        }}
                  />
                  <div className="absolute left-[10px] top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Lista de Etapas SEM CHECK */}
              <div className="my-[5px]">
              <div className="max-h-[240px] overflow-y-auto modern-scrollbar">
                {etapasFiltradas.length > 0 ? (
                  etapasFiltradas.map((etapa, index) => (
                    <div key={etapa.value}>
                      <div
                        onClick={() => {
                          onSelectedEtapaChange(etapa.value)
                          setShowEtapaDropdown(false)
                        }}
                        className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px] py-[12px] px-[12px] flex items-center justify-between"
                      >
                        <div className="flex items-center min-w-0 group" style={{ maxWidth: 'calc(100% - 50px)' }}>
                          <span className="text-[#6B7280] group-hover:text-[#1777CF] text-[14px] font-mono font-normal mr-[8px] flex-shrink-0 transition-colors duration-200">
                            {String(index + 1).padStart(2, '0')} <span className="text-[10px]">|</span>
                          </span>
                          <span 
                            className="text-[#374151] text-[14px] font-medium truncate" 
                            title={etapa.label}
                            style={{ maxWidth: 'calc(100% - 0px)' }}
                          >
                            {etapa.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-[4px] flex-shrink-0 ml-[10px]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="text-[14px] text-[#6B7280] font-regular">
                            {getClientCountByEtapaValue(etapa.value).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      {index < etapasFiltradas.length - 1 && (
                        <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-[16px] text-center text-[#6B7280] text-[14px] font-inter">
                    Nenhuma etapa encontrada
                  </div>
                )}
                  </div>
              </div>
            </div>
          )}
        </div>
          </div>


          {/* Botão "+ Nova Coluna" - ESTILO ORIGINAL */}
          <button 
            onClick={onNovaEtapaClick}
            className="h-[44px] px-[16px] bg-[#FFFFFF] text-[#1777CF] border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium hover:bg-[#F9FAFB] hover:border-[#1777CF] transition-colors flex-shrink-0 flex items-center gap-[8px] font-inter"
            title="Adicionar Nova Coluna"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg> 
            Nova Coluna
          </button>
		  
      {/* Botão de Menu (três linhas horizontais) */}
          <button
            className="w-[44px] h-[44px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] flex items-center justify-center hover:bg-[#F9FAFB] hover:border-[#1777CF] transition-all duration-200 flex-shrink-0"
            title="Menu de opções"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#1777CF" 
              strokeWidth="2" 
              strokeLinecap="round"  
              strokeLinejoin="round" 
            >
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg> 
          </button>	  
		  
        </div>

    </>
  )
}