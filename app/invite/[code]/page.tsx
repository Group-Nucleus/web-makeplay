'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getInviteByCode, normalizeInviteIndexId } from '@/lib/repositories/match';

export default function InviteRedirectPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = normalizeInviteIndexId(params.code);
    void (async () => {
      const row = await getInviteByCode(code);
      if (row) {
        router.replace(`/match/${row.matchId}?code=${code}`);
      } else {
        router.replace('/explore');
      }
    })();
  }, [params.code, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
    </div>
  );
}
