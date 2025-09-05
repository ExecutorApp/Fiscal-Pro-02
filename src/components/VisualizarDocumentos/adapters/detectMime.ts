/**
 * Magic numbers para detecção de tipos de arquivo
 */
const MAGIC_NUMBERS: Record<string, { signature: number[]; mime: string }> = {
  PDF: { signature: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf' }, // %PDF
  PNG: { signature: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png' }, // PNG signature
  JPEG: { signature: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg' }, // JPEG signature
  GIF87: { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mime: 'image/gif' }, // GIF87a
  GIF89: { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mime: 'image/gif' }, // GIF89a
  ZIP: { signature: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip' }, // ZIP/Excel
  WEBP: { signature: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF (WebP)
};

/**
 * Detecta MIME type a partir de magic numbers
 */
function detectMimeFromMagicNumbers(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 16)); // Primeiros 16 bytes são suficientes
  
  for (const [type, { signature, mime }] of Object.entries(MAGIC_NUMBERS)) {
    if (signature.length <= bytes.length) {
      const matches = signature.every((byte, index) => bytes[index] === byte);
      if (matches) {
        // Verificação especial para WebP
        if (type === 'WEBP') {
          // WebP tem "WEBP" nos bytes 8-11
          const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
          if (bytes.length >= 12) {
            const isWebP = webpSignature.every((byte, index) => bytes[8 + index] === byte);
            if (isWebP) return mime;
          }
          continue;
        }
        return mime;
      }
    }
  }
  
  return null;
}

/**
 * Detecta MIME type por extensão de arquivo
 */
function detectMimeFromExtension(fileName: string): string | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const extensionMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsm': 'application/vnd.ms-excel.sheet.macroenabled.12',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
  };
  
  return extension ? extensionMap[extension] || null : null;
}

/**
 * Converte File para ArrayBuffer
 */
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, 16)); // Só lê os primeiros 16 bytes
  });
}

/**
 * Função principal para detectar MIME type
 * Tenta inferir MIME a partir de File.type, extensão e magic numbers
 */
export async function detectMime(
  source: File | string, 
  providedMime?: string
): Promise<string> {
  // Se já temos um MIME type válido, usa ele
  if (providedMime && providedMime.trim() !== '') {
    return providedMime.trim();
  }
  
  // Se é um File, tenta usar o tipo nativo primeiro
  if (source instanceof File) {
    if (source.type && source.type.trim() !== '') {
      return source.type;
    }
    
    // Tenta detectar por magic numbers
    try {
      const buffer = await fileToArrayBuffer(source);
      const detectedMime = detectMimeFromMagicNumbers(buffer);
      if (detectedMime) {
        return detectedMime;
      }
    } catch (error) {
      console.warn('Erro ao ler magic numbers:', error);
    }
    
    // Fallback para extensão
    const mimeFromExtension = detectMimeFromExtension(source.name);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }
  }
  
  // Se é uma string (nome de arquivo), detecta pela extensão
  if (typeof source === 'string') {
    const mimeFromExtension = detectMimeFromExtension(source);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }
  }
  
  // Fallback padrão
  return 'application/octet-stream';
}

/**
 * Versão síncrona que só usa extensão e File.type
 */
export function detectMimeSync(
  source: File | string, 
  providedMime?: string
): string {
  // Se já temos um MIME type válido, usa ele
  if (providedMime && providedMime.trim() !== '') {
    return providedMime.trim();
  }
  
  // Se é um File, tenta usar o tipo nativo primeiro
  if (source instanceof File) {
    if (source.type && source.type.trim() !== '') {
      return source.type;
    }
    
    // Fallback para extensão
    const mimeFromExtension = detectMimeFromExtension(source.name);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }
  }
  
  // Se é uma string (nome de arquivo), detecta pela extensão
  if (typeof source === 'string') {
    const mimeFromExtension = detectMimeFromExtension(source);
    if (mimeFromExtension) {
      return mimeFromExtension;
    }
  }
  
  // Fallback padrão
  return 'application/octet-stream';
}