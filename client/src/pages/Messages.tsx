import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../contexts/ConversationsContext';
import { Send, Search, MoreVertical, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';

export function Messages() {
  const { user } = useAuth();
  const { conversations, markAsRead, loadMessages, sendMessage, loading } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const messages = selectedConversation?.messages || [];

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId).catch((error) => {
      toast.error(getErrorMessage(error, 'Failed to load messages'));
    });
  }, [selectedConversationId, loadMessages]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    await markAsRead(id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;
    try {
      await sendMessage(selectedConversationId, newMessage);
      setNewMessage('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send message'));
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <div className="h-[calc(100vh-64px)]">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="glass-panel flex h-[calc(100vh-140px)] overflow-hidden rounded-[30px]">
          {/* Conversations List */}
          <div className="flex w-full flex-col border-r border-white/50 md:w-80">
            <div className="border-b border-white/50 p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input soft-ring w-full rounded-2xl py-2 pl-10 pr-4 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                    selectedConversationId === conversation.id ? 'bg-white/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={conversation.avatar}
                        alt={conversation.name}
                        className="size-12 rounded-full flex-shrink-0 object-cover"
                      />
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <span className="ml-2 bg-[#009999] text-white text-xs font-semibold rounded-full size-5 flex items-center justify-center flex-shrink-0">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedConversation.avatar}
                      alt={selectedConversation.name}
                      className="size-10 rounded-full object-cover"
                    />
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.online ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button className="glass-input rounded-xl p-2 hover:bg-white/75 transition">
                  <MoreVertical className="size-5 text-gray-600" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isMe = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={
                            isMe
                              ? user?.avatar
                              : selectedConversation.avatar
                          }
                          alt="Avatar"
                          className="size-8 rounded-full flex-shrink-0 object-cover"
                        />
                        <div>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isMe
                                ? 'bg-[#009999] text-white rounded-tr-sm shadow-[0_12px_30px_rgba(0,153,153,0.18)]'
                                : 'glass-input text-gray-900 rounded-tl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="border-t border-white/50 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="glass-input soft-ring flex-1 rounded-full px-4 py-2 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[#009999] text-white p-3 rounded-full hover:bg-[#007777] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="size-5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
