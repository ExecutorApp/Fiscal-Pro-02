import React, { useState } from 'react'

/*
--------------------------------------------------------
  Componente: Resetar Sistema - Limpeza Completa de Dados
--------------------------------------------------------
- Modal de confirmação com design moderno
- Limpa todo o armazenamento local (localStorage)
- Recarrega a página para voltar ao estado inicial
- Interface consistente com o design da aplicação
- Transições suaves e feedback visual
*/

interface ResetarSistemaProps {
  isOpen: boolean
  onClose: () => void
}

export const ResetarSistema: React.FC<ResetarSistemaProps> = ({ isOpen, onClose }) => {
  const [isResetting, setIsResetting] = useState(false)

  /*
  --------------------------------------------------------
    Função: Resetar Sistema Completo
  --------------------------------------------------------
    - Limpa todo o localStorage
    - Limpa sessionStorage (se houver)
    - Limpa IndexedDB (se houver)
    - Recarrega a página para estado inicial
  */
  const handleResetSystem = async () => {
    try {
      setIsResetting(true)
      
      // 1. Limpar localStorage
      console.log('🧹 Limpando localStorage...')
      localStorage.clear()
      
      // 2. Limpar sessionStorage
      console.log('🧹 Limpando sessionStorage...')
      sessionStorage.clear()
      
      // 3. Limpar IndexedDB (se existir)
      console.log('🧹 Limpando IndexedDB...')
      try {
        const databases = await indexedDB.databases()
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!)
                deleteReq.onsuccess = () => resolve()
                deleteReq.onerror = () => reject(deleteReq.error)
              })
            }
          })
        )
      } catch (error) {
        console.log('ℹ️ IndexedDB não disponível ou já limpo')
      }
      
      // 4. Limpar Cache do Service Worker (se existir)
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map(registration => registration.unregister()))
          console.log('🧹 Service Workers limpos')
        } catch (error) {
          console.log('ℹ️ Nenhum Service Worker para limpar')
        }
      }
      
      console.log('✅ Sistema completamente resetado!')
      console.log('🔄 Recarregando aplicação...')
      
      // 5. Pequeno delay para feedback visual e então recarregar
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erro ao resetar sistema:', error)
      setIsResetting(false)
      alert('Erro ao resetar o sistema. Tente recarregar a página manualmente.')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[100] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-[16px] shadow-xl max-w-[480px] w-full transform transition-all duration-300 scale-100">
          
          {/* Header do Modal */}
          <div className="px-[24px] py-[20px] border-b border-[#F0F0F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1F2937] font-inter">
                Resetar Sistema
              </h2>
              <button
                onClick={onClose}
                disabled={isResetting}
                className="text-[#6B7280] hover:text-[#374151] transition-colors duration-200 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Conteúdo do Modal */}
          <div className="px-[24px] py-[24px]">
            <div className="flex items-start gap-[16px]">
              {/* Ícone de Aviso */}
              <div className="flex-shrink-0 w-[48px] h-[48px] bg-[#FEF3CD] rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/>
                  <path d="m12 17 .01 0"/>
                </svg>
              </div>
              
              {/* Texto do Aviso */}
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#1F2937] mb-[8px] font-inter">
                  Atenção: Esta ação não pode ser desfeita
                </h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px] font-inter">
                  Ao resetar o sistema, todos os dados salvos serão permanentemente removidos, incluindo:
                </p>
                <ul className="mt-[12px] space-y-[4px] text-[14px] text-[#6B7280] font-inter">
                  <li className="flex items-center gap-[8px]">
                    <div className="w-[4px] h-[4px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
                    Todos os clientes cadastrados
                  </li>
                  <li className="flex items-center gap-[8px]">
                    <div className="w-[4px] h-[4px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
                    Configurações do banco de dados
                  </li>
                  <li className="flex items-center gap-[8px]">
                    <div className="w-[4px] h-[4px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
                    Todas as preferências salvas
                  </li>
                  <li className="flex items-center gap-[8px]">
                    <div className="w-[4px] h-[4px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
                    Histórico de atividades
                  </li>
                </ul>
                <p className="mt-[12px] text-[14px] text-[#6B7280] font-inter">
                  O sistema será recarregado com os dados padrão originais.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer com Botões */}
          <div className="px-[24px] py-[20px] border-t border-[#F0F0F0] flex justify-end gap-[12px]">
            <button
              onClick={onClose}
              disabled={isResetting}
              className="px-[16px] py-[8px] text-[14px] font-medium text-[#6B7280] hover:text-[#374151] transition-colors duration-200 disabled:opacity-50 font-inter"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetSystem}
              disabled={isResetting}
              className="px-[20px] py-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-medium rounded-[8px] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[8px] font-inter"
            >
              {isResetting ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Resetando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                  Resetar Sistema
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}