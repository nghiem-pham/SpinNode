import { useState } from 'react';
import { Send, X, Search } from 'lucide-react';
import { Link } from 'react-router';
import { Input } from './ui/input';
import { Avatar } from './Avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useMessageWidget } from '../contexts/MessageWidgetContext';
import { useConversations } from '../contexts/ConversationsContext';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/error';
import { formatRelativeTime } from '../utils/format';

export function MessageWidget() {
  const { isOpen, openWidget, closeWidget } = useMessageWidget();
  const { conversations, markAsRead, totalUnread, loadMessages, sendMessage } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedChat = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = async (conversationId: string) => {
    await markAsRead(conversationId);
    await loadMessages(conversationId);
    setSelectedConversation(conversationId);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;
    try {
      await sendMessage(selectedConversation, message);
      setMessage('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send message'));
    }
  };

  const handleClose = () => {
    closeWidget();
    setSelectedConversation(null);
  };

  return (
    <>
      {/* Floating Message Button */}
      {!isOpen && conversations.length > 0 && (
        <button
          onClick={openWidget}
          className="glass-panel-strong fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full px-6 py-4 text-white transition-all hover:scale-105"
        >
          <Send className="size-5" />
          <span className="font-medium">Messages</span>
          
          {/* User Avatars Preview */}
          <div className="flex -space-x-2">
            {conversations.slice(0, 3).map((conv) => (
              <div key={conv.id} className="relative">
                <Avatar name={conv.name} size={32} className="border-2 border-[#0f6d6d]" />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#0f6d6d] bg-green-500" />
                )}
              </div>
            ))}
          </div>

          {/* Unread Badge */}
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#009999] text-white text-xs font-bold rounded-full size-6 flex items-center justify-center">
              {totalUnread}
            </div>
          )}
        </button>
      )}

      {/* Expanded Message Panel */}
      {isOpen && (
        <div className="glass-panel fixed bottom-6 right-6 z-50 flex h-[600px] w-96 flex-col rounded-[28px]">
          {/* Header */}
          <div className="glass-panel-strong flex items-center justify-between rounded-t-[28px] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Send className="size-5" />
              <h3 className="font-semibold">Messages</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/messages"
                className="p-1 hover:bg-gray-700 rounded transition"
                title="Open full messages"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-700 rounded transition"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!selectedConversation ? (
            <>
              {/* Search Bar */}
              <div className="border-b border-white/50 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="flex w-full items-start gap-3 border-b border-white/40 p-4 transition hover:bg-white/45"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar name={conv.name} size={48} />
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{conv.name}</h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">{formatRelativeTime(conv.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="flex-shrink-0 bg-[#009999] text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                        {conv.unread}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-white/50 p-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="glass-input rounded-lg p-1 transition hover:bg-white/75"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative flex-shrink-0">
                  {selectedChat && <Avatar name={selectedChat.name} size={40} />}
                  {selectedChat?.online && (
                    <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{selectedChat?.name}</h4>
                  <p className="text-xs text-gray-500">
                    {selectedChat?.online ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-white/18 p-4">
                {selectedChat?.messages.map((entry) => {
                  const isOwn = entry.senderId !== selectedChat.participantId;
                  return (
                    <div key={entry.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${isOwn ? 'bg-[#009999] text-white rounded-tr-sm shadow-[0_12px_30px_rgba(0,153,153,0.18)]' : 'glass-input text-gray-900 rounded-tl-sm'} max-w-[75%] rounded-2xl px-4 py-2 shadow-sm`}>
                        <p className="text-sm">{entry.text}</p>
                        <span className={`text-xs mt-1 block ${isOwn ? 'opacity-75' : 'text-gray-500'}`}>{formatRelativeTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="rounded-b-[28px] border-t border-white/50 bg-white/18 p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    className="resize-none flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-[#009999] hover:bg-[#008080] flex-shrink-0"
                    size="sm"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
