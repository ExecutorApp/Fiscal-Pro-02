import React, { useState, useEffect } from 'react'
import { useSegmentos } from '../contexts/SegmentosContext'

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
    ir: string;
    irAdicional: string;
    irValorDeduzir: string;
    csll: string;
  };
}

interface ModalAdicionarSegmentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ModalAdicionarSegmento: React.FC<ModalAdicionarSegmentoProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { adicionarSegmento } = useSegmentos()
  
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
      cofins: '',
      ir: '',
      irAdicional: '',
      irValorDeduzir: '',
      csll: ''
    }
  })
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Resetar formulário quando modal abre
  useEffect(() => {
    if (isOpen) {
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
          cofins: '',
          ir: '',
          irAdicional: '',
          irValorDeduzir: '',
          csll: ''
        }
      })
      setFieldErrors({})
    }
  }, [isOpen])

  // Função de validação (chamada apenas no momento do salvamento)
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Validar nome
    if (!novoSegmento.nome.trim()) {
      errors.nome = 'Nome é obrigatório'
    }
    
    // Validar Simples Nacional
    if (!novoSegmento.simplesNacional.padrao.trim()) {
      errors['simplesNacional.padrao'] = 'Padrão é obrigatório'
    } else {
      const padrao = novoSegmento.simplesNacional.padrao
      const numericPadrao = parseInt(padrao)
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
      
      // Verificar se é um número válido (1-10) ou um numeral romano válido
      const isValidNumber = !isNaN(numericPadrao) && numericPadrao >= 1 && numericPadrao <= 10
      const isValidRoman = romanNumerals.includes(padrao)
      
      if (!isValidNumber && !isValidRoman) {
        errors['simplesNacional.padrao'] = 'Deve ser um número entre 1 e 10 ou numeral romano (I-X)'
      }
    }
    
    // Validar alternativa se preenchida
    if (novoSegmento.simplesNacional.alternativa.trim()) {
      const alternativa = novoSegmento.simplesNacional.alternativa
      const numericAlternativa = parseInt(alternativa)
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
      
      // Verificar se é um número válido (1-10) ou um numeral romano válido
      const isValidNumber = !isNaN(numericAlternativa) && numericAlternativa >= 1 && numericAlternativa <= 10
      const isValidRoman = romanNumerals.includes(alternativa)
      
      if (!isValidNumber && !isValidRoman) {
        errors['simplesNacional.alternativa'] = 'Deve ser um número entre 1 e 10 ou numeral romano (I-X)'
      }
    }
    
    // Validar Lucro Presumido
    const lucroPresumidoFields = ['pis', 'cofins', 'presuncaoIR', 'presuncaoCSLL']
    lucroPresumidoFields.forEach(field => {
      const value = novoSegmento.lucroPresumido[field as keyof typeof novoSegmento.lucroPresumido]
      if (!value.trim()) {
        errors[`lucroPresumido.${field}`] = 'Campo obrigatório'
      }
    })
    
    // Validar Lucro Real
    const lucroRealFields = ['pis', 'cofins', 'ir', 'irAdicional', 'irValorDeduzir', 'csll']
    lucroRealFields.forEach(field => {
      const value = novoSegmento.lucroReal[field as keyof typeof novoSegmento.lucroReal]
      if (!value.trim()) {
        errors[`lucroReal.${field}`] = 'Campo obrigatório'
      }
    })
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Função para converter números para romanos
  const convertToRoman = (num: number): string => {
    const romanNumerals = [
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ]
    
    let result = ''
    for (const { value, numeral } of romanNumerals) {
      while (num >= value) {
        result += numeral
        num -= value
      }
    }
    return result
  }

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Capitalizar primeira letra automaticamente
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1)
    setNovoSegmento(prev => ({
      ...prev,
      nome: capitalizedValue
    }))
  }

  const handleSimplesNacionalChange = (field: 'padrao' | 'alternativa', value: string) => {
    // Permitir apenas números para esses campos
    const numericValue = value.replace(/[^0-9]/g, '')
    
    // Limitar a 2 dígitos (máximo 10)
    const limitedValue = numericValue.slice(0, 2)
    
    setNovoSegmento(prev => ({
      ...prev,
      simplesNacional: {
        ...prev.simplesNacional,
        [field]: limitedValue
      }
    }))
  }

  const handleSimplesNacionalBlur = (field: 'padrao' | 'alternativa') => {
    const currentValue = novoSegmento.simplesNacional[field]
    if (currentValue) {
      const numValue = parseInt(currentValue)
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
        const romanValue = convertToRoman(numValue)
        setNovoSegmento(prev => ({
          ...prev,
          simplesNacional: {
            ...prev.simplesNacional,
            [field]: romanValue
          }
        }))
      }
    }
  }

  const handlePercentualChange = (categoria: 'lucroPresumido' | 'lucroReal', field: string, value: string) => {
    // Permitir números, vírgula e ponto
    let cleanValue = value.replace(/[^0-9.,]/g, '')
    
    setNovoSegmento(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [field]: cleanValue
      }
    }))
  }

  const handlePercentualBlur = (categoria: 'lucroPresumido' | 'lucroReal', field: string) => {
    const currentValue = novoSegmento[categoria][field as keyof typeof novoSegmento[typeof categoria]]
    if (currentValue && !currentValue.includes('%')) {
      setNovoSegmento(prev => ({
        ...prev,
        [categoria]: {
          ...prev[categoria],
          [field]: currentValue + '%'
        }
      }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    // Permitir apenas números para campos específicos
    if (field === 'padrao' || field === 'alternativa') {
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault()
      }
      
      // Se pressionar Enter, converter para romano
      if (e.key === 'Enter') {
        handleSimplesNacionalBlur(field as 'padrao' | 'alternativa')
      }
    }
  }

  const handleBlur = (field: string) => {
    // Validação adicional no blur se necessário
  }

  const handleAddSegmento = async () => {
    const isValid = validateForm()
    if (!isValid) return
    
    try {
      const dadosParaEnviar = {
        nome: novoSegmento.nome,
        simplesNacional: {
          padrao: novoSegmento.simplesNacional.padrao,
          alternativa: novoSegmento.simplesNacional.alternativa || undefined
        },
        lucroPresumido: {
          pis: novoSegmento.lucroPresumido.pis,
          cofins: novoSegmento.lucroPresumido.cofins,
          presuncaoIR: novoSegmento.lucroPresumido.presuncaoIR,
          presuncaoCSLL: novoSegmento.lucroPresumido.presuncaoCSLL
        },
        lucroReal: {
          pis: novoSegmento.lucroReal.pis,
          cofins: novoSegmento.lucroReal.cofins,
          ir: novoSegmento.lucroReal.ir,
          irAdicional: novoSegmento.lucroReal.irAdicional,
          irValorDeduzir: novoSegmento.lucroReal.irValorDeduzir,
          csll: novoSegmento.lucroReal.csll
        }
      }
      
      // Adicionar segmento usando o contexto
      await adicionarSegmento(dadosParaEnviar)
      
      // Fechar modal e chamar callback de sucesso
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Erro ao adicionar segmento:', error)
      alert('Erro ao adicionar segmento. Tente novamente.')
    }
  }

  const handleClose = () => {
    setFieldErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[12px] w-[600px] max-w-[90vw] max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
        {/* Header Fixo */}
        <div className="px-[24px] py-[20px] border-b border-gray-200">
          <h3 className="text-[18px] font-semibold text-[#1F2937] font-inter">Adicionar Novo Segmento</h3>
        </div>
        
        {/* Corpo Rolável */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[20px]">
          <div className="space-y-[24px]">
            {/* Nome do Segmento */}
            <div>
              <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                Nome do Segmento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                data-field="nome"
                value={novoSegmento.nome}
                onChange={handleNomeChange}
                className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                  fieldErrors.nome 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-[#D1D5DB] focus:ring-blue-500'
                }`}
                placeholder="Digite o nome do segmento"
              />
              {fieldErrors.nome && (
                <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors.nome}</p>
              )}
            </div>
          
            {/* Simples Nacional */}
            <div>
              <h4 className="text-[16px] font-medium text-[#1F2937] mb-[12px] font-inter">Simples Nacional</h4>
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Padrão <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="simplesNacional.padrao"
                    value={novoSegmento.simplesNacional.padrao}
                    onChange={(e) => handleSimplesNacionalChange('padrao', e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'padrao')}
                    onBlur={() => handleSimplesNacionalBlur('padrao')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['simplesNacional.padrao'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Digite um número (1-10)"
                  />
                  {fieldErrors['simplesNacional.padrao'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['simplesNacional.padrao']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">Alternativa</label>
                  <input
                    type="text"
                    data-field="simplesNacional.alternativa"
                    value={novoSegmento.simplesNacional.alternativa}
                    onChange={(e) => handleSimplesNacionalChange('alternativa', e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'alternativa')}
                    onBlur={() => handleSimplesNacionalBlur('alternativa')}
                    className="w-full px-[12px] py-[8px] border border-[#D1D5DB] rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Digite um número (1-10) - Opcional"
                  />
                </div>
              </div>
            </div>
          
            {/* Lucro Presumido */}
            <div>
              <h4 className="text-[16px] font-medium text-[#1F2937] mb-[12px] font-inter">Lucro Presumido</h4>
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    PIS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroPresumido.pis"
                    value={novoSegmento.lucroPresumido.pis}
                    onChange={(e) => handlePercentualChange('lucroPresumido', 'pis', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroPresumido', 'pis')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroPresumido.pis'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 1,65%"
                  />
                  {fieldErrors['lucroPresumido.pis'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroPresumido.pis']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    COFINS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroPresumido.cofins"
                    value={novoSegmento.lucroPresumido.cofins}
                    onChange={(e) => handlePercentualChange('lucroPresumido', 'cofins', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroPresumido', 'cofins')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroPresumido.cofins'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 7,60%"
                  />
                  {fieldErrors['lucroPresumido.cofins'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroPresumido.cofins']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Presunção IR <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroPresumido.presuncaoIR"
                    value={novoSegmento.lucroPresumido.presuncaoIR}
                    onChange={(e) => handlePercentualChange('lucroPresumido', 'presuncaoIR', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroPresumido', 'presuncaoIR')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroPresumido.presuncaoIR'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 32%"
                  />
                  {fieldErrors['lucroPresumido.presuncaoIR'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroPresumido.presuncaoIR']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Presunção CSLL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroPresumido.presuncaoCSLL"
                    value={novoSegmento.lucroPresumido.presuncaoCSLL}
                    onChange={(e) => handlePercentualChange('lucroPresumido', 'presuncaoCSLL', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroPresumido', 'presuncaoCSLL')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroPresumido.presuncaoCSLL'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 32%"
                  />
                  {fieldErrors['lucroPresumido.presuncaoCSLL'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroPresumido.presuncaoCSLL']}</p>
                  )}
                </div>
              </div>
            </div>
          
            {/* Lucro Real */}
            <div>
              <h4 className="text-[16px] font-medium text-[#1F2937] mb-[12px] font-inter">Lucro Real</h4>
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    PIS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.pis"
                    value={novoSegmento.lucroReal.pis}
                    onChange={(e) => handlePercentualChange('lucroReal', 'pis', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'pis')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.pis'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 1,65%"
                  />
                  {fieldErrors['lucroReal.pis'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.pis']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    COFINS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.cofins"
                    value={novoSegmento.lucroReal.cofins}
                    onChange={(e) => handlePercentualChange('lucroReal', 'cofins', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'cofins')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.cofins'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 7,60%"
                  />
                  {fieldErrors['lucroReal.cofins'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.cofins']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    IR <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.ir"
                    value={novoSegmento.lucroReal.ir}
                    onChange={(e) => handlePercentualChange('lucroReal', 'ir', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'ir')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.ir'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 15,00%"
                  />
                  {fieldErrors['lucroReal.ir'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.ir']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    IR Adicional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.irAdicional"
                    value={novoSegmento.lucroReal.irAdicional}
                    onChange={(e) => handlePercentualChange('lucroReal', 'irAdicional', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'irAdicional')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.irAdicional'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 10,00%"
                  />
                  {fieldErrors['lucroReal.irAdicional'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.irAdicional']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    Valor Deduzir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.irValorDeduzir"
                    value={novoSegmento.lucroReal.irValorDeduzir}
                    onChange={(e) => handlePercentualChange('lucroReal', 'irValorDeduzir', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'irValorDeduzir')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.irValorDeduzir'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: R$ 1.200,00"
                  />
                  {fieldErrors['lucroReal.irValorDeduzir'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.irValorDeduzir']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-[8px] font-inter">
                    CSLL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    data-field="lucroReal.csll"
                    value={novoSegmento.lucroReal.csll}
                    onChange={(e) => handlePercentualChange('lucroReal', 'csll', e.target.value)}
                    onBlur={() => handlePercentualBlur('lucroReal', 'csll')}
                    className={`w-full px-[12px] py-[8px] border rounded-[6px] text-[14px] font-inter focus:outline-none focus:ring-1 ${
                      fieldErrors['lucroReal.csll'] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#D1D5DB] focus:ring-blue-500'
                    }`}
                    placeholder="Ex: 9,00%"
                  />
                  {fieldErrors['lucroReal.csll'] && (
                    <p className="text-red-500 text-[12px] mt-[4px] font-inter">{fieldErrors['lucroReal.csll']}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Fixo */}
        <div className="px-[24px] py-[20px] border-t border-gray-200 bg-gray-50 rounded-b-[12px]">
          <div className="flex justify-end gap-[12px]">
            <button
              onClick={handleClose}
              className="px-[16px] py-[8px] text-[#6B7280] text-[14px] font-medium rounded-[6px] hover:bg-[#F3F4F6] transition-colors font-inter"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddSegmento}
              className="px-[16px] py-[8px] text-[14px] font-medium rounded-[6px] transition-colors font-inter bg-[#1777CF] text-white hover:bg-[#1565C0]"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAdicionarSegmento