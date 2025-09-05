import React from 'react';

// Ícones SVG para navegação
const ChevronLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
);

const ChevronRightIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface CarrosselFamiliaProps {
  itens: any[];
  indiceAtivo: number;
  onMudarIndice: (novoIndice: number) => void;
  onAdicionarItem: () => void;
  onRemoverItem: (indice: number) => void;
  renderizarItem: (item: any, indice: number) => React.ReactNode;
  renderizarPlaceholder?: () => React.ReactNode;
  tituloSingular: string;
  tituloPlural: string;
  permiteRemover?: boolean;
  desabilitarAdicionar?: boolean;
  className?: string;
  ocultarBotoes?: boolean;
  ocultarTitulo?: boolean;
  ocultarDivisoria?: boolean;
}

export const CarrosselFamilia: React.FC<CarrosselFamiliaProps> = ({
  itens,
  indiceAtivo,
  onMudarIndice,
  onAdicionarItem,
  onRemoverItem,
  renderizarItem,
  renderizarPlaceholder,
  tituloSingular,
  tituloPlural,
  permiteRemover = true,
  desabilitarAdicionar = false,
  className = '',
  ocultarBotoes = false,
  ocultarTitulo = false,
  ocultarDivisoria = false
}) => {
  const temItens = itens.length > 0;
  const podeNavegar = itens.length > 1;
  const indiceValido = indiceAtivo >= 0 && indiceAtivo < itens.length;

  const irParaAnterior = () => {
    if (podeNavegar) {
      const novoIndice = indiceAtivo > 0 ? indiceAtivo - 1 : itens.length - 1;
      onMudarIndice(novoIndice);
    }
  };

  const irParaProximo = () => {
    if (podeNavegar) {
      const novoIndice = indiceAtivo < itens.length - 1 ? indiceAtivo + 1 : 0;
      onMudarIndice(novoIndice);
    }
  };

  const handleRemover = () => {
    if (permiteRemover && temItens && indiceValido) {
      onRemoverItem(indiceAtivo);
      // Ajustar índice após remoção
      if (indiceAtivo >= itens.length - 1) {
        onMudarIndice(Math.max(0, itens.length - 2));
      }
    }
  };



  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Primeira Div: Botões alinhados à extrema direita */}
      {!ocultarBotoes && (
        <div className="flex justify-end mb-3 px-1">
          <div className="flex items-center gap-1">
            {/* Botão adicionar - sempre visível */}
            <button
              onClick={onAdicionarItem}
              disabled={desabilitarAdicionar}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                !desabilitarAdicionar
                  ? 'bg-[#1777CF] hover:bg-[#1565C0] text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={`Adicionar ${tituloSingular.toLowerCase()}`}
            >
              <PlusIcon size={14} />
            </button>
            
            {/* Botão remover - sempre visível, mas desabilitado quando não há itens */}
            {permiteRemover && (
              <button
                onClick={handleRemover}
                disabled={!temItens || !indiceValido}
                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                  temItens && indiceValido
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={`Remover ${tituloSingular.toLowerCase()}`}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Segunda Div: Nome da coluna centralizado */}
      {!ocultarTitulo && (
        <div className="flex justify-center mb-3 px-1">
          <h3 className="text-sm font-semibold text-gray-700">
            {temItens ? `${tituloPlural} (${itens.length.toString().padStart(2, '0')})` : `${tituloPlural} (00)`}
          </h3>
        </div>
      )}

      {/* Divisória fina acima do carrossel */}
      {!ocultarDivisoria && (
        <div className="border-t border-gray-200 mb-3"></div>
      )}

      {/* Navegação e indicador */}
      {temItens && (
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={irParaAnterior}
            disabled={!podeNavegar}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Anterior"
          >
            <ChevronLeftIcon size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Indicador de posição */}
            <span className="text-xs text-gray-500 font-medium">
              {indiceValido ? indiceAtivo + 1 : 1} de {itens.length}
            </span>
            
            {/* Nome removido conforme solicitado */}
          </div>
          
          <button
            onClick={irParaProximo}
            disabled={!podeNavegar}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Próximo"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}

      {/* Terceira Div: Conteúdo do carrossel */}
      <div className="flex-1 overflow-hidden">
        {temItens && indiceValido ? (
          <div className="h-full">
            {renderizarItem(itens[indiceAtivo], indiceAtivo)}
          </div>
        ) : (
          renderizarPlaceholder ? (
            renderizarPlaceholder()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm text-center">
                Nenhum {tituloSingular.toLowerCase()}
              </p>
              <p className="text-xs text-center mt-1">
                Clique em + para adicionar
              </p>
            </div>
          )
        )}
      </div>



      {/* Indicadores de navegação (pontos) */}
      {podeNavegar && (
        <div className="flex justify-center gap-1">
          {itens.map((_, index) => (
            <button
              key={index}
              onClick={() => onMudarIndice(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === indiceAtivo
                  ? 'bg-[#1777CF]'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={`Ir para ${tituloSingular.toLowerCase()} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarrosselFamilia;