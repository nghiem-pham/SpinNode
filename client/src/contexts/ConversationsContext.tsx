import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  fetchConversations,
  fetchConversationMessages,
  markConversationRead,
  sendConversationMessage,
  createConversation as createConversationApi,
} from '../api/app';
import { getStoredToken } from '../api/auth';
import { buildWebSocketUrl } from '../config';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

interface ConversationsContextType {
  conversations: Conversation[];
  markAsRead: (conversationId: string) => Promise<void>;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  createConversation: (participantUserId: number, message: string) => Promise<Conversation>;
  refreshConversations: () => Promise<void>;
  totalUnread: number;
  loading: boolean;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const mapConversation = useCallback((conversation: any): Conversation => ({
    id: String(conversation.id),
    participantId: String(conversation.participantId),
    name: conversation.name,
    avatar: conversation.avatar,
    lastMessage: conversation.lastMessage,
    timestamp: conversation.timestamp,
    unread: Number(conversation.unread),
    online: conversation.online,
    messages: (conversation.messages || []).map((message: any) => ({
      id: String(message.id),
      senderId: String(message.senderId),
      text: message.text,
      timestamp: message.timestamp,
      })),
  }), []);

  const replaceConversation = useCallback((conversation: any) => {
    const mapped = mapConversation(conversation);

    setConversations(prev => {
      const remaining = prev.filter(item => item.id !== mapped.id);
      return [mapped, ...remaining].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );
    });
  }, [mapConversation]);

  const refreshConversations = useCallback(async () => {
    const data = await fetchConversations();
    setConversations(data.map(mapConversation));
  }, [mapConversation]);

  useEffect(() => {
    refreshConversations()
      .catch(() => { /* backend offline — stay on empty conversations */ })
      .finally(() => setLoading(false));
  }, [refreshConversations]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let socket: WebSocket | null = null;
    let retryTimer: number | null = null;
    let cancelled = false;
    let retryDelay = 2000;
    const MAX_DELAY = 30_000;

    const connect = () => {
      socket = new WebSocket(
        `${buildWebSocketUrl('/ws/messages')}?token=${encodeURIComponent(token)}`
      );

      socket.onopen = () => {
        retryDelay = 2000; // reset backoff on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.conversation) replaceConversation(payload.conversation);
        } catch { /* malformed message — ignore */ }
      };

      socket.onclose = () => {
        if (!cancelled) {
          retryTimer = window.setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
            connect();
          }, retryDelay);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [replaceConversation]);

  const markAsRead = useCallback(async (conversationId: string) => {
    await markConversationRead(Number(conversationId));
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, unread: 0 } : conv
      )
    );
  }, []);

  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
    );
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const messages = await fetchConversationMessages(Number(conversationId));
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              unread: 0,
              messages: messages.map(message => ({
                id: String(message.id),
                senderId: String(message.senderId),
                text: message.text,
                timestamp: message.timestamp,
              })),
            }
          : conv
      )
    );
  }, []);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    const message = await sendConversationMessage(Number(conversationId), text);
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: message.text,
              timestamp: message.timestamp,
              messages: [
                ...conv.messages.filter(item => item.id !== String(message.id)),
                {
                  id: String(message.id),
                  senderId: String(message.senderId),
                  text: message.text,
                  timestamp: message.timestamp,
                },
              ],
            }
          : conv
      )
    );
  }, []);

  const createConversation = useCallback(async (participantUserId: number, message: string): Promise<Conversation> => {
    const conversation = await createConversationApi(participantUserId, message);
    const mapped = mapConversation(conversation);
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== mapped.id);
      return [mapped, ...remaining];
    });
    return mapped;
  }, [mapConversation]);

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  return (
    <ConversationsContext.Provider value={{ conversations, markAsRead, updateConversation, loadMessages, sendMessage, createConversation, refreshConversations, totalUnread, loading }}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within ConversationsProvider');
  }
  return context;
}
