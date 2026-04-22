import { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { useConversations } from '../contexts/ConversationsContext';
import { Send, Search, MoreVertical, MessageSquare, Pencil, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';
import { formatRelativeTime } from '../utils/format';
import { searchApi } from '../api/app';
import type { SearchResultResponse } from '../api/app';

export function Messages() {
  const { user } = useAuth();
  const { conversations, markAsRead, loadMessages, sendMessage, createConversation, loading } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Compose new conversation
  const [showCompose, setShowCompose] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<SearchResultResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResultResponse | null>(null);
  const [composeMessage, setComposeMessage] = useState('');
  const [composing, setComposing] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  const [mobilePanelView, setMobilePanelView] = useState<'list' | 'chat'>('list');

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
    setMobilePanelView('chat');
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

  const handleUserSearch = (q: string) => {
    setUserSearch(q);
    setSelectedUser(null);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setUserResults([]); return; }
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await searchApi(q);
        setUserResults(results.filter(r => r.type === 'user'));
      } catch { /* ignore */ }
    }, 300);
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !composeMessage.trim()) return;
    setComposing(true);
    try {
      const conv = await createConversation(Number(selectedUser.id), composeMessage.trim());
      setShowCompose(false);
      setUserSearch('');
      setUserResults([]);
      setSelectedUser(null);
      setComposeMessage('');
      setSelectedConversationId(conv.id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to start conversation'));
    } finally {
      setComposing(false);
    }
  };

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
        <div className="glass-panel flex h-[calc(100vh-204px)] md:h-[calc(100vh-140px)] overflow-hidden rounded-[30px]">
          {/* Conversations List — hidden on mobile when viewing a chat */}
          <div className={`flex-col border-r border-white/50 w-full md:w-80 md:flex ${mobilePanelView === 'list' ? 'flex' : 'hidden'}`}>
            <div className="border-b border-white/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                <button
                  onClick={() => setShowCompose(true)}
                  className="glass-input rounded-xl p-2 hover:bg-white/75 transition"
                  title="New message"
                >
                  <Pencil className="size-4 text-gray-600" />
                </button>
              </div>
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
                      <Avatar name={conversation.name} src={conversation.avatar} size={48} />
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
                          {formatRelativeTime(conversation.timestamp)}
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

          {/* Chat Area — hidden on mobile when viewing conversation list */}
          {selectedConversation ? (
            <div className={`flex-col flex-1 md:flex ${mobilePanelView === 'chat' ? 'flex' : 'hidden'}`}>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/50 p-4">
                <div className="flex items-center gap-3">
                  {/* Back button — mobile only */}
                  <button
                    onClick={() => setMobilePanelView('list')}
                    className="md:hidden glass-input rounded-xl p-2 hover:bg-white/75 transition mr-1"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="size-4 text-gray-600" />
                  </button>
                  <div className="relative">
                    <Avatar name={selectedConversation.name} src={selectedConversation.avatar} size={40} />
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
                        <Avatar
                          name={isMe ? (user?.name ?? '') : selectedConversation.name}
                          src={isMe ? user?.avatar : selectedConversation.avatar}
                          size={32}
                          className="flex-shrink-0"
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
                            {formatRelativeTime(message.timestamp)}
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
            <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Message</h3>
              <button onClick={() => setShowCompose(false)} className="glass-input rounded-xl p-2 hover:bg-white/75 transition">
                <X className="size-4 text-gray-600" />
              </button>
            </div>

            {/* User search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search people..."
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="glass-input soft-ring w-full rounded-2xl py-2 pl-10 pr-4 outline-none"
                />
              </div>

              {userResults.length > 0 && !selectedUser && (
                <div className="mt-2 glass-panel rounded-2xl overflow-hidden">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserSearch(u.title); setUserResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/50 transition text-left border-b border-white/30 last:border-0"
                    >
                      <div className="size-9 rounded-full bg-[#009999]/20 flex items-center justify-center text-[#009999] font-semibold text-sm flex-shrink-0">
                        {u.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.title}</p>
                        <p className="text-xs text-gray-500">{u.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message input — only shown after selecting a user */}
            {selectedUser && (
              <form onSubmit={handleStartConversation}>
                <div className="mb-2 flex items-center gap-2 px-3 py-2 glass-input rounded-2xl">
                  <div className="size-7 rounded-full bg-[#009999]/20 flex items-center justify-center text-[#009999] font-semibold text-xs flex-shrink-0">
                    {selectedUser.title.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{selectedUser.title}</span>
                </div>
                <textarea
                  autoFocus
                  placeholder="Write a message..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  rows={3}
                  className="glass-input soft-ring w-full rounded-2xl px-4 py-3 outline-none resize-none mt-3 mb-4"
                />
                <button
                  type="submit"
                  disabled={!composeMessage.trim() || composing}
                  className="w-full bg-[#009999] hover:bg-[#008080] text-white font-medium py-2.5 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {composing ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
