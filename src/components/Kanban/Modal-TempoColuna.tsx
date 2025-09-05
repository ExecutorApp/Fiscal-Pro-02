import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Column {
  id: string;
  name: string;
  index: number;
}

interface ModalTempoColumnaProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  columnTitle: string;
  columns?: Column[];
  onSave?: (timeConfig: any) => void;
}

const ModalTempoColuna: React.FC<ModalTempoColumnaProps> = ({
  isOpen,
  onClose,
  columnId,
  columnTitle,
  columns = [],
  onSave
}) => {
  // Estados para controle de tempo
  const [timeControlEnabled, setTimeControlEnabled] = useState(false);
  const [maxTime, setMaxTime] = useState(24);
  const [timeUnit, setTimeUnit] = useState<'horas' | 'dias'>('horas');
  const [timeExceededAction, setTimeExceededAction] = useState<'delete' | 'move' | 'nothing'>('nothing');
  const [moveToColumnId, setMoveToColumnId] = useState('');
  const [alertNearExpiry, setAlertNearExpiry] = useState(true);
  const [highlightExpired, setHighlightExpired] = useState(true);
  
  // Estado para as opções de cards vencidos
  const [expiredCardsAction, setExpiredCardsAction] = useState<'highlight' | 'notification' | 'both'>('highlight');
  // Estado para as opções de alerta próximo ao vencimento
 const [alertAction, setAlertAction] = useState<'highlight' | 'notification' | 'both'>('highlight');
 
 // Estados para dropdowns avançados
 const [showProdutoDropdown, setShowProdutoDropdown] = useState(false);
 const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
 const [showFaseDropdown, setShowFaseDropdown] = useState(false);
 const [searchProduto, setSearchProduto] = useState('');
 const [searchEtapa, setSearchEtapa] = useState('');
 const [searchFase, setSearchFase] = useState('');
 const produtoDropdownRef = useRef<HTMLDivElement>(null);
 const etapaDropdownRef = useRef<HTMLDivElement>(null);
 const faseDropdownRef = useRef<HTMLDivElement>(null);
 const searchProdutoRef = useRef<HTMLInputElement>(null);
 const searchEtapaRef = useRef<HTMLInputElement>(null);
 const searchFaseRef = useRef<HTMLInputElement>(null);


  // Estados para os novos seletores de movimentação
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  
  // Estados para controle de alerta de vencimento
  const [alertTime, setAlertTime] = useState(2);
  const [alertTimeUnit, setAlertTimeUnit] = useState<'horas' | 'dias'>('horas');
  const [alertStyle, setAlertStyle] = useState<'border' | 'background' | 'icon'>('border');

 // Listas de dados para os dropdowns
 const produtosDisponiveis = [
   { value: 'produto1', label: '01 | Produto A' },
   { value: 'produto2', label: '02 | Produto B' },
   { value: 'produto3', label: '03 | Produto C' },
   { value: 'contabilidade', label: '04 | Contabilidade Empresarial' },
   { value: 'consultoria', label: '05 | Consultoria Fiscal e Tributária' },
   { value: 'auditoria', label: '06 | Auditoria Contábil' }
 ];
 
 const etapasDisponiveis = [
   { value: 'fase1', label: '01 | Inicial' },
   { value: 'fase2', label: '02 | Intermediária' },
   { value: 'fase3', label: '03 | Final' },
   { value: 'fase4', label: '04 | Fechamento' }

 ];
 
 const fasesDisponiveis = [
   { value: 'fase1', label: '01 | Inicial' },
   { value: 'fase2', label: '02 | Intermediária' },
   { value: 'fase3', label: '03 | Final' },
   { value: 'fase4', label: '04 | Fechamento' }
 ];
 
 // Filtrar dados baseado na busca
 const produtosFiltrados = produtosDisponiveis.filter(produto =>
   produto.label.toLowerCase().includes(searchProduto.toLowerCase())
 );
 
 const etapasFiltradas = etapasDisponiveis.filter(etapa =>
   etapa.label.toLowerCase().includes(searchEtapa.toLowerCase())
 );
 
 const fasesFiltradas = fasesDisponiveis.filter(fase =>
   fase.label.toLowerCase().includes(searchFase.toLowerCase())
 );
 
 // Funções para obter labels dos selecionados
 const getSelectedProdutoLabel = (value: string) => {
   if (!value) return 'Selecione um produto';
   const produto = produtosDisponiveis.find(p => p.value === value);
   return produto ? produto.label : 'Selecione um produto';
 };
 
 const getSelectedEtapaLabel = (value: string) => {
   if (!value) return 'Selecione uma etapa';
   const etapa = etapasDisponiveis.find(e => e.value === value);
   return etapa ? etapa.label : 'Selecione uma etapa';
 };
 
 const getSelectedFaseLabel = (value: string) => {
   if (!value) return 'Selecione uma fase';
   const fase = fasesDisponiveis.find(f => f.value === value);
   return fase ? fase.label : 'Selecione uma fase';
 };

 // Função para capitalizar primeira letra
 const capitalizeFirstLetter = (str: string) => {
   if (!str) return str;
   return str.charAt(0).toUpperCase() + str.slice(1);
 };

  // Estados para controle de mudanças
  const [originalConfig, setOriginalConfig] = useState({
    timeControlEnabled: false,
    maxTime: 24,
    timeUnit: 'horas' as 'horas' | 'dias',
    timeExceededAction: 'nothing' as 'delete' | 'move' | 'nothing',
    moveToColumnId: '',
    alertNearExpiry: true,
    highlightExpired: true,
    selectedProduct: '',
    selectedStage: '',
    selectedPhase: '',
    alertTime: 2,
    alertTimeUnit: 'horas' as 'horas' | 'dias',
    alertStyle: 'border' as 'border' | 'background' | 'icon',
	expiredCardsAction: 'highlight' as 'highlight' | 'notification' | 'both',
	alertAction: 'highlight' as 'highlight' | 'notification' | 'both'
  });

  // Verificar se há mudanças não salvas
  const hasUnsavedChanges = React.useMemo(() => {
    return (
      timeControlEnabled !== originalConfig.timeControlEnabled ||
      maxTime !== originalConfig.maxTime ||
      timeUnit !== originalConfig.timeUnit ||
      timeExceededAction !== originalConfig.timeExceededAction ||
      moveToColumnId !== originalConfig.moveToColumnId ||
      alertNearExpiry !== originalConfig.alertNearExpiry ||
      highlightExpired !== originalConfig.highlightExpired ||
      selectedProduct !== originalConfig.selectedProduct ||
      selectedStage !== originalConfig.selectedStage ||
      selectedPhase !== originalConfig.selectedPhase ||
      alertTime !== originalConfig.alertTime ||
      alertTimeUnit !== originalConfig.alertTimeUnit ||
      alertStyle !== originalConfig.alertStyle ||
	  expiredCardsAction !== originalConfig.expiredCardsAction ||
	  alertAction !== originalConfig.alertAction
    );
  }, [timeControlEnabled, maxTime, timeUnit, timeExceededAction, moveToColumnId, alertNearExpiry, highlightExpired, selectedProduct, selectedStage, selectedPhase, alertTime, alertTimeUnit, alertStyle, expiredCardsAction, alertAction, originalConfig]);

 // Fechar dropdowns quando clicar fora
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (produtoDropdownRef.current && !produtoDropdownRef.current.contains(event.target as Node)) {
       setShowProdutoDropdown(false);
     }
     if (etapaDropdownRef.current && !etapaDropdownRef.current.contains(event.target as Node)) {
       setShowEtapaDropdown(false);
     }
     if (faseDropdownRef.current && !faseDropdownRef.current.contains(event.target as Node)) {
       setShowFaseDropdown(false);
     }
   };
 
   document.addEventListener('mousedown', handleClickOutside);
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);
 
 // Limpar busca quando dropdowns fecham
 useEffect(() => {
   if (!showProdutoDropdown) setSearchProduto('');
 }, [showProdutoDropdown]);
 
 useEffect(() => {
   if (!showEtapaDropdown) setSearchEtapa('');
 }, [showEtapaDropdown]);
 
 useEffect(() => {
   if (!showFaseDropdown) setSearchFase('');
 }, [showFaseDropdown]);

  // Carregar configurações salvas quando modal abrir
  useEffect(() => {
    if (isOpen) {
      // Carregar configurações do localStorage específicas da coluna
      const savedConfig = loadTimeConfigFromLocalStorage();
      
      setTimeControlEnabled(savedConfig.timeControlEnabled);
      setMaxTime(savedConfig.maxTime);
      setTimeUnit(savedConfig.timeUnit);
      setTimeExceededAction(savedConfig.timeExceededAction);
      setMoveToColumnId(savedConfig.moveToColumnId);
      setAlertNearExpiry(savedConfig.alertNearExpiry);
      setHighlightExpired(savedConfig.highlightExpired);
      setSelectedProduct(savedConfig.selectedProduct || '');
      setSelectedStage(savedConfig.selectedStage || '');
      setSelectedPhase(savedConfig.selectedPhase || '');
      setAlertTime(savedConfig.alertTime || 2);
      setAlertTimeUnit(savedConfig.alertTimeUnit || 'horas');
      setAlertStyle(savedConfig.alertStyle || 'border');
	  setExpiredCardsAction(savedConfig.expiredCardsAction || 'highlight');
	  setAlertAction(savedConfig.alertAction || 'highlight');

      // Salvar estado original para comparação
      setOriginalConfig({
        timeControlEnabled: savedConfig.timeControlEnabled,
        maxTime: savedConfig.maxTime,
        timeUnit: savedConfig.timeUnit,
        timeExceededAction: savedConfig.timeExceededAction,
        moveToColumnId: savedConfig.moveToColumnId,
        alertNearExpiry: savedConfig.alertNearExpiry,
        highlightExpired: savedConfig.highlightExpired,
        selectedProduct: savedConfig.selectedProduct || '',
        selectedStage: savedConfig.selectedStage || '',
        selectedPhase: savedConfig.selectedPhase || '',
        alertTime: savedConfig.alertTime || 2,
        alertTimeUnit: savedConfig.alertTimeUnit || 'horas',
        alertStyle: savedConfig.alertStyle || 'border',
		expiredCardsAction: savedConfig.expiredCardsAction || 'highlight',
		alertAction: savedConfig.alertAction || 'highlight'
      });
    }
  }, [isOpen, columnId]);

  // Função para carregar configurações do localStorage
  const loadTimeConfigFromLocalStorage = () => {
    try {
      const storageKey = `modal_tempo_coluna_${columnId}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData.config || {
          timeControlEnabled: false,
          maxTime: 24,
          timeUnit: 'horas',
          timeExceededAction: 'nothing',
          moveToColumnId: '',
          alertNearExpiry: true,
          highlightExpired: true,
          selectedProduct: '',
          selectedStage: '',
          selectedPhase: '',
          alertTime: 2,
          alertTimeUnit: 'horas',
          alertStyle: 'border',
		  expiredCardsAction: 'highlight',
		  alertAction: 'highlight'
        };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de tempo:', error);
    }
    
    return {
      timeControlEnabled: false,
      maxTime: 24,
      timeUnit: 'horas',
      timeExceededAction: 'nothing',
      moveToColumnId: '',
      alertNearExpiry: true,
      highlightExpired: true,
      selectedProduct: '',
      selectedStage: '',
      selectedPhase: '',
      alertTime: 2,
      alertTimeUnit: 'horas',
      alertStyle: 'border',
	  expiredCardsAction: 'highlight',
	  alertAction: 'highlight'
    };
  };

  // Função para salvar configurações no localStorage
  const saveTimeConfigToLocalStorage = (config: any) => {
    try {
      const storageKey = `modal_tempo_coluna_${columnId}`;
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        columnId: columnId,
        config: config
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`💾 Configurações de tempo salvas para coluna ${columnId}`);
    } catch (error) {
      console.error('Erro ao salvar configurações de tempo:', error);
    }
  };

  // Função para salvar mudanças
  const handleSaveChanges = () => {
    const currentConfig = {
      timeControlEnabled,
      maxTime,
      timeUnit,
      timeExceededAction,
      moveToColumnId,
      alertNearExpiry,
      highlightExpired,
      selectedProduct,
      selectedStage,
      selectedPhase,
      alertTime,
      alertTimeUnit,
      alertStyle,
	  expiredCardsAction,
	  alertAction
    };

    // Salvar no localStorage
    saveTimeConfigToLocalStorage(currentConfig);

    // Callback para componente pai se fornecido
    if (onSave) {
      onSave(currentConfig);
    }

    // Atualizar estado original
    setOriginalConfig(currentConfig);

    console.log(`✅ Configurações de tempo salvas para coluna ${columnTitle}`);
    onClose();
  };

  // Função para cancelar mudanças
  const handleCancel = () => {
    // Restaurar valores originais
    setTimeControlEnabled(originalConfig.timeControlEnabled);
    setMaxTime(originalConfig.maxTime);
    setTimeUnit(originalConfig.timeUnit);
    setTimeExceededAction(originalConfig.timeExceededAction);
    setMoveToColumnId(originalConfig.moveToColumnId);
    setAlertNearExpiry(originalConfig.alertNearExpiry);
    setHighlightExpired(originalConfig.highlightExpired);
    setSelectedProduct(originalConfig.selectedProduct);
    setSelectedStage(originalConfig.selectedStage);
    setSelectedPhase(originalConfig.selectedPhase);
    setAlertTime(originalConfig.alertTime);
    setAlertTimeUnit(originalConfig.alertTimeUnit);
    setAlertStyle(originalConfig.alertStyle);
	setExpiredCardsAction(originalConfig.expiredCardsAction);
	setAlertAction(originalConfig.alertAction);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Estilos para scrollbar customizada */}
      <style>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
          border: none;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
        .modern-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* LAYOUT CORRIGIDO: Container principal com altura controlada e overflow controlado */}
      <div className="relative h-full overflow-hidden">
        
        {/* ÁREA DE CONTEÚDO: altura adaptativa baseada no estado do controle de tempo */}
        <div 
          className={`px-[10px] pr-2 pt-0 ${timeControlEnabled ? 'overflow-y-auto modern-scrollbar' : 'overflow-hidden'}`}
          style={{ 
            height: timeControlEnabled ? 'calc(100% - 80px)' : '300px',
            maxHeight: 'calc(100% - 80px)',
            minHeight: timeControlEnabled ? 'calc(100% - 80px)' : '300px'
          }}
        >
          <div className="space-y-5 pb-6">
            {/* Controle de Tempo */}
            <div className="space-y-3 mt-2">
              <h4 className="font-medium ml-[5px] text-gray-700 -mt-3">Controle de Tempo</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Ativar controle de tempo</p>
                    <p className="text-xs text-gray-500">Monitore o tempo dos cards nesta coluna</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeControlEnabled}
                    onChange={(e) => setTimeControlEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1777CF]"></div>
                </label>
              </div>
            </div>

            {/* Configurações de Tempo */}
            {timeControlEnabled && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium ml-[5px] text-gray-700">Tempo Máximo</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        value={maxTime}
                        onChange={(e) => setMaxTime(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] focus:outline-none transition-all duration-200"
                        placeholder="Tempo máximo"
                      />
                    </div>
                    <div className="flex-1">
                      <select
                        value={timeUnit}
                        onChange={(e) => setTimeUnit(e.target.value as 'horas' | 'dias')}
                        className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] focus:outline-none transition-all duration-200 appearance-none bg-white"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 10px center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '16px'
                        }}
                      >
                        <option value="horas">Horas</option>
                        <option value="dias">Dias</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-[5px]">
                    Cards que ficarem mais de {maxTime} {timeUnit} nesta coluna serão processados conforme a ação selecionada abaixo
                  </p>
                  
                  {/* Divisória após descrição do tempo máximo */}
                  <div className="border-t border-gray-200 mt-4 mb-2"></div>
                </div>

                {/* Ação quando tempo máximo for atingido */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-medium ml-[5px] text-gray-700">Ação quando o tempo máximo for atingido</h4>
                  <div className="space-y-4">
                    {/* Não fazer nada */}
                    <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white">
                      <input
                        type="radio"
                        name="timeExceededAction"
                        value="nothing"
                        checked={timeExceededAction === 'nothing'}
                        onChange={(e) => setTimeExceededAction(e.target.value as 'delete' | 'move' | 'nothing')}
                        className="w-[18px] h-[18px] text-[#1777CF] focus:outline-none border-2 border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Não fazer nada</p>
                        <p className="text-xs text-gray-500">Apenas destacar o card como vencido</p>
                      </div>
                    </label>

                    {/* Mover para outra coluna */}
                    <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white">
                      <input 
                        type="radio"
                        name="timeExceededAction"
                        value="move"
                        checked={timeExceededAction === 'move'}
                        onChange={(e) => setTimeExceededAction(e.target.value as 'delete' | 'move' | 'nothing')}
                        className="w-[18px] h-[18px] text-[#1777CF] focus:outline-none border-2 border-gray-300"
                      />
                     <div>
                       <p className="text-sm font-medium text-gray-700">Mover para</p>
                      <p className="text-xs text-gray-500">Transferir automaticamente o card para outra coluna</p>
                    </div>
                    </label>
					
					                   {/* Dropdowns - aparecem quando "Mover para" está selecionado */}
                   {timeExceededAction === 'move' && (
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                       <p className="text-sm font-medium text-gray-700">Transferir automaticamente seus contatos para:</p>
                       
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Produto</label>
                              <div className="relative" ref={produtoDropdownRef}>
                                <button
                                  className="w-full h-[36px] px-[12px] bg-[#FFFFFF] border border-blue-200 rounded-lg text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0"
                                  onClick={() => setShowProdutoDropdown(!showProdutoDropdown)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="truncate block text-left text-sm">
                                      {getSelectedProdutoLabel(selectedProduct)}
                                    </span>
                                  </div>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6,9 12,15 18,9"/>
                                  </svg>
                                </button>
                                
                                {showProdutoDropdown && (
                                  <div className="absolute top-[38px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[200px] overflow-hidden z-[60]">
                                    {/* Barra de Busca */}
                                    <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                      <input
                                        ref={searchProdutoRef}
                                        type="text"
                                        placeholder="Buscar produtos..."
                                        value={searchProduto}
                                        onChange={(e) => setSearchProduto(capitalizeFirstLetter(e.target.value))}
                                        className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[6px] text-[14px] focus:outline-none focus:ring-[0.5px] focus:ring-[#1777CF] focus:border-[#1777CF]"
                                      />
                                    </div>
                                    
                                    {/* Lista de Produtos */}
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {produtosFiltrados.length > 0 ? (
                                        produtosFiltrados.map((produto, index) => (
                                          <div key={produto.value}>
                                            <button
                                              className="w-full px-[12px] py-[8px] text-left text-[14px] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-between"
                                              onClick={() => {
                                                setSelectedProduct(produto.value);
                                                setShowProdutoDropdown(false);
                                              }}
                                            >
                                              <span>{produto.label}</span>
                                            </button>
                                            {index < produtosFiltrados.length - 1 && (
                                              <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-[16px] text-center text-[#6B7280] text-[14px]">
                                          Nenhum produto encontrado
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Dropdown Etapas */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Etapas</label>
                              <div className="relative" ref={etapaDropdownRef}>
                                <button
                                  className="w-full h-[36px] px-[12px] bg-[#FFFFFF] border border-blue-200 rounded-lg text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0"
                                  onClick={() => setShowEtapaDropdown(!showEtapaDropdown)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="truncate block text-left text-sm">
                                      {getSelectedEtapaLabel(selectedStage)}
                                    </span>
                                  </div>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6,9 12,15 18,9"/>
                                  </svg>
                                </button>
                                
                                {showEtapaDropdown && (
                                  <div className="absolute top-[38px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[200px] overflow-hidden z-[60]">
                                    {/* Barra de Busca */}
                                    <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                      <input
                                        ref={searchEtapaRef}
                                        type="text"
                                        placeholder="Buscar etapas..."
                                        value={searchEtapa}
                                        onChange={(e) => setSearchEtapa(capitalizeFirstLetter(e.target.value))}
                                        className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[6px] text-[14px] focus:outline-none focus:ring-[0.5px] focus:ring-[#1777CF] focus:border-[#1777CF]"
                                      />
                                    </div>
                                    
                                    {/* Lista de Etapas */}
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {etapasFiltradas.length > 0 ? (
                                        etapasFiltradas.map((etapa, index) => (
                                          <div key={etapa.value}>
                                            <button
                                              className="w-full px-[12px] py-[8px] text-left text-[14px] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-between"
                                              onClick={() => {
                                                setSelectedStage(etapa.value);
                                                setShowEtapaDropdown(false);
                                              }}
                                            >
                                              <span>{etapa.label}</span>
                                            </button>
                                            {index < etapasFiltradas.length - 1 && (
                                              <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-[16px] text-center text-[#6B7280] text-[14px]">
                                          Nenhuma etapa encontrada
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Dropdown Fases */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Fases</label>
                              <div className="relative" ref={faseDropdownRef}>
                                <button
                                  className="w-full h-[36px] px-[12px] bg-[#FFFFFF] border border-blue-200 rounded-lg text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0"
                                  onClick={() => setShowFaseDropdown(!showFaseDropdown)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="truncate block text-left text-sm">
                                      {getSelectedFaseLabel(selectedPhase)}
                                    </span>
                                  </div>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6,9 12,15 18,9"/>
                                  </svg>
                                </button>
                                
                                {showFaseDropdown && (
                                  <div className="absolute top-[38px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[200px] overflow-hidden z-[60]">
                                    {/* Barra de Busca */}
                                    <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                      <input
                                        ref={searchFaseRef}
                                        type="text"
                                        placeholder="Buscar fases..."
                                        value={searchFase}
                                        onChange={(e) => setSearchFase(capitalizeFirstLetter(e.target.value))}
                                        className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[6px] text-[14px] focus:outline-none focus:ring-[0.5px] focus:ring-[#1777CF] focus:border-[#1777CF]"
                                      />
                                    </div>
                                    
                                    {/* Lista de Fases */}
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {fasesFiltradas.length > 0 ? (
                                        fasesFiltradas.map((fase, index) => (
                                          <div key={fase.value}>
                                            <button
                                              className="w-full px-[12px] py-[8px] text-left text-[14px] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-between"
                                              onClick={() => {
                                                setSelectedPhase(fase.value);
                                                setShowFaseDropdown(false);
                                              }}
                                            >
                                              <span>{fase.label}</span>
                                            </button>
                                            {index < fasesFiltradas.length - 1 && (
                                              <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-[16px] text-center text-[#6B7280] text-[14px]">
                                          Nenhuma fase encontrada
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                     </div>
                   )}


                    {/* Deletar card */}
                    <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white">
                      <input
                        type="radio"
                        name="timeExceededAction"
                        value="delete"
                        checked={timeExceededAction === 'delete'}
                        onChange={(e) => setTimeExceededAction(e.target.value as 'delete' | 'move' | 'nothing')}
                        className="w-[18px] h-[18px] text-[#1777CF] focus:outline-none border-2 border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Deletar card</p>
                        <p className="text-xs text-gray-500">Remover automaticamente o card do quadro</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Configurações Adicionais */}
                <div className="space-y-3">
                  <h4 className="font-medium ml-[5px] text-gray-700">Configurações Adicionais</h4>
                  <div className="space-y-3">
                    {/* Alertar quando próximo ao vencimento */}
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Alertar quando próximo ao vencimento</p>
                          <p className="text-xs text-gray-500">Destacar cards que estão próximos do limite de tempo</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alertNearExpiry}
                          onChange={(e) => setAlertNearExpiry(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1777CF]"></div>
                      </label>
                    </label>

                   {/* Configurações de alerta - aparecem quando ativado */}
                   {alertNearExpiry && (
                     <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                       {/* Tempo de antecedência para alerta */}
                       <div className="space-y-3">
                         <p className="text-sm font-medium text-gray-700">Tempo de antecedência para alerta</p>
                         <div className="flex gap-3">
                           <div className="flex-1">
                             <input
                               type="number"
                               min="1"
                               value={alertTime}
                               onChange={(e) => setAlertTime(Number(e.target.value))}
                               className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition-all duration-200"
                               placeholder="Tempo de alerta"
                             />
                           </div>
                           <div className="flex-1">
                             <select
                               value={alertTimeUnit}
                               onChange={(e) => setAlertTimeUnit(e.target.value as 'horas' | 'dias')}
                               className="w-full px-4 py-2 pr-12 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition-all duration-200 appearance-none bg-white"
                               style={{
                                 backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                 backgroundPosition: 'right 10px center',
                                 backgroundRepeat: 'no-repeat',
                                 backgroundSize: '16px'
                               }}
                             >
                               <option value="horas">Horas</option>
                               <option value="dias">Dias</option>
                             </select>
                           </div>
                         </div>
                       </div>
                       
                       {/* Opções de ação para alerta próximo ao vencimento */}
                       <div className="space-y-2">
                         {/* Opção 1: Apenas destacar */}
                         <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-orange-100">
                           <input
                             type="radio"
                             name="alertAction"
                             value="highlight"
                             checked={alertAction === 'highlight'}
                             onChange={(e) => setAlertAction(e.target.value as 'highlight' | 'notification' | 'both')}
                             className="w-4 h-4 text-[#1777CF] focus:outline-none"
                           />
                           <div>
                             <p className="text-sm font-medium text-gray-700">Apenas destacar os cards</p>
                             <p className="text-xs text-gray-500">Aplicar destaque visual nos cards próximos ao vencimento</p>
                           </div>
                         </label>
                         
                         {/* Opção 2: Apenas notificar */}
                         <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-orange-100">
                           <input
                             type="radio"
                             name="alertAction"
                             value="notification"
                             checked={alertAction === 'notification'}
                             onChange={(e) => setAlertAction(e.target.value as 'highlight' | 'notification' | 'both')}
                             className="w-4 h-4 text-[#1777CF] focus:outline-none"
                           />
                           <div>
                             <p className="text-sm font-medium text-gray-700">Apenas enviar notificação</p>
                             <p className="text-xs text-gray-500">Enviar notificação quando cards estiverem próximos ao vencimento</p>
                           </div>
                         </label>
                         
                         {/* Opção 3: Ambos */}
                         <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-orange-100">
                           <input
                             type="radio"
                             name="alertAction"
                             value="both"
                             checked={alertAction === 'both'}
                             onChange={(e) => setAlertAction(e.target.value as 'highlight' | 'notification' | 'both')}
                             className="w-4 h-4 text-[#1777CF] focus:outline-none"
                           />
                           <div>
                             <p className="text-sm font-medium text-gray-700">Destacar os cards + Enviar notificação</p>
                             <p className="text-xs text-gray-500">Combinar destaque visual e notificação</p>
                           </div>
                         </label>
                       </div>
                     </div>
                   )}



                   {/* Destacar cards vencidos */}
                   <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <div>
                         <p className="text-sm font-medium text-gray-700">Destacar cards vencidos</p>
                         <p className="text-xs text-gray-500">Marcar visualmente cards que excederam o tempo limite</p>
                       </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         checked={highlightExpired}
                         onChange={(e) => setHighlightExpired(e.target.checked)}
                         className="sr-only peer"
                       />
                       <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1777CF]"></div>
                     </label>
                   </label>
                   
                   {/* Opções de ação para cards vencidos - aparecem quando ativado */}
                   {highlightExpired && (
                     <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                       {/* Opção 1: Apenas destacar */}
                       <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-red-100">
                         <input
                           type="radio"
                           name="expiredCardsAction"
                           value="highlight"
                           checked={expiredCardsAction === 'highlight'}
                           onChange={(e) => setExpiredCardsAction(e.target.value as 'highlight' | 'notification' | 'both')}
                           className="w-4 h-4 text-[#1777CF] focus:outline-none"
                         />
                         <div>
                           <p className="text-sm font-medium text-gray-700">Apenas destacar os cards</p>
                           <p className="text-xs text-gray-500">Aplicar destaque visual nos cards vencidos</p>
                         </div>
                       </label>
                       
                       {/* Opção 2: Apenas notificar */}
                       <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-red-100">
                         <input
                           type="radio"
                           name="expiredCardsAction"
                           value="notification"
                           checked={expiredCardsAction === 'notification'}
                           onChange={(e) => setExpiredCardsAction(e.target.value as 'highlight' | 'notification' | 'both')}
                           className="w-4 h-4 text-[#1777CF] focus:outline-none"
                         />
                         <div>
                           <p className="text-sm font-medium text-gray-700">Apenas enviar notificação</p>
                           <p className="text-xs text-gray-500">Enviar notificação quando cards vencerem</p>
                         </div>
                       </label>
                       
                       {/* Opção 3: Ambos */}
                       <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-red-100">
                         <input
                           type="radio"
                           name="expiredCardsAction"
                           value="both"
                           checked={expiredCardsAction === 'both'}
                           onChange={(e) => setExpiredCardsAction(e.target.value as 'highlight' | 'notification' | 'both')}
                           className="w-4 h-4 text-[#1777CF] focus:outline-none"
                         />
                         <div>
                           <p className="text-sm font-medium text-gray-700">Destacar os cards + Enviar notificação</p>
                           <p className="text-xs text-gray-500">Combinar destaque visual e notificação</p>
                         </div>
                       </label>
                     </div>
                   )}



                  </div>
                </div>
              </>
            )}

            {/* Mensagem quando controle de tempo está desativado */}
            {!timeControlEnabled && (
              <div className="text-center py-6 text-gray-500 -mt-4">
                <Clock size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-600 mb-1">Controle de Tempo Desativado</p>
                <p className="text-sm">Ative o controle de tempo para configurar limites e ações automáticas</p>
              </div>
            )}
          </div>
        </div>

        {/* FAIXA INFERIOR FIXA: padrão igual às outras abas */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-100 rounded-b-xl"
          style={{ 
            height: '80px', 
            zIndex: 9999,
            minHeight: '80px',
            maxHeight: '80px',
            position: 'absolute',
            bottom: '0px',
            width: '100%'
          }}
        >
          <div className="flex items-center justify-between p-6 h-full">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                hasUnsavedChanges
                  ? "bg-[#1777CF] hover:bg-[#1565c0] text-white hover:shadow-md transform hover:scale-105"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
        
      </div>
    </>
  ); 
};

export default ModalTempoColuna;