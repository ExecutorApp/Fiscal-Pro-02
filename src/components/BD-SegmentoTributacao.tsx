import React, { useState, useEffect, useRef, useCallback } from 'react' 
import { useImpostoRenda } from './ImpostoRendaContext'
import { useSegmentos } from '../contexts/SegmentosContext'
import { ModalAdicionarSegmento } from './ModalAdicionarSegmento'
import { ModalConfirmarExclusao } from './ModalConfirmarExclusao'

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

interface BDSegmentoTributacaoProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDSegmentoTributacao: React.FC<BDSegmentoTributacaoProps> = ({ onDataChange, onSaveComplete }) => {
  // Refs para sincronização de rolagem
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  
  // Refs para controlar posição do cursor
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({})
  const cursorPositions = useRef<{[key: string]: number}>({})

  // Estados para modais
  const [showModalAdicionarSegmento, setShowModalAdicionarSegmento] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [segmentoToDelete, setSegmentoToDelete] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [nextSegmentoId, setNextSegmentoId] = useState(16)
  
  // Estado para armazenar dados originais para comparação
  const [originalSegmentoTributacao, setOriginalSegmentoTributacao] = useState<any[]>([])
  
  // Estado para rastrear quando o usuário está editando ativamente
  const [isActivelyEditing, setIsActivelyEditing] = useState<{[key: string]: boolean}>({})
  
  // Estado para controlar mudanças pendentes nos campos editáveis
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: string}>({})
  
  // Estado para armazenar valores originais dos campos antes da edição
  const [originalFieldValues, setOriginalFieldValues] = useState<{[key: string]: string}>({})
  
  // Usar o contexto de segmentos
  const { segmentosLucroPresumido, editarSegmento, removerSegmento } = useSegmentos()
  
  // Debug: Log dos dados do contexto
  console.log('🔍 [DEBUG] BD-SegmentoTributacao - segmentosLucroPresumido:', segmentosLucroPresumido)
  console.log('🔍 [DEBUG] BD-SegmentoTributacao - Quantidade de segmentos:', segmentosLucroPresumido.length)
  
  // Log quando os segmentos mudarem
  useEffect(() => {
    console.log('🔍 [DEBUG] BD-SegmentoTributacao - segmentosLucroPresumido atualizados:', segmentosLucroPresumido.length, 'segmentos')
  }, [segmentosLucroPresumido])

  const [newSegmento, setNewSegmento] = useState({
 nomeSegmento: '',
 lucroPresumido: {
   pis: '',
   cofins: '',
   irPresuncao: '',
   csllPresuncao: ''
 },
 lucroReal: {
   pis: '',
   cofins: ''
 }
  })

 // Hook do contexto compartilhado para Imposto de Renda
 const {
   impostoRendaData,
   selectedPeriodo,
   setImpostoRendaData,
   setSelectedPeriodo,
   originalImpostoRendaData,
   originalSelectedPeriodo,
   isSaveImpostoRendaDisabled,
   showImpostoRendaModal,
   showImpostoRendaExitConfirm,
   segmentoTributacaoLucroPresumido: segmentoTributacao,
   setSegmentoTributacaoLucroPresumido: setSegmentoTributacao,
   handleOpenImpostoRendaModal,
   handleCloseImpostoRendaModal,
   handleConfirmExitImpostoRenda,
   handleBackToImpostoRenda,
   handleSaveAndCloseModal,
   addSegmentoToBothTables,
   removeSegmentoFromBothTables,
   checkImpostoRendaChanges,
   getValorDeduzirByPeriodo,
 } = useImpostoRenda()


  // Função para sincronizar rolagem entre cabeçalho e corpo
  const handleHeaderScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  const handleBodyScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  // useEffect para monitorar mudanças e notificar o componente pai
  useEffect(() => {
    if (isDirty && onDataChange) {
      onDataChange({
        segmentoTributacao: segmentoTributacao,
        hasChanges: true
      })
    }
  }, [isDirty, segmentoTributacao, onDataChange])
  
  // Inicializar dados originais quando segmentoTributacao for carregado
 useEffect(() => {
   if (segmentoTributacao.length > 0 && originalSegmentoTributacao.length === 0) {
     setOriginalSegmentoTributacao(JSON.parse(JSON.stringify(segmentoTributacao)))
     setIsDirty(false) // Garantir que botão inicie desativado
   }
 }, [segmentoTributacao, originalSegmentoTributacao.length])
 
   // Garantir que isDirty inicie como false após carregamento completo
 useEffect(() => {
   if (originalSegmentoTributacao.length > 0 && segmentoTributacao.length > 0) {
     setIsDirty(false)
   }
 }, [originalSegmentoTributacao.length])

  // Função para formatação automática de porcentagem
  const formatPercentage = (value: string): string => {
    console.log('🔍 formatPercentage - Entrada:', `'${value}'`, 'Length:', value.length);
    if (!value || value.trim() === '') {
      console.log('🔍 formatPercentage - Retornando string vazia');
      return ''
    }
    
    // Remove tudo que não for número, vírgula ou ponto
    let cleanValue = value.replace(/[^\d,\.]/g, '')
    console.log('🔍 formatPercentage - Valor limpo:', `'${cleanValue}'`);
    
    // Se terminar com %, remove
    if (cleanValue.endsWith('%')) {
      cleanValue = cleanValue.slice(0, -1)
    }
    
    // Se não tiver valor após limpeza, retorna vazio (permite campo vazio)
    if (!cleanValue || cleanValue.trim() === '') {
      console.log('🔍 formatPercentage - Valor limpo vazio, retornando string vazia');
      return ''
    }
    
    // Se já tem valor (incluindo '0'), adiciona %
    const result = cleanValue + '%';
    console.log('🔍 formatPercentage - Retornando com %:', `'${result}'`);
    return result
  }
  
   // Função para verificar se o texto está truncado e precisa de tooltip
  const isTextTruncated = (text: string, maxWidth: number = 220) => {
    // Criar elemento temporário para medir o texto
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return false
   
   context.font = '15px Inter' // Mesmo tamanho da fonte usada
   const textWidth = context.measureText(text).width
   
   return textWidth > (maxWidth - 16) // Subtraindo padding
 }

  // Função para formatação automática de moeda
  const formatCurrency = (value: string): string => {
    if (!value || value.trim() === '') return 'R$ 0,00'
    
    // Remove tudo exceto números, vírgula e ponto
    let cleanValue = value.replace(/[^\d,\.]/g, '')
    
    // Se não tiver valor após limpeza, retorna R$ 0,00
    if (!cleanValue || cleanValue === '') return 'R$ 0,00'
    
    let numericValue = 0
    
    // Verifica se tem vírgula (separador decimal brasileiro)
    if (cleanValue.includes(',')) {
      // Divide em parte inteira e decimal
      const parts = cleanValue.split(',')
      const parteInteira = parts[0].replace(/\./g, '') // Remove pontos da parte inteira (separadores de milhares)
      let parteDecimal = parts[1] || '00'
      
      // Limita centavos a 2 dígitos
      parteDecimal = parteDecimal.substring(0, 2).padEnd(2, '0')
      
      // Monta o valor numérico
      numericValue = parseFloat(`${parteInteira || '0'}.${parteDecimal}`)
    } else {
      // Se não tem vírgula, remove todos os pontos e trata como valor inteiro
      const valorInteiro = cleanValue.replace(/\./g, '')
      numericValue = parseInt(valorInteiro) || 0
    }
    
    // Sempre formata como moeda brasileira (incluindo R$ 0,00)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue)
  }



   // Função para verificar se há mudanças reais nos dados
 const checkForRealChanges = (currentData: any[], originalData: any[]) => {
   // Se não há dados originais ainda, considera como não modificado
   if (originalData.length === 0) return false
   
   if (currentData.length !== originalData.length) return true
   
   return currentData.some((currentItem) => {
     const originalItem = originalData.find(orig => orig.id === currentItem.id)
     if (!originalItem) return true
     
     // Função para normalizar valores para comparação
     const normalizeValue = (value: string): string => {
       if (!value) return ''
       
       // Para valores monetários
       if (value.includes('R$') || (value.match(/^\d+([,\.]\d+)?$/) && !value.includes('%'))) {
         return formatCurrency(value)
       }
       
       // Para percentuais
       if (value.includes('%') || value.match(/^\d+([,\.]\d+)?$/)) {
         return formatPercentage(value)
       }
       
       return value.trim()
     }
     
     return (
       normalizeValue(currentItem.pis) !== normalizeValue(originalItem.pis) ||
       normalizeValue(currentItem.cofins) !== normalizeValue(originalItem.cofins) ||
       normalizeValue(currentItem.irPresuncao) !== normalizeValue(originalItem.irPresuncao) ||
       normalizeValue(currentItem.ir) !== normalizeValue(originalItem.ir) ||
       normalizeValue(currentItem.irAdicional) !== normalizeValue(originalItem.irAdicional) ||
       normalizeValue(currentItem.irValorDeduzir) !== normalizeValue(originalItem.irValorDeduzir) ||
       normalizeValue(currentItem.csllPresuncao) !== normalizeValue(originalItem.csllPresuncao) ||
       normalizeValue(currentItem.csll) !== normalizeValue(originalItem.csll)
     )
   })
 }




 // Função para lidar com o blur dos inputs de percentual
 const handlePercentageBlur = (itemId: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
    console.log('🔍 [BLUR DEBUG] ===== handlePercentageBlur INÍCIO =====');
    console.log('🔍 [BLUR DEBUG] Item ID:', itemId, 'Field:', field);
    console.log('🔍 [BLUR DEBUG] Valor do input no evento:', `'${event.target.value}'`);
    
    const editingKey = `${itemId}-${field}`;
    console.log('🔍 [BLUR DEBUG] Editing key:', editingKey);
    console.log('🔍 [BLUR DEBUG] isActivelyEditing para esta chave:', isActivelyEditing[editingKey]);
    
    // Limpar flag de edição ativa imediatamente no blur
    setIsActivelyEditing(prev => ({ ...prev, [editingKey]: false }));
    console.log('🔍 [BLUR DEBUG] Flag de edição ativa limpa para:', editingKey);
   
   // Buscar o valor atual do estado em vez do input
   const segmentoAtual = segmentosLucroPresumido.find(item => item.id === itemId.toString())
   if (!segmentoAtual) {
     console.log('🔍 [BLUR DEBUG] ❌ Segmento não encontrado para ID:', itemId);
     return;
   }
   
   const currentValue = segmentoAtual[field] || '';
   console.log('🔍 [BLUR DEBUG] Valor atual no estado:', `'${currentValue}'`, 'length:', currentValue.length);
   
   // Se o valor está vazio ou só tem espaços, não formatar
   if (!currentValue || currentValue.trim() === '') {
     console.log('🔍 [BLUR DEBUG] ✅ Valor vazio ou só espaços - NÃO formatando');
     console.log('🔍 [BLUR DEBUG] ===== handlePercentageBlur FIM (valor vazio) =====');
     return;
   }
   
   // Se o valor já contém %, não reformatar para evitar duplicação
   if (currentValue.includes('%')) {
     console.log('🔍 [BLUR DEBUG] ✅ Valor já contém % - NÃO reformatando');
     console.log('🔍 [BLUR DEBUG] ===== handlePercentageBlur FIM (já tem %) =====');
     return;
   }
   
   // CORREÇÃO: Formatar valores numéricos simples para porcentagem
   // Verificar se o valor é um número válido (com ou sem vírgula decimal)
   const isNumericValue = /^\d+(,\d+)?$/.test(currentValue.trim());
   console.log('🔍 [BLUR DEBUG] É valor numérico?', isNumericValue, 'para valor:', `'${currentValue}'`);
   
   if (isNumericValue) {
     console.log('🔍 [BLUR DEBUG] ⚠️ FORMATANDO VALOR NUMÉRICO - Adicionando %');
     const formattedValue = currentValue + '%';
     console.log('🔍 [BLUR DEBUG] Valor formatado:', `'${formattedValue}'`);
     console.log('🔍 [BLUR DEBUG] Chamando updateSegmentoTributacao para formatar');
     updateSegmentoTributacao(itemId, field, formattedValue)
     console.log('🔍 [BLUR DEBUG] ===== handlePercentageBlur FIM (formatado) =====');
   } else {
     console.log('🔍 [BLUR DEBUG] ✅ Valor não é numérico válido - NÃO formatando');
     console.log('🔍 [BLUR DEBUG] ===== handlePercentageBlur FIM (não numérico) =====');
   }
 }

 // Função para lidar com o blur dos inputs de moeda (apenas Valor a Deduzir)
 const handleCurrencyBlur = (itemId: number, field: string, event: React.FocusEvent<HTMLInputElement>) => {
   const formattedValue = formatCurrency(event.target.value)
   updateSegmentoTributacao(itemId, field, formattedValue)
 }

  // Função para lidar com a tecla Enter nos inputs
  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  // Função para lidar com a tecla Enter nos inputs do modal
  const handleModalEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur() // Remove foco, ativando o onBlur
    }
  }

  // Função para mudança no campo Nome do Segmento (com capitalização)
  const handleSegmentoNameChange = (value: string) => {
    // Capitaliza a primeira letra
   const capitalizedValue = value ? value.charAt(0).toUpperCase() + value.slice(1) : value
   setNewSegmento({...newSegmento, nomeSegmento: capitalizedValue})

  }

  // Função para mudança simples nos campos de porcentagem do modal (sem formatação automática)
 const handleModalPercentageChange = (section: 'lucroPresumido' | 'lucroReal', field: string, value: string) => {
   setNewSegmento({
     ...newSegmento,
     [section]: {
       ...newSegmento[section],
       [field]: value
     }
   })
  }

  // Função para formatação final de porcentagem no modal (onBlur)
 const handleModalPercentageBlur = (section: 'lucroPresumido' | 'lucroReal', field: string, event: React.FocusEvent<HTMLInputElement>) => {
   const formattedValue = formatPercentage(event.target.value)
   setNewSegmento({
     ...newSegmento,
     [section]: {
       ...newSegmento[section],
       [field]: formattedValue
     }
   })
  }

// Função para tratar tecla Enter nos campos de porcentagem do modal
  const handleModalPercentageKeyDown = (section: 'lucroPresumido' | 'lucroReal', field: string, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Disparar a formatação como se fosse onBlur
      const formattedValue = formatPercentage(event.currentTarget.value)
      setNewSegmento({
        ...newSegmento,
        [section]: {
          ...newSegmento[section],
          [field]: formattedValue
        }
      })
      // Remover o foco do campo para completar a ação
      event.currentTarget.blur()
    }
  }

  // Função para tratar tecla Enter no campo Nome do Segmento
  const handleModalNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Remover o foco do campo
      event.currentTarget.blur()
    }
  }
  
  // Função para formatação de moeda no modal (onBlur)
  const handleModalCurrencyBlur = (field: string, event: React.FocusEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(event.target.value)
    setNewSegmento({...newSegmento, [field]: formattedValue})
  }

  // Função para verificar se todos os campos obrigatórios estão preenchidos
  const isFormValid = () => {
    try {
      return (
       newSegmento.nomeSegmento && newSegmento.nomeSegmento.trim() !== '' &&
       newSegmento.lucroPresumido.pis && newSegmento.lucroPresumido.pis.trim() !== '' &&
       newSegmento.lucroPresumido.cofins && newSegmento.lucroPresumido.cofins.trim() !== '' &&
       newSegmento.lucroPresumido.irPresuncao && newSegmento.lucroPresumido.irPresuncao.trim() !== '' &&
       newSegmento.lucroPresumido.csllPresuncao && newSegmento.lucroPresumido.csllPresuncao.trim() !== '' &&
       newSegmento.lucroReal.pis && newSegmento.lucroReal.pis.trim() !== '' &&
       newSegmento.lucroReal.cofins && newSegmento.lucroReal.cofins.trim() !== ''
      )
    } catch (error) {
      return false
    }
  }

  // Funções para controlar posição do cursor
  const saveCursorPosition = useCallback((inputKey: string, element: HTMLInputElement) => {
    if (element) {
      cursorPositions.current[inputKey] = element.selectionStart || 0
      console.log('🔍 Cursor salvo para', inputKey, 'posição:', cursorPositions.current[inputKey])
    }
  }, [])

  const restoreCursorPosition = useCallback((inputKey: string) => {
    setTimeout(() => {
      const element = inputRefs.current[inputKey]
      const position = cursorPositions.current[inputKey]
      if (element && typeof position === 'number') {
        element.setSelectionRange(position, position)
        console.log('🔍 Cursor restaurado para', inputKey, 'posição:', position)
      }
    }, 0)
  }, [])

  // Função para verificar se há mudanças pendentes nos campos
  const checkPendingChanges = useCallback(() => {
    const hasPendingChanges = Object.keys(pendingChanges).length > 0
    setIsDirty(hasPendingChanges)
    return hasPendingChanges
  }, [pendingChanges])

  // Função para inicializar valor original de um campo
  const initializeOriginalValue = useCallback((itemId: number, field: string, value: string) => {
    const fieldKey = `${itemId}-${field}`
    if (!(fieldKey in originalFieldValues)) {
      setOriginalFieldValues(prev => ({
        ...prev,
        [fieldKey]: value
      }))
    }
  }, [originalFieldValues])

  // Função para normalizar valores para comparação (remove % e espaços)
  const normalizeValue = useCallback((value: string): string => {
    return value.replace(/[%\s]/g, '').trim()
  }, [])

  // Função para verificar se um campo foi alterado em relação ao valor original
  const hasFieldChanged = useCallback((itemId: number, field: string, currentValue: string) => {
    const fieldKey = `${itemId}-${field}`
    const originalValue = originalFieldValues[fieldKey] || ''
    
    // Normalizar ambos os valores para comparação
    const normalizedCurrent = normalizeValue(currentValue)
    const normalizedOriginal = normalizeValue(originalValue)
    
    return normalizedCurrent !== normalizedOriginal
  }, [originalFieldValues, normalizeValue])

 // Função para atualizar dados da tabela
 const updateSegmentoTributacao = useCallback((itemId: number, field: string, value: string) => {
    console.log('🔍 [EXCLUSÃO DEBUG] ===== INÍCIO updateSegmentoTributacao =====');
    console.log('🔍 [EXCLUSÃO DEBUG] ENTRADA:', { itemId, field, value: `'${value}'`, length: value.length });
    console.log('🔍 [EXCLUSÃO DEBUG] É exclusão completa?', value === '');
    console.log('🔍 [EXCLUSÃO DEBUG] Segmentos disponíveis:', segmentosLucroPresumido.map(s => ({ id: s.id, nome: s.nome })));
    
    const segmentoAtual = segmentosLucroPresumido.find(item => item.id === itemId.toString())
   if (!segmentoAtual) {
     console.log('🔍 [EXCLUSÃO DEBUG] ❌ ERRO: Segmento não encontrado para ID:', itemId);
     return // Item não encontrado
   }
   
   console.log('🔍 [EXCLUSÃO DEBUG] ✅ Segmento encontrado:', segmentoAtual.nome);
   const previousValue = segmentoAtual[field]
   console.log('🔍 [EXCLUSÃO DEBUG] Valor anterior:', `'${previousValue}'`, 'length:', previousValue?.length || 0);
   console.log('🔍 [EXCLUSÃO DEBUG] Novo valor:', `'${value}'`, 'length:', value.length);
   
   // Usar função do contexto para editar segmento - corrigir estrutura de dados
   const dadosAtualizados = {
     lucroPresumido: {
       pis: field === 'pis' ? value : segmentoAtual.pis,
       cofins: field === 'cofins' ? value : segmentoAtual.cofins,
       presuncaoIR: field === 'presuncaoIR' ? value : segmentoAtual.presuncaoIR,
       presuncaoCSLL: field === 'presuncaoCSLL' ? value : segmentoAtual.presuncaoCSLL
     }
   }
   console.log('🔍 [EXCLUSÃO DEBUG] Dados para editarSegmento:', JSON.stringify(dadosAtualizados, null, 2));
   
   console.log('🔍 [EXCLUSÃO DEBUG] Chamando editarSegmento com ID:', itemId.toString());
   editarSegmento(itemId.toString(), dadosAtualizados)
   console.log('🔍 [EXCLUSÃO DEBUG] editarSegmento executado');
   
   // Verificar se há mudanças reais comparando com dados originais
   // Só recalcular se realmente houve mudança no valor
   if (previousValue !== value) {
     const hasRealChanges = checkForRealChanges(segmentosLucroPresumido, originalSegmentoTributacao)
     setIsDirty(hasRealChanges)
     
     // Notificar o componente pai sobre as alterações
     if (onDataChange) {
       onDataChange({
         segmentoTributacao: segmentosLucroPresumido,
         hasChanges: hasRealChanges
       })
     }
   }
 }, [segmentosLucroPresumido, editarSegmento, originalSegmentoTributacao, onDataChange])


  // Função para salvar as alterações
  const handleSaveSegmentos = async () => {
    if (!isDirty) return
    
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        segmentoTributacao: segmentosLucroPresumido
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA - SEGMENTO/TRIBUTAÇÃO ===')
      console.log('Salvando alterações dos segmentos:', JSON.stringify(dataToSave, null, 2))
      
      localStorage.setItem('segmentoTributacao_data', JSON.stringify(dataToSave))
      
      console.log('💾 Dados de Segmento/Tributação salvos permanentemente no navegador!')
	  
	  // Atualizar dados originais após salvar
      setOriginalSegmentoTributacao(JSON.parse(JSON.stringify(segmentosLucroPresumido)))
      
      setShowSuccessMessage(true)
      setIsDirty(false)
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)

      if (onSaveComplete) {
        onSaveComplete()
      }
      
    } catch (error) {
      console.error('Erro ao salvar dados de Segmento/Tributação:', error)
      alert('Erro ao salvar os dados de Segmento/Tributação. Verifique o console para mais detalhes.')
    }
  }

  // Função para adicionar segmento
  const addSegmento = () => {
    try {
     // Adicionar segmento em ambas as tabelas usando contexto global
     const { updatedLP } = addSegmentoToBothTables(newSegmento)
     
     // Resetar formulário
     setNewSegmento({
       nomeSegmento: '',
       lucroPresumido: {
         pis: '',
         cofins: '',
         irPresuncao: '',
         csllPresuncao: ''
       },
       lucroReal: {
         pis: '',
         cofins: ''
       }
     })
     
     setShowModalAdicionarSegmento(false)
    // NÃO notificar o componente pai - operação de modal independente
    // A tabela será atualizada automaticamente pelo contexto

     
   } catch (error) {
     console.error('Erro ao adicionar segmento:', error)
     alert('Erro ao adicionar segmento. Tente novamente.')
   }
  }

  // Função para remover segmento
  const removeSegmento = (nomeSegmento: string) => {
   
   // Encontrar o segmento pelo nome para obter o ID
   const segmentoParaRemover = segmentoTributacao.find(seg => seg.segmento === nomeSegmento)
   if (!segmentoParaRemover) return
   
   // Usar função do contexto para remover segmento
   removeSegmentoFromBothTables(nomeSegmento)
   
   // Atualizar dados originais
    setOriginalSegmentoTributacao(JSON.parse(JSON.stringify(segmentoTributacao)))

   
   // NÃO notificar o componente pai - operação de modal independente
   // A tabela será atualizada automaticamente pelo contexto
  }

 // Ícone de Engrenagem
 const SettingsIcon = ({ size = 18 }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
     <path d="M13.12 24h-2.24a1.498 1.498 0 0 1-1.486-1.32l-.239-1.876a9.45 9.45 0 0 1-1.374-.569l-1.494 1.161a1.492 1.492 0 0 1-1.985-.126l-1.575-1.575a1.488 1.488 0 0 1-.122-1.979l1.161-1.495a9.232 9.232 0 0 1-.569-1.374l-1.88-.239A1.501 1.501 0 0 1 0 13.12v-2.24c0-.757.567-1.396 1.32-1.486l1.876-.239a9.45 9.45 0 0 1 .569-1.374l-1.16-1.494a1.49 1.49 0 0 1 .127-1.986l1.575-1.575a1.489 1.489 0 0 1 1.979-.122L7.78 3.766a9.416 9.416 0 0 1 1.375-.569l.239-1.88C9.484.567 10.123 0 10.88 0h2.24c.757 0 1.396.567 1.486 1.32l.239 1.876c.478.155.938.346 1.375.569l1.494-1.161a1.49 1.49 0 0 1 1.985.127l1.575 1.575c.537.521.591 1.374.122 1.979L20.235 7.78c.224.437.415.897.569 1.374l1.88.239A1.5 1.5 0 0 1 24 10.88v2.24c0 .757-.567 1.396-1.32 1.486l-1.876.239a9.45 9.45 0 0 1-.569 1.374l1.161 1.494a1.49 1.49 0 0 1-.127 1.985l-1.575 1.575a1.487 1.487 0 0 1-1.979.122l-1.495-1.161a9.232 9.232 0 0 1-1.374.569l-.239 1.88A1.5 1.5 0 0 1 13.12 24zm-5.39-4.86c.083 0 .168.021.244.063a8.393 8.393 0 0 0 1.774.736.5.5 0 0 1 .358.417l.28 2.2c.03.251.247.444.494.444h2.24a.504.504 0 0 0 .493-.439l.281-2.204a.5.5 0 0 1 .358-.417 8.393 8.393 0 0 0 1.774-.736.499.499 0 0 1 .55.042l1.75 1.36a.492.492 0 0 0 .655-.034l1.585-1.585a.495.495 0 0 0 .039-.66l-1.36-1.75a.5.5 0 0 1-.042-.55 8.393 8.393 0 0 0 .736-1.774.5.5 0 0 1 .417-.358l2.2-.28A.507.507 0 0 0 23 13.12v-2.24a.504.504 0 0 0-.439-.493l-2.204-.281a.5.5 0 0 1-.417-.358 8.393 8.393 0 0 0-.736-1.774.497.497 0 0 1 .042-.55l1.36-1.75a.49.49 0 0 0-.033-.654l-1.585-1.585a.492.492 0 0 0-.66-.039l-1.75 1.36a.5.5 0 0 1-.551.042 8.359 8.359 0 0 0-1.774-.736.5.5 0 0 1-.358-.417l-.28-2.2A.507.507 0 0 0 13.12 1h-2.24a.504.504 0 0 0-.493.439l-.281 2.204a.502.502 0 0 1-.358.418 8.356 8.356 0 0 0-1.774.735.5.5 0 0 1-.551-.041l-1.75-1.36a.49.49 0 0 0-.654.033L3.434 5.014a.495.495 0 0 0-.039.66l1.36 1.75a.5.5 0 0 1 .042.55 8.341 8.341 0 0 0-.736 1.774.5.5 0 0 1-.417.358l-2.2.28A.505.505 0 0 0 1 10.88v2.24c0 .247.193.464.439.493l2.204.281a.5.5 0 0 1 .417.358c.18.626.428 1.223.736 1.774a.497.497 0 0 1-.042.55l-1.36 1.75a.49.49 0 0 0 .033.654l1.585 1.585a.494.494 0 0 0 .66.039l1.75-1.36a.515.515 0 0 1 .308-.104z"/>
     <path d="M12 17c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5zm0-9c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z"/>
   </svg>
 )

 // Função para salvar os dados do modal de Imposto de Renda usando contexto
 const handleSaveImpostoRendaFromContext = () => {
   try {
     
     // Fechar modal diretamente após salvamento
     handleSaveAndCloseModal()
	 
	// NÃO notificar o componente pai - operação de modal independente
    // A tabela será atualizada automaticamente pelo contexto
     
   } catch (error) {
     console.error('Erro ao salvar dados do Imposto de Renda:', error)
     alert('Erro ao salvar os dados. Tente novamente.')
   }
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
          height: 6px;
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

        /* Barra de rolagem oculta para o cabeçalho */
        .hidden-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }

   /* Reservar espaço para barra de rolagem mesmo oculta */
   .hidden-scrollbar {
     scrollbar-gutter: stable;
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

        /* Estilo específico para inputs de 80px */
        .uniform-input {
          width: 80px !important;
        }

        /* Estilo específico para inputs de valores monetários (mais largos) */
        .currency-input {
          width: 120px !important;
          min-width: 120px !important;
          max-width: 120px !important;
          flex-shrink: 0 !important;
        }

          /* Estilo para coluna Segmento */
          .segmento-column {
         width: calc(100% - 640px) !important;
         min-width: 220px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .segmento-column * {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        td.segmento-column {
          white-space: nowrap !important;
          word-break: keep-all !important;
          word-wrap: normal !important;
        }

        /* Estilo para inputs colados estilo Excel */
        .excel-input-group {
          display: flex;
          position: relative;
        }

        .excel-input-first {
          border: 1px solid #D1D5DB;
          border-radius: 4px 0 0 4px;
          margin-right: -1px;
          position: relative;
        }

        .excel-input-middle {
          border: 1px solid #D1D5DB;
          border-radius: 0;
          margin-right: -1px;
          position: relative;
        }

        .excel-input-last {
          border: 1px solid #D1D5DB;
          border-radius: 0 4px 4px 0;
          position: relative;
        }

        .excel-input-group .uniform-input:focus {
          border-color: #1777CF;
          z-index: 10;
          position: relative;
          outline: none;
        }

        /* Hover suave para linhas da tabela */
        .table-row:hover {
          background-color: #F9FAFB; 
          transition: background-color 0.15s ease;
        }
      `}</style>

      <div className="h-full flex flex-col">
        {/* Título dentro do container */}
        <div className="pl-[10px] pr-[20px] pt-[12px] pb-[12px] bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1F2937] font-inter">
            Empresas / Lucro Presumido
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[8px]">
			   <button
               onClick={handleOpenImpostoRendaModal}
               className="flex items-center justify-center w-[36px] h-[36px] bg-[#4B5563] text-white rounded-[8px] border border-[#6B7280] hover:bg-[#374151] transition-colors shadow-sm"
               title="Configurações do Imposto de Renda"
             >
               <SettingsIcon size={18} />
             </button>

              <button
                onClick={() => setShowModalAdicionarSegmento(true)}
                className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Seguimento
              </button>
              <button
                onClick={handleSaveSegmentos}
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
        
 {/* Cabeçalho da Tabela com barra de rolagem oculta sincronizada */}
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] sticky top-0 z-10">
          <div 
            ref={headerScrollRef}
            className="overflow-x-auto hidden-scrollbar ml-[10px] mr-[10px] pr-[0px]"
            onScroll={handleHeaderScroll}
          >
            <div className="ml-[3px] pr-[0px]">
              <div className="w-full flex h-[48px] items-center">
                {/* Coluna Segmento - espelhando exatamente os dados */}
                <div 
                  className="segmento-column text-left mr-[0px] pr-[0px] font-semibold text-[#374151] text-[15px] font-inter flex items-center"
                  style={{
                   width: 'calc(100% - 640px)',
                   minWidth: '220px',

                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '48px'
                  }}
                >
                  Seguimentos
                </div>
                
                {/* Todas as outras colunas alinhadas à direita - espelhando os dados */}
                <div className="flex items-center h-[48px]">
                  {/* Coluna PIS */}
                  <div 
                    className="flex-shrink-0 text-center font-semibold text-[#374151] font-inter text-[13px] flex items-center justify-center" 
                    style={{width: '90px', whiteSpace: 'nowrap', height: '48px'}}
                  >
                    PIS
                  </div>
                   
                  {/* Coluna COFINS */} 
                  <div 
                    className="flex-shrink-0 text-center font-semibold text-[#374151] font-inter text-[13px] flex items-center justify-center" 
                    style={{width: '75px', whiteSpace: 'nowrap', height: '48px'}} 
                  >
                    COFINS
                  </div>
                   
                  {/* Colunas do Imposto de Renda */}
                   <div  
                    className="flex-shrink-0 text-center font-semibold text-[#374151] font-inter text-[14px] ml-[12px] flex items-center justify-center" 
                    style={{width: '350px', whiteSpace: 'nowrap', height: '48px'}}
                  >
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-shrink-0 text-center ml-[-40px]" style={{width: '70px'}} title="Presunção de Imposto de Renda">
                        Pres.
                      </div>
                      <div className="flex-shrink-0 text-center" style={{width: '70px'}} title="Imposto de Renda">
                        I.R.
                      </div>
                      <div className="flex-shrink-0 text-center" style={{width: '70px'}} title="Adicional de Imposto de Renda">
                        Adic.
                      </div>
                      <div className="flex-shrink-0 text-center" style={{width: '120px'}} title="Valor a Deduzir">
                        Valor Deduzir
                      </div>
                    </div>
                  </div>

                  
                  <div 
                    className="flex-shrink-0 text-center font-semibold text-[#374151] font-inter text-[14px] flex items-center justify-center" 
                    style={{width: '130px', whiteSpace: 'nowrap', height: '48px'}}
                  >
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-shrink-0 text-center ml-[-25px]" style={{width: '70px'}} title="Presunção de CSLL">
                        Pres.
                      </div>
                      <div className="flex-shrink-0 text-center ml-[-5px]" style={{width: '70px'}} title="Contribuição Social sobre o Lucro Líquido">
                        CSLL
                      </div>
                    </div>
                  </div>

                  
                  {/* Coluna Ações */}
                  <div className="flex-shrink-0 text-center font-semibold text-[#374151] font-inter text-[14px] ml-[0px] flex items-center justify-center" style={{width: '44px', height: '48px'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Área Rolável - Apenas os Dados com sincronização */} 
        <div 
          ref={bodyScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto modern-scrollbar ml-[10px] mr-[5px] mt-[5px] mb-[6px] scrollbar-spacing"
          onScroll={handleBodyScroll}
        >
          <div className="min-w-[800px] ml-[3px] pr-[0px]">
            <table className="w-full" style={{tableLayout: 'fixed'}}>
              <tbody>
                               {segmentosLucroPresumido
                 .filter(item => {
                   // Filtrar apenas linhas que têm nome de segmento válido
                   return item.nome && item.nome.trim() !== ''
                 })
                 .map((item, index) => (

                  <tr key={item.id} className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[0px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden flex" style={{height: 'auto', minHeight: '56px'}}>
                    {/* Coluna Segmento - flexível que expande com a tela */}
                    <td 
                      className="segmento-column pl-[0px] pr-[8px] py-[8px] text-[#1F2937] font-inter text-left text-[15px]"
                      title={isTextTruncated(item.nome) ? item.nome : undefined}
                      style={{
                       width: 'calc(100% - 640px)',
                       minWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '56px',
                        lineHeight: '40px'
                      }}
                    >
                      {item.nome}
                    </td>
                    
                    {/* Todas as outras colunas alinhadas à direita */}
                    <td className="flex items-center" style={{height: '56px'}}>
                      <div className="flex items-center">
                        {/* Coluna PIS */}
                        <div className="p-[8px] text-center flex-shrink-0 pr-[0px]" style={{width: '80px'}}>
                          {console.log('🔍 [RENDER DEBUG] PIS Input - ID:', item.id, 'Valor no estado:', `'${item.pis}'`, 'Length:', item.pis?.length || 0)}
                          <input
                            ref={(el) => {
                              if (el) inputRefs.current[`${item.id}-pis`] = el
                            }}
                            type="text"
                            value={item.pis}
                           onChange={(e) => {
                             const value = e.target.value;
                             const fieldKey = `${item.id}-pis`;
                             
                             // Inicializar valor original se ainda não foi definido
                             initializeOriginalValue(item.id, 'pis', item.pis);
                             
                             // Marcar que o usuário está editando ativamente
                             setIsActivelyEditing(prev => ({ ...prev, [fieldKey]: true }));
                             
                             // Salvar posição do cursor antes da atualização
                             saveCursorPosition(fieldKey, e.target as HTMLInputElement);
                             
                             // Sempre permitir se o valor está vazio ou se é menor que o anterior (exclusão)
                             if (value === '' || value.length < item.pis.length) {
                               updateSegmentoTributacao(item.id, 'pis', value);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'pis', value)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               setTimeout(() => {
                                 restoreCursorPosition(fieldKey);
                                 checkPendingChanges();
                               }, 10);
                               return;
                             }
                             
                             // Para outros valores, permitir apenas números e vírgula
                             if (/^[\d,]*$/.test(value)) {
                               updateSegmentoTributacao(item.id, 'pis', value);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'pis', value)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               // Restaurar posição do cursor após a atualização
                               setTimeout(() => {
                                 restoreCursorPosition(fieldKey);
                                 checkPendingChanges();
                               }, 0);
                             } else {
                               console.log('🔍 [EXCLUSÃO DEBUG] ❌ VALOR INVÁLIDO - Ignorando');
                             }
                             console.log('🔍 [EXCLUSÃO DEBUG] ===== PIS onChange FIM =====');
                           }}
                           onBlur={(e) => {
                             const fieldKey = `${item.id}-pis`;
                             
                             // Limpar flag de edição ativa
                             setIsActivelyEditing(prev => ({ ...prev, [fieldKey]: false }));
                             
                             // Verificar se há mudança em relação ao valor original
                             const currentValue = e.target.value;
                             if (hasFieldChanged(item.id, 'pis', currentValue)) {
                               setPendingChanges(prev => ({ ...prev, [fieldKey]: currentValue }));
                             } else {
                               setPendingChanges(prev => {
                                 const newPending = { ...prev };
                                 delete newPending[fieldKey];
                                 return newPending;
                               });
                             }
                             
                             // Atualizar estado do botão Salvar
                             checkPendingChanges();
                             
                             // Chamar a função original de blur para formatação
                             handlePercentageBlur(item.id, 'pis', e);
                           }}
                            onKeyDown={(e) => {
                              console.log('🔍 [EXCLUSÃO DEBUG] ===== PIS onKeyDown =====');
                              console.log('🔍 [EXCLUSÃO DEBUG] Key:', e.key, 'Code:', e.code);
                              console.log('🔍 [EXCLUSÃO DEBUG] Valor atual:', e.target.value);
                              console.log('🔍 [EXCLUSÃO DEBUG] É Delete?', e.key === 'Delete');
                              console.log('🔍 [EXCLUSÃO DEBUG] É Backspace?', e.key === 'Backspace');
                              console.log('🔍 [EXCLUSÃO DEBUG] Posição cursor:', e.target.selectionStart, 'até', e.target.selectionEnd);
                              console.log('🔍 [EXCLUSÃO DEBUG] readOnly:', e.target.readOnly, 'disabled:', e.target.disabled);
                              
                              if (e.key === 'Delete' || e.key === 'Backspace') {
                                console.log('🔍 [EXCLUSÃO DEBUG] ⚠️ TECLA DE EXCLUSÃO DETECTADA!');
                                console.log('🔍 [EXCLUSÃO DEBUG] Valor antes da exclusão:', `'${e.target.value}'`);
                              }
                              
                              handleEnterKeyPress(e)
                            }}
                            onFocus={(e) => {
                              console.log('🔍 PIS onFocus - Valor:', e.target.value);
                              console.log('🔍 PIS onFocus - readOnly:', e.target.readOnly);
                              console.log('🔍 PIS onFocus - disabled:', e.target.disabled);
                            }}
							placeholder="0%"
                            style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                            className="uniform-input px-[6px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                          />
                        </div>
                        
                        {/* Coluna COFINS */}
                        <div className="p-[8px] text-center flex-shrink-0 pr-[0px]" style={{width: '80px'}}>
                          <input
                            ref={(el) => {
                              if (el) inputRefs.current[`${item.id}-cofins`] = el
                            }}
                            type="text"
                            value={item.cofins}
                           onChange={(e) => {
                             const value = e.target.value;
                             const fieldKey = `${item.id}-cofins`;
                             
                             // Inicializar valor original se ainda não foi definido
                             initializeOriginalValue(item.id, 'cofins', item.cofins);
                             
                             // Marcar que o usuário está editando ativamente
                             setIsActivelyEditing(prev => ({ ...prev, [fieldKey]: true }));
                             
                             // Salvar posição do cursor antes da atualização
                             saveCursorPosition(fieldKey, e.target as HTMLInputElement);
                             
                             // Sempre permitir se o valor está vazio ou se é menor que o anterior (exclusão)
                             if (value === '' || value.length < item.cofins.length) {
                               updateSegmentoTributacao(item.id, 'cofins', value);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'cofins', value)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               setTimeout(() => {
                                 restoreCursorPosition(fieldKey);
                                 checkPendingChanges();
                               }, 10);
                               return;
                             }
                             
                             // Para outros valores, permitir apenas números e vírgula
                             if (/^[\d,]*$/.test(value)) {
                               updateSegmentoTributacao(item.id, 'cofins', value);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'cofins', value)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               // Restaurar posição do cursor após a atualização
                               setTimeout(() => {
                                 restoreCursorPosition(fieldKey);
                                 checkPendingChanges();
                               }, 0);
                             }
                           }}
                           onBlur={(e) => {
                             const fieldKey = `${item.id}-cofins`;
                             const currentValue = e.target.value;
                             
                             // Limpar flag de edição ativa
                             setIsActivelyEditing(false);
                             
                             // Verificar se há mudança em relação ao valor original
                             if (hasFieldChanged(item.id, 'cofins', currentValue)) {
                               setPendingChanges(prev => ({ ...prev, [fieldKey]: currentValue }));
                             } else {
                               setPendingChanges(prev => {
                                 const newPending = { ...prev };
                                 delete newPending[fieldKey];
                                 return newPending;
                               });
                             }
                             
                             // Atualizar estado do botão Salvar
                             checkPendingChanges();
                             
                             // Executar formatação original
                             handlePercentageBlur(item.id, 'cofins', e);
                           }}
                            onKeyDown={(e) => {
                              console.log('🔍 [EXCLUSÃO DEBUG] ===== COFINS onKeyDown =====');
                              console.log('🔍 [EXCLUSÃO DEBUG] Key:', e.key, 'Code:', e.code);
                              console.log('🔍 [EXCLUSÃO DEBUG] Valor atual:', e.target.value);
                              console.log('🔍 [EXCLUSÃO DEBUG] É Delete?', e.key === 'Delete');
                              console.log('🔍 [EXCLUSÃO DEBUG] É Backspace?', e.key === 'Backspace');
                              console.log('🔍 [EXCLUSÃO DEBUG] Posição cursor:', e.target.selectionStart, 'até', e.target.selectionEnd);
                              console.log('🔍 [EXCLUSÃO DEBUG] readOnly:', e.target.readOnly, 'disabled:', e.target.disabled);
                              
                              if (e.key === 'Delete' || e.key === 'Backspace') {
                                console.log('🔍 [EXCLUSÃO DEBUG] ⚠️ TECLA DE EXCLUSÃO DETECTADA!');
                                console.log('🔍 [EXCLUSÃO DEBUG] Valor antes da exclusão:', `'${e.target.value}'`);
                              }
                              
                              handleEnterKeyPress(e)
                            }}
                            onFocus={(e) => {
                              console.log('🔍 COFINS onFocus - Valor:', e.target.value);
                              console.log('🔍 COFINS onFocus - readOnly:', e.target.readOnly);
                              console.log('🔍 COFINS onFocus - disabled:', e.target.disabled);
                            }}
							placeholder="0%"
                            style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                            className="uniform-input px-[6px] py-[6px] border border-[#D1D5DB] rounded-[4px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                          />
                        </div>
                        
                        {/* Grupo Imposto de Renda conectado */}
                        <div className="p-[8px] text-center flex-shrink-0 ml-[0px]" style={{width: '345px'}}>
                          <div className="excel-input-group flex">
                            <input
                            ref={(el) => {
                              if (el) inputRefs.current[`${item.id}-irPresuncao`] = el
                            }}
                            type="text"
                            value={item.presuncaoIR}
                             onChange={(e) => {
                               const value = e.target.value;
                               const fieldKey = `${item.id}-irPresuncao`;
                               
                               // Inicializar valor original se necessário
                               initializeOriginalValue(item.id, 'presuncaoIR', item.presuncaoIR);
                               
                               // Marcar que o usuário está editando ativamente
                               setIsActivelyEditing(true);
                               
                               // Salvar posição do cursor antes da atualização
                               saveCursorPosition(fieldKey, e.target as HTMLInputElement);
                               
                               // Sempre permitir se o valor está vazio ou se é menor que o anterior (exclusão)
                               if (value === '' || value.length < item.presuncaoIR.length) {
                                 updateSegmentoTributacao(item.id, 'presuncaoIR', value);
                                 
                                 // Verificar se há mudança em relação ao valor original
                                 if (hasFieldChanged(item.id, 'presuncaoIR', value)) {
                                   setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                                 } else {
                                   setPendingChanges(prev => {
                                     const newPending = { ...prev };
                                     delete newPending[fieldKey];
                                     return newPending;
                                   });
                                 }
                                 
                                 setTimeout(() => {
                                   restoreCursorPosition(fieldKey);
                                   checkPendingChanges();
                                 }, 10);
                                 return;
                               }
                               
                               // Para outros valores, permitir apenas números e vírgula
                               if (/^[\d,]*$/.test(value)) {
                                 updateSegmentoTributacao(item.id, 'presuncaoIR', value);
                                 
                                 // Verificar se há mudança em relação ao valor original
                                 if (hasFieldChanged(item.id, 'presuncaoIR', value)) {
                                   setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                                 } else {
                                   setPendingChanges(prev => {
                                     const newPending = { ...prev };
                                     delete newPending[fieldKey];
                                     return newPending;
                                   });
                                 }
                                 
                                 // Restaurar posição do cursor após a atualização
                                 setTimeout(() => {
                                   restoreCursorPosition(fieldKey);
                                   checkPendingChanges();
                                 }, 0);
                               }
                             }}
                             onBlur={(e) => {
                               const fieldKey = `${item.id}-irPresuncao`;
                               const currentValue = e.target.value;
                               
                               // Limpar flag de edição ativa
                               setIsActivelyEditing(false);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'presuncaoIR', currentValue)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: currentValue }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               // Atualizar estado do botão Salvar
                               checkPendingChanges();
                               
                               // Executar formatação original
                               handlePercentageBlur(item.id, 'presuncaoIR', e);
                             }}

                              onKeyDown={(e) => {
                                console.log('🔍 [EXCLUSÃO DEBUG] ===== IR Presunção onKeyDown =====');
                                console.log('🔍 [EXCLUSÃO DEBUG] Key:', e.key, 'Code:', e.code);
                                console.log('🔍 [EXCLUSÃO DEBUG] Valor atual:', e.target.value);
                                console.log('🔍 [EXCLUSÃO DEBUG] É Delete?', e.key === 'Delete');
                                console.log('🔍 [EXCLUSÃO DEBUG] É Backspace?', e.key === 'Backspace');
                                console.log('🔍 [EXCLUSÃO DEBUG] Posição cursor:', e.target.selectionStart, 'até', e.target.selectionEnd);
                                console.log('🔍 [EXCLUSÃO DEBUG] readOnly:', e.target.readOnly, 'disabled:', e.target.disabled);
                                
                                if (e.key === 'Delete' || e.key === 'Backspace') {
                                  console.log('🔍 [EXCLUSÃO DEBUG] ⚠️ TECLA DE EXCLUSÃO DETECTADA!');
                                  console.log('🔍 [EXCLUSÃO DEBUG] Valor antes da exclusão:', `'${e.target.value}'`);
                                }
                                
                                handleEnterKeyPress(e)
                              }}
                              onFocus={(e) => {
                                console.log('🔍 IR Presunção onFocus - Valor:', e.target.value);
                                console.log('🔍 IR Presunção onFocus - readOnly:', e.target.readOnly);
                                console.log('🔍 IR Presunção onFocus - disabled:', e.target.disabled);
                              }}
							  placeholder="0%"
                              style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                              className="uniform-input excel-input-first px-[6px] py-[6px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"/>
                            <div 
                              style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                              className="uniform-input excel-input-middle px-[6px] py-[6px] text-[#1F2937] font-inter text-[13px] text-center bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center cursor-not-allowed">
                              {impostoRendaData.ir}
                            </div>

                            <div 
                              style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                              className="uniform-input excel-input-middle px-[6px] py-[6px] text-[#1F2937] font-inter text-[13px] text-center bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center cursor-not-allowed">
                              {impostoRendaData.irAdicional}
                            </div>

                            <div className="currency-input excel-input-last px-[0px] py-[6px] text-[#1F2937] font-inter text-[13px] text-center bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center cursor-not-allowed">
                              {getValorDeduzirByPeriodo()}
                            </div>

                          </div>
                        </div>
                        
                        {/* Grupo CSLL conectado */}
                        <div className="p-[0px] text-center flex-shrink-0 ml-[0px]" style={{width: '130px'}}>
                          <div className="excel-input-group flex">
                            <input
                              ref={(el) => {
                                if (el) inputRefs.current[`${item.id}-csllPresuncao`] = el
                              }}
                              type="text"
                              value={item.presuncaoCSLL}
                             onChange={(e) => {
                               const value = e.target.value;
                               const fieldKey = `${item.id}-csllPresuncao`;
                               
                               // Inicializar valor original se necessário
                               initializeOriginalValue(item.id, 'presuncaoCSLL', item.presuncaoCSLL);
                               
                               // Marcar que o usuário está editando ativamente
                               setIsActivelyEditing(true);
                               
                               // Salvar posição do cursor antes da atualização
                               saveCursorPosition(fieldKey, e.target as HTMLInputElement);
                               
                               // Sempre permitir se o valor está vazio ou se é menor que o anterior (exclusão)
                               if (value === '' || value.length < item.presuncaoCSLL.length) {
                                 updateSegmentoTributacao(item.id, 'presuncaoCSLL', value);
                                 
                                 // Verificar se há mudança em relação ao valor original
                                 if (hasFieldChanged(item.id, 'presuncaoCSLL', value)) {
                                   setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                                 } else {
                                   setPendingChanges(prev => {
                                     const newPending = { ...prev };
                                     delete newPending[fieldKey];
                                     return newPending;
                                   });
                                 }
                                 
                                 setTimeout(() => {
                                   restoreCursorPosition(fieldKey);
                                   checkPendingChanges();
                                 }, 10);
                                 return;
                               }
                               
                               // Para outros valores, permitir apenas números e vírgula
                               if (/^[\d,]*$/.test(value)) {
                                 updateSegmentoTributacao(item.id, 'presuncaoCSLL', value);
                                 
                                 // Verificar se há mudança em relação ao valor original
                                 if (hasFieldChanged(item.id, 'presuncaoCSLL', value)) {
                                   setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
                                 } else {
                                   setPendingChanges(prev => {
                                     const newPending = { ...prev };
                                     delete newPending[fieldKey];
                                     return newPending;
                                   });
                                 }
                                 
                                 // Restaurar posição do cursor após a atualização
                                 setTimeout(() => {
                                   restoreCursorPosition(fieldKey);
                                   checkPendingChanges();
                                 }, 0);
                               }
                             }}
                             onBlur={(e) => {
                               const fieldKey = `${item.id}-csllPresuncao`;
                               const currentValue = e.target.value;
                               
                               // Limpar flag de edição ativa
                               setIsActivelyEditing(false);
                               
                               // Verificar se há mudança em relação ao valor original
                               if (hasFieldChanged(item.id, 'presuncaoCSLL', currentValue)) {
                                 setPendingChanges(prev => ({ ...prev, [fieldKey]: currentValue }));
                               } else {
                                 setPendingChanges(prev => {
                                   const newPending = { ...prev };
                                   delete newPending[fieldKey];
                                   return newPending;
                                 });
                               }
                               
                               // Atualizar estado do botão Salvar
                               checkPendingChanges();
                               
                               // Executar formatação original
                               handlePercentageBlur(item.id, 'presuncaoCSLL', e);
                             }}

                              onKeyDown={(e) => {
                                console.log('🔍 [EXCLUSÃO DEBUG] ===== CSLL Presunção onKeyDown =====');
                                console.log('🔍 [EXCLUSÃO DEBUG] Key:', e.key, 'Code:', e.code);
                                console.log('🔍 [EXCLUSÃO DEBUG] Valor atual:', e.target.value);
                                console.log('🔍 [EXCLUSÃO DEBUG] É Delete?', e.key === 'Delete');
                                console.log('🔍 [EXCLUSÃO DEBUG] É Backspace?', e.key === 'Backspace');
                                console.log('🔍 [EXCLUSÃO DEBUG] Posição cursor:', e.target.selectionStart, 'até', e.target.selectionEnd);
                                console.log('🔍 [EXCLUSÃO DEBUG] readOnly:', e.target.readOnly, 'disabled:', e.target.disabled);
                                
                                if (e.key === 'Delete' || e.key === 'Backspace') {
                                  console.log('🔍 [EXCLUSÃO DEBUG] ⚠️ TECLA DE EXCLUSÃO DETECTADA!');
                                  console.log('🔍 [EXCLUSÃO DEBUG] Valor antes da exclusão:', `'${e.target.value}'`);
                                }
                                
                                handleEnterKeyPress(e)
                              }}
                              onFocus={(e) => {
                                console.log('🔍 CSLL Presunção onFocus - Valor:', e.target.value);
                                console.log('🔍 CSLL Presunção onFocus - readOnly:', e.target.readOnly);
                                console.log('🔍 CSLL Presunção onFocus - disabled:', e.target.disabled);
                              }}
							  placeholder="0%"
                              style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
                              className="uniform-input excel-input-first px-[6px] py-[6px] text-[#1F2937] font-inter text-[13px] focus:border-[#1777CF] focus:outline-none text-center"
                            />
                            <div 
							style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}
							className="uniform-input excel-input-last px-[6px] py-[6px] text-[#1F2937] font-inter text-[13px] text-center bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center cursor-not-allowed">
                              {impostoRendaData.csll}
                            </div>

                          </div>
                        </div>
                        
                        {/* Coluna Ações */}
                        <div className="p-[8px] text-center flex-shrink-0 ml-[10px] mr-[10px] pr-[0px]" style={{width: '35px'}}>
                          <button
                            onClick={() => {
                          console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Clique no botão de exclusão para segmento:', item.segmento, 'ID:', item.id)
                          console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Objeto completo do segmento:', item)
                          setSegmentoToDelete(item)
                          setShowDeleteModal(true)
                          console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Modal de exclusão aberto')
                        }}
                            className="w-[32px] h-[32px] bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                            title="Remover segmento"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>










      {/* Modal de Configurações do Imposto de Renda */}
      {showImpostoRendaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-[16px] shadow-2xl w-[500px] max-w-[90vw] max-h-[90vh] flex flex-col">
            
            {/* Cabeçalho - Fixo */}
            <div className="relative flex items-center justify-center p-[24px] border-b border-[#E5E7EB] flex-shrink-0">
              <h3 className="text-[22px] font-bold text-[#1F2937] font-inter">
                Imposto de renda
              </h3>
              <button 
                onClick={handleCloseImpostoRendaModal}
                className="absolute right-[24px] flex items-center justify-center w-[32px] h-[32px] rounded-[8px] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Conteúdo - Rolável */}
            <div className="p-[32px] space-y-[24px] overflow-y-auto modern-scrollbar flex-1">
              
              {/* I.R. */}
              <div className="flex justify-between items-center">
                <label className="text-[16px] font-medium text-[#374151] font-inter">I.R.:</label>
                <input
                  type="text"
                  value={impostoRendaData.ir}
                  onChange={(e) => setImpostoRendaData({...impostoRendaData, ir: e.target.value})}
                  onBlur={(e) => {
                    const formattedValue = formatPercentage(e.target.value)
                    setImpostoRendaData({...impostoRendaData, ir: formattedValue})
                  }}
                  onKeyDown={handleModalEnterKeyPress}
                  className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="15%"
                />
              </div>
              
              {/* IR Adicional */}
              <div className="flex justify-between items-center">
                <label className="text-[16px] font-medium text-[#374151] font-inter">IR Adicional:</label>
                <input
                  type="text"
                  value={impostoRendaData.irAdicional}
                  onChange={(e) => setImpostoRendaData({...impostoRendaData, irAdicional: e.target.value})}
                  onBlur={(e) => {
                    const formattedValue = formatPercentage(e.target.value)
                    setImpostoRendaData({...impostoRendaData, irAdicional: formattedValue})
                  }}
                  onKeyDown={handleModalEnterKeyPress}
                  className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="10%"
                />
              </div>

              {/* Divisória */}
              <div className="border-b border-[#E5E7EB]"></div>

              {/* Valor a Deduzir */}
              <div>
                <h4 className="text-[18px] font-semibold text-[#1F2937] font-inter mb-[16px]">Valor a Deduzir</h4>
                <div className="space-y-[16px]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-[8px]">
                      <input
                        type="radio"
                        id="mensal"
                        name="periodo"
                        value="mensal"
                        checked={selectedPeriodo === 'mensal'}
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        className="w-[16px] h-[16px] text-[#1777CF]"
                      />
                      <label htmlFor="mensal" className="text-[16px] font-medium text-[#374151] font-inter cursor-pointer">Mensal:</label>
                    </div>

                    <input
                      type="text"
                      value={impostoRendaData.valorDeduzirMensal}
                      onChange={(e) => setImpostoRendaData({...impostoRendaData, valorDeduzirMensal: e.target.value})}
                      onBlur={(e) => {
                        const formattedValue = formatCurrency(e.target.value)
                        setImpostoRendaData({...impostoRendaData, valorDeduzirMensal: formattedValue})
                      }}
                      onKeyDown={handleModalEnterKeyPress}
                      className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                      placeholder="R$ 20.000,00"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-[8px]">
                      <input
                        type="radio"
                        id="trimestral"
                        name="periodo"
                        value="trimestral"
                        checked={selectedPeriodo === 'trimestral'}
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        className="w-[16px] h-[16px] text-[#1777CF]"
                      />
                      <label htmlFor="trimestral" className="text-[16px] font-medium text-[#374151] font-inter cursor-pointer">Trimestral:</label>
                    </div>

                    <input
                      type="text"
                      value={impostoRendaData.valorDeduzirTrimestral}
                      onChange={(e) => setImpostoRendaData({...impostoRendaData, valorDeduzirTrimestral: e.target.value})}
                      onBlur={(e) => {
                        const formattedValue = formatCurrency(e.target.value)
                        setImpostoRendaData({...impostoRendaData, valorDeduzirTrimestral: formattedValue})
                      }}
                      onKeyDown={handleModalEnterKeyPress}
                      className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                      placeholder="R$ 60.000,00"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-[8px]">
                      <input
                        type="radio"
                        id="anual"
                        name="periodo"
                        value="anual"
                        checked={selectedPeriodo === 'anual'}
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        className="w-[16px] h-[16px] text-[#1777CF]"
                      />
                      <label htmlFor="anual" className="text-[16px] font-medium text-[#374151] font-inter cursor-pointer">Anual:</label>
                    </div>

                    <input
                      type="text"
                      value={impostoRendaData.valorDeduzirAnual}
                      onChange={(e) => setImpostoRendaData({...impostoRendaData, valorDeduzirAnual: e.target.value})}
                      onBlur={(e) => {
                        const formattedValue = formatCurrency(e.target.value)
                        setImpostoRendaData({...impostoRendaData, valorDeduzirAnual: formattedValue})
                      }}
                      onKeyDown={handleModalEnterKeyPress}
                      className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                      placeholder="R$ 240.000,00"
                    />
                  </div>
                </div>
              </div>

              {/* Divisória */}
              <div className="border-b border-[#E5E7EB]"></div>

              {/* CSLL */}
              <div className="flex justify-between items-center">
                <label className="text-[16px] font-medium text-[#374151] font-inter">CSLL:</label>
                <input
                  type="text"
                  value={impostoRendaData.csll}
                  onChange={(e) => setImpostoRendaData({...impostoRendaData, csll: e.target.value})}
                  onBlur={(e) => {
                    const formattedValue = formatPercentage(e.target.value)
                    setImpostoRendaData({...impostoRendaData, csll: formattedValue})
                  }}
                  onKeyDown={handleModalEnterKeyPress}
                  className="w-[150px] px-[18px] py-[6px] border border-[#D1D5DB] rounded-[6px] text-center text-[#1F2937] font-inter focus:border-[#1777CF] focus:outline-none"
                  placeholder="9%"
                />
              </div>
            </div>

            {/* Botões - Fixo */}
            <div className="flex justify-between items-center p-[32px] border-t border-[#E5E7EB] flex-shrink-0">
              <button
                onClick={handleCloseImpostoRendaModal}
                className="w-[120px] h-[48px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
              >
                Cancelar
              </button>
              <button
               onClick={handleSaveAndCloseModal}
               disabled={!checkImpostoRendaChanges(impostoRendaData, originalImpostoRendaData)}
               className={`w-[120px] h-[48px] rounded-[12px] font-semibold transition-colors text-[16px] font-inter ${
                 !checkImpostoRendaChanges(impostoRendaData, originalImpostoRendaData)
                   ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                   : 'bg-[#1777CF] hover:bg-[#1565C0] text-white cursor-pointer'
               }`}

              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Modal de Confirmação - Sair sem Salvar */}
       {showImpostoRendaExitConfirm && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70]">
           <div className="bg-white rounded-[16px] shadow-2xl w-[450px] max-w-[90vw] p-[32px]">
             
             {/* Cabeçalho */}
             <div className="text-center mb-[24px]">
               <h3 className="text-[20px] font-bold text-[#1F2937] font-inter mb-[8px]">
                 Deseja sair sem salvar?
               </h3>
               <p className="text-[16px] text-[#6B7280] font-inter">
                 As informações alteradas serão perdidas se você não salvar.
               </p>
             </div>
       
             {/* Botões */}
             <div className="flex justify-between items-center gap-[16px]">
               <button
                 onClick={handleBackToImpostoRenda}
                 className="flex-1 h-[48px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
               >
                 Voltar
               </button>
               <button
                 onClick={handleConfirmExitImpostoRenda}
                 className="flex-1 h-[48px] bg-[#DC2626] hover:bg-[#B91C1C] rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
               >
                 Sair sem salvar
               </button>
             </div>
           </div>
         </div>
       )}

      {/* Modal Unificado para Adicionar Segmento */}
      {showModalAdicionarSegmento && (
        <ModalAdicionarSegmento
          isOpen={showModalAdicionarSegmento}
          onClose={() => setShowModalAdicionarSegmento(false)}
        />
      )}
      
      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmarExclusao
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSegmentoToDelete(null)
        }}
        onConfirm={() => {
          console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Confirmação de exclusão para segmento:', segmentoToDelete?.segmento, 'ID:', segmentoToDelete?.id)
          console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Objeto segmentoToDelete completo:', segmentoToDelete)
          if (segmentoToDelete) {
            console.log('🗑️ [DEBUG] BD-SegmentoTributacao - Chamando removerSegmento com ID:', segmentoToDelete.id)
            removerSegmento(segmentoToDelete.id)
            setIsDirty(true)
            console.log('🗑️ [DEBUG] BD-SegmentoTributacao - removerSegmento chamada concluída')
          }
          setShowDeleteModal(false)
          setSegmentoToDelete(null)
        }}
        nomeSegmento={segmentoToDelete?.segmento || ''}
      />
    </>
  )
}

export default BDSegmentoTributacao