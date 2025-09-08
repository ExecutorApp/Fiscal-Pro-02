import { useEffect, useMemo, useState } from "react";
import { AbaDef, CampoDef, Empresa, EmpresasState, EstruturaEmpresas } from "./types";

// Função para gerar UUID compatível com todos os ambientes
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STORAGE_KEY = "empresas_data_v1";

const estruturaInicial: EstruturaEmpresas = {
  abas: [
    {
      id: "dados-gerais",
      nome: "Dados Gerais",
      campos: [
        { id: "nome-fantasia", tipo: "text", label: "Nome Fantasia", obrigatorio: true },
        { id: "cnpj", tipo: "cnpj", label: "CNPJ", obrigatorio: true },
        { id: "telefone", tipo: "telefone", label: "Telefone" },
        { id: "email", tipo: "email", label: "Email" }
      ],
    },
  ],
};

const exemploEmpresas: Empresa[] = [];

function carregarState(): EmpresasState {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch {}
  }
  return {
    empresas: exemploEmpresas,
    selecionadaId: null,
    estrutura: estruturaInicial,
  };
}

export function useEmpresaStore() {
  const [state, setState] = useState<EmpresasState>(() => carregarState());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const empresaSelecionada = useMemo(
    () => state.empresas.find((e) => e.id === state.selecionadaId) || null,
    [state.empresas, state.selecionadaId]
  );

  function selecionarEmpresa(id: string | null) {
    setState((s) => ({ ...s, selecionadaId: id }));
  }

  function adicionarEmpresa(nome: string) {
    const nova: Empresa = { id: generateUUID(), nome, dados: {} };
    setState((s) => ({
      ...s,
      empresas: [...s.empresas, nova],
      selecionadaId: nova.id,
    }));
  }

  function renomearEmpresa(id: string, nome: string) {
    setState((s) => ({
      ...s,
      empresas: s.empresas.map((e) => (e.id === id ? { ...e, nome } : e)),
    }));
  }

  function removerEmpresa(id: string) {
    setState((s) => {
      const empresas = s.empresas.filter((e) => e.id !== id);
      const selecionadaId = s.selecionadaId === id ? null : s.selecionadaId;
      return { ...s, empresas, selecionadaId };
    });
  }

  function salvarValor(abaId: string, campoId: string, valor: any) {
    if (!state.selecionadaId) return;
    setState((s) => ({
      ...s,
      empresas: s.empresas.map((e) => {
        if (e.id !== s.selecionadaId) return e;
        const dadosAba = e.dados[abaId] || {};
        return { ...e, dados: { ...e.dados, [abaId]: { ...dadosAba, [campoId]: valor } } };
      }),
    }));
  }

  function setEstrutura(nova: EstruturaEmpresas) {
    setState((s) => ({ ...s, estrutura: nova }));
  }

  function adicionarAba(nome: string) {
    setState((s) => ({
      ...s,
      estrutura: {
        ...s.estrutura,
        abas: [...s.estrutura.abas, { id: generateUUID(), nome, campos: [] }],
      },
    }));
  }

  function renomearAba(id: string, nome: string) {
    setState((s) => ({
      ...s,
      estrutura: {
        ...s.estrutura,
        abas: s.estrutura.abas.map((a) => (a.id === id ? { ...a, nome } : a)),
      },
    }));
  }

  function removerAba(id: string) {
    setState((s) => ({
      ...s,
      estrutura: { ...s.estrutura, abas: s.estrutura.abas.filter((a) => a.id !== id) },
    }));
  }

  function moverAba(id: string, dir: -1 | 1) {
    setState((s) => {
      const idx = s.estrutura.abas.findIndex((a) => a.id === id);
      if (idx < 0) return s;
      const novoIdx = idx + dir;
      if (novoIdx < 0 || novoIdx >= s.estrutura.abas.length) return s;
      const abas = [...s.estrutura.abas];
      const [aba] = abas.splice(idx, 1);
      abas.splice(novoIdx, 0, aba);
      return { ...s, estrutura: { ...s.estrutura, abas } };
    });
  }

  function adicionarCampo(abaId: string, campo: CampoDef) {
    setState((s) => ({
      ...s,
      estrutura: {
        ...s.estrutura,
        abas: s.estrutura.abas.map((a) =>
          a.id === abaId ? { ...a, campos: [...a.campos, { ...campo, id: generateUUID() }] } : a
        ),
      },
    }));
  }

  function atualizarCampo(abaId: string, campoId: string, patch: Partial<CampoDef>) {
    setState((s) => ({
      ...s,
      estrutura: {
        ...s.estrutura,
        abas: s.estrutura.abas.map((a) =>
          a.id === abaId
            ? { ...a, campos: a.campos.map((c) => (c.id === campoId ? { ...c, ...patch } : c)) }
            : a
        ),
      },
    }));
  }

  function removerCampo(abaId: string, campoId: string) {
    setState((s) => ({
      ...s,
      estrutura: {
        ...s.estrutura,
        abas: s.estrutura.abas.map((a) =>
          a.id === abaId ? { ...a, campos: a.campos.filter((c) => c.id !== campoId) } : a
        ),
      },
    }));
  }

  function moverCampo(abaId: string, campoId: string, dir: -1 | 1) {
    setState((s) => {
      const abas = s.estrutura.abas.map((a) => {
        if (a.id !== abaId) return a;
        const idx = a.campos.findIndex((c) => c.id === campoId);
        if (idx < 0) return a;
        const novoIdx = idx + dir;
        if (novoIdx < 0 || novoIdx >= a.campos.length) return a;
        const campos = [...a.campos];
        const [c] = campos.splice(idx, 1);
        campos.splice(novoIdx, 0, c);
        return { ...a, campos };
      });
      return { ...s, estrutura: { ...s.estrutura, abas } };
    });
  }

  return {
    state,
    empresaSelecionada,
    selecionarEmpresa,
    adicionarEmpresa,
    renomearEmpresa,
    removerEmpresa,
    salvarValor,
    setEstrutura,
    adicionarAba,
    renomearAba,
    removerAba,
    moverAba,
    adicionarCampo,
    atualizarCampo,
    removerCampo,
    moverCampo,
  };
}