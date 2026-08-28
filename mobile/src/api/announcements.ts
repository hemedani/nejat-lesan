import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { Session } from '@/domain/types';

export type BackendAnnouncement = {
  _id: string;
  title: string;
  body: string;
  priority?: string;
  expires_at?: string;
  is_active?: boolean;
  createdAt?: string;
  /** Computed per-user on the backend (announcement_read). */
  is_read?: boolean;
  read_at?: string | null;
};

type GetsRequest = BackendActRequest<'main', 'announcement', 'gets'>;

const LIST_GET = {
  _id: 1,
  title: 1,
  body: 1,
  priority: 1,
  expires_at: 1,
  is_active: 1,
  createdAt: 1,
} as const;

export function fetchAnnouncements(
  session: Session,
  pagination: { page?: number; limit?: number } = {},
  options: ApiRequestOptions = {},
): Promise<BackendAnnouncement[]> {
  const request = {
    service: 'main',
    model: 'announcement',
    act: 'gets',
    details: {
      set: {
        ...(pagination.page != null ? { page: pagination.page } : {}),
        ...(pagination.limit != null ? { limit: pagination.limit } : {}),
      },
      get: LIST_GET,
    },
  } as unknown as GetsRequest;

  return callTypedAct<'main', 'announcement', 'gets', BackendAnnouncement[]>(
    request as never,
    { token: session.token, ...options },
  );
}

export function markAnnouncementRead(
  session: Session,
  announcementId: string,
  options: ApiRequestOptions = {},
): Promise<BackendAnnouncement> {
  return callTypedAct<'main', 'announcement', 'markRead', BackendAnnouncement>(
    {
      service: 'main',
      model: 'announcement',
      act: 'markRead',
      details: {
        set: { announcementId },
        get: LIST_GET,
      },
    },
    { token: session.token, ...options },
  );
}

const UNREAD_COUNT_GET = { count: 1 } as const;

export async function fetchUnreadCount(
  session: Session,
  options: ApiRequestOptions = {},
): Promise<number> {
  const body = await callTypedAct<
    'main',
    'announcement',
    'getUnreadCount',
    { count: number }
  >(
    {
      service: 'main',
      model: 'announcement',
      act: 'getUnreadCount',
      details: {
        set: {},
        get: UNREAD_COUNT_GET,
      },
    },
    { token: session.token, ...options },
  );
  return typeof body?.count === 'number' ? body.count : 0;
}
