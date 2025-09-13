import { useMemo, useRef, useState, useEffect } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { Empresa, EstruturaEmpresas } from "./types";
import { ChevronLeft, ChevronRight, Plus, HardDrive, Check } from "lucide-react";
import DropdownCustomizado from "../DropdownCustomizado";
import UploadModal from './UploadModal';
import EditBar from './EditBar';
import RenameModal from './RenameModal';
import ShareModal from './ShareModal';
import LinkModal from './LinkModal';
import DeleteModal from './DeleteModal';
import CacheManager from '../CacheManager';
import { cacheInstance as indexedDBCache } from '../../utils/IndexedDBCache';

interface EmpresaDetailsProps {
  empresa: Empresa | null;
  estrutura: EstruturaEmpresas;
  onSalvarValor: (abaId: string, campoId: string, valor: any) => void;
}

// Definição das abas fixas do header
const FIXED_TABS = [
  { key: "anexos" as const, label: "Anexos" },
  { key: "dados_principais" as const, label: "Dados Principais" },
  { key: "cnaes" as const, label: "CNAEs" },
  { key: "socios" as const, label: "Sócios" },
] as const;

// Sub-abas dentro de Anexos
const ANEXOS_TABS = [
  { key: "videos", label: "Vídeos", count: 10 },
  { key: "audios", label: "Áudios", count: 5 },
  { key: "documentos", label: "Documentos", count: 2 },
  { key: "formularios", label: "Formulários", count: 0 },
] as const;

// removed: FixedTabKey (não utilizado)
export type AnexosTabKey = typeof ANEXOS_TABS[number]["key"];

type Filtro = { produto: string; fase: string; atividade: string };
const defaultFiltro: Filtro = { produto: "todos", fase: "todas", atividade: "todas" };

// Estrutura hierárquica dos filtros
const PRODUTO_OPCOES = [
  { value: "todos", label: "Todos" },
  { value: "hp", label: "Holding Patrimonial" },
  { value: "af", label: "Ativos Fundiários" },
  { value: "pt", label: "Planejamento Tributário" },
];

const FASE_OPCOES = [
  { value: "todas", label: "Todas" },
  { value: "hp-f01", label: "HP - Fase 01" },
  { value: "hp-f02", label: "HP - Fase 02" },
  { value: "hp-f03", label: "HP - Fase 03" },
  { value: "af-f01", label: "AF - Fase 01" },
  { value: "af-f02", label: "AF - Fase 02" },
  { value: "af-f03", label: "AF - Fase 03" },
  { value: "pt-f01", label: "PT - Fase 01" },
  { value: "pt-f02", label: "PT - Fase 02" },
  { value: "pt-f03", label: "PT - Fase 03" },
];

const ATIVIDADE_OPCOES = [
  { value: "todas", label: "Todas" },
  { value: "hp-f01-a01", label: "HP/F01 - Atividade 01" },
  { value: "hp-f01-a02", label: "HP/F01 - Atividade 02" },
  { value: "hp-f01-a03", label: "HP/F01 - Atividade 03" },
  { value: "hp-f02-a01", label: "HP/F02 - Atividade 01" },
  { value: "hp-f02-a02", label: "HP/F02 - Atividade 02" },
  { value: "hp-f02-a03", label: "HP/F02 - Atividade 03" },
  { value: "hp-f03-a01", label: "HP/F03 - Atividade 01" },
  { value: "hp-f03-a02", label: "HP/F03 - Atividade 02" },
  { value: "hp-f03-a03", label: "HP/F03 - Atividade 03" },
  { value: "af-f01-a01", label: "AF/F01 - Atividade 01" },
  { value: "af-f01-a02", label: "AF/F01 - Atividade 02" },
  { value: "af-f01-a03", label: "AF/F01 - Atividade 03" },
  { value: "af-f02-a01", label: "AF/F02 - Atividade 01" },
  { value: "af-f02-a02", label: "AF/F02 - Atividade 02" },
  { value: "af-f02-a03", label: "AF/F02 - Atividade 03" },
  { value: "af-f03-a01", label: "AF/F03 - Atividade 01" },
  { value: "af-f03-a02", label: "AF/F03 - Atividade 02" },
  { value: "af-f03-a03", label: "AF/F03 - Atividade 03" },
  { value: "pt-f01-a01", label: "PT/F01 - Atividade 01" },
  { value: "pt-f01-a02", label: "PT/F01 - Atividade 02" },
  { value: "pt-f01-a03", label: "PT/F01 - Atividade 03" },
  { value: "pt-f02-a01", label: "PT/F02 - Atividade 01" },
  { value: "pt-f02-a02", label: "PT/F02 - Atividade 02" },
  { value: "pt-f02-a03", label: "PT/F02 - Atividade 03" },
  { value: "pt-f03-a01", label: "PT/F03 - Atividade 01" },
  { value: "pt-f03-a02", label: "PT/F03 - Atividade 02" },
  { value: "pt-f03-a03", label: "PT/F03 - Atividade 03" },
];

// Funções auxiliares para extrair relacionamentos hierárquicos
const extractProdutoFromFase = (faseValue: string): string => {
  if (faseValue === "todas" || !faseValue) return "todos";
  const [produto] = faseValue.split("-");
  return produto;
};

const extractProdutoFromAtividade = (atividadeValue: string): string => {
  if (atividadeValue === "todas" || !atividadeValue) return "todos";
  const [produto] = atividadeValue.split("-");
  return produto;
};

const extractFaseFromAtividade = (atividadeValue: string): string => {
  if (atividadeValue === "todas" || !atividadeValue) return "todas";
  const parts = atividadeValue.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return "todas";
};

const getFilteredFases = (produtoValue: string) => {
  if (produtoValue === "todos" || !produtoValue) {
    return FASE_OPCOES;
  }
  return FASE_OPCOES.filter(fase => 
    fase.value === "todas" || fase.value.startsWith(produtoValue + "-")
  );
};

const getFilteredAtividades = (produtoValue: string, faseValue: string) => {
  if (produtoValue === "todos" && faseValue === "todas") {
    return ATIVIDADE_OPCOES;
  }
  
  if (faseValue !== "todas" && faseValue) {
    return ATIVIDADE_OPCOES.filter(atividade => 
      atividade.value === "todas" || atividade.value.startsWith(faseValue + "-")
    );
  }
  
  if (produtoValue !== "todos" && produtoValue) {
    return ATIVIDADE_OPCOES.filter(atividade => 
      atividade.value === "todas" || atividade.value.startsWith(produtoValue + "-")
    );
  }
  
  return ATIVIDADE_OPCOES;
};

// Persistência local por Empresa + Aba
const FILTERS_STORAGE_PREFIX = "empresas_filtros_v1";
const makeStorageKey = (empresaId: string) => `${FILTERS_STORAGE_PREFIX}:${empresaId}`;
const defaultFiltersByTab = (): Record<AnexosTabKey, Filtro> => ({
  videos: { ...defaultFiltro },
  audios: { ...defaultFiltro },
  documentos: { ...defaultFiltro },
  formularios: { ...defaultFiltro },
});

function loadFiltersFromStorage(empresaId?: string | null): Record<AnexosTabKey, Filtro> | null {
  if (!empresaId) return null;
  try {
    const raw = localStorage.getItem(makeStorageKey(empresaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sanitização básica da estrutura
    if (parsed && typeof parsed === "object") {
      const result = defaultFiltersByTab();
      (Object.keys(result) as AnexosTabKey[]).forEach((tab) => {
        const v = parsed[tab];
        result[tab] = {
          produto: v?.produto ?? "",
          fase: v?.fase ?? "",
          atividade: v?.atividade ?? "",
        };
      });
      return result;
    }
  } catch {}
  return null;
}

function saveFiltersToStorage(empresaId: string, filtros: Record<AnexosTabKey, Filtro>) {
  try {
    const key = makeStorageKey(empresaId);
    localStorage.setItem(key, JSON.stringify(filtros));
  } catch (e) {
    // Evitar quebra caso localStorage esteja indisponível
    console.warn("Falha ao salvar filtros no localStorage", e);
  }
}

export function EmpresaDetails({ empresa, estrutura, onSalvarValor }: EmpresaDetailsProps) {
  console.log('🏢 [DEBUG] EmpresaDetails renderizado - empresa:', empresa?.id);
  
  // Estado para o carrossel de abas do header
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const currentTab = FIXED_TABS[currentTabIndex];
  const totalTabs = FIXED_TABS.length;
  const tabCounter = `${String(currentTabIndex + 1).padStart(2, "0")} de ${String(totalTabs).padStart(2, "0")}`;
  
  // Estado para a aba Anexos selecionada
  const [selectedAnexosTab, setSelectedAnexosTab] = useState<AnexosTabKey>("videos");

  // Filtros independentes por aba
  const [filtros, setFiltros] = useState<Record<AnexosTabKey, Filtro>>(defaultFiltersByTab());
  
  // Estado para o modal de upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<AnexosTabKey, any[]>>({
    videos: [],
    audios: [],
    documentos: [],
    formularios: []
  });
  
  console.log('🎥 [DEBUG] Estado atual uploadedFiles:', uploadedFiles);
  
  // Estado para metadados de arquivos
  const [fileMetadata, setFileMetadata] = useState<Record<number, { produto: string; fase: string; atividade: string }>>({})
  // Seleção de arquivo para a barra de edição
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  
  // Estados para seleção múltipla
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  
  // Modais de ação
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCacheManagerOpen, setIsCacheManagerOpen] = useState(false);
  const updateFiltro = (tab: AnexosTabKey, patch: Partial<Filtro>) => {
    setFiltros((prev) => {
      const newFiltros = { ...prev, [tab]: { ...prev[tab], ...patch } };
      
      // Lógica hierárquica dos dropdowns
      if (patch.produto !== undefined) {
        if (patch.produto === 'todos') {
          // Produto "Todos" -> Fase e Atividade ficam "Todas"
          newFiltros[tab].fase = 'todas';
          newFiltros[tab].atividade = 'todas';
        } else {
          // Produto específico selecionado -> filtrar fases e atividades
          const fasesFiltradas = getFilteredFases(patch.produto);
          const atividadesFiltradas = getFilteredAtividades(patch.produto, 'todas');
          
          // Se a fase atual não pertence ao produto selecionado, resetar para "Todas"
          if (newFiltros[tab].fase !== 'todas' && !fasesFiltradas.includes(newFiltros[tab].fase)) {
            newFiltros[tab].fase = 'todas';
          }
          
          // Se a atividade atual não pertence ao produto selecionado, resetar para "Todas"
          if (newFiltros[tab].atividade !== 'todas' && !atividadesFiltradas.includes(newFiltros[tab].atividade)) {
            newFiltros[tab].atividade = 'todas';
          }
        }
      }
      
      if (patch.fase !== undefined) {
        if (patch.fase === 'todas') {
          // Fase "Todas" -> Atividade fica "Todas"
          newFiltros[tab].atividade = 'todas';
        } else {
          // Fase específica selecionada -> preencher produto automaticamente
          const produtoVinculado = extractProdutoFromFase(patch.fase);
          if (produtoVinculado && newFiltros[tab].produto === 'todos') {
            newFiltros[tab].produto = produtoVinculado;
          }
          
          // Filtrar atividades da fase selecionada
          const atividadesFiltradas = getFilteredAtividades(newFiltros[tab].produto, patch.fase);
          
          // Se a atividade atual não pertence à fase selecionada, resetar para "Todas"
          if (newFiltros[tab].atividade !== 'todas' && !atividadesFiltradas.includes(newFiltros[tab].atividade)) {
            newFiltros[tab].atividade = 'todas';
          }
        }
      }
      
      if (patch.atividade !== undefined) {
        if (patch.atividade !== 'todas') {
          // Atividade específica selecionada -> preencher produto e fase automaticamente
          const produtoVinculado = extractProdutoFromAtividade(patch.atividade);
          const faseVinculada = extractFaseFromAtividade(patch.atividade);
          
          if (produtoVinculado) {
            newFiltros[tab].produto = produtoVinculado;
          }
          
          if (faseVinculada) {
            newFiltros[tab].fase = faseVinculada;
          }
        }
      }
      
      return newFiltros;
    });
  };

  // Handlers para a EditBar
  const handleRenameRequest = () => {
    setIsRenameOpen(true);
  };

  const handleRenameSave = (newName: string) => {
    if (selectedFileId) {
      setUploadedFiles(prev => ({
        ...prev,
        [selectedAnexosTab]: prev[selectedAnexosTab].map(file => 
          file.id === selectedFileId ? { ...file, name: newName } : file
        )
      }));
    }
    setIsRenameOpen(false);
  };

  const handleShareRequest = () => {
    setIsShareOpen(true);
  };

  const handleLinkRequest = () => {
    setIsLinkOpen(true);
  };

  const handleLinkSave = (linkData: { produto: string; fase: string; atividade: string }) => {
    console.log('🔗 [DEBUG] Link salvo:', linkData);
    
    if (selectedFileId) {
      // Atualizar os metadados do arquivo específico
      setFileMetadata(prev => ({
        ...prev,
        [selectedFileId]: {
          produto: linkData.produto,
          fase: linkData.fase,
          atividade: linkData.atividade
        }
      }));
      
      console.log('🔗 [DEBUG] Metadados atualizados para arquivo ID:', selectedFileId);
    }
    
    setIsLinkOpen(false);
  };

  const handleDownload = () => {
    if (selectedFileId) {
      const file = uploadedFiles[selectedAnexosTab].find(f => f.id === selectedFileId);
      
      console.log('📥 [DEBUG] Tentativa de download:', {
        fileId: selectedFileId,
        file: file,
        hasFile: !!file,
        hasFileObject: !!(file && file.__file),
        fileObjectType: file && file.__file ? typeof file.__file : 'undefined',
        isFileInstance: file && file.__file instanceof File
      });
      
      if (file) {
        // Verificar se file.__file existe e é uma instância válida de File
        if (file.__file && file.__file instanceof File) {
          try {
            const url = URL.createObjectURL(file.__file);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('✅ [DEBUG] Download realizado com sucesso');
          } catch (error) {
            console.error('❌ [DEBUG] Erro ao criar URL do objeto:', error);
            alert('Erro ao baixar o arquivo. Tente novamente.');
          }
        } else {
          console.warn('⚠️ [DEBUG] Arquivo não possui objeto File válido:', {
            fileName: file.name,
            fileObject: file.__file,
            fileType: typeof file.__file
          });
          alert('Este arquivo não pode ser baixado pois foi carregado de uma sessão anterior. Por favor, faça o upload novamente.');
        }
      } else {
        console.error('❌ [DEBUG] Arquivo não encontrado para ID:', selectedFileId);
        alert('Arquivo não encontrado.');
      }
    }
  };

  const handleDeleteRequest = () => {
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedFileId) {
      setUploadedFiles(prev => ({
        ...prev,
        [selectedAnexosTab]: prev[selectedAnexosTab].filter(file => file.id !== selectedFileId)
      }));
      setSelectedFileId(null);
    }
    setIsDeleteOpen(false);
  };

  // Handlers para seleção múltipla
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedFiles(new Set());
    setSelectedFileId(null);
  };

  const handleSelectAll = () => {
    const currentFiles = uploadedFiles[selectedAnexosTab] || [];
    const allFileIds = new Set(currentFiles.map(file => file.id));
    setSelectedFiles(allFileIds);
  };

  const handleDeselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleFileSelection = (fileId: number, isSelected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(fileId);
      } else {
        newSet.delete(fileId);
      }
      return newSet;
    });
  };

  // Obter arquivo selecionado para os modais
  const selectedFile = selectedFileId 
    ? uploadedFiles[selectedAnexosTab].find(f => f.id === selectedFileId)
    : null;

  // Carregar filtros persistidos quando a empresa mudar
  useEffect(() => {
    console.log('🔄 [DEBUG] useEffect - empresa mudou:', empresa?.id);
    const loaded = loadFiltersFromStorage(empresa?.id || null);
    console.log('📂 [DEBUG] Filtros carregados do localStorage:', loaded);
    if (loaded) {
      setFiltros(loaded);
      console.log('✅ [DEBUG] Filtros aplicados:', loaded);
    } else {
      const defaultFilters = defaultFiltersByTab();
      setFiltros(defaultFilters);
      console.log('🔧 [DEBUG] Filtros padrão aplicados:', defaultFilters);
    }

    const loadVideosFromIndexedDB = async () => {
      if (!empresa?.id) {
        console.log('🎥 [DEBUG] Nenhuma empresa selecionada, limpando vídeos');
        setUploadedFiles({
          videos: [],
          audios: [],
          documentos: [],
          formularios: []
        });
        return;
      }

      console.log('🎥 [DEBUG] Carregando vídeos do IndexedDB para empresa:', empresa.id);
      
      try {
        // Carregar dados de vídeos do IndexedDB usando localStorage como fallback
        const videosData = JSON.parse(localStorage.getItem(`empresa_${empresa.id}_videos`) || '[]');
        const audiosData = JSON.parse(localStorage.getItem(`empresa_${empresa.id}_audios`) || '[]');
        const documentosData = JSON.parse(localStorage.getItem(`empresa_${empresa.id}_documentos`) || '[]');
        const formulariosData = JSON.parse(localStorage.getItem(`empresa_${empresa.id}_formularios`) || '[]');
        
        console.log('🎥 [DEBUG] Dados carregados:', {
          videos: videosData?.length || 0,
          audios: audiosData?.length || 0,
          documentos: documentosData?.length || 0,
          formularios: formulariosData?.length || 0
        });
        
        // Limpar thumbnails de arquivos que não têm __file válido (perdidos no localStorage)
        const cleanInvalidThumbnails = (files: any[]) => {
          return files.map((file: any) => {
            if (!file.__file || !(file.__file instanceof File)) {
              console.log('🧹 [DEBUG] Limpando thumbnail de arquivo inválido:', file.name);
              return { ...file, thumb: undefined };
            }
            return file;
          });
        };
        
        setUploadedFiles({
          videos: cleanInvalidThumbnails(videosData || []),
          audios: cleanInvalidThumbnails(audiosData || []),
          documentos: cleanInvalidThumbnails(documentosData || []),
          formularios: cleanInvalidThumbnails(formulariosData || [])
        });
        
        console.log('✅ [DEBUG] Dados de vídeos carregados com sucesso');
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao carregar dados do IndexedDB:', error);
        // Em caso de erro, inicializar com arrays vazios
        setUploadedFiles({
          videos: [],
          audios: [],
          documentos: [],
          formularios: []
        });
      }
    };

    loadVideosFromIndexedDB();
  }, [empresa?.id]);

  // NOVO: Salvar uploadedFiles no IndexedDB quando mudarem
  useEffect(() => {
    const saveUploadedFilesToIndexedDB = async () => {
      if (!empresa?.id) {
        console.log('💾 [DEBUG] Nenhuma empresa selecionada, não salvando arquivos');
        return;
      }

      console.log('💾 [DEBUG] Salvando arquivos no IndexedDB para empresa:', empresa.id);
      console.log('💾 [DEBUG] Dados a salvar:', {
        videos: uploadedFiles.videos?.length || 0,
        audios: uploadedFiles.audios?.length || 0,
        documentos: uploadedFiles.documentos?.length || 0,
        formularios: uploadedFiles.formularios?.length || 0
      });
      
      try {
        // Salvar cada categoria separadamente no localStorage
        localStorage.setItem(`empresa_${empresa.id}_videos`, JSON.stringify(uploadedFiles.videos || []));
        localStorage.setItem(`empresa_${empresa.id}_audios`, JSON.stringify(uploadedFiles.audios || []));
        localStorage.setItem(`empresa_${empresa.id}_documentos`, JSON.stringify(uploadedFiles.documentos || []));
        localStorage.setItem(`empresa_${empresa.id}_formularios`, JSON.stringify(uploadedFiles.formularios || []));
        
        console.log('✅ [DEBUG] Arquivos salvos com sucesso no IndexedDB');
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao salvar arquivos no IndexedDB:', error);
      }
    };

    // Só salvar se temos uma empresa selecionada e dados para salvar
    if (empresa?.id && uploadedFiles) {
      saveUploadedFilesToIndexedDB();
    }
  }, [empresa?.id, uploadedFiles]);

  // Header interno exclusivo para a aba "Formulários" (estrutura dinâmica)
  const [abaAtual, setAbaAtual] = useState<string | null>(null);
  const innerTabsScrollRef = useRef<HTMLDivElement>(null);

  const abas = estrutura.abas;
  const abaSelecionada = useMemo(() => {
    if (!abas.length) return null;
    const id = abaAtual || abas[0]?.id || null;
    return abas.find((a) => a.id === id) || null;
  }, [abaAtual, abas]);

  const innerScrollTabs = (direction: "left" | "right") => {
    if (innerTabsScrollRef.current) {
      const delta = direction === "left" ? -240 : 240;
      innerTabsScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  const totalAbas = abas.length;
  const indiceAtual = Math.max(0, abas.findIndex((a) => (abaSelecionada?.id || "") === a.id));
  const contadorInternoTexto = `${String(indiceAtual + 1).padStart(2, "0")} de ${String(totalAbas).padStart(2, "0")}`;

  // Caso nenhuma empresa esteja selecionada, manter consistência visual com o container branco
  if (!empresa) {
    return (
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-3">🏢</div>
            <p>Selecione uma empresa para visualizar os detalhes</p>
          </div>
        </div>
      </div>
    );
  }

  // Componente interno: filtros horizontais
  const Filtros = ({ tabKey }: { tabKey: AnexosTabKey }) => {
    const currentFiltro = filtros[tabKey];
    
    // Calcular opções filtradas dinamicamente
    const fasesFiltradas = getFilteredFases(currentFiltro.produto);
    const atividadesFiltradas = getFilteredAtividades(currentFiltro.produto, currentFiltro.fase);
    
    return (
      <div className="flex flex-col md:flex-row items-start justify-center gap-3 mb-0 w-full min-h-[60px]">
        {/* Dropdown Produto */}
        <div className="flex flex-col w-full md:flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 text-left pl-[5px]">Produto</label>
          <div className="w-full">
            <DropdownCustomizado
              value={currentFiltro.produto}
              onChange={(v) => updateFiltro(tabKey, { produto: v })}
              options={PRODUTO_OPCOES}
            />
          </div>
        </div>

        {/* Dropdown Fase */}
        <div className="flex flex-col w-full md:flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 text-left pl-[5px]">Fase</label>
          <div className="w-full">
            <DropdownCustomizado
              value={currentFiltro.fase}
              onChange={(v) => updateFiltro(tabKey, { fase: v })}
              options={fasesFiltradas}
            />
          </div>
        </div>

        {/* Dropdown Atividade */}
        <div className="flex flex-col w-full md:flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 text-left pl-[5px]">Atividade</label>
          <div className="w-full">
            <DropdownCustomizado
              value={currentFiltro.atividade}
              onChange={(v) => updateFiltro(tabKey, { atividade: v })}
              options={atividadesFiltradas}
            />
          </div>
        </div>
      </div>
    );
  };

  // Utilitário: gerar miniatura (thumbnail) a partir do arquivo de vídeo
  const generateVideoThumbnail = (file: File): Promise<string> => {
    const DEBUG_THUMBS = true; // logs de depuração temporários
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.muted = true;
      (video as any).playsInline = true;

      let finished = false;
      let timeoutId: number | undefined;

      const log = (...args: any[]) => { if (DEBUG_THUMBS) console.debug('[thumb]', ...args); };

      const resolveOnce = (v: string) => {
        if (finished) return; finished = true; log('resolve'); cleanup(true); resolve(v);
      };
      const rejectOnce = (e: any) => {
        if (finished) return; finished = true; log('reject', e); cleanup(false); reject(e);
      };

      const cleanup = (ok: boolean) => {
        try { video.pause?.(); } catch {}
        try {
          video.removeEventListener('loadedmetadata', onLoadedMeta as any);
          video.removeEventListener('loadeddata', onLoadedData as any);
          video.removeEventListener('seeked', onSeeked as any);
        } catch {}
        video.onerror = null;
        // Importante: remover src e forçar load antes de revogar o URL
        try { video.removeAttribute('src'); video.load(); } catch {}
        if (timeoutId) window.clearTimeout(timeoutId);
        // Para evitar net::ERR_ABORTED em alguns navegadores/HMR, atrasar a revogação
        // Em casos extremos, a revogação prematura cancela leituras pendentes do blob
        // e gera o erro no console. Um pequeno atraso (ou idle) resolve.
        const revoke = () => { try { URL.revokeObjectURL(url); log('revoke'); } catch {} };
        // Se disponível, usar requestIdleCallback; senão, atrasar 1500ms
        // @ts-ignore
        if (typeof window.requestIdleCallback === 'function') {
          // @ts-ignore
          window.requestIdleCallback(revoke, { timeout: 2000 });
        } else {
          window.setTimeout(revoke, ok ? 1500 : 2500);
        }
      };

      const captureFrame = () => {
        try {
          const vw = Math.max(1, video.videoWidth || 320);
          const vh = Math.max(1, video.videoHeight || 180);
          const canvas = document.createElement('canvas');
          canvas.width = vw;
          canvas.height = vh;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');
          ctx.drawImage(video, 0, 0, vw, vh);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          log('captured', { vw, vh });
          resolveOnce(dataUrl);
        } catch (e) {
          rejectOnce(e);
        }
      };

      const onSeeked = () => { log('seeked'); captureFrame(); };
      const onLoadedMeta = () => {
        try {
          const d = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          const pos = d ? Math.min(1, d * 0.1) : 0; // usa ~10% do vídeo, ou 0s se duração indisponível
          log('loadedmetadata', { duration: d, pos });
          video.currentTime = pos;
        } catch (e) {
          log('seek on metadata failed', e);
          // fallback será tratado por loadeddata/timeout
        }
      };
      const onLoadedData = () => {
        log('loadeddata');
        // Se seek não disparar a tempo, captura o primeiro frame após pequeno atraso
        if (!timeoutId) {
          timeoutId = window.setTimeout(() => {
            if (!finished) captureFrame();
          }, 1000);
        }
      };

      video.addEventListener('loadedmetadata', onLoadedMeta, { once: true });
      video.addEventListener('loadeddata', onLoadedData, { once: true });
      video.addEventListener('seeked', onSeeked, { once: true });
      video.onerror = () => {
        const err = (video as any).error; // MediaError
        log('video.onerror', err);
        rejectOnce(new Error('Falha ao carregar vídeo para gerar thumbnail'));
      };

      log('start', { url, name: file.name, size: file.size, type: file.type });
    });
  };

  // Função para lidar com upload de arquivos
  const handleUpload = async (files: File[], metadata: any) => {
    const newFiles = files.map((file) => {
      const fileId = Date.now() + Math.random();
      
      // Usar os metadados vindos do UploadModal
      const fileMetadataObj = {
        produto: metadata.produto,
        fase: metadata.fase,
        atividade: metadata.atividade
      };
      
      setFileMetadata(prev => ({
        ...prev,
        [fileId]: fileMetadataObj
      }));
      
      const fileObj = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        metadata: fileMetadataObj,
        uploadDate: new Date().toISOString(),
        __file: file as File,
        thumb: undefined as string | undefined,
      };
      
      return fileObj;
    });

    // Adiciona imediatamente (sem thumbnail) para feedback instantâneo
    setUploadedFiles((prev) => ({
      ...prev,
      [selectedAnexosTab]: [...prev[selectedAnexosTab], ...newFiles],
    }));

    // Gera thumbnails apenas para vídeos
    if (selectedAnexosTab === 'videos') {
      for (const f of newFiles) {
        if (f.type?.startsWith('video/')) {
          // Validar se f.__file existe e é uma instância válida de File
          if (!f.__file || !(f.__file instanceof File)) {
            continue;
          }
          
          try {
            const thumb = await generateVideoThumbnail(f.__file);
            setUploadedFiles((prev) => ({
              ...prev,
              [selectedAnexosTab]: prev[selectedAnexosTab].map((it: any) =>
                it.id === f.id ? { ...it, thumb } : it
              ),
            }));
          } catch (error) {
            // mantém sem thumbnail se falhar
          }
        }
      }
    }
  };

  // Renderizador do conteúdo da aba Anexos
  const renderConteudoAnexos = () => {
    if (selectedAnexosTab === "formularios") {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Header interno com carrossel de abas da estrutura */}
          <div className="flex items-center justify-between bg-[#F5F7FB] border border-[#E5E7EB] rounded-[8px] h-[48px] px-2 shadow-sm mb-3">
            <button
              className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] hover:bg-white border border-transparent hover:border-[#E5E7EB]"
              onClick={() => innerScrollTabs("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
            </button>

            <div className="flex-1 overflow-hidden">
              <div ref={innerTabsScrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
                {abas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAbaAtual(a.id)}
                    className={`whitespace-nowrap px-3 h-[32px] rounded-[6px] text-[13px] font-medium border transition-colors ${
                      abaSelecionada?.id === a.id
                        ? "bg-white text-[#111827] border-[#D1D5DB] shadow-sm"
                        : "bg-transparent text-[#6B7280] border-transparent hover:bg-white hover:border-[#E5E7EB]"
                    }`}
                    title={a.nome}
                  >
                    {a.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#6B7280] font-medium w-[60px] text-right">{contadorInternoTexto}</span>
              <button
                className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] hover:bg-white border border-transparent hover:border-[#E5E7EB]"
                onClick={() => innerScrollTabs("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
          </div>

          {/* Conteúdo da aba selecionada da estrutura */}
          <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] p-[10px]">
            {abaSelecionada ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {abaSelecionada.campos.map((campo) => {
                  const valor = empresa.dados?.[abaSelecionada.id]?.[campo.id] ?? "";
                  return (
                    <FieldRenderer
                      key={campo.id}
                      abaId={abaSelecionada.id}
                      campo={campo}
                      valor={valor}
                      onChange={(v) => onSalvarValor(abaSelecionada.id, campo.id, v)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Nenhuma aba cadastrada na estrutura.</div>
            )}
          </div>
        </div>
      );
    }

    // Outras telas: renderizar arquivos ou placeholder
    const allFiles = uploadedFiles[selectedAnexosTab];
    const currentFiltro = filtros[selectedAnexosTab];
    
    // Filtrar arquivos baseado nos metadados
    const files = allFiles.filter(file => {
      const fileMeta = fileMetadata[file.id] || file.metadata || {};
      
      // NOVO: Se todos os filtros estiverem vazios (apenas placeholders), não mostrar nenhum arquivo
      if (!currentFiltro.produto && !currentFiltro.fase && !currentFiltro.atividade) {
        return false;
      }
      
      // Se produto for "todos" ou vazio, mostrar todos
      if (currentFiltro.produto === 'todos' || !currentFiltro.produto) return true;
      if (currentFiltro.produto && fileMeta.produto !== currentFiltro.produto) return false;
      
      // Se fase for "todas" ou vazio, mostrar todos (desde que produto coincida)
      if (currentFiltro.fase === 'todas' || !currentFiltro.fase) return true;
      if (currentFiltro.fase && fileMeta.fase !== currentFiltro.fase) return false;
      
      // Se atividade for "todas" ou vazio, mostrar todos (desde que produto e fase coincidam)
      if (currentFiltro.atividade === 'todas' || !currentFiltro.atividade) return true;
      if (currentFiltro.atividade && fileMeta.atividade !== currentFiltro.atividade) return false;
      
      return true;
    });
    
    if (files.length === 0) {
      return (
        <div className="bg-white rounded-[8px] my-[10px] flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">
              {ANEXOS_TABS.find((t) => t.key === selectedAnexosTab)?.label}
            </div>
            <div className="text-sm mb-4">Nenhum arquivo encontrado</div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors"
            >
              Adicionar primeiro arquivo
            </button>
          </div>
        </div>
      );
    }

    return (
       <div className="bg-white rounded-[8px] my-[10px] pt-[2px] flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
         <div className="flex items-start gap-2 pl-[10px]">
           {/* Barra de edição fixa (sticky) à esquerda */}
           <div className="sticky top-0 self-start">
             <EditBar
               onRename={handleRenameRequest}
               onShare={handleShareRequest}
               onLink={handleLinkRequest}
               onDownload={handleDownload}
               onDelete={handleDeleteRequest}
               disabled={!selectedFileId && !isMultiSelectMode}
               isMultiSelectMode={isMultiSelectMode}
               onToggleMultiSelect={handleToggleMultiSelect}
               onSelectAll={handleSelectAll}
               onDeselectAll={handleDeselectAll}
               hasSelectedItems={selectedFiles.size > 0}
             />
           </div>

           {/* Grade de cards */}
           <div className="flex-1">
             {/* Exibição estilo Windows Explorer - miniatura com foto do vídeo como capa */}
             <div 
               className="grid grid-cols-[repeat(auto-fill,98px)] justify-start gap-[10px]"
               onClick={(e) => {
                 // Se o clique foi no contêiner da grade (não em um card), desseleciona
                 if (e.target === e.currentTarget) {
                   setSelectedFileId(null);
                 }
               }}
             >
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className="group cursor-pointer select-none flex flex-col items-center w-[98px] rounded-lg p-0 transition-all duration-200 relative"
                     title={file.name}
                     onClick={(e) => {
                       e.stopPropagation(); // Evita que o clique propague para o contêiner
                       if (isMultiSelectMode) {
                         const isSelected = selectedFiles.has(file.id);
                         handleFileSelection(file.id, !isSelected);
                       } else {
                         setSelectedFileId(file.id);
                       }
                     }}
                  >
                   {/* Checkbox para seleção múltipla */}
                   {isMultiSelectMode && (
                     <div className="absolute top-2 left-2 z-10">
                       <div className={`w-5 h-5 rounded-md border-[1px] flex items-center justify-center transition-all duration-200 shadow-sm ${
                         selectedFiles.has(file.id) 
                           ? 'bg-[#1777CF] border-[#1777CF] text-white scale-110' 
                           : 'bg-white/90 border-gray-400 hover:border-[#1777CF] hover:bg-white backdrop-blur-sm'
                       }`}>
                         {selectedFiles.has(file.id) && (
                           <Check className="w-3 h-3 stroke-[2.5]" />
                         )}
                       </div>
                     </div>
                   )}
                   {/* Miniatura estilo Windows Explorer com frame do vídeo */}
                    <div className="relative mb-2">
                      <div className={`w-[96px] h-[96px] bg-white rounded-[6px] overflow-hidden shadow-sm transition-all ${
                        (isMultiSelectMode && selectedFiles.has(file.id)) || selectedFileId === file.id 
                          ? 'ring-[1.5px] ring-[#1777CF]' 
                          : ''
                      }`}>
                       {selectedAnexosTab === 'videos' ? (
                         file.thumb && file.__file ? (
                           <img src={file.thumb} alt={file.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                             <div className="text-3xl">🎬</div>
                           </div>
                         )
                       ) : selectedAnexosTab === 'audios' ? (
                         <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                           <div className="text-3xl">🎵</div>
                         </div>
                       ) : selectedAnexosTab === 'documentos' ? (
                         <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                           <div className="text-3xl">📄</div>
                         </div>
                       ) : (
                         <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center relative">
                           <div className="text-3xl">📝</div>
                         </div>
                       )}
                       {selectedAnexosTab === 'videos' && (
                         <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] leading-none px-1 py-[2px] rounded">MP4</div>
                       )}
                     </div>
                   </div>
                   <div className="text-xs text-gray-700 text-center w-[98px] truncate" title={file.name}>
                     {file.name}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>
     );
  };

  // Retorno principal: todo conteúdo no container branco com borda cinza clara
  return (
    <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden" data-section="empresas">
      <div className="flex-1 bg-white rounded-[8px] flex flex-col overflow-hidden">
        {/* Header com carrossel de abas */}
        <div className="flex items-center justify-between bg-white h-[48px] px-3">
          {/* Abas centralizadas */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {FIXED_TABS.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTabIndex(index)}
                  className={`px-3 h-[32px] rounded-[6px] text-[13px] font-medium border transition-colors ${
                    index === currentTabIndex
                      ? "bg-white text-[#111827] border-[#D1D5DB] shadow-sm"
                      : "bg-transparent text-[#6B7280] border-transparent hover:bg-white hover:border-[#E5E7EB]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Controles de navegação à direita */}
          <div className="flex items-center gap-2">
            <button
              className={`w-[32px] h-[32px] flex items-center justify-center rounded-[6px] border transition-colors ${
                totalTabs <= 1 || currentTabIndex === 0
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50"
              }`}
              onClick={() => currentTabIndex > 0 && setCurrentTabIndex(currentTabIndex - 1)}
              disabled={totalTabs <= 1 || currentTabIndex === 0}
              aria-label="Aba anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-[12px] text-[#6B7280] font-medium min-w-[50px] text-center">
              {tabCounter}
            </span>
            
            <button
              className={`w-[32px] h-[32px] flex items-center justify-center rounded-[6px] border transition-colors ${
                totalTabs <= 1 || currentTabIndex === totalTabs - 1
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50"
              }`}
              onClick={() => currentTabIndex < totalTabs - 1 && setCurrentTabIndex(currentTabIndex + 1)}
              disabled={totalTabs <= 1 || currentTabIndex === totalTabs - 1}
              aria-label="Próxima aba"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha divisória horizontal */}
        <div className="w-full h-[1px] bg-[#E5E7EB]"></div>

        {/* Renderizar conteúdo baseado na aba atual */}
          {currentTab.key === "anexos" ? (
            <>
              {/* Filtros horizontais */}
              <div className="p-3 border-b border-[#E5E7EB] flex items-center">
                <Filtros tabKey={selectedAnexosTab} />
              </div>

              {/* Sub-abas com contagem e botão + */}
              <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB]">
                {/* Tabs centralizadas */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-6">
                    {ANEXOS_TABS.map((tab) => {
                      // Calcular contagem real de arquivos aplicando a mesma lógica de filtragem
                      const allFiles = uploadedFiles[tab.key] || [];
                      const currentFiltro = filtros[tab.key];
                      
                      // Aplicar a mesma lógica de filtragem da função renderConteudoAnexos
                      const filteredFiles = allFiles.filter(file => {
                        const fileMeta = fileMetadata[file.id] || file.metadata || {};
                        
                        // Se todos os filtros estiverem vazios (apenas placeholders), não contar nenhum arquivo
                        if (!currentFiltro.produto && !currentFiltro.fase && !currentFiltro.atividade) {
                          return false;
                        }
                        
                        // Se produto for "todos" ou vazio, mostrar todos
                        if (currentFiltro.produto === 'todos' || !currentFiltro.produto) return true;
                        if (currentFiltro.produto && fileMeta.produto !== currentFiltro.produto) return false;
                        
                        // Se fase for "todas" ou vazio, mostrar todos (desde que produto coincida)
                        if (currentFiltro.fase === 'todas' || !currentFiltro.fase) return true;
                        if (currentFiltro.fase && fileMeta.fase !== currentFiltro.fase) return false;
                        
                        // Se atividade for "todas" ou vazio, mostrar todos (desde que produto e fase coincidam)
                        if (currentFiltro.atividade === 'todas' || !currentFiltro.atividade) return true;
                        if (currentFiltro.atividade && fileMeta.atividade !== currentFiltro.atividade) return false;
                        
                        return true;
                      });
                      
                      const realCount = filteredFiles.length;
                      
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setSelectedAnexosTab(tab.key)}
                          className={`text-[14px] font-medium transition-colors ${
                            selectedAnexosTab === tab.key
                              ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                              : "text-[#6B7280] hover:text-[#111827]"
                          }`}
                        >
                          {tab.label} ({realCount.toString().padStart(2, '0')})
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Botões à extrema direita */}
                <div className="flex items-center gap-2">
                  {/* Botão Cache Manager */}
                  <button 
                    onClick={() => setIsCacheManagerOpen(true)}
                    className="w-[32px] h-[32px] bg-[#6B46C1] text-white rounded-[6px] flex items-center justify-center hover:bg-[#553C9A] transition-colors"
                    title="Gerenciar Cache de Anexos"
                  >
                    <HardDrive className="w-4 h-4" />
                  </button>
                  
                  {/* Botão + */}
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="w-[32px] h-[32px] bg-[#1777CF] text-white rounded-[6px] flex items-center justify-center hover:bg-[#1565C0] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="text-center text-gray-500 py-8">
                <div className="text-lg font-medium mb-2">{currentTab.label}</div>
                <div className="text-sm">Conteúdo em desenvolvimento</div>
              </div>
            </div>
          )}

        {/* Conteúdo da aba selecionada */}
          <div className="flex-1 min-h-0 flex flex-col">
            {currentTab.key === "anexos" ? renderConteudoAnexos() : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-lg font-medium mb-2">Funcionalidade em desenvolvimento</div>
                <div className="text-sm">Esta seção será implementada em breve</div>
              </div>
            )}
          </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tabType={selectedAnexosTab}
        onUpload={handleUpload}
      />

      {/* Modais de Ação */}
      <RenameModal
        isOpen={isRenameOpen}
        currentName={selectedFile?.name || ''}
        onClose={() => setIsRenameOpen(false)}
        onSave={handleRenameSave}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        fileName={selectedFile?.name}
        fileUrl={selectedFile?.__file && selectedFile.__file instanceof File ? URL.createObjectURL(selectedFile.__file) : undefined}
      />

      <LinkModal
        isOpen={isLinkOpen}
        current={selectedFile ? (fileMetadata[selectedFile.id] || selectedFile.metadata || { produto: '', fase: '', atividade: '' }) : null}
        onClose={() => setIsLinkOpen(false)}
        onSave={handleLinkSave}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        message={`Tem certeza que deseja excluir "${selectedFile?.name || ''}"?`}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Cache Manager Modal */}
      <CacheManager
        isOpen={isCacheManagerOpen}
        onClose={() => setIsCacheManagerOpen(false)}
      />
    </div>
  );
}