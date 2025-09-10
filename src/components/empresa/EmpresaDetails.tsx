import React, { useMemo, useRef, useState, useEffect } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { Empresa, EstruturaEmpresas } from "./types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DropdownCustomizado from "../DropdownCustomizado";
import UploadModal from './UploadModal';

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

type FixedTabKey = typeof FIXED_TABS[number]["key"];
type AnexosTabKey = typeof ANEXOS_TABS[number]["key"];

type Filtro = { produto: string; fase: string; atividade: string };
const defaultFiltro: Filtro = { produto: "", fase: "", atividade: "" };

// Opções mockadas para os três filtros (poderão ser integradas futuramente)
const PRODUTO_OPCOES = [
  { value: "", label: "----------" },
  { value: "p1", label: "Todos" },
  { value: "p2", label: "Holding Patrimonial" },
  { value: "p3", label: "Ativos Fundiários" },
  { value: "p4", label: "Planejamento Tributário" },
];

const FASE_OPCOES = [
  { value: "", label: "----------" },
  { value: "f1", label: "Todas" },
  { value: "f2", label: "Fase 01" },
  { value: "f3", label: "Fase 02" },
  { value: "f4", label: "Fase 03" },
];

const ATIVIDADE_OPCOES = [
  { value: "", label: "----------" },
  { value: "a1", label: "Todas" },
  { value: "a2", label: "Atividade 01" },
  { value: "a3", label: "Atividade 02" },
  { value: "a4", label: "Atividade 03" },
];

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
  const updateFiltro = (tab: AnexosTabKey, patch: Partial<Filtro>) =>
    setFiltros((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));

  // Carregar filtros persistidos quando a empresa mudar
  useEffect(() => {
    const loaded = loadFiltersFromStorage(empresa?.id || null);
    if (loaded) setFiltros(loaded);
    else setFiltros(defaultFiltersByTab());
  }, [empresa?.id]);

  // Salvar filtros quando alterarem (associado à empresa)
  useEffect(() => {
    if (empresa?.id) saveFiltersToStorage(empresa.id, filtros);
  }, [empresa?.id, filtros]);

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
  const Filtros = ({ tabKey }: { tabKey: AnexosTabKey }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <DropdownCustomizado
        value={filtros[tabKey].produto}
        onChange={(v) => updateFiltro(tabKey, { produto: v })}
        options={PRODUTO_OPCOES}
        placeholder="Produto"
      />
      <DropdownCustomizado
        value={filtros[tabKey].fase}
        onChange={(v) => updateFiltro(tabKey, { fase: v })}
        options={FASE_OPCOES}
        placeholder="Fase"
      />
      <DropdownCustomizado
        value={filtros[tabKey].atividade}
        onChange={(v) => updateFiltro(tabKey, { atividade: v })}
        options={ATIVIDADE_OPCOES}
        placeholder="Atividade"
      />
    </div>
  );

  // Função para lidar com upload de arquivos
  const handleUpload = (files: File[], metadata: any) => {
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      metadata,
      uploadDate: new Date().toISOString()
    }));

    setUploadedFiles(prev => ({
      ...prev,
      [selectedAnexosTab]: [...prev[selectedAnexosTab], ...newFiles]
    }));
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
    const files = uploadedFiles[selectedAnexosTab];
    
    if (files.length === 0) {
      return (
        <div className="border border-[#E5E7EB] bg-white rounded-[8px] m-[10px] flex-1 min-h-0 flex items-center justify-center">
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
       <div className="border border-[#E5E7EB] bg-white rounded-[8px] m-[10px] flex-1 min-h-0 overflow-auto">
         {/* Exibição estilo Windows Explorer - miniatura com foto do vídeo como capa */}
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-[10px]">
           {files.map((file) => (
             <div 
               key={file.id} 
               className="group cursor-pointer select-none flex flex-col items-center hover:bg-blue-50 rounded-lg p-2 transition-all duration-200"
               title={file.name}
             >
               {/* Miniatura estilo Windows Explorer com foto do vídeo como capa */}
               <div className="relative mb-2">
                 <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 overflow-hidden group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                   {selectedAnexosTab === 'videos' ? (
                     <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center relative">
                       <div className="text-3xl">🎬</div>
                       <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">MP4</div>
                     </div>
                   ) : selectedAnexosTab === 'audios' ? (
                     <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                       <div className="text-3xl">🎵</div>
                       <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">MP3</div>
                     </div>
                   ) : selectedAnexosTab === 'documentos' ? (
                     <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                       <div className="text-3xl">📄</div>
                       <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">PDF</div>
                     </div>
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center relative">
                       <div className="text-3xl">📋</div>
                       <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">FORM</div>
                     </div>
                   )}
                 </div>
               </div>
               
               {/* Nome do arquivo abaixo da miniatura */}
               <div className="text-center w-full">
                 <div className="text-xs font-medium text-gray-900 leading-tight px-1">
                   <div className="truncate" title={file.name}>
                     {file.name.length > 14 ? `${file.name.substring(0, 11)}...` : file.name}
                   </div>
                 </div>
               </div>
             </div>
           ))}
         </div>
         
         {/* Informações de resumo simplificadas */}
         <div className="mt-6 pt-4 border-t border-gray-200">
           <div className="flex items-center justify-between text-sm text-gray-500">
             <span>{files.length} arquivo(s) encontrado(s)</span>
             <span>
               Total: {(files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(1)} MB
             </span>
           </div>
         </div>
       </div>
     );
  };

  // Retorno principal: todo conteúdo no container branco com borda cinza clara
  return (
    <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] flex flex-col overflow-hidden">
        {/* Header com carrossel de abas */}
        <div className="flex items-center justify-between bg-[#F5F7FB] border-b border-[#E5E7EB] h-[48px] px-3">
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

        {/* Renderizar conteúdo baseado na aba atual */}
          {currentTab.key === "anexos" ? (
            <>
              {/* Filtros horizontais */}
              <div className="p-3 border-b border-[#E5E7EB]">
                <Filtros tabKey={selectedAnexosTab} />
              </div>

              {/* Sub-abas com contagem e botão + */}
              <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB]">
                {/* Tabs centralizadas */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-6">
                    {ANEXOS_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedAnexosTab(tab.key)}
                        className={`text-[14px] font-medium transition-colors ${
                          selectedAnexosTab === tab.key
                            ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-1"
                            : "text-[#6B7280] hover:text-[#111827]"
                        }`}
                      >
                        {tab.label} ({tab.count.toString().padStart(2, '0')})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Botão + à extrema direita */}
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-[32px] h-[32px] bg-[#1777CF] text-white rounded-[6px] flex items-center justify-center hover:bg-[#1565C0] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
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
    </div>
  );
}