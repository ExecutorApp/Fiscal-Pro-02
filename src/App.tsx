import { useState } from 'react'
import { FiscalProHeader } from './components/FiscalProHeader'
import { ClientsContainer } from './components/ClientsContainer'
import TesteImagemViewer from './pages/TesteImagemViewer'
import { EstadosICMSProvider } from './components/EstadosICMSContext'
import { ImpostoRendaProvider } from './components/ImpostoRendaContext'
import { SegmentosProvider } from './contexts/SegmentosContext'


/*
--------------------------------------------------------
  Aplicação Principal: Fiscal Pro SaaS - Layout Responsivo
--------------------------------------------------------
- Layout principal com altura mínima da viewport
- Header fixo no topo (80px)
- Container de clientes com altura dinâmica
- Scroll vertical slim habilitado para navegação
- Scroll personalizado aplicado globalmente
*/

function App() {
  const [showImageTest, setShowImageTest] = useState(false)

  if (showImageTest) {
    return (
      <div className="bg-[#F8FAFC]">
        <div className="p-4">
          <button 
            onClick={() => setShowImageTest(false)}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Voltar para o Sistema Principal
          </button>
        </div>
        <TesteImagemViewer />
      </div>
    )
  }



  return (
    <SegmentosProvider>
      <EstadosICMSProvider>
        <ImpostoRendaProvider>
        <div className="bg-[#F8FAFC]"> 
          {/* Botões de teste temporários */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            <button 
              onClick={() => setShowImageTest(true)}
              className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg"
            >
              🧪 Teste ImageViewer
            </button>

          </div>
          
          {/* Header fixo no topo */}
          <FiscalProHeader />
          
          {/* Container principal de clientes */}
          <ClientsContainer />
        </div>
        </ImpostoRendaProvider>
      </EstadosICMSProvider>
    </SegmentosProvider>
  )
}

export default App