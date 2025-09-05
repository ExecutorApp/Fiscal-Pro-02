import React, { useState, useEffect, useRef } from 'react'
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

interface Segmento {
  id: string;
  nome: string;
  padrao: string;
  alternativa?: string;
}

interface NovoSegmentoForm {
  nome: string;
  simplesNacional: {
    padrao: string;
    alternativa: string;
  };
  lucroPresumido: {
    pis: string;
    cofins: string;
    presuncaoIR: string;
    presuncaoCSLL: string;
  };
  lucroReal: {
    pis: string;
    cofins: string;
  };
}

interface BDSegmentosProps {
  onDataChange?: (data: any) => void;
  onSaveComplete?: () => void;
}

export const BDSegmentos: React.FC<BDSegmentosProps> = ({ onDataChange, onSaveComplete }) => {
  // Hook do contexto compartilhado
  const {
    segmentosSimplesNacional: segmentos,
    adicionarSegmento,
    editarSegmento,
    removerSegmento,
    verificarNomeExistente
  } = useSegmentos()
  
  // Debug: Log dos dados do contexto
  console.log('🔍 [DEBUG] BDSegmentos - segmentosSimplesNacional:', segmentos)
  console.log('🔍 [DEBUG] BDSegmentos - Quantidade de segmentos:', segmentos.length)
  
  // Log quando os segmentos mudarem
  useEffect(() => {
    console.log('🔍 [DEBUG] BDSegmentos - segmentosSimplesNacional atualizados:', segmentos.length, 'segmentos')
  }, [segmentos])

  // Refs para sincronização de rolagem
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Estados para modais e controle
  const [showModalAdicionarSegmento, setShowModalAdicionarSegmento] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [segmentoToDelete, setSegmentoToDelete] = useState<Segmento | null>(null)
  
  // Estado para armazenar dados originais para comparação
  const [originalSegmentos, setOriginalSegmentos] = useState<Segmento[]>([])

  const [novoSegmento, setNovoSegmento] = useState<NovoSegmentoForm>({
    nome: '',
    simplesNacional: {
      padrao: '',
      alternativa: ''
    },
    lucroPresumido: {
      pis: '',
      cofins: '',
      presuncaoIR: '',
      presuncaoCSLL: ''
    },
    lucroReal: {
      pis: '',
      cofins: ''
    }
  })

  // Estados para validação
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Função para validar campos obrigatórios
  const validateField = (fieldName: string, value: string): string => {
    if (!value || !value.trim()) {
      switch (fieldName) {
        case 'nome':
          return 'Nome do segmento é obrigatório'
        case 'simplesNacional.padrao':
          return 'Padrão é obrigatório'
        case 'lucroPresumido.pis':
          return 'PIS é obrigatório'
        case 'lucroPresumido.cofins':
          return 'COFINS é obrigatório'
        case 'lucroPresumido.presuncaoIR':
          return 'Presunção IR é obrigatório'
        case 'lucroPresumido.presuncaoCSLL':
          return 'Presunção CSLL é obrigatório'
        case 'lucroReal.pis':
          return 'PIS é obrigatório'
        case 'lucroReal.cofins':
          return 'COFINS é obrigatório'
        default:
          return 'Campo obrigatório'
      }
    }
    return ''
  }

  // Função para validar todo o formulário
  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    // Validar campos obrigatórios
    const requiredFields = [
      { key: 'nome', value: novoSegmento.nome },
      { key: 'simplesNacional.padrao', value: novoSegmento.simplesNacional.padrao },
      { key: 'lucroPresumido.pis', value: novoSegmento.lucroPresumido.pis },
      { key: 'lucroPresumido.cofins', value: novoSegmento.lucroPresumido.cofins },
      { key: 'lucroPresumido.presuncaoIR', value: novoSegmento.lucroPresumido.presuncaoIR },
      { key: 'lucroPresumido.presuncaoCSLL', value: novoSegmento.lucroPresumido.presuncaoCSLL },
      { key: 'lucroReal.pis', value: novoSegmento.lucroReal.pis },
      { key: 'lucroReal.cofins', value: novoSegmento.lucroReal.cofins }
    ]

    requiredFields.forEach(field => {
      const error = validateField(field.key, field.value)
      if (error) {
        errors[field.key] = error
      }
    })

    setFieldErrors(errors)
    const isValid = Object.keys(errors).length === 0
    setIsFormValid(isValid)
    return isValid
  }

  // useEffect para validação do estado do botão (sem mostrar erros)
  useEffect(() => {
    const hasRequiredFields = 
      novoSegmento.nome.trim() &&
      novoSegmento.simplesNacional.padrao.trim() &&
      novoSegmento.lucroPresumido.pis.trim() &&
      novoSegmento.lucroPresumido.cofins.trim() &&
      novoSegmento.lucroPresumido.presuncaoIR.trim() &&
      novoSegmento.lucroPresumido.presuncaoCSLL.trim() &&
      novoSegmento.lucroReal.pis.trim() &&
      novoSegmento.lucroReal.cofins.trim();
    
    setIsFormValid(!!hasRequiredFields);
  }, [novoSegmento]);

  // Função para converter números para algarismos romanos
  const convertToRoman = (num: number): string => {
    const romanNumerals = [
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    for (const { value, numeral } of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  // Função para capitalizar primeira letra
  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Função para lidar com mudanças no campo nome
  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    setNovoSegmento({...novoSegmento, nome: value});
  }

  // Função para lidar com mudanças nos campos do Simples Nacional
  const handleSimplesNacionalChange = (field: 'padrao' | 'alternativa', value: string) => {
    // Permitir apenas números ou string vazia (para permitir apagar)
    if (value === '' || /^\d+$/.test(value)) {
      setNovoSegmento({
        ...novoSegmento,
        simplesNacional: {
          ...novoSegmento.simplesNacional,
          [field]: value
        }
      });
    }
  }

  // Função para lidar com mudanças nos campos de percentual
  const handlePercentualChange = (section: 'lucroPresumido' | 'lucroReal', field: string, value: string) => {
    // Permitir apenas números, vírgula e ponto
    if (/^[\d,\.]*$/.test(value)) {
      setNovoSegmento({
        ...novoSegmento,
        [section]: {
          ...novoSegmento[section],
          [field]: value
        }
      });
    }
  }

  // Função para converter para romano ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, field: 'padrao' | 'alternativa') => {
    if (e.key === 'Enter') {
      convertToRomanModal(field);
    }
  }

  // Função para converter para romano ao perder o foco (onBlur) no modal
  const handleBlur = (field: 'padrao' | 'alternativa') => {
    convertToRomanModal(field);
  }

  // Função auxiliar para conversão no modal
  const convertToRomanModal = (field: 'padrao' | 'alternativa') => {
    const value = novoSegmento.simplesNacional[field];
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 10) {
      const romanValue = convertToRoman(numValue);
      setNovoSegmento({
        ...novoSegmento,
        simplesNacional: {
          ...novoSegmento.simplesNacional,
          [field]: romanValue
        }
      });
    }
  }

  // Função para formatar percentual ao perder o foco
  const handlePercentualBlur = (section: 'lucroPresumido' | 'lucroReal', field: string) => {
    const value = novoSegmento[section][field as keyof typeof novoSegmento.lucroPresumido];
    if (value && !value.includes('%')) {
      const numValue = parseFloat(value.replace(',', '.'));
      if (!isNaN(numValue)) {
        const formattedValue = numValue.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }) + '%';
        setNovoSegmento({
          ...novoSegmento,
          [section]: {
            ...novoSegmento[section],
            [field]: formattedValue
          }
        });
      }
    }
  }

  // Função para sincronizar rolagem
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // Implementação de sincronização de rolagem se necessário
  }

  // useEffect para carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadSegmentosFromStorage = () => {
      try {
        const savedData = localStorage.getItem('segmentos_data')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          if (parsedData.segmentos && Array.isArray(parsedData.segmentos)) {
            // Ordenar os segmentos carregados alfabeticamente
            const sortedSegmentos = parsedData.segmentos.sort((a: Segmento, b: Segmento) => 
              a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
            )
            // Os segmentos já estão sendo gerenciados pelo contexto
            // setSegmentos(sortedSegmentos)
            console.log('📂 Segmentos carregados do localStorage e ordenados alfabeticamente')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar segmentos do localStorage:', error)
      }
    }
    
    loadSegmentosFromStorage()
  }, [])

  // useEffect para monitorar mudanças e notificar o componente pai
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect isDirty:', isDirty, 'segmentos.length:', segmentos.length, 'originalSegmentos.length:', originalSegmentos.length)
    if (isDirty && onDataChange) {
      console.log('🚨 [DEBUG] Notificando componente pai - hasChanges: true')
      onDataChange({
        segmentos: segmentos,
        hasChanges: true
      })
    }
  }, [isDirty, segmentos, onDataChange])
  
  // Inicializar dados originais quando segmentos for carregado
  useEffect(() => {
    if (segmentos.length > 0 && originalSegmentos.length === 0) {
      setOriginalSegmentos(JSON.parse(JSON.stringify(segmentos)))
      setIsDirty(false) // Garantir que botão inicie desativado
    }
  }, [segmentos, originalSegmentos.length])
  
  // Garantir que isDirty inicie como false após carregamento completo
  useEffect(() => {
    if (originalSegmentos.length > 0 && segmentos.length > 0) {
      setIsDirty(false)
    }
  }, [originalSegmentos.length])



  // Função para verificar se há mudanças reais nos dados
  const checkForRealChanges = (currentData: Segmento[], originalData: Segmento[]) => {
    // Se não há dados originais ainda, considera como não modificado
    if (originalData.length === 0) return false
    
    if (currentData.length !== originalData.length) return true
    
    return currentData.some((currentItem) => {
      const originalItem = originalData.find(orig => orig.id === currentItem.id)
      if (!originalItem) return true
      
      return (
        currentItem.nome !== originalItem.nome ||
        currentItem.padrao !== originalItem.padrao ||
        (currentItem.alternativa || '') !== (originalItem.alternativa || '')
      )
    })
  }

  // Função para atualizar dados da tabela usando o contexto
  const updateSegmento = (itemId: string, field: keyof Segmento, value: string) => {
    console.log('🔍 updateSegmento - itemId:', itemId, 'field:', field, 'value:', value);
    const segmento = segmentos.find(s => s.id === itemId)
    if (!segmento) {
      console.log('🔍 updateSegmento - Segmento não encontrado para ID:', itemId);
      return // Item não encontrado
    }
    
    const previousValue = segmento[field]
    console.log('🔍 updateSegmento - Valor anterior:', previousValue, 'Novo valor:', value);
    
    // Só atualizar se realmente houve mudança no valor
    if (previousValue !== value) {
      console.log('🔍 updateSegmento - Valores diferentes, atualizando...');
      
      // Criar estrutura correta para editarSegmento
      const dadosAtualizados = {
        simplesNacional: {
          padrao: field === 'padrao' ? value : segmento.padrao,
          alternativa: field === 'alternativa' ? value : (segmento.alternativa || '')
        }
      }
      
      console.log('🔍 updateSegmento - Dados para editarSegmento:', dadosAtualizados);
      editarSegmento(itemId, dadosAtualizados)
      
      setIsDirty(true)
      
      // Notificar o componente pai sobre as alterações
      if (onDataChange) {
        onDataChange({
          segmentos: segmentos,
          hasChanges: true
        })
      }
    } else {
      console.log('🔍 updateSegmento - Valores iguais, não atualizando');
    }
  }

  // Função para lidar com mudanças nos campos Padrão e Alternativa da tabela
  const handleTableFieldChange = (itemId: string, field: 'padrao' | 'alternativa', value: string) => {
    console.log('🔍 handleTableFieldChange - itemId:', itemId, 'field:', field, 'value:', value);
    // Permitir qualquer valor durante a digitação, incluindo string vazia
    updateSegmento(itemId, field, value);
    console.log('🔍 handleTableFieldChange - updateSegmento chamado');
  };

  // Função para converter para romano ao pressionar Enter na tabela
  const handleTableKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, field: 'padrao' | 'alternativa') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      convertToRomanTable(itemId, field);
      // Remover foco do campo
      e.currentTarget.blur();
    }
  }

  // Função para converter para romano ao perder o foco (onBlur) na tabela
  const handleTableBlur = (itemId: string, field: 'padrao' | 'alternativa') => {
    convertToRomanTable(itemId, field);
  }

  // Função auxiliar para conversão na tabela
  const convertToRomanTable = (itemId: string, field: 'padrao' | 'alternativa') => {
    const segmento = segmentos.find(s => s.id === itemId);
    if (segmento) {
      let value = field === 'padrao' ? segmento.padrao : segmento.alternativa;
      value = value?.trim() || '';
      
      // Se o campo está vazio, manter vazio (não forçar '-')
      if (value === '') {
        return;
      }
      
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
        const romanValue = convertToRoman(numValue);
        updateSegmento(itemId, field, romanValue);
      } else {
        alert('Por favor, insira um número entre 1 e 10.');
      }
    }
  }

  // Função para salvar as alterações
  const handleSaveSegmentos = async () => {
    if (!isDirty) return
    
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        segmentos: segmentos
      }
      
      console.log('=== DADOS PARA PERSISTÊNCIA - SEGMENTOS ===')
      console.log('Salvando alterações dos segmentos:', JSON.stringify(dataToSave, null, 2))
      
      localStorage.setItem('segmentos_data', JSON.stringify(dataToSave))
      
      console.log('💾 Dados de Segmentos salvos permanentemente no navegador!')
      
      // Atualizar dados originais após salvar
      setOriginalSegmentos(JSON.parse(JSON.stringify(segmentos)))
      
      setShowSuccessMessage(true)
      setIsDirty(false)
      
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 4000)

      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Erro ao salvar segmentos:', error)
    }
  }

  // Função para adicionar novo segmento sincronizado nas três categorias
  const handleAddSegmento = () => {
    // Validar formulário antes de salvar
    if (!validateForm()) {
      // Focar no primeiro campo com erro
      const firstErrorField = Object.keys(fieldErrors)[0]
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLInputElement
        if (element) {
          element.focus()
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      return
    }
    
    const nomeSegmento = novoSegmento.nome.trim()
    
    if (verificarNomeExistente(nomeSegmento)) {
      setFieldErrors(prev => ({ ...prev, nome: 'Já existe um segmento com este nome' }))
      const element = document.querySelector(`[data-field="nome"]`) as HTMLInputElement
      if (element) {
        element.focus()
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    
    if (nomeSegmento) {
      // Usar o contexto para adicionar o segmento em todas as categorias
      adicionarSegmento(novoSegmento)
      
      console.log('✅ Segmento criado nas 3 categorias:', novoSegmento.nome)
      
      // Resetar formulário e fechar modal
      setNovoSegmento({
        nome: '',
        simplesNacional: {
          padrao: '',
          alternativa: ''
        },
        lucroPresumido: {
          pis: '',
          cofins: '',
          presuncaoIR: '',
          presuncaoCSLL: ''
        },
        lucroReal: {
          pis: '',
          cofins: ''
        }
      })
      setFieldErrors({})
      setShowModalAdicionarSegmento(false)
      
      // Atualizar dados originais após adição para não detectar como "mudança"
      // Usar setTimeout para aguardar a atualização do contexto
      setTimeout(() => {
        setOriginalSegmentos(JSON.parse(JSON.stringify(segmentos)))
        setIsDirty(false)
      }, 100)
      
      // Notificar o componente pai que a operação foi concluída (sem marcar como dirty)
      if (onSaveComplete) {
        onSaveComplete()
      }
    }
  }

  // Função para abrir modal de confirmação de exclusão
  const handleRemoveSegmento = (id: string) => {
    const segmento = segmentos.find(s => s.id === id)
    setSegmentoToDelete(segmento || null)
    setShowDeleteModal(true)
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

  return (
    <>
      <style>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 #F1F5F9;
        }
        
        .modern-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .modern-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 4px;
        }
        
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
        
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        
        .hidden-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-spacing {
          padding-right: 5px;
        }
        
        .uniform-input {
          border: 1px solid #D1D5DB;
          border-radius: 4px;
        }
        
        .uniform-input:focus {
          border-color: #1777CF;
          outline: none;
        }
        
        /* Hover suave para linhas da tabela */
        .table-row:hover {
          background-color: #F9FAFB; 
          transition: background-color 0.15s ease;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      <div className="h-full flex flex-col" style={{
        '--altura-header-modal': '60px',
        '--altura-barra-acoes': '80px', 
        '--paddings-verticais': '24px'
      } as React.CSSProperties}>
        {/* Título dentro do container */}
        <div className="pl-[10px] pr-[20px] pt-[12px] pb-[12px] bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
          <h3 className="text-[16px] font-bold text-[#1F2937] font-inter">
            Empresas / Simples Nacional / Segmentos
          </h3>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[8px]">
              <button
                onClick={() => {
                  setShowModalAdicionarSegmento(true)
                  setFieldErrors({})
                }}
                className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#1777CF] text-white rounded-[8px] hover:bg-[#1565C0] transition-colors text-[14px] font-medium font-inter shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Segmento
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



        {/* Container da tabela com scroll sincronizado */}
        <div className="flex-1 flex flex-col bg-white" style={{ minHeight: 0 }}>
          {/* Cabeçalho da tabela (fixo) */}
          <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] sticky top-0 z-10" style={{ flex: '0 0 auto' }}>
            <div className="overflow-x-auto overflow-x-hidden px-[10px]">
              <div className="min-w-[600px] ml-[3px] pr-[0px]">
                <table className="w-full" style={{tableLayout: 'auto'}}>
                  <thead>
                    <tr className="h-[56px]">
                      <th className="text-left pl-[0px] pr-[8px] font-semibold text-[#374151] text-[15px] font-inter" style={{width: '100%', minWidth: '220px'}}>Segmentos</th>
                      <th className="text-right pr-[16px] pl-[16px] font-semibold text-[#374151] font-inter text-[14px] pr-[10px]" style={{width: '80px'}}>Padrão</th>
                      <th className="text-right pr-[16px] pl-[16px] font-semibold text-[#374151] font-inter text-[14px] pr-[72px]" style={{width: '80px'}}>Alternativa</th>

                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          </div>

          {/* Área de scroll com dados */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-hidden overflow-y-auto px-[10px] my-[0px]"
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              width: '100%',
              boxSizing: 'border-box',
              maxHeight: 'calc(100vh - var(--altura-header-modal) - var(--altura-barra-acoes) - var(--paddings-verticais) - 8px)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 #F1F5F9',
              paddingBottom: '12px',
              scrollbarGutter: 'stable'
            }}
            onScroll={handleScroll}
          >
            <div className="min-w-[600px] ml-[3px] pr-[0px]">
              <table className="w-full" style={{tableLayout: 'auto'}}>
                <tbody>
                  {segmentos.map((segmento, index) => (
                    <tr 
                      key={segmento.id} 
                      className="hover:bg-[#F9FAFB] group relative after:content-[''] after:absolute after:bottom-0 after:left-[0px] after:right-[15px] after:h-[1px] after:bg-[#D8E0F0CC] last:after:hidden" 
                      style={{height: 'auto', minHeight: '56px'}}
                    >
                      {/* Coluna Segmentos - flexível que expande com a tela */}
                      <td 
                        className="pl-[0px] pr-[8px] py-[12px] text-[#1F2937] font-inter text-left text-[15px]"
                        style={{
                          width: '100%',
                          minWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          height: '56px',
                          lineHeight: '32px'
                        }}
                      >
                        {segmento.nome}
                      </td>
                      
                      {/* Coluna Padrão */}
                        <td className="text-right pr-[8px] pl-[16px] py-[12px]" style={{width: '80px'}}>
                          <div className="flex justify-end">
                            <input
                              type="text"
                              value={segmento.padrao || ''}
                              onChange={(e) => {
                                console.log('🔍 PADRAO onChange - Valor atual:', segmento.padrao, 'Novo valor:', e.target.value);
                                console.log('🔍 PADRAO onChange - Event target:', e.target);
                                console.log('🔍 PADRAO onChange - Input readOnly:', e.target.readOnly);
                                console.log('🔍 PADRAO onChange - Input disabled:', e.target.disabled);
                                handleTableFieldChange(segmento.id, 'padrao', e.target.value);
                              }}
                              onKeyPress={(e) => handleTableKeyPress(e, segmento.id, 'padrao')}
                              onBlur={() => handleTableBlur(segmento.id, 'padrao')}
                              className="w-[70px] px-[8px] py-[6px] text-[14px] font-inter text-center border border-[#D1D5DB] rounded-[4px] bg-white focus:border-[#1777CF] focus:outline-none"
                              placeholder="-"
                            />
                          </div>
                        </td>
                        
                        {/* Coluna Alternativa */}
                        <td className="text-right pr-[8px] pl-[16px] py-[12px]" style={{width: '80px'}}>
                          <div className="flex justify-end">
                            <input
                              type="text"
                              value={segmento.alternativa || ''}
                              onChange={(e) => {
                                console.log('🔍 ALTERNATIVA onChange - Valor atual:', segmento.alternativa, 'Novo valor:', e.target.value);
                                console.log('🔍 ALTERNATIVA onChange - Event target:', e.target);
                                console.log('🔍 ALTERNATIVA onChange - Input readOnly:', e.target.readOnly);
                                console.log('🔍 ALTERNATIVA onChange - Input disabled:', e.target.disabled);
                                handleTableFieldChange(segmento.id, 'alternativa', e.target.value);
                              }}
                              onKeyPress={(e) => handleTableKeyPress(e, segmento.id, 'alternativa')}
                              onBlur={() => handleTableBlur(segmento.id, 'alternativa')}
                              className="w-[70px] px-[8px] py-[6px] text-[14px] font-inter text-center border border-[#D1D5DB] rounded-[4px] bg-white focus:border-[#1777CF] focus:outline-none"
                              placeholder="-"
                            />
                          </div>
                        </td>
                        
                        {/* Coluna Ações */}
                        <td className="text-right pr-[8px] pl-[16px] py-[12px]" style={{width: '44px'}}>
                          <div className="flex justify-end">
                            <button
                               onClick={() => handleRemoveSegmento(segmento.id)}
                               className="h-[32px] aspect-square bg-white text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors duration-200 border border-[#D1D5DB] flex items-center justify-center"
                               title="Remover segmento"
                             >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>





        {/* Modal Unificado para Adicionar Segmento */}
        {showModalAdicionarSegmento && (
          <ModalAdicionarSegmento
            isOpen={showModalAdicionarSegmento}
            onClose={() => setShowModalAdicionarSegmento(false)}
            categoria="simplesNacional"
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
            if (segmentoToDelete) {
              console.log('🗑️ [DEBUG] Iniciando exclusão do segmento:', segmentoToDelete.nome)
              console.log('🗑️ [DEBUG] Estado antes da exclusão - isDirty:', isDirty, 'segmentos.length:', segmentos.length)
              
              removerSegmento(segmentoToDelete.id)
              
              // Atualizar dados originais após exclusão para não detectar como "mudança"
              const novosSegmentos = segmentos.filter(s => s.id !== segmentoToDelete.id)
              console.log('🗑️ [DEBUG] Novos segmentos após filtro:', novosSegmentos.length)
              setOriginalSegmentos(JSON.parse(JSON.stringify(novosSegmentos)))
              setIsDirty(false)
              console.log('🗑️ [DEBUG] Estado após exclusão - isDirty definido como false')
              
              // Notificar o componente pai que a operação foi concluída (sem marcar como dirty)
              if (onSaveComplete) {
                console.log('🗑️ [DEBUG] Chamando onSaveComplete()')
                onSaveComplete()
              }
            }
            setShowDeleteModal(false)
            setSegmentoToDelete(null)
          }}
          nomeSegmento={segmentoToDelete?.nome || ''}
        />
      </div>
    </>
  );
};

export default BDSegmentos;