import { expect, test } from '@playwright/test';
import { injectSession, loginWithPhone, type AuthSession } from './helpers/auth';
import {
  apiEnsureConversationWithPeer,
  apiGetUserByUsername,
  apiSendMessage,
  apiSetConversationMuted,
  apiSetConversationPinned,
  apiUnarchiveConversation,
  apiUnblockUser,
  chatRoomUrlPattern,
  conversationRow,
  gotoMessages,
  hideNextDevOverlay,
  longPress,
  messagesUrlPattern,
  NIMA_PHONE,
  openChatWithPeer,
  openConversationContextMenu,
  openInbox,
  resetChatLocalState,
  swipeConversationRow,
  waitForConversationMutation,
  waitForConversations,
  waitForMessageDelete,
  waitForMessagePatch,
  waitForMessagePin,
  waitForMessagePost,
  waitForMessages,
} from './helpers/messages';
import { gotoSettings, settingsUrlPattern, waitForSettingsPatch } from './helpers/settings';

const PEER_NAME = /Sara/i;

test.describe.configure({ mode: 'serial' });

test.describe('Messages E2E', () => {
  let authSession: AuthSession;
  let authToken: string;
  let conversationId: string;

  test.beforeAll(async ({ request }) => {
    authSession = await loginWithPhone(request, NIMA_PHONE);
    authToken = authSession.accessToken;
    const sara = await apiGetUserByUsername(request, authToken, 'sara');
    await apiUnblockUser(request, authToken, sara.id);
    const conversation = await apiEnsureConversationWithPeer(request, authToken, 'sara');
    conversationId = conversation.id;
  });

  test.beforeEach(async ({ page, request }) => {
    authToken = authSession.accessToken;
    const sara = await apiGetUserByUsername(request, authToken, 'sara');
    await apiUnblockUser(request, authToken, sara.id);
    await apiSetConversationPinned(request, authToken, conversationId, false);
    await apiSetConversationMuted(request, authToken, conversationId, false);
    await injectSession(page, authSession);
    await resetChatLocalState(page);
    await apiUnarchiveConversation(page, conversationId);
  });

  test.describe('Inbox', () => {
    test('hub loads with search and peer conversation', async ({ page }) => {
      await openInbox(page);
      await expect(page.getByRole('heading', { name: 'Messages', level: 1 })).toBeVisible();
      await expect(page.getByPlaceholder(/search chats or people/i)).toBeVisible();
      await expect(conversationRow(page, PEER_NAME)).toBeVisible();
    });

    test('search filters conversations by preview text', async ({ page, request }) => {
      const unique = `e2e-filter-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, unique);

      await openInbox(page);
      await page.getByPlaceholder(/search chats or people/i).fill(unique);
      await expect(conversationRow(page, PEER_NAME)).toBeVisible();
      await page.getByPlaceholder(/search chats or people/i).fill('zzzz-not-found-xyz');
      await expect(conversationRow(page, PEER_NAME)).not.toBeVisible();
    });

    test('search finds admin and opens chat', async ({ page }) => {
      await openInbox(page);
      await page.getByPlaceholder(/search chats or people/i).fill('admin');

      const startChat = page.getByRole('button').filter({ hasText: /^message$/i });
      if (await startChat.count()) {
        await startChat.first().click();
      } else {
        await conversationRow(page, /admin/i).click();
      }

      await page.waitForURL(chatRoomUrlPattern());
      await waitForMessages(page);
      await expect(page.getByRole('button', { name: 'Chat options' })).toBeVisible();
    });
  });

  test.describe('Chat room — messaging', () => {
    test('opens thread and sends a text message', async ({ page }) => {
      const body = `e2e-send-${Date.now()}`;
      await openChatWithPeer(page, PEER_NAME);

      const postPromise = waitForMessagePost(page);
      await page.getByPlaceholder(/message…/i).fill(body);
      await page.getByRole('button', { name: 'Send' }).click();
      await postPromise;

      await expect(page.getByText(body, { exact: true })).toBeVisible();
    });

    test('replies to a message', async ({ page, request }) => {
      const body = `e2e-reply-target-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, body);
      await openChatWithPeer(page, PEER_NAME);

      await longPress(page.getByText(body, { exact: true }).last());
      await page.getByRole('button', { name: 'Reply' }).click();
      await expect(page.getByText('Reply', { exact: true })).toBeVisible();

      const replyBody = `e2e-reply-${Date.now()}`;
      const postPromise = waitForMessagePost(page);
      await page.getByPlaceholder(/message…/i).fill(replyBody);
      await page.getByRole('button', { name: 'Send' }).click();
      await postPromise;
      await expect(page.getByText(replyBody, { exact: true })).toBeVisible();
    });

    test('edits an own message', async ({ page, request }) => {
      const body = `e2e-edit-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, body);
      await openChatWithPeer(page, PEER_NAME);

      await longPress(page.getByText(body, { exact: true }).last());
      await page.getByRole('button', { name: 'Edit' }).click();

      const edited = `${body}-updated`;
      const patchPromise = waitForMessagePatch(page);
      await page.getByRole('textbox', { name: 'Edit message' }).fill(edited);
      await page.getByRole('button', { name: 'Save' }).click();
      await patchPromise;
      await expect(page.getByText(edited, { exact: true })).toBeVisible();
    });

    test('searches within the conversation', async ({ page, request }) => {
      const needle = `e2e-search-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, needle);
      await openChatWithPeer(page, PEER_NAME);

      await page.getByRole('button', { name: 'Chat options' }).click();
      await page.getByRole('menuitem', { name: /search in conversation/i }).click();
      await page.getByPlaceholder(/search in conversation/i).fill(needle);
      await expect(page.getByText('1/1')).toBeVisible({ timeout: 10_000 });
    });

    test('returns to inbox from chat header', async ({ page }) => {
      await openChatWithPeer(page, PEER_NAME);
      await page.getByRole('link', { name: /back to conversations/i }).click();
      await expect(page).toHaveURL(messagesUrlPattern());
    });
  });

  test.describe('Chat room — message actions', () => {
    test('pins a message from the actions sheet', async ({ page, request }) => {
      const body = `e2e-pin-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, body);
      await openChatWithPeer(page, PEER_NAME);

      await longPress(page.getByText(body, { exact: true }).last());
      const pinPromise = waitForMessagePin(page);
      await page.getByRole('button', { name: 'Pin' }).click();
      await pinPromise;
      await expect(page.getByText('Pinned message')).toBeVisible();
    });

    test('deletes a message for me only', async ({ page, request }) => {
      const body = `e2e-delete-me-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, body);
      await openChatWithPeer(page, PEER_NAME);

      await longPress(page.getByText(body, { exact: true }).last());
      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByText(/remove this message from your view/i)).toBeVisible();
      const deletePromise = waitForMessageDelete(page);
      await page.getByRole('button', { name: 'Delete' }).last().click();
      await deletePromise;
      await expect(page.getByText(body, { exact: true })).not.toBeVisible();
    });

    test('multi-select copies selected messages', async ({ page, request }) => {
      const body = `e2e-select-${Date.now()}`;
      await apiSendMessage(request, authToken, conversationId, body);
      await openChatWithPeer(page, PEER_NAME);

      await longPress(page.getByText(body, { exact: true }).last());
      await page.getByRole('button', { name: /select messages/i }).click();
      await expect(page.getByText('1 selected')).toBeVisible();
      await hideNextDevOverlay(page);
      await page.getByRole('button', { name: 'Copy' }).click({ force: true });
      await expect(page.getByPlaceholder(/message…/i)).toBeVisible();
    });
  });

  test.describe('Inbox — conversation management', () => {
    test('pins and mutes a chat from the context menu', async ({ page }) => {
      await openInbox(page);
      const row = conversationRow(page, PEER_NAME);

      await openConversationContextMenu(page, PEER_NAME);
      const pinPromise = waitForConversationMutation(page, 'POST');
      await page.getByRole('menuitem', { name: /pin chat/i }).click();
      await pinPromise;

      await openConversationContextMenu(page, PEER_NAME);
      const mutePromise = waitForConversationMutation(page, 'POST');
      await page.getByRole('menuitem', { name: /^mute$/i }).click();
      await mutePromise;

      await openConversationContextMenu(page, PEER_NAME);
      await page.getByRole('menuitem', { name: /^unmute$/i }).click();
    });

    test('archives and restores a chat', async ({ page }) => {
      await openInbox(page);
      await openConversationContextMenu(page, PEER_NAME);
      await page.getByRole('menuitem', { name: /^archive$/i }).click();

      await expect(conversationRow(page, PEER_NAME)).not.toBeVisible({ timeout: 5000 });

      await gotoMessages(page, 'archived');
      await expect(page).toHaveURL(messagesUrlPattern('archived'));
      await expect(conversationRow(page, PEER_NAME)).toBeVisible();

      await swipeConversationRow(page, PEER_NAME, 'right');
      await page.getByRole('button', { name: /^unarchive$/i }).click();

      await gotoMessages(page);
      await waitForConversations(page);
      await expect(conversationRow(page, PEER_NAME)).toBeVisible();
    });

    test('deletes a chat for me from the context menu', async ({ page, request }) => {
      await openInbox(page);
      await openConversationContextMenu(page, PEER_NAME);
      await page.getByRole('menuitem', { name: /delete chat/i }).click();
      await expect(page.getByText(/remove this chat from your inbox/i)).toBeVisible();
      const deletePromise = waitForConversationMutation(page, 'DELETE');
      await page.getByRole('button', { name: 'Delete' }).last().click();
      await deletePromise;
      await expect(conversationRow(page, PEER_NAME)).not.toBeVisible();

      await apiEnsureConversationWithPeer(request, authToken, 'sara');
    });
  });

  test.describe('Block & safety', () => {
    test('blocks and unblocks the peer from chat options', async ({ page, request }) => {
      await openChatWithPeer(page, PEER_NAME);

      await page.getByRole('button', { name: 'Chat options' }).click();
      await page.getByRole('menuitem', { name: /block user/i }).click();
      await page.getByRole('button', { name: 'Block user' }).last().click();
      await expect(page.getByText('Messaging unavailable')).toBeVisible({ timeout: 10_000 });

      await page.getByRole('button', { name: 'Chat options' }).click();
      await page.getByRole('menuitem', { name: /^unblock$/i }).click();

      const sara = await apiGetUserByUsername(request, authToken, 'sara');
      await apiUnblockUser(request, authToken, sara.id);
    });
  });

  test.describe('Chat settings', () => {
    test('typing indicators toggle persists on settings chat page', async ({ page }) => {
      await gotoSettings(page, 'chat');
      await expect(page).toHaveURL(settingsUrlPattern('chat'));
      await expect(page.getByRole('heading', { name: /chat preferences/i, level: 1 })).toBeVisible();

      const toggle = page.getByRole('switch', { name: /typing indicators/i });
      const before = await toggle.getAttribute('aria-checked');
      const patchPromise = waitForSettingsPatch(page);
      await toggle.click();
      await patchPromise;
      await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
    });
  });
});
