import type { ViewerType, MimeType } from '../types';

// Mapeamento de MIME types para viewers
const MIME_TO_VIEWER: Record<string, ViewerType> = {
  'image/jpeg': 'Jpeg',
  'image/jpg': 'Jpeg',
  'image/png': 'Png',
  'image/svg+xml': 'Svg',
  'application/pdf': 'Pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-excel.sheet.macroenabled.12': 'Excel',
  'application/vnd.ms-excel': 'Excel',
  'text/csv': 'Csv',
  'text/plain': 'Text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/msword': 'Word',
};

// Mapeamento de extensões para viewers
const EXTENSION_TO_VIEWER: Record<string, ViewerType> = {
  'jpg': 'Jpeg',
  'jpeg': 'Jpeg',
  'png': 'Png',
  'svg': 'Svg',
  'pdf': 'Pdf',
  'xlsx': 'Excel',
  'xlsm': 'Excel',
  'xls': 'Excel',
  'csv': 'Csv',
  'txt': 'Text',
  'docx': 'Word',
  'doc': 'Word',
};

/**
 * Extrai a extensão de um nome de arquivo
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * Resolve o viewer apropriado baseado no MIME type ou extensão do arquivo
 */
export function resolveViewerByMimeOrExt(
  mime?: string, 
  fileName?: string
): ViewerType {
  // Primeiro, tenta resolver pelo MIME type
  if (mime) {
    const normalizedMime = mime.toLowerCase().trim();
    const viewer = MIME_TO_VIEWER[normalizedMime];
    if (viewer) {
      return viewer;
    }
  }

  // Se não encontrou pelo MIME, tenta pela extensão
  if (fileName) {
    const extension = getFileExtension(fileName);
    const viewer = EXTENSION_TO_VIEWER[extension];
    if (viewer) {
      return viewer;
    }
  }

  // Fallback para Unknown
  return 'Unknown';
}

/**
 * Verifica se um MIME type é suportado
 */
export function isMimeTypeSupported(mime: string): boolean {
  return mime.toLowerCase() in MIME_TO_VIEWER;
}

/**
 * Verifica se uma extensão é suportada
 */
export function isExtensionSupported(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return extension in EXTENSION_TO_VIEWER;
}

/**
 * Retorna todos os MIME types suportados
 */
export function getSupportedMimeTypes(): string[] {
  return Object.keys(MIME_TO_VIEWER);
}

/**
 * Retorna todas as extensões suportadas
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_TO_VIEWER);
}

/**
 * Normaliza um MIME type para um formato padrão
 */
export function normalizeMimeType(mime: string): string {
  return mime.toLowerCase().trim();
}