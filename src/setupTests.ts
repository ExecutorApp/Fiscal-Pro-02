import '@testing-library/jest-dom';

// Mock para APIs do navegador que podem não estar disponíveis no ambiente de teste
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para URL.createObjectURL e URL.revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-object-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock para FileReader
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    readAsArrayBuffer: jest.fn(),
    readAsText: jest.fn(),
    readAsDataURL: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
  })),
});

// Mock para ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock para IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Suprimir warnings de console durante os testes
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});