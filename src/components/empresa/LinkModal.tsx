import React, { useState, useEffect } from "react";

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
    { value: "", label: "Produto" },
    { value: "p1", label: "Todos" },
    { value: "p2", label: "Holding Patrimonial" },
  ];
  const FASES: Option[] = [
    { value: "", label: "Fase" },
    { value: "f1", label: "Fase 01" },
    { value: "f2", label: "Fase 02" },
  ];
  const ATIVIDADES: Option[] = [
    { value: "", label: "Atividade" },
    { value: "a1", label: "Atividade 01" },
    { value: "a2", label: "Atividade 02" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold mb-4">Vincular arquivo</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <select value={produto} onChange={(e) => setProduto(e.target.value)} className="border rounded px-2 py-2">
            {PRODUTOS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={fase} onChange={(e) => setFase(e.target.value)} className="border rounded px-2 py-2">
            {FASES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={atividade} onChange={(e) => setAtividade(e.target.value)} className="border rounded px-2 py-2">
            {ATIVIDADES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={() => onSave({ produto, fase, atividade })} className="px-3 py-2 rounded bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;