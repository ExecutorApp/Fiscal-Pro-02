import React, { useMemo, useState } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { Empresa, EstruturaEmpresas } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface EmpresaDetailsProps {
  empresa: Empresa | null;
  estrutura: EstruturaEmpresas;
  onSalvarValor: (abaId: string, campoId: string, valor: any) => void;
}

export function EmpresaDetails({ empresa, estrutura, onSalvarValor }: EmpresaDetailsProps) {
  const [abaAtual, setAbaAtual] = useState<string | null>(null);

  const abas = estrutura.abas;
  const abaSelecionada = useMemo(() => {
    if (!abas.length) return null;
    const id = abaAtual || abas[0]?.id || null;
    return abas.find((a) => a.id === id) || null;
  }, [abaAtual, abas]);

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
    <div className="w-[70%] bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <span className="text-sm text-gray-700">Aba:</span>
        <Select value={abaSelecionada?.id || ""} onValueChange={(v) => setAbaAtual(v)}>
          <SelectTrigger className="w-[240px] h-[36px]">
            <SelectValue placeholder="Selecione uma aba" />
          </SelectTrigger>
          <SelectContent>
            {abas.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
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