import React, { useState, useEffect, useRef } from 'react'
import { ClientCard } from './ClientCard'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import CadastrarLeads from './CadastrarLeads'
import { CruzamentoDeDados } from './CruzamentoDeDados'
import { Kanban } from './Kanban/Kanban'
import { ModalConfiguracao, KanbanConfig } from './Kanban/Modal-Configuracao'
import { ModalCriarKanban } from './Kanban/Modal-CriarKanban'
import { FiltrosAvancado } from './Kanban/FiltrosAvancado'

/*
--------------------------------------------------------
  Componente: Container de Clientes - Com Armazenamento Persistente
-------------------------------------------------------- 
- Container branco único com todos os elementos
- Margem de 10px em todos os lados
- Filtro funcional com fundo sólido branco
- Todas as opções de filtro implementadas
- Paginação limpa sem informações textuais
- REMOVIDO: Ícone de check do filtro
- Modal CadastrarLeads no botão "+ Novo Cliente"
- Funcionalidade de fechar modal implementada
- SALVAMENTO PERSISTENTE: localStorage do navegador
- LEADS DINÂMICOS: Carregamento automático dos leads salvos
- ORDEM: Leads mais novos aparecem primeiro
- Fonte Inter aplicada em todo o componente
- EDIÇÃO E EXCLUSÃO: Funcionalidades implementadas
- MODAL DE EXCLUSÃO: Confirmação moderna implementada
- MODAL DE CRUZAMENTO: Análise de dados implementada
- ALTERNÂNCIA LISTA/KANBAN: Funcionalidade implementada
*/

// Dados mockados dos clientes com campos numéricos
const mockClients = [
  {
    id: 1,
    name: "Claudio de Guimarães",
    photo: "",
    whatsapp: "(11) 99999-1234",
    estado: "SP",
    formularios: 5,
    livroCaixa: 3,
    isCustomLead: false
  },
  {
    id: 2,
    name: "Joana Dark de Souza",
    photo: "",
    whatsapp: "(21) 98888-5678",
    estado: "RJ",
    formularios: 2,
    livroCaixa: 0,
    isCustomLead: false
  },
  {
    id: 3,
    name: "Bernardino de Mello",
    photo: "",
    whatsapp: "(31) 97777-9012",
    estado: "MG",
    formularios: 0,
    livroCaixa: 1,
    isCustomLead: false
  },
  {
    id: 4,
    name: "Barbara Gabriela de Mel",
    photo: "",
    whatsapp: "(41) 96666-3456",
    estado: "PR",
    formularios: 8,
    livroCaixa: 4,
    isCustomLead: false
  },
  {
    id: 5,
    name: "Jeronimo Antônio de souza",
    photo: "",
    whatsapp: "(51) 95555-7890",
    estado: "RS",
    formularios: 12,
    livroCaixa: 7,
    isCustomLead: false
  },
  {
    id: 6,
    name: "Cristina Kamila Santiago",
    photo: "",
    whatsapp: "(61) 94444-2345",
    estado: "DF",
    formularios: 0,
    livroCaixa: 0,
    isCustomLead: false
  },
  {
    id: 7,
    name: "Kamila Brancate Zazo",
    photo: "",
    whatsapp: "(71) 93333-6789",
    estado: "BA",
    formularios: 3,
    livroCaixa: 2,
    isCustomLead: false
  },
  {
    id: 8,
    name: "Roberto Silva Santos",
    photo: "",
    whatsapp: "(85) 92222-0123",
    estado: "CE",
    formularios: 6,
    livroCaixa: 0,
    isCustomLead: false
  },
  {
    id: 9,
    name: "Maria Fernanda Costa",
    photo: "",
    whatsapp: "(47) 91111-4567",
    estado: "SC",
    formularios: 1,
    livroCaixa: 5,
    isCustomLead: false
  },
  {
    id: 10,
    name: "João Pedro Oliveira",
    photo: "",
    whatsapp: "(62) 90000-8901",
    estado: "GO",
    formularios: 9,
    livroCaixa: 8,
    isCustomLead: false
  },
  {
    id: 11,
    name: "Ana Carolina Ferreira",
    photo: "",
    whatsapp: "(81) 98999-2345",
    estado: "PE",
    formularios: 4,
    livroCaixa: 0,
    isCustomLead: false
  },
  {
    id: 12,
    name: "Carlos Eduardo Lima",
    photo: "",
    whatsapp: "(27) 97888-6789",
    estado: "ES",
    formularios: 0,
    livroCaixa: 6,
    isCustomLead: false
  }
]

export const ClientsContainer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false) // Estado para controlar o modal
  const [allClients, setAllClients] = useState(mockClients) // Estado para todos os clientes (mock + salvos)
  const [editingClient, setEditingClient] = useState(null) // Estado para cliente sendo editado
  const [showDeleteModal, setShowDeleteModal] = useState(false) // Estado para modal de exclusão
  const [clientToDelete, setClientToDelete] = useState(null) // Cliente selecionado para exclusão
  const [showCruzamentoModal, setShowCruzamentoModal] = useState(false) // Estado para modal de cruzamento
  const [clienteCruzamento, setClienteCruzamento] = useState(null) // Cliente selecionado para cruzamento
  const [shouldAddNewColumn, setShouldAddNewColumn] = useState(false) // Estado para adicionar nova coluna
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false) // Estado para mostrar filtros avançados
  const [selectedProduto, setSelectedProduto] = useState('declaracao-ir') // Estado para dropdown Produtos
  const [selectedEtapa, setSelectedEtapa] = useState('todas') // Estado para dropdown Etapas  
  const [selectedFase, setSelectedFase] = useState('todas') // Estado para dropdown Fases


  const itemsPerPage = 10 // Máximo de 10 cards por página
  const [activeView, setActiveView] = useState<'lista' | 'kanban'>('lista') // Estado para controlar a view ativa
  const containerRef = useRef<HTMLDivElement>(null)

 // Estados para configuração do Kanban
 const [showConfigModal, setShowConfigModal] = useState(false)
 const [showCriarKanbanModal, setShowCriarKanbanModal] = useState(false)
 const [kanbanConfig, setKanbanConfig] = useState<KanbanConfig>({
   displayMode: 'date-time',
   showCardInfo: true
 })


  /*
  --------------------------------------------------------
    Funções de Gerenciamento do localStorage
  --------------------------------------------------------
  - loadSavedLeads: Carrega leads salvos do localStorage
  - combineClientsData: Combina leads salvos com dados mock
  - extractStateFromText: Extrai sigla do estado do texto completo
  */
  const loadSavedLeads = () => {
    try {
      const savedLeads = JSON.parse(localStorage.getItem('fiscalpro_leads') || '[]');
      console.log('Leads carregados do localStorage:', savedLeads);
      return savedLeads;
    } catch (error) {
      console.error('Erro ao carregar leads do localStorage:', error);
      return [];
    }
  };

  const extractStateFromText = (stateText) => {
    if (!stateText) return 'N/A';
    
    // Se for uma string como "SP - São Paulo", extrair apenas "SP"
    if (stateText.includes(' - ')) {
      return stateText.split(' - ')[0];
    }
    
    // Se for apenas "SP" ou texto curto, retornar como está
    if (stateText.length <= 3) {
      return stateText.toUpperCase();
    }
    
    // Para textos longos, tentar encontrar sigla no início
    const stateAbbr = stateText.substring(0, 2).toUpperCase();
    return stateAbbr;
  };

  const combineClientsData = () => {
    const savedLeads = loadSavedLeads();
    
    // Converter leads salvos para o formato do cliente
    const convertedLeads = savedLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      photo: lead.photo || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDEgMi42MzItNS4zMDRjMS4xNzYtMS4xMzYgMS40NjQtMi45MjggMS42MTQtNC42MTZsLjE3OC0xOC4xNzFhMjYuOTMgMjYuOTMgMCAwIDAtNS4zODMtMS4yNjljLS4xNzEgMCAzLjEyNiAyLjM1MSAyLjM0NCA0LjA1MS0uMjgxIDEuNjEtMS41NiA2LjY0My0uOTI4IDguMzYxLjExMy4zMDggMS44NDcgNC41NDYgMi44MzQgNi43MzYgMS4xODggMi42MzMgMS41MTMgNS40NjQgMS41MTMgNS40NjRhMTkuNDgyIDE5LjQ4MiAwIDAgMSAyLjYzMi01LjMwNGMxLjE3Ni0xLjEzNiAxLjQ2NC0yLjkyOCAxLjYxNC00LjYxNmwuMTc4LTE4LjE3MWEyNi45MyAyNi45MyAwIDAgMC01LjM4My0xLjI2OWMtLjE3MSAwIDMuMTI2IDIuMzUxIDIuMzQ0IDQuMDUxLS4yODEgMS42MS0xLjU2IDYuNjQzLS45MjggOC4zNjEuMTEzLjMwOCAxLjg0NyA0LjU0NiAyLjgzNCA2LjczNiAxLjE4OCAyLjYzMyAxLjUxMyA1LjQ2NCAxLjUxMyA1LjQ2NGEyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDEgMi42MzItNS4zMDRjMS4xNzYtMS4xMzYgMS40NjQtMi45MjggMS42MTQtNC42MTZsLjE3OC0xOC4xNzFhMjYuOTMgMjYuOTMgMCAwIDAtNS4zODMtMS4yNjljLS4xNzEgMCAzLjEyNiAyLjM1MSAyLjM0NCA0LjA1MS0uMjgxIDEuNjEtMS41NiA2LjY0My0uOTI4IDguMzYxLjExMy4zMDggMS44NDcgNC41NDYgMi44MzQgNi43MzYgMS4xODggMi42MzMgMS41MTMgNS40NjQgMS41MTMgNS40NjR6bTI2Ljk1My0uMDAyYzEuNzEzLTEwLjY0MS0uNjA0LTIxLjM0NC0zLjQ5NC0zMS43ODJhMTMuNTQ2IDEzLjU0NiAwIDAgMC0yLjYzMi01LjMwNGMtMS4xNzYtMS4xMzYtMS40NjQtMi45MjgtMS42MTQtNC42MTZsLS4xNzgtMTguMTcxYTI2LjkzIDI2LjkzIDAgMCAwIDUuMzgzIDEuMjY5YzAuMTcxIDAtMy4xMjYtMi4zNTEtMi4zNDQtNC4wNTEuMjgxLTEuNjEgMS41Ni02LjY0My45MjgtOC4zNjEtLjExMy0uMzA4LTEuODQ3LTQuNTQ2LTIuODM0LTYuNzM2LTEuMTg4LTIuNjMzLTEuNTEzLTUuNDY0LTEuNTEzLTUuNDY0YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAwLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDN2My4zMjJjMCAxLjIyMy42OTEgMi4zNDIgMS43ODUgMi44ODhsOC40NjcgNC4yMzNhNy4wNTAgNy4wNSAwIDAgMSAxLjM5NC45MzJjLTMuNzEtNC43NjItOS4zOTktMTEuODgyLTkuNTM2LTE5LjlDNTMuMjQ2IDEyLjMyIDQxLjU4Ny4yNTQgMjYuOTUzLjAwNHoiIHN0eWxlPSIiIGZpbGw9IiM1NTYwODAiIGRhdGEtb3JpZ2luYWw9IiM1NTYwODAiIGNsYXNzPSIiPjwvcGF0aD48L2c+PC9zdmc+",
      whatsapp: lead.whatsapp,
      estado: extractStateFromText(lead.estado),
      formularios: Math.floor(Math.random() * 15),
      livroCaixa: Math.floor(Math.random() * 10),
      isCustomLead: true,
      createdAt: lead.createdAt
    }));

    // Combinar: leads salvos primeiro (mais novos primeiro), depois dados mock
    const combinedData = [...convertedLeads, ...mockClients];
    
    console.log('Dados combinados:', combinedData);
    return combinedData;
  };

  /*
  --------------------------------------------------------
    Hook useEffect: Carregamento Inicial
  --------------------------------------------------------
  - Executa uma vez quando componente monta
  - Carrega leads salvos do localStorage
  - Combina com dados mockados
  - Atualiza estado dos clientes
  */
  useEffect(() => {
    const combinedClients = combineClientsData();
    setAllClients(combinedClients);
  }, []);

  /*
  --------------------------------------------------------
    Callback: Quando Novo Lead é Salvo ou Editado
  --------------------------------------------------------
  - Recebe o lead recém-salvo como parâmetro
  - Atualiza a lista de clientes automaticamente
  - Coloca o novo lead no topo da lista (criação)
  - Atualiza lead existente na posição atual (edição)
  - Garante que a foto personalizada seja preservada
  */
  const handleLeadSaved = (savedLead, action = 'create') => {
    console.log('Lead processado:', savedLead, 'Ação:', action);
    
    // Converter o lead para o formato do cliente
    const clientData = {
      id: savedLead.id,
      name: savedLead.name,
      photo: savedLead.photo || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDEgMi42MzItNS4zMDRjMS4xNzYtMS4xMzYgMS40NjQtMi45MjggMS42MTQtNC42MTZsLjE3OC0xOC4xNzFhMjYuOTMgMjYuOTMgMCAwIDAtNS4zODMtMS4yNjljLS4xNzEgMCAzLjEyNiAyLjM1MSAyLjM0NCA0LjA1MS0uMjgxIDEuNjEtMS41NiA2LjY0My0uOTI4IDguMzYxLjExMy4zMDggMS44NDcgNC41NDYgMi44MzQgNi43MzYgMS4xODggMi42MzMgMS41MTMgNS40NjQgMS41MTMgNS40NjRhMTkuNDgyIDE5LjQ4MiAwIDAgMSAyLjYzMi01LjMwNGMxLjE3Ni0xLjEzNiAxLjQ2NC0yLjkyOCAxLjYxNC00LjYxNmwuMTc4LTE4LjE3MWEyNi45MyAyNi45MyAwIDAgMC01LjM4My0xLjI2OWMtLjE3MSAwIDMuMTI2IDIuMzUxIDIuMzQ0IDQuMDUxLS4yODEgMS42MS0xLjU2IDYuNjQzLS45MjggOC4zNjEuMTEzLjMwOCAxLjg0NyA0LjU0NiAyLjgzNCA2LjczNiAxLjE4OCAyLjYzMyAxLjUxMyA1LjQ2NCAxLjUxMyA1LjQ2NGEyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDEgMi42MzItNS4zMDRjMS4xNzYtMS4xMzYgMS40NjQtMi45MjggMS42MTQtNC42MTZsLjE3OC0xOC4xNzFhMjYuOTMgMjYuOTMgMCAwIDAtNS4zODMtMS4yNjljLS4xNzEgMCAzLjEyNiAyLjM1MSAyLjM0NCA0LjA1MS0uMjgxIDEuNjEtMS41NiA2LjY0My0uOTI4IDguMzYxLjExMy4zMDggMS44NDcgNC41NDYgMi44MzQgNi43MzYgMS4xODggMi42MzMgMS41MTMgNS40NjQgMS41MTMgNS40NjR6bTI2Ljk1My0uMDAyYzEuNzEzLTEwLjY0MS0uNjA0LTIxLjM0NC0zLjQ5NC0zMS43ODJhMTMuNTQ2IDEzLjU0NiAwIDAgMC0yLjYzMi01LjMwNGMtMS4xNzYtMS4xMzYtMS40NjQtMi45MjgtMS42MTQtNC42MTZsLS4xNzgtMTguMTcxYTI2LjkzIDI2LjkzIDAgMCAwIDUuMzgzIDEuMjY5YzAuMTcxIDAtMy4xMjYtMi4zNTEtMi4zNDQtNC4wNTEuMjgxLTEuNjEgMS41Ni02LjY0My45MjgtOC4zNjEtLjExMy0uMzA4LTEuODQ3LTQuNTQ2LTIuODM0LTYuNzM2LTEuMTg4LTIuNjMzLTEuNTEzLTUuNDY0LTEuNTEzLTUuNDY0YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAwLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDN2My4zMjJjMCAxLjIyMy42OTEgMi4zNDIgMS43ODUgMi44ODhsOC40NjcgNC4yMzNhNy4wNTAgNy4wNSAwIDAgMSAxLjM5NC45MzJjLTMuNzEtNC43NjItOS4zOTktMTEuODgyLTkuNTM2LTE5LjlDNTMuMjQ2IDEyLjMyIDQxLjU4Ny4yNTQgMjYuOTUzLjAwNHoiIHN0eWxlPSIiIGZpbGw9IiM1NTYwODAiIGRhdGEtb3JpZ2luYWw9IiM1NTYwODAiIGNsYXNzPSIiPjwvcGF0aD48L2c+PC9zdmc+',
      whatsapp: savedLead.whatsapp,
      estado: extractStateFromText(savedLead.estado),
      formularios: Math.floor(Math.random() * 15),
      livroCaixa: Math.floor(Math.random() * 10),
      isCustomLead: true,
      createdAt: savedLead.createdAt
    };

    if (action === 'edit') {
      // Modo edição - atualizar cliente existente na lista
      setAllClients(prevClients => 
        prevClients.map(client => 
          client.id === savedLead.id ? clientData : client
        )
      );
      console.log('✅ Cliente editado na lista');
    } else {
      // Modo criação - adicionar novo cliente no início da lista
      setAllClients(prevClients => [clientData, ...prevClients]);
      
      // Resetar página para 1 para mostrar o novo lead
      setCurrentPage(1);
      
      console.log('✅ Novo cliente adicionado à lista');
    }
  };

  // Filtrar clientes baseado na pesquisa e filtro de status
  const filteredClients = allClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.whatsapp.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.estado.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'com-formularios' && client.formularios > 0) ||
                         (statusFilter === 'sem-formularios' && client.formularios === 0) ||
                         (statusFilter === 'com-livro-caixa' && client.livroCaixa > 0) ||
                         (statusFilter === 'sem-livro-caixa' && client.livroCaixa === 0)
    
    return matchesSearch && matchesStatus
  })

  // Calcular paginação
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClients = filteredClients.slice(startIndex, endIndex)

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleSpreadsheetClick = (clientId: number) => {
    console.log(`Abrir cruzamento de dados do cliente ${clientId}`)
    
    // Encontrar o cliente pelos dados
    const cliente = allClients.find(c => c.id === clientId)
    if (cliente) {
      setClienteCruzamento(cliente)
      setShowCruzamentoModal(true)
    }
  }

 /*
 --------------------------------------------------------
   Funções para Modal de Configuração do Kanban
 --------------------------------------------------------
 */
 const handleConfigModalClose = () => {
   setShowConfigModal(false)
 }
 
 const handleConfigSave = (config: KanbanConfig) => {
   setKanbanConfig(config)
   console.log('Configuração salva:', config)
 }

 /*
 --------------------------------------------------------
   Funções: Handlers para Filtros Avançados
 --------------------------------------------------------
 - handleToggleAdvancedFilters: Alterna exibição dos filtros
 - Funções de callback para mudanças nos filtros
 */
 const handleToggleAdvancedFilters = () => {
   setShowAdvancedFilters(!showAdvancedFilters)
   console.log('Filtros avançados:', !showAdvancedFilters ? 'ativados' : 'desativados')
 }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  /*
  --------------------------------------------------------
    Função: Abrir Modal de Cadastro
  --------------------------------------------------------
  - Abre o modal CadastrarLeads quando botão é clicado
  - Controla estado isModalOpen
  */
  const handleNovoClienteClick = () => {
    setIsModalOpen(true)
  }
  
   /*
 --------------------------------------------------------
   Funções: Nova Etapa no Kanban
 --------------------------------------------------------
 - handleNovaEtapaClick: Ativa o sinal para adicionar nova coluna
 - handleColumnAdded: Reseta o sinal após coluna ser adicionada
 */
 const handleNovaEtapaClick = () => {
   setShouldAddNewColumn(true)
 }
 
 const handleColumnAdded = () => {
   setShouldAddNewColumn(false)
 }

 /*
  --------------------------------------------------------
    Funções: Modal Criar Kanban
  --------------------------------------------------------
  - handleCriarKanbanClick: Abre o modal para criar novo kanban
  - handleCriarKanbanClose: Fecha o modal
  */
 const handleCriarKanbanClick = () => {
   setShowCriarKanbanModal(true)
 }
 
 const handleCriarKanbanClose = () => {
   setShowCriarKanbanModal(false)
 }


  /*
  --------------------------------------------------------
    Função: Fechar Modal de Cadastro - IMPLEMENTADA
  --------------------------------------------------------
  - Fecha o modal CadastrarLeads
  - Reseta estado isModalOpen
  - Passada como prop onClose para o componente CadastrarLeads
  */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null) // Limpar cliente em edição
  }

  /*
  --------------------------------------------------------
    Funções para Edição de Cliente
  --------------------------------------------------------
  - handleEditClick: Abre modal de edição com dados do cliente
  - Reutiliza o mesmo modal CadastrarLeads
  */
  const handleEditClick = (client) => {
    console.log('Editando cliente:', client);
    setEditingClient(client);
    setIsModalOpen(true);
  }

  /*
  --------------------------------------------------------
    Funções para Exclusão de Cliente
  --------------------------------------------------------
  - handleDeleteClick: Abre modal de confirmação de exclusão
  - handleConfirmDelete: Confirma e executa a exclusão
  - handleCancelDelete: Cancela a exclusão
  */
  const handleDeleteClick = (client) => {
    console.log('Excluindo cliente:', client);
    setClientToDelete(client);
    setShowDeleteModal(true);
  }

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      // Se for um lead customizado, remover do localStorage
      if (clientToDelete.isCustomLead) {
        try {
          const savedLeads = JSON.parse(localStorage.getItem('fiscalpro_leads') || '[]');
          const updatedLeads = savedLeads.filter(lead => lead.id !== clientToDelete.id);
          localStorage.setItem('fiscalpro_leads', JSON.stringify(updatedLeads));
          console.log('Lead removido do localStorage');
        } catch (error) {
          console.error('Erro ao remover lead do localStorage:', error);
        }
      }

      // Atualizar lista de clientes
      setAllClients(prevClients => 
        prevClients.filter(client => client.id !== clientToDelete.id)
      );

      console.log('Cliente excluído com sucesso');
    }
    
    // Fechar modal
    setShowDeleteModal(false);
    setClientToDelete(null);
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
  }

  /*
  --------------------------------------------------------
    Funções para Cruzamento de Dados
  --------------------------------------------------------
  - handleCloseCruzamento: Fecha o modal de cruzamento de dados
  */
  const handleCloseCruzamento = () => {
    setShowCruzamentoModal(false)
    setClienteCruzamento(null)
  }

  return ( 
    <>
      <div 
        className="w-full bg-[#F8FAFC] overflow-hidden font-inter" 
        style={{ height: 'calc(100vh - 80px)' }} 
      >
	  
	         <style>{`
         /*
         --------------------------------------------------------
           Barra de Rolagem Moderna e Slim
         --------------------------------------------------------
         - Largura: 6px (slim)
         - Track: Transparente
         - Thumb: Cinza claro com bordas arredondadas
         - Hover: Cinza mais escuro
         - Suave e moderna
         */
         .modern-scrollbar {
           scrollbar-width: thin;
           scrollbar-color: #cbd5e1 transparent;
         }

         .modern-scrollbar::-webkit-scrollbar {
           width: 6px;
         }

         .modern-scrollbar::-webkit-scrollbar-track {
           background: transparent;
         }

         .modern-scrollbar::-webkit-scrollbar-thumb {
           background-color: #cbd5e1;
           border-radius: 3px;
           border: none;
         }

         .modern-scrollbar::-webkit-scrollbar-thumb:hover {
           background-color: #94a3b8;
         }

         .modern-scrollbar::-webkit-scrollbar-corner {
           background: transparent;
         }
       `}</style>

        {/* Container Branco Único com margem de 10px em todos os lados */} 
        <div className="mx-[15px] mt-[15px] mb-[15px] h-[calc(100vh-110px)] bg-[#FFFFFF] rounded-[12px] pl-[20px] pr-[10px] pt-[15px] pb-[0px] flex flex-col"> 
          
          {/* Cabeçalho da seção */}
          <div className="relative flex items-center pl-[5px] mb-[10px] flex-shrink-0">
            <h2 className="text-[24px] font-bold text-[#111827] font-inter">
              Clientes ({filteredClients.length.toString().padStart(2, '0')})
            </h2>
            
            {/* Botão de alternância Lista/Kanban */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-[#1777CF] rounded-[8px] p-[2px] flex">
                <button 
                  onClick={() => setActiveView('lista')}
                  className={`px-[16px] py-[8px] rounded-[6px] font-medium text-[14px] transition-colors duration-200 font-inter ${
                    activeView === 'lista' 
                      ? 'bg-white text-[#1777CF]' 
                      : 'text-white hover:bg-[#1565C0]'
                  }`}
                >
                  Lista
                </button>
                <button 
                  onClick={() => setActiveView('kanban')}
                  className={`px-[16px] py-[8px] rounded-[6px] font-medium text-[14px] transition-colors duration-200 font-inter ${
                    activeView === 'kanban' 
                      ? 'bg-white text-[#1777CF]' 
                      : 'text-white hover:bg-[#1565C0]'
                  }`}
                >
                  Kanban
                </button>
              </div>
            </div>

           {/* Área dos botões à direita */}
           <div className="ml-auto flex items-center gap-[10px]">
          {/* Botão de Configuração - Apenas no Kanban */}
{activeView === 'kanban' && (
  <button 
    onClick={() => setShowConfigModal(true)} 
    className="bg-white text-[#1777CF] border border-[#E5E7EB] px-[12px] py-[10px] mb-[5px] rounded-[8px] font-medium text-[14px] hover:bg-[#F8FAFC] hover:border-[#1777CF] transition-colors duration-200 flex items-center justify-center font-inter"
    title="Configurações do Kanban"
  >
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1777CF" strokeWidth="2">
     <circle cx="12" cy="12" r="3"/>
     <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
   </svg>
  </button>
)}       

              {/* Botão "+ Criar Novo" */}
			  {activeView === 'kanban' && (
              <button 
                onClick={handleCriarKanbanClick}
                className="bg-white text-[#1777CF] border border-[#E5E7EB] px-[16px] py-[10px] mb-[5px] rounded-[8px] font-medium text-[14px] hover:bg-[#F8FAFC] hover:border-[#1777CF] transition-colors duration-200 flex items-center gap-[8px] font-inter"
                title="Criar Novo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1777CF" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Criar Novo
              </button>
              )}

             {/* Botão "+ Novo Cliente" com funcionalidade de modal */}
             <button 
               onClick={handleNovoClienteClick}
              className="bg-[#1777CF] text-white px-[12px] py-[12px] mb-[5px] rounded-[8px] font-medium text-[14px] hover:bg-[#1565C0] transition-colors duration-200 flex items-center gap-[6px] font-inter"
              title="Novo Cliente"

             >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="12" y1="5" x2="12" y2="19"/>
                 <line x1="5" y1="12" x2="19" y2="12"/>
               </svg>
			   
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>

             </button>
           </div>
          </div>

           {/* Barra de filtros e pesquisa - CONDICIONAL PARA LISTA */}
          {activeView === 'lista' && (
            <div className="flex items-center gap-[12px] mb-[16px] flex-shrink-0">
              
              {/* Campo de pesquisa */}
              <div className="flex-1 relative">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="absolute left-[12px] top-1/2 transform -translate-y-1/2 text-[#6B7280]"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <Input
                  placeholder="Pesquise Nome, WhatsApp ou Estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-[44px] h-[44px] border-[#E5E7EB] focus:border-[#1777CF] focus:ring-[#1777CF] bg-[#FFFFFF] rounded-[10px] font-inter text-[16px]"
                />
              </div>

              {/* Filtro de Status com Fundo Sólido Branco - SEM ÍCONE DE CHECK */}
              <div className="w-[200px] flex-shrink-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                   <SelectTrigger className="h-[44px] border-[#E5E7EB] focus:border-[#1777CF] focus:ring-[#1777CF] bg-[#FFFFFF] rounded-[10px] text-[#374151] font-medium font-inter text-[16px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFFFF] border-[#E5E7EB] rounded-[8px] shadow-lg">
                    <SelectItem value="todos" className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px]">
                      Todos
                    </SelectItem>
                    <SelectItem value="com-formularios" className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px]">
                      Com Formulários
                    </SelectItem>
                    <SelectItem value="sem-formularios" className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px]">
                      Sem Formulários
                    </SelectItem>
                    <SelectItem value="com-livro-caixa" className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px]">
                      Com Livro Caixa
                    </SelectItem>
                    <SelectItem value="sem-livro-caixa" className="text-[#374151] hover:bg-[#F9FAFB] cursor-pointer font-inter text-[16px]">
                      Sem Livro Caixa
                    </SelectItem>
                  </SelectContent>
                </Select>
            </div>
            </div>
          )}

           {/* Componente de Filtros Avançados - SEMPRE VISÍVEL NO KANBAN */}
           {activeView === 'kanban' && (
             <FiltrosAvancado
               showAdvancedFilters={true}
               selectedProduto={selectedProduto}
               selectedEtapa={selectedEtapa}
               selectedFase={selectedFase}
               filteredClients={filteredClients}
               onToggleAdvancedFilters={() => {}}
               onSelectedProdutoChange={setSelectedProduto}
               onSelectedEtapaChange={setSelectedEtapa}
               onSelectedFaseChange={setSelectedFase}
               onNovaEtapaClick={handleNovaEtapaClick}
             />
           )}		

          {/* Área principal - Cards + Paginação */}
          <div className="flex-1 min-h-0 flex flex-col">
            
            {/* Renderização condicional do conteúdo */}
            {activeView === 'lista' ? (
              <div className="flex-1 min-h-0 overflow-y-auto modern-scrollbar">
                {filteredClients.length > 0 ? (
                  <div className="space-y-[15px] pr-[8px]">
                    {currentClients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onSpreadsheetClick={handleSpreadsheetClick}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-[48px] text-center h-full flex items-center justify-center">
                    <div className="text-[#6B7280] text-[16px] font-inter">
                      Nenhum cliente encontrado com os filtros aplicados.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden"> 
             <Kanban 
             shouldAddNewColumn={shouldAddNewColumn}
             onColumnAdded={handleColumnAdded}
           />

              </div>
            )}

            {/* Paginação - Apenas controles, sem informações textuais */}
            {activeView === 'lista' && filteredClients.length > 0 && totalPages > 1 && (
              <div className="mt-[10px] pt-[10px] pb-[10px] flex justify-end flex-shrink-0">
                <div className="flex items-center gap-[8px]">
                  <button 
                    className="px-[12px] py-[8px] rounded-[6px] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15,18 9,12 15,6"/>
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-[4px]">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = index + 1
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index
                      } else {
                        pageNumber = currentPage - 2 + index
                      }

                      return (
                        <button
                          key={pageNumber}
                          className={`w-[32px] h-[32px] rounded-[6px] font-medium text-[14px] transition-colors duration-200 font-inter ${
                            currentPage === pageNumber
                              ? 'bg-[#1777CF] text-white'
                              : 'border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
                          }`}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button 
                    className="px-[12px] py-[8px] rounded-[6px] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </button>
                </div> 
              </div>
            )}
          </div>
        </div>
      </div>

      {/*
      --------------------------------------------------------
        Modal CadastrarLeads - COM FUNCIONALIDADE DE SALVAMENTO E EDIÇÃO
      --------------------------------------------------------
      - Prop onClose passada para o componente CadastrarLeads
      - Prop onLeadSaved passada para callback de salvamento
      - Prop editingClient passada para pré-preencher dados na edição
      - Função handleCloseModal implementada
      - Função handleLeadSaved implementada
      - Modal fecha quando botão "X" é clicado
      - Lista atualizada automaticamente quando lead é salvo
      */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-full h-full">
            <CadastrarLeads 
              onClose={handleCloseModal} 
              onLeadSaved={handleLeadSaved}
              editingClient={editingClient}
            />
          </div>
        </div>
      )}

      {/*
      --------------------------------------------------------
        Modal de Confirmação de Exclusão
      --------------------------------------------------------
      - Centralizado na tela
      - Fundo com sombra escura e desfoque
      - Transições suaves (fade-in/out)
      - Mensagem de aviso sobre exclusão
      - Dois botões: "Sim, excluir" (vermelho) e "Cancelar" (cinza)
      */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[480px] max-w-[90vw]">
            
            {/* Ícone de Aviso */}
            <div className="flex justify-center mb-[24px]">
              <div className="w-[64px] h-[64px] bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[16px] font-inter">
              Confirmar Exclusão
            </h3>

            {/* Mensagem */}
            <p className="text-[16px] text-[#6B7280] text-center mb-[8px] leading-[24px] font-inter">
              Tem certeza que deseja excluir o cliente
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[32px] font-inter">
              {clientToDelete?.name}?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              {/* Botão Cancelar - Cinza */}
              <button
                onClick={handleCancelDelete}
                className="w-[140px] h-[44px] px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>

              {/* Botão Sim, excluir - Vermelho */}
              <button
                onClick={handleConfirmDelete}
                className="w-[140px] h-[44px] px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
      --------------------------------------------------------
        Modal de Cruzamento de Dados
      --------------------------------------------------------
      - Abre quando ícone de planilha é clicado
      - Mostra dados dos formulários vs livros caixa 
      - Layout dividido ao meio
      */} 
      {showCruzamentoModal && clienteCruzamento && (
        <CruzamentoDeDados
          isOpen={showCruzamentoModal}
          onClose={handleCloseCruzamento}
          cliente={clienteCruzamento}
        />
      )}
	        {/*
      --------------------------------------------------------
        Modal de Configuração do Kanban
      --------------------------------------------------------
      - Modal para configurar exibição de informações nos cards
      - Opções de exibição: Data + Tempo, Apenas Data, Apenas Tempo
      - Overlay para fechar ao clicar fora
      - Persistência das configurações
      */}
      {showConfigModal && (
        <ModalConfiguracao 
          isOpen={showConfigModal}
          onClose={handleConfigModalClose}
          onSave={handleConfigSave}
          currentConfig={kanbanConfig}
        />
      )}
	   
	        {/* 
      --------------------------------------------------------
        Modal Criar Kanban
      --------------------------------------------------------
      - Modal para criar novo kanban
      - Overlay para fechar ao clicar fora
      */}
      {showCriarKanbanModal && (
        <ModalCriarKanban 
          isOpen={showCriarKanbanModal}  
          onClose={handleCriarKanbanClose}
        />
      )}
    </>
  )
}