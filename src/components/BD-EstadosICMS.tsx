import React, { useState, useEffect } from 'react'
import { useEstadosICMS } from './EstadosICMSContext'

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

interface BDEstadosICMSProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDEstadosICMS: React.FC<BDEstadosICMSProps> = ({ onDataChange, onSaveComplete }) => {
  // Usar contexto global para estados ICMS
  const { 
    estadosICMS, 
    addEstadoICMS: addEstadoICMSGlobal, 
    removeEstadoICMS: removeEstadoICMSGlobal, 
    updateEstadoICMS: updateEstadosICMSGlobal, 
    saveEstadosICMS: saveEstadosICMSGlobal,
    isDirty: isGlobalDirty,
    setIsDirty: setGlobalIsDirty
  } = useEstadosICMS()

  // Estados para modais
  const [showAddEstadoICMSModal, setShowAddEstadoICMSModal] = useState(false)
  const [showRemoveEstadoICMSConfirm, setShowRemoveEstadoICMSConfirm] = useState(false)
  const [estadoICMSToRemove, setEstadoICMSToRemove] = useState(null)
  
  // Estados para controle local de modais
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newEstadoICMS, setNewEstadoICMS] = useState({
    estado: '',
    percentual: '',
    incentivo: ''
  })
  
 // useEffect para monitorar mudanças no contexto global e notificar o pai
 useEffect(() => {
   if (isGlobalDirty && onDataChange) {
     onDataChange({
       estadosICMS: estadosICMS,
       hasChanges: true
     })
   }
 }, [isGlobalDirty, estadosICMS, onDataChange])

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

  // Função para formatar nome do estado (apenas para exibição)
  const formatEstadoName = (estado: string) => {
    if (!estado) return ''
    
    return estado
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Função para aplicar formatação apenas ao sair do campo
  const handleEstadosICMSPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    // Usar apenas o contexto global
    updateEstadosICMS(index, field, formattedValue)
  }

  // Função para aplicar formatação no modal
  const handleModalEstadoICMSPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    setNewEstadoICMS({...newEstadoICMS, [field]: formattedValue})
  }

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // Funções para atualizar dados - usar contexto global
  const updateEstadosICMS = (index: number, field: string, value: string) => {
    updateEstadosICMSGlobal(index, field, value)
  }

// Função para salvar as alterações usando contexto global
const handleSaveEstadosICMS = async () => {
  if (!isGlobalDirty) return
  
  try {
    await saveEstadosICMSGlobal()
    
    setShowSuccessMessage(true)
    
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 4000)

    // Notificar o componente pai que os dados foram salvos
    if (onSaveComplete) {
      onSaveComplete()
    }
    
  } catch (error) {
    console.error('Erro ao salvar dados de Estados e ICMS:', error)
    alert('Erro ao salvar os dados de Estados e ICMS. Verifique o console para mais detalhes.')
  }
}

  // Funções para gerenciar estados ICMS
  const addEstadoICMS = () => {
    if (newEstadoICMS.estado.trim() && newEstadoICMS.percentual.trim()) {
      addEstadoICMSGlobal(newEstadoICMS)
      setNewEstadoICMS({ estado: '', percentual: '', incentivo: '' })
      setShowAddEstadoICMSModal(false)
    }
  }

  const removeEstadoICMS = (id: number) => {
    removeEstadoICMSGlobal(id)
    setShowRemoveEstadoICMSConfirm(false)
    setEstadoICMSToRemove(null)
  }

  const handleRemoveEstadoICMSClick = (estado: any) => {
    setEstadoICMSToRemove(estado)
    setShowRemoveEstadoICMSConfirm(true)
  }

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
            Empresas / Estados e ICMS
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[8px]">
              <button
                onClick={() => setShowAddEstadoICMSModal(true)}
                className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Estado
              </button>
              <button
                onClick={handleSaveEstadosICMS}
                disabled={!isGlobalDirty}
                className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] transition-colors text-[14px] font-medium font-inter shadow-sm ${
                  isGlobalDirty 
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
            <div className="flex-1 text-left pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px]" style={{flexBasis: '70%'}}>Estados</div>
            <div className="flex-1 text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[12px]" style={{flexBasis: '13%'}}>ICMS</div>
            <div className="flex-1 text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[12px]" style={{flexBasis: '13%'}}>Incentivo</div>
            <div className="flex-shrink-0 w-[44px] text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px]"></div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] mt-[5px] mb-[5px]">
          <table className="w-full"> 
            <tbody>
              {estadosICMS.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                  <td className="p-[12px] text-[#1F2937] font-inter text-left text-[15px]" style={{width: '70%'}}>{formatEstadoName(item.estado)}</td>
                  <td className="p-[12px] text-center" style={{width: '13%'}}>
                    <input
                      type="text"
                      value={item.percentual}
                      onChange={(e) => updateEstadosICMS(index, 'percentual', e.target.value)}
                      onBlur={(e) => handleEstadosICMSPercentageBlur(index, 'percentual', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-full px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                    />
                  </td>
                  <td className="p-[12px] text-center" style={{width: '13%'}}>
                    <input
                      type="text"
                      value={item.incentivo || ''}
                      onChange={(e) => updateEstadosICMS(index, 'incentivo', e.target.value)}
                      onBlur={(e) => handleEstadosICMSPercentageBlur(index, 'incentivo', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-full px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                      placeholder="00%"
                    />
                  </td>
                  <td className="p-[12px] text-center" style={{width: '44px'}}>
                    <button
                      onClick={() => handleRemoveEstadoICMSClick(item)}
                      className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                      title="Remover estado"
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

      {/* Modal de Adicionar Estado ICMS */}
      {showAddEstadoICMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl p-[32px] w-[600px] max-w-[90vw]">
            
            {/* Título */}
            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[24px] font-inter">
              Adicionar Novo Estado
            </h3>

            {/* Formulário */}
            <div className="space-y-[16px] mb-[32px]">
              <div>
                <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                  Estado *
                </label>
                <input
                  type="text"
                  value={newEstadoICMS.estado}
                  onChange={(e) => setNewEstadoICMS({...newEstadoICMS, estado: e.target.value})}
                  className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="Ex: ACRE"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                  Percentual *
                </label>
                <input
                  type="text"
                  value={newEstadoICMS.percentual}
                  onChange={(e) => setNewEstadoICMS({...newEstadoICMS, percentual: e.target.value})}
                  onBlur={(e) => handleModalEstadoICMSPercentageBlur('percentual', e)}
                  onKeyDown={handleEnterKeyPress}
                  className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="Ex: 19,00"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                  Incentivo (opcional)
                </label>
                <input
                  type="text"
                  value={newEstadoICMS.incentivo}
                  onChange={(e) => setNewEstadoICMS({...newEstadoICMS, incentivo: e.target.value})}
                  onBlur={(e) => {
                    const formattedValue = formatPercentage(e.target.value)
                    setNewEstadoICMS({...newEstadoICMS, incentivo: formattedValue})
                  }}
                  onKeyDown={handleEnterKeyPress}
                  className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="00%"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => {
                  setShowAddEstadoICMSModal(false)
                  setNewEstadoICMS({ estado: '', percentual: '', incentivo: '' })
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addEstadoICMS}
                className="px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Estado ICMS */}
      {showRemoveEstadoICMSConfirm && estadoICMSToRemove && (
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
              Tem certeza que deseja remover o estado
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[32px] font-inter">
              "{formatEstadoName(estadoICMSToRemove.estado)}"?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => { 
                  setShowRemoveEstadoICMSConfirm(false)
                  setEstadoICMSToRemove(null)
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeEstadoICMS(estadoICMSToRemove.id)}
                className="px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </> 
  )
}