import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Menu, ChevronDown } from 'lucide-react';
import { useEstadosICMS } from '../EstadosICMSContext';
import { useImpostoRenda } from '../ImpostoRendaContext';

const ResultadoGestor = ({ isOpen, onClose }) => {
  // Hook para acessar os estados do contexto
  const { estadosICMS } = useEstadosICMS();
  const { segmentoTributacaoLucroPresumido, segmentoTributacaoLucroReal, buscarSegmentoPorNome } = useImpostoRenda();
  
  // Estados para o dropdown customizado
  const [isEstadoDropdownOpen, setIsEstadoDropdownOpen] = useState(false);
  const [estadoSearchTerm, setEstadoSearchTerm] = useState('');
  const [isSegmentoDropdownOpen, setIsSegmentoDropdownOpen] = useState(false);
  const [segmentoSearchTerm, setSegmentoSearchTerm] = useState('');
  const [isIncentivoICMSDropdownOpen, setIsIncentivoICMSDropdownOpen] = useState(false);
  const [incentivoICMSSearchTerm, setIncentivoICMSSearchTerm] = useState('');
  const [selectedIncentivoICMSEstado, setSelectedIncentivoICMSEstado] = useState('');
  const [selectedRadioOption, setSelectedRadioOption] = useState('estado'); // 'estado' ou 'incentivo'
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const segmentoDropdownRef = useRef(null);
  const segmentoInputRef = useRef(null);
  const incentivoICMSDropdownRef = useRef(null);
  const incentivoICMSInputRef = useRef(null);
  
  // Estado para armazenar todos os valores editáveis
  const [formData, setFormData] = useState({
    estado: '',
    incentivoICMS: '',
    aliquotaISSQN: 0,
    segmento: '',
    anexoSimplesNacional: 'Anexo I',
    
    // Faturamento
    faturamentoProdutos: 0,
    fatProdMonofasicos: 0,
    faturamentoServicos: 0,
    
    // Custo dos produtos
    custoProdutos: 0,
    custoProdMonofasicos: 0,
    
    // Despesas
    despesasFixas: 0,
    despesasVariaveis: 0,
    proLabore: 0,
    folhaPagamento: 0,
    
    // RET
    impostoUnicoRET: false,
    fgtsRET: false,
  });

  // Estado para controlar qual é o cenário atual do cliente
  const [cenarioAtual, setCenarioAtual] = useState('simples');
  
  // Estado para controlar o menu
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  
  // Funções de formatação
  const formatarMoeda = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d,-]/g, '').replace(',', '.')) : valor;
    if (isNaN(numero)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  };

  const formatarPercentual = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor.replace('%', '').replace(',', '.')) : valor;
    if (isNaN(numero)) return '0,00%';
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero / 100);
  };

  // Lista única de segmentos disponíveis
  const segmentosDisponiveis = useMemo(() => {
    const segmentosLP = segmentoTributacaoLucroPresumido.map(item => item.segmento);
    const segmentosLR = segmentoTributacaoLucroReal.map(item => item.segmento);
    const todosSegmentos = [...new Set([...segmentosLP, ...segmentosLR])];
    return todosSegmentos.sort();
  }, [segmentoTributacaoLucroPresumido, segmentoTributacaoLucroReal]);

  // Estados para controle de dados
  const [dadosLucroPresumido, setDadosLucroPresumido] = useState({
    pis: '0%',
    cofins: '0%',
    presuncaoIR: '0%',
    impostoRenda: '0%',
    presuncaoCSLL: '0%',
    csll: '0%'
  });
  
  const [dadosLucroReal, setDadosLucroReal] = useState({
    pis: '0%',
    cofins: '0%',
    impostoRenda: '0%',
    csll: '0%'
  });
  
  const [segmentoEncontrado, setSegmentoEncontrado] = useState({ lp: true, lr: true });
  const [mensagemErro, setMensagemErro] = useState('');
  
  // Estados filtrados para busca (incluindo opção separadora)
  const filteredEstados = useMemo(() => {
    const separatorOption = { id: 0, estado: '- - - - - - -', percentual: '0%' };
    const allEstados = [separatorOption, ...estadosICMS];
    
    if (!estadoSearchTerm) return allEstados;
    return allEstados.filter(estado => 
      estado.estado.toLowerCase().includes(estadoSearchTerm.toLowerCase())
    );
  }, [estadosICMS, estadoSearchTerm]);

  // Segmentos filtrados para busca
  const filteredSegmentos = useMemo(() => {
    if (!segmentoSearchTerm) return segmentosDisponiveis;
    return segmentosDisponiveis.filter(segmento => 
      segmento.toLowerCase().includes(segmentoSearchTerm.toLowerCase())
    );
  }, [segmentosDisponiveis, segmentoSearchTerm]);

  // Estados filtrados para Incentivo ICMS (incluindo opção separadora)
  const filteredIncentivoICMS = useMemo(() => {
    // Filtra apenas estados com incentivo diferente de 0%
    const estadosComIncentivo = estadosICMS.filter(estado => 
      estado.incentivo && estado.incentivo !== '0%'
    );
    
    // Se todos os estados têm 0% de incentivo, mostra apenas a opção separadora
    const separatorOption = { id: 0, estado: '- - - - - - -', percentual: '', incentivo: '' };
    const estadosParaExibir = estadosComIncentivo.length > 0 ? estadosComIncentivo : [];
    const allEstados = [separatorOption, ...estadosParaExibir];
    
    if (!incentivoICMSSearchTerm) return allEstados;
    return allEstados.filter(estado => 
      estado.estado.toLowerCase().includes(incentivoICMSSearchTerm.toLowerCase())
    );
  }, [estadosICMS, incentivoICMSSearchTerm]);

  // Função para obter porcentagem de ICMS do estado selecionado
  const getICMSPercentage = () => {
    // VERIFICAÇÃO DE SEGMENTO: Se o segmento não for 'Comércio' ou 'Indústria', retorna 0
    if (formData.segmento && formData.segmento !== 'Comércio' && formData.segmento !== 'Indústria') {
      return '0';
    }
    
    // PRIORIDADE 1: Se há estado selecionado no campo Estado e rádio correspondente ativo
    if (selectedRadioOption === 'estado' && formData.estado && formData.estado !== '- - - - - - -') {
      const estadoSelecionado = estadosICMS.find(estado => estado.estado === formData.estado);
      if (estadoSelecionado) {
        return estadoSelecionado.percentual.replace('%', '');
      }
    }
    
    // PRIORIDADE 2: Se há incentivo ICMS selecionado e rádio correspondente ativo
    if (selectedRadioOption === 'incentivo' && selectedIncentivoICMSEstado) {
      const estadoIncentivo = estadosICMS.find(estado => estado.estado === selectedIncentivoICMSEstado);
      if (estadoIncentivo && estadoIncentivo.incentivo) {
        return estadoIncentivo.incentivo.replace('%', '');
      }
    }
    
    // PRIORIDADE 3: Se apenas o campo Incentivo ICMS (%) estiver preenchido (sem campo Estado)
    if (selectedIncentivoICMSEstado && (!formData.estado || formData.estado === '- - - - - - -')) {
      const estadoIncentivo = estadosICMS.find(estado => estado.estado === selectedIncentivoICMSEstado);
      if (estadoIncentivo && estadoIncentivo.incentivo) {
        return estadoIncentivo.incentivo.replace('%', '');
      }
    }
    
    // FALLBACK: Se há estado selecionado mas sem rádio ativo, usa o percentual do estado
    if (formData.estado && formData.estado !== '- - - - - - -') {
      const estadoSelecionado = estadosICMS.find(estado => estado.estado === formData.estado);
      if (estadoSelecionado) {
        return estadoSelecionado.percentual.replace('%', '');
      }
    }
    
    return '0';
  };
  
  // Função para calcular altura máxima do dropdown
  const calculateMaxHeight = () => {
    if (!dropdownRef.current) return 'auto';
    const rect = dropdownRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const availableHeight = windowHeight - rect.bottom - 10; // 10px de margem inferior
    return Math.max(150, Math.min(300, availableHeight)); // Mínimo 150px, máximo 300px
  };
  
  // Efeito para fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsEstadoDropdownOpen(false);
      }
      if (segmentoDropdownRef.current && !segmentoDropdownRef.current.contains(event.target)) {
        setIsSegmentoDropdownOpen(false);
      }
      if (incentivoICMSDropdownRef.current && !incentivoICMSDropdownRef.current.contains(event.target)) {
        setIsIncentivoICMSDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Efeito para recalcular valores quando a seleção do rádio mudar
  useEffect(() => {
    if (formData.estado) {
      // Força recálculo dos dados quando a seleção do rádio muda
      sincronizarDadosSegmento(formData.segmento);
    }
  }, [selectedRadioOption, selectedIncentivoICMSEstado]);
  
  // Função para selecionar estado
  const handleEstadoSelect = (estado) => {
    // Se for a opção separadora, limpa o estado (volta ao placeholder)
    if (estado.estado === '- - - - - - -') {
      handleInputChange('estado', '');
      // Se há incentivo ICMS selecionado, ativa o rádio do incentivo
      if (selectedIncentivoICMSEstado) {
        setSelectedRadioOption('incentivo');
        // Recalcula com base no incentivo ICMS
        setTimeout(() => sincronizarDadosSegmento(formData.segmento), 100);
      } else {
        // Se não há incentivo ICMS selecionado, limpa a seleção do rádio
        setSelectedRadioOption('');
      }
    } else {
      handleInputChange('estado', estado.estado);
      // SEMPRE define o rádio do estado como selecionado quando um estado é escolhido
      setSelectedRadioOption('estado');
      // SEMPRE recalcula imediatamente quando um estado é selecionado
      setTimeout(() => sincronizarDadosSegmento(formData.segmento), 100);
    }
    setIsEstadoDropdownOpen(false);
    setEstadoSearchTerm('');
  };

  // Função para lidar com seleção de segmento
  const handleSegmentoSelect = (segmento) => {
    // Se for a opção separadora, limpa o segmento (volta ao placeholder)
    if (segmento === '- - - - - - -') {
      handleInputChange('segmento', '');
    } else {
      handleInputChange('segmento', segmento);
      sincronizarDadosSegmento(segmento);
    }
    setIsSegmentoDropdownOpen(false);
    setSegmentoSearchTerm('');
  };

  // Função para selecionar Incentivo ICMS
  const handleIncentivoICMSSelect = (estado) => {
    // Se for a opção separadora, limpa o incentivo (volta ao placeholder)
    if (estado.estado === '- - - - - - -') {
      handleInputChange('incentivoICMS', '');
      setSelectedIncentivoICMSEstado('');
      // Se não há estado selecionado no campo Estado, limpa a seleção do rádio
      if (!formData.estado || formData.estado === '- - - - - - -') {
        setSelectedRadioOption('');
      }
    } else {
      // Armazena o estado selecionado para o incentivo ICMS
      handleInputChange('incentivoICMS', estado.estado);
      setSelectedIncentivoICMSEstado(estado.estado);
      
      // SEMPRE define o rádio do incentivo como selecionado quando um incentivo é escolhido
      setSelectedRadioOption('incentivo');
      
      // SEMPRE recalcula imediatamente quando um incentivo ICMS é selecionado
      setTimeout(() => sincronizarDadosSegmento(formData.segmento), 100);
    }
    setIsIncentivoICMSDropdownOpen(false);
    setIncentivoICMSSearchTerm('');
  };

  // Função para sincronizar dados do segmento
  const sincronizarDadosSegmento = (nomeSegmento) => {
    try {
      if (!nomeSegmento || nomeSegmento === '') {
        // Limpar dados se não há segmento selecionado
        setDadosLucroPresumido({
          pis: '0%',
          cofins: '0%',
          presuncaoIR: '0%',
          impostoRenda: '0%',
          presuncaoCSLL: '0%',
          csll: '0%'
        });
        setDadosLucroReal({
          pis: '0%',
          cofins: '0%',
          impostoRenda: '0%',
          csll: '0%'
        });
        setSegmentoEncontrado({ lp: true, lr: true });
        setMensagemErro('');
        return;
      }

      // Validar se a função de busca está disponível
      if (!buscarSegmentoPorNome || typeof buscarSegmentoPorNome !== 'function') {
        setMensagemErro('Erro interno: função de busca não disponível.');
        return;
      }

      // Usar a função centralizada do contexto
      const resultado = buscarSegmentoPorNome(nomeSegmento);
      
      if (!resultado) {
        setMensagemErro('Erro ao buscar dados do segmento.');
        return;
      }
      
      const { lucroPresumido: segmentoLP, lucroReal: segmentoLR, encontrado } = resultado;
      
      const lpEncontrado = !!segmentoLP;
      const lrEncontrado = !!segmentoLR;
    
    // Atualizar dados do Lucro Presumido
    if (lpEncontrado) {
      setDadosLucroPresumido({
        pis: segmentoLP.pis || '0%',
        cofins: segmentoLP.cofins || '0%',
        presuncaoIR: segmentoLP.irPresuncao || '0%',
        impostoRenda: segmentoLP.ir || '0%',
        presuncaoCSLL: segmentoLP.csllPresuncao || '0%',
        csll: segmentoLP.csll || '0%'
      });
    } else {
      setDadosLucroPresumido({
        pis: '0%',
        cofins: '0%',
        presuncaoIR: '0%',
        impostoRenda: '0%',
        presuncaoCSLL: '0%',
        csll: '0%'
      });
    }
    
    // Atualizar dados do Lucro Real
    if (lrEncontrado) {
      setDadosLucroReal({
        pis: segmentoLR.pis || '0%',
        cofins: segmentoLR.cofins || '0%',
        impostoRenda: segmentoLR.ir || '0%',
        csll: segmentoLR.csll || '0%'
      });
    } else {
      setDadosLucroReal({
        pis: '0%',
        cofins: '0%',
        impostoRenda: '0%',
        csll: '0%'
      });
    }
    
    // Atualizar status de segmentos encontrados
    setSegmentoEncontrado({ lp: lpEncontrado, lr: lrEncontrado });
    
    // Definir mensagem de erro se necessário
    if (!lpEncontrado && !lrEncontrado) {
      setMensagemErro(`Segmento não cadastrado no Banco de Dados (Empresas / Lucro Presumido e Lucro Real).`);
    } else if (!lpEncontrado) {
      setMensagemErro(`Segmento não cadastrado no Banco de Dados (Empresas / Lucro Presumido).`);
    } else if (!lrEncontrado) {
      setMensagemErro(`Segmento não cadastrado no Banco de Dados (Empresas / Lucro Real).`);
    } else {
      setMensagemErro('');
    }
    } catch (error) {
      console.error('Erro ao sincronizar dados do segmento:', error);
      setMensagemErro('Erro inesperado ao buscar dados do segmento. Tente novamente.');
      
      // Limpar dados em caso de erro
      setDadosLucroPresumido({
        pis: '0%',
        cofins: '0%',
        presuncaoIR: '0%',
        impostoRenda: '0%',
        presuncaoCSLL: '0%',
        csll: '0%'
      });
      setDadosLucroReal({
        pis: '0%',
        cofins: '0%',
        impostoRenda: '0%',
        csll: '0%'
      });
      setSegmentoEncontrado({ lp: false, lr: false });
    }
  };

  // Função para atualizar os valores
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Se o campo alterado for o segmento, sincronizar dados
    if (field === 'segmento') {
      sincronizarDadosSegmento(value);
    }
  };

  // Cálculos automáticos
  const totalFaturamento = Number(formData.faturamentoProdutos) + 
                           Number(formData.fatProdMonofasicos) + 
                           Number(formData.faturamentoServicos);
  
  const totalCusto = Number(formData.custoProdutos) + 
                     Number(formData.custoProdMonofasicos);

  // Função para converter percentual string para número
  const percentualParaNumero = (percentual) => {
    if (!percentual || percentual === '0%') return 0;
    return parseFloat(percentual.replace('%', '').replace(',', '.')) / 100;
  };



  // Cálculo dos totais para cada regime
  const calcularTotalPresumido = () => {
    const pisRate = percentualParaNumero(dadosLucroPresumido.pis);
    const cofinsRate = percentualParaNumero(dadosLucroPresumido.cofins);
    const irPresuncaoRate = percentualParaNumero(dadosLucroPresumido.presuncaoIR);
    const irRate = percentualParaNumero(dadosLucroPresumido.impostoRenda);
    const csllPresuncaoRate = percentualParaNumero(dadosLucroPresumido.presuncaoCSLL);
    const csllRate = percentualParaNumero(dadosLucroPresumido.csll);
    const icmsRate = Number(getICMSPercentage()) / 100;
    
    return (totalFaturamento * pisRate) +
           (totalFaturamento * cofinsRate) +
           (totalFaturamento * irPresuncaoRate * irRate) +
           (totalFaturamento * csllPresuncaoRate * csllRate) +
           (Number(formData.faturamentoProdutos) * icmsRate) +
           (Number(formData.folhaPagamento) * 0.08) +
           (Number(formData.faturamentoServicos) * (formData.aliquotaISSQN / 100)) +
           (Number(formData.folhaPagamento) * 0.20);
  };

  const calcularTotalReal = () => {
    const pisRate = percentualParaNumero(dadosLucroReal.pis);
    const cofinsRate = percentualParaNumero(dadosLucroReal.cofins);
    const irRate = percentualParaNumero(dadosLucroReal.impostoRenda);
    const csllRate = percentualParaNumero(dadosLucroReal.csll);
    const icmsRate = Number(getICMSPercentage()) / 100;
    
    return (totalFaturamento * pisRate) +
           (totalFaturamento * cofinsRate) +
           ((totalFaturamento - totalCusto) * irRate) +
           ((totalFaturamento - totalCusto) * csllRate) +
           (Number(formData.faturamentoProdutos) * icmsRate) +
           (Number(formData.folhaPagamento) * 0.08) +
           (Number(formData.faturamentoServicos) * (formData.aliquotaISSQN / 100)) +
           (Number(formData.folhaPagamento) * 0.20);
  };

  const calcularTotalSimples = () => {
    const base = totalFaturamento <= 180000 ? totalFaturamento * 0.04 :
                 totalFaturamento <= 360000 ? totalFaturamento * 0.073 :
                 totalFaturamento <= 720000 ? totalFaturamento * 0.095 :
                 totalFaturamento <= 1800000 ? totalFaturamento * 0.107 :
                 totalFaturamento <= 3600000 ? totalFaturamento * 0.143 :
                 totalFaturamento <= 4800000 ? totalFaturamento * 0.19 : 
                 totalFaturamento * 0.33;
    return base + (Number(formData.folhaPagamento) * 0.08);
  };

  const calcularTotalRET = () => {
    return (formData.impostoUnicoRET ? totalFaturamento * 0.04 : 0) +
           (formData.fgtsRET ? Number(formData.folhaPagamento) * 0.08 : 0);
  };

  // Cálculo das taxas efetivas
  const calcularTaxaEfetiva = (total) => {
    return totalFaturamento > 0 ? (total / totalFaturamento * 100) : 0;
  };

  // Ordenação das colunas baseada na taxa efetiva
  const colunasOrdenadas = useMemo(() => {
    const colunas = [
      {
        id: 'presumido',
        nome: 'Lucro Presumido',
        total: calcularTotalPresumido(),
        taxaEfetiva: calcularTaxaEfetiva(calcularTotalPresumido())
      },
      {
        id: 'real',
        nome: 'Lucro Real',
        total: calcularTotalReal(),
        taxaEfetiva: calcularTaxaEfetiva(calcularTotalReal())
      },
      {
        id: 'simples',
        nome: 'Simples Nacional',
        total: calcularTotalSimples(),
        taxaEfetiva: calcularTaxaEfetiva(calcularTotalSimples())
      },
      {
        id: 'ret',
        nome: 'RET - Construção Civil e Incorporação',
        total: calcularTotalRET(),
        taxaEfetiva: calcularTaxaEfetiva(calcularTotalRET())
      }
    ];

    // Ordenar do menor para o maior total
    return [...colunas].sort((a, b) => a.total - b.total);
  }, [formData, totalFaturamento, totalCusto, dadosLucroPresumido, dadosLucroReal]);

  // Definição das cores baseadas na posição
  const coresPosicao = [
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  ];

  if (!isOpen) return null;

  // Componente de Coluna Genérica
  const ColunaComparacao = ({ coluna, posicao, isCenarioAtual }) => {
    const cores = coresPosicao[posicao];
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
        {/* Header com cor baseada na posição - altura fixa */}
        <div className={`flex-shrink-0 h-12 px-4 flex items-center border-b ${cores.border} ${cores.bg}`}>
          <h3 className={`text-sm font-semibold ${cores.text} truncate w-full text-center`} title={coluna.nome}>
            {coluna.nome}
          </h3>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
          {coluna.id === 'presumido' && (
            <>
              {/* Presunções */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Presunções
                </h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-600">Presunção I.R.</span>
                    <span className="text-right font-medium">{dadosLucroPresumido.presuncaoIR || '8,00%'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-600">Presunção CSLL</span>
                    <span className="text-right font-medium">{dadosLucroPresumido.presuncaoCSLL || '12,00%'}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 my-3"></div>
            </>
          )}

          {/* Alíquotas */}
          {(coluna.id === 'presumido' || coluna.id === 'real') && (
            <>
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Alíquotas
                </h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">PIS</span>
                    <span className="text-center font-medium">
                      {coluna.id === 'presumido' ? (dadosLucroPresumido.pis || '0,65%') : (dadosLucroReal.pis || '1,65%')}
                    </span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">COFINS</span>
                    <span className="text-center font-medium">
                      {coluna.id === 'presumido' ? (dadosLucroPresumido.cofins || '3,00%') : (dadosLucroReal.cofins || '7,60%')}
                    </span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600 truncate" title="Imposto de Renda">Imposto de Renda</span>
                    <span className="text-center font-medium">
                      {coluna.id === 'presumido' ? (dadosLucroPresumido.impostoRenda || '15,00%') : (dadosLucroReal.impostoRenda || '15,00%')}
                    </span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">CSLL</span>
                    <span className="text-center font-medium">
                      {coluna.id === 'presumido' ? (dadosLucroPresumido.csll || '9,00%') : (dadosLucroReal.csll || '9,00%')}
                    </span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">ICMS</span>
                    <span className="text-center font-medium">{getICMSPercentage()},00%</span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-600">Difal</span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">ISSQN</span>
                    <span className="text-center font-medium">{Number(formData.aliquotaISSQN).toFixed(2)}%</span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 my-3"></div>
            </>
          )}

          {/* Simples Nacional - Faixas */}
          {coluna.id === 'simples' && (
            <>
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Faixas e Alíquotas
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-600 block mb-1 truncate" title="ICMS por fora acima de R$ 3.600.000,00">
                      ICMS por fora acima de R$ 3.600.000,00
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className="text-gray-900">ICMS</span>
                      <span className="text-center font-medium">20,00%</span>
                      <span className="text-right text-gray-400">R$ 0,00</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">FGTS</span>
                    <span className="text-center font-medium">8,00%</span>
                    <span className="text-right text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs text-gray-600 block mb-1">Simples Nacional</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        {formData.anexoSimplesNacional}
                      </span>
                      <span className="text-xs font-medium">
                        {totalFaturamento <= 180000 ? '4,00%' :
                         totalFaturamento <= 360000 ? '7,30%' :
                         totalFaturamento <= 720000 ? '9,50%' :
                         totalFaturamento <= 1800000 ? '10,70%' :
                         totalFaturamento <= 3600000 ? '14,30%' :
                         totalFaturamento <= 4800000 ? '19,00%' : '33,00%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RET - Configurações */}
          {coluna.id === 'ret' && (
            <>
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                  Configurações
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">Imposto único</span>
                    <span className="text-center font-medium">
                      {formData.impostoUnicoRET ? 'ATIVO' : 'INATIVO'}
                    </span>
                    <span className="text-right"></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-gray-600">FGTS</span>
                    <span className="text-center font-medium">
                      {formData.fgtsRET ? 'ATIVO' : 'INATIVO'}
                    </span>
                    <span className="text-right"></span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 my-3"></div>
            </>
          )}

          {/* Impostos a Pagar */}
          {(coluna.id === 'presumido' || coluna.id === 'real') && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Impostos a Pagar
              </h4>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">PIS</span>
                  <span className="text-right font-medium">
                    R$ {(totalFaturamento * (coluna.id === 'presumido' ? 0.0065 : 0.0165)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">COFINS</span>
                  <span className="text-right font-medium">
                    R$ {(totalFaturamento * (coluna.id === 'presumido' ? 0.03 : 0.076)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">Imposto de Renda</span>
                  <span className="text-right font-medium">
                    R$ {(coluna.id === 'presumido' ? 
                      (totalFaturamento * 0.08 * 0.15) : 
                      ((totalFaturamento - totalCusto) * 0.15)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">CSLL</span>
                  <span className="text-right font-medium">
                    R$ {(coluna.id === 'presumido' ? 
                      (totalFaturamento * 0.12 * 0.09) : 
                      ((totalFaturamento - totalCusto) * 0.09)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">ICMS</span>
                  <span className="text-right font-medium">
                    R$ {(Number(formData.faturamentoProdutos) * (Number(getICMSPercentage()) / 100)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">Difal</span>
                  <span className="text-right font-medium">
                    R$ 0,00
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">FGTS</span>
                  <span className="text-right font-medium">
                    R$ {(Number(formData.folhaPagamento) * 0.08).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">ISSQN</span>
                  <span className="text-right font-medium">
                    R$ {(Number(formData.faturamentoServicos) * (formData.aliquotaISSQN / 100)).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-600">INSS Patronal</span>
                  <span className="text-right font-medium">
                    R$ {(Number(formData.folhaPagamento) * 0.20).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RET - Impostos */}
          {coluna.id === 'ret' && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Impostos a Pagar
              </h4>
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="text-gray-600">Imposto único</span>
                  <span className="text-center"></span>
                  <span className="text-right font-medium">
                    {formatarMoeda(formData.impostoUnicoRET ? (totalFaturamento * 0.04) : 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="text-gray-600">FGTS</span>
                  <span className="text-center"></span>
                  <span className="text-right font-medium">
                    {formatarMoeda(formData.fgtsRET ? (Number(formData.folhaPagamento) * 0.08) : 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com cor baseada na posição - altura fixa */}
        <div className={`flex-shrink-0 border-t ${cores.border} p-4 ${cores.bg}`}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <span className={`font-semibold ${cores.text}`}>TOTAL</span>
            <span className="text-center"></span>
            <span className={`text-right font-bold ${cores.text}`}>
              {formatarMoeda(coluna.total)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <span className={`font-semibold ${cores.text} truncate`} title="TAXA EFETIVA">TAXA EFETIVA</span>
            <span className="text-center"></span>
            <span className={`text-right font-bold ${cores.text}`}>
              {formatarPercentual(coluna.taxaEfetiva)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden p-2.5">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative h-full flex flex-col">
        <div className="relative bg-white rounded-2xl shadow-xl w-full h-full overflow-hidden flex flex-col">
          
          {/* Header Fixo */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 z-20">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isMenuOpen}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 text-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Comparação de Carga Tributária
                </h2>
                {mensagemErro && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg inline-block">
                    {mensagemErro}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Container Principal - Sem scroll externo */}
          <div className="flex-1 overflow-hidden">
            <div className={`grid ${isMenuOpen ? 'grid-cols-[280px_1fr]' : 'grid-cols-1'} h-full transition-all duration-300`}>
              
              {/* Menu Lateral - Primeira Coluna quando aberto */}
              <div className={`bg-gray-50 border-r border-gray-200 overflow-y-auto ${!isMenuOpen && 'hidden'}`}>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Dados de Entrada
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Identificação */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Identificação
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Estado</label>
                          <div className="relative" ref={dropdownRef}>
                            <div
                              className="w-full pl-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setIsEstadoDropdownOpen(!isEstadoDropdownOpen);
                                if (!isEstadoDropdownOpen) {
                                  setTimeout(() => inputRef.current?.focus(), 100);
                                }
                              }}
                            >
                              <span className={formData.estado ? 'text-gray-900' : 'text-gray-400'}>
                                {formData.estado || 'Selecione um estado'}
                              </span>
                              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${
                                 isEstadoDropdownOpen ? 'rotate-180' : ''
                               }`} style={{ marginRight: '10px' }} />
                            </div>
                            
                            {isEstadoDropdownOpen && (
                              <div 
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                                style={{ maxHeight: `${calculateMaxHeight()}px` }}
                              >
                                <div className="p-2 border-b border-gray-100">
                                  <input
                                     ref={inputRef}
                                     type="text"
                                     placeholder="Buscar estado..."
                                     value={estadoSearchTerm}
                                     onChange={(e) => setEstadoSearchTerm(e.target.value)}
                                     className="w-full px-2 py-1 text-xs rounded outline-none"
                                     style={{ border: '1px solid #1777CF' }}
                                     onClick={(e) => e.stopPropagation()}
                                   />
                                </div>
                                <div className="overflow-y-auto" style={{ maxHeight: `${calculateMaxHeight() - 50}px` }}>
                                  {filteredEstados.length > 0 ? (
                                    filteredEstados.map((estado) => (
                                      <div
                                        key={estado.id}
                                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                                          formData.estado === estado.estado ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                        onClick={() => handleEstadoSelect(estado)}
                                      >
                                        <span className="truncate mr-2" style={{maxWidth: '180px'}} title={estado.estado}>{estado.estado}</span>
                                        <span className="text-right font-medium flex-shrink-0">{estado.estado === '- - - - - - -' ? '' : estado.percentual}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                      Nenhum estado encontrado
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Campo dinâmico ICMS do Estado - aparece apenas quando há estado selecionado no campo Estado E no Incentivo ICMS */}
                        {formData.estado && formData.estado !== '- - - - - - -' && selectedIncentivoICMSEstado && (
                          <div>
                            <div className="flex items-center space-x-2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50">
                              <input
                                type="radio"
                                id="radio-estado"
                                name="icms-option"
                                value="estado"
                                checked={selectedRadioOption === 'estado'}
                                onChange={(e) => {
                                  setSelectedRadioOption(e.target.value);
                                  // Recalcula imediatamente quando o rádio muda
                                  setTimeout(() => sincronizarDadosSegmento(formData.segmento), 50);
                                }}
                                className="w-3 h-3 accent-[#1777CF]"
                                style={{
                                  accentColor: '#1777CF'
                                }}
                              />
                              <label htmlFor="radio-estado" className="text-gray-700 cursor-pointer font-medium">
                                {(() => {
                                  const estadoData = estadosICMS.find(e => e.estado === formData.estado);
                                  return estadoData ? estadoData.percentual : '0%';
                                })()}
                              </label>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Incentivo ICMS (%)</label>
                          <div className="relative" ref={incentivoICMSDropdownRef}>
                            <div
                              className="w-full pl-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setIsIncentivoICMSDropdownOpen(!isIncentivoICMSDropdownOpen);
                                if (!isIncentivoICMSDropdownOpen) {
                                  setTimeout(() => incentivoICMSInputRef.current?.focus(), 100);
                                }
                              }}
                            >
                              <span className={formData.incentivoICMS ? 'text-gray-900' : 'text-gray-400'}>
                                {formData.incentivoICMS || 'Selecione um estado'}
                              </span>
                              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${
                                 isIncentivoICMSDropdownOpen ? 'rotate-180' : ''
                               }`} style={{ marginRight: '10px' }} />
                            </div>
                            
                            {isIncentivoICMSDropdownOpen && (
                              <div 
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                                style={{ maxHeight: `${calculateMaxHeight()}px` }}
                              >
                                <div className="p-2 border-b border-gray-100">
                                  <input
                                     ref={incentivoICMSInputRef}
                                     type="text"
                                     placeholder="Buscar estado..."
                                     value={incentivoICMSSearchTerm}
                                     onChange={(e) => setIncentivoICMSSearchTerm(e.target.value)}
                                     className="w-full px-2 py-1 text-xs rounded outline-none"
                                     style={{ border: '1px solid #1777CF' }}
                                     onClick={(e) => e.stopPropagation()}
                                   />
                                </div>
                                <div className="overflow-y-auto" style={{ maxHeight: `${calculateMaxHeight() - 50}px` }}>
                                  {filteredIncentivoICMS.length > 0 ? (
                                    filteredIncentivoICMS.map((estado) => (
                                      <div
                                        key={estado.id}
                                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                                          formData.incentivoICMS === estado.estado ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                        onClick={() => handleIncentivoICMSSelect(estado)}
                                      >
                                        <span className="truncate mr-2" style={{maxWidth: '180px'}} title={estado.estado}>{estado.estado}</span>
                                        <span className="text-right font-medium flex-shrink-0">{estado.estado === '- - - - - - -' ? '' : (estado.incentivo || '0%')}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                      Nenhum estado encontrado
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}  
                          </div>
                        </div>
                        
                        {/* Campo dinâmico Incentivo ICMS - aparece abaixo do select Incentivo ICMS (%) */}
                        {selectedIncentivoICMSEstado && (
                          <div>
                            <div className="flex items-center space-x-2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50">
                              <input
                                type="radio"
                                id="radio-incentivo"
                                name="icms-option"
                                value="incentivo"
                                checked={selectedRadioOption === 'incentivo'}
                                onChange={(e) => {
                                  setSelectedRadioOption(e.target.value);
                                  // Recalcula imediatamente quando o rádio muda
                                  setTimeout(() => sincronizarDadosSegmento(formData.segmento), 50);
                                }}
                                className="w-3 h-3 accent-[#1777CF]"
                                style={{
                                  accentColor: '#1777CF'
                                }}
                              />
                              <label htmlFor="radio-incentivo" className="text-gray-700 cursor-pointer font-medium">
                                {(() => {
                                  const estadoData = estadosICMS.find(e => e.estado === selectedIncentivoICMSEstado);
                                  return estadoData ? (estadoData.incentivo || '0%') : '0%';
                                })()}
                              </label>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Alíquota ISSQN (%)</label>
                          <input
                            type="number"
                            value={formData.aliquotaISSQN}
                            onChange={(e) => handleInputChange('aliquotaISSQN', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Segmento</label>
                          <div className="relative" ref={segmentoDropdownRef}>
                            <div
                              className="w-full pl-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setIsSegmentoDropdownOpen(!isSegmentoDropdownOpen);
                                if (!isSegmentoDropdownOpen) {
                                  setTimeout(() => segmentoInputRef.current?.focus(), 100);
                                }
                              }}
                            >
                              <span className={formData.segmento ? 'text-gray-900' : 'text-gray-400'}>
                                {formData.segmento || 'Selecione um segmento'}
                              </span>
                              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${
                                 isSegmentoDropdownOpen ? 'rotate-180' : ''
                               }`} style={{ marginRight: '10px' }} />
                            </div>
                            
                            {isSegmentoDropdownOpen && (
                              <div 
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                                style={{ maxHeight: `${calculateMaxHeight()}px` }}
                              >
                                <div className="p-2 border-b border-gray-100">
                                  <input
                                     ref={segmentoInputRef}
                                     type="text"
                                     placeholder="Buscar segmento..."
                                     value={segmentoSearchTerm}
                                     onChange={(e) => setSegmentoSearchTerm(e.target.value)}
                                     className="w-full px-2 py-1 text-xs rounded outline-none"
                                     style={{ border: '1px solid #1777CF' }}
                                     onClick={(e) => e.stopPropagation()}
                                   />
                                </div>
                                <div className="overflow-y-auto" style={{ maxHeight: `${calculateMaxHeight() - 50}px` }}>
                                  {/* Opção separadora para resetar */}
                                  <div
                                    className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 text-gray-400 border-b border-gray-200"
                                    onClick={() => handleSegmentoSelect('- - - - - - -')}
                                  >
                                    - - - - - - -
                                  </div>
                                  {filteredSegmentos.length > 0 ? (
                                    filteredSegmentos.map((segmento, index) => (
                                      <div
                                        key={index}
                                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${
                                          formData.segmento === segmento ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                        onClick={() => handleSegmentoSelect(segmento)}
                                      >
                                        {segmento}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 italic">
                                      Nenhum segmento encontrado
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Anexo Simples Nacional</label>
                          <div className="relative">
                            <select
                              value={formData.anexoSimplesNacional}
                              onChange={(e) => handleInputChange('anexoSimplesNacional', e.target.value)}
                              className="w-full px-2 py-1.5 pr-8 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                              <option value="Anexo I">Anexo I</option>
                              <option value="Anexo II">Anexo II</option>
                              <option value="Anexo III">Anexo III</option>
                              <option value="Anexo IV">Anexo IV</option>
                              <option value="Anexo V">Anexo V</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200"></div>

                    {/* Faturamento */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Faturamento
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Faturamento produtos</label>
                          <input
                            type="number"
                            value={formData.faturamentoProdutos}
                            onChange={(e) => handleInputChange('faturamentoProdutos', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Fat. Prod. Monofásicos</label>
                          <input
                            type="number"
                            value={formData.fatProdMonofasicos}
                            onChange={(e) => handleInputChange('fatProdMonofasicos', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Faturamento serviços</label>
                          <input
                            type="number"
                            value={formData.faturamentoServicos}
                            onChange={(e) => handleInputChange('faturamentoServicos', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <label className="text-xs text-gray-600 block mb-1 font-semibold">TOTAL</label>
                          <div className="px-2 py-1.5 bg-blue-50 text-blue-900 rounded-lg text-xs font-medium">
                            R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200"></div>

                    {/* Custo dos produtos */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Custo dos produtos
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Custo dos produtos</label>
                          <input
                            type="number"
                            value={formData.custoProdutos}
                            onChange={(e) => handleInputChange('custoProdutos', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Custo Prod. Monofásicos</label>
                          <input
                            type="number"
                            value={formData.custoProdMonofasicos}
                            onChange={(e) => handleInputChange('custoProdMonofasicos', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <label className="text-xs text-gray-600 block mb-1 font-semibold">TOTAL</label>
                          <div className="px-2 py-1.5 bg-blue-50 text-blue-900 rounded-lg text-xs font-medium">
                            R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200"></div>

                    {/* Despesas */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                        Despesas
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Despesas fixas</label>
                          <input
                            type="number"
                            value={formData.despesasFixas}
                            onChange={(e) => handleInputChange('despesasFixas', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Despesas variáveis</label>
                          <input
                            type="number"
                            value={formData.despesasVariaveis}
                            onChange={(e) => handleInputChange('despesasVariaveis', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Pró-labore</label>
                          <input
                            type="number"
                            value={formData.proLabore}
                            onChange={(e) => handleInputChange('proLabore', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Folha de pagamento</label>
                          <input
                            type="number"
                            value={formData.folhaPagamento}
                            onChange={(e) => handleInputChange('folhaPagamento', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Container das 4 Colunas de Comparação - Ajustado para altura total */}
              <div className="p-6 h-full overflow-hidden">
                <div className="grid grid-cols-4 gap-4 h-full" role="region" aria-live="polite">
                  {colunasOrdenadas.map((coluna, index) => (
                    <ColunaComparacao
                      key={coluna.id}
                      coluna={coluna}
                      posicao={index}
                      isCenarioAtual={cenarioAtual === coluna.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Global Fixo */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 z-20">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                * Os valores são calculados automaticamente com base nos dados inseridos
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-400 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  Salvar Análise
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadoGestor;