import React, { useMemo, useState } from "react";
import { AbaDef, CampoDef, FieldType, EstruturaEmpresas } from "./types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X, ChevronLeft, ChevronRight, Calculator, FileText } from "lucide-react";

interface ManageStructureModalProps {
  open: boolean;
  onClose: () => void;
  estrutura: EstruturaEmpresas;
  onAdicionarAba: (nome: string) => void;
  onRenomearAba: (id: string, nome: string) => void;
  onRemoverAba: (id: string) => void;
  onMoverAba: (id: string, dir: -1 | 1) => void;
  onAdicionarCampo: (abaId: string, campo: CampoDef) => void;
  onAtualizarCampo: (abaId: string, campoId: string, patch: Partial<CampoDef>) => void;
  onRemoverCampo: (abaId: string, campoId: string) => void;
  onMoverCampo: (abaId: string, campoId: string, dir: -1 | 1) => void;
}

// --- Carrossel (ÚNICA LINHA) dos 6 tipos solicitados ---
const tiposCampo: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "numericos", label: "Campos\nNuméricos", icon: <Calculator size={20} className="text-blue-600" /> },
  { value: "texto", label: "Texto\n( curto / longo )", icon: <FileText size={20} className="text-blue-600" /> },
  { value: "data", label: "Data", icon: <FileText size={20} className="text-blue-600" /> },
  { value: "dropdown", label: "Dropdown", icon: <FileText size={20} className="text-blue-600" /> },
  { value: "radio", label: "Radio\n(Única escolha)", icon: <FileText size={20} className="text-blue-600" /> },
  { value: "checkbox", label: "Checkbox\n(Múltipla escolha)", icon: <FileText size={20} className="text-blue-600" /> },
];

// --- Opções por tipo conforme solicitado ---
const opcoesPorTipo: Record<string, { value: FieldType; label: string; numero: string }[]> = {
  texto: [
    { value: "text_short", label: "Curto", numero: "01" },
    { value: "text_long", label: "Longo", numero: "02" },
  ],
  data: [
    { value: "date", label: "Datas", numero: "01" },
  ],
  numericos: [
    { value: "cpf_cnpj", label: "CPF ou CNPJ", numero: "01" },
    { value: "cpf", label: "CPF", numero: "02" },
    { value: "cnpj", label: "CNPJ", numero: "03" },
    { value: "telefone", label: "Telefone", numero: "04" },
    { value: "cep", label: "CEP", numero: "05" },
    { value: "integer", label: "Números inteiros", numero: "06" },
    { value: "integer_text", label: "Números inteiros + Letras", numero: "07" },
    { value: "regras_negocio", label: "Regras de Negócio", numero: "08" },
    { value: "ie", label: "Inscrição Estadual", numero: "09" },
    { value: "im", label: "Inscrição Municipal", numero: "10" },
  ],
  dropdown: [
    { value: "select", label: "Dropdown (Menu Suspenso)", numero: "01" },
  ],
  radio: [
    { value: "radio", label: "Radio", numero: "01" },
  ],
  checkbox: [
    { value: "checkbox", label: "Checkbox", numero: "01" },
  ],
};

// Helpers para rótulos e placeholders
const tipoParaLabel = (t: FieldType) => {
  for (const key of Object.keys(opcoesPorTipo)) {
    const found = opcoesPorTipo[key].find((o) => o.value === t);
    if (found) return found.label;
  }
  return String(t);
};

const placeholderPadrao = (t: FieldType, label: string) => {
  switch (t) {
    case "select":
    case "radio":
      return "Selecione";
    case "checkbox":
      return "";
    default:
      return `Digite ${label.toLowerCase()}`;
  }
};

export function ManageStructureModal({
  open,
  onClose,
  estrutura,
  onAdicionarAba,
  onRenomearAba,
  onRemoverAba,
  onMoverAba,
  onAdicionarCampo,
  onAtualizarCampo,
  onRemoverCampo,
  onMoverCampo,
}: ManageStructureModalProps) {
  const [nomeAba, setNomeAba] = useState("");
  const [abaSelecionadaId, setAbaSelecionadaId] = useState<string | null>(estrutura.abas[0]?.id || null);
  const [tipoSelecionado, setTipoSelecionado] = useState<number>(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Lista de opções da categoria selecionada
  const opcoesDaCategoria = useMemo(() => {
    const key = tiposCampo[tipoSelecionado]?.value;
    return opcoesPorTipo[key] || [];
  }, [tipoSelecionado]);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[ManageStructureModal] tipoSelecionado=", tipoSelecionado,
      "categoria=", tiposCampo[tipoSelecionado]?.value,
      "opcoesDaCategoria.count=", opcoesDaCategoria.length);
  }

  const abaSelecionada = useMemo(() => estrutura.abas.find(a => a.id === abaSelecionadaId) || null, [estrutura.abas, abaSelecionadaId]);

  const handleDragStart = (e: React.DragEvent, item: any) => {
    try {
      const payload = JSON.stringify(item);
      e.dataTransfer.setData('application/json', payload);
    } catch {
      // ignore json error
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.dropEffect = 'copy';
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[ManageStructureModal] handleDragStart', item);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    let item: any = null;
    const dataJson = e.dataTransfer.getData('application/json');
    if (dataJson) {
      try {
        item = JSON.parse(dataJson);
      } catch {
        item = draggedItem;
      }
    } else {
      item = draggedItem;
    }
    if (!item || !abaSelecionada) return;
    const label = item.label || 'Novo campo';
    const placeholder = placeholderPadrao(item.value as FieldType, label);
    const campo: CampoDef = { id: `tmp-${Date.now().toString(36)}`, tipo: item.value as FieldType, label, placeholder } as CampoDef;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[ManageStructureModal] handleDrop -> criando campo', campo);
    }
    onAdicionarCampo(abaSelecionada.id, campo);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[ManageStructureModal] handleDragEnd');
    }
    setDraggedItem(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-[1200px] max-w-[95vw] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 20px)', maxHeight: 'calc(100vh - 20px)' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h3 className="text-xl font-semibold text-gray-900">Gerenciar Estrutura</h3>
          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              + Nova Aba
            </Button>
            <Button variant="outline" className="px-4 py-2 rounded-lg border-gray-300">
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Salvar
            </Button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex" style={{ minHeight: 0, height: 'calc(100vh - 140px)' }}>
          {/* Menu Lateral Esquerdo - Tipos de Campos */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col" style={{ height: '100%' }}>
            {/* Navegação de Tipos */}
            <div className="px-4 py-6">
              {/* Topo com linhas */}
              <div className="flex flex-col items-stretch mb-4">
                <div className="flex justify-center items-center pb-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <div className="flex justify-center items-center py-1">
                  <div className="text-xs text-gray-500 font-normal text-center">
                    Tipos de campos ({String(tipoSelecionado + 1).padStart(2, "0")}/{String(tiposCampo.length).padStart(2, "0")})
                  </div>
                </div>
                <div className="flex justify-center items-center pt-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              </div>

              {/* Carrossel em ÚNICA LINHA com scroll horizontal */}
              <div className="relative">
                <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar px-1 py-2">
                  {tiposCampo.map((tipo, index) => (
                    <div
                      key={tipo.value}
                      className={`min-w-[140px] flex flex-col items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        tipoSelecionado === index ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setTipoSelecionado(index)}
                    >
                      <div className="flex items-center justify-center h-6">{tipo.icon}</div>
                      <span className="text-xs font-medium text-gray-700 text-center whitespace-pre-line leading-tight">{tipo.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Opções do Tipo Selecionado */}
            <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col border-t border-gray-200">
              <div className="flex flex-col items-stretch py-4">
                <div className="flex justify-center items-center pb-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <div className="flex justify-center items-center py-1">
                  <div className="text-xs text-gray-500 font-normal text-center">
                    Opções ({String(opcoesDaCategoria.length).padStart(2, "0")})
                  </div>
                </div>
                <div className="flex justify-center items-center pt-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100% - 60px)' }}>
                {opcoesDaCategoria.map((opcao, index) => (
                  <div
                    key={`${opcao.value}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opcao)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-move transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${index === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="w-px h-4 bg-gray-300"></div>
                    </div>
                    <span className={`text-sm font-medium ${index === 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                      {opcao.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Área Principal - Formulário */}
          <div className="flex-1 bg-gray-50 p-6 overflow-hidden flex flex-col" style={{ height: '100%' }}>
            {/* Cabeçalho fictício e área de drop permanecem iguais */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Dados principais (12)</span>
                  <span className="text-sm text-gray-400">Fases (19)</span>
                  <span className="text-sm text-gray-400">Atividades (180)</span>
                  <span className="text-sm text-blue-600 font-medium">Formulários (06)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-600">01 de 04</span>
                  <button className="p-1 text-gray-400">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-lg border-2 border-dashed border-gray-300 flex-1 p-6 overflow-y-auto relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{ minHeight: '300px' }}
            >
              {/* Conteúdo renderizado dos campos da aba selecionada */}
              <div className="space-y-4">
                {!abaSelecionada || abaSelecionada.campos.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-400">
                    Arraste opções da esquerda e solte aqui para criar campos.
                  </div>
                ) : (
                  abaSelecionada.campos.map((c, idx) => (
                    <div key={c.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {String(idx + 1).padStart(2, '0')} • {tipoParaLabel(c.tipo)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className={`p-1 rounded hover:bg-gray-100 ${idx === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={idx === 0}
                            onClick={() => abaSelecionada && onMoverCampo(abaSelecionada.id, c.id, -1)}
                            title="Mover para cima"
                          >
                            <ArrowUp size={16} className="text-gray-500" />
                          </button>
                          <button
                            className={`p-1 rounded hover:bg-gray-100 ${idx === (abaSelecionada?.campos.length || 1) - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={idx === (abaSelecionada?.campos.length || 1) - 1}
                            onClick={() => abaSelecionada && onMoverCampo(abaSelecionada.id, c.id, 1)}
                            title="Mover para baixo"
                          >
                            <ArrowDown size={16} className="text-gray-500" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-50"
                            onClick={() => abaSelecionada && onRemoverCampo(abaSelecionada.id, c.id)}
                            title="Remover campo"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-medium text-[#7D8592] mb-[6px] px-[6px] font-inter">Label</label>
                          <Input
                            value={c.label}
                            onChange={(e) => abaSelecionada && onAtualizarCampo(abaSelecionada.id, c.id, { label: e.target.value })}
                            placeholder="Rótulo do campo"
                            className="h-[40px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#7D8592] mb-[6px] px-[6px] font-inter">Placeholder</label>
                          <Input
                            value={c.placeholder ?? ''}
                            onChange={(e) => abaSelecionada && onAtualizarCampo(abaSelecionada.id, c.id, { placeholder: e.target.value })}
                            placeholder={placeholderPadrao(c.tipo, c.label)}
                            className="h-[40px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {draggedItem && (
                <div className="absolute inset-0 bg-blue-50/50 border-2 border-blue-300 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="text-blue-600 font-medium">Solte aqui para adicionar o campo</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}