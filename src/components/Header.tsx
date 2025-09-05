import React from 'react'

/*
--------------------------------------------------------
  Componente: Cabeçalho da Aplicação - Com Controle de Visibilidade
--------------------------------------------------------
- Fundo cinza claro (#FCFCFC) com bordas arredondadas
- Ícone de documento azul clicável (só visível após upload)
- Título "Balancetes Pro" centralizado COM EFEITO GRADIENTE ANIMADO
- Altura fixa de 60px com padding lateral
- Design minimalista e moderno
*/

interface HeaderProps {
  onSpreadsheetIconClick: () => void
  showSpreadsheetIcon?: boolean // Controla se o ícone deve ser exibido
  showResultButton?: boolean // Controla se o botão resultado deve ser exibido
  onResultClick?: () => void // Função para o botão resultado
  isCalculating?: boolean // Estado de loading do cálculo
}

export const Header: React.FC<HeaderProps> = ({ 
  onSpreadsheetIconClick, 
  showSpreadsheetIcon = false,
  showResultButton = false,
  onResultClick,
  isCalculating = false
}) => {
  return (
    <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <style>{`
        .gradient-text {
          background: linear-gradient(45deg, #40ffaa, #4079ff, #40ffaa, #ff40aa);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 3s ease-in-out infinite;
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div className="pl-[20px] pr-[20px] py-[16px]">
        {/* Container principal do cabeçalho com layout de 3 colunas */}
        <div className="h-[60px] pl-[38px] pr-[30px] bg-[#FCFCFC] rounded-[12px] flex items-center justify-between relative">
          
          {/* Seção esquerda - Ícone (se existir) */}
          <div className="flex items-center gap-[10px] w-[100px]">
            {showSpreadsheetIcon && (
              <button
                onClick={onSpreadsheetIconClick}
                className="p-[4px] rounded-[6px] hover:bg-[#F0F9FF] transition-colors duration-200 group"
                title="Gerenciar Planilhas"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-200 group-hover:scale-110"
                >
                  <path d="M17 6.85714C16.7348 6.85714 16.4804 6.76684 16.2929 6.60609C16.1054 6.44535 16 6.22733 16 6V0H2C1.46957 0 0.960859 0.180612 0.585786 0.502103C0.210714 0.823593 0 1.25963 0 1.71429V22.2857C0 22.7404 0.210714 23.1764 0.585786 23.4979C0.960859 23.8194 1.46957 24 2 24H22C22.5304 24 23.0391 23.8194 23.4142 23.4979C23.7893 23.1764 24 22.7404 24 22.2857V6.85714H17ZM6.49 6H11.51C11.7752 6 12.0296 6.09031 12.2171 6.25105C12.4046 6.4118 12.51 6.62981 12.51 6.85714C12.51 7.08447 12.4046 7.30249 12.2171 7.46323C12.0296 7.62398 11.7752 7.71429 11.51 7.71429H6.49C6.22478 7.71429 5.97043 7.62398 5.78289 7.46323C5.59536 7.30249 5.49 7.08447 5.49 6.85714C5.49 6.62981 5.59536 6.4118 5.78289 6.25105C5.97043 6.09031 6.22478 6 6.49 6ZM17.51 18H6.49C6.22478 18 5.97043 17.9097 5.78289 17.749C5.59536 17.5882 5.49 17.3702 5.49 17.1429C5.49 16.9155 5.59536 16.6975 5.78289 16.5368C5.97043 16.376 6.22478 16.2857 6.49 16.2857H17.51C17.7752 16.2857 18.0296 16.376 18.2171 16.5368C18.4046 16.6975 18.51 16.9155 18.51 17.1429C18.51 17.3702 18.4046 17.5882 18.2171 17.749C18.0296 17.9097 17.7752 18 17.51 18ZM17.51 12.8571H6.49C6.22478 12.8571 5.97043 12.7668 5.78289 12.6061C5.59536 12.4453 5.49 12.2273 5.49 12C5.49 11.7727 5.59536 11.5547 5.78289 11.3939C5.97043 11.2332 6.22478 11.1429 6.49 11.1429H17.51C17.7752 11.1429 18.0296 11.2332 18.2171 11.3939C18.4046 11.5547 18.51 11.7727 18.51 12C18.51 12.2273 18.4046 12.4453 18.2171 12.6061C18.0296 12.7668 17.7752 12.8571 17.51 12.8571Z" fill="#1777CF"/>
                  <path d="M18.0002 5.14286H23.9202C23.7031 3.86319 23.0095 2.67788 21.9427 1.7635C20.876 0.849128 19.4931 0.254628 18.0002 0.068573V5.14286Z" fill="#1777CF"/>
                </svg>
              </button>
            )}
          </div>

          {/* Seção central - Título centralizado ABSOLUTO */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h1 className="gradient-text text-[22px] font-bold text-center leading-[27px] font-inter whitespace-nowrap">
              Balancetes Pro
            </h1>
          </div>

          {/* Seção direita - Botão (se existir) */}
          <div className="flex items-center justify-end w-[100px]">
            {showResultButton && (
              <button
                onClick={onResultClick}
                disabled={isCalculating}
                className={`px-[16px] py-[8px] rounded-[8px] font-medium text-[14px] transition-colors duration-200 ${
                  isCalculating 
                    ? 'bg-[#9CA3AF] text-white cursor-not-allowed' 
                    : 'bg-[#1777CF] text-white hover:bg-[#1565C0]'
                }`}
              >
                {isCalculating ? (
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[14px] h-[14px] border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Calculando...
                  </div>
                ) : (
                  'Resultado'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}