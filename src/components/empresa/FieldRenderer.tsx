import React from "react";
import { CampoDef } from "./types";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface FieldRendererProps {
  abaId: string;
  campo: CampoDef;
  valor: any;
  onChange: (valor: any) => void;
}

export function FieldRenderer({ abaId, campo, valor, onChange }: FieldRendererProps) {
  const label = (
    <label className="block text-[12px] font-medium text-[#7D8592] mb-[6px] px-[6px] font-inter truncate" title={campo.label}>
      {campo.label}
      {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (campo.tipo) {
    case "select":
      return (
        <div className="mb-3">
          {label}
          <Select value={valor ?? ""} onValueChange={onChange}>
            <SelectTrigger className="h-[40px]">
              <SelectValue placeholder={campo.placeholder ?? "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {(campo.opcoes || []).map((op) => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "checkbox":
      return (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={!!valor}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="text-sm text-gray-700" title={campo.label}>{campo.label}</span>
          </div>
        </div>
      );
    case "date":
      return (
        <div className="mb-3">
          {label}
          <Input type="date" className="h-[40px]" value={valor || ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return (
        <div className="mb-3">
          {label}
          <Input type="number" className="h-[40px]" value={valor ?? ""} onChange={(e) => onChange(e.target.valueAsNumber)} />
        </div>
      );
    case "cpf":
    case "cnpj":
    case "telefone":
    case "email":
    case "cep":
    case "text":
    default:
      return (
        <div className="mb-3">
          {label}
          <Input
            className="h-[40px]"
            placeholder={campo.placeholder ?? `Digite ${campo.label.toLowerCase()}`}
            value={valor || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}