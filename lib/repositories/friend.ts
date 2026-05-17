import { api } from '@/lib/api/client';
import type { FriendshipDto } from '@/lib/api/types/social';

export async function listFriendshipsSent(): Promise<FriendshipDto[]> {
  return api<FriendshipDto[]>('/friendships?direction=sent');
}

export async function listFriendshipsReceived(): Promise<FriendshipDto[]> {
  return api<FriendshipDto[]>('/friendships?direction=received');
}

export async function sendFriendRequest(toUid: string): Promise<FriendshipDto> {
  return api<FriendshipDto>('/friendships', { method: 'POST', body: { toUid } });
}

export async function acceptFriendRequest(fromUid: string): Promise<FriendshipDto> {
  return api<FriendshipDto>(`/friendships/${fromUid}/accept`, { method: 'POST' });
}

export async function rejectFriendRequest(fromUid: string): Promise<void> {
  await api<void>(`/friendships/${fromUid}`, { method: 'DELETE' });
}
