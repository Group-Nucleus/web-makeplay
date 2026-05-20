import { api } from '@/lib/api/client';
import {
  clearSession,
  setSessionUser,
  type StoredUser,
} from '@/lib/api/token';
import {
  clearGuestParticipant,
  clearPendingGuestClaimToken,
  getPendingGuestClaimToken,
} from '@/lib/storage/guestParticipant';
import type { UserDocument } from '@/lib/models/user';

export interface GuestClaimResult {
  claimed: boolean;
  matchId?: string;
  participantId?: string;
}

export interface ApiSessionResponse {
  user: UserDocument;
  guestClaim?: GuestClaimResult;
}

function userToStored(u: UserDocument): StoredUser {
  return {
    uid: u.uid,
    displayName: u.displayName ?? null,
    email: u.email ?? null,
    photoURL: u.photoURL ?? null,
  };
}

function applyGuestClaim(session: ApiSessionResponse): void {
  if (session.guestClaim?.claimed && session.guestClaim.matchId) {
    clearGuestParticipant(session.guestClaim.matchId);
  }
  clearPendingGuestClaimToken();
}

export async function createApiSession(idToken: string): Promise<ApiSessionResponse> {
  const guestToken = getPendingGuestClaimToken() ?? undefined;
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, guestToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? 'Falha ao criar sessão');
  }
  const session = await res.json() as ApiSessionResponse;
  setSessionUser(userToStored(session.user));
  applyGuestClaim(session);
  return session;
}

export async function createPhoneSession(
  phone: string,
  password: string,
): Promise<ApiSessionResponse> {
  const guestToken = getPendingGuestClaimToken() ?? undefined;
  const res = await fetch('/api/auth/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, guestToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? 'Falha ao criar sessão');
  }
  const session = await res.json() as ApiSessionResponse;
  setSessionUser(userToStored(session.user));
  applyGuestClaim(session);
  return session;
}

export async function restoreApiSession(): Promise<StoredUser | null> {
  try {
    const me = await api<UserDocument>('/users/me');
    const user = userToStored(me);
    setSessionUser(user);
    return user;
  } catch {
    await clearApiSession();
    return null;
  }
}

export async function clearApiSession(): Promise<void> {
  clearSession();
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch {
    // best effort
  }
}
