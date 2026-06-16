'use client';

import { createContext, useContext } from 'react';

/**
 * Chat rendering preferences derived from the user's settings, provided once by
 * the chat room so deep message components can read them without prop drilling
 * or each subscribing to the settings query.
 */
export type ChatPrefs = {
  linkPreviews: boolean;
};

const DEFAULT_PREFS: ChatPrefs = {
  linkPreviews: true,
};

const ChatPrefsContext = createContext<ChatPrefs>(DEFAULT_PREFS);

export const ChatPrefsProvider = ChatPrefsContext.Provider;

export function useChatPrefs(): ChatPrefs {
  return useContext(ChatPrefsContext);
}
