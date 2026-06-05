import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { E2E_LOCALE } from './settings';

const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001/api/v1';

export const NIMA_PHONE = '+989121111111';
export const SARA_PHONE = '+989122222222';
export const ADMIN_PHONE = '+989120000000';

export type ConversationSummary = {
  id: string;
  otherMember?: { id: string; username?: string | null; name?: string | null };
  pinned?: boolean;
  muted?: boolean;
  unreadCount?: number;
};

export type ChatMessageSummary = {
  id: string;
  body?: string | null;
  senderId?: string;
  pinned?: boolean;
  deletedAt?: string | null;
};

/** Build a locale-aware messages path, e.g. `/en/messages/archived`. */
export function messagesPath(subpath = '') {
  const normalized = subpath.replace(/^\//, '').replace(/^messages\/?/, '');
  return normalized ? `/${E2E_LOCALE}/messages/${normalized}` : `/${E2E_LOCALE}/messages`;
}

export function messagesUrlPattern(subpath = '') {
  const normalized = subpath.replace(/^\//, '').replace(/^messages\/?/, '');
  if (!normalized) return new RegExp(`/${E2E_LOCALE}/messages/?$`);
  if (normalized.match(/^[a-f0-9-]{36}$/i)) {
    return new RegExp(`/${E2E_LOCALE}/messages/${normalized}`);
  }
  return new RegExp(`/${E2E_LOCALE}/messages/${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

export function chatRoomUrlPattern() {
  return new RegExp(`/${E2E_LOCALE}/messages/[^/]+$`);
}

export async function gotoMessages(page: Page, subpath = '') {
  await page.goto(messagesPath(subpath));
  await page.waitForLoadState('domcontentloaded');
}

export async function resetChatLocalState(page: Page) {
  const origin = page.url();
  if (!origin || origin === 'about:blank' || !origin.startsWith('http')) {
    await gotoMessages(page);
  }
  await page.evaluate(() => {
    localStorage.removeItem('beancircle-chat-archive');
  });
}

export async function waitForConversations(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/conversations\/?$/.test(new URL(res.url()).pathname) &&
      res.request().method() === 'GET' &&
      res.ok(),
    { timeout: 20_000 },
  );
}

export async function waitForMessages(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/conversations\/[^/]+\/messages/.test(res.url()) &&
      res.request().method() === 'GET' &&
      res.ok(),
    { timeout: 20_000 },
  );
}

export async function waitForMessagePost(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/conversations\/[^/]+\/messages\/?$/.test(new URL(res.url()).pathname) &&
      res.request().method() === 'POST' &&
      res.ok(),
    { timeout: 15_000 },
  );
}

export async function waitForMessagePatch(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/conversations\/[^/]+\/messages\/[^/]+$/.test(new URL(res.url()).pathname) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
    { timeout: 15_000 },
  );
}

export async function waitForMessageDelete(page: Page) {
  await page.waitForResponse(
    (res) =>
      /\/api\/v1\/conversations\/[^/]+\/messages\/[^/]+$/.test(new URL(res.url()).pathname) &&
      res.request().method() === 'DELETE' &&
      res.ok(),
    { timeout: 15_000 },
  );
}

export async function waitForConversationMutation(page: Page, method: 'POST' | 'DELETE') {
  await page.waitForResponse(
    (res) => {
      const path = new URL(res.url()).pathname;
      return (
        (/\/api\/v1\/conversations\/[^/]+\/(pin|mute|read)/.test(path) ||
          /\/api\/v1\/conversations\/[^/]+\/messages\/?$/.test(path) ||
          /\/api\/v1\/conversations\/?$/.test(path)) &&
        res.request().method() === method &&
        res.ok()
      );
    },
    { timeout: 15_000 },
  );
}

export async function hideNextDevOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal,[data-nextjs-dev-overlay]').forEach((el) => {
      const node = el as HTMLElement;
      node.style.display = 'none';
      node.style.pointerEvents = 'none';
    });
  });
}

export async function longPress(locator: Locator, holdMs = 550) {
  await locator.click({ delay: holdMs });
}

export async function swipeConversationRow(
  page: Page,
  peer: string | RegExp,
  direction: 'left' | 'right',
) {
  const row = conversationRow(page, peer);
  const box = await row.boundingBox();
  if (!box) throw new Error('Cannot swipe: conversation row not visible');

  const y = box.y + box.height / 2;
  const startX = box.x + box.width * (direction === 'left' ? 0.85 : 0.15);
  const endX = box.x + box.width * (direction === 'left' ? 0.15 : 0.85);

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
}

export async function openInbox(page: Page) {
  await gotoMessages(page);
  await waitForConversations(page);
}

export async function openChatWithPeer(page: Page, peer: string | RegExp) {
  await openInbox(page);
  await page
    .getByRole('link')
    .filter({ hasText: peer })
    .first()
    .click();
  await page.waitForURL(chatRoomUrlPattern());
  await waitForMessages(page);
}

export function conversationRow(page: Page, peer: string | RegExp) {
  return page.getByRole('link').filter({ hasText: peer }).first();
}

export async function waitForMessagePin(page: Page) {
  await page.waitForResponse(
    (res) => res.url().includes('/pin') && res.request().method() === 'POST' && res.ok(),
    { timeout: 15_000 },
  );
}

export async function openConversationContextMenu(page: Page, peer: string | RegExp) {
  const row = conversationRow(page, peer);
  await row.dispatchEvent('contextmenu', { bubbles: true, button: 2 });
  await page.getByRole('menuitem').first().waitFor({ timeout: 8000 });
}

export async function openConversationActions(page: Page, peer: string | RegExp) {
  const row = page.locator('.relative.overflow-hidden.rounded-2xl').filter({
    has: page.getByRole('link').filter({ hasText: peer }),
  });
  await row.click({ delay: 550, position: { x: 10, y: 10 } });
  await page.getByText('Conversation actions').waitFor({ timeout: 8000 });
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function apiGetConversations(
  request: APIRequestContext,
  token: string,
): Promise<ConversationSummary[]> {
  const res = await request.get(`${apiURL}/conversations`, { headers: authHeaders(token) });
  if (!res.ok()) throw new Error(`GET conversations failed: ${res.status()}`);
  return res.json();
}

export async function apiGetUserByUsername(
  request: APIRequestContext,
  token: string,
  username: string,
) {
  const res = await request.get(`${apiURL}/users/${username}`, { headers: authHeaders(token) });
  if (!res.ok()) throw new Error(`GET user ${username} failed: ${res.status()}`);
  return res.json() as Promise<{ id: string; username?: string; name?: string }>;
}

export async function apiEnsureConversationWithPeer(
  request: APIRequestContext,
  token: string,
  peerUsername: string,
): Promise<ConversationSummary> {
  const conversations = await apiGetConversations(request, token);
  const existing = conversations.find((c) => c.otherMember?.username === peerUsername);
  if (existing) return existing;

  const peer = await apiGetUserByUsername(request, token, peerUsername);
  const res = await request.post(`${apiURL}/conversations`, {
    headers: authHeaders(token),
    data: { participantId: peer.id },
  });
  if (!res.ok()) throw new Error(`POST conversation failed: ${res.status()}`);
  const created = await res.json();
  const refreshed = await apiGetConversations(request, token);
  return (
    refreshed.find((c) => c.id === created.id) ??
    refreshed.find((c) => c.otherMember?.username === peerUsername) ?? {
      id: created.id,
      otherMember: peer,
    }
  );
}

export async function apiSendMessage(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  body: string,
): Promise<ChatMessageSummary> {
  const res = await request.post(`${apiURL}/conversations/${conversationId}/messages`, {
    headers: authHeaders(token),
    data: { body, type: 'text' },
  });
  if (!res.ok()) throw new Error(`POST message failed: ${res.status()}`);
  return res.json();
}

export async function apiUnblockUser(
  request: APIRequestContext,
  token: string,
  userId: string,
) {
  await request.delete(`${apiURL}/users/${userId}/block`, { headers: authHeaders(token) });
}

export async function apiSetConversationPinned(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  pinned: boolean,
) {
  await request.post(`${apiURL}/conversations/${conversationId}/pin`, {
    headers: authHeaders(token),
    data: { pinned },
  });
}

export async function apiSetConversationMuted(
  request: APIRequestContext,
  token: string,
  conversationId: string,
  muted: boolean,
) {
  await request.post(`${apiURL}/conversations/${conversationId}/mute`, {
    headers: authHeaders(token),
    data: { muted },
  });
}

export async function apiUnarchiveConversation(page: Page, conversationId: string) {
  await page.evaluate((id) => {
    const raw = localStorage.getItem('beancircle-chat-archive');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { state?: { archivedAt?: Record<string, string> } };
      if (parsed.state?.archivedAt) {
        delete parsed.state.archivedAt[id];
        localStorage.setItem('beancircle-chat-archive', JSON.stringify(parsed));
      }
    } catch {
      localStorage.removeItem('beancircle-chat-archive');
    }
  }, conversationId);
}
