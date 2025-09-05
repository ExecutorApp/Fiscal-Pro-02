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

// Ícone de Porcentagem
const PercentIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
)

// Ícone de Moeda
const CurrencyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

interface BDFEstadoICMSProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDFEstadoICMS: React.FC<BDFEstadoICMSProps> = ({ onDataChange, onSaveComplete }) => {
  // Usar contexto global para estados ICMS
  const { 
    estadosICMS: EstadoICMSFromContext, 
    addEstadoICMS: addEstadoICMSGlobal, 
    removeEstadoICMS: removeEstadoICMSGlobal, 
    updateEstadoICMS: updateEstadoICMSGlobal, 
    saveEstadosICMS: saveEstadosICMSGlobal,
    isDirty: isGlobalDirty,
    setIsDirty: setGlobalIsDirty
  } = useEstadosICMS()

  // Estado LOCAL para gerenciar os dados (bypass do bug do contexto)
  const [localEstadoICMS, setLocalEstadoICMS] = useState(EstadoICMSFromContext || [])
  const [localIsDirty, setLocalIsDirty] = useState(false)
  // Estado para armazenar dados originais para comparação
  const [initialEstadoICMS, setInitialEstadoICMS] = useState(EstadoICMSFromContext || [])


  // Sincronizar estado local com contexto na inicialização
  useEffect(() => {
    if (EstadoICMSFromContext && EstadoICMSFromContext.length > 0) {
      setLocalEstadoICMS(EstadoICMSFromContext)
	  setInitialEstadoICMS(JSON.parse(JSON.stringify(EstadoICMSFromContext))) // Deep copy
    }
  }, [EstadoICMSFromContext])

  // Debug: verificar se as funções do contexto foram carregadas
  console.log('🔍 Funções do contexto:', {
    updateEstadoICMSGlobal: typeof updateEstadoICMSGlobal,
    EstadoICMS: localEstadoICMS?.length || 0
  })

  // Estado para modais
  const [showAddEstadoICMSModal, setShowAddEstadoICMSModal] = useState(false)
  const [showRemoveEstadoICMSConfirm, setShowRemoveEstadoICMSConfirm] = useState(false)
  const [estadoICMSToRemove, setEstadoICMSToRemove] = useState(null)
  
  // Estados para controle local de modais
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [newEstadoICMS, setNewEstadoICMS] = useState({
    estado: '',
    percentual: '',
    incentivo: '',
    contribuicaoNome: '',
    contribuicaoPercentual: '',
    contribuicaoValorFixo: '',
    contribuicaoTipo: 'percentual' as 'percentual' | 'monetario'
  })

  // SOLUÇÃO SIMPLES: Estado local para cada botão
  const [tiposPorLinha, setTiposPorLinha] = useState<{[key: number]: 'percentual' | 'monetario'}>({})

  /*
  ========================================
  COMPORTAMENTO VISUAL E FUNCIONAL DOS CAMPOS
  ========================================
  
  ESTADO INICIAL:
  - Botão: configurado como "%" (padrão)
  - Campo valor: placeholder "0%" em cinza claro
  - Campo nome: largura otimizada para 1-2 palavras
  
  ALTERNÂNCIA PARA "R$":
  - Campo valor: placeholder "R$ 0,00" em cinza claro
  - NÃO é valor preenchido, é placeholder
  
  DIGITAÇÃO PELO USUÁRIO:
  - Campo nome: primeira letra sempre maiúscula
  - Campo valor: texto muda para preto (valor real)
  - Formatação: aplicada ao sair do campo
  - Conversão: automática ao alternar botão
  
  REGRAS DE CAPITALIZAÇÃO:
  - "incentivo estadual" → "Incentivo estadual"
  - "INCENTIVO ESTADUAL" → "INCENTIVO ESTADUAL"
  - Apenas primeira letra é alterada
  
  REGRAS DE FORMATAÇÃO:
  - Porcentagem inteira: "15%" (sem vírgula)
  - Porcentagem decimal: "15,30%" (com vírgula)
  - Monetário: "R$ 15,00" (sempre duas casas)
  - Campo vazio: placeholder cinza, não valor preto
  
  LAYOUT OTIMIZADO:
  - Campo nome: largura fixa 120px (1-2 palavras)
  - Campos alinhados e responsivos
  ========================================
  */

  // useEffect para monitorar mudanças no estado local e notificar o pai
  useEffect(() => {
   if (onDataChange) {
     onDataChange({
       EstadoICMS: localEstadoICMS,
       hasChanges: localIsDirty
     })
   }
  }, [localIsDirty, localEstadoICMS, onDataChange])
  
   // useEffect para sincronizar tiposPorLinha com o estado atual dos dados
 useEffect(() => {
   const newTiposPorLinha: {[key: number]: 'percentual' | 'monetario'} = {}
   
   localEstadoICMS.forEach((item, index) => {
     // Determinar o tipo baseado nos dados existentes ou no campo contribuicaoTipo
     if (item.contribuicaoTipo) {
       newTiposPorLinha[index] = item.contribuicaoTipo
     } else if (item.contribuicaoValorFixo && item.contribuicaoValorFixo.trim() !== '') {
       newTiposPorLinha[index] = 'monetario'
     } else {
       newTiposPorLinha[index] = 'percentual'
     }
   })
   
   setTiposPorLinha(newTiposPorLinha)
 }, [localEstadoICMS])


  // Função para extrair valor numérico de string formatada
  const extractNumericValue = (value: string): number => {
    if (!value || value.trim() === '') return 0
    
    // Remove todos os caracteres não numéricos exceto vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, '')
    
    // Converte vírgula para ponto se necessário
    const normalized = cleaned.replace(',', '.')
    
    const numeric = parseFloat(normalized)
    return isNaN(numeric) ? 0 : numeric
  }
  
   // Função para detectar automaticamente o tipo de contribuição no modal
 const detectContribuicaoTipo = (): 'percentual' | 'monetario' => {
   const hasPercentual = newEstadoICMS.contribuicaoPercentual.trim() !== ''
   const hasValorFixo = newEstadoICMS.contribuicaoValorFixo.trim() !== ''
   
   if (hasValorFixo && !hasPercentual) {
     return 'monetario'
   } else {
     return 'percentual'
   }
 }


 // Função para comparar estados e verificar se houve mudanças reais
 const checkForRealChanges = (current: any[], initial: any[]): boolean => {
   if (current.length !== initial.length) return true
   
   for (let i = 0; i < current.length; i++) {
     const currentItem = current[i]
     const initialItem = initial[i]
     
     // Comparar campos relevantes
     if (currentItem.estado !== initialItem.estado) return true
     if (currentItem.percentual !== initialItem.percentual) return true
     if ((currentItem.incentivo || '') !== (initialItem.incentivo || '')) return true
     if ((currentItem.contribuicaoNome || '') !== (initialItem.contribuicaoNome || '')) return true
     if ((currentItem.contribuicaoPercentual || '') !== (initialItem.contribuicaoPercentual || '')) return true
     if ((currentItem.contribuicaoValorFixo || '') !== (initialItem.contribuicaoValorFixo || '')) return true
   }
   
   return false
 }

  // Função para converter valor de % para R$
  const convertPercentToCurrency = (percentValue: string): string => {
    const numeric = extractNumericValue(percentValue)
    if (numeric === 0) return ''
    
    // Formatar como moeda brasileira
    return `R$ ${numeric.toFixed(2).replace('.', ',')}`
  }

  // Função para converter valor de R$ para %
  const convertCurrencyToPercent = (currencyValue: string): string => {
    const numeric = extractNumericValue(currencyValue)
    if (numeric === 0) return ''
    
    // REGRA: Se for inteiro, não mostrar casas decimais
    if (numeric % 1 === 0) {
      return `${Math.round(numeric)}%`
    } else {
      // Se for decimal, mostrar com duas casas
      return `${numeric.toFixed(2).replace('.', ',')}%`
    }
  }

  // Função MELHORADA para alternar tipo com conversão automática
  const toggleContribuicaoTipo = (index: number) => {
    const tipoAtual = tiposPorLinha[index] || 'percentual'
    const novoTipo = tipoAtual === 'percentual' ? 'monetario' : 'percentual'
    
    console.log('🔄 toggleContribuicaoTipo chamada:', { index, tipoAtual, novoTipo })
    
    // Obter o valor atual do campo
    const item = localEstadoICMS[index]
    const valorAtual = item?.contribuicaoPercentual || item?.contribuicaoValorFixo || ''
	const nomeContribuicao = item?.contribuicaoNome || ''
    
      console.log('?? Valor atual:', valorAtual)
  console.log('?? Nome contribuição:', nomeContribuicao)
  
  // Atualizar o tipo
  setTiposPorLinha(prev => ({
    ...prev,
    [index]: novoTipo
  }))
  
     // Atualizar o campo contribuicaoTipo no item de dados
   updateEstadoICMSLocal(index, 'contribuicaoTipo', novoTipo)
  
  // Verificar se há dados reais preenchidos para decidir se marca como dirty
  const hasRealData = valorAtual.trim() !== '' || nomeContribuicao.trim() !== ''
  
  if (hasRealData) {
    // Há dados reais - limpar campos e marcar como dirty (pois está removendo dados)
    console.log('?? Limpando campos - tinha dados reais')
    updateEstadoICMSLocal(index, 'contribuicaoValorFixo', '')
    updateEstadoICMSLocal(index, 'contribuicaoPercentual', '')
  } else {
    // Não há dados reais - apenas alternar o tipo visual (NÃO marca como dirty)
    console.log('?? Apenas alternando tipo visual - sem dados reais')
    // NÃO atualizar os dados do estado principal para não marcar como dirty
  }

    console.log('✅ Conversão concluída:', { 
      valorOriginal: valorAtual, 
      novoTipo,
	  hasRealData
    })
  }

  // Função para obter placeholder dinâmico MELHORADA
  const getContribuicaoPlaceholder = (index: number) => {
    const tipo = tiposPorLinha[index] || 'percentual'
    return tipo === 'percentual' ? '0%' : 'R$ 0,00'
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

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    if (!value || value.trim() === '') return value
  
  // Remover "R$" e espaços para análise
  let cleanValue = value.replace(/R\$\s?/g, '').trim()
  
  // Se vazio após limpeza, retornar vazio
  if (cleanValue === '') return value
  
  // Remover todos os caracteres não numéricos exceto vírgula e ponto
  cleanValue = cleanValue.replace(/[^\d,.-]/g, '')
  
  // Converter para número
  let numericValue = 0
  
  if (cleanValue.includes(',')) {
    // Formato brasileiro: "1.000,50" ou "1000,50"
    const parts = cleanValue.split(',')
    const integerPart = parts[0].replace(/\./g, '') // Remove pontos dos milhares
    const decimalPart = parts[1] || '00'
    numericValue = parseFloat(integerPart + '.' + decimalPart.substring(0, 2))
  } else if (cleanValue.includes('.')) {
    // Verificar se é separador de milhares ou decimal
    const parts = cleanValue.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
      // É separador de milhares: "1.000" ou "1.000.000"
      numericValue = parseFloat(cleanValue.replace(/\./g, ''))
    } else {
      // É decimal em formato inglês: "1000.50"
      numericValue = parseFloat(cleanValue)
    }
  } else {
    // Apenas números: "1000" ou "15"
    numericValue = parseFloat(cleanValue)
  }
  
  // Se não é um número válido, retornar valor original
  if (isNaN(numericValue)) return value
  
  // Formatar no padrão brasileiro
  const formatted = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return `R$ ${formatted}`
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
  const handleEstadoICMSPercentageBlur = (index: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    
    updateEstadoICMSLocal(index, field, formattedValue)
  }

  // Função para aplicar formatação no modal
  const handleModalEstadoICMSPercentageBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    const formattedValue = formatPercentage(value)
    setNewEstadoICMS({...newEstadoICMS, [field]: formattedValue})
  }

  // Função para formatação monetária no modal CORRIGIDA para preservar valores digitados
  const handleModalCurrencyBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value
    let formattedValue = value
    
    if (value.trim() !== '') {
      // Remover apenas "R$" e espaços, preservar pontos e vírgulas
      let cleanValue = value.replace(/R\$\s?/g, '').trim()
      
      // Converter para número considerando formato brasileiro ou simples
      let numericValue = 0
      
      if (cleanValue.includes(',')) {
        // Formato brasileiro: pontos para milhares, vírgula para decimal
        // Ex: "1.000,50" ou "1000,50"
        const parts = cleanValue.split(',')
        const integerPart = parts[0].replace(/\./g, '') // Remove pontos dos milhares
        const decimalPart = parts[1] || '00'
        numericValue = parseFloat(integerPart + '.' + decimalPart)
      } else if (cleanValue.includes('.')) {
        // Pode ser milhares (1.000) ou decimal em formato inglês (1000.50)
        // Verificar se há mais de um ponto ou se o que vem depois do ponto tem mais de 2 dígitos
        const parts = cleanValue.split('.')
        if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
          // É separador de milhares: "1.000" ou "1.000.000"
          numericValue = parseFloat(cleanValue.replace(/\./g, ''))
        } else {
          // É decimal em formato inglês: "1000.50"
          numericValue = parseFloat(cleanValue)
        }
      } else {
        // Apenas números: "1000"
        numericValue = parseFloat(cleanValue)
      }
      
      if (!isNaN(numericValue)) {
        // Formatar com separador de milhares (ponto) e duas casas decimais
        const formatted = numericValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        formattedValue = `R$ ${formatted}`
      }
    }
    
    setNewEstadoICMS({...newEstadoICMS, [field]: formattedValue})
  }

  // Função para controlar campos mutuamente exclusivos com capitalização
  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value
    
    // Aplicar capitalização para o campo nome da contribuição
    if (field === 'contribuicaoNome') {
      processedValue = capitalizeFirstLetter(value)
    }
    
    if (field === 'contribuicaoPercentual') {
      setNewEstadoICMS({
        ...newEstadoICMS,
        contribuicaoPercentual: processedValue,
        contribuicaoValorFixo: processedValue.trim() ? '' : newEstadoICMS.contribuicaoValorFixo
      })
    } else if (field === 'contribuicaoValorFixo') {
      setNewEstadoICMS({
        ...newEstadoICMS,
        contribuicaoValorFixo: processedValue,
        contribuicaoPercentual: processedValue.trim() ? '' : newEstadoICMS.contribuicaoPercentual
      })
    } else {
      setNewEstadoICMS({...newEstadoICMS, [field]: processedValue})
    }
  }

  // Função para obter o valor da contribuição MELHORADA (percentual ou fixo)
  const getContribuicaoValue = (item: any, index: number) => {
    const tipo = tiposPorLinha[index] || 'percentual'
    
    if (tipo === 'monetario') {
      const value = item.contribuicaoValorFixo || ''
      // Se vazio, mostrar R$ 0,00 como padrão
      return value || ''
    } else {
      return item.contribuicaoPercentual || ''
    }
  }

  // Função para lidar com mudança no valor da contribuição MELHORADA
  const handleContribuicaoValueChange = (index: number, value: string) => {
    console.log('🔄 handleContribuicaoValueChange chamada:', { index, value })
    const tipo = tiposPorLinha[index] || 'percentual'
    
    // Limpar campos opostos para evitar conflitos
    if (tipo === 'monetario') {
      updateEstadoICMSLocal(index, 'contribuicaoValorFixo', value)
      updateEstadoICMSLocal(index, 'contribuicaoPercentual', '')
    } else {
      updateEstadoICMSLocal(index, 'contribuicaoPercentual', value)
      updateEstadoICMSLocal(index, 'contribuicaoValorFixo', '')
    }
  }

  // Função para formatação ao sair do campo de contribuição
  const handleContribuicaoValueBlur = (index: number, event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value.trim()
    console.log('🔄 handleContribuicaoValueBlur chamada:', { index, value })
    
    const tipo = tiposPorLinha[index] || 'percentual'
    
    if (tipo === 'monetario') {
      // Para monetário, só formatar se há valor real digitado
      if (value !== '') {
        const formattedValue = formatCurrency(value)
        updateEstadoICMSLocal(index, 'contribuicaoValorFixo', formattedValue)
      }
    } else {
      // Para porcentagem, só formatar se há valor real digitado
      if (value !== '') {
        const formattedValue = formatPercentage(value)
        updateEstadoICMSLocal(index, 'contribuicaoPercentual', formattedValue)
      }
    }
  }

  // Função para capitalizar primeira letra apenas
  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  // Função para lidar com mudança no campo nome da contribuição
  const handleContribuicaoNomeChange = (index: number, value: string) => {
    console.log('🔄 Campo contribuicaoNome onChange:', { index, value })
    // Aplicar capitalização apenas na primeira letra
    const formattedValue = capitalizeFirstLetter(value)
    updateEstadoICMSLocal(index, 'contribuicaoNome', formattedValue)
  }

  // Função LOCAL corrigida para atualizar dados
  const updateEstadoICMSLocal = (index: number, field: string, value: string) => {
    console.log('🔄 updateEstadoICMSLocal chamada:', { index, field, value })
    setLocalEstadoICMS(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      console.log('✅ Item atualizado:', updated[index])
      return updated
    })
    setLocalIsDirty(true)
	   setLocalEstadoICMS(prev => {
     const updated = [...prev]
     updated[index] = { ...updated[index], [field]: value }
     console.log('? Item atualizado:', updated[index])
     
     // Verificar se há mudanças reais comparando com estado inicial
     const hasRealChanges = checkForRealChanges(updated, initialEstadoICMS)
     console.log('?? Verificação de mudanças reais:', hasRealChanges)
     setLocalIsDirty(hasRealChanges)
     
     return updated
   })
  }

// Função LOCAL para atualizar dados SEM marcar como dirty (para alternância de tipos)
const updateEstadoICMSLocalSilent = (index: number, field: string, value: string) => {
  console.log('?? updateEstadoICMSLocalSilent chamada:', { index, field, value })
  setLocalEstadoICMS(prev => {
    const updated = [...prev]
    updated[index] = { ...updated[index], [field]: value }
    console.log('? Item atualizado silenciosamente:', updated[index])
    return updated
  })
  // NÃO chama setLocalIsDirty(true)
}

  // Função para remover foco ao pressionar Enter
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }



  // Função para salvar as alterações usando contexto global
  const handleSaveEstadoICMS = async () => {
    if (!localIsDirty) return
    
    try {
      // Sincronizar estado local com contexto global antes de salvar
      // Como o contexto tem bug, vamos salvar diretamente no localStorage
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        estadosICMS: localEstadoICMS
      }

      localStorage.setItem('global_estadosICMS_data', JSON.stringify(dataToSave))
      console.log('✅ Dados salvos diretamente no localStorage!')
      
	  // Atualizar estado inicial após salvar
      setInitialEstadoICMS(JSON.parse(JSON.stringify(localEstadoICMS)))
      setLocalIsDirty(false)
      setShowSuccessMessage(true)
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)

      // Notificar o componente pai que os dados foram salvos
      if (onSaveComplete) {
        onSaveComplete()
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados de Estado e ICMS:', error)
      alert('Erro ao salvar os dados de Estado e ICMS. Verifique o console para mais detalhes.')
    }
  }

  // Funções para gerenciar Estado ICMS
  const addEstadoICMS = () => {
    if (newEstadoICMS.estado.trim() && newEstadoICMS.percentual.trim()) {
	 
	 // Determinar o tipo de contribuição baseado em qual campo foi preenchido
     let tipoContribuicao: 'percentual' | 'monetario' = 'percentual'
     if (newEstadoICMS.contribuicaoValorFixo.trim() && !newEstadoICMS.contribuicaoPercentual.trim()) {
       tipoContribuicao = 'monetario'
     }
	
      const novoEstado = {
        id: Date.now(), // ID temporário
        ...newEstadoICMS,
        contribuicaoTipo: tipoContribuicao
      }
     setLocalEstadoICMS(prev => {
       const updated = [...prev, novoEstado].sort((a, b) => 
         a.estado.localeCompare(b.estado, 'pt-BR', { sensitivity: 'base' })
       )
	   
	    // Atualizar tiposPorLinha para o novo item
       const newIndex = updated.findIndex(item => item.id === novoEstado.id)
       if (newIndex !== -1) {
         setTiposPorLinha(prev => ({
           ...prev,
           [newIndex]: tipoContribuicao
         }))
       }
 
       
       // Verificar se há mudanças reais
       const hasRealChanges = checkForRealChanges(updated, initialEstadoICMS)
       setLocalIsDirty(hasRealChanges)
       
       return updated
     })

      setNewEstadoICMS({ estado: '', percentual: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual', incentivo: '' })
      setShowAddEstadoICMSModal(false)
    }
  }

  const removeEstadoICMS = (id: number) => {
   setLocalEstadoICMS(prev => {
     const updated = prev.filter(item => item.id !== id)
     
     // Verificar se há mudanças reais
     const hasRealChanges = checkForRealChanges(updated, initialEstadoICMS)
     setLocalIsDirty(hasRealChanges)
     
     return updated
   })

    setShowRemoveEstadoICMSConfirm(false)
    setEstadoICMSToRemove(null)
  }

  const handleRemoveEstadoICMSClick = (estado: any) => {
    setEstadoICMSToRemove(estado)
    setShowRemoveEstadoICMSConfirm(true)
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

        .placeholder-gray-400::placeholder {
          color: #9CA3AF;
          opacity: 1;
        }
        
        .placeholder-center::placeholder {
          text-align: center;
        }
        
        /* Estilo para campos vazios vs preenchidos */
        .campo-contribuicao {
          color: #1F2937; /* Texto preto para valores reais */
        }
        
        .campo-contribuicao:placeholder-shown {
          color: #9CA3AF; /* Texto cinza para placeholder */
        }
        
        input:disabled::placeholder {
          color: #D1D5DB;
          opacity: 0.8;
          text-align: center;
        }
        
        .text-left {
          text-align: left !important;
        }
        
        .text-center {
          text-align: center !important;
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
            Produtor rural / Pessoa física / Estado e ICMS
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
                onClick={handleSaveEstadoICMS}
                disabled={!localIsDirty}
                className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] transition-colors text-[14px] font-medium font-inter shadow-sm ${
                  localIsDirty 
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
          <div className="flex w-full pr-[10px]"> 
            <div className="flex-1 text-left pl-[12px] pr-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]">Estado</div> 
            <div className="text-center pl-[0px] pr-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{width: '0px'}}>ICMS</div>
            <div className="text-center ml-[-60px] pr-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[15px]" style={{width: '480px'}}>Contribuição</div> 
            <div className="flex-shrink-0 w-[44px] text-center pl-[0px] pr-[0px] pt-[12px] pb-[12px] font-semibold text-[#374151] font-inter text-[14px]"></div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados */}
        <div className="flex-1 overflow-y-auto modern-scrollbar mr-[0px] mt-[5px] mb-[5px]">
          <table className="w-full">
            <tbody>
              {localEstadoICMS.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[12px] after:right-[10px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden">
                  <td className="p-[12px] text-[#1F2937] font-inter text-left text-[15px]">{formatEstadoName(item.estado)}</td>
                  <td className="p-[0px] text-center" style={{width: '160px'}}>
                    <input
                      type="text"
                      value={item.percentual}
                      onChange={(e) => updateEstadoICMSLocal(index, 'percentual', e.target.value)}
                      onBlur={(e) => handleEstadoICMSPercentageBlur(index, 'percentual', e)}
                      onKeyDown={handleEnterKeyPress}
                      className="w-[120px] px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                    />
                  </td>
                  <td className="p-[0px]" style={{width: '300px'}}>
                    <div className="flex gap-[8px] items-center justify-center">
                      <input
                        type="text"
                        value={item.contribuicaoNome || ''}
                        onChange={(e) => handleContribuicaoNomeChange(index, e.target.value)}
                        onKeyDown={handleEnterKeyPress}
                        placeholder="- - - - - - - - -" 
                        className="w-[160px] px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none placeholder-gray-400 text-center placeholder-center"
                      />
                      
                      {/* Botão de alternância de tipo com mesmo padrão do botão lixeira */}
                      <button
                        onClick={() => toggleContribuicaoTipo(index)}
                        className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                        title={`Alternar para ${(tiposPorLinha[index] || 'percentual') === 'percentual' ? 'valor em reais' : 'porcentagem'}`}
                      >
                        {(tiposPorLinha[index] || 'percentual') === 'percentual' ? <PercentIcon size={14} /> : <CurrencyIcon size={14} />}
                      </button>
                      
                      <input
                        type="text"
                        value={getContribuicaoValue(item, index)}
                        onChange={(e) => handleContribuicaoValueChange(index, e.target.value)}
                        onBlur={(e) => handleContribuicaoValueBlur(index, e)}
                        onKeyDown={handleEnterKeyPress}
                        placeholder={getContribuicaoPlaceholder(index)}
                        className="campo-contribuicao w-[100px] px-[8px] py-[4px] border border-[#D1D5DB] rounded-[4px] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center placeholder-gray-400 placeholder-center"
                      />
                    </div>
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
            <h3 className="text-[20px] font-bold text-[#1F2937] font-inter mb-[24px]">
              Adicionar Estado ICMS
            </h3>

            {/* Campo Estado */}
            <div className="mb-[20px]">
              <label className="block text-[#374151] font-semibold mb-[8px] font-inter text-[14px]">
                Estado *
              </label>
              <input
                type="text"
                value={newEstadoICMS.estado}
                onChange={(e) => setNewEstadoICMS({...newEstadoICMS, estado: e.target.value})}
                placeholder="Ex: ACRE"
                className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none"
              />
            </div>

            {/* Campo Percentual */}
            <div className="mb-[20px]">
              <label className="block text-[#374151] font-semibold mb-[8px] font-inter text-[14px]">
                Percentual *
              </label>
              <input
                type="text"
                value={newEstadoICMS.percentual}
                onChange={(e) => setNewEstadoICMS({...newEstadoICMS, percentual: e.target.value})}
                onBlur={(e) => handleModalEstadoICMSPercentageBlur('percentual', e)}
                onKeyDown={handleEnterKeyPress}
                placeholder="Ex: 19%"
                className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none"
              />
            </div>

            {/* Campo Incentivo */}
            <div className="mb-[20px]">
              <label className="block text-[#374151] font-semibold mb-[8px] font-inter text-[14px]">
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
                placeholder="00%"
                className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none"
              />
            </div>

            {/* Campo Nome da Contribuição */}
            <div className="mb-[20px]">
              <label className="block text-[#374151] font-semibold mb-[8px] font-inter text-[14px]">
                Nome da Contribuição (opcional)
              </label>
              <input
                type="text"
                value={newEstadoICMS.contribuicaoNome}
                onChange={(e) => handleFieldChange('contribuicaoNome', e.target.value)}
                placeholder="Ex: Fethab"
                className="w-full px-[16px] py-[12px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none"
              />
            </div>
            
            {/* Campos Percentual e Valor Fixo lado a lado */}
            <div className="mb-[20px]">
              <label className="block text-[#374151] font-semibold mb-[8px] font-inter text-[14px]">
                Tipo de Contribuição (opcional)
              </label>
              <div className="flex gap-[12px]">
                {/* Campo Percentual */}
                <div className="flex-1">
                  <label className="block text-[#6B7280] text-[12px] mb-[4px] font-inter">
                    Percentual (%)
                  </label>
                  <input
                    type="text"
                    value={newEstadoICMS.contribuicaoPercentual}
                    onChange={(e) => handleFieldChange('contribuicaoPercentual', e.target.value)}
                    onBlur={(e) => handleModalEstadoICMSPercentageBlur('contribuicaoPercentual', e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder="Ex: 10%"
                    disabled={!!newEstadoICMS.contribuicaoValorFixo.trim()}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none disabled:bg-[#F9FAFB] disabled:cursor-not-allowed text-center"
                  />
                </div>
                
                {/* Campo Valor Fixo */}
                <div className="flex-1">
                  <label className="block text-[#6B7280] text-[12px] mb-[4px] font-inter">
                    Valor fixo (R$)
                  </label>
                  <input
                    type="text"
                    value={newEstadoICMS.contribuicaoValorFixo}
                    onChange={(e) => handleFieldChange('contribuicaoValorFixo', e.target.value)}
                    onBlur={(e) => handleModalCurrencyBlur('contribuicaoValorFixo', e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder="Ex: R$ 10,00"
                    disabled={newEstadoICMS.contribuicaoPercentual.trim() !== ''}
                    className="w-full px-[12px] py-[10px] border border-[#D1D5DB] rounded-[8px] text-[#1F2937] font-inter text-[14px] focus:border-[#1777CF] focus:outline-none disabled:bg-[#F9FAFB] disabled:cursor-not-allowed text-center"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-[12px] justify-end">
              <button
                onClick={() => {
                  setShowAddEstadoICMSModal(false)
                  setNewEstadoICMS({ estado: '', percentual: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' })
                }}
                className="px-[20px] py-[10px] bg-[#6B7280] text-white rounded-[8px] hover:bg-[#374151] transition-colors text-[14px] font-medium font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={addEstadoICMS}
                disabled={!newEstadoICMS.estado.trim() || !newEstadoICMS.percentual.trim()}
                className="px-[20px] py-[10px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção */}
      {showRemoveEstadoICMSConfirm && estadoICMSToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl p-[32px] w-[400px] max-w-[90vw]">
            <h3 className="text-[18px] font-bold text-[#1F2937] font-inter mb-[16px]">
              Confirmar Remoção
            </h3>
            <p className="text-[#6B7280] font-inter text-[14px] mb-[24px]">
              Tem certeza que deseja remover o estado "{formatEstadoName(estadoICMSToRemove.estado)}"?
            </p>
            <div className="flex gap-[12px] justify-end">
              <button
                onClick={() => {
                  setShowRemoveEstadoICMSConfirm(false)
                  setEstadoICMSToRemove(null)
                }}
                className="px-[20px] py-[10px] bg-[#6B7280] text-white rounded-[8px] hover:bg-[#374151] transition-colors text-[14px] font-medium font-inter"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeEstadoICMS(estadoICMSToRemove.id)}
                className="px-[20px] py-[10px] bg-[#DC2626] text-white rounded-[8px] hover:bg-[#B91C1C] transition-colors text-[14px] font-medium font-inter"
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