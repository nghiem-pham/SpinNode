import { createContext, useContext, useState, ReactNode } from 'react';

interface MessageWidgetContextType {
  isOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  openWithConversation: (conversationId: string) => void;
  pendingConversationId: string | null;
  clearPendingConversation: () => void;
}

const MessageWidgetContext = createContext<MessageWidgetContextType | undefined>(undefined);

export function MessageWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  const openWidget = () => setIsOpen(true);
  const closeWidget = () => setIsOpen(false);
  const toggleWidget = () => setIsOpen(prev => !prev);
  const openWithConversation = (conversationId: string) => {
    setPendingConversationId(conversationId);
    setIsOpen(true);
  };
  const clearPendingConversation = () => setPendingConversationId(null);

  return (
    <MessageWidgetContext.Provider value={{ isOpen, openWidget, closeWidget, toggleWidget, openWithConversation, pendingConversationId, clearPendingConversation }}>
      {children}
    </MessageWidgetContext.Provider>
  );
}

export function useMessageWidget() {
  const context = useContext(MessageWidgetContext);
  if (!context) {
    throw new Error('useMessageWidget must be used within MessageWidgetProvider');
  }
  return context;
}
