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

interface BDFPresuncaoProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDFPresuncao: React.FC<BDFPresuncaoProps> = ({ onDataChange, onSaveComplete }) => {
  // Estado para os dados da tabela
  const [Presuncao, setPresuncao] = useState([
    { id: 1, descricao: 'I.R', percentual: '20%' },
    { id: 2, descricao: 'CSLL', percentual: '20%' },
  ].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })))

  // Estados para modais
  const [showAddPresuncaoModal, setShowAddPresuncaoModal] = useState(false)
  const [showRemovePresuncaoConfirm, setShowRemovePresuncaoConfirm] = useState(false)
  const [PresuncaoToRemove, setPresuncaoToRemove] = useState(null)
  
  // Estados para controle de edição
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newPresuncao, setNewPresuncao] = useState({
    descricao: '',
    percentual: ''
  })
  const [nextPresuncaoId, setNextPresuncaoId] = useState(4)
  
  // 🔧 CORREÇÃO: Função para notificar o pai sobre mudanças
  const notifyParentOfChanges = () => {
    if (onDataChange) {
      onDataChange({
        Presuncao: Presuncao,
        hasChanges: true
      })
    }
  }

  // Função para carregar dados persistidos (executada na inicialização)
  const loadPersistedData = async () => {
    try {
      // CARREGAMENTO DOS DADOS SALVOS
      const savedData = localStorage.getItem('PresuncaoFisica_data')
      
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setPresuncao(parsedData.Presuncao)
        console.log('📊 Dados de Presunção carregados do armazenamento local!')
      } else {
        console.log('📋 Usando dados padrão de Presunção - primeira vez')
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados salvos de Presunção:', error)
      console.log('📋 Usando dados padrão de Presuncao')
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

  // 🔧 CORREÇÃO: Função para aplicar formatação apenas ao sair do campo (CORRIGIDA)
  const handlePresuncaoPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    const updated = [...Presuncao]
    const previousValue = updated[index][field]
    updated[index] = { ...updated[index], [field]: formattedValue }
    setPresuncao(updated)
    
    if (previousValue !== formattedValue) {
      setIsDirty(true)
      // 🔧 CORREÇÃO: Notificar o componente pai sobre as alterações
      notifyParentOfChanges()
    }
  }

  // Função para aplicar formatação no modal
  const handleModalPresuncaoPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    setNewPresuncao({...newPresuncao, [field]: formattedValue})
  }

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // 🔧 CORREÇÃO: Funções para atualizar dados (CORRIGIDA)
  const updatePresuncao = (index: number, field: string, value: string) => {
    const updated = [...Presuncao]
    updated[index] = { ...updated[index], [field]: value }
    setPresuncao(updated)
    setIsDirty(true)
    // 🔧 CORREÇÃO: Notificar o componente pai sobre as alterações
    notifyParentOfChanges()
  }

  // Função para salvar as alterações
  const handleSavePresuncao = async () => {
    if (!isDirty) return
    
    try {
      // Estrutura de dados para persistência
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        Presuncao: Presuncao
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA - Presunção ===')
      console.log('Salvando alterações da Presunção:', JSON.stringify(dataToSave, null, 2))
      
      // SALVAMENTO PERMANENTE NO NAVEGADOR
      localStorage.setItem('PresuncaoFisica_data', JSON.stringify(dataToSave))
      
      console.log('💾 Dados de Presunção salvos permanentemente no navegador!')
    
      setShowSuccessMessage(true)
      setIsDirty(false)
    
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)

      // Notificar o componente pai que os dados foram salvos (não apenas alterados)
      if (onSaveComplete) {
        onSaveComplete()
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados de Presunção:', error)
      alert('Erro ao salvar os dados de Presunção. Verifique o console para mais detalhes.')
    }
  }

  // 🔧 CORREÇÃO: Funções para gerenciar Presunção (CORRIGIDAS)
  const addPresuncao = () => {
    if (newPresuncao.descricao.trim() && newPresuncao.percentual.trim()) {
      const tributacaoToAdd = {
        id: nextPresuncaoId,
        ...newPresuncao
      }
      const updatedList = [...Presuncao, tributacaoToAdd].sort((a, b) => 
        a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
      )
      setPresuncao(updatedList)
      setNextPresuncaoId(nextPresuncaoId + 1)
      setNewPresuncao({ descricao: '', percentual: '' })
      setShowAddPresuncaoModal(false)
      setIsDirty(true)
      // 🔧 CORREÇÃO: Notificar o componente pai sobre as alterações
      notifyParentOfChanges()
    }
  }

  const removePresuncao = (id: number) => {
    setPresuncao(Presuncao.filter(item => item.id !== id))
    setShowRemovePresuncaoConfirm(false)
    setPresuncaoToRemove(null)
    setIsDirty(true)
    // 🔧 CORREÇÃO: Notificar o componente pai sobre as alterações
    notifyParentOfChanges()
  }

  const handleRemovePresuncaoClick = (tributacao: any) => {
    setPresuncaoToRemove(tributacao)
    setShowRemovePresuncaoConfirm(true)
  }

  return (
    <>
      <style jsx>{`
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
            Produtor rural / Pessoa física / Presunção
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[8px]">
              <button
                onClick={() => setShowAddPresuncaoModal(true)}
                className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Presunção
              </button>
              <button
                onClick={handleSavePresuncao}
                disabled={!isDirty}
                className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] transition-colors text-[14px] font-medium font-inter shadow-sm ${
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
              {Presuncao.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                  <td className="p-[12px] text-[#1F2937] font-inter text-left text-[15px]" style={{width: '85%'}}>{item.descricao}</td>
                  <td className="p-[12px] text-center" style={{width: '13%'}}>
                    <input
                      type="text"
                      value={item.percentual}
                      onChange={(e) => updatePresuncao(index, 'percentual', e.target.value)}
                      onBlur={(e) => handlePresuncaoPercentageBlur(index, 'percentual', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-full px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                    />
                  </td>
                  <td className="p-[12px] text-center" style={{width: '44px'}}>
                    <button
                      onClick={() => handleRemovePresuncaoClick(item)}
                      className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                      title="Remover Presunção"
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

      {/* Modal de Adicionar Presunção */}
      {showAddPresuncaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl p-[32px] w-[420px] max-w-[90vw]">
            
            {/* Título */}
            <h3 className="text-[20px] font-bold text-[#1F2937] text-center mb-[24px] font-inter">
              Adicionar Nova Presunção
            </h3>

            {/* Campos */}
            <div className="space-y-[20px]">
              <div>
                <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newPresuncao.descricao}
                  onChange={(e) => setNewPresuncao({...newPresuncao, descricao: e.target.value})}
                  className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none text-[14px] font-inter"
                  placeholder="Ex: I.R"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                  Percentual
                </label>
                <input
                  type="text"
                  value={newPresuncao.percentual}
                  onChange={(e) => setNewPresuncao({...newPresuncao, percentual: e.target.value})}
                  onBlur={(e) => handleModalPresuncaoPercentageBlur('percentual', e)}
                  onKeyDown={handleEnterKeyPress}
                  className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none text-[14px] font-inter"
                  placeholder="Ex: 20"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[12px] justify-end mt-[32px]">
              <button
                onClick={() => {
                  setShowAddPresuncaoModal(false)
                  setNewPresuncao({ descricao: '', percentual: '' })
                }}
                className="px-[20px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addPresuncao}
                className="px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar Presunção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Presunção */}
      {showRemovePresuncaoConfirm && PresuncaoToRemove && (
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
              Tem certeza que deseja remover a presunção
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[32px] font-inter">
              "{PresuncaoToRemove.descricao}"?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => { 
                  setShowRemovePresuncaoConfirm(false)
                  setPresuncaoToRemove(null)
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removePresuncao(PresuncaoToRemove.id)}
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