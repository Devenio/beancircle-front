'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Gift, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

type Tab = 'send' | 'redeem';

export default function GiftPage() {
  const t = useTranslations('gift');
  const { locale } = useParams<{ locale: string }>();
  const [tab, setTab] = useState<Tab>('send');

  const [amount, setAmount] = useState('50000');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<{ qrDataUrl?: string; voucherCode?: string } | null>(null);

  const [voucherCode, setVoucherCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<'success' | 'error' | null>(null);
  const [redeemMessage, setRedeemMessage] = useState('');

  async function sendGift() {
    setSendLoading(true);
    setSendError(null);
    try {
      const gift = await api<{ id: string; voucherCode?: string }>('/gifts', {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(amount, 10) }),
        locale,
      });
      if (gift.voucherCode) {
        const v = await api<{ qrDataUrl?: string }>(`/gifts/${gift.id}/voucher`, { locale });
        setVoucher({ ...v, voucherCode: gift.voucherCode });
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send gift.');
    } finally {
      setSendLoading(false);
    }
  }

  async function redeemVoucher() {
    if (!voucherCode.trim()) return;
    setRedeemLoading(true);
    setRedeemResult(null);
    try {
      await api('/gifts/redeem', {
        method: 'POST',
        body: JSON.stringify({ voucherCode: voucherCode.trim() }),
        locale,
      });
      setRedeemResult('success');
      setRedeemMessage('Voucher redeemed successfully!');
      setVoucherCode('');
    } catch (err) {
      setRedeemResult('error');
      setRedeemMessage(err instanceof Error ? err.message : 'Invalid or already-used voucher.');
    } finally {
      setRedeemLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('title')}</h1>

      <div className="mb-6 flex rounded-xl bg-muted p-1">
        {(['send', 'redeem'] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition',
              tab === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
            )}
          >
            {k === 'send' ? <Gift className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
            {k === 'send' ? 'Send Gift' : 'Redeem Voucher'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="space-y-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('amount')}
          />
          {sendError && <p className="text-sm text-destructive">{sendError}</p>}
          <Button onClick={sendGift} disabled={sendLoading} className="w-full">
            {sendLoading ? 'Sending...' : t('send')}
          </Button>
          {voucher?.qrDataUrl && (
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="mb-3 font-semibold">{t('voucher')}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={voucher.qrDataUrl} alt="QR" className="mx-auto w-48 rounded-xl" />
              {voucher.voucherCode && (
                <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                  {voucher.voucherCode}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Share this QR or code with the recipient to redeem at any partner cafe.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'redeem' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the voucher code from a gift to redeem it at this cafe.
          </p>
          <Input
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Enter voucher code"
            className="font-mono uppercase tracking-widest"
          />
          {redeemResult && (
            <p
              className={cn(
                'rounded-lg px-3 py-2 text-sm',
                redeemResult === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {redeemMessage}
            </p>
          )}
          <Button
            onClick={redeemVoucher}
            disabled={redeemLoading || !voucherCode.trim()}
            className="w-full"
          >
            {redeemLoading ? 'Redeeming...' : 'Redeem Voucher'}
          </Button>
        </div>
      )}
    </div>
  );
}
