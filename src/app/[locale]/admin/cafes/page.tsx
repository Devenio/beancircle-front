'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Search, Star, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/admin/primitives';
import {
  adminDeleteCafe,
  adminListCafes,
  adminUpdateCafe,
} from '@/lib/api/admin';

export default function CafesPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-cafes', search, locale],
    queryFn: () => adminListCafes({ q: search, locale }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-cafes'] });
  const setPartner = useMutation({
    mutationFn: ({ id, isPartner }: { id: string; isPartner: boolean }) =>
      adminUpdateCafe(id, { isPartner }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCafe(id),
    onSuccess: invalidate,
  });

  const cafes = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Cafes"
        subtitle="Partner status, menus, and removal."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
        className="mb-4 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cafes…"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <Table>
        <thead className="bg-muted/40">
          <tr>
            <Th>Cafe</Th>
            <Th>City</Th>
            <Th className="text-right">Rating</Th>
            <Th className="text-right">Followers</Th>
            <Th>Partner</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cafes.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-muted/30">
              <Td>
                <div className="font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.address}
                </div>
              </Td>
              <Td className="text-muted-foreground">{c.city?.name ?? '—'}</Td>
              <Td className="text-right">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="size-3.5 fill-current text-amber-500" />
                  {c.avgRating.toFixed(1)}
                </span>
              </Td>
              <Td className="text-right tabular-nums">{c.followerCount}</Td>
              <Td>
                <Switch
                  checked={c.isPartner}
                  onCheckedChange={(isPartner) =>
                    setPartner.mutate({ id: c.id, isPartner })
                  }
                />
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/admin/menus?cafeId=${c.id}`} />}
                  >
                    Menu
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm(`Delete ${c.name}?`)) del.mutate(c.id);
                    }}
                    title="Delete cafe"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {data && cafes.length === 0 ? (
        <EmptyState>No cafes found.</EmptyState>
      ) : null}
    </div>
  );
}
