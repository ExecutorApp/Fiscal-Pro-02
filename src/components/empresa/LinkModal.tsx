import React, { useState, useEffect } from "react";
import DropdownCustomizado from "../DropdownCustomizado";

interface Option { value: string; label: string }

interface LinkModalProps {
  isOpen: boolean;
  current: { produto: string; fase: string; atividade: string } | null;
  onClose: () => void;
  onSave: (v: { produto: string; fase: string; atividade: string }) => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, current, onClose, onSave }) => {
  const [produto, setProduto] = useState("");
  const [fase, setFase] = useState("");
  const [atividade, setAtividade] = useState("");

  useEffect(() => {
    setProduto(current?.produto || "");
    setFase(current?.fase || "");
    setAtividade(current?.atividade || "");
  }, [current, isOpen]);

  if (!isOpen) return null;

  const PRODUTOS: Option[] = [
    { value: "todas", label: "Todos" },
    { value: "p2", label: "Holding Patrimonial" },
  ];
  const FASES: Option[] = [
    { value: "todas", label: "Todas" },
    { value: "f1", label: "Fase 01" },
    { value: "f2", label: "Fase 02" },
  ];
  const ATIVIDADES: Option[] = [
    { value: "todas", label: "Todas" },
    { value: "a1", label: "Atividade 01" },
    { value: "a2", label: "Atividade 02" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-[500px] rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold mb-4">Vincular arquivo</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Produto*</label>
            <DropdownCustomizado
              value={produto}
              onChange={setProduto}
              options={PRODUTOS}
              placeholder="Selecione..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Fase*</label>
            <DropdownCustomizado
              value={fase}
              onChange={setFase}
              options={FASES}
              placeholder="Selecione..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Atividade*</label>
            <DropdownCustomizado
              value={atividade}
              onChange={setAtividade}
              options={ATIVIDADES}
              placeholder="Selecione..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-[25px] py-2 rounded border">Cancelar</button>
          <button onClick={() => onSave({ produto, fase, atividade })} className="px-[25px] py-2 rounded bg-[#1777CF] text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;