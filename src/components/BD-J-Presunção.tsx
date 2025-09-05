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

// Ícone de Configuração
const SettingsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

interface BDJPresuncaoProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDJPresuncao: React.FC<BDJPresuncaoProps> = ({ onDataChange, onSaveComplete }) => {
  // Estados principais - apenas presunções (removido sistema de abas)
  const [presuncaoData, setPresuncaoData] = useState([
    { id: 1, descricao: 'I.R.', percentual: '8,00%' },
    { id: 2, descricao: 'CSLL', percentual: '12,00%' }, 
    { id: 3, descricao: 'Alíquota CSLL', percentual: '9%' },
    { id: 4, descricao: 'Imposto de renda', percentual: '15%' },
    { id: 5, descricao: 'Adicional Imposto de renda', percentual: '10%' }
  ])

  // Dados dos valores a deduzir
  const [deduzirData, setDeduzirData] = useState([
  { id: 1, presuncaoId: 4, descricao: 'Parcela a deduzir IR - Anual', valor: 'R$ 240.000,00' },
  { id: 2, presuncaoId: 4, descricao: 'Parcela a deduzir IR - Mensal', valor: 'R$ 20.000,00' },
  { id: 3, presuncaoId: 4, descricao: 'Parcela a deduzir IR - Trimestral', valor: 'R$ 60.000,00' },
  ])

  // Estados para controlar quais presunções têm valor a deduzir ativo
  const [presuncaoConfig, setPresuncaoConfig] = useState({
    1: false,  // I.R. - inativo  
    2: false, // CSLL - inativo  
    3: false, // Alíquota CSLL - inativo
    4: false,  // Imposto de renda - inativo  
    5: true  // Adicional Imposto de renda - ativo
  })

  // Estados para modais
  const [showAddPresuncaoModal, setShowAddPresuncaoModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showValorDeduzirModal, setShowValorDeduzirModal] = useState(false)
  const [showAddValorModal, setShowAddValorModal] = useState(false)
  const [showRemovePresuncaoConfirm, setShowRemovePresuncaoConfirm] = useState(false)
  const [showRemoveDeduzirConfirm, setShowRemoveDeduzirConfirm] = useState(false)
  
  // Estados para controle de edição
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [selectedPresuncaoForDeduction, setSelectedPresuncaoForDeduction] = useState(null)
  const [presuncaoToRemove, setPresuncaoToRemove] = useState(null)
  const [deduzirToRemove, setDeduzirToRemove] = useState(null)
  
  // Estados para novos itens
  const [newPresuncao, setNewPresuncao] = useState({
    descricao: '',
    percentual: ''
  })
  const [newDeduzir, setNewDeduzir] = useState({
    descricao: '',
    valor: ''
  })
  const [nextPresuncaoId, setNextPresuncaoId] = useState(6)
  const [nextDeduzirId, setNextDeduzirId] = useState(5)

  // Carregar dados persistidos na inicialização
  useEffect(() => {
    loadPersistedData()
  }, [])

  // useEffect para monitorar mudanças e notificar o componente pai
  useEffect(() => {
    if (isDirty && onDataChange) {
      onDataChange({
        presuncaoData: presuncaoData,
        deduzirData: deduzirData,
        presuncaoConfig: presuncaoConfig,
        hasChanges: true
      })
    }
  }, [isDirty, presuncaoData, deduzirData, presuncaoConfig, onDataChange])

  // Função para carregar dados persistidos
  const loadPersistedData = async () => {
    try {
      localStorage.removeItem('PresuncaoJuridica_data') // TEMPORÁRIO: Limpar dados salvos
      const savedData = localStorage.getItem('PresuncaoJuridica_data')
      
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        
        if (parsedData.presuncaoData && Array.isArray(parsedData.presuncaoData)) {
          setPresuncaoData(parsedData.presuncaoData)
        }
        if (parsedData.deduzirData && Array.isArray(parsedData.deduzirData)) {
                  // Corrigir presuncaoId dos valores para associar à presunção "Imposto de renda" (id: 4)
        const correctedDeduzirData = parsedData.deduzirData.map(item => {
          if (item.id === 1 || item.id === 2 || item.id === 3) {
            return { ...item, presuncaoId: 4 }
          }
          return item
        })
        setDeduzirData(correctedDeduzirData)
          
        }
        if (parsedData.presuncaoConfig) {
          setPresuncaoConfig(parsedData.presuncaoConfig)
        }
        
        console.log('📊 Dados de Presunção carregados do armazenamento local!')
      } else {
        console.log('📋 Usando dados padrão de Presunção - primeira vez')
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados salvos de Presunção:', error)
      console.log('📋 Usando dados padrão de Presuncao')
    }
  }

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

  // Função para formatação automática de moeda
  const formatCurrency = (value: string) => {
    if (!value || value.trim() === '') return 'R$ 0,00'
    
    let cleanValue = value.replace(/[^\d,.-]/g, '')
    
    if (cleanValue.startsWith('R$')) {
      return cleanValue
    }
    
    if (!isNaN(parseFloat(cleanValue.replace(',', '.')))) {
      return `R$ ${cleanValue}`
    }
    
    return `R$ ${cleanValue}`
  }

  // Função para aplicar formatação na tabela de presunções
  const handlePresuncaoPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    updatePresuncao(index, field, formattedValue)
  }

  // Função para aplicar formatação no modal de presunção
  const handleModalPresuncaoPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    setNewPresuncao({...newPresuncao, [field]: formattedValue})
  }

  // Função para aplicar formatação no modal de deduzir
  const handleModalDeduzirValueBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatCurrency(value)
    setNewDeduzir({...newDeduzir, [field]: formattedValue})
  }

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // Função para notificar o pai sobre mudanças
  const notifyParentOfChanges = () => {
    if (onDataChange) {
      onDataChange({
        presuncaoData: presuncaoData,
        deduzirData: deduzirData,
        presuncaoConfig: presuncaoConfig,
        hasChanges: true
      })
    }
  }

  // Função para atualizar presunção (apenas percentual, descrição é fixa)
  const updatePresuncao = (index: number, field: string, value: string) => {
    try {
      if (!presuncaoData[index] || field !== 'percentual') return
      
      const updatedData = [...presuncaoData]
      updatedData[index] = { ...updatedData[index], [field]: value }
      
      setPresuncaoData(updatedData)
      setIsDirty(true)
      notifyParentOfChanges()
    } catch (error) {
      console.error('Erro ao atualizar presunção:', error)
    }
  }

  // Função para salvar as alterações
  const handleSavePresuncao = async () => {
    if (!isDirty) return
    
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "3.0",
        presuncaoData: presuncaoData,
        deduzirData: deduzirData,
        presuncaoConfig: presuncaoConfig
      }
      
      localStorage.setItem('PresuncaoJuridica_data', JSON.stringify(dataToSave))
      
      setShowSuccessMessage(true)
      setIsDirty(false)
      
      if (onSaveComplete) {
        onSaveComplete()
      }
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)
      
    } catch (error) {
      console.error('Erro ao salvar dados de Presunção:', error)
      alert('Erro ao salvar os dados de Presunção. Verifique o console para mais detalhes.')
    }
  }

  // Função para adicionar presunção
  const addPresuncao = () => {
    try {
      if (newPresuncao.descricao.trim() && newPresuncao.percentual.trim()) {
        const presuncaoToAdd = {
          id: nextPresuncaoId,
          descricao: newPresuncao.descricao.trim(),
          percentual: newPresuncao.percentual.trim()
        }
        
        const updatedList = [...presuncaoData, presuncaoToAdd].sort((a, b) => 
          a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
        )
        
        setPresuncaoData(updatedList)
        setNextPresuncaoId(nextPresuncaoId + 1)
        setNewPresuncao({ descricao: '', percentual: '' })
        setShowAddPresuncaoModal(false)
        setIsDirty(true)
        notifyParentOfChanges()
      }
    } catch (error) {
      console.error('Erro ao adicionar presunção:', error)
    }
  }

  // Função para remover presunção
  const removePresuncao = (id: number) => {
    try {
      const updatedData = presuncaoData.filter(item => item.id !== id)
      setPresuncaoData(updatedData)
      setShowRemovePresuncaoConfirm(false)
      setPresuncaoToRemove(null)
      setIsDirty(true)
      notifyParentOfChanges()
    } catch (error) {
      console.error('Erro ao remover presunção:', error)
    }
  }

  // Função para adicionar valor a deduzir
  const addValorDeduzir = () => {
    try {
      if (newDeduzir.descricao.trim() && newDeduzir.valor.trim() && selectedPresuncaoForDeduction) {
        const deduzirToAdd = {
          id: nextDeduzirId,
          presuncaoId: selectedPresuncaoForDeduction.id,
          descricao: newDeduzir.descricao.trim(),
          valor: newDeduzir.valor.trim()
        }
        
        const updatedList = [...deduzirData, deduzirToAdd]
        setDeduzirData(updatedList)
        setNextDeduzirId(nextDeduzirId + 1)
        setNewDeduzir({ descricao: '', valor: '' })
        setIsDirty(true)
        notifyParentOfChanges()
      }
    } catch (error) {
      console.error('Erro ao adicionar valor a deduzir:', error)
    }
  }

  // Função para remover valor a deduzir
  const removeDeduzir = (id: number) => {
    try {
      const updatedData = deduzirData.filter(item => item.id !== id)
      setDeduzirData(updatedData)
      setShowRemoveDeduzirConfirm(false)
      setDeduzirToRemove(null)
      setIsDirty(true)
      notifyParentOfChanges()
    } catch (error) {
      console.error('Erro ao remover valor a deduzir:', error)
    }
  }

  // Função para alternar configuração de presunção
  const togglePresuncaoConfig = (presuncaoId: number) => {
    setPresuncaoConfig(prev => ({
      ...prev,
      [presuncaoId]: !prev[presuncaoId]
    }))
    setIsDirty(true)
    notifyParentOfChanges()
  }

  // Função para abrir modal de valor a deduzir
  const openValorDeduzirModal = (presuncao: any) => {
      // Se for "Imposto de renda" (id: 4), garantir que existam os 3 valores padrão
  if (presuncao.id === 4) {
    const valoresExistentes = deduzirData.filter(item => item.presuncaoId === 4)
    const descricoesPadrao = [
      'Parcela a deduzir IR - Anual',
      'Parcela a deduzir IR - Mensal', 
      'Parcela a deduzir IR - Trimestral'
    ]
    
    // Verificar quais valores ainda não existem
    const valoresFaltantes = descricoesPadrao.filter(desc => 
      !valoresExistentes.some(item => item.descricao === desc)
    )
    
    // Adicionar os valores faltantes
    if (valoresFaltantes.length > 0) {
      const novosValores = valoresFaltantes.map((desc, index) => {
        const valores = {
          'Parcela a deduzir IR - Anual': 'R$ 240.000,00',
          'Parcela a deduzir IR - Mensal': 'R$ 20.000,00',
          'Parcela a deduzir IR - Trimestral': 'R$ 60.000,00'
        }
        return {
          id: nextDeduzirId + index,
          presuncaoId: 4,
          descricao: desc,
          valor: valores[desc]
        }
      })
      
      setDeduzirData(prev => [...prev, ...novosValores])
      setNextDeduzirId(nextDeduzirId + valoresFaltantes.length)
      setIsDirty(true)
      notifyParentOfChanges()
    }
  }


    setSelectedPresuncaoForDeduction(presuncao)
    setShowValorDeduzirModal(true)
  }

  // Função para obter valores a deduzir de uma presunção
  const getValoresDeduzir = (presuncaoId: number) => {
    return deduzirData.filter(item => item.presuncaoId === presuncaoId)
  }

  // Função para atualizar valor a deduzir
  const updateValorDeduzir = (index: number, value: string) => {
    try {
      const valoresFiltered = getValoresDeduzir(selectedPresuncaoForDeduction.id)
      if (!valoresFiltered[index]) return
      
      const valorToUpdate = valoresFiltered[index]
      const updatedData = deduzirData.map(item => 
        item.id === valorToUpdate.id 
          ? { ...item, valor: value }
          : item
      )
      
      setDeduzirData(updatedData)
      setIsDirty(true)
      notifyParentOfChanges()
    } catch (error) {
      console.error('Erro ao atualizar valor a deduzir:', error)
    }
  }

  // Função para formatação do valor ao sair do campo
  const handleValorDeduzirBlur = (index: number, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatCurrency(value)
    updateValorDeduzir(index, formattedValue)
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
            Produtor rural / Pessoa jurídica / Presunção
          </h3>
          
          {/* Botões de ação */}
          <div className="flex items-center gap-[12px]">
            {/* Botão Configurar */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-[16px] py-[8px] bg-[#374151] hover:bg-[#111827] rounded-[8px] text-white text-[14px] font-medium font-inter transition-colors flex items-center gap-[8px]"
            >
              <SettingsIcon size={16} />
              Configurar
            </button>
            
            {/* Botão Adicionar */}
            <button
              onClick={() => setShowAddPresuncaoModal(true)}
              className="px-[16px] py-[8px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[8px] text-white text-[14px] font-medium font-inter transition-colors"
            >
              + Adicionar Presunção
            </button>
            
            {/* Botão Salvar */}
            <button
              onClick={handleSavePresuncao}
              disabled={!isDirty}
              className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium font-inter transition-colors ${
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
          {showSuccessMessage && (
            <div className="absolute top-[60px] right-[20px] flex items-center gap-[8px] px-[12px] py-[6px] bg-[#DFF5E1] text-[#16A34A] rounded-[8px] text-[14px] font-medium font-inter border border-[#BBF7D0] animate-fade-in whitespace-nowrap z-[9999] shadow-lg">
              <CheckIcon size={16} />
              Alterações salvas com sucesso
            </div>
          )}
        </div>
        
        {/* Cabeçalho da Tabela - Fixo */}
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="flex w-full"> 
            <div className="flex-1 text-left pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]">Descrição</div>
            <div className="flex items-center" style={{gap: '15px'}}>
              <div className="text-center pl-[0px] pr-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{width: '120px'}}>Percentual</div>
              <div className="text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{width: '140px'}}>Valor a Deduzir</div>
              <div className="text-center pl-[12px] pr-[12px] pt-[12px] pb-[12px] mr-[15px] font-semibold text-[#374151] font-inter text-[15px]" style={{width: '44px'}}></div>
            </div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] mt-[5px] mb-[5px]">
          <div className="pl-[0px]">
            {presuncaoData.map((item, index) => (
              <div key={item.id} className="hover:bg-[#F8FAFC] rounded-[4px] transition-colors group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                <div className="flex items-center w-full px-[2px] py-[8px]">
                  {/* Campo Descrição */}
                  <div className="flex-1 px-[12px] py-[12px] text-[14px] text-[#1F2937] font-inter">
                    {item.descricao}
                  </div>
                  
                  {/* Container das 3 colunas da direita com gap uniforme */}
                  <div className="flex items-center" style={{gap: '15px'}}>
                    {/* Campo Percentual */}
                    <div style={{width: '120px'}}>
                      <input
                        type="text"
                        value={item.percentual}
                        onChange={(e) => updatePresuncao(index, 'percentual', e.target.value)}
                        onBlur={(e) => handlePresuncaoPercentageBlur(index, 'percentual', e)}
                        onKeyDown={handleEnterKeyPress}
                        className="w-full h-[32px] px-[12px] py-[6px] bg-white border border-[#D1D5DB] rounded-[6px] text-[14px] text-[#1F2937] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter text-center placeholder-[#9CA3AF]"
                        placeholder="0%"
                      />
                    </div>
                    
                    {/* Botão Valor a Deduzir */}
                    <div style={{width: '140px'}}>
                      {presuncaoConfig[item.id] ? (
                        <button
                          onClick={() => openValorDeduzirModal(item)}
                          className="w-full h-[32px] px-[8px] py-[6px] bg-white text-[#1777CF] border border-[#1777CF] rounded-[6px] hover:bg-[#F0F8FF] transition-colors text-[13px] font-medium font-inter"
                        >
                          Valor a Deduzir
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full h-[32px] px-[8px] py-[6px] bg-[#F3F4F6] text-[#9CA3AF] border border-[#D1D5DB] rounded-[6px] cursor-not-allowed text-[13px] font-medium font-inter"
                        >
                          - - - - - - - - -
                        </button>
                      )}
                    </div>
                    
                    {/* Botão Lixeira */}
                    <div className="flex justify-center" style={{width: '44px'}}>
                      <button
                        onClick={() => {
                          setPresuncaoToRemove(item)
                          setShowRemovePresuncaoConfirm(true)
                        }}
                        className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                        title="Remover presunção"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Presunção */}
      {showAddPresuncaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[500px] max-w-[90vw]">
            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[32px] font-inter">
              Adicionar Nova Presunção
            </h3>

            <div className="space-y-[24px]">
              {/* Campo Descrição */}
              <div>
                <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newPresuncao.descricao}
                  onChange={(e) => setNewPresuncao({...newPresuncao, descricao: e.target.value})}
                  className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[12px] text-[16px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter"
                  placeholder="Digite a descrição..."
                />
              </div>

              {/* Campo Percentual */}
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
                  className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[12px] text-[16px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter"
                  placeholder="Digite o percentual..."
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center mt-[32px]">
              <button
                onClick={() => {
                  setShowAddPresuncaoModal(false)
                  setNewPresuncao({ descricao: '', percentual: '' })
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addPresuncao}
                className="px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Presunção */}
      {showRemovePresuncaoConfirm && presuncaoToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[480px] max-w-[90vw]">
            <div className="flex justify-center mb-[24px]">
              <div className="w-[64px] h-[64px] bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <TrashIcon size={32} />
              </div>
            </div>

            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[16px] font-inter">
              Confirmar Remoção
            </h3>

            <p className="text-[16px] text-[#6B7280] text-center mb-[8px] leading-[24px] font-inter">
              Tem certeza que deseja remover a presunção
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[16px] font-inter">
              "{presuncaoToRemove.descricao}"?
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
                onClick={() => removePresuncao(presuncaoToRemove.id)}
                className="px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurar Presunções */} 
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[20px] shadow-2xl px-[10px] pt-[32px] w-[600px] max-w-[90vw] relative">
            
            {/* Botão X no canto superior direito alinhado com as chaves */}
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-[16px] right-[20px] w-[44px] h-[44px] bg-white text-[#6B7280] rounded-[12px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Título */}
            <div className="flex items-center justify-center mb-[50px]">
              <h3 className="text-[28px] font-bold text-[#1F2937] font-inter">
                Configurar Presunções
              </h3>
            </div>
             
            {/* Lista de presunções com switches */}
            <div className="space-y-5">
              {presuncaoData.map((presuncao, index) => (
                <div key={presuncao.id} className="hover:bg-[#F8FAFC] rounded-[12px] transition-colors group relative after:content-[''] after:absolute after:bottom-0 after:left-[0px] after:right-[0px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                  <div className="flex items-center justify-between px-[10px] pb-[10px] mb-[30px] pt-[10px]">
                    <span className="text-[15px] font-medium text-[#1F2937] font-inter">
                      {presuncao.descricao}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={presuncaoConfig[presuncao.id] || false}
                        onChange={() => togglePresuncaoConfig(presuncao.id)}
                        className="sr-only peer" 
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1777CF]"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Valor a Deduzir */}
      {showValorDeduzirModal && selectedPresuncaoForDeduction && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[20px] shadow-2xl pl-[20px] pr-[20px] py-[32px] w-[700px] max-w-[90vw] max-h-[80vh] overflow-hidden relative flex flex-col">
            
            {/* Header: Título centralizado + Botão X à direita */}
            <div className="flex items-center justify-between mb-[24px] px-[0px]">
              <div></div> {/* Espaçador para centralizar o título */}
              <h3 className="text-[24px] font-bold text-[#1F2937] font-inter">
                Valores a Deduzir
              </h3>
              <button
                onClick={() => {
                  setShowValorDeduzirModal(false)
                  setSelectedPresuncaoForDeduction(null)
                  setNewDeduzir({ descricao: '', valor: '' })
                }}
                className="w-[44px] h-[44px] bg-white text-[#6B7280] rounded-[12px] hover:bg-[#FCFCFC] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Linha divisória após título */}
            <div className="border-b border-[#E5E7EB] mb-[24px]"></div>

            {/* Subtítulo */}
            <p className="text-[16px] text-[#6B7280] text-center mb-[24px] font-inter px-[0px]">
              {selectedPresuncaoForDeduction.descricao}
            </p>

            {/* Linha divisória após subtítulo */}
            <div className="border-b border-[#E5E7EB] mb-[24px]"></div>

            {/* Botão Adicionar alinhado à extrema direita */}
            <div className="flex justify-end mb-[24px] px-[0px]">
              <button
                onClick={() => setShowAddValorModal(true)}
                className="px-[15px] py-[10px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                + Adicionar Valor a Deduzir
              </button>
            </div>

            {/* Linha divisória após botão */}
            <div className="border-b border-[#E5E7EB] mb-[24px]"></div>

            {/* Lista de valores cadastrados com scroll moderno */}
            <div className="flex-1 overflow-y-auto modern-scrollbar pr-[10px]">
              {getValoresDeduzir(selectedPresuncaoForDeduction.id).length > 0 ? (
                <div className="space-y-4">
                  {getValoresDeduzir(selectedPresuncaoForDeduction.id).map((valor, index) => (
                    <div key={valor.id} className="hover:bg-[#F8FAFC] rounded-[4px] transition-colors group relative after:content-[''] after:absolute after:bottom-0 after:left-[0px] after:right-[0px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                      <div className="flex items-center w-full px-[0px] py-[8px]">
                        {/* Descrição */}
                        <div className="flex-1 px-[0px] py-[12px] text-[14px] text-[#1F2937] font-inter">
                          {valor.descricao}
                        </div>
                        
                        {/* Container das 2 colunas da direita com gap uniforme */}
                        <div className="flex items-center" style={{gap: '15px'}}>
                          {/* Campo Valor */}
                          <div style={{width: '140px'}}>
                            <input
                              type="text"
                              value={valor.valor}
                              onChange={(e) => updateValorDeduzir(index, e.target.value)}
                              onBlur={(e) => handleValorDeduzirBlur(index, e)}
                              onKeyDown={handleEnterKeyPress}
                              className="w-full h-[32px] px-[12px] py-[6px] bg-white border border-[#D1D5DB] rounded-[6px] text-[14px] text-[#1F2937] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter text-center placeholder-[#9CA3AF]"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          
                          {/* Botão Lixeira */}
                          <div className="flex justify-center" style={{width: '44px'}}>
                            <button
                              onClick={() => {
                                setDeduzirToRemove(valor)
                                setShowRemoveDeduzirConfirm(true)
                              }}
                              className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[6px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                              title="Remover valor"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-[#6B7280] italic font-inter text-center">
                  Nenhum valor cadastrado
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Valor a Deduzir */}
      {showAddValorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[500px] max-w-[90vw] relative">
            
            {/* Header: Título centralizado + Botão X à direita */}
            <div className="flex items-center justify-between mb-[24px]">
              <div></div> {/* Espaçador para centralizar o título */}
              <h3 className="text-[24px] font-bold text-[#1F2937] font-inter">
                Adicionar Valor a Deduzir
              </h3>
              <button
                onClick={() => {
                  setShowAddValorModal(false)
                  setNewDeduzir({ descricao: '', valor: '' })
                }}
                className="w-[44px] h-[44px] bg-white text-[#6B7280] rounded-[12px] hover:bg-[#FCFCFC] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Formulário */}
            <div className="space-y-[24px]">
              <div>
                <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newDeduzir.descricao}
                  onChange={(e) => setNewDeduzir({...newDeduzir, descricao: e.target.value})}
                  className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[12px] text-[16px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter"
                  placeholder="Digite a descrição..."
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                  Valor
                </label>
                <input
                  type="text"
                  value={newDeduzir.valor}
                  onChange={(e) => setNewDeduzir({...newDeduzir, valor: e.target.value})}
                  onBlur={(e) => handleModalDeduzirValueBlur('valor', e)}
                  onKeyDown={handleEnterKeyPress}
                  className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[12px] text-[16px] focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] transition-colors font-inter"
                  placeholder="Digite o valor..."
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center mt-[32px]">
              <button
                onClick={() => {
                  setShowAddValorModal(false)
                  setNewDeduzir({ descricao: '', valor: '' })
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  addValorDeduzir()
                  setShowAddValorModal(false)
                }}
                className="px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Valor a Deduzir */}
      {showRemoveDeduzirConfirm && deduzirToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[480px] max-w-[90vw]">
            <div className="flex justify-center mb-[24px]">
              <div className="w-[64px] h-[64px] bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <TrashIcon size={32} />
              </div>
            </div>

            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[16px] font-inter">
              Confirmar Remoção
            </h3>

            <p className="text-[16px] text-[#6B7280] text-center mb-[8px] leading-[24px] font-inter">
              Tem certeza que deseja remover o valor a deduzir
            </p>
            <p className="text-[18px] font-semibold text-[#1F2937] text-center mb-[32px] font-inter">
              "{deduzirToRemove.descricao}"?
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => {
                  setShowRemoveDeduzirConfirm(false)
                  setDeduzirToRemove(null)
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeDeduzir(deduzirToRemove.id)}
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