import React, { useState } from 'react'
import { BancoDeDados } from './BancoDeDados'
import { ResetarSistema } from './ResetarSistema'


/*
--------------------------------------------------------
  Componente: Cabeçalho Fiscal Pro - Com Modal do Banco de Dados
--------------------------------------------------------
- Fundo branco com borda inferior sutil
- Ícone de banco de dados à esquerda do título
- Título "Fiscal Pro" centralizado com gradiente animado
- Layout responsivo e moderno
- Altura fixa de 80px para consistência visual
- Fonte Inter aplicada
- Modal do Banco de Dados implementado
*/

export const FiscalProHeader: React.FC = () => {
  // Estado para controlar se o modal está aberto
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  /*
  --------------------------------------------------------
    Função: Clique no Ícone de Banco de Dados
  --------------------------------------------------------
    - Abre o modal do banco de dados
    - Controla o estado isModalOpen
  */
  const handleDatabaseClick = () => {
    setIsModalOpen(true)
    console.log('Modal do banco de dados aberto')
  }

  /*
  --------------------------------------------------------
    Função: Fechar Modal do Banco de Dados
  --------------------------------------------------------
    - Fecha o modal do banco de dados
    - Reseta o estado isModalOpen
  */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    console.log('Modal do banco de dados fechado')
  }
  
   /*
 --------------------------------------------------------
   Função: Abrir Modal de Resetar Sistema
 --------------------------------------------------------
   - Abre o modal de confirmação para resetar
   - Controla o estado isResetModalOpen
 */
 const handleOpenResetModal = () => {
   setIsResetModalOpen(true)
   console.log('Modal de resetar sistema aberto')
 }

 /*
 --------------------------------------------------------
   Função: Fechar Modal de Resetar Sistema
 --------------------------------------------------------
   - Fecha o modal de resetar sistema
   - Reseta o estado isResetModalOpen
 */
 const handleCloseResetModal = () => {
   setIsResetModalOpen(false)
   console.log('Modal de resetar sistema fechado')
 }


  return (
    <>
      <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-50 font-inter">
        <style>{`
          .gradient-text {
            background: linear-gradient(45deg, #1777CF, #059669, #1777CF, #7C3AED);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradientMove 4s ease-in-out infinite;
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

          .database-icon {
            transition: none;
          }

          .database-icon:hover {
            opacity: 0.8;
          }
        `}</style>

        <div className="w-full h-[80px] flex items-center justify-center px-[24px] relative">
          
          {/*
          --------------------------------------------------------
            Ícone de Banco de Dados - SVG Fornecido pelo Usuário
          --------------------------------------------------------
          - Posição absoluta à esquerda do container
          - Cor: #1777CF (azul padrão) aplicada via fill
          - Tamanho: 28px para boa visibilidade
          - Cursor pointer com hover simples (sem animação)
          - Tooltip "Gerenciar banco de dados"
          - SVG fornecido pelo usuário com cor personalizada
          - Agora abre o modal quando clicado
          */}
          <button
            onClick={handleDatabaseClick}
            className="absolute left-[40px] top-1/2 transform -translate-y-1/2 database-icon cursor-pointer"
            title="Gerenciar banco de dados"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="28" 
              height="28" 
              viewBox="0 0 24 24"
            >
              <g>
                <ellipse cx="12" cy="3" rx="12" ry="3" fill="#1777CF" />
                <path d="M12 8C5.373 8 0 6.657 0 5v7c0 1.657 5.373 3 12 3s12-1.343 12-3V5c0 1.657-5.373 3-12 3zm-8.5 4a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 3.5 12z" fill="#1777CF" />
                <path d="M12 17c-6.627 0-12-1.343-12-3v7c0 1.657 5.373 3 12 3s12-1.343 12-3v-7c0 1.657-5.373 3-12 3zm-8.5 4a1.5 1.5 0 1 1 .001-3.001A1.5 1.5 0 0 1 3.5 21z" fill="#1777CF" />
              </g>
            </svg>
          </button>

          {/*
          --------------------------------------------------------
            Título Central - Fiscal Pro com Gradiente Animado
          --------------------------------------------------------
          - Posicionamento absoluto centralizado
          - Gradiente animado mantido
          - Fonte Inter Bold 32px
          - Não afetado pelo ícone à esquerda
          */}
          <h1 className="gradient-text text-[32px] font-bold text-center leading-[40px] tracking-[-0.02em] font-inter">
            Fiscal Pro
          </h1>
		  
		           {/*
         --------------------------------------------------------
           Botões à Direita - Notificação e Resetar
         --------------------------------------------------------
         - Ícone de notificação (visual apenas)
         - Botão "Resetar" funcional
         - Posicionamento absoluto à direita
         - Design consistente com o estilo da aplicação
         */}
         <div className="absolute right-[40px] top-1/2 transform -translate-y-1/2 flex items-center gap-[12px]">
           
           {/* Botão de Notificação (Visual apenas) */}
           <button
             className="w-[36px] h-[36px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] flex items-center justify-center hover:bg-[#F1F5F9] hover:border-[#CBD5E1] transition-all duration-200"
             title="Notificações (em breve)"
           >
             <svg 
               width="18" 
               height="18" 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="#6B7280" 
               strokeWidth="2" 
               strokeLinecap="round" 
               strokeLinejoin="round"
             >
               <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
               <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
             </svg>
           </button>

           {/* Botão Resetar */}
           <button
             onClick={handleOpenResetModal}
             className="px-[16px] py-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-medium rounded-[8px] transition-colors duration-200 font-inter"
             title="Resetar todo o sistema"
           >
             Resetar
           </button>
           

         </div>

        </div>
      </header>

      {/*
      --------------------------------------------------------
        Modal do Banco de Dados
      --------------------------------------------------------
      - Renderizado condicionalmente quando isModalOpen é true
      - Passa as props isOpen e onClose para o componente BancoDeDados
      - Z-index alto para aparecer acima de outros elementos
      */}
      <BancoDeDados 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
	  
	       {/*
     --------------------------------------------------------
       Modal de Resetar Sistema
     --------------------------------------------------------
     - Renderizado condicionalmente quando isResetModalOpen é true
     - Passa as props isOpen e onClose para o componente ResetarSistema
     - Z-index alto para aparecer acima de outros elementos
     */}
     <ResetarSistema 
       isOpen={isResetModalOpen} 
       onClose={handleCloseResetModal} 
     />
     


    </>
  ) 
}