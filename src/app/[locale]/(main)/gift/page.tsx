'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';

export default function GiftPage() {
  const t = useTranslations('gift');
  const { locale } = useParams<{ locale: string }>();
  const [amount, setAmount] = useState('50000');
  const [voucher, setVoucher] = useState<{ qrDataUrl?: string; gift?: { voucherCode?: string } } | null>(null);

  async function sendGift() {
    const gift = await api<{ id: string; voucherCode?: string }>('/gifts', {
      method: 'POST',
      body: JSON.stringify({ amount: parseInt(amount, 10) }),
      locale,
    });
    if (gift.voucherCode) {
      const v = await api<{ qrDataUrl?: string }>(`/gifts/${gift.id}/voucher`, { locale });
      setVoucher({ ...v, gift });
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t('amount')}
      />
      <Button onClick={sendGift} className="w-full">
        {t('send')}
      </Button>
      {voucher?.qrDataUrl && (
        <div className="text-center">
          <p className="mb-2 font-medium">{t('voucher')}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={voucher.qrDataUrl} alt="QR" className="mx-auto w-48" />
          <p className="mt-2 text-sm">{voucher.gift?.voucherCode}</p>
        </div>
      )}
    </div>
  );
}
