'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowDown, Check, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatComposer } from '@/components/chat/composer';
import { MessageGroup } from '@/components/chat/message-group';
import { PinnedMessageBanner } from '@/components/chat/pinned-message-banner';
import { MessageActionsSheet } from '@/components/chat/message-actions-sheet';
import { DateSeparator } from '@/components/chat/date-separator';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { useChatRoom } from '@/components/chat/hooks/use-chat-room';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, Conversation, PendingMessage } from '@/components/chat/types';
import { groupMessagesBySenderAndDate, isMineMessage, messagePreview } from '@/components/chat/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/chat/user-avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

type ChatRoomProps = {
  conversationId: string;
  locale: string;
};

type ForwardState = Record<string, 'idle' | 'sending' | 'ok' | 'failed'>;

export function ChatRoom({ conversationId, locale }: ChatRoomProps) {
  const t = useTranslations('messages');
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const room = useChatRoom(conversationId, locale);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | PendingMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardSource, setForwardSource] = useState<ChatMessage | PendingMessage | null>(null);
  const [forwardTargets, setForwardTargets] = useState<Set<string>>(new Set());
  const [forwardState, setForwardState] = useState<ForwardState>({});
  const [showJumpToUnread, setShowJumpToUnread] = useState(true);

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    enabled: forwardOpen,
  });

  const groupedMessages = useMemo(
    () => groupMessagesBySenderAndDate(room.messages, room.currentUserId, room.currentUsername),
    [room.messages, room.currentUserId, room.currentUsername],
  );

  const peerOnline = room.peer?.id ? onlineUserIds.has(room.peer.id) : false;

  const pinnedPreview =
    room.pinnedMessages.length > 0
      ? messagePreview(room.pinnedMessages[room.pinnedMessages.length - 1])
      : undefined;

  const copyMessage = (msg: ChatMessage | PendingMessage) => {
    const text =
      msg.body ||
      msg.sticker ||
      (msg.location ? `${msg.location.lat}, ${msg.location.lng}` : '') ||
      msg.attachment?.url ||
      '';
    if (text) void navigator.clipboard.writeText(text);
  };

  const openForward = (msg: ChatMessage | PendingMessage) => {
    if ('clientId' in msg) return; // can't forward a not-yet-sent message
    setForwardSource(msg);
    setForwardTargets(new Set());
    setForwardState({});
    setForwardOpen(true);
  };

  const toggleForwardTarget = (id: string) => {
    setForwardTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runForward = async () => {
    if (!forwardSource || forwardTargets.size === 0) return;
    const targets = [...forwardTargets];
    setForwardState(Object.fromEntries(targets.map((id) => [id, 'sending'])));
    try {
      const res = await room.forwardMessage(forwardSource.id, targets);
      // The API returns per-target results; map them back for UI feedback.
      const results = (res?.results ?? []) as {
        conversationId: string;
        ok: boolean;
      }[];
      const next: ForwardState = {};
      for (const id of targets) {
        const match = results.find((r) => r.conversationId === id);
        next[id] = match?.ok ? 'ok' : 'failed';
      }
      setForwardState(next);
      // Close shortly after success so the user sees the checkmarks.
      setTimeout(() => {
        setForwardOpen(false);
        setActiveMessage(null);
      }, 700);
    } catch {
      setForwardState(Object.fromEntries(targets.map((id) => [id, 'failed'])));
    }
  };

  const jumpToUnread = () => {
    const node = room.listRef.current;
    if (!node || !room.firstUnreadId) return;
    const el = node.querySelector(`[data-message-id="${room.firstUnreadId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowJumpToUnread(false);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader peer={room.peer} online={peerOnline} typingUsername={room.typingUsername} />

      {pinnedPreview ? (
        <PinnedMessageBanner preview={pinnedPreview} scrollContainerRef={room.listRef} />
      ) : null}

      <div ref={room.listRef} className="relative flex-1 overflow-y-auto px-3 py-3">
        {/* Self-contained wallpaper (never 404s): layered gradients + dot grid. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            color: 'var(--muted-foreground)',
          }}
        />
        <div className="relative z-10">
          {room.isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={i % 2 ? 'ml-auto h-14 w-[70%] rounded-2xl' : 'h-14 w-[70%] rounded-2xl'} />
              ))}
            </div>
          ) : room.messages.length === 0 ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
              <p className="text-lg font-medium">{t('emptyChatTitle')}</p>
              <p className="max-w-xs text-sm text-muted-foreground">{t('emptyChatBody')}</p>
            </div>
          ) : (
            <div className="flex flex-col pb-2">
              {groupedMessages.map((dateGroup) => (
                <div key={dateGroup.date}>
                  <DateSeparator date={dateGroup.date} />
                  {dateGroup.senderGroups.map((senderGroup) => (
                    <MessageGroup
                      key={`${dateGroup.date}-${senderGroup.senderId}-${senderGroup.messages[0]?.id}`}
                      group={senderGroup}
                      currentUserId={room.currentUserId}
                      currentUsername={room.currentUsername}
                      peerId={room.peer?.id}
                      peerAvatar={room.peer?.avatarUrl}
                      peerName={room.peer?.name ?? room.peer?.username}
                      peerOnline={peerOnline}
                      onReply={room.setReplyTo}
                      onOpenActions={setActiveMessage}
                      onCopy={copyMessage}
                      onForward={openForward}
                      onEdit={(msg) => {
                        setEditingMessageId(msg.id);
                        setEditingDraft(msg.body ?? '');
                      }}
                      onDelete={(msg) => room.deleteMutation.mutate(msg.id)}
                      onPin={(msg) =>
                        room.pinMutation.mutate({ messageId: msg.id, pinned: !msg.pinned })
                      }
                      onReact={(msg, emoji) => {
                        if ('clientId' in msg) return;
                        room.toggleReaction(msg.id, emoji);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {room.typingUsername ? (
              <TypingIndicator label={t('typing', { name: room.typingUsername })} />
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {room.firstUnreadId && showJumpToUnread ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={jumpToUnread}
              className="sticky bottom-3 z-20 mx-auto flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg"
            >
              <ArrowDown className="size-3.5" />
              {t('jumpToUnread')}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {editingMessageId ? (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <div className="flex gap-2">
            <Input
              value={editingDraft}
              onChange={(event) => setEditingDraft(event.target.value)}
              aria-label="Edit message"
            />
            <Button
              onClick={() => {
                room.editMutation.mutate({ messageId: editingMessageId, body: editingDraft.trim() });
                setEditingMessageId(null);
                setEditingDraft('');
              }}
            >
              {t('save')}
            </Button>
            <Button variant="outline" onClick={() => setEditingMessageId(null)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <ChatComposer
          draft={room.draft}
          onDraftChange={room.setDraft}
          onSend={room.sendText}
          onTyping={room.emitTyping}
          replyTo={room.replyTo}
          onCancelReply={() => room.setReplyTo(null)}
          onPickImage={(files) => void room.handlePickFiles(files, 'image')}
          onPickFile={(files) => void room.handlePickFiles(files, 'file')}
          onPickVideo={(files) => void room.handlePickFiles(files, 'video')}
          onSendLocation={room.sendLocation}
          recordingMode={room.recordingMode}
          recordingElapsedSec={room.recordingElapsedSec}
          onStartRecording={room.startRecording}
          onStopRecording={room.stopRecording}
          composerError={room.composerError}
          uploading={room.uploadingCount > 0}
          validationHint={t('invalidMessage')}
          placeholder={t('typeMessage')}
          disabled={room.isSending}
        />
      )}

      <MessageActionsSheet
        open={Boolean(activeMessage)}
        onOpenChange={(open) => !open && setActiveMessage(null)}
        message={activeMessage}
        isMine={activeMessage ? isMineMessage(activeMessage, room.currentUserId, room.currentUsername) : false}
        onReply={() => activeMessage && room.setReplyTo(activeMessage)}
        onCopy={() => activeMessage && copyMessage(activeMessage)}
        onForward={() => activeMessage && openForward(activeMessage)}
        onEdit={() => {
          if (!activeMessage) return;
          setEditingMessageId(activeMessage.id);
          setEditingDraft(activeMessage.body ?? '');
        }}
        onDelete={() => activeMessage && room.deleteMutation.mutate(activeMessage.id)}
        onPin={() =>
          activeMessage &&
          room.pinMutation.mutate({ messageId: activeMessage.id, pinned: !activeMessage.pinned })
        }
        onReact={(emoji) => {
          if (!activeMessage || 'clientId' in activeMessage) return;
          room.toggleReaction(activeMessage.id, emoji);
        }}
      />

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forward')}</DialogTitle>
            <DialogDescription>{t('forwardDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {conversations
              ?.filter((item) => item.id !== conversationId)
              .map((conv) => {
                const selected = forwardTargets.has(conv.id);
                const status = forwardState[conv.id];
                const name =
                  conv.otherMember?.name ?? conv.otherMember?.username ?? 'Conversation';
                return (
                  <button
                    key={conv.id}
                    type="button"
                    disabled={status === 'sending'}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      selected ? 'bg-primary/10' : 'hover:bg-muted',
                    )}
                    onClick={() => toggleForwardTarget(conv.id)}
                  >
                    <UserAvatar src={conv.otherMember?.avatarUrl} name={name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    {status === 'sending' ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : status === 'ok' ? (
                      <Check className="size-4 text-primary" />
                    ) : status === 'failed' ? (
                      <span className="text-xs text-destructive">{t('failed')}</span>
                    ) : (
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          <DialogFooter>
            <Button
              onClick={runForward}
              disabled={forwardTargets.size === 0 || room.isForwarding}
            >
              {room.isForwarding
                ? t('sending')
                : t('forwardToCount', { count: forwardTargets.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
