import React, { useMemo, useState } from "react";
import { AbaDef, CampoDef, FieldType, EstruturaEmpresas } from "./types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";

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

const tiposCampo: { value: FieldType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "cep", label: "CEP" },
];

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

  const abaSelecionada = useMemo(() => estrutura.abas.find(a => a.id === abaSelecionadaId) || null, [estrutura.abas, abaSelecionadaId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h3 className="text-lg font-semibold">Gerenciar Estrutura</h3>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-0" style={{ minHeight: 0 }}>
          {/* 1. Gerenciamento de Abas */}
          <div className="border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex gap-2">
              <Input value={nomeAba} onChange={(e) => setNomeAba(e.target.value)} placeholder="Nome da nova aba" />
              <Button onClick={() => { if (nomeAba.trim()) { onAdicionarAba(nomeAba.trim()); setNomeAba(""); } }} className="bg-[#1777CF] hover:bg-[#1565C0]">
                <Plus size={16} />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {estrutura.abas.map((a, idx) => (
                <div key={a.id} className={`p-2 border rounded flex items-center justify-between ${a.id === abaSelecionadaId ? 'border-[#1777CF] bg-blue-50' : 'border-gray-200'}`}>
                  <button className="flex-1 text-left truncate" title={a.nome} onClick={() => setAbaSelecionadaId(a.id)}>
                    {a.nome}
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="p-1 hover:bg-gray-100 rounded" title="Mover para cima" onClick={() => onMoverAba(a.id, -1)}><ArrowUp size={14} /></button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Mover para baixo" onClick={() => onMoverAba(a.id, 1)}><ArrowDown size={14} /></button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Renomear" onClick={() => {
                      const novo = prompt("Novo nome da aba", a.nome);
                      if (novo && novo.trim()) onRenomearAba(a.id, novo.trim());
                    }}><Pencil size={14} /></button>
                    <button className="p-1 hover:bg-red-100 rounded text-red-600" title="Excluir aba" onClick={() => onRemoverAba(a.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Campos disponíveis */}
          <div className="border-r border-gray-200 p-4 overflow-y-auto">
            <h4 className="font-semibold mb-2">Campos disponíveis</h4>
            <div className="space-y-2">
              {tiposCampo.map((t) => (
                <div key={t.value} className="p-2 border rounded flex items-center justify-between">
                  <span>{t.label}</span>
                  <Button size="sm" onClick={() => {
                    if (!abaSelecionada) return;
                    const label = prompt(`Label para ${t.label}`);
                    if (!label) return;
                    const campo: CampoDef = { id: "temp", tipo: t.value, label } as CampoDef;
                    onAdicionarCampo(abaSelecionada.id, campo);
                  }}>Adicionar</Button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Editor visual da aba selecionada */}
          <div className="p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Aba selecionada:</span>
              <Select value={abaSelecionada?.id || ""} onValueChange={(v) => setAbaSelecionadaId(v)}>
                <SelectTrigger className="w-[240px] h-[36px]"><SelectValue placeholder="Selecione uma aba"/></SelectTrigger>
                <SelectContent>
                  {estrutura.abas.map(a => (<SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {!abaSelecionada ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Selecione ou crie uma aba para começar
              </div>
            ) : (
              <div className="space-y-2">
                {abaSelecionada.campos.length === 0 && (
                  <div className="text-sm text-gray-500">Nenhum campo nesta aba. Use a coluna da esquerda para adicionar.</div>
                )}

                {abaSelecionada.campos.map((c, idx) => (
                  <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={c.label}>{c.label}</div>
                      <div className="text-xs text-gray-500">{c.tipo}</div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mover para cima" onClick={() => onMoverCampo(abaSelecionada.id, c.id, -1)}><ArrowUp size={14} /></button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mover para baixo" onClick={() => onMoverCampo(abaSelecionada.id, c.id, 1)}><ArrowDown size={14} /></button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Renomear label" onClick={() => {
                        const novo = prompt("Novo label", c.label);
                        if (novo && novo.trim()) onAtualizarCampo(abaSelecionada.id, c.id, { label: novo.trim() });
                      }}><Pencil size={14} /></button>
                      <button className="p-1 hover:bg-red-100 rounded text-red-600" title="Excluir campo" onClick={() => onRemoverCampo(abaSelecionada.id, c.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-white flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-[#1777CF] hover:bg-[#1565C0]" onClick={onClose}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}