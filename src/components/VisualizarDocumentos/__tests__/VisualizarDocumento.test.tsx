import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizarDocumento from '../VisualizarDocumento';
import { detectMime } from '../utils/detectMime';
import { resolveViewerByMimeOrExt } from '../utils/resolveViewerByMimeOrExt';

// Mock dos viewers para evitar carregamento de dependências externas
jest.mock('../images/Jpeg', () => {
  return function MockJpeg({ src, onLoad }: any) {
    React.useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div data-testid="jpeg-viewer">JPEG Viewer: {src}</div>;
  };
});

jest.mock('../images/Png', () => {
  return function MockPng({ src, onLoad }: any) {
    React.useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div data-testid="png-viewer">PNG Viewer: {src}</div>;
  };
});

jest.mock('../docs/Pdf', () => {
  return function MockPdf({ src, onLoad }: any) {
    React.useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div data-testid="pdf-viewer">PDF Viewer: {src}</div>;
  };
});

jest.mock('../docs/Text', () => {
  return function MockText({ src, onLoad }: any) {
    React.useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div data-testid="text-viewer">Text Viewer: {src}</div>;
  };
});

jest.mock('../docs/Unknown', () => {
  return function MockUnknown({ src, onLoad }: any) {
    React.useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div data-testid="unknown-viewer">Unknown Viewer: {src}</div>;
  };
});

// Mock das funções utilitárias
jest.mock('../utils/detectMime');
jest.mock('../utils/resolveViewerByMimeOrExt');

const mockDetectMime = detectMime as jest.MockedFunction<typeof detectMime>;
const mockResolveViewer = resolveViewerByMimeOrExt as jest.MockedFunction<typeof resolveViewerByMimeOrExt>;

describe('VisualizarDocumento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização com diferentes tipos de arquivo', () => {
    it('deve renderizar viewer JPEG para arquivo .jpg', async () => {
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('jpeg-viewer')).toBeInTheDocument();
      });
    });

    it('deve renderizar viewer PNG para arquivo .png', async () => {
      mockDetectMime.mockResolvedValue('image/png');
      mockResolveViewer.mockReturnValue('png');

      render(
        <VisualizarDocumento
          src="test.png"
          fileName="test.png"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('png-viewer')).toBeInTheDocument();
      });
    });

    it('deve renderizar viewer PDF para arquivo .pdf', async () => {
      mockDetectMime.mockResolvedValue('application/pdf');
      mockResolveViewer.mockReturnValue('pdf');

      render(
        <VisualizarDocumento
          src="test.pdf"
          fileName="test.pdf"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });
    });

    it('deve renderizar viewer de texto para arquivo .txt', async () => {
      mockDetectMime.mockResolvedValue('text/plain');
      mockResolveViewer.mockReturnValue('text');

      render(
        <VisualizarDocumento
          src="test.txt"
          fileName="test.txt"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('text-viewer')).toBeInTheDocument();
      });
    });

    it('deve renderizar viewer desconhecido para arquivo não suportado', async () => {
      mockDetectMime.mockResolvedValue('application/octet-stream');
      mockResolveViewer.mockReturnValue('unknown');

      render(
        <VisualizarDocumento
          src="test.unknown"
          fileName="test.unknown"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('unknown-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de carregamento e erro', () => {
    it('deve exibir estado de carregamento inicialmente', () => {
      mockDetectMime.mockImplementation(() => new Promise(() => {})); // Promise que nunca resolve

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });

    it('deve chamar onLoad quando o documento carregar', async () => {
      const onLoad = jest.fn();
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
          onLoad={onLoad}
        />
      );

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('deve chamar onError quando houver erro na detecção de MIME', async () => {
      const onError = jest.fn();
      const error = new Error('Erro na detecção de MIME');
      mockDetectMime.mockRejectedValue(error);

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('deve exibir botão de retry quando houver erro', async () => {
      mockDetectMime.mockRejectedValue(new Error('Erro de teste'));

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument();
      });
    });

    it('deve tentar carregar novamente quando clicar em retry', async () => {
      mockDetectMime
        .mockRejectedValueOnce(new Error('Erro de teste'))
        .mockResolvedValueOnce('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/tentar novamente/i));

      await waitFor(() => {
        expect(screen.getByTestId('jpeg-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Propriedades e configurações', () => {
    it('deve aplicar dimensões personalizadas', async () => {
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      const { container } = render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="500px"
          height="300px"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        width: '500px',
        height: '300px'
      });
    });

    it('deve passar propriedades para o viewer', async () => {
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
          fit="cover"
          allowDownload={false}
        />
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('jpeg-viewer');
        expect(viewer).toBeInTheDocument();
      });
    });
  });

  describe('Suporte a File objects', () => {
    it('deve funcionar com objeto File', async () => {
      const file = new File(['conteúdo'], 'test.jpg', { type: 'image/jpeg' });
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      render(
        <VisualizarDocumento
          src={file}
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('jpeg-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter atributos de acessibilidade apropriados', async () => {
      mockDetectMime.mockResolvedValue('image/jpeg');
      mockResolveViewer.mockReturnValue('jpeg');

      const { container } = render(
        <VisualizarDocumento
          src="test.jpg"
          fileName="test.jpg"
          width="100%"
          height="400px"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('role', 'region');
      expect(wrapper).toHaveAttribute('aria-label');
    });
  });
});

// Testes das funções utilitárias
describe('Funções utilitárias', () => {
  describe('detectMime', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('deve detectar MIME type de string URL', async () => {
      // Reimport para testar a função real
      const { detectMime: realDetectMime } = await import('../utils/detectMime');
      
      const result = await realDetectMime('test.jpg');
      expect(result).toBe('image/jpeg');
    });

    it('deve detectar MIME type de File object', async () => {
      const { detectMime: realDetectMime } = await import('../utils/detectMime');
      
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const result = await realDetectMime(file);
      expect(result).toBe('application/pdf');
    });
  });

  describe('resolveViewerByMimeOrExt', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('deve resolver viewer por MIME type', async () => {
      const { resolveViewerByMimeOrExt: realResolveViewer } = await import('../utils/resolveViewerByMimeOrExt');
      
      expect(realResolveViewer('image/jpeg', 'test.jpg')).toBe('jpeg');
      expect(realResolveViewer('image/png', 'test.png')).toBe('png');
      expect(realResolveViewer('application/pdf', 'test.pdf')).toBe('pdf');
      expect(realResolveViewer('text/plain', 'test.txt')).toBe('text');
    });

    it('deve resolver viewer por extensão quando MIME não for reconhecido', async () => {
      const { resolveViewerByMimeOrExt: realResolveViewer } = await import('../utils/resolveViewerByMimeOrExt');
      
      expect(realResolveViewer('application/octet-stream', 'test.xlsx')).toBe('excel');
      expect(realResolveViewer('application/octet-stream', 'test.csv')).toBe('csv');
    });

    it('deve retornar unknown para tipos não suportados', async () => {
      const { resolveViewerByMimeOrExt: realResolveViewer } = await import('../utils/resolveViewerByMimeOrExt');
      
      expect(realResolveViewer('application/octet-stream', 'test.unknown')).toBe('unknown');
    });
  });
});