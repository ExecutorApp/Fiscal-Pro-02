import React, { useState, useRef, useEffect } from 'react'
import BD_AnexosSimples_Aliquota from './BD-AnexosSimples-Aliquota'

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

// Interface para props do MonetaryInput
interface MonetaryInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  anexoKey?: string | null;
  index?: number | null;
  field?: string | null;
}

// Componente de Input Monetário com Tooltip
const MonetaryInput: React.FC<MonetaryInputProps> = ({ value, onChange, onBlur, onKeyDown, className, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null)
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

// Interface para imposto
interface Imposto {
  id: string;
  descricao: string;
  percentual: number;
}

// Interface para item de anexo
interface AnexoItem {
  id: number;
  valorDe: string;
  valorAte: string;
  aliquota: string;
  desconto: string;
}

interface AnexoItemToRemove extends AnexoItem {
  anexoKey: string;
}

// Interface para dados dos anexos
interface AnexosSimplesData {
  anexo1: AnexoItem[];
  anexo2: AnexoItem[];
  anexo3: AnexoItem[];
  anexo4: AnexoItem[];
  anexo5: AnexoItem[];
  [key: string]: AnexoItem[]; // Index signature para acesso dinâmico
}

interface BDAnexosSimplesProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDAnexosSimples: React.FC<BDAnexosSimplesProps> = ({ onDataChange, onSaveComplete }) => {
  // Função para carregar dados persistidos (executada na inicialização)
  const loadPersistedData = async () => {
    try {
    // CARREGAMENTO DOS DADOS SALVOS
    const savedData = localStorage.getItem('anexosSimples_data')
    
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setAnexosSimples(parsedData.anexosSimples)
      console.log('? Dados carregados do armazenamento local!')
    } else {
      console.log('?? Usando dados padrão - primeira vez')
    }
    
  } catch (error) {
    console.error('? Erro ao carregar dados salvos:', error)
    console.log('?? Usando dados padrão')
    }
  }
  
  // Carregar dados persistidos na inicialização do componente
  useEffect(() => {
    loadPersistedData()
  }, [])

  // === FUNÇÕES UTILITÁRIAS PARA PERSISTÊNCIA ===
  // (Descomente a que for usar em seu ambiente)
  

  
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

  // Estados para controle dos modais e seleções (movidos para seção principal)

  // Funções para gerenciar o modal de alíquota
  const openAliquotaModal = (item: AnexoItem, index: number) => {
    setSelectedAliquotaItem(item)
    setSelectedAliquotaIndex(index)
    setShowAliquotaModal(true)
  }

  const closeAliquotaModal = () => {
    setShowAliquotaModal(false)
    setSelectedAliquotaItem(null)
    setSelectedAliquotaIndex(-1)
  }

  // Função updateAnexoItem está definida mais abaixo no código

  const saveAliquotaModal = (_impostos: Imposto[], total: number) => {
    // Atualizar a alíquota no item
    const formattedTotal = `${total.toFixed(2).replace('.', ',')}%`
    if (selectedAliquotaIndex === -1) {
      // Modal chamado do formulário de nova faixa
      if (newAnexoItem) {
        setNewAnexoItem({...newAnexoItem, aliquota: formattedTotal})
      }
    } else {
      // Modal chamado da tabela existente
      updateAnexoItem(currentAnexo, selectedAliquotaIndex, 'aliquota', formattedTotal)
    }
    closeAliquotaModal()
  }



// Estado para os dados dos anexos
const [anexosSimples, setAnexosSimples] = useState<AnexosSimplesData>({
  anexo1: [
    { id: 1, valorDe: 'R$ 1,00', valorAte: 'R$ 180.000,00', aliquota: '4%', desconto: 'R$ 0,00' },
    { id: 2, valorDe: 'R$ 180.000,01', valorAte: 'R$ 360.000,00', aliquota: '7,30%', desconto: 'R$ 5.940,00' },
    { id: 3, valorDe: 'R$ 360.000,01', valorAte: 'R$ 720.000,00', aliquota: '9,50%', desconto: 'R$ 13.860,00' },
    { id: 4, valorDe: 'R$ 720.000,01', valorAte: 'R$ 1.800.000,00', aliquota: '10,70%', desconto: 'R$ 22.500,00' },
    { id: 5, valorDe: 'R$ 1.800.000,01', valorAte: 'R$ 3.600.000,00', aliquota: '14,30%', desconto: 'R$ 87.300,00' },
    { id: 6, valorDe: 'R$ 3.600.000,01', valorAte: 'R$ 4.800.000,00', aliquota: '19%', desconto: 'R$ 378.000,00' }
  ],
  anexo2: [
    { id: 7, valorDe: 'R$ 1,00', valorAte: 'R$ 180.000,00', aliquota: '4,50%', desconto: 'R$ 0,00' },
    { id: 8, valorDe: 'R$ 180.000,01', valorAte: 'R$ 360.000,00', aliquota: '7,80%', desconto: 'R$ 5.940,00' },
    { id: 9, valorDe: 'R$ 360.000,01', valorAte: 'R$ 720.000,00', aliquota: '10%', desconto: 'R$ 13.860,00' },
    { id: 10, valorDe: 'R$ 720.000,01', valorAte: 'R$ 1.800.000,00', aliquota: '11,20%', desconto: 'R$ 22.500,00' },
    { id: 11, valorDe: 'R$ 1.800.000,01', valorAte: 'R$ 3.600.000,00', aliquota: '14,70%', desconto: 'R$ 85.500,00' },
    { id: 12, valorDe: 'R$ 3.600.000,01', valorAte: 'R$ 4.800.000,00', aliquota: '30%', desconto: 'R$ 720.000,00' }
  ],
  anexo3: [
    { id: 13, valorDe: 'R$ 1,00', valorAte: 'R$ 180.000,00', aliquota: '6%', desconto: 'R$ 0,00' },
    { id: 14, valorDe: 'R$ 180.000,01', valorAte: 'R$ 360.000,00', aliquota: '11,20%', desconto: 'R$ 9.360,00' },
    { id: 15, valorDe: 'R$ 360.000,01', valorAte: 'R$ 720.000,00', aliquota: '13,50%', desconto: 'R$ 17.640,00' },
    { id: 16, valorDe: 'R$ 720.000,01', valorAte: 'R$ 1.800.000,00', aliquota: '16%', desconto: 'R$ 35.640,00' },
    { id: 17, valorDe: 'R$ 1.800.000,01', valorAte: 'R$ 3.600.000,00', aliquota: '21%', desconto: 'R$ 125.640,00' },
    { id: 18, valorDe: 'R$ 3.600.000,01', valorAte: 'R$ 4.800.000,00', aliquota: '33%', desconto: 'R$ 648.000,00' }
  ],
  anexo4: [
    { id: 19, valorDe: 'R$ 1,00', valorAte: 'R$ 180.000,00', aliquota: '4,50%', desconto: 'R$ 0,00' },
    { id: 20, valorDe: 'R$ 180.000,01', valorAte: 'R$ 360.000,00', aliquota: '9%', desconto: 'R$ 8.100,00' },
    { id: 21, valorDe: 'R$ 360.000,01', valorAte: 'R$ 720.000,00', aliquota: '10,20%', desconto: 'R$ 12.420,00' },
    { id: 22, valorDe: 'R$ 720.000,01', valorAte: 'R$ 1.800.000,00', aliquota: '14%', desconto: 'R$ 39.780,00' },
    { id: 23, valorDe: 'R$ 1.800.000,01', valorAte: 'R$ 3.600.000,00', aliquota: '22%', desconto: 'R$ 183.780,00' },
    { id: 24, valorDe: 'R$ 3.600.000,01', valorAte: 'R$ 4.800.000,00', aliquota: '33%', desconto: 'R$ 828.000,00' }
  ],
  anexo5: [
    { id: 25, valorDe: 'R$ 1,00', valorAte: 'R$ 180.000,00', aliquota: '15,50%', desconto: 'R$ 0,00' },
    { id: 26, valorDe: 'R$ 180.000,01', valorAte: 'R$ 360.000,00', aliquota: '18%', desconto: 'R$ 4.500,00' },
    { id: 27, valorDe: 'R$ 360.000,01', valorAte: 'R$ 720.000,00', aliquota: '19,50%', desconto: 'R$ 9.900,00' },
    { id: 28, valorDe: 'R$ 720.000,01', valorAte: 'R$ 1.800.000,00', aliquota: '20,50%', desconto: 'R$ 17.100,00' },
    { id: 29, valorDe: 'R$ 1.800.000,01', valorAte: 'R$ 3.600.000,00', aliquota: '23%', desconto: 'R$ 62.100,00' },
    { id: 30, valorDe: 'R$ 3.600.000,01', valorAte: 'R$ 4.800.000,00', aliquota: '30,50%', desconto: 'R$ 540.000,00' }
  ]
})

  // Estados para modais
  const [showAddAnexoModal, setShowAddAnexoModal] = useState(false)
  const [showRemoveAnexoConfirm, setShowRemoveAnexoConfirm] = useState(false)
  const [showRemoveTabConfirm, setShowRemoveTabConfirm] = useState(false)
  const [anexoToRemove, setAnexoToRemove] = useState<AnexoItemToRemove | null>(null)
  const [currentAnexo, setCurrentAnexo] = useState<string>('anexo1')
  const [selectedAliquotaItem, setSelectedAliquotaItem] = useState<AnexoItem | null>(null)
  const [selectedAliquotaIndex, setSelectedAliquotaIndex] = useState<number>(-1)
  const [showAliquotaModal, setShowAliquotaModal] = useState<boolean>(false)
  
  // Estados para controle de edição
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newAnexoItem, setNewAnexoItem] = useState<AnexoItem | null>({
     id: 0,
     valorDe: 'R$ 0,00',
     valorAte: 'R$ 0,00',
     aliquota: '0,00%',
     desconto: 'R$ 0,00'
  })
  const [nextAnexoId, setNextAnexoId] = useState(31)
// Estados para controle do modal de alíquota (já declarados acima)

  
  // useEffect para monitorar mudanças e notificar o componente pai
useEffect(() => {
  if (isDirty && onDataChange) {
    onDataChange({
      anexosSimples: anexosSimples,
      hasChanges: true
    })
  }
}, [isDirty, anexosSimples, onDataChange])



  // Função para marcar como alterado (uso interno)  
  const markAsDirty = () => {
    if (!isDirty) {
      setIsDirty(true)
      console.log('Alterações detectadas')
	      // Notificar o componente pai sobre as alterações
    if (onDataChange) {
      onDataChange({
        anexosSimples: anexosSimples,
        hasChanges: true
      })
    }
   }
  }

  // Função para obter todas as chaves de anexos disponíveis
  const getAnexoKeys = () => {
    return Object.keys(anexosSimples).sort()
  }

  // Função para obter o número do anexo a partir da chave
  const getAnexoNumber = (anexoKey: string) => {
    const match = anexoKey.match(/anexo(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  // Função para obter o nome amigável do anexo
  const getAnexoDisplayName = (anexoKey: string) => {
    const number = getAnexoNumber(anexoKey)
    return `Anexo ${number.toString().padStart(2, '0')}`
  }

  // Função para adicionar nova aba de anexo
  const addNewAnexo = () => {
    const currentAnexoKeys = getAnexoKeys()
    const maxNumber = Math.max(...currentAnexoKeys.map(key => getAnexoNumber(key)))
    const newAnexoNumber = maxNumber + 1
    const newAnexoKey = `anexo${newAnexoNumber}`
    
    // Encontra qualquer aba existente para copiar a estrutura de faixas (valores de receita bruta)
    const referenceAnexoKey = currentAnexoKeys[0] // Usa a primeira aba como referência
    const referenceAnexoData = anexosSimples[referenceAnexoKey] || []
    
    // Estrutura para novo anexo baseada na estrutura de referência
    const defaultAnexoStructure = referenceAnexoData.length > 0 
      ? referenceAnexoData.map((item, index) => ({
          id: nextAnexoId + index,
          valorDe: formatCurrency(item.valorDe),   // Garante formatação consistente
          valorAte: formatCurrency(item.valorAte), // Garante formatação consistente
          aliquota: '0%',                          // Zerado
          desconto: 'R$ 0,00'                      // Zerado
        }))
      : [
          // Estrutura padrão caso não haja anexos anteriores (fallback)
          { id: nextAnexoId, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' },
          { id: nextAnexoId + 1, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' },
          { id: nextAnexoId + 2, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' },
          { id: nextAnexoId + 3, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' },
          { id: nextAnexoId + 4, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' },
          { id: nextAnexoId + 5, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0%', desconto: 'R$ 0,00' }
        ]
    
    const updated = { ...anexosSimples, [newAnexoKey]: defaultAnexoStructure }
    setAnexosSimples(updated)
    setCurrentAnexo(newAnexoKey)
    setNextAnexoId(nextAnexoId + (referenceAnexoData.length > 0 ? referenceAnexoData.length : 6))
    markAsDirty()
	  // Notificar mudanças imediatamente após adicionar nova aba
  if (onDataChange) {
    onDataChange({
      anexosSimples: updated,
      hasChanges: true
    })
   }
  }

  // Função para remover aba de anexo
  const removeCurrentAnexo = () => {
    const anexoKeys = getAnexoKeys()
    
    // Não permitir remover se só houver um anexo
    if (anexoKeys.length <= 1) {
      return
    }
    
    const updated = { ...anexosSimples }
    delete updated[currentAnexo]
    
    // Selecionar o primeiro anexo restante
    const remainingKeys = Object.keys(updated).sort()
    const newCurrentAnexo = remainingKeys[0]
    
    setAnexosSimples(updated)
    setCurrentAnexo(newCurrentAnexo)
    setShowRemoveTabConfirm(false)
    markAsDirty()
	  // Notificar mudanças imediatamente após remover aba
  if (onDataChange) {
    onDataChange({
      anexosSimples: updated,
      hasChanges: true
    })
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
    const brazilianFormatRegex = /^(\d{1,3}(?:\.\d{3})*),\d{2}$|^(\d{1,3}(?:\.\d{3})*)$|^(\d+),\d{1,2}$|^(\d+)$/
    
    if (brazilianFormatRegex.test(cleanValue)) {
      // Se já está no formato correto, apenas reconstrói com R$
      let numericValue = 0
      
      if (cleanValue.includes(',')) {
        // Tem parte decimal
        const [integerPart, decimalPart] = cleanValue.split(',')
        const cleanInteger = integerPart.replace(/\./g, '') // Remove pontos dos milhares
        const cleanDecimal = decimalPart.padEnd(2, '0').substring(0, 2) // Garante 2 dígitos decimais
        numericValue = parseFloat(cleanInteger + '.' + cleanDecimal)
      } else {
        // Só parte inteira
        const cleanInteger = cleanValue.replace(/\./g, '') // Remove pontos dos milhares
        numericValue = parseFloat(cleanInteger)
      }
      
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericValue)
      
      return formatted
    }
    
    // Se não está no formato correto, tenta interpretar e formatar
    // Remove todos os caracteres não numéricos exceto vírgula e ponto
    let numbersOnly = cleanValue.replace(/[^\d,\.]/g, "")
    
    if (numbersOnly === "") return "R$ 0,00"
    
    let numericValue = 0
    
    // Tenta interpretar diferentes formatos
    if (numbersOnly.includes(',') && numbersOnly.includes('.')) {
      // Formato americano (1,000.50) ou misto - assume que o último é decimal
      const lastComma = numbersOnly.lastIndexOf(',')
      const lastDot = numbersOnly.lastIndexOf('.')
      
      if (lastDot > lastComma) {
        // Ponto é decimal (formato americano)
        const integerPart = numbersOnly.substring(0, lastDot).replace(/[,\.]/g, '')
        const decimalPart = numbersOnly.substring(lastDot + 1).padEnd(2, '0').substring(0, 2)
        numericValue = parseFloat(integerPart + '.' + decimalPart)
      } else {
        // Vírgula é decimal (formato brasileiro)
        const integerPart = numbersOnly.substring(0, lastComma).replace(/[,\.]/g, '')
        const decimalPart = numbersOnly.substring(lastComma + 1).padEnd(2, '0').substring(0, 2)
        numericValue = parseFloat(integerPart + '.' + decimalPart)
      }
    } else if (numbersOnly.includes(',')) {
      // Só vírgula - assume formato brasileiro
      const parts = numbersOnly.split(',')
      const integerPart = parts[0].replace(/\./g, '')
      const decimalPart = (parts[1] || '00').padEnd(2, '0').substring(0, 2)
      numericValue = parseFloat(integerPart + '.' + decimalPart)
    } else if (numbersOnly.includes('.')) {
      // Só ponto - pode ser milhar ou decimal
      const dotCount = (numbersOnly.match(/\./g) || []).length
      if (dotCount === 1 && numbersOnly.split('.')[1].length <= 2) {
        // Provavelmente decimal
        numericValue = parseFloat(numbersOnly)
      } else {
        // Provavelmente milhares
        const integerPart = numbersOnly.replace(/\./g, '')
        numericValue = parseFloat(integerPart)
      }
    } else {
      // Só números
      numericValue = parseFloat(numbersOnly)
    }
    
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue)
    
    return formatted
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



  const handleAnexoCurrencyBlur = (anexoKey: string, index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'valorDe' || field === 'valorAte' || field === 'desconto') {
      const value = event.target.value
      const formattedValue = formatCurrency(value)
      
      const updated = { ...anexosSimples }
      const previousValue = updated[anexoKey][index][field]
      
      // Se o campo for valorDe ou valorAte, sincronizar com todos os anexos
      if (field === 'valorDe' || field === 'valorAte') {
        const anexoKeys = getAnexoKeys()
        anexoKeys.forEach(key => {
          if (updated[key] && updated[key][index]) {
            updated[key][index] = { ...updated[key][index], [field]: formattedValue }
          }
        })
      } else {
        // Para desconto, atualizar apenas o anexo atual
        updated[anexoKey][index] = { ...updated[anexoKey][index], [field]: formattedValue }
      }
      
      setAnexosSimples(updated)
      
      if (previousValue !== formattedValue) {
        markAsDirty()
		      // Notificar o componente pai sobre as alterações de formatação
      if (onDataChange) {
        onDataChange({
          anexosSimples: updated,
          hasChanges: true
        })
      }
      }
    }
  }



  const handleModalAnexoCurrencyBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    if (field === 'valorDe' || field === 'valorAte' || field === 'desconto') {
      const value = event.target.value
      const formattedValue = formatCurrency(value)
      setNewAnexoItem(prev => prev ? {...prev, [field]: formattedValue} : null)
    }
  }

  // Funções para atualizar dados
  const updateAnexoItem = (anexoKey: string, index: number, field: string, value: string) => {
    const updated = { ...anexosSimples }
    
    // Se o campo for valorDe ou valorAte, sincronizar com todos os anexos
    if (field === 'valorDe' || field === 'valorAte') {
      const anexoKeys = getAnexoKeys()
      anexoKeys.forEach(key => {
        if (updated[key] && updated[key][index]) {
          updated[key][index] = { ...updated[key][index], [field]: value }
        }
      })
    } else {
      // Para aliquota e desconto, atualizar apenas o anexo atual
      updated[anexoKey][index] = { ...updated[anexoKey][index], [field]: value }
    }
    
    setAnexosSimples(updated)
    markAsDirty()
  }

  // Função para salvar as alterações
  const handleSaveAnexos = async () => {
    if (!isDirty) return
    
    try {
      // Estrutura de dados para persistência
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        anexosSimples: anexosSimples
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA ===')
      console.log('Salvando alterações dos anexos:', JSON.stringify(dataToSave, null, 2))
      
    // SALVAMENTO PERMANENTE NO NAVEGADOR
    localStorage.setItem('anexosSimples_data', JSON.stringify(dataToSave))
    
    console.log('? Dados salvos permanentemente no navegador!')
      
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

  // Funções para gerenciar anexos
  const addAnexoItem = () => {
    // Verifica se os campos têm valores válidos
    if (!newAnexoItem) return
    
    const valorDeValid = newAnexoItem.valorDe.replace(/[^\d,\.]/g, '') !== ''
    const valorAteValid = newAnexoItem.valorAte.replace(/[^\d,\.]/g, '') !== ''
    const aliquotaValid = newAnexoItem.aliquota.trim() !== '' && newAnexoItem.aliquota !== ''
    const descontoValid = newAnexoItem.desconto.replace(/[^\d,\.]/g, '') !== ''
    
    if (valorDeValid && valorAteValid && aliquotaValid && descontoValid) {
      const updated = { ...anexosSimples }
      const anexoKeys = getAnexoKeys()
      
      // Formatar os valores monetários antes de adicionar
      const formattedValorDe = formatCurrency(newAnexoItem.valorDe)
      const formattedValorAte = formatCurrency(newAnexoItem.valorAte)
      const formattedDesconto = formatCurrency(newAnexoItem.desconto)
      const formattedAliquota = formatPercentage(newAnexoItem.aliquota)
      
      // Adicionar a nova faixa em todos os anexos
      anexoKeys.forEach((anexoKey, anexoIndex) => {
        const itemToAdd = {
          id: nextAnexoId + anexoIndex,
          valorDe: formattedValorDe,    // Valor formatado igual para todos
          valorAte: formattedValorAte,  // Valor formatado igual para todos
          aliquota: anexoKey === currentAnexo ? formattedAliquota : '0%',      // Alíquota apenas no anexo atual
          desconto: anexoKey === currentAnexo ? formattedDesconto : 'R$ 0,00'  // Desconto apenas no anexo atual
        }
        updated[anexoKey] = [...updated[anexoKey], itemToAdd]
      })
      
      setAnexosSimples(updated)
      setNextAnexoId(nextAnexoId + anexoKeys.length)
      setNewAnexoItem({ id: 0, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0,00%', desconto: 'R$ 0,00' })
      setShowAddAnexoModal(false)
      markAsDirty()
    }
  }

  const removeAnexoItem = (anexoKey: string, id: number) => {
    const updated = { ...anexosSimples }
    const anexoKeys = getAnexoKeys()
    
    // Encontrar o índice do item a ser removido
    const itemIndex = updated[anexoKey].findIndex(item => item.id === id)
    
    if (itemIndex !== -1) {
      // Remover a faixa da mesma posição em todos os anexos
      anexoKeys.forEach(key => {
        if (updated[key] && updated[key][itemIndex]) {
          updated[key].splice(itemIndex, 1)
        }
      })
    }
    
    setAnexosSimples(updated)
    setShowRemoveAnexoConfirm(false)
    setAnexoToRemove(null)
    markAsDirty()
  }

  const handleRemoveAnexoClick = (anexoKey: string, item: AnexoItem) => {
    setAnexoToRemove({ ...item, anexoKey })
    setShowRemoveAnexoConfirm(true)
  }

 // Função para obter a faixa de receita formatada com numeração
 const getFaixaReceitaWithIndex = (item: AnexoItem, faixaIndex?: number) => {
   if (faixaIndex !== undefined && faixaIndex >= 0) {
     const totalFaixas = anexosSimples[currentAnexo]?.length || 0
     const faixaNumber = (faixaIndex + 1).toString().padStart(2, '0')
     const totalNumber = totalFaixas.toString().padStart(2, '0')
     return `${faixaNumber}/${totalNumber}: ${item.valorDe} - ${item.valorAte}`
   }
   return `${item.valorDe} - ${item.valorAte}`
 }

 // Função para obter a faixa de receita formatada simples
 const getFaixaReceita = (item: AnexoItem | null) => {
   if (!item) return ''
   return `${item.valorDe} - ${item.valorAte}`
 }

 // Função para obter impostos zerados para nova faixa
 const getImpostosZerados = () => {
   return [
     { id: '1', descricao: 'IRPJ', percentual: 0 },
     { id: '2', descricao: 'CSLL', percentual: 0 },
     { id: '3', descricao: 'COFINS', percentual: 0 },
     { id: '4', descricao: 'PIS', percentual: 0 },
     { id: '5', descricao: 'CPP', percentual: 0 },
     { id: '6', descricao: 'ICMS', percentual: 0 },
     { id: '7', descricao: 'IPI', percentual: 0 },
     { id: '8', descricao: 'ISS', percentual: 0 }
   ]
 }


// Função para obter impostos embutidos por anexo e faixa
const getImpostosEmbutidos = (anexoKey: string, faixaIndex: number) => {
  const anexoNumber = getAnexoNumber(anexoKey)
  
  // Dados dos impostos embutidos por anexo e faixa
  const impostosData: { [key: number]: Array<{ IRPJ: number; CSLL: number; COFINS: number; PIS: number; CPP: number; ICMS: number; IPI: number; ISS: number }> } = {
    1: [ // Anexo 01
      { IRPJ: 0.22, CSLL: 0.14, COFINS: 0.51, PIS: 0.11, CPP: 1.66, ICMS: 1.36, IPI: 0.00, ISS: 0.00 },
      { IRPJ: 0.40, CSLL: 0.26, COFINS: 0.93, PIS: 0.20, CPP: 3.03, ICMS: 2.48, IPI: 0.00, ISS: 0.00 },
      { IRPJ: 0.49, CSLL: 0.32, COFINS: 1.21, PIS: 0.26, CPP: 3.80, ICMS: 3.42, IPI: 0.00, ISS: 0.00 },
      { IRPJ: 0.60, CSLL: 0.37, COFINS: 1.36, PIS: 0.30, CPP: 4.49, ICMS: 3.58, IPI: 0.00, ISS: 0.00 },
      { IRPJ: 0.81, CSLL: 0.50, COFINS: 1.82, PIS: 0.39, CPP: 6.01, ICMS: 4.79, IPI: 0.00, ISS: 0.00 },
      { IRPJ: 2.57, CSLL: 1.90, COFINS: 5.37, PIS: 1.16, CPP: 8.00, ICMS: 0.00, IPI: 0.00, ISS: 0.00 }
    ],
    2: [ // Anexo 02
      { IRPJ: 0.25, CSLL: 0.16, COFINS: 0.52, PIS: 0.11, CPP: 1.68, ICMS: 1.44, IPI: 0.34, ISS: 0.00 },
      { IRPJ: 0.43, CSLL: 0.27, COFINS: 0.90, PIS: 0.19, CPP: 2.92, ICMS: 2.50, IPI: 0.59, ISS: 0.00 },
      { IRPJ: 0.55, CSLL: 0.35, COFINS: 1.15, PIS: 0.25, CPP: 3.75, ICMS: 3.20, IPI: 0.75, ISS: 0.00 },
      { IRPJ: 0.62, CSLL: 0.39, COFINS: 1.29, PIS: 0.28, CPP: 4.20, ICMS: 3.58, IPI: 0.84, ISS: 0.00 },
      { IRPJ: 0.81, CSLL: 0.51, COFINS: 1.69, PIS: 0.38, CPP: 5.51, ICMS: 4.70, IPI: 1.10, ISS: 0.00 },
      { IRPJ: 2.55, CSLL: 2.25, COFINS: 6.29, PIS: 1.36, CPP: 7.05, ICMS: 0.00, IPI: 10.50, ISS: 0.00 }
    ],
    3: [ // Anexo 03
      { IRPJ: 0.24, CSLL: 0.21, COFINS: 0.77, PIS: 0.17, CPP: 2.60, ICMS: 0.00, IPI: 0.00, ISS: 2.01 },
      { IRPJ: 0.46, CSLL: 0.39, COFINS: 1.57, PIS: 0.34, CPP: 4.86, ICMS: 0.00, IPI: 0.00, ISS: 3.58 },
      { IRPJ: 0.54, CSLL: 0.47, COFINS: 1.84, PIS: 0.40, CPP: 5.86, ICMS: 0.00, IPI: 0.00, ISS: 4.39 },
      { IRPJ: 0.64, CSLL: 0.56, COFINS: 2.18, PIS: 0.47, CPP: 6.95, ICMS: 0.00, IPI: 0.00, ISS: 5.20 },
      { IRPJ: 0.84, CSLL: 0.74, COFINS: 2.69, PIS: 0.58, CPP: 9.11, ICMS: 0.00, IPI: 0.00, ISS: 7.04 },
      { IRPJ: 11.54, CSLL: 4.95, COFINS: 5.29, PIS: 1.15, CPP: 10.07, ICMS: 0.00, IPI: 0.00, ISS: 0.00 }
    ],
    4: [ // Anexo 04
      { IRPJ: 0.85, CSLL: 0.68, COFINS: 0.80, PIS: 0.17, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 2.00 },
      { IRPJ: 1.78, CSLL: 1.37, COFINS: 1.85, PIS: 0.40, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 3.60 },
      { IRPJ: 2.12, CSLL: 1.55, COFINS: 2.01, PIS: 0.44, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 4.08 },
      { IRPJ: 2.49, CSLL: 2.69, COFINS: 2.65, PIS: 0.57, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 5.60 },
      { IRPJ: 4.14, CSLL: 4.22, COFINS: 3.98, PIS: 0.86, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 8.80 },
      { IRPJ: 17.65, CSLL: 7.10, COFINS: 6.78, PIS: 1.47, CPP: 0.00, ICMS: 0.00, IPI: 0.00, ISS: 0.00 }
    ],
    5: [ // Anexo 05
      { IRPJ: 3.87, CSLL: 2.33, COFINS: 2.19, PIS: 0.47, CPP: 4.47, ICMS: 0.00, IPI: 0.00, ISS: 2.17 },
      { IRPJ: 4.14, CSLL: 2.70, COFINS: 2.54, PIS: 0.55, CPP: 5.01, ICMS: 0.00, IPI: 0.00, ISS: 3.06 },
      { IRPJ: 4.67, CSLL: 2.93, COFINS: 2.91, PIS: 0.63, CPP: 4.65, ICMS: 0.00, IPI: 0.00, ISS: 3.71 },
      { IRPJ: 4.31, CSLL: 3.08, COFINS: 3.22, PIS: 0.70, CPP: 4.88, ICMS: 0.00, IPI: 0.00, ISS: 4.31 },
      { IRPJ: 5.28, CSLL: 2.88, COFINS: 3.24, PIS: 0.70, CPP: 5.49, ICMS: 0.00, IPI: 0.00, ISS: 5.41 },
      { IRPJ: 10.67, CSLL: 4.73, COFINS: 5.01, PIS: 1.09, CPP: 9.00, ICMS: 0.00, IPI: 0.00, ISS: 0.00 }
    ]
  }
  
  const faixaData = impostosData[anexoNumber]?.[faixaIndex]
  if (!faixaData) return []
  
  // Retorna os impostos no formato esperado pelo modal
  return [
    { id: '1', descricao: 'IRPJ', percentual: faixaData.IRPJ },
    { id: '2', descricao: 'CSLL', percentual: faixaData.CSLL },
    { id: '3', descricao: 'COFINS', percentual: faixaData.COFINS },
    { id: '4', descricao: 'PIS', percentual: faixaData.PIS },
    { id: '5', descricao: 'CPP', percentual: faixaData.CPP },
    { id: '6', descricao: 'ICMS', percentual: faixaData.ICMS },
    { id: '7', descricao: 'IPI', percentual: faixaData.IPI },
    { id: '8', descricao: 'ISS', percentual: faixaData.ISS }
  ]
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
            Empresas / Anexos simples nacional
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
                onClick={handleSaveAnexos}
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
            

            {/* Modal de Alíquota */}
    {showAliquotaModal && (
      <BD_AnexosSimples_Aliquota
        isOpen={showAliquotaModal}
        onClose={closeAliquotaModal}
faixaReceita={getFaixaReceita(newAnexoItem)}

        anexoNome={getAnexoDisplayName(currentAnexo)}
        impostos={getImpostosZerados()}
		onSave={saveAliquotaModal}
      />
    )}


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

        {/* Container das Abas dos Anexos com botões de gerenciamento */}
        <div className="px-[8px] py-[0px] pt-[10px] mx-[5px] flex justify-between items-center"> 
          <div className="flex-1 flex justify-center">
            <div className="flex bg-[#F8FAFC] rounded-[8px] p-[4px] gap-[4px] w-fit"> 
              {getAnexoKeys().map((anexoKey) => (
                <button
                  key={anexoKey}
                  onClick={() => setCurrentAnexo(anexoKey)}
                  className={`flex items-center justify-center py-[14px] px-[16px] rounded-[6px] font-inter text-[14px] font-medium whitespace-nowrap ${
                    currentAnexo === anexoKey
                      ? 'bg-white text-[#1777CF] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#374151] hover:bg-white/60'
                  }`}
                >
                  {getAnexoDisplayName(anexoKey)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Botões de gerenciamento das abas */}
          <div className="flex items-center gap-[8px] mr-[10px]">
            {/* Botão Adicionar Nova Aba */}
            <button
              onClick={addNewAnexo}
              className="w-[36px] h-[36px] bg-[#1777CF] text-white rounded-[6px] hover:bg-[#1565C0] transition-colors duration-200 flex items-center justify-center shadow-sm"
              title="Adicionar nova aba de anexo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            
            {/* Botão Remover Aba Atual */}
            <button
              onClick={() => setShowRemoveTabConfirm(true)}
              disabled={getAnexoKeys().length <= 1}
              className={`w-[36px] h-[36px] rounded-[6px] transition-colors duration-200 flex items-center justify-center shadow-sm ${
                getAnexoKeys().length <= 1
                  ? 'bg-[#9CA3AF] text-[#6B7280] cursor-not-allowed opacity-50'
                  : 'bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer'
              }`}
              title={getAnexoKeys().length <= 1 ? "Não é possível remover a última aba" : "Remover aba atual"}
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
        
        {/* Cabeçalho da Tabela - Fixo */}
        <div className="bg-[#F8FAFC] border-t border-b border-[#E5E7EB] sticky top-0 z-10 mt-[10px]">
          <div className="flex w-full items-center pl-[105px]"> 
            <div className="flex-1 text-left pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px] flex items-center">
			  Receita bruta total em 12 meses
            </div>
            <div className="flex items-center ml-[-60px]">
              <div className="w-[124px] text-center pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px] flex items-center justify-center">
				Alíquota
              </div>
              <div className="w-[164px] text-center pl-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px] flex items-center justify-center">
				Valor a deduzir
              </div>
              <div className="w-[56px] text-center ml-[10px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px] flex items-center justify-center"></div>
            </div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[10px] mt-[5px] mb-[5px]">
          <div className="w-full">
            {anexosSimples[currentAnexo]?.map((item, index) => (
              <div key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[12px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                <div className="flex w-full items-center pl-[0px] pr-[0px]">
                  <div className="flex-1 p-[12px] text-left mr-[24px]">
                    <div className="flex items-center gap-[8px] justify-start">
                      <span className="text-[#6B7280] text-[14px] font-inter min-w-[24px] text-[15px]">De:</span>
                      <MonetaryInput
                        value={item.valorDe}
                        onChange={(e) => {
                          const formattedValue = handleCurrencyChange(e.target.value)
                          updateAnexoItem(currentAnexo, index, 'valorDe', formattedValue)
                        }}
                        onBlur={(e) => handleAnexoCurrencyBlur(currentAnexo, index, 'valorDe', e)}
                        onKeyDown={handleEnterKeyPress}
                        className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                        anexoKey={currentAnexo}
                        index={index}
                        field="valorDe"
                      />
                      <span className="text-[#6B7280] text-[14px] font-inter min-w-[16px] ml-[8px] text-[15px]">A:</span>
                      <MonetaryInput
                        value={item.valorAte}
                        onChange={(e) => {
                          const formattedValue = handleCurrencyChange(e.target.value)
                          updateAnexoItem(currentAnexo, index, 'valorAte', formattedValue)
                        }}
                        onBlur={(e) => handleAnexoCurrencyBlur(currentAnexo, index, 'valorAte', e)}
                        onKeyDown={handleEnterKeyPress}
                        className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                        anexoKey={currentAnexo}
                        index={index}
                        field="valorAte"
                      />
                    </div>
                  </div>
                  <div className="w-[124px] p-[12px] flex justify-center items-center">
  <button
    onClick={() => openAliquotaModal(item, index)}
    className="w-[100px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] hover:border-[#1777CF] hover:bg-[#F9FAFB] transition-colors text-center bg-white"
  >
    {item.aliquota}
  </button>

                  </div>
                  <div className="w-[164px] p-[12px] flex justify-center items-center">
                    <MonetaryInput
                      value={item.desconto}
                      onChange={(e) => {
                        const formattedValue = handleCurrencyChange(e.target.value)
                        updateAnexoItem(currentAnexo, index, 'desconto', formattedValue)
                      }}
                      onBlur={(e) => handleAnexoCurrencyBlur(currentAnexo, index, 'desconto', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-[150px] px-[8px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                      anexoKey={currentAnexo}
                      index={index}
                      field="desconto"
                    />
                  </div>
                  <div className="w-[56px] p-[12px] flex justify-center items-center">
                    <button
                      onClick={() => handleRemoveAnexoClick(currentAnexo, item)}
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
              Adicionar Nova Faixa
            </h3>
            <p className="text-[14px] text-[#6B7280] text-center mb-[24px] font-inter">
              Esta faixa será adicionada a todos os anexos. Apenas a alíquota e valor a deduzir serão aplicados ao anexo atual.
            </p>

            {/* Formulário */}
            <div className="space-y-[20px] mb-[32px]">
              <div className="grid grid-cols-2 gap-[20px]">
                <div>
                  <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                    Valor De *
                  </label>
                 <input
                   type="text"
                   value={newAnexoItem?.valorDe || ''}
                   onChange={(e) => {
                     const formattedValue = handleCurrencyChange(e.target.value)
                     setNewAnexoItem(prev => prev ? {...prev, valorDe: formattedValue} : null)
                   }}
                   onBlur={(e) => handleModalAnexoCurrencyBlur('valorDe', e)}
                   onKeyDown={handleEnterKeyPress}
                   className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center bg-white"
                   placeholder="Ex: R$ 1.800.000,01"
                 />

                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                    Valor Até *
                  </label>
                  <MonetaryInput
                    value={newAnexoItem?.valorAte || ''}
                    onChange={(e) => {
                      const formattedValue = handleCurrencyChange(e.target.value)
                      setNewAnexoItem(prev => prev ? {...prev, valorAte: formattedValue} : null)
                    }}
                    onBlur={(e) => handleModalAnexoCurrencyBlur('valorAte', e)}
                    onKeyDown={handleEnterKeyPress}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none text-center"
                    placeholder="Ex: R$ 3.600.000,00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-[20px]">
                <div>
                  <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                    Alíquota *
                  </label>
                  <button
                    onClick={() => newAnexoItem && openAliquotaModal(newAnexoItem, -1)}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter hover:border-[#1777CF] hover:bg-[#F9FAFB] transition-colors text-center bg-white"
                  >
                    {newAnexoItem?.aliquota || "0%"}
                  </button>


                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#374151] mb-[8px] font-inter">
                    Valor a deduzir *
                  </label>
                  <MonetaryInput
                    value={newAnexoItem?.desconto || ''}
                    onChange={(e) => {
                      const formattedValue = handleCurrencyChange(e.target.value)
                      setNewAnexoItem(prev => prev ? {...prev, desconto: formattedValue} : null)
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
            <div className="flex gap-[16px] justify-end pr-[15px]">
              <button
                onClick={() => {
                  setShowAddAnexoModal(false)
                  setNewAnexoItem({ id: 0, valorDe: 'R$ 0,00', valorAte: 'R$ 0,00', aliquota: '0,00%', desconto: 'R$ 0,00' })
                }}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addAnexoItem}
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
              Tem certeza que deseja remover esta faixa de valores de <strong>todos os anexos</strong>?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação afetará todos os anexos e não pode ser desfeita.
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
                onClick={() => anexoToRemove && removeAnexoItem(anexoToRemove.anexoKey, anexoToRemove.id)}
                className="px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção de Aba */}
      {showRemoveTabConfirm && (
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
              Remover Anexo
            </h3>

            {/* Mensagem */}
            <p className="text-[16px] text-[#6B7280] text-center mb-[8px] leading-[24px] font-inter">
              Tem certeza que deseja remover o <strong>{getAnexoDisplayName(currentAnexo)}</strong> e todos os seus dados?
            </p>
            <p className="text-[14px] text-[#DC2626] text-center mb-[32px] font-inter">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-[16px] justify-center">
              <button 
                onClick={() => setShowRemoveTabConfirm(false)}
                className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button> 
              <button
                onClick={removeCurrentAnexo}
                className="px-[24px] py-[12px] bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Sim, remover anexo
              </button>
            </div> 
          </div>
        </div>
      )}
	  
 	        {/* Modal de Alíquota */}
       {showAliquotaModal && selectedAliquotaItem && (
         <BD_AnexosSimples_Aliquota
           isOpen={showAliquotaModal}
           onClose={closeAliquotaModal}
           faixaReceita={getFaixaReceitaWithIndex(selectedAliquotaItem, selectedAliquotaIndex)}
           anexoNome={getAnexoDisplayName(currentAnexo)}
           impostos={selectedAliquotaIndex === -1 ? getImpostosZerados() : getImpostosEmbutidos(currentAnexo, selectedAliquotaIndex >= 0 ? selectedAliquotaIndex : 0)}
           onSave={saveAliquotaModal}
         />
       )}
 
    </>
  )
}