import { api } from '@/lib/api/client';
import type { UserDocument, UserProfileStats } from '@/lib/models/user';

export async function getUserDocument(_uid: string): Promise<UserDocument | null> {
  try {
    return await api<UserDocument>('/users/me');
  } catch {
    return null;
  }
}

export async function getUserProfileStats(): Promise<UserProfileStats> {
  return api<UserProfileStats>('/users/me/stats');
}

export async function updateUserProfile(
  _uid: string,
  data: Partial<Pick<UserDocument, 'username' | 'position' | 'number' | 'stats' | 'displayName'>>,
): Promise<UserDocument> {
  return api<UserDocument>('/users/me', { method: 'PATCH', body: data });
}
