import React, { useMemo, useRef, useState } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { Empresa, EstruturaEmpresas } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmpresaDetailsProps {
  empresa: Empresa | null;
  estrutura: EstruturaEmpresas;
  onSalvarValor: (abaId: string, campoId: string, valor: any) => void;
}

export function EmpresaDetails({ empresa, estrutura, onSalvarValor }: EmpresaDetailsProps) {
  const [abaAtual, setAbaAtual] = useState<string | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const abas = estrutura.abas;
  const abaSelecionada = useMemo(() => {
    if (!abas.length) return null;
    const id = abaAtual || abas[0]?.id || null;
    return abas.find((a) => a.id === id) || null;
  }, [abaAtual, abas]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      const delta = direction === "left" ? -240 : 240;
      tabsScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  if (!empresa) {
    return (
      <div className="w-[70%] bg-white flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p>Selecione uma empresa para visualizar os detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[70%] bg-white flex flex-col rounded-md border border-gray-200">
      {/* Barra de abas (estilo Figma) */}
      <div className="px-3 py-2 border-b bg-[#F8FAFC] flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollTabs("left")}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
          aria-label="Voltar abas"
          title="Voltar"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={tabsScrollRef}
          className="flex-1 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex items-center gap-2 min-w-max">
            {abas.map((a) => {
              const active = (abaSelecionada?.id || "") === a.id;
              const badge = (a as any).badgeCount as number | undefined;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAbaAtual(a.id)}
                  className={`h-8 px-3 rounded-md border text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                    active
                      ? "bg-white border-gray-300 text-gray-900 shadow-sm"
                      : "bg-transparent border-transparent text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-200"
                  }`}
                  role="tab"
                  aria-selected={active}
                >
                  <span className="truncate max-w-[220px]" title={a.nome}>{a.nome}</span>
                  {typeof badge === "number" && (
                    <span className={`text-[11px] leading-[18px] px-2 rounded-full ${
                      active ? "bg-blue-50 text-[#1777CF]" : "bg-gray-100 text-gray-600"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollTabs("right")}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
          aria-label="Avançar abas"
          title="Avançar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Conteúdo da aba selecionada */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}
      >
        {!abaSelecionada ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Nenhuma aba definida. Clique em "Gerenciar Estrutura" para criar abas e campos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abaSelecionada.campos.map((campo) => (
              <FieldRenderer
                key={campo.id}
                abaId={abaSelecionada.id}
                campo={campo}
                valor={empresa?.dados?.[abaSelecionada.id]?.[campo.id]}
                onChange={(v) => onSalvarValor(abaSelecionada.id, campo.id, v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}