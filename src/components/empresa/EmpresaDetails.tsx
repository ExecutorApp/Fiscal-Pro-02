import React, { useMemo, useRef, useState, useEffect } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { Empresa, EstruturaEmpresas } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DropdownCustomizado from "../DropdownCustomizado";

interface EmpresaDetailsProps {
  empresa: Empresa | null;
  estrutura: EstruturaEmpresas;
  onSalvarValor: (abaId: string, campoId: string, valor: any) => void;
}

// Abas fixas solicitadas
const FIXED_TABS = [
  { key: "videos", label: "Vídeos" },
  { key: "audios", label: "Áudios" },
  { key: "documentos", label: "Documentos" },
  { key: "formularios", label: "Formulários" },
] as const;

type FixedTabKey = typeof FIXED_TABS[number]["key"];

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
const defaultFiltersByTab = (): Record<FixedTabKey, Filtro> => ({
  videos: { ...defaultFiltro },
  audios: { ...defaultFiltro },
  documentos: { ...defaultFiltro },
  formularios: { ...defaultFiltro },
});

function loadFiltersFromStorage(empresaId?: string | null): Record<FixedTabKey, Filtro> | null {
  if (!empresaId) return null;
  try {
    const raw = localStorage.getItem(makeStorageKey(empresaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sanitização básica da estrutura
    if (parsed && typeof parsed === "object") {
      const result = defaultFiltersByTab();
      (Object.keys(result) as FixedTabKey[]).forEach((tab) => {
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

function saveFiltersToStorage(empresaId: string, filtros: Record<FixedTabKey, Filtro>) {
  try {
    const key = makeStorageKey(empresaId);
    localStorage.setItem(key, JSON.stringify(filtros));
  } catch (e) {
    // Evitar quebra caso localStorage esteja indisponível
    console.warn("Falha ao salvar filtros no localStorage", e);
  }
}

export function EmpresaDetails({ empresa, estrutura, onSalvarValor }: EmpresaDetailsProps) {
  // Estado para o carrossel superior (abas fixas)
  const [topTabIndex, setTopTabIndex] = useState<number>(0);
  const totalFixed = FIXED_TABS.length;
  const currentTopTab = FIXED_TABS[topTabIndex];
  const contadorTopTexto = `${String(topTabIndex + 1).padStart(2, "0")} de ${String(totalFixed).padStart(2, "0")}`;

  // Filtros independentes por aba
  const [filtros, setFiltros] = useState<Record<FixedTabKey, Filtro>>(defaultFiltersByTab());
  const updateFiltro = (tab: FixedTabKey, patch: Partial<Filtro>) =>
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
  const Filtros = ({ tabKey }: { tabKey: FixedTabKey }) => (
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

  // Renderizadores das telas por aba fixa
  const renderConteudoAba = (tab: FixedTabKey) => {
    if (tab === "formularios") {
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
          <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] p-3">
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

    // Outras telas: placeholders funcionais (com filtros ativos na parte superior)
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="border border-[#E5E7EB] bg-white rounded-[8px] p-3 flex-1">
          <div className="text-sm text-gray-500">Tela de {FIXED_TABS.find((t) => t.key === tab)?.label} — em desenvolvimento.</div>
        </div>
      </div>
    );
  };

  // Retorno principal: todo conteúdo no container branco com borda cinza clara
  return (
    <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] flex flex-col overflow-hidden">
        {/* Header superior (layout Fill): abas à esquerda, navegação à direita */}
        <div className="flex items-center justify-between bg-[#FCFCFC] border border-[#E5E7EB] rounded-[8px] h-[48px] px-2 m-[12px]">
          <div className="flex items-center gap-2 justify-center overflow-x-auto no-scrollbar flex-1 pr-2">
            {FIXED_TABS.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => setTopTabIndex(idx)}
                className={`whitespace-nowrap px-3 h-[32px] rounded-[6px] text-[13px] font-medium border transition-colors ${
                  idx === topTabIndex
                    ? "bg-[#FCFCFC] text-[#111827] border-[#D1D5DB]"
                    : "bg-transparent text-[#6B7280] border-transparent hover:bg-white hover:border-[#E5E7EB]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0">
            <button
              className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] hover:bg-white border border-transparent hover:border-[#E5E7EB]"
              onClick={() => setTopTabIndex((i) => Math.max(0, i - 1))}
              aria-label="Aba anterior"
            >
              <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
            </button>
            <span className="text-[12px] text-[#6B7280] font-medium w-[60px] text-center">{contadorTopTexto}</span>
            <button
              className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] hover:bg-white border border-transparent hover:border-[#E5E7EB]"
              onClick={() => setTopTabIndex((i) => Math.min(totalFixed - 1, i + 1))}
              aria-label="Próxima aba"
            >
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Conteúdo da aba selecionada dentro do container */}
        <div className="flex-1 p-[12px] pt-[0px] min-h-0">
          {/* Filtros padrão no topo de cada tela */}
          <Filtros tabKey={currentTopTab.key} />
          {renderConteudoAba(currentTopTab.key)}
        </div>
      </div>
    </div>
  );
}