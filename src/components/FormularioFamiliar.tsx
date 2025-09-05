import React, { useState, useEffect, useCallback } from 'react';
import { PessoaFamiliar, ErrosValidacao } from '../types/familia';
import DropdownCustomizado from './DropdownCustomizado';

// Componente Input reutilizável
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { className?: string }>(({ className, type, ...props }, ref) => (
  <input 
    type={type} 
    className={`flex h-9 w-full rounded-md border-[0.5px] border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#1777CF] focus:border-[1px] disabled:cursor-not-allowed disabled:opacity-50 box-border ${className || ''}`} 
    ref={ref} 
    {...props} 
  />
));

interface FormularioFamiliarProps {
  pessoa: PessoaFamiliar;
  onChange: (pessoa: PessoaFamiliar) => void;
  titulo?: string;
  className?: string;
  mostrarTitulo?: boolean;
  mostrarRegimeBens?: boolean;
}

export const FormularioFamiliar: React.FC<FormularioFamiliarProps> = ({
  pessoa,
  onChange,
  titulo = 'Dados Pessoais',
  className = '',
  mostrarTitulo = true,
  mostrarRegimeBens = true
}) => {
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [foiTocado, setFoiTocado] = useState<Record<string, boolean>>({});

  // Funções de validação
  const validarEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? undefined : 'Email inválido';
  };

  const validarCPF = (cpf: string): string | undefined => {
    if (!cpf) return undefined;
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return 'CPF inválido';
    }
    
    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(9)) !== digitoVerificador1) {
      return 'CPF inválido';
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(10)) !== digitoVerificador2) {
      return 'CPF inválido';
    }
    
    return undefined;
  };

  const validarCelular = (celular: string): string | undefined => {
    if (!celular) return undefined;
    const celularLimpo = celular.replace(/\D/g, '');
    
    if (celularLimpo.length < 10 || celularLimpo.length > 11) {
      return 'Celular deve ter 10 ou 11 dígitos';
    }
    
    return undefined;
  };

  const validarNome = (nome: string): string | undefined => {
    if (!nome) return undefined;
    if (nome.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }
    return undefined;
  };

  // Validar todos os campos
  const validarCampos = useCallback(() => {
    const novosErros: ErrosValidacao = {
      nome: validarNome(pessoa.nome),
      email: validarEmail(pessoa.email),
      cpf: validarCPF(pessoa.cpf),
      celular: validarCelular(pessoa.celular)
    };
    
    // Remover erros undefined
    Object.keys(novosErros).forEach(key => {
      if (!novosErros[key as keyof ErrosValidacao]) {
        delete novosErros[key as keyof ErrosValidacao];
      }
    });
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [pessoa.nome, pessoa.email, pessoa.cpf, pessoa.celular]);

  // Validar quando os dados mudarem
  useEffect(() => {
    validarCampos();
  }, [validarCampos]);

  // Formatadores
  const formatarCPF = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatarCelular = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 10) {
      return apenasNumeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return apenasNumeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  // Função para capitalizar primeira letra
  const capitalizarPrimeiraLetra = (texto: string): string => {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  // Handlers de mudança
  const handleChange = (campo: keyof PessoaFamiliar, valor: string) => {
    setFoiTocado(prev => ({ ...prev, [campo]: true }));
    
    let valorFormatado = valor;
    
    // Aplicar formatação específica
    if (campo === 'cpf') {
      valorFormatado = formatarCPF(valor);
    } else if (campo === 'celular') {
      valorFormatado = formatarCelular(valor);
    } else if (campo === 'nome') {
      valorFormatado = capitalizarPrimeiraLetra(valor);
    }
    
    onChange({
      ...pessoa,
      [campo]: valorFormatado
    });
  };

  const handleBlur = (campo: keyof PessoaFamiliar) => {
    setFoiTocado(prev => ({ ...prev, [campo]: true }));
  };



  return (
    <div className={`space-y-4 ${className}`}>
      {mostrarTitulo && (
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
          {titulo}
        </h4>
      )}
      
      {/* Campo Nome */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Nome</label>
        <Input
          type="text"
          value={pessoa.nome || ''}
          onChange={(e) => handleChange('nome', e.target.value)}
          onBlur={() => handleBlur('nome')}
          placeholder="Digite o nome"
          className={erros.nome && foiTocado.nome ? 'border-red-500 focus:ring-red-500' : ''}
        />
        {erros.nome && foiTocado.nome && (
          <p className="text-xs text-red-500">{erros.nome}</p>
        )}
      </div>

      {/* Campo Email */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Email</label>
        <Input
          type="email"
          value={pessoa.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="Digite o email"
          className={erros.email && foiTocado.email ? 'border-red-500 focus:ring-red-500' : ''}
        />
        {erros.email && foiTocado.email && (
          <p className="text-xs text-red-500">{erros.email}</p>
        )}
      </div>

      {/* Campo CPF */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">CPF</label>
        <Input
          type="text"
          value={pessoa.cpf || ''}
          onChange={(e) => handleChange('cpf', e.target.value)}
          onBlur={() => handleBlur('cpf')}
          placeholder="000.000.000-00"
          maxLength={14}
          className={erros.cpf && foiTocado.cpf ? 'border-red-500 focus:ring-red-500' : ''}
        />
        {erros.cpf && foiTocado.cpf && (
          <p className="text-xs text-red-500">{erros.cpf}</p>
        )}
      </div>

      {/* Campo Celular */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Celular</label>
        <Input
          type="text"
          value={pessoa.celular || ''}
          onChange={(e) => handleChange('celular', e.target.value)}
          onBlur={() => handleBlur('celular')}
          placeholder="(00) 00000-0000"
          maxLength={15}
          className={erros.celular && foiTocado.celular ? 'border-red-500 focus:ring-red-500' : ''}
        />
        {erros.celular && foiTocado.celular && (
          <p className="text-xs text-red-500">{erros.celular}</p>
        )}
      </div>

      {/* Campo Regime de Bens - Condicional */}
      {mostrarRegimeBens && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Regime de bens</label>
          <DropdownCustomizado
            value={pessoa.regimeBens || ''}
            onChange={(valor) => {
              onChange({ ...pessoa, regimeBens: valor });
            }}
            options={[
              { value: '----------', label: '----------' },
              { value: 'Separação de bens', label: 'Separação de bens' },
              { value: 'Separação obrigatória de bens', label: 'Separação obrigatória de bens' },
              { value: 'Comunhão parcial de bens', label: 'Comunhão parcial de bens' },
              { value: 'Comunhão universal de bens', label: 'Comunhão universal de bens' },
              { value: 'Participação final nos aquestos', label: 'Participação final nos aquestos' },
              { value: 'União estável', label: 'União estável' }
            ]}
            placeholder="Selecione um regime de bens"
          />
        </div>
      )}
    </div>
  );
};

export default FormularioFamiliar;