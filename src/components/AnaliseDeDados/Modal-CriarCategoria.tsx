import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Ícone customizado de pasta com fill e stroke personalizáveis
export const PastaCustomIcon = ({ fillColor = "#3B82F6", strokeColor = "#64748B", transparent = false, solid = false, className = "w-6 h-6" }) => {
  // Se for sólido, usar um SVG diferente com preenchimento completo
  if (solid) {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        className={className}
        fill={fillColor}
      >
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
      </svg>
    );
  }
  
  // SVG original com apenas borda
  return (

  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className}
    fillRule="evenodd"
  >
    <path 
      d="M13.135 5.75c-.409 0-.792-.2-1.026-.535l-.897-1.287A2.75 2.75 0 0 0 8.956 2.75H4A2.75 2.75 0 0 0 1.25 5.5v13c0 .729.29 1.429.805 1.945A2.755 2.755 0 0 0 4 21.25h16c.729 0 1.429-.29 1.945-.805a2.755 2.755 0 0 0 .805-1.945v-10c0-.729-.29-1.429-.805-1.945A2.755 2.755 0 0 0 20 5.75zm0 1.5H20a1.252 1.252 0 0 1 1.25 1.25v10A1.252 1.252 0 0 1 20 19.75H4a1.252 1.252 0 0 1-1.25-1.25v-13c0-.69.56-1.25 1.25-1.25h4.956c.409 0 .792.2 1.026.535l.897 1.287a2.749 2.749 0 0 0 2.256 1.178z" 
     fill="transparent" 
     stroke={strokeColor}
      strokeWidth="1.5"
      opacity="1"

    />
  </svg>
  );
};


// Função simples para detectar cores claras
const isLightColor = (color: string): boolean => {
  const hex = color.replace('#', '').toLowerCase();
  // Lista de cores claras comuns
  const lightColors = ['ffffff', 'f8f8f8', 'f0f0f0', 'fafafa', 'fcfcfc'];
  return lightColors.includes(hex) || hex === 'ffffff';
};

export interface NovaCategoria {
  titulo: string;
  estilo: 'simples' | 'numerado' | 'pasta';
  numeroManual?: string;
  numeracaoAutomatica?: boolean;

  numeracao?: {
    corFundo: string;
    corTexto: string;
  };
  pasta?: {
    tipo: 'transparente' | 'colorida';
    cor?: string;
    corBorda?: string;
  };
}

interface ModalCriarCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoria: NovaCategoria) => void;
  proximoNumero: number;
  modoEdicao?: 'criar' | 'editar';
  tipoModal?: 'categoria' | 'subcategoria';
  categoriaParaEditar?: { titulo: string; estilo: 'simples' | 'numerado' | 'pasta' };
  numeracaoAutomaticaGlobal?: boolean;
  onNumeracaoAutomaticaChange?: (value: boolean) => void;
}

// Modal de Personalização de Cores
interface ModalPersonalizacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (corFundo: string, corTexto: string) => void;
  onSavePasta?: (corPreenchimento: string, corBorda: string) => void;
  tipo: 'numeracao' | 'pasta';
  corAtualFundo: string;
  corAtualTexto?: string;
  corAtualBorda?: string;
}

// Funções para persistência local - incluindo arrays de cores
export const salvarConfiguracaoNumeracao = (corFundo: string, corTexto: string, coresPadrao: string[], coresTexto: string[]) => {
  const config = { corFundo, corTexto, coresPadrao, coresTexto };
  localStorage.setItem('configuracao-numeracao', JSON.stringify(config));
};

export const carregarConfiguracaoNumeracao = () => {
  try {
    const config = localStorage.getItem('configuracao-numeracao');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Erro ao carregar configuração de numeração:', error);
    return null;
  }
};

// Funções para persistência local - Pasta
export const salvarConfiguracaoPasta = (corPreenchimento: string, corBorda: string, coresPadrao: string[], modoAtual: 'borda' | 'preenchimento' = 'borda') => {
  const config = { corPreenchimento, corBorda, coresPadrao, modoAtual }; 

  localStorage.setItem('configuracao-pasta', JSON.stringify(config));
};

export const carregarConfiguracaoPasta = () => {
  try {
    const config = localStorage.getItem('configuracao-pasta');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Erro ao carregar configuração de pasta:', error);
    return null;
  }
};

const ModalPersonalizacao: React.FC<ModalPersonalizacaoProps> = ({
  isOpen,
  onClose,
  onSave,
  onSavePasta,
  tipo,
  corAtualFundo,
  corAtualTexto = '#FFFFFF',
  corAtualBorda = '#64748B'
}) => {
  const [corFundo, setCorFundo] = useState(corAtualFundo);
  const [corTexto, setCorTexto] = useState(corAtualTexto);
  const [corPersonalizadaFundo, setCorPersonalizadaFundo] = useState('');
  const [corPersonalizadaTexto, setCorPersonalizadaTexto] = useState('');
  
  // Carregar configuração salva ou usar padrão
  const configSalva = tipo === 'numeracao' ? carregarConfiguracaoNumeracao() : null;
  const configSalvaPasta = tipo === 'pasta' ? carregarConfiguracaoPasta() : null;
  const [coresPadrao, setCoresPadrao] = useState(
    [
      '#6B7280', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#1F2937', '#DC2626'
    ]
  );

  const [corSelecionadaIndex, setCorSelecionadaIndex] = useState<number | null>(null);

  // Estados específicos para pasta
  const [corPreenchimento, setCorPreenchimento] = useState(configSalvaPasta?.corPreenchimento || corAtualFundo);
  const [corBorda, setCorBorda] = useState(configSalvaPasta?.corBorda || corAtualBorda);
  const [modoEdicaoPasta, setModoEdicaoPasta] = useState<'preenchimento' | 'borda'>('borda');
  const [corPersonalizadaPasta, setCorPersonalizadaPasta] = useState('');
  
  // Estado para rastrear se o usuário fez mudanças
  const [usuarioFezMudancas, setUsuarioFezMudancas] = useState(false);

  // Estados para rastrear valores iniciais e detectar mudanças reais
  const [valoresIniciais, setValoresIniciais] = useState({
    corFundo: '',
    corTexto: '',
    corPreenchimento: '',
    corBorda: '',
    coresPadrao: [] as string[],
    coresTexto: [] as string[]
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [coresTextoCustom, setCoresTextoCustom] = useState(
    configSalva?.coresTexto || [
      '#FFFFFF', '#000000', '#6B7280', '#3B82F6', '#EF4444', '#10B981', 
      '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
    ]
  );
  const [corTextoSelecionadaIndex, setCorTextoSelecionadaIndex] = useState<number | null>(null);
  
    // Função para verificar se houve mudanças reais
  const temMudancasReais = () => {
    if (tipo === 'numeracao') {
      return corFundo !== valoresIniciais.corFundo || 
             corTexto !== valoresIniciais.corTexto ||
             JSON.stringify(coresPadrao) !== JSON.stringify(valoresIniciais.coresPadrao) ||
             JSON.stringify(coresTextoCustom) !== JSON.stringify(valoresIniciais.coresTexto);
    } else {
      return corPreenchimento !== valoresIniciais.corPreenchimento || 
             corBorda !== valoresIniciais.corBorda ||
             JSON.stringify(coresPadrao) !== JSON.stringify(valoresIniciais.coresPadrao);
    }
  };


  useEffect(() => {
    if (isOpen) {
      // Carregar configuração salva ou usar valores atuais
      if (tipo === 'numeracao') {
        const configSalva = carregarConfiguracaoNumeracao();
        const corFundoFinal = configSalva?.corFundo || corAtualFundo;
        const corTextoFinal = configSalva?.corTexto || corAtualTexto;
        
        setCorFundo(corFundoFinal);
        setCorTexto(corTextoFinal);
        setCorPersonalizadaFundo(corFundoFinal);
        setCorPersonalizadaTexto(corTextoFinal);
		
		// Definir valores iniciais para comparação
        setValoresIniciais({
          corFundo: corFundoFinal,
          corTexto: corTextoFinal,
          corPreenchimento: '',
          corBorda: '',
          coresPadrao: configSalva?.coresPadrao || [
            '#6B7280', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#1F2937', '#DC2626'
          ],
          coresTexto: configSalva?.coresTexto || [
            '#FFFFFF', '#000000', '#6B7280', '#3B82F6', '#EF4444', '#10B981', 
            '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
          ]
        });

      } else {
        setCorFundo(corAtualFundo);
        setCorTexto(corAtualTexto);
        setCorPersonalizadaFundo(corAtualFundo);
        setCorPersonalizadaTexto(corAtualTexto);
      }

	  setUsuarioFezMudancas(false); // Resetar estado de mudanças
      
      if (tipo === 'numeracao') {
        const configSalva = carregarConfiguracaoNumeracao();
        const corFundoFinal = configSalva?.corFundo || corAtualFundo;
        const corTextoFinal = configSalva?.corTexto || corAtualTexto;
        
        const corIndex = coresPadrao.findIndex(cor => cor === corFundoFinal);

        setCorSelecionadaIndex(corIndex >= 0 ? corIndex : 0);
        const corTextoIndex = coresTextoCustom.findIndex(cor => cor === corTextoFinal);
        setCorTextoSelecionadaIndex(corTextoIndex >= 0 ? corTextoIndex : 0);
      }
      
      // Estados específicos para pasta
      if (tipo === 'pasta') {
        const configSalvaPasta = carregarConfiguracaoPasta();
        const corPreenchimentoFinal = configSalvaPasta?.corPreenchimento || corAtualFundo;
        const corBordaFinal = configSalvaPasta?.corBorda || corAtualBorda;
        
        setCorPreenchimento(corPreenchimentoFinal);
        setCorBorda(corBordaFinal);

        setModoEdicaoPasta('borda'); // Iniciar com borda por padrão
       setCorPersonalizadaPasta(corBordaFinal); // Começar com cor da borda
        // Definir index baseado na cor da borda já que começamos com esse modo
        const corBordaIndex = coresPadrao.findIndex(cor => cor === corBordaFinal);
        setCorSelecionadaIndex(corBordaIndex >= 0 ? corBordaIndex : 0);
		
		// Definir valores iniciais para pasta
        setValoresIniciais({
          corFundo: '',
          corTexto: '',
          corPreenchimento: corPreenchimentoFinal,
          corBorda: corBordaFinal,
          coresPadrao: configSalvaPasta?.coresPadrao || [
            '#6B7280', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#1F2937', '#DC2626'
          ],
          coresTexto: []
        });
      }
    }
  }, [isOpen, corAtualFundo, corAtualTexto, corAtualBorda, coresPadrao, coresTextoCustom, tipo]);

  const selecionarCor = (cor: string, index: number) => {
    setCorFundo(cor);
    setCorSelecionadaIndex(index);
    setCorPersonalizadaFundo(cor);
  };

  const selecionarCorTexto = (cor: string, index: number) => {
    setCorTexto(cor);
    setCorTextoSelecionadaIndex(index);
    setCorPersonalizadaTexto(cor);
  };

  const selecionarCorPasta = (cor: string, index: number) => {
    setCorSelecionadaIndex(index);
    setCorPersonalizadaPasta(cor);
    // Vincular as cores - sempre atualizar ambas
    setCorPreenchimento(cor);
    setCorBorda(cor);
  };

  const substituirCorPasta = () => {
    if (corSelecionadaIndex !== null && corPersonalizadaPasta) {
      const novasCores = [...coresPadrao];
      novasCores[corSelecionadaIndex] = corPersonalizadaPasta;
      setCoresPadrao(novasCores);
      // Vincular as cores - sempre atualizar ambas
      setCorPreenchimento(corPersonalizadaPasta);
      setCorBorda(corPersonalizadaPasta);
      salvarConfiguracaoPasta(corPersonalizadaPasta, corPersonalizadaPasta, novasCores, modoEdicaoPasta);
    }
  };

  const alternarModoEdicaoPasta = (modo: 'preenchimento' | 'borda') => {
    setModoEdicaoPasta(modo);
    if (modo === 'preenchimento') {
      setCorPersonalizadaPasta(corPreenchimento);
      const corIndex = coresPadrao.findIndex(cor => cor === corPreenchimento);
      setCorSelecionadaIndex(corIndex >= 0 ? corIndex : 0);
    } else {
      setCorPersonalizadaPasta(corBorda);
      const corIndex = coresPadrao.findIndex(cor => cor === corBorda);
      setCorSelecionadaIndex(corIndex >= 0 ? corIndex : 0);
    }
  };

  // Atualizar cor personalizada quando modoEdicaoPasta muda
  useEffect(() => {
    if (tipo === 'pasta') {
      if (modoEdicaoPasta === 'preenchimento') {
        setCorPersonalizadaPasta(corPreenchimento);
      } else {
        setCorPersonalizadaPasta(corBorda);
      }
    }
  }, [modoEdicaoPasta, corPreenchimento, corBorda, tipo]);

  const substituirCorPadrao = () => {
    if (corSelecionadaIndex !== null && corPersonalizadaFundo) {
      const novasCores = [...coresPadrao];
      novasCores[corSelecionadaIndex] = corPersonalizadaFundo;
      setCoresPadrao(novasCores);
      setCorFundo(corPersonalizadaFundo);
	  
	  // Salvar arrays atualizados no localStorage
      if (tipo === 'numeracao') {
        salvarConfiguracaoNumeracao(corPersonalizadaFundo, corTexto, novasCores, coresTextoCustom);
      }
    }
  };

  const substituirCorTexto = () => {
    if (corTextoSelecionadaIndex !== null && corPersonalizadaTexto) {
      const novasCores = [...coresTextoCustom];
      novasCores[corTextoSelecionadaIndex] = corPersonalizadaTexto;
      setCoresTextoCustom(novasCores);
      setCorTexto(corPersonalizadaTexto);
	  
	  // Salvar arrays atualizados no localStorage
      salvarConfiguracaoNumeracao(corFundo, corPersonalizadaTexto, coresPadrao, novasCores);

    }
  };

  // Verificar se a cor foi alterada
  const corFoiAlterada = corSelecionadaIndex !== null && 
    corPersonalizadaFundo !== coresPadrao[corSelecionadaIndex];

  const corTextoFoiAlterada = corTextoSelecionadaIndex !== null && 
    corPersonalizadaTexto !== coresTextoCustom[corTextoSelecionadaIndex];

  const corPastaFoiAlterada = corSelecionadaIndex !== null && 
    corPersonalizadaPasta !== coresPadrao[corSelecionadaIndex];

  const handleSave = () => {
    if (tipo === 'pasta' && onSavePasta) {
     // FORÇAR salvamento com chave específica
     const configPasta = { 
       corPreenchimento: corPreenchimento, 
       corBorda: corPreenchimento, // Usar a mesma cor

       coresPadrao: coresPadrao,
       modoAtual: modoEdicaoPasta

     };
     localStorage.setItem('configuracao-pasta', JSON.stringify(configPasta));

	   salvarConfiguracaoPasta(corPreenchimento, corPreenchimento, coresPadrao, modoEdicaoPasta);
      onSavePasta(corPreenchimento, corPreenchimento);

    } else {
      const corTextoFinal = tipo === 'numeracao' ? corTexto : corFundo;
      // Salvar no localStorage se for numeração
      if (tipo === 'numeracao') {
        salvarConfiguracaoNumeracao(corFundo, corTextoFinal, coresPadrao, coresTextoCustom);
      }
      onSave(corFundo, corTextoFinal);

    }
    onClose();
  };

  // Função para lidar com tentativa de fechar modal
  const handleTentativaFechar = () => {
    if (temMudancasReais()) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  // Função para confirmar saída sem salvar
  const handleConfirmarSaida = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const renderPreview = () => {
    if (tipo === 'numeracao') {
      return (
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: corFundo, color: corTexto }}
          >
            03
          </div>
          <span className="text-lg font-semibold text-gray-900">Empresas</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3">
          {modoEdicaoPasta === 'borda' ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              version="1.1" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              className="w-6 h-6"
              fillRule="evenodd"
            >
              <path 
                d="M13.135 5.75c-.409 0-.792-.2-1.026-.535l-.897-1.287A2.75 2.75 0 0 0 8.956 2.75H4A2.75 2.75 0 0 0 1.25 5.5v13c0 .729.29 1.429.805 1.945A2.755 2.755 0 0 0 4 21.25h16c.729 0 1.429-.29 1.945-.805a2.755 2.755 0 0 0 .805-1.945v-10c0-.729-.29-1.429-.805-1.945A2.755 2.755 0 0 0 20 5.75zm0 1.5H20a1.252 1.252 0 0 1 1.25 1.25v10A1.252 1.252 0 0 1 20 19.75H4a1.252 1.252 0 0 1-1.25-1.25v-13c0-.69.56-1.25 1.25-1.25h4.956c.409 0 .792.2 1.026.535l.897 1.287a2.749 2.749 0 0 0 2.256 1.178z" 
                fill="none" 
                stroke={corBorda}
                strokeWidth="1.5"
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              version="1.1" 
              width="24" 
              height="24" 
              viewBox="0 0 32 32" 
              className="w-6 h-6"
            >
              <path 
                d="M32 10.784v14.557c0 1.645-1.354 3-3 3H3c-1.646 0-3-1.355-3-3V6.659c0-1.646 1.354-3 3-3h9.125c.323 0 .627.156.814.42l2.639 3.705H29c1.646 0 3 1.355 3 3z" 
                fill={corPreenchimento} 
              />
            </svg>
          )}

          <span className="text-lg font-semibold text-gray-900">Empresas</span>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
	
	  <style jsx>{`
    input[type="color"] {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-color: transparent;
      cursor: pointer;
    }
    input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 0;
      border-radius: 6px;
    }
    input[type="color"]::-webkit-color-swatch {
      border-radius: 6px;
    }
    input[type="color"]::-moz-color-swatch {
      border-radius: 6px;
    }
  `}</style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Personalizar {tipo === 'numeracao' ? 'Numeração' : 'Pasta'}
          </h3>
          <button
            onClick={handleTentativaFechar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visualização
            </label>
                        {tipo === 'pasta' ? (
              <div className="flex items-center gap-3">
                <PastaCustomIcon 
                  fillColor={corPreenchimento}
                  strokeColor={corBorda}

                  solid={modoEdicaoPasta === 'preenchimento'}
                  className="w-6 h-6"
                />
                <span className="text-lg font-semibold text-gray-900">Empresas</span>
              </div>
            ) : renderPreview()}

          </div>

          {/* Cores de Fundo OU Cores da Pasta */}
          {tipo === 'numeracao' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor de Fundo
              </label>
              
              {/* Cores Padrão */}
              <div className="mb-4"> 
                <div className="grid grid-cols-12 gap-2 mb-3">
                  {coresPadrao.map((cor, index) => (
                    <button
                      key={index}
                      className={`w-8 h-8 rounded-lg border-[2px] transition-all ${
                        corSelecionadaIndex === index ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => selecionarCor(cor, index)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Campo de substituição */}
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={corPersonalizadaFundo}
                  onChange={(e) => setCorPersonalizadaFundo(e.target.value)}
                    className={`w-[36px] h-[36px] rounded-[4px] cursor-pointer ${
                    corPersonalizadaFundo.toLowerCase() === '#ffffff' || corPersonalizadaFundo.toLowerCase() === 'ffffff'
                      ? 'border-1 border-gray-500' 
                      : 'border-1 border-gray-100' 
                  }`}


                />
                <input 
                  type="text"
                  value={corPersonalizadaFundo}
                  onChange={(e) => setCorPersonalizadaFundo(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                />
                <button
                  onClick={substituirCorPadrao}
                  disabled={!corFoiAlterada}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:bg-gray-300 transition-colors"
                >
                  Substituir
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor da Pasta
              </label>
              
              {/* Seletor de Modo de Edição */}
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => alternarModoEdicaoPasta('borda')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      modoEdicaoPasta === 'borda'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Borda
                  </button>
                  <button
                    onClick={() => alternarModoEdicaoPasta('preenchimento')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      modoEdicaoPasta === 'preenchimento'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Preenchimento
                  </button>
                </div>
              </div>
              
              {/* Cores Padrão */}
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-2 mb-3">
                  {coresPadrao.map((cor, index) => (
                    <button
                      key={index}
                      className={`w-8 h-8 rounded-lg border-[2px] transition-all ${
                        corSelecionadaIndex === index ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => selecionarCorPasta(cor, index)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Campo de substituição */}
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={corPersonalizadaPasta}
                  onChange={(e) => {
                    setCorPersonalizadaPasta(e.target.value);
					setUsuarioFezMudancas(true); // Marcar que usuário fez mudanças
                    // Vincular as cores
                    setCorPreenchimento(e.target.value);
                    setCorBorda(e.target.value);
                  }}
                    className={`w-[36px] h-[36px] rounded-[4px] cursor-pointer ${
                    corPersonalizadaPasta.toLowerCase() === '#ffffff' || corPersonalizadaPasta.toLowerCase() === 'ffffff'
                      ? 'border-1 border-gray-500' 
                      : 'border-1 border-gray-100'
                  }`}
                />
                <input
                  type="text"
                  value={corPersonalizadaPasta}
                  onChange={(e) => {
                    setCorPersonalizadaPasta(e.target.value);
					setUsuarioFezMudancas(true); // Marcar que usuário fez mudanças
                    // Vincular as cores
                    setCorPreenchimento(e.target.value);
                    setCorBorda(e.target.value);
                  }}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={substituirCorPasta}
                  disabled={!usuarioFezMudancas || !corPersonalizadaPasta}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:bg-gray-300 transition-colors"
                >
                  Substituir
                </button>
              </div>
            </div>
          )}

          {/* Cores do Texto (apenas para numeração) */}
          {tipo === 'numeracao' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor do Texto
              </label>
              
              {/* Cores do Texto */}
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-2 mb-3">
                  {coresTextoCustom.map((cor, index) => (
                    <button
                      key={index}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        corTextoSelecionadaIndex === index ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => selecionarCorTexto(cor, index)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Campo de substituição de texto */}
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={corPersonalizadaTexto}
                  onChange={(e) => setCorPersonalizadaTexto(e.target.value)}
                    className={`w-[36px] h-[36px] rounded-[4px] cursor-pointer ${
                    corPersonalizadaTexto.toLowerCase() === '#ffffff' || corPersonalizadaTexto.toLowerCase() === 'ffffff'
                      ? 'border-1 border-gray-500' 
                      : 'border-1 border-gray-100'
                  }`}
                />
                <input
                  type="text"
                  value={corPersonalizadaTexto}
                  onChange={(e) => setCorPersonalizadaTexto(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={substituirCorTexto}
                  disabled={!corTextoFoiAlterada}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:bg-gray-300 transition-colors"
                >
                  Substituir
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
         <button
           onClick={handleSave}
            disabled={!temMudancasReais()}
            className="px-6 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
         >
            Salvar
         </button>
        </div>
		
		        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alterações não salvas
              </h3>
              <p className="text-gray-600 mb-6">
                Você tem alterações não salvas. Deseja sair sem salvar as mudanças?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmarSaida}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sair sem salvar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Função para capitalizar a primeira letra
const capitalizarPrimeiraLetra = (texto: string): string => {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const ModalCriarCategoria: React.FC<ModalCriarCategoriaProps> = ({
  isOpen,
  onClose,
  onSave,
 proximoNumero,
 modoEdicao = 'criar',
 tipoModal = 'categoria',
  categoriaParaEditar,
 numeracaoAutomaticaGlobal = true,
 onNumeracaoAutomaticaChange



}) => {
  const [titulo, setTitulo] = useState('');
  const [estiloSelecionado, setEstiloSelecionado] = useState<'simples' | 'numerado' | 'pasta'>('simples');
  
  // Estados para numeração - carrega configuração salva
  const configSalva = carregarConfiguracaoNumeracao();
  const [corFundoNumeracao, setCorFundoNumeracao] = useState(configSalva?.corFundo || '#6B7280');
  const [corTextoNumeracao, setCorTextoNumeracao] = useState(configSalva?.corTexto || '#FFFFFF');
  
  // Estados para pasta
  const [tipoPasta, setTipoPasta] = useState<'transparente' | 'colorida'>('colorida');
 const configSalvaPasta = carregarConfiguracaoPasta();
 const [corPasta, setCorPasta] = useState(configSalvaPasta?.corPreenchimento || '#6B7280');
 const [corBordaPasta, setCorBordaPasta] = useState(configSalvaPasta?.corBorda || '#64748B');



  // Estados para modais de personalização
  const [showPersonalizacaoNumeracao, setShowPersonalizacaoNumeracao] = useState(false);
  const [showPersonalizacaoPasta, setShowPersonalizacaoPasta] = useState(false);
  
   // Estados para numeração automática
 const [numeracaoAutomatica, setNumeracaoAutomatica] = useState(numeracaoAutomaticaGlobal);
 const [numeroManual, setNumeroManual] = useState('01');
 
  // useEffect para garantir que a cor da pasta seja atualizada
 useEffect(() => {
   if (!showPersonalizacaoPasta && estiloSelecionado === 'pasta') {
     // Quando o modal de personalização fecha, a cor já deve estar atualizada
     // Este useEffect força um re-render se necessário
   }
 }, [showPersonalizacaoPasta, estiloSelecionado]);

 
  // Ref para controlar foco
 const numeroInputRef = useRef<HTMLInputElement>(null);
 const tituloInputRef = useRef<HTMLInputElement>(null);

  
   // Estado para modal de confirmação
 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [jaFoiSalvo, setJaFoiSalvo] = useState(false);
 
  // Resetar form quando modal abre
  useEffect(() => {
    if (isOpen) {
	setIsSaving(false);
	setJaFoiSalvo(false);
     // Carregar APENAS configuração de pasta
     const configPasta = carregarConfiguracaoPasta();
     if (configPasta) {
       setCorPasta(configPasta.corPreenchimento || '#6B7280');
       setCorBordaPasta(configPasta.corBorda || '#64748B');
     }


     if (modoEdicao === 'editar' && categoriaParaEditar) {
       // Modo edição: preencher com dados existentes
       setTitulo(categoriaParaEditar.titulo);
       setEstiloSelecionado(categoriaParaEditar.estilo);
	   
      // Se estiver editando uma pasta/categoria numerada, extrair o número atual
      if (categoriaParaEditar.estilo === 'numerado' && categoriaParaEditar.titulo) {
        // Assumindo que o título pode ter formato "XX Nome"
        const match = categoriaParaEditar.titulo.match(/^(\d{2}|\w{1,2})\s/);
        if (match) {
          setNumeroManual(match[1]);
        }
      }

     } else {
       // Modo criar: limpar campos
       setTitulo('');
       setEstiloSelecionado('simples');
	   setNumeroManual('01');
     }
	 
    // Usar o valor global de numeração automática
    setNumeracaoAutomatica(numeracaoAutomaticaGlobal);
     
    // Reset configurações para padrão
    setCorFundoNumeracao('#6B7280');
    setCorTextoNumeracao('#FFFFFF');
    setTipoPasta('colorida');
    }
  }, [isOpen, modoEdicao, numeracaoAutomaticaGlobal]);

 // Gerenciar foco quando numeração automática muda
 useEffect(() => {
   if (estiloSelecionado === 'numerado' && !numeracaoAutomatica) {
     // Focar campo de número quando modo manual é ativado
     setTimeout(() => {
       numeroInputRef.current?.focus();
     }, 100);
   } else if (estiloSelecionado === 'numerado' && numeracaoAutomatica) {
     // Focar campo de título quando modo automático é ativado
     setTimeout(() => {
       tituloInputRef.current?.focus();
     }, 100);
   }
 }, [numeracaoAutomatica, estiloSelecionado]);

  const handleSave = () => {
    if (!titulo.trim() || isSaving || jaFoiSalvo) {
      console.log('Bloqueado:', { isSaving, jaFoiSalvo });
      return;
    }
    
   // Verificação adicional para evitar dupla execução
   if (document.querySelector('[data-creating="true"]')) {
     console.log('?? Já existe uma criação em andamento, ignorando');
     return;
   }
   
   // Marcar que está criando
   const marker = document.createElement('div');
   marker.setAttribute('data-creating', 'true');
   marker.style.display = 'none';
   document.body.appendChild(marker);

    console.log('handleSave EXECUTANDO - primeira e única vez');
    setIsSaving(true);
    setJaFoiSalvo(true);


    const novaCategoria: NovaCategoria = {
      titulo: titulo.trim(),
      estilo: estiloSelecionado,
	  numeracaoAutomatica,
      numeroManual: !numeracaoAutomatica && estiloSelecionado === 'numerado' ? numeroManual : undefined,

    };

    if (estiloSelecionado === 'numerado') {
      novaCategoria.numeracao = {
        corFundo: corFundoNumeracao,
        corTexto: corTextoNumeracao,
      };
    }

    if (estiloSelecionado === 'pasta') {
     // Ler DIRETAMENTE do localStorage sem depender do estado
     const configPasta = carregarConfiguracaoPasta();
     const corPreenchimentoFinal = configPasta ? configPasta.corPreenchimento : '#8B5CF6'; // Roxo padrão
     const modoFinal = configPasta?.modoAtual || 'borda';

       novaCategoria.pasta = {
       tipo: modoFinal === 'preenchimento' ? 'colorida' : 'transparente',
       cor: corPreenchimentoFinal,
       corBorda: corBordaPasta,
     };
   }

   onSave(novaCategoria);
   onClose();
   
   // Remover marcador após um pequeno delay
   setTimeout(() => {
     if (marker.parentNode) {
       marker.parentNode.removeChild(marker);
     }
     setIsSaving(false);
   }, 1000);

 };


 const handleCancel = () => {
   if (titulo.trim()) {
     setShowConfirmModal(true);
   } else {
     onClose();
   }
 };

  const handlePersonalizarNumeracao = (corFundo: string, corTexto: string) => {
    setCorFundoNumeracao(corFundo);
    setCorTextoNumeracao(corTexto);
  };

  const handlePersonalizarPasta = (corPreenchimento: string, corBorda: string) => {
   // Simples e direto
   setCorPasta(corPreenchimento);
   setCorBordaPasta(corBorda);
   setShowPersonalizacaoPasta(false);
 };

 // Função para confirmar saída sem criar
 const handleConfirmarSaida = () => {
   setShowConfirmModal(false);
   onClose();
 };

  const renderPreview = () => {
    if (!titulo) return null;

    switch (estiloSelecionado) {
      case 'simples':
        return (
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">{titulo}</span>
          </div>
        );

      case 'numerado':
        return (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ 
                backgroundColor: corFundoNumeracao, 
                color: corTextoNumeracao 
              }}
            >
              {proximoNumero.toString().padStart(2, '0')}
            </div>
            <span className="text-lg font-semibold text-gray-900">{titulo}</span>
          </div>
        );

      case 'pasta':
	          // Verificar o modo salvo no localStorage
        const configPasta = carregarConfiguracaoPasta();
        const modoAtual = configPasta?.modoAtual || 'borda';

        return (
          <div className="flex items-center gap-3">
             <PastaCustomIcon 
             fillColor={corPasta}
             strokeColor={corBordaPasta}
             solid={modoAtual === 'preenchimento'}		 
             className="w-6 h-6"
             key={`pasta-${corPasta}-${corBordaPasta}`}
           />

            <span className="text-lg font-semibold text-gray-900">{titulo}</span>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[700px] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
           <h3 className="text-xl font-bold text-gray-900">
            {modoEdicao === 'editar' ? 
             (tipoModal === 'subcategoria' ? 'Editar Pasta' : 'Editar Categoria') : 
             tipoModal === 'subcategoria' ? 'Nova Pasta' : 'Nova Categoria'}
           </h3>


            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Campo Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modoEdicao === 'editar' && tipoModal === 'subcategoria' ? 'Título da Pasta' :
                tipoModal === 'subcategoria' ? 'Título da Pasta' : 'Título da Categoria'}

              </label>
             {estiloSelecionado === 'numerado' && !numeracaoAutomatica ? (
               // Modo manual: campo de número + campo de texto
               <div className="flex items-center gap-[10px]">
                 <input
				   ref={numeroInputRef}
                   type="text"
                   value={numeroManual}
                   onChange={(e) => {
                    // Permitir apenas números e limitar a 2 dígitos, sem forçar padding
                    const valor = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setNumeroManual(valor);
                  }}
                  onBlur={(e) => {
                    // Aplicar padding apenas quando sair do campo
                    const valor = e.target.value.replace(/\D/g, '').slice(0, 2);
                    if (valor === '') {
                      setNumeroManual('01'); // Valor padrão se estiver vazio
                    } else {
                      setNumeroManual(valor.padStart(2, '0'));
                    }
                  }}

                   placeholder="01"
                   className="w-16 h-10 px-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-[#1777CF] focus:ring-0.5 focus:ring-[#1777CF] font-medium"
                   maxLength={2}
				   autoFocus
                 />
                 <input
				   ref={tituloInputRef}
                   type="text"
                   value={titulo}
                   onChange={(e) => setTitulo(capitalizarPrimeiraLetra(e.target.value))}
                   placeholder={tipoModal === 'subcategoria' ? 'Digite o nome da subcategoria' : 'Digite o nome da categoria'}
                   className="flex-1 h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1777CF] focus:ring-0.5 focus:ring-[#1777CF]"
                 />
               </div>
             ) : (
               // Modo normal: apenas campo de texto
               <input
			     ref={tituloInputRef}
                 type="text"
                 value={titulo}
                 onChange={(e) => setTitulo(capitalizarPrimeiraLetra(e.target.value))}
                 placeholder={tipoModal === 'subcategoria' ? 'Digite o nome da pasta' : 'Digite o nome da categoria'}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1777CF] focus:ring-0.5 focus:ring-[#1777CF]"
                 autoFocus
               />
             )}
            </div>

            {/* Opções de Estilo */}
            <div> 
             <div className="flex items-center justify-between mb-[10px] ml-[5px]">
               <label className="block text-sm font-medium text-gray-700">
                 Estilo de Exibição
               </label>
               
               {/* Toggle Numeração Automática - só aparece quando numerado está selecionado */}
               {estiloSelecionado === 'numerado' && (
                 <div className="flex items-center gap-3">
                   <span className="text-sm font-medium text-gray-700">Numeração automática</span>
                   <button
                     type="button"
                                          onClick={() => {
                       const novoValor = !numeracaoAutomatica;
                       setNumeracaoAutomatica(novoValor);
                       if (onNumeracaoAutomaticaChange) {
                         onNumeracaoAutomaticaChange(novoValor);
                       }
                     }}

                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      numeracaoAutomatica ? 'bg-blue-100' : 'bg-gray-200'
                    }`}

                   >
                     <span
                       className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                         numeracaoAutomatica ? 'translate-x-6' : 'translate-x-1'
                       } ${
                        numeracaoAutomatica ? 'bg-[#1777FC]' : 'bg-white'
                      }`}

                     />
                   </button>
                 </div>
               )}
             </div>

              
              <div className="space-y-4">
                
                {/* Opção 1: Título Simples */}
                <div 
                 className={`border rounded-lg cursor-pointer transition-all ${
                    estiloSelecionado === 'simples'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEstiloSelecionado('simples')}
                >
                  <div className="p-4 grid grid-cols-3 gap-4 items-center min-h-[80px]">
                    
                    {/* Coluna 1: Radio + Título + Descrição */}
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        estiloSelecionado === 'simples'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {estiloSelecionado === 'simples' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Título Simples</div>
                        <div className="text-xs text-gray-500">Apenas o nome da categoria</div>
                      </div>
                    </div>
                    
                    {/* Coluna 2: Divisória Vertical */}
                    <div className="flex justify-center">
                      <div className="w-px h-12 bg-gray-300 ml-[-230px] mr-[0px]"></div>
                    </div>
                    
                    {/* Coluna 3: Exemplo */}
                    <div className="flex items-center">
                      <span className="text-gray-700 font-medium text-sm ml-[-155px]">Empresas</span>
                    </div>
                  </div>
                </div>

                {/* Opção 2: Título com Numeração */}
                <div 
                  className={`border rounded-lg cursor-pointer transition-all ${
                    estiloSelecionado === 'numerado'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEstiloSelecionado('numerado')}
                >
                  <div className="p-4 flex items-center gap-6 min-h-[80px]">
                    {/* Coluna 1: Radio + Título + Descrição */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        estiloSelecionado === 'numerado'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {estiloSelecionado === 'numerado' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Título com Numeração</div>
                        <div className="text-xs text-gray-500">Quadrado numerado + título</div>
                      </div>
                    </div>
                    
                {/* Divisória Vertical */}
               <div className="w-px h-12 bg-gray-300 ml-[80px] mr-[80px]"></div>


                    {/* Coluna 2: Exemplo */}
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: corFundoNumeracao, 
                          color: corTextoNumeracao 
                        }}
                      >
                        03
                      </div>
                      <span className="text-gray-700 font-medium text-sm">Empresas</span>
                    </div>
					
				        {/* Divisória Vertical */}
                <div className="w-px h-12 bg-gray-300 ml-[0px] mr-[80px]"></div>

                    
                 {/* Botão Personalizar */}
                <div className="flex-shrink-0">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPersonalizacaoNumeracao(true);
                        }}
                        className="px-3 py-1.5 text-xs text-white bg-[#1777CF] border border-[#1777CF] rounded-lg hover:bg-[#1565C0] transition-colors"
                      >
                        Personalizar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Opção 3: Título com Ícone de Pasta */}
                <div 
                  className={`border rounded-lg cursor-pointer transition-all ${
                    estiloSelecionado === 'pasta'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEstiloSelecionado('pasta')}
                >
                  <div className="p-4 flex items-center gap-6 min-h-[80px]">
                    {/* Coluna 1: Radio + Título + Descrição */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        estiloSelecionado === 'pasta'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {estiloSelecionado === 'pasta' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm whitespace-nowrap">Título com Ícone de Pasta</div>
                        <div className="text-xs text-gray-500">Ícone de pasta + título</div>
                      </div>
                    </div>
                    
                {/* Divisória Vertical */}
                <div className="w-px h-12 bg-gray-300 ml-[70px] mr-[80px]"></div>


                    {/* Coluna 2: Exemplo */}
                    <div className="flex items-center gap-2 flex-1">
					          {/* Verificar o modo salvo */}
          {(() => {
            const configPasta = carregarConfiguracaoPasta();
            const modoAtual = configPasta?.modoAtual || 'borda';
            return (

           <PastaCustomIcon 
          fillColor={corPasta}
          strokeColor={corBordaPasta}
          solid={modoAtual === 'preenchimento'}
           className="w-5 h-5" 
           />
            );
          })()}

                      <span className="text-gray-700 font-medium text-sm">Empresas</span>
                    </div>
					
				{/* Divisória Vertical */}
                <div className="w-px h-12 bg-gray-300 ml-[0px] mr-[80px]"></div>
	                   
                {/* Botão Personalizar */}
                <div className="flex-shrink-0">

                      <button
                        onClick={(e) => {
							
                          e.stopPropagation();
                          setShowPersonalizacaoPasta(true);
                        }}
                        className="px-3 py-1.5 text-xs text-white bg-[#1777CF] border border-[#1777CF] rounded-lg hover:bg-[#1565C0] transition-colors"
                      >
                        Personalizar
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}

              disabled={!titulo.trim() || isSaving}
              className="px-6 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
             {isSaving ? 'Salvando...' : 
              (modoEdicao === 'editar' ? 'Salvar' : 
               (tipoModal === 'subcategoria' ? 'Criar Pasta' : 'Criar Categoria'))}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Personalização - Numeração */}
      <ModalPersonalizacao
        isOpen={showPersonalizacaoNumeracao}
        onClose={() => setShowPersonalizacaoNumeracao(false)}
        onSave={handlePersonalizarNumeracao}
        tipo="numeracao"
        corAtualFundo={corFundoNumeracao}
        corAtualTexto={corTextoNumeracao}
      />

      {/* Modal de Personalização - Pasta */}
      <ModalPersonalizacao
        isOpen={showPersonalizacaoPasta}
        onClose={() => setShowPersonalizacaoPasta(false)}
       onSave={handlePersonalizarPasta}
       onSavePasta={handlePersonalizarPasta}

        tipo="pasta"
       corAtualFundo={corPasta}
       corAtualBorda={corBordaPasta}
      /> 
	  
	       {/* Modal de Confirmação */}
     {showConfirmModal && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
         <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {modoEdicao === 'editar' ? 'Alterações não salvas' : 
             (tipoModal === 'subcategoria' ? 'Pasta não criada' : 'Categoria não criada')}

           </h3>
           <p className="text-gray-600 mb-6">
                       {modoEdicao === 'editar' 
             ? `Você tem alterações não salvas na ${tipoModal === 'subcategoria' ? 'pasta' : 'categoria'}. Deseja sair sem salvar?`
             : `Você tem informações preenchidas. Deseja sair sem criar ${tipoModal === 'subcategoria' ? 'a pasta' : 'a categoria'}?`
            }

           </p>
           <div className="flex gap-3 justify-end">
             <button
               onClick={() => setShowConfirmModal(false)}
               className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
             >
               Voltar
             </button>
             <button
               onClick={handleConfirmarSaida}
               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
             >
               {modoEdicao === 'editar' ? 'Sair sem salvar' : 
                (tipoModal === 'subcategoria' ? 'Sair sem criar' : 'Sair sem criar')}
             </button>
           </div>
         </div>
       </div>
     )}

    </>
  );
};

export default ModalCriarCategoria;