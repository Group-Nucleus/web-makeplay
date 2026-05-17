import { api } from '@/lib/api/client';
import {
  clearSession,
  getAccessToken,
  setAccessToken,
  setSessionUser,
  type StoredUser,
} from '@/lib/api/token';
import type { UserDocument } from '@/lib/models/user';

export interface ApiSessionResponse {
  accessToken: string;
  user: UserDocument;
}

function userToStored(u: UserDocument): StoredUser {
  return {
    uid: u.uid,
    displayName: u.displayName ?? null,
    email: u.email ?? null,
    photoURL: u.photoURL ?? null,
  };
}

export async function createApiSession(idToken: string): Promise<ApiSessionResponse> {
  const session = await api<ApiSessionResponse>('/auth/session', {
    method: 'POST',
    body: { idToken },
    skipAuth: true,
  });
  setAccessToken(session.accessToken);
  setSessionUser(userToStored(session.user));
  return session;
}

export async function createPhoneSession(
  phone: string,
  password: string,
): Promise<ApiSessionResponse> {
  const session = await api<ApiSessionResponse>('/auth/phone', {
    method: 'POST',
    body: { phone, password },
    skipAuth: true,
  });
  setAccessToken(session.accessToken);
  setSessionUser(userToStored(session.user));
  return session;
}

export async function restoreApiSession(): Promise<StoredUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const me = await api<UserDocument>('/users/me');
    const user = userToStored(me);
    setSessionUser(user);
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export async function clearApiSession(): Promise<void> {
  clearSession();
}
