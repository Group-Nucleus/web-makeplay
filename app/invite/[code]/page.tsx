'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { matchPathWithCode } from '@/lib/guestRoutes';
import { getInviteByCode, normalizeInviteIndexId } from '@/lib/repositories/match';
import { setGuestInviteContext } from '@/lib/storage/guestInvite';

export default function InviteRedirectPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = normalizeInviteIndexId(params.code);
    if (!code) {
      setError('Código de convite inválido.');
      return;
    }

    void (async () => {
      const row = await getInviteByCode(code);
      if (row?.matchId) {
        setGuestInviteContext({ matchId: row.matchId, code });
        router.replace(matchPathWithCode(row.matchId, code));
        return;
      }
      setError('Convite não encontrado ou expirado.');
    })();
  }, [params.code, router]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white">{error}</p>
        <p className="max-w-sm text-sm text-[#888]">
          Confirma o link com quem te convidou. O endereço deve ser algo como{' '}
          <span className="text-[#BFFF00]">/invite/ABC123</span>.
        </p>
        <Link href="/login" className="text-sm font-bold text-[#BFFF00]">
          Entrar com conta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
    </div>
  );
}

