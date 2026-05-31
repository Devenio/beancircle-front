'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatComposer } from '@/components/chat/composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageActionsSheet } from '@/components/chat/message-actions-sheet';
import { DateSeparator } from '@/components/chat/date-separator';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { useChatRoom } from '@/components/chat/hooks/use-chat-room';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, PendingMessage } from '@/components/chat/types';
import {
  groupMessagesByDate,
  isMineMessage,
  messagePreview,
} from '@/components/chat/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Conversation } from '@/components/chat/types';

type ChatRoomProps = {
  conversationId: string;
  locale: string;
};

export function ChatRoom({ conversationId, locale }: ChatRoomProps) {
  const t = useTranslations('messages');
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const reactionsByMessage = useChatStore((s) => s.reactionsByMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);

  const room = useChatRoom(conversationId, locale);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | PendingMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<string>('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () => api<Conversation[]>('/conversations', { locale }),
    enabled: forwardOpen,
  });

  const groupedMessages = useMemo(() => groupMessagesByDate(room.messages), [room.messages]);

  const peerOnline = room.peer?.id ? onlineUserIds.has(room.peer.id) : false;

  const copyMessage = (msg: ChatMessage | PendingMessage) => {
    const text =
      msg.body ||
      msg.sticker ||
      (msg.location ? `${msg.location.lat}, ${msg.location.lng}` : '') ||
      msg.attachment?.url ||
      '';
    if (text) void navigator.clipboard.writeText(text);
  };

  const handleForward = () => {
    if (!activeMessage || !forwardTarget) return;
    room.sendPayload({
      type: activeMessage.type,
      body: activeMessage.body ?? messagePreview(activeMessage),
      attachment: activeMessage.attachment,
      location: activeMessage.location,
      sticker: activeMessage.sticker,
      replyToSnippet: `Forwarded: ${messagePreview(activeMessage)}`,
    });
    setForwardOpen(false);
    setForwardTarget('');
    setActiveMessage(null);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader
        peer={room.peer}
        online={peerOnline}
        typingUsername={room.typingUsername}
        connectionState={room.connectionState}
        pinnedPreview={
          room.pinnedMessages.length
            ? messagePreview(room.pinnedMessages[room.pinnedMessages.length - 1])
            : undefined
        }
      />

      <div ref={room.listRef} className="flex-1 overflow-y-auto px-3 py-3">
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
          <div className="flex flex-col gap-1 pb-2">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <DateSeparator date={group.date} />
                {group.items.map((msg, index) => {
                  const prev = group.items[index - 1];
                  const isMine = isMineMessage(msg, room.currentUserId, room.currentUsername);
                  const sameSenderAsPrev =
                    prev &&
                    prev.sender.id === msg.sender.id &&
                    new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 120000;

                  return (
                    <MessageBubble
                      key={'clientId' in msg ? msg.clientId : msg.id}
                      message={msg}
                      currentUserId={room.currentUserId}
                      currentUsername={room.currentUsername}
                      peerId={room.peer?.id}
                      reactions={reactionsByMessage[msg.id] ?? []}
                      isGrouped={Boolean(sameSenderAsPrev)}
                      showAvatar={!isMine && !sameSenderAsPrev}
                      onReply={() => room.setReplyTo(msg)}
                      onOpenActions={() => setActiveMessage(msg)}
                    />
                  );
                })}
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
          showStickerPicker={room.showStickerPicker}
          onToggleStickerPicker={() => room.setShowStickerPicker((prev) => !prev)}
          stickers={room.stickers}
          onPickSticker={(sticker) => {
            room.sendPayload({
              type: 'sticker',
              sticker,
              body: `Sticker ${sticker}`,
              replyToId: room.replyTo?.id,
              replyToSnippet: room.replyTo ? messagePreview(room.replyTo) : undefined,
            });
            room.setShowStickerPicker(false);
          }}
          onPickImage={(files) => void room.handlePickFiles(files, 'image')}
          onPickFile={(files) => void room.handlePickFiles(files, 'file')}
          onPickVideo={(files) => void room.handlePickFiles(files, 'video')}
          onSendLocation={room.sendLocation}
          recordingMode={room.recordingMode}
          onStartRecording={room.startRecording}
          onStopRecording={room.stopRecording}
          composerError={room.composerError}
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
        onForward={() => setForwardOpen(true)}
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
          if (!activeMessage || !room.currentUserId) return;
          const existing = reactionsByMessage[activeMessage.id]?.find(
            (item) => item.userId === room.currentUserId,
          );
          if (existing?.emoji === emoji) {
            removeReaction(activeMessage.id, room.currentUserId);
          } else {
            addReaction(activeMessage.id, { emoji, userId: room.currentUserId });
          }
        }}
      />

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('forward')}</DialogTitle>
            <DialogDescription>{t('forwardDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {conversations
              ?.filter((item) => item.id !== conversationId)
              .map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${forwardTarget === conv.id ? 'bg-muted' : ''}`}
                  onClick={() => setForwardTarget(conv.id)}
                >
                  {conv.otherMember?.name ?? conv.otherMember?.username ?? 'Conversation'}
                </button>
              ))}
          </div>
          <Button onClick={handleForward} disabled={!forwardTarget}>
            {t('forward')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
