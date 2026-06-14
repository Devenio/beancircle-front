import { api } from '@/lib/api/client';
import { isMockMode } from '@/lib/api/mock';

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
  maxBytes: number;
};

export type UploadResult = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

const SUPPORTED_MIME: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/gif': true,
  'video/mp4': true,
  'video/webm': true,
  'video/quicktime': true,
  'audio/webm': true,
  'audio/mpeg': true,
  'audio/mp4': true,
  'audio/ogg': true,
};

function resolveUploadMimeType(file: File): string {
  const raw = file.type?.toLowerCase().trim();
  if (raw === 'image/jpg') return 'image/jpeg';
  if (raw && SUPPORTED_MIME[raw]) return raw;

  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return raw?.startsWith('audio/') ? 'audio/webm' : 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'm4a':
      return 'audio/mp4';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
      return 'audio/ogg';
    case 'jpg':
    case 'jpeg':
    case 'heic':
    case 'heif':
      return 'image/jpeg';
    default:
      if (raw?.startsWith('video/')) return 'video/mp4';
      if (raw?.startsWith('audio/')) return 'audio/webm';
      return 'image/jpeg';
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function putWithProgress(
  url: string,
  file: File,
  mimeType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      const detail = xhr.responseText?.trim();
      reject(
        new Error(
          detail
            ? `Upload failed (${xhr.status}): ${detail.slice(0, 200)}`
            : `Upload failed (${xhr.status || 'network'}). Check that MinIO is running and the bucket exists.`,
        ),
      );
    });
    xhr.addEventListener('error', () =>
      reject(
        new Error(
          'Upload failed (network/CORS). Run npm run setup:minio:win in beancircle-api if using local MinIO.',
        ),
      ),
    );
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));
    xhr.send(file);
  });
}

/**
 * Production media flow: ask the API for a presigned URL, upload the bytes
 * directly to object storage (S3/R2/MinIO), and return only the public URL +
 * metadata. We NEVER embed file bytes (base64 data URLs) into messages.
 */
/** Convenience: upload a file to a folder and return only its public URL. */
export async function presignAndUpload(
  file: File,
  folder: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const result = await uploadMessageFile(file, folder, onProgress);
  return result.url;
}

export async function uploadMessageFile(
  file: File,
  folder = 'messages',
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  const mimeType = resolveUploadMimeType(file);

  // In mock mode there is no object storage to PUT bytes to, so we skip the
  // presign + upload dance and return the file as a local data URL.
  if (isMockMode()) {
    const url = await readFileAsDataUrl(file);
    onProgress?.(1);
    return { url, name: file.name, mimeType, size: file.size };
  }

  const presign = await api<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType: mimeType, folder }),
  });

  if (file.size > presign.maxBytes) {
    throw new Error(
      `File is too large (max ${(presign.maxBytes / (1024 * 1024)).toFixed(0)}MB).`,
    );
  }

  await putWithProgress(presign.uploadUrl, file, mimeType, onProgress);

  return {
    url: presign.publicUrl,
    name: file.name,
    mimeType,
    size: file.size,
  };
}
