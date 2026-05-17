import type { ParticipantStatus } from '@/lib/models/match-document';

const PREFIX = 'boraplay/guest_participant/';
const PENDING_CLAIM_KEY = 'boraplay/pending_guest_claim_token';

export interface GuestParticipantRecord {
  participantId: string;
  name: string;
  status: ParticipantStatus;
  guestToken?: string;
}

export function getGuestParticipant(matchId: string): GuestParticipantRecord | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${PREFIX}${matchId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestParticipantRecord;
  } catch {
    return null;
  }
}

export function setGuestParticipant(matchId: string, record: GuestParticipantRecord): void {
  localStorage.setItem(`${PREFIX}${matchId}`, JSON.stringify(record));
}

export function clearGuestParticipant(matchId: string): void {
  localStorage.removeItem(`${PREFIX}${matchId}`);
}

export function getPendingGuestClaimToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PENDING_CLAIM_KEY);
}

export function setPendingGuestClaimToken(token: string): void {
  localStorage.setItem(PENDING_CLAIM_KEY, token);
}

export function clearPendingGuestClaimToken(): void {
  localStorage.removeItem(PENDING_CLAIM_KEY);
}
