import { createContext, useContext, useState, ReactNode } from 'react';

interface MessageWidgetContextType {
  isOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
}

const MessageWidgetContext = createContext<MessageWidgetContextType | undefined>(undefined);

export function MessageWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWidget = () => setIsOpen(true);
  const closeWidget = () => setIsOpen(false);
  const toggleWidget = () => setIsOpen(prev => !prev);

  return (
    <MessageWidgetContext.Provider value={{ isOpen, openWidget, closeWidget, toggleWidget }}>
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
