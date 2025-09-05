import { useState } from "react";
import ModalConfirmarExclusao from "../ModalConfirmarExclusao"; // apenas para manter consistência de estilo dos modais
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (nome: string) => void;
}

export function AddEmpresaModal({ isOpen, onClose, onCreate }: Props) {
  const [nome, setNome] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-md bg-white p-4 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Adicionar Empresa</h3>
        <div className="space-y-2">
          <label className="text-sm">Nome da Empresa</label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: ACME LTDA" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { if (nome.trim()) { onCreate(nome.trim()); setNome(""); onClose(); } }}>Criar</Button>
        </div>
      </div>
    </div>
  );
}