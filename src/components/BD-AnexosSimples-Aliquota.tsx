import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Imposto {
  id: string;
  descricao: string;
  percentual: number;
}

interface ModalAliquotaProps {
  isOpen: boolean;
  onClose: () => void;
  faixaReceita?: string;
  anexoNome?: string;
  impostos: Imposto[];
  onSave: (impostos: Imposto[], total: number) => void;
}


const BD_AnexosSimples_Aliquota: React.FC<ModalAliquotaProps> = ({
  isOpen,
  onClose,
  faixaReceita,
  anexoNome,
  impostos: impostosIniciais,
  onSave
}) => {



  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImposto, setNewImposto] = useState({ descricao: '', percentual: 0 });
  const [percentualInput, setPercentualInput] = useState('');
  const [percentualInputs, setPercentualInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (impostosIniciais.length > 0) {
      setImpostos(impostosIniciais);
    }
    // Sempre inicializar o percentualInputs como vazio para permitir formatação dinâmica
    setPercentualInputs({});
  }, [impostosIniciais]);

  useEffect(() => {
    if (showAddModal) {
      // Reset dos campos quando abrir o modal
      setNewImposto({ descricao: '', percentual: 0 });
      setPercentualInput('');
      // Focus no primeiro input quando o modal abrir
      setTimeout(() => {
        const firstInput = document.querySelector('#add-imposto-descricao') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [showAddModal]);

  // Função para formatação automática de porcentagem (padrão do sistema)
  const formatPercentage = (value: string) => {
    if (!value || value.trim() === '') return value
    
    let cleanValue = value.trim()
    
    if (cleanValue.endsWith('%')) {
      return cleanValue
    }
    
    if (!isNaN(parseFloat(cleanValue))) {
      return cleanValue + '%'
    }
    
    return cleanValue
  }

  // Função para remover foco ao pressionar Enter (padrão do sistema)
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // Função para aplicar formatação apenas ao sair do campo (padrão do sistema)
  const handlePercentageBlur = (id: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    // Atualizar o estado do imposto com o valor numérico
    const numericValue = parseFloat(formattedValue.replace('%', '').replace(',', '.')) || 0
    atualizarImposto(id, 'percentual', numericValue);
    
    // Atualizar o input visual com valor formatado
    setPercentualInputs(prev => ({
      ...prev,
      [id]: formattedValue
    }));
  }

  // Função para aplicar formatação no modal de adição (padrão do sistema)
  const handleModalPercentageBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    // Converter para número para o estado
    const numericValue = parseFloat(formattedValue.replace('%', '').replace(',', '.')) || 0
    
    setNewImposto(prev => ({ ...prev, percentual: numericValue }));
    setPercentualInput(formattedValue);
  }

  const calcularTotal = (listaImpostos: Imposto[]) => {
    return listaImpostos.reduce((total, imposto) => total + imposto.percentual, 0);
  };

  const adicionarImposto = () => {
    setShowAddModal(true);
  };

  const confirmarAdicao = () => {
    if (newImposto.descricao.trim() === '') return;
    
    const novoId = Date.now().toString();
    const novoImpostoCompleto: Imposto = {
      id: novoId,
      descricao: newImposto.descricao,
      percentual: newImposto.percentual
    };
    
    setImpostos([...impostos, novoImpostoCompleto]);
    setNewImposto({ descricao: '', percentual: 0 });
    setPercentualInput('');
    setShowAddModal(false);
  };

  const cancelarAdicao = () => {
    setNewImposto({ descricao: '', percentual: 0 });
    setPercentualInput('');
    setShowAddModal(false);
  };

  const handleKeyPressModal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      
      // Se for o campo de percentual, apenas perde o foco
      if (target.id === 'add-imposto-percentual') {
        target.blur();
        return;
      }
      
      // Se for o campo de descrição e tiver conteúdo, confirma adição
      if (target.id === 'add-imposto-descricao' && newImposto.descricao.trim()) {
        confirmarAdicao();
      }
    }
    
    if (e.key === 'Escape') {
      cancelarAdicao();
    }
  };

  const atualizarImposto = (id: string, campo: keyof Imposto, valor: string | number) => {
    setImpostos(impostos.map(imposto => 
      imposto.id === id 
        ? { ...imposto, [campo]: valor }
        : imposto
    ));
  };

  const removerImposto = (id: string) => {
    setImpostos(impostos.filter(imposto => imposto.id !== id));
  };

  const handleSave = () => {
    const total = calcularTotal(impostos);
    onSave(impostos, total);
    onClose();
  };

  const formatDisplayPercentual = (value: number): string => {
    if (value === 0) return '';
    return value.toFixed(2).replace('.', ',') + '%';
  };

  if (!isOpen) return null;

  const total = calcularTotal(impostos);

  return (
    <>
      <style jsx={true}>{`
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
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
         <div className="bg-white rounded-2xl shadow-xl w-[700px] h-[600px] flex flex-col relative">
          {/* Header */}
          <div className="pl-[20px] pr-[20px] pt-[20px] pb-[20px] border-b border-[#E5E7EB] rounded-t-[16px]">
            <div className="text-center mb-[50px]">
              <h2 className="text-xl font-semibold text-[#1F2937] font-inter mb-2">Impostos Embutidos</h2>
            </div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                {anexoNome && (
                  <p className="text-[15px] font-medium text-[#374151] font-inter mb-1">
                    {anexoNome}
                  </p>
                )}
                {faixaReceita && (
                  <p className="text-[15px] text-[#6B7280] font-inter">
                    Faixa: {faixaReceita}
                  </p>
                )}
              </div>
              <button
                onClick={adicionarImposto}
                className="flex items-center gap-[5px] px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors text-sm font-medium font-inter"
              >
                <Plus size={16} /> 
                Adicionar Imposto
              </button>
            </div>


         <button
           onClick={onClose}
           className="absolute top-5 right-6 w-[40px] h-[40px] border border-[#D1D5DB] hover:bg-[#F3F4F6] rounded-lg transition-colors flex items-center justify-center text-[#6B7280]"
         >
           <X size={20} />
         </button>

          </div> 

          <div className="py-4 bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <div className="grid grid-cols-12 gap-[0px] text-sm font-semibold text-[#374151] font-inter pl-[20px] pr-[0px]">
              <div className="col-span-7">Descrição</div>
              <div className="col-span-4 text-center pl-[55px] ml-[0px]">Percentual</div>
              <div className="col-span-1"></div> 
            </div>
          </div>
 
          {/* Content */}
          <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] my-[10px]">
            {impostos.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">
                <p className="text-sm font-inter">Nenhum imposto adicionado ainda.</p>
                <p className="text-xs mt-1 font-inter">Use o botão "Adicionar Imposto" para começar.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {impostos.map((imposto, index) => ( 
                    <div key={imposto.id} className="grid grid-cols-12 gap-[20px] items-center py-[15px] pl-[20px] pr-[10px] hover:bg-[#F9FAFB] transition-colors">  
                    <div className="col-span-8">
                      <input  
                        type="text"
                        value={imposto.descricao}
                        onChange={(e) => atualizarImposto(imposto.id, 'descricao', e.target.value)}
                        placeholder=""
                        className="w-full px-[0px] py-2 outline-none text-sm font-inter text-[#1F2937] bg-transparent h-8"
                      />
                    </div>
                    <div className="col-span-3 flex justify-center pr-[0px] ml-[30px]">
                      <input
                        type="text"
                        value={
                          percentualInputs[imposto.id] !== undefined 
                            ? percentualInputs[imposto.id] 
                            : formatDisplayPercentual(imposto.percentual)
                        }
                        onChange={(e) => {
                          setPercentualInputs(prev => ({
                            ...prev,
                            [imposto.id]: e.target.value
                          }));
                        }}
                        onBlur={(e) => handlePercentageBlur(imposto.id, e)}
                        onKeyDown={handleEnterKeyPress}
                        placeholder="0%"
                        className="w-32 h-8 px-3 border border-[#D1D5DB] rounded-[6px] focus:ring-2 focus:ring-[#1777CF] focus:border-transparent outline-none text-center text-sm font-inter text-[#1F2937]"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removerImposto(imposto.id)}
                        className="w-8 h-8 border border-[#D1D5DB] text-[#6B7280] hover:bg-[#F3F4F6] rounded-[6px] transition-colors flex items-center justify-center"
                        title="Remover imposto"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Total */}
          <div className="border-t border-[#E5E7EB] pl-[20px] pr-[20px] py-5 bg-[#F8FAFC] rounded-b-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[18px] font-semibold text-[#1F2937] font-inter">
                  Total da Alíquota:
                </span>
                <span className="text-[18px] font-bold text-[#1777CF] font-inter">
                  {total.toFixed(2).replace('.', ',')}%
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium font-inter"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors font-medium font-inter"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Imposto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"> 
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E5E7EB] rounded-t-lg">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[#1F2937] font-inter">Adicionar Imposto</h2>
              </div>
             <button
                onClick={cancelarAdicao}
                className="absolute top-5 right-6 text-3xl w-8 h-8 border border-[#D1D5DB] hover:bg-[#F3F4F6] rounded-lg transition-colors flex items-center justify-center text-[#6B7280] leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2 font-inter">
                  Descrição do Imposto
                </label>
                <input
                  id="add-imposto-descricao"
                  type="text"
                  value={newImposto.descricao}
                  onChange={(e) => setNewImposto({ ...newImposto, descricao: e.target.value })}
                  onKeyDown={handleKeyPressModal}
                  placeholder="Ex: IRPJ, CSLL, PIS/PASEP..."
                  className="w-full h-10 px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-transparent outline-none text-sm font-inter text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2 font-inter">
                  Percentual (%)
                </label>
                <input
                  id="add-imposto-percentual"
                  type="text"
                  value={percentualInput}
                  onChange={(e) => setPercentualInput(e.target.value)}
                  onBlur={handleModalPercentageBlur}
                  onKeyDown={handleKeyPressModal}
                  placeholder="0%"
                  className="w-full h-10 px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-transparent outline-none text-center text-sm font-inter text-[#1F2937]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E7EB] px-6 py-5 bg-[#F8FAFC] rounded-b-[16px]">
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelarAdicao}
                  className="px-6 py-2 border border-[#D1D5DB] text-[#374151] rounded-[16px] hover:bg-[#F9FAFB] transition-colors font-medium font-inter"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAdicao}
                  disabled={!newImposto.descricao.trim()}
                  className="px-6 py-2 bg-[#1777CF] text-white rounded-[16px] hover:bg-[#1565C0] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-colors font-medium font-inter"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ); 
};

export default BD_AnexosSimples_Aliquota;