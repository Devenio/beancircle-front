'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { useRouter } from '@/i18n/navigation';

type PresignResult = {
  uploadUrl: string;
  publicUrl: string;
  maxBytes: number;
};

async function uploadPhoto(file: File, locale: string): Promise<string> {
  const { uploadUrl, publicUrl } = await api<PresignResult>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType: file.type, folder: 'posts' }),
    locale,
  });
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  return publicUrl;
}

export default function CreatePostPage() {
  const t = useTranslations('nav');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function clearPhoto() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (!caption && !file) return;
    setLoading(true);
    setError(null);
    try {
      let photoUrls: string[] | undefined;
      if (file) {
        const url = await uploadPhoto(file, locale);
        photoUrls = [url];
      }
      const type = photoUrls ? (caption ? 'PHOTO_TEXT' : 'PHOTO') : 'TEXT';
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({ type, caption: caption || undefined, photoUrls }),
        locale,
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('create')}</h1>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <div className="relative mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="max-h-64 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-5 w-5" />
          Add photo
        </button>
      )}

      <textarea
        className="mb-3 w-full rounded-lg border border-neutral-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-neutral-700 dark:bg-background"
        rows={4}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What's on your mind?"
      />

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={loading || (!caption.trim() && !file)} className="w-full">
        {loading ? 'Posting...' : 'Post'}
      </Button>
    </div>
  );
}
