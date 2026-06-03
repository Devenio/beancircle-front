import { api } from './client';

export type EventType =
  | 'OPEN_MIC'
  | 'GAME_NIGHT'
  | 'STUDY_GROUP'
  | 'STARTUP_MEETUP'
  | 'MUSIC_NIGHT'
  | 'COFFEE_WORKSHOP'
  | 'BOOK_CLUB'
  | 'OTHER';

export type RsvpStatus = 'GOING' | 'INTERESTED';

export type EventHost = {
  id: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export type EventListItem = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startsAt: string;
  endsAt: string;
  coverUrl?: string | null;
  locationLabel?: string | null;
  capacity?: number | null;
  cafe?: { id: string; name: string; address?: string } | null;
  city?: { id: string; name: string } | null;
  host?: EventHost | null;
  _count?: { rsvps: number };
};

export type EventDetail = EventListItem & {
  myRsvp: RsvpStatus | null;
  myReminder: string | null;
};

export type EventParticipant = {
  id: string;
  status: RsvpStatus;
  user: EventHost;
};

export function listEvents(
  locale: string,
  params: { cityId?: string; type?: EventType } = {},
): Promise<EventListItem[]> {
  const qs = new URLSearchParams();
  if (params.cityId) qs.set('cityId', params.cityId);
  if (params.type) qs.set('type', params.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api<EventListItem[]>(`/events${suffix}`, { locale });
}

export function getEvent(id: string, locale: string): Promise<EventDetail> {
  return api<EventDetail>(`/events/${id}`, { locale });
}

export function getEventParticipants(
  id: string,
  locale: string,
): Promise<EventParticipant[]> {
  return api<EventParticipant[]>(`/events/${id}/participants`, { locale });
}

export function rsvpEvent(id: string, status: RsvpStatus, locale: string) {
  return api(`/events/${id}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ status }),
    locale,
  });
}

export function setEventReminder(id: string, locale: string, remindAt?: string) {
  return api(`/events/${id}/reminder`, {
    method: 'POST',
    body: JSON.stringify(remindAt ? { remindAt } : {}),
    locale,
  });
}

export function clearEventReminder(id: string, locale: string) {
  return api(`/events/${id}/reminder`, { method: 'DELETE', locale });
}
