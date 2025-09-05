import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, User, FileSpreadsheet, Image, Upload } from 'lucide-react';
import Menu from './AnaliseDeDados/Menu';
import VisualizarDocumento from './VisualizarDocumentos';
import ImageViewer from './VisualizarDocumentos/ImageViewer';
import { ImageMetadata, getImageMetadataByStorageKey } from '../utils/dbImages';
import ResultadoGestor from './Resultado/ResultadoGestor';

interface CruzamentoDeDadosProps {
  isOpen?: boolean;
  onClose?: () => void;
  cliente?: {
    id: number;
    name: string;
    photo: string;
    whatsapp: string;
    estado: string;
    email: string;
    city: string;
    cpfCnpj: string;
  };
}

const CruzamentoDeDados: React.FC<CruzamentoDeDadosProps> = ({ isOpen: isOpenProp = true, onClose }) => {
  const [isOpen, setIsOpen] = useState(isOpenProp);
  const [activeTab, setActiveTab] = useState<'fisica' | 'juridica'>('fisica');
  const [activeSection, setActiveSection] = useState('dados-pessoais');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isResultadoModalOpen, setIsResultadoModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    'pessoa-fisica': true,
    'pessoa-juridica': true,
    'formularios': true,
    'empresas': true,
    'formularios-juridica': true
  });

 const [documentoSelecionado, setDocumentoSelecionado] = useState<{
   id: string;
   nome: string;
   url: string;
   tipo: 'pdf' | 'excel' | 'word' | 'image' | 'text' | 'other';
   totalPaginas?: number;
   fileName?: string;
   label?: string;
   src?: string;
   dataUrl?: string;
   forceViewer?: string;
 } | null>(null);
 const [imagemSelecionada, setImagemSelecionada] = useState<ImageMetadata | null>(null);
 const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
 const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);

 // Ref para controlar o MutationObserver do PDF
   const mutationObserverRef = React.useRef<MutationObserver | null>(null);
   // Ref para controlar timeouts
   const timeoutRef = useRef<number | null>(null);

 // useEffect para gerenciar o MutationObserver do PDF
 useEffect(() => {
   // Limpar observer anterior
   if (mutationObserverRef.current) {
     mutationObserverRef.current.disconnect();
     mutationObserverRef.current = null;
   }

   // Se não é PDF, resetar estados e sair
   if (!documentoSelecionado || documentoSelecionado.tipo !== 'pdf') {
     setPdfCurrentPage(1);
     setPdfTotalPages(0);
     return;
   }


   // Documento PDF selecionado

   // Função para atualizar informações do PDF
   const updatePdfInfo = () => {
     const pdfInfoElement = document.querySelector('[data-pdf-info]');
     if (pdfInfoElement) {
       const currentPage = parseInt(pdfInfoElement.getAttribute('data-current-page') || '1');
       const totalPages = parseInt(pdfInfoElement.getAttribute('data-total-pages') || '0');
       
       // Atualizar apenas se os valores forem diferentes dos atuais
       if (totalPages > 0 && (currentPage !== pdfCurrentPage || totalPages !== pdfTotalPages)) {
         setPdfCurrentPage(currentPage);
         setPdfTotalPages(totalPages);
       }
     }
   };

   // Função para configurar o observer de forma mais robusta
   const setupObserver = (attempts = 0) => {
     // Limitar tentativas para evitar loops infinitos
     if (attempts > 10) {
       console.warn('Máximo de tentativas atingido para configurar observer do PDF');
       return;
     }

     // Sempre garantir que temos um observer ativo
     const pdfInfoElement = document.querySelector('[data-pdf-info]');
     if (pdfInfoElement) {
       // Atualizar informações iniciais
       updatePdfInfo();
       
       // Criar e configurar o observer
       if (mutationObserverRef.current) {
         mutationObserverRef.current.disconnect();
       }
       
       mutationObserverRef.current = new MutationObserver(() => {
         updatePdfInfo();
       });
       
       mutationObserverRef.current.observe(pdfInfoElement, {
         attributes: true,
         attributeFilter: ['data-current-page', 'data-total-pages']
       });
       
     } else {
       // Cancelar timeout anterior se existir
       if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
       }
       // Se o elemento ainda não existe, tentar novamente em breve
       timeoutRef.current = setTimeout(() => setupObserver(attempts + 1), 500);
     }
   };

   // Iniciar setup com delay para garantir que o PDF seja carregado
   const timeoutId = setTimeout(() => setupObserver(0), 50);

   // Cleanup
   return () => {
     clearTimeout(timeoutId);
     if (timeoutRef.current) {
       clearTimeout(timeoutRef.current);
     }
     if (mutationObserverRef.current) {
       mutationObserverRef.current.disconnect();
       mutationObserverRef.current = null;
     }
   };
 }, [documentoSelecionado]);
 

 // Memoizar metadados da imagem para evitar re-criações
 const memoizedImageMetadata = useMemo(() => imagemSelecionada, [imagemSelecionada?.id, imagemSelecionada?.storageKey, imagemSelecionada?.dataUrl]);

 // Função para lidar com upload de imagem
 const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
   const file = event.target.files?.[0];
   if (!file) return;

   // Verificar se é uma imagem válida
   if (!file.type.startsWith('image/')) {
     alert('Por favor, selecione apenas arquivos de imagem (JPEG, PNG, etc.)');
     return;
   }

   // Converter para base64
   const reader = new FileReader();
   reader.onload = (e) => {
     const dataUrl = e.target?.result as string;
     
     // Criar metadados da imagem
     const imageMetadata: ImageMetadata = {
       id: `upload_${Date.now()}`,
       name: file.name,
       type: file.type,
       size: file.size,
       dataUrl: dataUrl,
       storageKey: `upload_${Date.now()}`,
       createdAt: new Date().toISOString()
     };

     // Definir a imagem selecionada
     setImagemSelecionada(imageMetadata);
     setDocumentoSelecionado(null); // Limpar documento selecionado
   };

   reader.onerror = () => {
     alert('Erro ao carregar a imagem. Tente novamente.');
   };

   reader.readAsDataURL(file);
 };



 // Função para detectar tipo de arquivo pela extensão
  const detectFileType = (fileName: string): 'image' | 'text' | 'pdf' | 'excel' | 'word' | 'other' => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'log':
        return 'text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return 'image';
      case 'pdf':
        return 'pdf';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'excel';
      case 'doc':
      case 'docx':
        return 'word';
      default:
        return 'other';
    }
  };

 // Função para lidar com seleção de documento do menu
   const handleDocumentSelect = async (item: any) => {
    if (!item) {
      return;
    }
   
   if (item.type === 'arquivo') {
     // Detectar tipo de arquivo pela extensão
     const fileType = detectFileType(item.label || '');
      
      // Para imagens, manter lógica existente do ImageViewer
      if (fileType === 'image') {
        setDocumentoSelecionado(null);
        
        // Primeiro, tentar buscar metadados do IndexedDB se tem storageKey
        if ((item as any).storageKey) {
          try {
            const dbMetadata = await getImageMetadataByStorageKey((item as any).storageKey);
            if (dbMetadata) {
              setImagemSelecionada(dbMetadata);
              return;
            }
          } catch (error) {
            console.error('Erro ao buscar no IndexedDB:', error);
          }
        }
        
        // Verificar se o item já tem dataUrl diretamente
        if ((item as any).dataUrl) {
          const imageMetadata: ImageMetadata = {
            id: item.id || `img-${Date.now()}`,
            name: item.label || 'Imagem sem nome',
            type: (item as any).imageType || 'image/jpeg',
            size: (item as any).imageSize || 0,
            storageKey: (item as any).storageKey || null,
            dataUrl: (item as any).dataUrl,
            createdAt: (item as any).createdAt || new Date().toISOString()
          };
          
          setImagemSelecionada(imageMetadata);
          return;
        }
        
        // Se não há dataUrl nem storageKey, não exibir nada
        return;
      }
      
      // Para todos os outros tipos de arquivo (incluindo texto), usar VisualizarDocumento
      setImagemSelecionada(null);
      
      // Verificar se o item tem dados reais
       if (!(item as any).dataUrl) {
         return;
       }
       
       const itemLabel = item.label || 'Documento';
       const itemDataUrl = (item as any).dataUrl;
      
      const documento = {
        id: item.id || `doc-${Date.now()}`,
        nome: itemLabel,
        fileName: itemLabel,
        label: itemLabel,
        // Usar diretamente a URL real do item
        src: itemDataUrl,
        url: itemDataUrl,
        dataUrl: itemDataUrl,
        tipo: fileType as 'pdf' | 'excel' | 'word' | 'text' | 'other',
        totalPaginas: 1,
        // Forçar o viewer Text para arquivos .txt
        forceViewer: fileType === 'text' ? 'Text' as const : undefined
      };
      
      setDocumentoSelecionado(documento);
      return;
    }
  };

  // Estado para forçar atualização do menu
  const [menuKey, setMenuKey] = useState(0);

  // Observar mudanças no localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      setMenuKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também observar eventos customizados para mudanças no mesmo tab
    window.addEventListener('localDataUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localDataUpdated', handleStorageChange);
    };
  }, []);

  // Dados mockados com mais realismo
  const mockData = {
    dadosPessoais: {
      nome: 'Kristin Watson',
      cpf: '123.456.789-01',
      rg: '12.345.678-9',
      dataNascimento: '15/03/1985',
      estadoCivil: 'Casada',
      profissao: 'Empresária',
      rendaAnual: 'R$ 250.000,00',
      patrimonio: 'R$ 1.2M',
      score: 850,
      telefone: '(11) 99876-5432',
      email: 'kristin.watson@email.com'
    },
    familia: [
      { nome: 'Robert Watson', parentesco: 'Cônjuge', cpf: '987.654.321-01', idade: 42, profissao: 'Advogado' },
      { nome: 'Emily Watson', parentesco: 'Filha', cpf: '111.222.333-44', idade: 16, profissao: 'Estudante' },
      { nome: 'Michael Watson', parentesco: 'Filho', cpf: '555.666.777-88', idade: 14, profissao: 'Estudante' }
    ],
     empresas: [],
     formularios: []
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof expandedSections]
    }));
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!isOpen) return null;

  return (
   <>
     <div className="fixed inset-0 z-50 flex bg-gray-900/50 backdrop-blur-sm">
       <div className="relative flex flex-col w-full h-full bg-gray-50 overflow-hidden">
         
         {/* HEADER - Contêiner 1 */}
         <div className="bg-white border-b border-gray-200 px-6 py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                 <User className="w-5 h-5 text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold text-gray-900">Cruzamento de Dados</h1>
                 <p className="text-sm text-gray-500">Kristin Watson • (11) 99876-5432</p>
               </div>
             </div>
             <div className="flex items-center gap-3">

               <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                 <FileSpreadsheet className="w-5 h-5 text-gray-600" />
               </button>
               <button 
                 onClick={() => setIsResultadoModalOpen(true)}
                 className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/25"
               >
                 Gerar Resultado
               </button>
               <button onClick={() => {
                 if (onClose) {
                   onClose();
                 } else {
                   setIsOpen(false);
                 }
               }} className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
                 <X className="w-5 h-5 text-gray-400" />
               </button>
             </div>
           </div>
         </div>

         {/* LAYOUT PRINCIPAL */}
         <div className="flex flex-1 gap-2.5 p-2.5 overflow-hidden">         

		   
           {/* MENU LATERAL - Usando o novo componente */}
           <Menu
   		    key={menuKey}
             activeTab={activeTab}
             activeSection={activeSection}
             sidebarCollapsed={sidebarCollapsed}
             expandedSections={expandedSections}
             mockData={{
               empresas: mockData.empresas,
               formularios: mockData.formularios
             }}
             onTabChange={setActiveTab}
           onSectionChange={(section, item) => {
             setActiveSection(section);
             // Se um item foi passado, verificar se é um documento
             if (item) {
               handleDocumentSelect(item);
             }
           }}

             onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
             onToggleSection={toggleSection}
           />

           {/* NOVO CONTÊINER - Visualizador de Documentos */}
           <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden">

             {/* Renderizar ImageViewer para imagens JPEG/PNG */}
             {imagemSelecionada && (imagemSelecionada.storageKey || imagemSelecionada.dataUrl) ? (
               <div className="relative w-full h-full">
                 {/* Header da imagem */}
                 <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-10">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Image className="w-6 h-6 text-green-500" />
                       <div>
                         <h3 className="font-semibold text-gray-900">{imagemSelecionada.name}</h3>
                         <p className="text-sm text-gray-500">
                           {imagemSelecionada.type.split('/')[1].toUpperCase()} • {(imagemSelecionada.size / 1024).toFixed(1)} KB
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       {/* Botão de Upload */}
                       <label className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors flex items-center gap-1">
                         <Upload className="w-3 h-3" />
                         Upload
                         <input
                           type="file"
                           accept="image/*"
                           onChange={handleImageUpload}
                           className="hidden"
                         />
                       </label>
                       
                       {/* Botão de Teste com Imagem Base64 */}
                       <button
                         onClick={() => {
                           const testImage: ImageMetadata = {
                             id: 'test-base64',
                             name: 'teste-base64.png',
                             type: 'image/png',
                             size: 1024,
                             storageKey: '',
                             dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDI4NWY0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5URVNURSBJTUFHRU08L3RleHQ+PC9zdmc+',
                             createdAt: new Date().toISOString()
                           };
                           setImagemSelecionada(testImage);
                         }}
                         className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                         title="Testar com imagem base64"
                       >
                         🧪 Teste
                       </button>
                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                         Local
                       </span>
                     </div>
                   </div>
                 </div>
                 
                 {/* ImageViewer */}
                 <div className="pt-20 w-full h-full">
                   <ImageViewer
                     metadata={memoizedImageMetadata}
                     className="w-full h-full"
                   />
                 </div>
               </div>
             ) : documentoSelecionado ? (
               <div className="w-full h-full">
                 {/* Componente VisualizarDocumento inline - usando mesma lógica do modal ExemploUso */}
                 <div className="w-full h-full">
                   <VisualizarDocumento
                     key={documentoSelecionado.id} /* Forçar remontagem ao trocar documentos */
                     src={documentoSelecionado.dataUrl || documentoSelecionado.src || documentoSelecionado.url}
                     fileName={documentoSelecionado.fileName || documentoSelecionado.nome || documentoSelecionado.label}
                     width="100%"
                     height="100%"
                     fit="contain"
                     allowDownload={true}
                     forceViewer={(documentoSelecionado as any).forceViewer}

                   />
                 </div>
               </div>
             ) : (
               <div className="w-full h-full flex items-center justify-center">
                 <div className="text-center">

                   <h3 className="text-lg font-medium text-gray-500 mb-2">
                     Selecione um documento
                   </h3>
                   <p className="text-gray-400">
                     Escolha um documento no menu lateral para visualizar
                   </p>
                 </div>
               </div>
             )}



           </div>
         </div>
       </div>
     </div>

     {/* Modal de Resultado */}
     {isResultadoModalOpen && (
       <ResultadoGestor 
         isOpen={isResultadoModalOpen}
         onClose={() => setIsResultadoModalOpen(false)}
       />
     )}

   </>

  );
};

export default CruzamentoDeDados;
export { CruzamentoDeDados };
