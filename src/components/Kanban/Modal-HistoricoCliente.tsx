import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ExternalLink,
  Clock,
  ChevronDown,
  Search,
  Briefcase

} from 'lucide-react';

/*
--------------------------------------------------------
  Componente: Modal de Histórico do Cliente - Atualizado
--------------------------------------------------------
- Barra de busca com filtros por responsável, data, fase ou etapa
- Radio buttons para escolher tipo de filtro
- 20 cards fictícios para teste
- Círculo azul alinhado verticalmente com etapas
- Linha tracejada conectando etapas
- Nome completo do responsável
- Altura automática do modal com 10px de espaçamento
*/

// Interfaces
interface MovimentacaoItem {
  id: string;
  tipo: 'entrada' | 'mudanca_coluna' | 'comentario' | 'acao';
  timestamp: string;
  colunaAnterior?: string;
  colunaAtual: string;
  duracao?: string;
  comentario?: string;
  usuario?: string;
  detalhes?: string;
}

interface ClienteInfo {
  id: string;
  nome: string;
  foto: string;
  whatsapp: string;
  email: string;
  dataEntrada: string;
}

interface FaseInfo {
  id: string;
  produto: string;
  nomeFase: string;
  dataEntrada: string;
  dataSaida?: string;
  totalDias: number;
  responsavel: string;
  comentarios: {
    id: string;
    texto: string;
    usuario: string;
    data: string;
  }[];
}

interface EtapaInfo {
  id: string;
  numeroEtapa: number;
  nomeEtapa: string;
  fases: FaseInfo[];
}

interface ModalHistoricoClienteProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteInfo;
  movimentacoes: MovimentacaoItem[];
}

interface ModalComentariosProps {
  isOpen: boolean;
  onClose: () => void;
  comentarios: {
    id: string;
    texto: string;
    usuario: string;
    data: string;
  }[];
  tituloColuna: string;
}

// Tipos de filtro
type TipoFiltro = 'responsavel' | 'data';

// Dados fictícios reestruturados para etapas e fases
const etapasFicticias: EtapaInfo[] = [
  {
    id: '1',
    numeroEtapa: 1,
    nomeEtapa: 'Entrar em contato com o cliente',
    fases: [
      {
        id: '1-1',
        produto: 'Holding Patrimonial',
        nomeFase: 'Primeiro contato telefônico',
        dataEntrada: '25-07-22',
        dataSaida: '25-07-22',
        totalDias: 1,
        responsavel: 'Linkon Henrique',
        comentarios: [
          { id: '1', texto: 'Cliente atendeu e demonstrou interesse', usuario: 'Linkon Henrique', data: '22/07/25' }
        ]
      },
      {
        id: '1-2',
        produto: 'Holding Patrimonial',
        nomeFase: 'Envio de material informativo',
        dataEntrada: '25-07-22',
        dataSaida: '25-07-23',
        totalDias: 1,
        responsavel: 'Maria Silva Santos',
        comentarios: []
      },
      {
        id: '1-3',
        produto: 'Ativo Fundiários',
        nomeFase: 'Agendamento de reunião',
        dataEntrada: '25-07-23',
        dataSaida: '25-07-24',
        totalDias: 1,
        responsavel: 'João Pedro Oliveira',
        comentarios: [
          { id: '2', texto: 'Reunião agendada para próxima semana', usuario: 'João Pedro Oliveira', data: '23/07/25' }
        ]
      },
      {
        id: '1-4',
        produto: 'Contabilidade Empresarial',
        nomeFase: 'Confirmação de interesse',
        dataEntrada: '25-07-24',
        dataSaida: '25-07-25',
        totalDias: 1,
        responsavel: 'Ana Carolina Lima',
        comentarios: []
      },
      {
        id: '1-5',
        produto: 'Planejamento Tributário',
        nomeFase: 'Levantamento de necessidades',
        dataEntrada: '25-07-25',
        dataSaida: '25-07-26',
        totalDias: 1,
        responsavel: 'Carlos Eduardo Souza',
        comentarios: [
          { id: '3', texto: 'Cliente tem necessidade de planejamento sucessório', usuario: 'Carlos Eduardo Souza', data: '25/07/25' }
        ]
      },
      {
        id: '1-6',
        produto: 'Holding Patrimonial',
        nomeFase: 'Análise de perfil do cliente',
        dataEntrada: '25-07-26',
        dataSaida: '25-07-27',
        totalDias: 1,
        responsavel: 'Patricia Fernandes Costa',
        comentarios: []
      },
      {
        id: '1-7',
        produto: 'Holding Patrimonial',
        nomeFase: 'Validação de documentos',
        dataEntrada: '25-07-27',
        dataSaida: '25-07-28',
        totalDias: 1,
        responsavel: 'Ricardo Almeida Pereira',
        comentarios: [
          { id: '4', texto: 'Documentos validados com sucesso', usuario: 'Ricardo Almeida Pereira', data: '27/07/25' }
        ]
      },
      {
        id: '1-8',
        produto: 'Holding Patrimonial',
        nomeFase: 'Apresentação de casos similares',
        dataEntrada: '25-07-28',
        dataSaida: '25-07-29',
        totalDias: 1,
        responsavel: 'Fernanda Rodrigues Silva',
        comentarios: []
      },
      {
        id: '1-9',
        produto: 'Holding Patrimonial',
        nomeFase: 'Esclarecimento de dúvidas',
        dataEntrada: '25-07-29',
        dataSaida: '25-07-30',
        totalDias: 1,
        responsavel: 'Gabriel Santos Oliveira',
        comentarios: [
          { id: '5', texto: 'Dúvidas sobre tributação esclarecidas', usuario: 'Gabriel Santos Oliveira', data: '29/07/25' }
        ]
      },
      {
        id: '1-10',
        produto: 'Holding Patrimonial',
        nomeFase: 'Finalização do primeiro contato',
        dataEntrada: '25-07-30',
        dataSaida: '25-07-31',
        totalDias: 1,
        responsavel: 'Juliana Costa Martins',
        comentarios: []
      }
    ]
  },
  {
    id: '2',
    numeroEtapa: 2,
    nomeEtapa: 'Qualificação e análise do cliente',
    fases: [
      {
        id: '2-1',
        produto: 'Holding Patrimonial',
        nomeFase: 'Coleta de informações patrimoniais',
        dataEntrada: '25-08-01',
        dataSaida: '25-08-02',
        totalDias: 1,
        responsavel: 'Bruno Silva Ferreira',
        comentarios: [
          { id: '6', texto: 'Cliente possui patrimônio significativo', usuario: 'Bruno Silva Ferreira', data: '01/08/25' }
        ]
      },
      {
        id: '2-2',
        produto: 'Holding Patrimonial',
        nomeFase: 'Análise de estrutura familiar',
        dataEntrada: '25-08-02',
        dataSaida: '25-08-03',
        totalDias: 1,
        responsavel: 'Camila Oliveira Santos',
        comentarios: []
      },
      {
        id: '2-3',
        produto: 'Ativo Fundiários',
        nomeFase: 'Avaliação de riscos fiscais',
        dataEntrada: '25-08-03',
        dataSaida: '25-08-04',
        totalDias: 1,
        responsavel: 'Diego Pereira Lima',
        comentarios: [
          { id: '7', texto: 'Identificados riscos fiscais elevados', usuario: 'Diego Pereira Lima', data: '03/08/25' }
        ]
      },
      {
        id: '2-4',
        produto: 'Planejamento Tributário',
        nomeFase: 'Definição de objetivos',
        dataEntrada: '25-08-04',
        dataSaida: '25-08-05',
        totalDias: 1,
        responsavel: 'Eduarda Martins Rocha',
        comentarios: []
      },
      {
        id: '2-5',
        produto: 'Contabilidade Empresarial',
        nomeFase: 'Análise de viabilidade',
        dataEntrada: '25-08-05',
        dataSaida: '25-08-06',
        totalDias: 1,
        responsavel: 'Felipe Rodrigues Costa',
        comentarios: [
          { id: '8', texto: 'Projeto viável e recomendado', usuario: 'Felipe Rodrigues Costa', data: '05/08/25' }
        ]
      },
      {
        id: '2-6',
        produto: 'Holding Patrimonial',
        nomeFase: 'Elaboração de diagnóstico',
        dataEntrada: '25-08-06',
        dataSaida: '25-08-07',
        totalDias: 1,
        responsavel: 'Giovana Santos Silva',
        comentarios: []
      },
      {
        id: '2-7',
        produto: 'Holding Patrimonial',
        nomeFase: 'Apresentação de cenários',
        dataEntrada: '25-08-07',
        dataSaida: '25-08-08',
        totalDias: 1,
        responsavel: 'Henrique Lima Oliveira',
        comentarios: [
          { id: '9', texto: 'Cenários apresentados ao cliente', usuario: 'Henrique Lima Oliveira', data: '07/08/25' }
        ]
      },
      {
        id: '2-8',
        produto: 'Holding Patrimonial',
        nomeFase: 'Validação com cliente',
        dataEntrada: '25-08-08',
        dataSaida: '25-08-09',
        totalDias: 1,
        responsavel: 'Isabella Costa Santos',
        comentarios: []
      },
      {
        id: '2-9',
        produto: 'Holding Patrimonial',
        nomeFase: 'Refinamento da estratégia',
        dataEntrada: '25-08-09',
        dataSaida: '25-08-10',
        totalDias: 1,
        responsavel: 'Jorge Silva Pereira',
        comentarios: [
          { id: '10', texto: 'Estratégia refinada conforme feedback', usuario: 'Jorge Silva Pereira', data: '09/08/25' }
        ]
      },
      {
        id: '2-10',
        produto: 'Holding Patrimonial',
        nomeFase: 'Aprovação final da qualificação',
        dataEntrada: '25-08-10',
        dataSaida: '25-08-11',
        totalDias: 1,
        responsavel: 'Larissa Fernandes Lima',
        comentarios: []
      }
    ]
  },
  {
    id: '3',
    numeroEtapa: 3,
    nomeEtapa: 'Apresentação da proposta',
    fases: [
      {
        id: '3-1',
        produto: 'Contabilidade Empresarial',
        nomeFase: 'Elaboração da proposta técnica',
        dataEntrada: '25-08-11',
        dataSaida: '25-08-12',
        totalDias: 1,
        responsavel: 'Marina Santos Costa',
        comentarios: [
          { id: '11', texto: 'Proposta técnica finalizada', usuario: 'Marina Santos Costa', data: '11/08/25' }
        ]
      }
    ]
  }
];

// Modal de Comentários
const ModalComentarios: React.FC<ModalComentariosProps> = ({
  isOpen,
  onClose,
  comentarios,
  tituloColuna
}) => {
  if (!isOpen) return null;

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Comentários - {tituloColuna}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {comentarios.length > 0 ? (
            <div className="space-y-4">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-800 mb-2">{comentario.texto}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{comentario.usuario}</span>
                    <span>{formatarData(comentario.data)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum comentário encontrado para esta coluna.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Principal do Histórico
const ModalHistoricoCliente: React.FC<ModalHistoricoClienteProps> = ({
  isOpen,
  onClose,
  cliente
}) => {
  const [modalComentariosOpen, setModalComentariosOpen] = useState(false);
  const [comentariosSelecionados, setComentariosSelecionados] = useState<{
    id: string;
    texto: string;
    usuario: string;
    data: string;
  }[]>([]);
  const [tituloColunaSelecionada, setTituloColunaSelecionada] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState('Holding Patrimonial');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('responsavel');
  const [termoBusca, setTermoBusca] = useState('');
  const [dropdownProdutoAberto, setDropdownProdutoAberto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [etapaSelecionada, setEtapaSelecionada] = useState('');
  const [faseSelecionada, setFaseSelecionada] = useState('');
  const [dropdownEtapaAberto, setDropdownEtapaAberto] = useState(false);
  const [dropdownFaseAberto, setDropdownFaseAberto] = useState(false);
  const [buscaEtapa, setBuscaEtapa] = useState('');
  const [buscaFase, setBuscaFase] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
   // Fechar dropdown de produtos ao clicar fora
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     const target = event.target as HTMLElement;
     const dropdownElement = document.querySelector('[data-dropdown-produtos]');
     
     if (dropdownProdutoAberto && dropdownElement && !dropdownElement.contains(target)) {
       setDropdownProdutoAberto(false);
       setBuscaProduto('');
     }
   };

   if (dropdownProdutoAberto) {
     document.addEventListener('mousedown', handleClickOutside);
   }

   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, [dropdownProdutoAberto]);
 
  // Fechar dropdown de etapas ao clicar fora
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     const target = event.target as HTMLElement;
     const dropdownElement = document.querySelector('[data-dropdown-etapas]');
     
     if (dropdownEtapaAberto && dropdownElement && !dropdownElement.contains(target)) {
       setDropdownEtapaAberto(false);
       setBuscaEtapa('');
     }
   };

   if (dropdownEtapaAberto) {
     document.addEventListener('mousedown', handleClickOutside);
   }

   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, [dropdownEtapaAberto]);

 // Fechar dropdown de fases ao clicar fora
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     const target = event.target as HTMLElement;
     const dropdownElement = document.querySelector('[data-dropdown-fases]');
     
     if (dropdownFaseAberto && dropdownElement && !dropdownElement.contains(target)) {
       setDropdownFaseAberto(false);
       setBuscaFase('');
     }
   };

   if (dropdownFaseAberto) {
     document.addEventListener('mousedown', handleClickOutside);
   }

   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, [dropdownFaseAberto]);


  
   // Rolar para o topo quando aplicar filtros
 useEffect(() => {
   if (scrollContainerRef.current && termoBusca) {
     scrollContainerRef.current.scrollTop = 0;
   }
 }, [termoBusca, tipoFiltro, produtoSelecionado]);


  // Filtrar etapas e fases
  const etapasFiltradas = etapasFicticias.map(etapa => ({
    ...etapa,
    fases: etapa.fases.filter(fase => {
      if (produtoSelecionado && fase.produto !== produtoSelecionado) return false;
	 if (etapaSelecionada && etapa.id !== etapaSelecionada) return false;
     if (faseSelecionada && fase.id !== faseSelecionada) return false;

      if (!termoBusca) return true;
      
      switch (tipoFiltro) {
        case 'responsavel':
          return fase.responsavel.toLowerCase().includes(termoBusca.toLowerCase());
        case 'data':
		
     // Converte data ISO (YYYY-MM-DD) para formato BR (DD/MM/YYYY)
     const [anoE, mesE, diaE] = fase.dataEntrada.split('-');
     const dataEntradaBR = `${diaE}/${mesE}/${anoE}`;
     
     let dataSaidaBR = '';
     if (fase.dataSaida) {
       const [anoS, mesS, diaS] = fase.dataSaida.split('-');
       dataSaidaBR = `${diaS}/${mesS}/${anoS}`;
     }
     
     // Remove barras do termo de busca para comparação flexível
     const termoPesquisa = termoBusca.trim();
     const termoPesquisaSemBarras = termoPesquisa.replace(/\//g, '');
     
     // Remove barras das datas para comparação
     const dataEntradaSemBarras = dataEntradaBR.replace(/\//g, '');
     const dataSaidaSemBarras = dataSaidaBR.replace(/\//g, '');
     
     // Verifica se o termo está em alguma das datas
     return dataEntradaBR.includes(termoPesquisa) || 
            dataEntradaSemBarras.includes(termoPesquisaSemBarras) ||
            (dataSaidaBR && dataSaidaBR.includes(termoPesquisa)) || 
            (dataSaidaSemBarras && dataSaidaSemBarras.includes(termoPesquisaSemBarras));

        default:
          return true;
      }
    })
  })).filter(etapa => etapa.fases.length > 0);

  const abrirComentarios = (comentarios: any[], titulo: string) => {
    setComentariosSelecionados(comentarios);
    setTituloColunaSelecionada(titulo);
    setModalComentariosOpen(true);
  };

  const produtosUnicos = ['Holding Patrimonial', 'Ativo Fundiários', 'Planejamento Tributário', 'Contabilidade Empresarial'];
  const produtoAtual = produtoSelecionado || produtosUnicos[0];
  
 // Extrair etapas únicas baseadas no produto selecionado
 const etapasUnicas = Array.from(new Set(
   etapasFicticias
     .filter(etapa => 
       etapa.fases.some(fase => !produtoSelecionado || fase.produto === produtoSelecionado)
     )
     .map(etapa => ({
       id: etapa.id,
       numero: etapa.numeroEtapa,
       nome: etapa.nomeEtapa
     }))
 )).sort((a, b) => a.numero - b.numero);

 // Extrair fases únicas baseadas na etapa selecionada
 const fasesUnicas = (() => {
   if (etapaSelecionada) {
     // Se uma etapa específica está selecionada, mostrar apenas suas fases
     const etapaEncontrada = etapasFicticias.find(e => e.id === etapaSelecionada);
     if (!etapaEncontrada) return [];
     
     return etapaEncontrada.fases
       .filter(fase => !produtoSelecionado || fase.produto === produtoSelecionado)
       .map((fase, index) => ({
         id: fase.id,
         numero: index + 1,
         nome: fase.nomeFase
       }));
   } else {
     // Se nenhuma etapa está selecionada, mostrar todas as fases do produto selecionado
     let contador = 1;
     return etapasFicticias
       .flatMap(etapa => etapa.fases)
       .filter(fase => !produtoSelecionado || fase.produto === produtoSelecionado)
       .map((fase) => ({
         id: fase.id,
         numero: contador++,
         nome: fase.nomeFase
       }));
   }
 })();


  // Filtrar produtos para busca
  const produtosFiltrados = produtosUnicos.filter(produto => 
    produto.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const selecionarProduto = (produto: string) => {
    setProdutoSelecionado(produto);
    setDropdownProdutoAberto(false);
    setBuscaProduto('');
	
   // Resetar seleções dependentes
   setEtapaSelecionada('');
   setFaseSelecionada('');
 };

 // Filtrar etapas para busca
 const etapasFiltradasDropdown = etapasUnicas.filter(etapa => 
   etapa.nome.toLowerCase().includes(buscaEtapa.toLowerCase()) ||
   String(etapa.numero).padStart(2, '0').includes(buscaEtapa)
 );

 const selecionarEtapa = (etapaId: string) => {
   setEtapaSelecionada(etapaId);
   setDropdownEtapaAberto(false);
   setBuscaEtapa('');
   // Resetar seleção de fase ao mudar etapa
   setFaseSelecionada('');
 };

 // Filtrar fases para busca
 const fasesFiltradasDropdown = fasesUnicas.filter(fase => 
   fase.nome.toLowerCase().includes(buscaFase.toLowerCase()) ||
   String(fase.numero).padStart(2, '0').includes(buscaFase)
 );

 const selecionarFase = (faseId: string) => {
   setFaseSelecionada(faseId);
   setDropdownFaseAberto(false);
   setBuscaFase('');
 };

 // Função para formatar data ISO sem problemas de fuso horário
 const formatarDataISO = (dataISO: string): string => {
   if (!dataISO) return '';
   const [ano, mes, dia] = dataISO.split('-');
   return `${dia}/${mes}/${ano}`;
 };

  // Verificações de segurança
  if (!cliente || !isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10px] pb-[10px]">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-5xl h-[700px] max-h-[calc(100vh-20px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="relative bg-gray-50 p-6 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <div className="flex items-center justify-between">
              {/* Informações do cliente à esquerda */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                    alt={cliente.nome || 'Cliente'}
                    className="w-16 h-16 rounded-full border-2 border-gray-300 shadow-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxNiIgeT0iMTYiPgo8cGF0aCBkPSJNMTYgMTZDMTguMjA5MSAxNiAyMCAxNC4yMDkxIDIwIDEyQzIwIDkuNzkwODYgMTguMjA5MSA4IDE2IDhDMTMuNzkwOSA4IDEyIDkuNzkwODYgMTIgMTJDMTIgMTQuMjA5MSAxMy43OTA5IDE2IDE2IDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjQgMjRWMjJDMjQgMTkuNzkwOSAyMi4yMDkxIDE4IDIwIDE4SDEyQzkuNzkwODYgMTggOCAxOS43OTA5IDggMjJWMjQiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-1 text-gray-900">{cliente.nome || 'Cliente'}</h2>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <span>Cliente desde {cliente.dataEntrada ? new Date(cliente.dataEntrada).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Título central */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-xl font-bold text-gray-900">Histórico completo</h1>
              </div>
            </div>
          </div>

          {/* Content */}
         <div className="px-[15px] pt-[15px] pb-[15px] flex-1 flex flex-col min-h-0">
             
            {/* Filtros e Busca */}
            <div className="mb-[20px] bg-gray-50 p-[15px] rounded-lg border border-gray-200">
              
             {/* Primeira linha: Dropdowns */}
             <div className="flex gap-[10px] mb-[10px]">          

                {/* Dropdown de Produtos customizado */}
               <div className="flex-1 relative" data-dropdown-produtos>
                 <button
                   onClick={() => setDropdownProdutoAberto(!dropdownProdutoAberto)}
                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors" 
                 >
                   <div className="flex items-center gap-2">
                     <Briefcase size={16} className="text-gray-600" />
                     <span className="text-gray-900 truncate">{produtoAtual}</span>
                   </div>
                   <ChevronDown size={20} className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${dropdownProdutoAberto ? 'rotate-180' : ''}`} />
                 </button>

                 {dropdownProdutoAberto && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                     {/* Barra de busca interna */}
                     <div className="p-3 border-b border-gray-100">
                       <div className="relative">
                         <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                         <input
                           type="text"
                           placeholder="Buscar produtos..."
                           value={buscaProduto}
                           onChange={(e) => setBuscaProduto(e.target.value)}
                           className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                           onClick={(e) => e.stopPropagation()}
                         />
                       </div>
                     </div>

                     {/* Lista de produtos */}
                     <div className="max-h-48 overflow-y-auto">
                       {produtosFiltrados.length > 0 ? (
                         produtosFiltrados.map((produto, index) => (
                           <div key={produto}>
                             <button
                               onClick={() => selecionarProduto(produto)}
                               className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                                 produto === produtoAtual ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                               }`}
                             >
                               <div className="flex items-center space-x-3 min-w-0 flex-1">
                                 <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                   {String(index + 1).padStart(2, '0')}
                                 </span>
                                 <span className="font-normal truncate text-[14px]">{produto}</span>
                               </div>
                             </button>
                             {index < produtosFiltrados.length - 1 && (
                               <div className="border-b border-gray-100 mx-[10px]"></div>
                             )}
                           </div>
                         ))
                       ) : (
                         <div className="px-4 py-3 text-center text-gray-500 text-sm">
                           Nenhum produto encontrado
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>

               {/* Dropdown de Etapas */}
               <div className="flex-1 relative" data-dropdown-etapas>
                 <button
                   onClick={() => setDropdownEtapaAberto(!dropdownEtapaAberto)}
                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors" 
                 >
                   <div className="flex items-center gap-2">
                    <svg width="16" height="13" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                      <path d="M16.7333 0.5H14.4219H8.16719C8.01992 0.5 7.90052 0.616341 7.90052 0.759833V3.34839H6.36563C6.21836 3.34839 6.09896 3.46473 6.09896 3.60822V5.7663H4.56393C4.41667 5.7663 4.29727 5.88264 4.29727 6.02614V8.71403H3.17031C3.02305 8.71403 2.90365 8.83037 2.90365 8.97386V11.3969H1.26667C1.1194 11.3969 1 11.5132 1 11.6567V14.2402C1 14.3837 1.1194 14.5 1.26667 14.5H16.7333C16.8806 14.5 17 14.3837 17 14.2402V0.759833C17 0.616341 16.8806 0.5 16.7333 0.5ZM14.1552 1.01967V3.34839H12.6202H8.43385V1.01967H14.1552ZM8.16719 3.86805H12.3535V5.7663H10.8186H6.63229V3.86805H8.16719ZM6.36563 6.28597H10.552V8.71403H9.42487H4.8306V6.28597H6.36563ZM4.56393 9.2337H9.1582V11.3969H7.52135H3.43698V9.2337H4.56393ZM1.53333 11.9165H3.17031H7.25469V13.9803H1.53333V11.9165ZM16.4667 13.9803H7.78802V11.9165H9.42487C9.57214 11.9165 9.69154 11.8002 9.69154 11.6567V9.2337H10.8186C10.9659 9.2337 11.0853 9.11736 11.0853 8.97386V6.28597H12.6202C12.7674 6.28597 12.8868 6.16963 12.8868 6.02614V3.86805H14.4219C14.5691 3.86805 14.6885 3.75171 14.6885 3.60822V1.01967H16.4667V13.9803Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"/>
                    </svg>

                    <span className="text-gray-900 truncate">
                      {etapaSelecionada ? 
                        etapasUnicas.find(e => e.id === etapaSelecionada)?.nome || 'Todas as Etapas'
                        : 'Todas as Etapas'
                      }
                    </span>

                   </div>
                   <ChevronDown size={20} className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${dropdownEtapaAberto ? 'rotate-180' : ''}`} />
                 </button>
				 
				                 {dropdownEtapaAberto && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {/* Barra de busca interna */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar etapas..."
                          value={buscaEtapa}
                          onChange={(e) => setBuscaEtapa(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Lista de etapas */}
                    <div className="max-h-48 overflow-y-auto">
                      {/* Opção "Todas as Etapas" */}
                      <button
                        onClick={() => selecionarEtapa('')}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                          !etapaSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        <span className="font-normal text-[14px]">Todas as Etapas</span>
                      </button>
                      <div className="border-b border-gray-100 mx-[10px]"></div>
                      
                      {etapasFiltradasDropdown.length > 0 ? (
                        etapasFiltradasDropdown.map((etapa, index) => (
                          <div key={etapa.id}>
                            <button
                              onClick={() => selecionarEtapa(etapa.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                                etapa.id === etapaSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                  {String(etapa.numero).padStart(2, '0')}
                                </span>
                                <span className="font-normal truncate text-[14px]">{etapa.nome}</span>
                              </div>
                            </button>
                            {index < etapasFiltradasDropdown.length - 1 && (
                              <div className="border-b border-gray-100 mx-[10px]"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                          Nenhuma etapa encontrada
                        </div>
                      )}
                    </div>
                  </div>
                )}

               </div>

               {/* Dropdown de Fases */}
               <div className="flex-1 relative" data-dropdown-fases>
                 <button
                   onClick={() => setDropdownFaseAberto(!dropdownFaseAberto)}
                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors" 
                 >
                   <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                      <path d="M8.27 22.75H4.23c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v15.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-20c-1.27 0-1.48.34-1.48 1.35v15.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35zM19.77 15.75h-4.04c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v8.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-13c-1.27 0-1.48.34-1.48 1.35v8.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35z" fill="currentColor"/>
                    </svg>

                                          <span className="text-gray-900 truncate">
                       {faseSelecionada ? 
                         fasesUnicas.find(f => f.id === faseSelecionada)?.nome || 'Todas as Fases'
                         : 'Todas as Fases'
                       }
                     </span>

                   </div>
                   <ChevronDown size={20} className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${dropdownFaseAberto ? 'rotate-180' : ''}`} />
                 </button>
				 
				                 {dropdownFaseAberto && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {/* Barra de busca interna */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar fases..."
                          value={buscaFase}
                          onChange={(e) => setBuscaFase(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Lista de fases */}
                    <div className="max-h-48 overflow-y-auto">
                      {/* Opção "Todas as Fases" */}
                      <button
                        onClick={() => selecionarFase('')}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                          !faseSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        <span className="font-normal text-[14px]">Todas as Fases</span>
                      </button>
                      <div className="border-b border-gray-100 mx-[10px]"></div>
                      
                      {fasesFiltradasDropdown.length > 0 ? (
                        fasesFiltradasDropdown.map((fase, index) => (
                          <div key={fase.id}>
                            <button
                              onClick={() => selecionarFase(fase.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                                fase.id === faseSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                  {String(fase.numero).padStart(2, '0')}
                                </span>
                                <span className="font-normal truncate text-[14px]">{fase.nome}</span>
                              </div>
                            </button>
                            {index < fasesFiltradasDropdown.length - 1 && (
                              <div className="border-b border-gray-100 mx-[10px]"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                          Nenhuma fase encontrada
                        </div>
                      )}
                    </div>
                  </div>
                )}

               </div>
             </div>

             {/* Segunda linha: Barra de busca e Radio buttons */}
             <div className="flex items-center gap-[20px]">
               {/* Barra de busca */}
               <div className="flex-1 relative">
                 <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   placeholder={`Buscar por ${tipoFiltro === 'responsavel' ? 'responsável' : tipoFiltro}...`}
                   value={termoBusca}
                   onChange={(e) => setTermoBusca(e.target.value)}
                   className="w-full text-[14px]  pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent h-10 bg-white" 
                 />
               </div>

               {/* Radio buttons */}
               <div className="flex gap-[20px]">
                 <label className="flex items-center space-x-2 cursor-pointer">
                   <input
                     type="radio"
                     name="tipoFiltro" 
                     value="responsavel"
                     checked={tipoFiltro === 'responsavel'}
                     onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                     className="w-4 h-4 text-blue-600"
                   />
                   <span className="text-sm font-medium text-gray-700">Responsáveis</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                   <input
                     type="radio"
                     name="tipoFiltro"
                     value="data"
                     checked={tipoFiltro === 'data'}
                     onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                     className="w-4 h-4 text-blue-600"
                   />
                   <span className="text-sm font-medium text-gray-700">Data</span>
                 </label>
               </div>
             </div>
            </div>

            {/* Lista de etapas e fases com scroll */}
           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="pr-2 pb-[15]"> 
                {etapasFiltradas.length > 0 ? (
                  <div className="relative">
                    {/* Linha tracejada conectora */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300"></div>
                    
                    <div className="space-y-[10px]">
                      {etapasFiltradas.map((etapa) => (
                        <div key={etapa.id} className="relative">
                          {/* Círculo numerado e nome da etapa */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="relative z-10 flex-shrink-0">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg" style={{ backgroundColor: '#1777CF' }}>
                                {String(etapa.numeroEtapa).padStart(2, '0')}
                              </div>
                            </div>
                            <h4 className="text-base font-medium text-gray-900">
                              Etapa: {etapa.nomeEtapa}
                            </h4>
                          </div>

                          {/* Fases da etapa */}
                          <div className="ml-9 space-y-3">
                            {etapa.fases.map((fase, faseIndex) => (
                              <div key={fase.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                {/* Linha superior: Nome da fase e comentários */}
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Fase {String(faseIndex + 1).padStart(2, '0')}: {fase.nomeFase}
                                  </h5>
                                  <div className="flex items-center space-x-1 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 32 32" className="text-blue-600">
                                      <path fill="#1777CF" fillRule="evenodd" d="M2 6a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H16.283l-6.259 3.852A1 1 0 0 1 8.5 28v-3H5a3 3 0 0 1-3-3zm8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm4 2a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" clipRule="evenodd" />
                                    </svg>

                                    <span className="text-[12px] font-medium" style={{ color: '#1777CF' }}>
                                      {String(fase.comentarios.length).padStart(2, '0')}
                                    </span>
                                  </div>
                                </div>

                                {/* Linha inferior: Responsável à esquerda, dados à direita */}
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-700">
                                    <span className="text-gray-500">Responsável:</span> <span className="font-medium">{fase.responsavel}</span>
                                  </div>
                                  
                                  <div className="text-sm text-gray-700 flex items-center space-x-4">
                                    <span>
                                      <span className="text-gray-500">Entrada:</span> <span className="font-medium">{formatarDataISO(fase.dataEntrada)}</span>
                                    </span>
                                    {fase.dataSaida && (
                                      <span>
                                        <span className="text-gray-500">Saída:</span> <span className="font-medium">{formatarDataISO(fase.dataSaida)}</span>
                                      </span>
                                    )}
                                    <span>
                                      <span className="text-gray-500">Duração:</span> <span className="font-medium">{fase.totalDias} dia{fase.totalDias !== 1 ? 's' : ''}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>                    
                  </div>
                ) : (
                 <div className="text-center py-12 flex flex-col items-center justify-center">
                    <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      Nenhuma etapa encontrada
                    </p>
                    <p className="text-gray-400 text-sm">
                      {termoBusca 
                        ? `Nenhum resultado para "${termoBusca}" em ${tipoFiltro}`
                        : 'Nenhuma etapa encontrada para este cliente.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Comentários */}
      <ModalComentarios
        isOpen={modalComentariosOpen}
        onClose={() => setModalComentariosOpen(false)}
        comentarios={comentariosSelecionados}
        tituloColuna={tituloColunaSelecionada}
      />

      {/* Estilos para scrollbar customizada */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1; 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8; 
        } 
      `}</style>
    </>
  );
};

export { ModalHistoricoCliente };
export default ModalHistoricoCliente;