import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Button } from './ui/button'

/*
--------------------------------------------------------
  Componente: Card de Cliente - Com Foto Personalizada
--------------------------------------------------------
- Avatar completamente redondo (border-radius: 50%)
- Borda gradiente FINA (2px) com MAIS ESPAÇAMENTO da foto (8px)
- SUPORTE A FOTO PERSONALIZADA: Usa foto do usuário quando disponível
- IMAGEM PADRÃO: Avatar neutro quando não há foto personalizada
- Efeito suave de transição de cores
- Fonte Inter aplicada em todo o componente
- Menu dropdown com apenas 2 opções: Editar e Excluir
- Funcionalidades de edição e exclusão implementadas
*/

interface ClientCardProps {
  client: {
    id: number
    name: string
    photo: string
    whatsapp: string
    estado: string
    formularios: number
    livroCaixa: number
    isCustomLead?: boolean
  }
  onSpreadsheetClick: (clientId: number) => void
  onEditClick: (client: any) => void
  onDeleteClick: (client: any) => void
}

export const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  onSpreadsheetClick,
  onEditClick,
  onDeleteClick
}) => {
  // Função para formatar números e definir cor
  const formatNumberWithColor = (value: number) => {
    const formattedValue = value.toString().padStart(2, '0')
    const colorClass = value === 0 ? 'text-[#6B7280]' : 'text-[#1777CF]'
    return { formattedValue, colorClass }
  }

  /*
  --------------------------------------------------------
    Função: Obter URL da Imagem do Cliente
  --------------------------------------------------------
  - Se o cliente tem foto personalizada: usa ela
  - Se é um lead customizado sem foto: avatar SVG personalizado
  - Se é cliente mockado: gera imagem do Pexels
  - Fallback final: avatar SVG personalizado em caso de erro
  */
  const getClientImageUrl = () => {
    // Se tem foto personalizada (base64 ou URL), usar ela
    if (client.photo && client.photo.trim() !== '') {
      // Verifica se não é a URL padrão do avatar SVG
      if (!client.photo.includes('data:image/svg+xml')) {
        return client.photo;
      }
    }
    
    // Se é um lead salvo pelo usuário sem foto personalizada, usar avatar SVG personalizado
    if (client.isCustomLead) {
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDAgMi42MzItNS4zMDRjMS4wODYtLjMzNSAxLjg4Ni0xLjMzOCAxLjg4Ni0yLjUzdi0zLjU0NmMwLS43OC0uMzQ3LTEuNDc3LS44ODYtMS45NjV2LTUuMTI2czEuMDUzLTcuOTc3LTkuNzUtNy45NzctOS43NSA3Ljk3Ny05Ljc1IDcuOTc3djUuMTI2YTIuNjQ0IDIuNjQ0IDAgMCAwLS44ODYgMS45NjV2My41NDZjMCAuOTM0LjQ5MSAxLjc1NiAxLjIyNiAyLjIzMS44ODYgMy44NTcgMy4yMDYgNi42MzMgMy4yMDYgNi42MzN2My4yNGEzLjIzMiAzLjIzMiAwIDAgMS0xLjY4NCAyLjgzM3oiIHN0eWxlPSIiIGZpbGw9IiNlN2VjZWQiIGRhdGEtb3JpZ2luYWw9IiNlN2VjZWQiIGNsYXNzPSIiPjwvcGF0aD48cGF0aCBkPSJNMjYuOTUzLjAwNEMxMi4zMi0uMjQ2LjI1NCAxMS40MTQuMDA0IDI2LjA0Ny0uMTM4IDM0LjM0NCAzLjU2IDQxLjgwMSA5LjQ0OCA0Ni43NmE3LjA0MSA3LjA0MSAwIDAgMSAxLjI1Ny0uODk0bDcuOTA3LTQuMzEzYTMuMjMgMy4yMyAwIDAgMCAxLjY4My0yLjgzNXYtMy4yNHMtMi4zMjEtMi43NzYtMy4yMDYtNi42MzNhMi42NiAyLjY2IDAgMCAxLTEuMjI2LTIuMjMxdi0zLjU0NmMwLS43OC4zNDctMS40NzcuODg2LTEuOTY1di01LjEyNlMxNS42OTYgOCAyNi40OTkgOHM5Ljc1IDcuOTc3IDkuNzUgNy45Nzd2NS4xMjZjLjU0LjQ4OC44ODYgMS4xODUuODg2IDEuOTY1djMuNTQ2YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAxLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDNWMzguOGMwIDEuMjIzLjY5MSAyLjM0MiAxLjc4NSAyLjg4OGw4LjQ2NyA0LjIzM2E3LjA1IDcuMDUgMCAwIDEgMS4zOS45MzJjNS43MS00Ljc2MiA5LjM5OS0xMS44ODIgOS41MzYtMTkuOUM1My4yNDYgMTIuMzIgNDEuNTg3LjI1NCAyNi45NTMuMDA0eiIgc3R5bGU9IiIgZmlsbD0iIzU1NjA4MCIgZGF0YS1vcmlnaW5hbD0iIzU1NjA4MCIgY2xhc3M9IiI+PC9wYXRoPjwvZz48L3N2Zz4=';
    }
    
    // Se é cliente mockado, gerar imagem do Pexels
    return `https://images.pexels.com/photos/${1000000 + client.id}/pexels-photo-${1000000 + client.id}.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`;
  };

  /*
  --------------------------------------------------------
    Função: Obter URL de Fallback
  --------------------------------------------------------
  - Imagem padrão quando há erro no carregamento
  - Avatar SVG personalizado consistente
  */
  const getFallbackImageUrl = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDAgMi42MzItNS4zMDRjMS4wODYtLjMzNSAxLjg4Ni0xLjMzOCAxLjg4Ni0yLjUzdi0zLjU0NmMwLS43OC0uMzQ3LTEuNDc3LS44ODYtMS45NjV2LTUuMTI2czEuMDUzLTcuOTc3LTkuNzUtNy45NzctOS43NSA3Ljk3Ny05Ljc1IDcuOTc3djUuMTI2YTIuNjQ0IDIuNjQ0IDAgMCAwLS44ODYgMS45NjV2My41NDZjMCAuOTM0LjQ5MSAxLjc1NiAxLjIyNiAyLjIzMS44ODYgMy44NTcgMy4yMDYgNi42MzMgMy4yMDYgNi42MzN2My4yNGEzLjIzMiAzLjIzMiAwIDAgMS0xLjY4NCAyLjgzM3oiIHN0eWxlPSIiIGZpbGw9IiNlN2VjZWQiIGRhdGEtb3JpZ2luYWw9IiNlN2VjZWQiIGNsYXNzPSIiPjwvcGF0aD48cGF0aCBkPSJNMjYuOTUzLjAwNEMxMi4zMi0uMjQ2LjI1NCAxMS40MTQuMDA0IDI2LjA0Ny0uMTM4IDM0LjM0NCAzLjU2IDQxLjgwMSA5LjQ0OCA0Ni43NmE3LjA0MSA3LjA0MSAwIDAgMSAxLjI1Ny0uODk0bDcuOTA3LTQuMzEzYTMuMjMgMy4yMyAwIDAgMCAxLjY4My0yLjgzNXYtMy4yNHMtMi4zMjEtMi43NzYtMy4yMDYtNi42MzNhMi42NiAyLjY2IDAgMCAxLTEuMjI2LTIuMjMxdi0zLjU0NmMwLS43OC4zNDctMS40NzcuODg2LTEuOTY1di01LjEyNlMxNS42OTYgOCAyNi40OTkgOHM5Ljc1IDcuOTc3IDkuNzUgNy45Nzd2NS4xMjZjLjU0LjQ4OC44ODYgMS4xODUuODg2IDEuOTY1djMuNTQ2YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAxLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDNWMzguOGMwIDEuMjIzLjY5MSAyLjM0MiAxLjc4NSAyLjg4OGw4LjQ2NyA0LjIzM2E3LjA1IDcuMDUgMCAwIDEgMS4zOS45MzJjNS43MS00Ljc2MiA5LjM5OS0xMS44ODIgOS41MzYtMTkuOUM1My4yNDYgMTIuMzIgNDEuNTg3LjI1NCAyNi45NTMuMDA0eiIgc3R5bGU9IiIgZmlsbD0iIzU1NjA4MCIgZGF0YS1vcmlnaW5hbD0iIzU1NjA4MCIgY2xhc3M9IiI+PC9wYXRoPjwvZz48L3N2Zz4=';
  };

  const formularios = formatNumberWithColor(client.formularios)
  const livroCaixa = formatNumberWithColor(client.livroCaixa)

  return (
    <div className="w-full bg-white rounded-[14px] border border-[#E5E7EB] px-[20px] py-[12px] hover:shadow-sm transition-shadow duration-200 font-inter">
      <style>{`
        .avatar-container {
          position: relative;
          width: 58px;
          height: 58px;
          flex-shrink: 0;
        }

        /* Borda gradiente animada - FINA (2px) com MAIS ESPAÇAMENTO (8px) */
        .gradient-border {
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #1777CF, #3B82F6, #1777CF, #0EA5E9);
          background-size: 300% 300%;
          border-radius: 50%;
          animation: gradientBorderMove 4s ease-in-out infinite;
          z-index: 1;
          padding: 2px; /* Borda FINA de 2px */
        }

        /* Container da imagem REDONDO com MAIS ESPAÇAMENTO (8px) */
        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 50%;
          padding: 2px; /* MAIS ESPAÇAMENTO entre borda e foto */
          z-index: 2;
        }

        /* Imagem estática REDONDA - menor para criar mais distância */
        .static-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        @keyframes gradientBorderMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        
        {/* Seção do Avatar com Borda Gradiente + Nome */}
        <div className="flex items-center gap-[16px] min-w-0" style={{ width: '25%' }}>
          <div className="avatar-container">
            {/* Borda gradiente animada FINA (2px) */}
            <div className="gradient-border">
              {/* Container da imagem REDONDO com MAIS ESPAÇAMENTO (8px) */}
              <div className="image-container">
                <img
                  src={getClientImageUrl()}
                  alt={client.name}
                  className="static-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getFallbackImageUrl();
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-[#6B7280] font-medium mb-[1px] font-inter">Nome</div>
            <div className="text-[16px] text-[#111827] font-semibold truncate font-inter">
              {client.name}
            </div>
          </div>
        </div>

        {/* Seção WhatsApp */}
        <div className="min-w-0 px-[16px]" style={{ width: '18%' }}>
          <div className="text-[14px] text-[#6B7280] font-medium mb-[1px] font-inter">WhatsApp</div>
          <div className="text-[16px] text-[#374151] truncate font-inter">
            {client.whatsapp}
          </div>
        </div>

        {/* Seção Estado - CENTRALIZADO */}
        <div className="min-w-0 px-[16px] text-center" style={{ width: '12%' }}>
          <div className="text-[14px] text-[#6B7280] font-medium mb-[1px] font-inter">Estado</div>
          <div className="text-[16px] text-[#374151] truncate font-inter">
            {client.estado}
          </div>
        </div>

        {/* Seção Formulários - CENTRALIZADO - Número com 2 dígitos */}
        <div className="min-w-0 px-[16px] text-center" style={{ width: '15%' }}>
          <div className="text-[14px] text-[#6B7280] font-medium mb-[1px] font-inter">Formulários</div>
          <div className={`text-[16px] font-semibold ${formularios.colorClass} font-inter`}>
            {formularios.formattedValue}
          </div>
        </div>

        {/* Seção Livro Caixa - CENTRALIZADO - Número com 2 dígitos */}
        <div className="min-w-0 px-[16px] text-center" style={{ width: '15%' }}>
          <div className="text-[14px] text-[#6B7280] font-medium mb-[1px] font-inter">Livro caixa</div>
          <div className={`text-[16px] font-semibold ${livroCaixa.colorClass} font-inter`}>
            {livroCaixa.formattedValue}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-[8px] flex-shrink-0 ml-[16px]" style={{ width: '15%', justifyContent: 'flex-end' }}>
          
          {/* Botão Ícone Planilha com borda clara */}
          <button
            onClick={() => onSpreadsheetClick(client.id)}
            className="w-[36px] h-[36px] border-2 border-[#E5E7EB] rounded-[8px] bg-white hover:bg-[#F9FAFB] hover:border-[#1777CF] transition-all duration-200 flex items-center justify-center group"
            title="Abrir Planilha"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#6B7280] group-hover:text-[#1777CF] transition-colors duration-200"
            >
              <path 
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
              />
              <polyline 
                points="14,2 14,8 20,8" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
              />
              <line 
                x1="16" 
                y1="13" 
                x2="8" 
                y2="13" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <line 
                x1="16" 
                y1="17" 
                x2="8" 
                y2="17" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <polyline 
                points="10,9 9,9 8,9" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Menu de 3 pontos com borda clara - APENAS 2 OPÇÕES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-[36px] h-[36px] border-2 border-[#E5E7EB] rounded-[8px] bg-white hover:bg-[#F9FAFB] hover:border-[#1777CF] transition-all duration-200 flex items-center justify-center group">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#6B7280] group-hover:text-[#1777CF] transition-colors duration-200"
                >
                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg">
              <DropdownMenuItem 
                className="font-inter hover:bg-[#F9FAFB] cursor-pointer px-[16px] py-[12px]"
                onClick={() => onEditClick(client)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-[8px]">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
                Editar
              </DropdownMenuItem>
              
              {/* Divisória */}
              <div className="h-[1px] bg-[#D8E0F0] mx-[8px]"></div>
              
              <DropdownMenuItem 
                className="font-inter hover:bg-[#FEF2F2] cursor-pointer px-[16px] py-[12px] text-[#DC2626]"
                onClick={() => onDeleteClick(client)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-[8px]">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent> 
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}