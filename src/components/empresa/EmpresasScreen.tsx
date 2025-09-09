import React, { useState, forwardRef, useImperativeHandle } from "react";
import { EmpresaHeader } from "./EmpresaHeader";
import { EmpresasList } from "./EmpresasList";
import { EmpresaDetails } from "./EmpresaDetails";
import { ManageStructureModal } from "./ManageStructureModal";
import { AddEmpresaModal } from "./AddEmpresaModal";
import { useEmpresaStore } from "./useEmpresaStore";

export type EmpresasScreenHandle = {
  openAddEmpresa: () => void;
  openGerenciarEstrutura: () => void;
};

export const EmpresasScreen = forwardRef<EmpresasScreenHandle, {}>(function EmpresasScreen(_, ref) {
  const {
    state,
    empresaSelecionada,
    selecionarEmpresa,
    adicionarEmpresa,
    renomearEmpresa,
    removerEmpresa,
    salvarValor,
    adicionarAba,
    renomearAba,
    removerAba,
    moverAba,
    adicionarCampo,
    atualizarCampo,
    removerCampo,
    moverCampo,
  } = useEmpresaStore();

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEstruturaOpen, setModalEstruturaOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openAddEmpresa: () => setModalAddOpen(true),
    openGerenciarEstrutura: () => setModalEstruturaOpen(true),
  }), []);

  return (
    <div className="w-full h-full flex flex-col bg-[#F1F5F9] rounded-md">
      {/* Header fixo (mantemos minimalista pois o header superior já existe no modal principal) */}
      <div className="sticky top-0 z-10">
        <EmpresaHeader />
      </div>

      {/* Corpo com duas colunas flexíveis */}
      <div className="flex-1 flex gap-[12px] p-[12px]" style={{ minHeight: 0 }}>
        <div className="w-[30%] h-full flex flex-col">
          <EmpresasList
            empresas={state.empresas}
            selecionadaId={state.selecionadaId}
            onSelecionar={(id) => selecionarEmpresa(id)}
            onRenomear={renomearEmpresa}
            onRemover={(id) => {
              removerEmpresa(id);
            }}
          />
        </div>

        <EmpresaDetails
          empresa={empresaSelecionada}
          estrutura={state.estrutura}
          onSalvarValor={salvarValor}
        />
      </div>

      {/* Modais */}
      <AddEmpresaModal
        open={modalAddOpen}
        onClose={() => setModalAddOpen(false)}
        onCreate={(nome) => { adicionarEmpresa(nome); setModalAddOpen(false); }}
      />

      <ManageStructureModal
        open={modalEstruturaOpen}
        onClose={() => setModalEstruturaOpen(false)}
        estrutura={state.estrutura}
        onAdicionarAba={adicionarAba}
        onRenomearAba={renomearAba}
        onRemoverAba={removerAba}
        onMoverAba={moverAba}
        onAdicionarCampo={adicionarCampo}
        onAtualizarCampo={atualizarCampo}
        onRemoverCampo={removerCampo}
        onMoverCampo={moverCampo}
      />
    </div>
  );
});

export default EmpresasScreen;