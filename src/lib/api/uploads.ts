import { api } from '@/lib/api/client';

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

/**
 * Production media flow: ask the API for a presigned URL, upload the bytes
 * directly to object storage (S3/R2/MinIO), and return only the public URL +
 * metadata. We NEVER embed file bytes (base64 data URLs) into messages.
 */
export async function uploadMessageFile(
  file: File,
  folder = 'messages',
): Promise<UploadResult> {
  const presign = await api<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType: file.type, folder }),
  });

  if (file.size > presign.maxBytes) {
    throw new Error(
      `File is too large (max ${(presign.maxBytes / (1024 * 1024)).toFixed(0)}MB).`,
    );
  }

  const res = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) {
    throw new Error('Upload failed. Please try again.');
  }

  return {
    url: presign.publicUrl,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  };
}
