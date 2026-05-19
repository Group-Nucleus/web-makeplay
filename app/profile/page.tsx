'use client';

import { Activity, LogOut, Pencil, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/context';
import type { UserDocument, UserProfileStats } from '@/lib/models/user';
import {
  getUserDocument,
  getUserProfileStats,
  updateUserProfile,
} from '@/lib/repositories/user';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import {
  acceptFriendRequest,
  listFriendshipsReceived,
  rejectFriendRequest,
} from '@/lib/repositories/friend';
import type { FriendshipDto } from '@/lib/api/types/social';

function ProgressRing({ rating }: { rating: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (rating / 100) * c;
  return (
    <div className="relative h-[100px] w-[100px] shrink-0">
      <svg className="-rotate-90" width="100" height="100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-lime)"
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-lime">
        {rating}
      </span>
    </div>
  );
}

export default function Page() {
  const { user, apiSessionReady, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [stats, setStats] = useState<UserProfileStats>({
    matchesPlayed: 0,
    matchesOrganized: 0,
    totalSpent: 0,
    matchesPaid: 0,
    avgSpent: 0,
  });
  const [requests, setRequests] = useState<FriendshipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    position: 'ATA',
    number: '0',
    atk: '50',
    def: '50',
    str: '50',
    skl: '50',
  });

  const load = useCallback(async () => {
    if (!user?.uid || !apiSessionReady) {
      setLoading(false);
      return;
    }
    try {
      const [p, s, r] = await Promise.all([
        getUserDocument(user.uid),
        getUserProfileStats(),
        listFriendshipsReceived(),
      ]);
      setProfile(p);
      setStats(s);
      setRequests(r.filter((x) => x.status === 'pending'));
      if (p) {
        setForm({
          username: p.username ?? '',
          position: p.position ?? 'ATA',
          number: String(p.number ?? 0),
          atk: String(p.stats?.atk ?? 50),
          def: String(p.stats?.def ?? 50),
          str: String(p.stats?.str ?? 50),
          skl: String(p.stats?.skl ?? 50),
        });
      }
    } catch (e) {
      console.error('[profile]', e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, apiSessionReady]);

  useEffect(() => {
    void load();
  }, [load]);

  const rating =
    profile?.stats?.rating ??
    Math.round(
      (Number(form.atk) + Number(form.def) + Number(form.str) + Number(form.skl)) / 4,
    );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateUserProfile(user.uid, {
        username: form.username,
        position: form.position,
        number: Number(form.number) || 0,
        stats: {
          atk: Number(form.atk) || 50,
          def: Number(form.def) || 50,
          str: Number(form.str) || 50,
          skl: Number(form.skl) || 50,
          rating: Math.round(
            (Number(form.atk) + Number(form.def) + Number(form.str) + Number(form.skl)) / 4,
          ),
        },
      });
      setProfile(updated);
      setEditOpen(false);
    } catch (e) {
      console.error('[profile save]', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-lime bg-card">
            <User className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile?.displayName || 'Jogador'}
            </h1>
            <p className="text-muted">@{profile?.username || 'sem_username'}</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded bg-[#C4915C] px-2 py-0.5 text-xs font-bold text-black">
                {profile?.position ?? 'ATA'}
              </span>
              <span className="rounded border border-lime px-2 py-0.5 text-xs font-bold text-lime">
                #{profile?.number ?? 0}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-black">
            <Pencil className="h-4 w-4" />
            Editar perfil
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-red-500 px-4 py-2.5 text-sm font-bold text-red-400">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#C4915C] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted">
                CARTÃO DO JOGADOR
              </span>
              <Activity className="h-5 w-5 text-[#C4915C]" />
            </div>
            <div className="flex gap-6">
              <ProgressRing rating={rating} />
              <div className="flex flex-1 flex-col justify-center gap-3">
                {(['ATK', 'DEF', 'STR', 'SKL'] as const).map((label) => {
                  const key = label.toLowerCase() as 'atk' | 'def' | 'str' | 'skl';
                  const val = profile?.stats?.[key] ?? Number(form[key]);
                  return (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted">{label}</span>
                        <span className="text-white">{val}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-lime"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold tracking-wider text-muted">CONTA</h3>
            <div className="rounded-xl bg-card px-4">
              <div className="flex justify-between border-b border-elevated py-3.5">
                <span className="text-muted">Email</span>
                <span className="max-w-[60%] truncate text-sm font-medium text-white">
                  {profile?.email || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-bold tracking-wider text-muted">PARTIDAS</h3>
            <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-card">
              {[
                { v: stats.matchesPlayed, l: 'JOGADOS' },
                { v: stats.matchesPaid, l: 'DENTRO' },
                { v: stats.matchesOrganized, l: 'ORGANIZADOS' },
              ].map(({ v, l }) => (
                <div key={l} className="border-r border-elevated p-4 text-center last:border-0">
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-[10px] font-bold tracking-wider text-muted">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {requests.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-wider text-muted">
                PEDIDOS PENDENTES
              </h3>
              <div className="rounded-xl bg-card">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 border-b border-elevated px-4 py-3 last:border-0">
                    <span className="flex-1 text-sm text-white">{req.fromUid}</span>
                    <button
                      type="button"
                      onClick={() => rejectFriendRequest(req.fromUid).then(load)}
                      className="rounded-full border border-red-500/50 p-1.5 text-red-400">
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest(req.fromUid).then(load)}
                      className="rounded-full bg-lime p-1.5 text-black">
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalSpent > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-wider text-muted">INVESTIMENTO</h3>
              <div className="rounded-xl bg-card px-4 py-2">
                <div className="flex justify-between py-3">
                  <span className="text-muted">Total gasto</span>
                  <span className="font-medium text-white">
                    R$ {stats.totalSpent.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileEditModal
        open={editOpen}
        form={form}
        saving={saving}
        onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
