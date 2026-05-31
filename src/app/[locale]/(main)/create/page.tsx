'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { useRouter } from '@/i18n/navigation';

export default function CreatePostPage() {
  const t = useTranslations('nav');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const type = photoUrl ? (caption ? 'PHOTO_TEXT' : 'PHOTO') : 'TEXT';
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          type,
          caption: caption || undefined,
          photoUrls: photoUrl ? [photoUrl] : undefined,
        }),
        locale,
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('create')}</h1>
      <Input
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        placeholder="Image URL"
        className="mb-3"
      />
      <textarea
        className="mb-3 w-full rounded-lg border border-neutral-300 p-3 text-sm"
        rows={4}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption"
      />
      <Button onClick={submit} disabled={loading} className="w-full">
        Post
      </Button>
    </div>
  );
}
