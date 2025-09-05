import React, { useState, useEffect } from 'react'

// Ícone de Lixeira
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

// Ícone de Check (Sucesso)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)

interface BDFFunruralProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDFFunrural: React.FC<BDFFunruralProps> = ({ onDataChange, onSaveComplete }) => {
  // Estado para os dados da tabela
  const [Funrural, setFunrural] = useState([
    { id: 1, descricao: 'Previdência', percentual: '1,20%' },
    { id: 2, descricao: 'Acidente trabalho', percentual: '0,10%' },
    { id: 3, descricao: 'Senar', percentual: '0,20%' }
  ].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })))

  // Estados para modais
  const [showAddFunruralModal, setShowAddFunruralModal] = useState(false)
  const [showRemoveFunruralConfirm, setShowRemoveFunruralConfirm] = useState(false)
  const [FunruralToRemove, setFunruralToRemove] = useState<any>(null)
  
  // Estados para controle de edição
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newFunrural, setNewFunrural] = useState({
    descricao: '',
    percentual: ''
  })
  const [nextFunruralId, setNextFunruralId] = useState(4)
  
  // Função para notificar o pai sobre mudanças
  const notifyParentOfChanges = () => {
    if (onDataChange) {
      onDataChange({
        Funrural: Funrural,
        hasChanges: true
      })
    }
  }

  // Função para carregar dados persistidos (executada na inicialização)
  const loadPersistedData = async () => {
    try {
      // CARREGAMENTO DOS DADOS SALVOS
      const savedData = localStorage.getItem('FunruralFisica_data')
      
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setFunrural(parsedData.Funrural)
        console.log('📊 Dados de funrural carregados do armazenamento local!')
      } else {
        console.log('🔧 Usando dados padrão de funrural - primeira vez')
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados salvos de funrural:', error)
      console.log('🔄 Usando dados padrão de funrural')
    }
  }

  // Carregar dados persistidos na inicialização do componente
  useEffect(() => {
    loadPersistedData()
  }, [])

  // Função para formatação automática de porcentagem
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

  // Função para aplicar formatação apenas ao sair do campo (com notificação ao pai)
  const handleFunruralPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    const updated = [...Funrural]
    const previousValue = updated[index][field]
    updated[index] = { ...updated[index], [field]: formattedValue }
    setFunrural(updated)
    
    if (previousValue !== formattedValue) {
      setIsDirty(true)
      // Notificar o componente pai sobre as alterações
      notifyParentOfChanges()
    }
  }

  // Função para aplicar formatação no modal
  const handleModalFunruralPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    setNewFunrural({...newFunrural, [field]: formattedValue})
  }

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // Funções para atualizar dados (com notificação ao pai)
  const updateFunrural = (index: number, field: string, value: string) => {
    const updated = [...Funrural]
    updated[index] = { ...updated[index], [field]: value }
    setFunrural(updated)
    setIsDirty(true)
    
    // Notificar o componente pai sobre as alterações
    notifyParentOfChanges()
  }

  // Função para salvar as alterações (com notificação ao pai)
  const handleSaveFunrural = async () => {
    if (!isDirty) return
    
    try {
      // Estrutura de dados para persistência
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        Funrural: Funrural
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA - Funrural ===')
      console.log('Salvando alterações de funrural:', JSON.stringify(dataToSave, null, 2))
      
      // SALVAMENTO PERMANENTE NO NAVEGADOR
      localStorage.setItem('FunruralFisica_data', JSON.stringify(dataToSave))
      
      console.log('💾 Dados de Funrural salvos permanentemente no navegador!')
      
      setShowSuccessMessage(true)
      setIsDirty(false)
      
      // Notificar o componente pai que o salvamento foi concluído
      if (onSaveComplete) {
        onSaveComplete()
      }
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)
      
    } catch (error) {
      console.error('Erro ao salvar funrural:', error)
      alert('Erro ao salvar os dados de Funrural. Verifique o console para mais detalhes.')
    }
  }

  // Funções para gerenciar funrural (com notificação ao pai)
  const addFunrural = () => {
    if (newFunrural.descricao.trim() && newFunrural.percentual.trim()) {
      const tributacaoToAdd = {
        id: nextFunruralId,
        ...newFunrural
      }
      const updatedList = [...Funrural, tributacaoToAdd].sort((a, b) => 
        a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
      )
      setFunrural(updatedList)
      setNextFunruralId(nextFunruralId + 1)
      setNewFunrural({ descricao: '', percentual: '' })
      setShowAddFunruralModal(false)
      setIsDirty(true)
      
      // Notificar o componente pai sobre as alterações
      notifyParentOfChanges()
    }
  }

  const removeFunrural = (id: number) => {
    setFunrural(Funrural.filter(item => item.id !== id))
    setShowRemoveFunruralConfirm(false)
    setFunruralToRemove(null)
    setIsDirty(true)
    
    // Notificar o componente pai sobre as alterações
    notifyParentOfChanges()
  }

  const handleRemoveFunruralClick = (tributacao: any) => {
    setFunruralToRemove(tributacao)
    setShowRemoveFunruralConfirm(true)
  }

  return (
    <>
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

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="h-full flex flex-col">
        {/* Título dentro do container */}
        <div className="pl-[10px] pr-[20px] pt-[12px] pb-[12px] bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1F2937] font-inter">
            Produtor rural / Pessoa física / Funrural
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => setShowAddFunruralModal(true)}
                className="flex items-center gap-[8px] px-[18px] py-[9px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Funrural
              </button>
              <button
                onClick={handleSaveFunrural}
                disabled={!isDirty}
                className={`flex items-center gap-[8px] px-[18px] py-[9px] rounded-[8px] transition-colors text-[14px] font-medium font-inter shadow-sm ${
                  isDirty 
                    ? 'bg-[#1777CF] text-white hover:bg-[#1565C0] cursor-pointer' 
                    : 'bg-[#9CA3AF] text-[#6B7280] cursor-not-allowed opacity-50'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
                Salvar
              </button>
            </div>
            
            {/* Mensagem de sucesso */}
            <div className="relative">
              {showSuccessMessage && (
                <div className="absolute top-[8px] right-0 flex items-center gap-[8px] px-[12px] py-[6px] bg-[#DFF5E1] text-[#16A34A] rounded-[8px] text-[14px] font-medium font-inter border border-[#BBF7D0] animate-fade-in whitespace-nowrap z-[9999] shadow-lg">
                  <CheckIcon size={16} />
                  Alterações salvas com sucesso
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Cabeçalho da Tabela - Fixo */}
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="flex w-full pr-[32px]"> 
            <div className="flex-1 text-left pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{flexBasis: '85%'}}>Descrição</div>
            <div className="flex-1 text-center pl-[25px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{flexBasis: '13%'}}>Percentual</div>
            <div className="flex-shrink-0 w-[44px] text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]"></div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] mt-[5px] mb-[5px]">
          <table className="w-full">
            <tbody>
              {Funrural.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                  <td className="p-[12px] text-[#1F2937] font-inter text-left text-[15px]" style={{width: '85%'}}>{item.descricao}</td>
                  <td className="p-[12px] text-center" style={{width: '13%'}}>
                    <input
                      type="text"
                      value={item.percentual}
                      onChange={(e) => updateFunrural(index, 'percentual', e.target.value)}
                      onBlur={(e) => handleFunruralPercentageBlur(index, 'percentual', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-full px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                    />
                  </td>
                  <td className="p-[12px] text-center" style={{width: '44px'}}>
                    <button
                      onClick={() => handleRemoveFunruralClick(item)}
                      className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                      title="Remover funrural"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adicionar Funrural */}
      {showAddFunruralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl p-[32px] w-[560px] max-w-[90vw]">
            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[24px] font-inter">
              Adicionar Funrural
            </h3>
            
            <div className="space-y-[20px]">
              <div>
                <label className="block text-[16px] font-semibold text-[#374151] mb-[8px] font-inter">
                  Descrição do Funrural
                </label>
                <input
                  type="text"
                  value={newFunrural.descricao}
                  onChange={(e) => setNewFunrural({...newFunrural, descricao: e.target.value})}
                  className="w-full px-[16px] py-[12px] border-2 border-[#D1D5DB] rounded-[12px] text-[16px] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="Digite a descrição do funrural..."
                />
              </div>
              
              <div>
                <label className="block text-[16px] font-semibold text-[#374151] mb-[8px] font-inter">
                  Percentual
                </label>
                <input
                  type="text"
                  value={newFunrural.percentual}
                  onChange={(e) => setNewFunrural({...newFunrural, percentual: e.target.value})}
                  onBlur={(e) => handleModalFunruralPercentageBlur('percentual', e)}
                  className="w-full px-[16px] py-[12px] border-2 border-[#D1D5DB] rounded-[12px] text-[16px] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="Ex: 1,20%"
                />
              </div>
            </div>
            
            <div className="flex gap-[16px] mt-[32px]">
              <button
                onClick={() => {
                  setShowAddFunruralModal(false)
                  setNewFunrural({ descricao: '', percentual: '' })
                }}
                className="flex-1 px-[24px] py-[12px] border-2 border-[#D1D5DB] text-[#374151] rounded-[12px] hover:bg-[#F9FAFB] transition-colors text-[16px] font-semibold font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addFunrural}
                className="flex-1 px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar Funrural
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Funrural */}
      {showRemoveFunruralConfirm && FunruralToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
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
              Confirmar Remoção
            </h3>

            {/* Mensagem */}
            <p className="text-[16px] text-[#6B7280] text-center mb-[8px] leading-[24px] font-inter">
              Tem certeza que deseja remover o funrural
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[32px] font-inter">
              "{FunruralToRemove.descricao}"?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-[16px]">
              <button
                onClick={() => {
                  setShowRemoveFunruralConfirm(false)
                  setFunruralToRemove(null)
                }}
                className="flex-1 px-[24px] py-[12px] border-2 border-[#D1D5DB] text-[#374151] rounded-[12px] hover:bg-[#F9FAFB] transition-colors text-[16px] font-semibold font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeFunrural(FunruralToRemove.id)}
                className="flex-1 px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#B91C1C] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}