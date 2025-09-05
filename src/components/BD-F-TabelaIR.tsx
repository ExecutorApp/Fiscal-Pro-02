import React, { useState, useRef, useEffect } from 'react'

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

// Componente do Triângulo de Overflow
const OverflowTriangle = () => (
  <div 
    className="absolute top-0 right-0 w-0 h-0 pointer-events-none"
    style={{
      borderLeft: '8px solid transparent',
      borderTop: '8px solid #1777CF'
    }}
  />
)

// Componente de Input Monetário com Tooltip
const MonetaryInput = ({ value, onChange, onBlur, onKeyDown, className, placeholder, anexoKey = null, index = null, field = null }) => {
  const inputRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (inputRef.current) {
        const element = inputRef.current
        const isContentOverflowing = element.scrollWidth > element.clientWidth
        setIsOverflowing(isContentOverflowing)
      }
    }

    checkOverflow()
    
    // Recheck on value change
    const timeoutId = setTimeout(checkOverflow, 100)
    return () => clearTimeout(timeoutId)
  }, [value])

  const handleInputMouseEnter = () => {
    if (isOverflowing) {
      setShowTooltip(true)
    }
  }

  const handleInputMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className="relative inline-block">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onMouseEnter={handleInputMouseEnter}
          onMouseLeave={handleInputMouseLeave}
          className={className}
          placeholder={placeholder}
        />
        {isOverflowing && (
          <div className="absolute top-0 right-0 w-[8px] h-[8px] pointer-events-none">
            <OverflowTriangle />
          </div>
        )}
      </div>
      {showTooltip && isOverflowing && (
        <div 
          className="fixed bg-[#1F2937] text-white px-[12px] py-[8px] rounded-[8px] text-[14px] font-medium font-inter whitespace-nowrap shadow-2xl border border-[#374151]"
          style={{
            zIndex: 2147483647,
            top: inputRef.current ? `${inputRef.current.getBoundingClientRect().top - 50}px` : '0px',
            left: inputRef.current ? `${inputRef.current.getBoundingClientRect().left + (inputRef.current.offsetWidth / 2)}px` : '0px',
            transform: 'translateX(-50%)',
            maxWidth: 'none',
            minWidth: 'max-content'
          }}
        >
          {value}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #1F2937'
            }}
          />
        </div>
      )}
    </div>
  )
}

interface BDFTabelaIRProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDFTabelaIR: React.FC<BDFTabelaIRProps> = ({ onDataChange, onSaveComplete }) => {
  // Estado para os dados dos Tabela
  const [TabelaIR, setTabelaIR] = useState([
    { id: 1, valorDe: 'R$ 1,00', valorAte: 'R$ 26.963,20', aliquota: '0%', desconto: 'R$ 0,00' },
    { id: 2, valorDe: 'R$ 26.963,21', valorAte: 'R$ 33.919,80', aliquota: '7,50%', desconto: 'R$ 2.022,24' },
    { id: 3, valorDe: 'R$ 33.919,81', valorAte: 'R$ 45.012,60', aliquota: '15%', desconto: 'R$ 4.566,23' },
    { id: 4, valorDe: 'R$ 45.012,61', valorAte: 'R$ 55.976,16', aliquota: '22,50%', desconto: 'R$ 4.566,23' },
    { id: 5, valorDe: 'R$ 55.976,17', valorAte: 'R$ 1.000.000.000,00', aliquota: '27,50%', desconto: 'R$ 10.740,98' }
  ])

  // Estados para modais
  const [showAddAnexoModal, setShowAddAnexoModal] = useState(false)
  const [showRemoveAnexoConfirm, setShowRemoveAnexoConfirm] = useState(false)
  const [anexoToRemove, setAnexoToRemove] = useState(null)
  
  // Estados para controle de edição
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newAnexoItem, setNewAnexoItem] = useState({
    valorDe: 'R$ 0,00',
    valorAte: 'R$ 0,00',
    aliquota: '',
    desconto: 'R$ 0,00'
  })
  const [nextAnexoId, setNextAnexoId] = useState(31)

  // 🔧 CORREÇÃO: Função para notificar o pai sobre mudanças
  const notifyParentOfChanges = () => {
    if (onDataChange) {
      onDataChange({
        TabelaIR: TabelaIR,
        hasChanges: true
      })
    }
  }

  // Função para carregar dados persistidos (executada na inicialização)
  const loadPersistedData = async () => {
    try {
    // CARREGAMENTO DOS DADOS SALVOS
    const savedData = localStorage.getItem('TabelaIR_data')
    
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setTabelaIR(parsedData.TabelaIR.anexo1 || parsedData.TabelaIR)
      console.log('📊 Dados carregados do armazenamento local!')
    } else {
      console.log('📋 Usando dados padrão - primeira vez')
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados salvos:', error)
    console.log('📋 Usando dados padrão')
    }
  }
  
  // Carregar dados persistidos na inicialização do componente
  useEffect(() => {
    loadPersistedData()
  }, [])

  // Função para limpar o estado de alterações (uso interno)
  const clearDirtyState = () => {
    setIsDirty(false)
    console.log('Estado limpo - dados salvos')
  }

  // 🔧 CORREÇÃO: Função para marcar como alterado (CORRIGIDA COM NOTIFICAÇÃO)
  const markAsDirty = () => {
    if (!isDirty) {
      setIsDirty(true)
      console.log('Alterações detectadas')
      // 🔧 CORREÇÃO: Notificar o componente pai sobre as alterações
      notifyParentOfChanges()
    }
  }

  // Função para formatação durante a digitação
  const handleCurrencyChange = (value: string) => {
    const currencyPrefix = "R$"
    if (!value.startsWith(currencyPrefix)) {
      if (value === "") {
        return "R$ "
      }
      return "R$ " + value
    }
    return value
  }

  // Função para formatação de moeda - CORRIGIDA
  const formatCurrency = (value: string) => {
    if (!value || value.trim() === "") return "R$ 0,00"
    
    // Remove apenas o prefixo R$ e espaços para análise
    const cleanValue = value.replace(/^R\$\s*/, "").trim()
    
    if (cleanValue === "") return "R$ 0,00"
    
    // Verifica se já está no formato brasileiro correto (pontos como milhar, vírgula como decimal)
    const brazilianFormatRegex = /^(\d{1,3}(?:\.\d{3})*),\d{2}$|^(\d{1,3}(?:\.\d{3})*),\d{1}$|^(\d{1,3}(?:\.\d{3})*)$/
    
    if (brazilianFormatRegex.test(cleanValue)) {
      // Já está em formato brasileiro correto ou parcialmente correto
      if (cleanValue.includes(',')) {
        const [integerPart, decimalPart = ''] = cleanValue.split(',')
        const formattedDecimal = decimalPart.padEnd(2, '0').substring(0, 2)
        return `R$ ${integerPart},${formattedDecimal}`
      } else {
        // Só tem parte inteira, adicionar ,00
        return `R$ ${cleanValue},00`
      }
    }
    
    // Tenta converter de formato americano (pontos como decimal)
    const americanFormatRegex = /^(\d{1,3}(?:,\d{3})*\.\d{1,2})$|^(\d+\.\d{1,2})$|^(\d+)$/
    
    if (americanFormatRegex.test(cleanValue)) {
      // Formato americano - converter para brasileiro
      const number = parseFloat(cleanValue.replace(/,/g, ''))
      if (!isNaN(number)) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(number)
      }
    }
    
    // Tenta extrair apenas números e formatar
    const numbersOnly = cleanValue.replace(/[^\d]/g, '')
    if (numbersOnly) {
      const number = parseInt(numbersOnly) / 100
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(number)
    }
    
    return "R$ 0,00"
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

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // UTILITÁRIO 2: Backup automático em JSON
  const createBackup = (data: any) => {
    const backup = {
      ...data,
      backup: true,
      originalTimestamp: data.timestamp,
      backupTimestamp: new Date().toISOString()
    }
    
    console.log('=== BACKUP DOS DADOS ===')
    console.log(JSON.stringify(backup, null, 2))
    return backup
  }

  // 🔧 CORREÇÃO: Função para aplicar formatação ao sair do campo de percentual (CORRIGIDA)
  const handleTabelaPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'aliquota') {
      const value = event.target.value
      const formattedValue = formatPercentage(value)
      
      const updated = [...TabelaIR]
      const previousValue = updated[index][field]
      
      updated[index] = { ...updated[index], [field]: formattedValue }
      setTabelaIR(updated)
      
      if (previousValue !== formattedValue) {
        markAsDirty() // Já incluirá a notificação com a nova versão
      }
    }
  }

  // 🔧 CORREÇÃO: Função para aplicar formatação ao sair do campo de moeda (CORRIGIDA)
  const handleTabelaCurrencyBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'valorDe' || field === 'valorAte' || field === 'desconto') {
      const value = event.target.value
      const formattedValue = formatCurrency(value)
      
      const updated = [...TabelaIR]
      const previousValue = updated[index][field]
      
      updated[index] = { ...updated[index], [field]: formattedValue }
      setTabelaIR(updated)
      
      if (previousValue !== formattedValue) {
        markAsDirty() // Já incluirá a notificação com a nova versão
      }
    }
  }

  // Função para aplicar formatação no modal
  const handleModalAnexoPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'aliquota') {
      const value = event.target.value
      const formattedValue = formatPercentage(value)
      setNewAnexoItem({...newAnexoItem, [field]: formattedValue})
    }
  }

  const handleModalAnexoCurrencyBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'valorDe' || field === 'valorAte' || field === 'desconto') {
      const value = event.target.value
      const formattedValue = formatCurrency(value)
      setNewAnexoItem({...newAnexoItem, [field]: formattedValue})
    }
  }

  // 🔧 CORREÇÃO: Função para atualizar dados (CORRIGIDA)
  const updateTabelaItem = (index: number, field: string, value: string) => {
    const updated = [...TabelaIR]
    updated[index] = { ...updated[index], [field]: value }
    setTabelaIR(updated)
    markAsDirty() // Já incluirá a notificação com a nova versão
  }

  // Função para salvar as alterações
  const handleSaveTabela = async () => {
    if (!isDirty) return
    
    try {
      // Estrutura de dados para persistência
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        TabelaIR: { anexo1: TabelaIR }
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA ===')
      console.log('Salvando alterações dos Tabela:', JSON.stringify(dataToSave, null, 2))
      
      // SALVAMENTO PERMANENTE NO NAVEGADOR
      localStorage.setItem('TabelaIR_data', JSON.stringify(dataToSave))
      
      console.log('💾 Dados salvos permanentemente no navegador!')
      
      setShowSuccessMessage(true)
      setIsDirty(false)
      
      // Criar backup automático
      createBackup(dataToSave)
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)

      // Notificar o componente pai que os dados foram salvos (não apenas alterados)
      if (onSaveComplete) {
        onSaveComplete()
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      alert('Erro ao salvar os dados. Verifique o console para mais detalhes.')
    }
  }

  // 🔧 CORREÇÃO: Funções para gerenciar Tabela (CORRIGIDAS)
  const addTabelaItem = () => {
    // Verifica se os campos têm valores válidos
    const valorDeValid = newAnexoItem.valorDe.replace(/[^\d,\.]/g, '') !== ''
    const valorAteValid = newAnexoItem.valorAte.replace(/[^\d,\.]/g, '') !== ''
    const aliquotaValid = newAnexoItem.aliquota.trim() !== ''
    const descontoValid = newAnexoItem.desconto.replace(/[^\d,\.]/g, '') !== ''
    
    if (valorDeValid && valorAteValid && aliquotaValid && descontoValid) {
      // Formatar os valores monetários antes de adicionar
      const formattedValorDe = formatCurrency(newAnexoItem.valorDe)
      const formattedValorAte = formatCurrency(newAnexoItem.valorAte)
      const formattedDesconto = formatCurrency(newAnexoItem.desconto)
      const formattedAliquota = formatPercentage(newAnexoItem.aliquota)
      
      const itemToAdd = {
        id: nextAnexoId,
        valorDe: formattedValorDe,
        valorAte: formattedValorAte,
        aliquota: formattedAliquota,
        desconto: formattedDesconto
      }
      
      setTabelaIR([...TabelaIR, itemToAdd])
      setNextAnexoId(nextAnexoId + 1)
      setNewAnexoItem({ valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '', desconto: 'R$ 0,00' })
      setShowAddAnexoModal(false)
      markAsDirty() // Já incluirá a notificação com a nova versão
    }
  }

  const removeTabelaItem = (id: number) => {
    const updated = TabelaIR.filter(item => item.id !== id)
    setTabelaIR(updated)
    setShowRemoveAnexoConfirm(false)
    setAnexoToRemove(null)
    markAsDirty() // Já incluirá a notificação com a nova versão
  }

  const handleRemoveTabelaClick = (item: any) => {
    setAnexoToRemove(item)
    setShowRemoveAnexoConfirm(true)
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
            Produtor rural / Pessoa física / Tabela imposto de renda
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => setShowAddAnexoModal(true)}
                className="flex items-center gap-[8px] px-[18px] py-[9px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Faixa
              </button>
              <button
                onClick={handleSaveTabela}
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
          <div className="flex w-full items-center pl-[105px]"> 
            <div className="flex-1 text-left pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px] flex items-center">
              Receita bruta total em 12 meses
            </div>
            <div className="flex items-center ml-[-60px]">
              <div className="w-[124px] text-center pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px] flex items-center justify-center">
                Alíquota
              </div>
              <div className="w-[164px] text-center pl-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px] flex items-center justify-center">
                Valor a deduzir
              </div>
              <div className="w-[56px] text-center ml-[10px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px] flex items-center justify-center"></div>
            </div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] mt-[5px] mb-[5px]">
          <div className="w-full">
            {TabelaIR?.map((item, index) => (
              <div key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[12px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                <div className="flex w-full items-center pl-[0px] pr-[0px]">
                  <div className="flex-1 p-[12px] text-left mr-[24px]">
                    <div className="flex items-center gap-[8px] justify-start">
                      <span className="text-[#6B7280] text-[14px] font-inter min-w-[24px] text-[15px]">De:</span>
                      <MonetaryInput
                        value={item.valorDe}
                        onChange={(e) => {
                          const formattedValue = handleCurrencyChange(e.target.value)
                         updateTabelaItem(index, 'valorDe', formattedValue)
                        }}
                        onBlur={(e) => handleTabelaCurrencyBlur(index, 'valorDe', e)}
                        onKeyDown={handleEnterKeyPress}
                        className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none text-center"
                        index={index}
                        field="valorDe"
                      />
                      <span className="text-[#6B7280] text-[14px] font-inter min-w-[16px] ml-[8px] text-[15px]">A:</span>
                      <MonetaryInput
                        value={item.valorAte}
                        onChange={(e) => {
                          const formattedValue = handleCurrencyChange(e.target.value)
                          updateTabelaItem(index, 'valorAte', formattedValue)
                        }}
                        onBlur={(e) => handleTabelaCurrencyBlur(index, 'valorAte', e)}
                        onKeyDown={handleEnterKeyPress}
                        className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"                     
                        index={index}
                        field="valorAte"
                      />
                    </div>
                  </div>
                  <div className="w-[124px] p-[12px] flex justify-center items-center">
                    <input
                      type="text"
                      value={item.aliquota}
                     onChange={(e) => updateTabelaItem(index, 'aliquota', e.target.value)}
                     onBlur={(e) => handleTabelaPercentageBlur(index, 'aliquota', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-[100px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                    />
                  </div>
                  <div className="w-[164px] p-[12px] flex justify-center items-center">
                    <MonetaryInput
                      value={item.desconto}
                      onChange={(e) => {
                        const formattedValue = handleCurrencyChange(e.target.value)
                        updateTabelaItem(index, 'desconto', formattedValue)
                      }}
                      onBlur={(e) => handleTabelaCurrencyBlur(index, 'desconto', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                      index={index}
                      field="desconto"
                    />
                  </div>
                  <div className="w-[56px] p-[12px] flex justify-center items-center">
                    <button
                      onClick={() => handleRemoveTabelaClick(item)}
                      className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center flex-shrink-0"
                      title="Remover faixa"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Item Anexo */}
      {showAddAnexoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl p-[32px] w-[600px] max-w-[90vw]">
            
            {/* Título */}
            <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[8px] font-inter">
              Adicionar Novo Imposto de Renda
            </h3>
            <p className="text-[14px] text-[#6B7280] text-center mb-[24px] font-inter">
              Adicione uma nova faixa de imposto de renda à tabela.
            </p>

            {/* Campos */}
            <div className="space-y-[20px]">
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Receita Bruta De
                  </label>
                  <MonetaryInput
                    value={newAnexoItem.valorDe}
                    onChange={(e) => {
                      const formattedValue = handleCurrencyChange(e.target.value)
                      setNewAnexoItem({...newAnexoItem, valorDe: formattedValue})
                    }}
                    onBlur={(e) => handleModalAnexoCurrencyBlur('valorDe', e)}
                    onKeyDown={handleEnterKeyPress}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center"
                    placeholder="Ex: R$ 4.800.000,01"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Receita Bruta Até
                  </label>
                  <MonetaryInput
                    value={newAnexoItem.valorAte}
                    onChange={(e) => {
                      const formattedValue = handleCurrencyChange(e.target.value)
                      setNewAnexoItem({...newAnexoItem, valorAte: formattedValue})
                    }}
                    onBlur={(e) => handleModalAnexoCurrencyBlur('valorAte', e)}
                    onKeyDown={handleEnterKeyPress}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center"
                    placeholder="Ex: R$ 6.000.000,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Alíquota
                  </label>
                  <input
                    type="text"
                    value={newAnexoItem.aliquota}
                    onChange={(e) => setNewAnexoItem({...newAnexoItem, aliquota: e.target.value})}
                    onBlur={(e) => handleModalAnexoPercentageBlur('aliquota', e)}
                    onKeyDown={handleEnterKeyPress}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center"
                    placeholder="Ex: 33,50"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Valor a Deduzir
                  </label>
                  <MonetaryInput
                    value={newAnexoItem.desconto}
                    onChange={(e) => {
                      const formattedValue = handleCurrencyChange(e.target.value)
                      setNewAnexoItem({...newAnexoItem, desconto: formattedValue})
                    }}
                    onBlur={(e) => handleModalAnexoCurrencyBlur('desconto', e)}
                    onKeyDown={handleEnterKeyPress}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center"
                    placeholder="Ex: R$ 87.300,00"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => {
                  setShowAddAnexoModal(false)
                  setNewAnexoItem({ valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '', desconto: 'R$ 0,00' })
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addTabelaItem}
                className="px-[24px] py-[12px] bg-[#1777CF] hover:bg-[#1565C0] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Adicionar Faixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Item Anexo */}
      {showRemoveAnexoConfirm && anexoToRemove && (
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
              Tem certeza que deseja remover esta faixa de imposto?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => { 
                  setShowRemoveAnexoConfirm(false)
                  setAnexoToRemove(null)
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeTabelaItem(anexoToRemove.id)}
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