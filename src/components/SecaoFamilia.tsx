import React, { useState, useEffect, useReducer } from 'react';
import { 
  DadosFamiliares, 
  Filho, 
  Neto, 
  Conjuge, 
  PessoaFamiliar,
  AcaoFormulario,
  criarFilhoVazio,
  criarPessoaVazia,
  criarDadosFamiliaresVazios
} from '../types/familia';
import CarrosselFamilia from './CarrosselFamilia';
import FormularioFamiliar from './FormularioFamiliar';
import { verificarDadosAntigos } from '../utils/limparDadosAntigos';

// Reducer para gerenciar estado da família
// Funções auxiliares para criar tipos específicos
const criarConjugeVazio = (): Conjuge => ({
  ...criarPessoaVazia(),
  profissao: '',
  rendaMensal: 0
});

const criarNetoVazio = (): Neto => ({
  ...criarPessoaVazia(),
  profissao: '',
  rendaMensal: 0
});

const familiaReducer = (state: DadosFamiliares, action: AcaoFormulario): DadosFamiliares => {
  switch (action.tipo) {
    case 'ADICIONAR_FILHO':
      return {
        ...state,
        filhos: [...state.filhos, criarFilhoVazio()]
      };
    
    case 'REMOVER_FILHO':
      return {
        ...state,
        filhos: state.filhos.filter((_, index) => index !== action.indice)
      };
    
    case 'ATUALIZAR_FILHO':
      return {
        ...state,
        filhos: state.filhos.map((filho, index) => 
          index === action.indice ? { ...filho, ...action.dados } : filho
        )
      };
    
    case 'ADICIONAR_NETO':
      return {
        ...state,
        filhos: state.filhos.map((filho, index) => 
          index === action.indiceFilho 
            ? { ...filho, filhos: [...filho.filhos, criarNetoVazio()] }
            : filho
        )
      };
    
    case 'REMOVER_NETO':
      return {
        ...state,
        filhos: state.filhos.map((filho, index) => 
          index === action.indiceFilho 
            ? { ...filho, filhos: filho.filhos.filter((_, netoIndex) => netoIndex !== action.indiceNeto) }
            : filho
        )
      };
    
    case 'ATUALIZAR_NETO':
      return {
        ...state,
        filhos: state.filhos.map((filho, index) => 
          index === action.indiceFilho 
            ? {
                ...filho,
                filhos: filho.filhos.map((neto, netoIndex) => 
                  netoIndex === action.indiceNeto ? { ...neto, ...action.dados } : neto
                )
              }
            : filho
        )
      };
    
    case 'ADICIONAR_EX_CONJUGE':
      return {
        ...state,
        exConjuges: [...state.exConjuges, criarConjugeVazio()]
      };
    
    case 'REMOVER_EX_CONJUGE':
      return {
        ...state,
        exConjuges: state.exConjuges.filter((_, index: number) => index !== action.indice)
      };
    
    case 'ATUALIZAR_EX_CONJUGE':
      return {
        ...state,
        exConjuges: state.exConjuges.map((conjuge: Conjuge, index: number) => 
          index === action.indice ? { ...conjuge, ...action.dados } : conjuge
        )
      };
    
    case 'ADICIONAR_EX_CONJUGE_FILHO':
      return {
        ...state,
        filhos: state.filhos.map((filho: Filho, index: number) => 
          index === action.indiceFilho 
            ? { ...filho, exConjuges: [...filho.exConjuges, criarConjugeVazio()] }
            : filho
        )
      };
    
    case 'REMOVER_EX_CONJUGE_FILHO':
      return {
        ...state,
        filhos: state.filhos.map((filho: Filho, index: number) => 
          index === action.indiceFilho 
            ? { ...filho, exConjuges: filho.exConjuges.filter((_, conjugeIndex: number) => conjugeIndex !== action.indice) }
            : filho
        )
      };
    
    case 'ATUALIZAR_EX_CONJUGE_FILHO':
      return {
        ...state,
        filhos: state.filhos.map((filho: Filho, index: number) => 
          index === action.indiceFilho 
            ? {
                ...filho,
                exConjuges: filho.exConjuges.map((conjuge: Conjuge, conjugeIndex: number) => 
                  conjugeIndex === action.indice ? { ...conjuge, ...action.dados } : conjuge
                )
              }
            : filho
        )
      };
    
    case 'RESETAR_FILHOS':
      return {
        ...state,
        filhos: []
      };
    
    default:
      return state;
  }
};

interface SecaoFamiliaProps {
  dadosIniciais?: DadosFamiliares;
  onChange?: (dados: DadosFamiliares) => void;
  className?: string;
}

export const SecaoFamilia: React.FC<SecaoFamiliaProps> = ({
  dadosIniciais = criarDadosFamiliaresVazios(),
  onChange,
  className = ''
}) => {
  // Versão do componente para forçar re-renderização
  const VERSAO_COMPONENTE = '2.0.0';
  
  // Migração automática e limpeza de dados antigos (sem interferir no modal)
  useEffect(() => {
    console.log('🔍 [SecaoFamilia] Verificando necessidade de limpeza...');
    
    const versaoSalva = localStorage.getItem('secaoFamiliaVersao');
    const temDadosAntigos = verificarDadosAntigos();
    
    // Verificar se é a primeira execução ou se há dados antigos
    const primeiraExecucao = !versaoSalva;
    const versaoIncompativel = versaoSalva && versaoSalva !== VERSAO_COMPONENTE;
    
    console.log('🔍 [SecaoFamilia] Status da verificação:');
    console.log(`   - Versão salva: ${versaoSalva || 'nenhuma'}`);
    console.log(`   - Versão atual: ${VERSAO_COMPONENTE}`);
    console.log(`   - Primeira execução: ${primeiraExecucao}`);
    console.log(`   - Versão incompatível: ${versaoIncompativel}`);
    console.log(`   - Tem dados antigos: ${temDadosAntigos}`);
    
    if (primeiraExecucao || versaoIncompativel || temDadosAntigos) {
      console.log('🔧 Detectada versão antiga ou dados incompatíveis.');
      console.log('🧹 Executando limpeza silenciosa...');
      
      // Importar e executar limpeza completa sem recarregar a página
      import('../utils/limparDadosAntigos').then(({ limpezaCompleta }) => {
        limpezaCompleta();
        console.log('✅ Limpeza concluída silenciosamente. Sistema atualizado para versão 2.0.0');
        // Removido o window.location.reload() para não fechar o modal
      });
    } else {
      console.log('✅ Sistema já está na versão correta (2.0.0)');
    }
  }, []);
  
  const [dadosFamilia, dispatch] = useReducer(familiaReducer, dadosIniciais);
  const [conjugeSelecionado, setConjugeSelecionado] = useState(0);
  const [filhoSelecionado, setFilhoSelecionado] = useState(0);
  const [conjugeFilhoSelecionado, setConjugeFilhoSelecionado] = useState(0);
  const [netoSelecionado, setNetoSelecionado] = useState(0);
  const [resetandoColunas, setResetandoColunas] = useState(false);

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onChange?.(dadosFamilia);
  }, [dadosFamilia, onChange]);

  // Ajustar índices quando filhos mudarem
  useEffect(() => {
    if (dadosFamilia.filhos.length === 0) {
      setFilhoSelecionado(0);
      setNetoSelecionado(0);
    } else if (filhoSelecionado >= dadosFamilia.filhos.length) {
      setFilhoSelecionado(Math.max(0, dadosFamilia.filhos.length - 1));
    }
  }, [dadosFamilia.filhos.length, filhoSelecionado]);

  // Ajustar índice de netos quando mudarem
  useEffect(() => {
    const filhoAtual = dadosFamilia.filhos[filhoSelecionado];
    if (!filhoAtual || filhoAtual.filhos.length === 0) {
      setNetoSelecionado(0);
    } else if (netoSelecionado >= filhoAtual.filhos.length) {
      setNetoSelecionado(Math.max(0, filhoAtual.filhos.length - 1));
    }
  }, [dadosFamilia.filhos, filhoSelecionado, netoSelecionado]);

  // Ajustar índices quando cônjuges mudarem
  useEffect(() => {
    if (dadosFamilia.exConjuges.length === 0) {
      setConjugeSelecionado(0);
    } else if (conjugeSelecionado >= dadosFamilia.exConjuges.length) {
      setConjugeSelecionado(Math.max(0, dadosFamilia.exConjuges.length - 1));
    }
  }, [dadosFamilia.exConjuges.length, conjugeSelecionado]);

  // Ajustar índices quando cônjuges do filho mudarem
  useEffect(() => {
    const filhoAtual = dadosFamilia.filhos[filhoSelecionado];
    if (!filhoAtual || filhoAtual.exConjuges.length === 0) {
      setConjugeFilhoSelecionado(0);
    } else if (conjugeFilhoSelecionado >= filhoAtual.exConjuges.length) {
      setConjugeFilhoSelecionado(Math.max(0, filhoAtual.exConjuges.length - 1));
    }
  }, [dadosFamilia.filhos, filhoSelecionado, conjugeFilhoSelecionado]);

  // Handlers para cônjuges
  const handleAdicionarConjuge = () => {
    dispatch({ tipo: 'ADICIONAR_EX_CONJUGE' });
    setConjugeSelecionado(dadosFamilia.exConjuges.length); // Selecionar o novo cônjuge
    
    // Reset das colunas dependentes quando um novo cônjuge é adicionado
    // (apenas se já existir pelo menos um cônjuge)
    if (dadosFamilia.exConjuges.length > 0) {
      // Ativar estado de reset para desabilitar botões temporariamente
      setResetandoColunas(true);
      
      // Resetar índices das colunas dependentes
      setFilhoSelecionado(0);
      setConjugeFilhoSelecionado(0);
      setNetoSelecionado(0);
      
      // Limpar todos os filhos existentes (reset para estado inicial)
      dispatch({ tipo: 'RESETAR_FILHOS' });
      
      // Reativar botões após um breve delay para permitir a transição
      setTimeout(() => {
        setResetandoColunas(false);
      }, 100);
    }
  };

  const handleRemoverConjuge = (indice: number) => {
    dispatch({ tipo: 'REMOVER_EX_CONJUGE', indice });
  };

  const handleConjugeChange = (conjuge: Conjuge) => {
    dispatch({ tipo: 'ATUALIZAR_EX_CONJUGE', indice: conjugeSelecionado, dados: conjuge });
  };

  // Função adaptadora para FormularioFamiliar
  const handleConjugeFormChange = (pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: '',
      rendaMensal: 0
    };
    handleConjugeChange(conjuge);
  };

  // Handlers para filhos
  const handleAdicionarFilho = () => {
    dispatch({ tipo: 'ADICIONAR_FILHO' });
    setFilhoSelecionado(dadosFamilia.filhos.length); // Selecionar o novo filho
  };

  const handleRemoverFilho = (indice: number) => {
    dispatch({ tipo: 'REMOVER_FILHO', indice });
  };

  const handleFilhoChange = (pessoa: PessoaFamiliar) => {
    dispatch({ tipo: 'ATUALIZAR_FILHO', indice: filhoSelecionado, dados: pessoa as Filho });
  };

  // Handlers para cônjuges do filho
  const handleAdicionarConjugeFilho = () => {
    dispatch({ tipo: 'ADICIONAR_CONJUGE_FILHO', indiceFilho: filhoSelecionado });
    const filhoAtual = dadosFamilia.filhos[filhoSelecionado];
    if (filhoAtual) {
      setConjugeFilhoSelecionado(filhoAtual.exConjuges.length); // Selecionar o novo cônjuge
    }
  };

  const handleRemoverConjugeFilho = (indice: number) => {
    dispatch({ tipo: 'REMOVER_EX_CONJUGE_FILHO', indiceFilho: filhoSelecionado, indice });
  };

  const handleConjugeFilhoChange = (conjuge: Conjuge) => {
    dispatch({ tipo: 'ATUALIZAR_EX_CONJUGE_FILHO', indiceFilho: filhoSelecionado, indice: conjugeFilhoSelecionado, dados: conjuge });
  };

  // Função adaptadora para FormularioFamiliar
  const handleConjugeFilhoFormChange = (pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: '',
      rendaMensal: 0
    };
    handleConjugeFilhoChange(conjuge);
  };

  // Handlers para netos
  const handleAdicionarNeto = () => {
    dispatch({ tipo: 'ADICIONAR_NETO', indiceFilho: filhoSelecionado });
    const filhoAtual = dadosFamilia.filhos[filhoSelecionado];
    if (filhoAtual) {
      setNetoSelecionado(filhoAtual.filhos.length); // Selecionar o novo neto
    }
  };

  const handleRemoverNeto = (indiceNeto: number) => {
    dispatch({ tipo: 'REMOVER_NETO', indiceFilho: filhoSelecionado, indiceNeto });
  };

  const handleNetoChange = (neto: Neto) => {
    dispatch({ tipo: 'ATUALIZAR_NETO', indiceFilho: filhoSelecionado, indiceNeto: netoSelecionado, dados: neto });
  };

  // Função adaptadora para FormularioFamiliar
  const handleNetoFormChange = (pessoa: PessoaFamiliar) => {
    const neto: Neto = {
      ...pessoa,
      profissao: '',
      rendaMensal: 0
    };
    handleNetoChange(neto);
  };

  // Função para validar se todos os campos obrigatórios do cônjuge estão preenchidos e válidos
  const validarConjugeCompleto = (conjuge: Conjuge): boolean => {
    if (!conjuge) return false;
    
    // Verificar se todos os campos estão preenchidos
    if (!(conjuge.nome?.trim() && 
          conjuge.email?.trim() && 
          conjuge.cpf?.trim() && 
          conjuge.celular?.trim())) {
      return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(conjuge.email)) {
      return false;
    }
    
    // Validar CPF
    const cpfLimpo = conjuge.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }
    
    // Validação dos dígitos verificadores do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(9)) !== digitoVerificador1) {
      return false;
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(10)) !== digitoVerificador2) {
      return false;
    }
    
    // Validar celular
    const celularLimpo = conjuge.celular.replace(/\D/g, '');
    if (celularLimpo.length < 10 || celularLimpo.length > 11) {
      return false;
    }
    
    // Validar nome
    if (conjuge.nome.trim().length < 2) {
      return false;
    }
    
    return true;
  };

  // Função para validar se todos os campos obrigatórios do filho estão preenchidos e válidos
  const validarFilhoCompleto = (filho: Filho): boolean => {
    if (!filho) return false;
    
    // Verificar se todos os campos estão preenchidos
    if (!(filho.nome?.trim() && 
          filho.email?.trim() && 
          filho.cpf?.trim() && 
          filho.celular?.trim())) {
      return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(filho.email)) {
      return false;
    }
    
    // Validar CPF
    const cpfLimpo = filho.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }
    
    // Validação dos dígitos verificadores do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(9)) !== digitoVerificador1) {
      return false;
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpfLimpo.charAt(10)) !== digitoVerificador2) {
      return false;
    }
    
    // Validar celular
    const celularLimpo = filho.celular.replace(/\D/g, '');
    if (celularLimpo.length < 10 || celularLimpo.length > 11) {
      return false;
    }
    
    // Validar nome
    if (filho.nome.trim().length < 2) {
      return false;
    }
    
    return true;
  };

  // Verificar se existe pelo menos um cônjuge com todos os campos preenchidos
  const temConjugeValido = dadosFamilia.exConjuges.some(conjuge => validarConjugeCompleto(conjuge));

  // Obter dados atuais
  const filhoAtual = dadosFamilia.filhos[filhoSelecionado];
  const conjugesFilhoAtual = filhoAtual?.exConjuges || [];
  const netosFilhoAtual = filhoAtual?.filhos || [];
  
  // Verificar se o filho atual está válido para ativar botão de cônjuge
  const filhoAtualValido = filhoAtual ? validarFilhoCompleto(filhoAtual) : false;
  
  // Verificar se existe pelo menos um cônjuge do filho válido para ativar botão de netos
  const temConjugeFilhoValido = conjugesFilhoAtual.some(conjuge => validarConjugeCompleto(conjuge));

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Layout de 4 colunas fixas */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        
        {/* Coluna 1: Cônjuges */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          <CarrosselFamilia
            itens={dadosFamilia.exConjuges}
            indiceAtivo={conjugeSelecionado}
            onMudarIndice={setConjugeSelecionado}
            onAdicionarItem={handleAdicionarConjuge}
            onRemoverItem={handleRemoverConjuge}
            tituloSingular="Cônjuge"
            tituloPlural="Cônjuges"
            renderizarItem={(conjuge: Conjuge) => (
              <div className="h-full overflow-y-auto">
                <FormularioFamiliar
                  pessoa={conjuge}
                  onChange={handleConjugeFormChange}
                  mostrarTitulo={false}
                />
              </div>
            )}
          />
        </div>

        {/* Coluna 2: Filhos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          <CarrosselFamilia
            itens={dadosFamilia.filhos}
            indiceAtivo={filhoSelecionado}
            onMudarIndice={setFilhoSelecionado}
            onAdicionarItem={handleAdicionarFilho}
            onRemoverItem={handleRemoverFilho}
            tituloSingular="Filho"
            tituloPlural="Filhos"
            desabilitarAdicionar={!temConjugeValido || resetandoColunas}
            renderizarItem={(filho: Filho) => (
              <div className="h-full overflow-y-auto">
                <FormularioFamiliar
                  pessoa={filho}
                  onChange={handleFilhoChange}
                  mostrarTitulo={false}
                />
              </div>
            )}
          />
        </div>

        {/* Coluna 3: Cônjuge do Filho */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          <CarrosselFamilia
            itens={filhoAtual ? conjugesFilhoAtual : []}
            indiceAtivo={conjugeFilhoSelecionado}
            onMudarIndice={setConjugeFilhoSelecionado}
            onAdicionarItem={handleAdicionarConjugeFilho}
            onRemoverItem={handleRemoverConjugeFilho}
            tituloSingular="Cônjuge do Filho"
            tituloPlural="Cônjuges do Filho"
            desabilitarAdicionar={!filhoAtualValido || resetandoColunas}
            renderizarItem={(conjuge: Conjuge) => (
              <div className="h-full overflow-y-auto">
                <FormularioFamiliar
                  pessoa={conjuge}
                  onChange={handleConjugeFilhoFormChange}
                  mostrarTitulo={false}
                />
              </div>
            )}
            renderizarPlaceholder={() => (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <div className="text-2xl mb-2">👤</div>
                <p className="text-sm text-center">Selecione um filho</p>
                <p className="text-xs text-center mt-1">para ver seus cônjuges</p>
              </div>
            )}
          />
        </div>

        {/* Coluna 4: Netos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          <CarrosselFamilia
            itens={filhoAtual ? netosFilhoAtual : []}
            indiceAtivo={netoSelecionado}
            onMudarIndice={setNetoSelecionado}
            onAdicionarItem={handleAdicionarNeto}
            onRemoverItem={handleRemoverNeto}
            tituloSingular="Neto"
            tituloPlural="Filhos do Filho"
            desabilitarAdicionar={!temConjugeFilhoValido || resetandoColunas}
            renderizarItem={(neto: Neto) => (
              <div className="h-full overflow-y-auto">
                <FormularioFamiliar
                  pessoa={neto}
                  onChange={handleNetoFormChange}
                  mostrarTitulo={false}
                />
              </div>
            )}
            renderizarPlaceholder={() => (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <div className="text-2xl mb-2">👶</div>
                <p className="text-sm text-center">
                  {!filhoAtual ? 'Selecione um filho' : 'Nenhum neto'}
                </p>
                <p className="text-xs text-center mt-1">
                  {!filhoAtual ? 'para ver seus filhos (netos)' : 'Clique em + para adicionar'}
                </p>
              </div>
            )}
          />
        </div>
      </div>


    </div>
  );
};

export default SecaoFamilia;