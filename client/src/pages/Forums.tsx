import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { useConversations } from '../contexts/ConversationsContext';
import {
  MessageSquare, ThumbsUp, Eye, Clock, TrendingUp, Search, Plus,
  Pin, Lock, Trash2, Users, Briefcase, Code, DollarSign, BookOpen,
  Target, UserPlus, UserCheck, UserSearch,
} from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  createForumThread, deleteForumThread, fetchForumCategories, fetchForumThreads,
  fetchUsers, toggleFollow, type UserSummary,
} from '../api/app';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ForumCategory {
  id: string; name: string; description: string;
  icon: React.ReactNode; topics: number; posts: number; color: string;
}

interface ForumThread {
  id: string; title: string;
  author: { id: number; name: string; avatar: string };
  category: string; content: string;
  replies: number; views: number; upvotes: number;
  isPinned?: boolean; isLocked?: boolean;
  createdAt: string; lastActivity: string; tags: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'bg-blue-500':   '#3b82f6', 'bg-purple-500': '#a855f7',
  'bg-green-500':  '#22c55e', 'bg-orange-500': '#f97316',
  'bg-indigo-500': '#6366f1', 'bg-pink-500':   '#ec4899',
  'bg-red-500':    '#ef4444', 'bg-yellow-500': '#eab308',
  'bg-teal-500':   '#14b8a6',
};

// ── Main page ─────────────────────────────────────────────────────────────────

export function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createConversation: createConv } = useConversations();

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'forums' | 'people'>('forums');

  // ── Forums state ──────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle]     = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads]         = useState<ForumThread[]>([]);
  const [forumsLoading, setForumsLoading] = useState(true);

  // ── People state ──────────────────────────────────────────────────────────
  const [users, setUsers]       = useState<UserSummary[]>([]);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [following, setFollowing]   = useState<Set<number>>(new Set());
  const [messaging, setMessaging]   = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Icon map ──────────────────────────────────────────────────────────────
  const iconMap = useMemo(() => ({
    Target:    <Target className="size-6" />,
    Users:     <Users className="size-6" />,
    DollarSign:<DollarSign className="size-6" />,
    Briefcase: <Briefcase className="size-6" />,
    Code:      <Code className="size-6" />,
    BookOpen:  <BookOpen className="size-6" />,
  }), []);

  // ── Load forums ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'forums') return;
    Promise.all([
      fetchForumCategories(),
      fetchForumThreads({ category: selectedCategory, query: searchQuery, sortBy }),
    ])
      .then(([cats, thrds]) => {
        setCategories(cats.map(c => ({
          id: c.slug, name: c.name, description: c.description,
          icon: iconMap[c.icon as keyof typeof iconMap] || <MessageSquare className="size-6" />,
          topics: c.topics, posts: c.posts, color: c.color,
        })));
        setThreads(thrds.map(t => ({
          id: String(t.id), title: t.title,
          author: { id: t.author.id, name: t.author.name, avatar: t.author.avatar },
          category: t.category, content: t.content,
          replies: t.replies, views: t.views, upvotes: t.upvotes,
          isPinned: t.pinned, isLocked: t.locked,
          createdAt: formatRelativeTime(t.createdAt),
          lastActivity: formatRelativeTime(t.lastActivity),
          tags: t.tags,
        })));
      })
      .catch(err => toast.error(getErrorMessage(err, 'Failed to load forum data')))
      .finally(() => setForumsLoading(false));
  }, [activeTab, selectedCategory, searchQuery, sortBy, iconMap]);

  // ── Load people ───────────────────────────────────────────────────────────
  const loadUsers = useCallback((q: string) => {
    setPeopleLoading(true);
    fetchUsers(q || undefined)
      .then(data => {
        setUsers(data);
        setFollowing(new Set(data.filter(u => u.following).map(u => u.id)));
      })
      .catch(err => toast.error(getErrorMessage(err, 'Failed to load users')))
      .finally(() => setPeopleLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'people') return;
    if (users.length === 0) loadUsers('');
  }, [activeTab, users.length, loadUsers]);

  const handlePeopleSearch = (value: string) => {
    setPeopleQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(value), 300);
  };

  // ── Follow / Message ──────────────────────────────────────────────────────
  const handleFollow = async (userId: number) => {
    try {
      const res = await toggleFollow(userId);
      setFollowing(prev => {
        const next = new Set(prev);
        res.following ? next.add(userId) : next.delete(userId);
        return next;
      });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, following: res.following, followersCount: res.followersCount } : u
      ));
      toast.success(res.following ? 'Following' : 'Unfollowed');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update follow'));
    }
  };

  const handleMessage = async (userId: number, name: string) => {
    setMessaging(userId);
    try {
      await createConv(userId, `Hi ${name}! 👋`);
      navigate('/messages');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start conversation'));
    } finally {
      setMessaging(null);
    }
  };

  // ── Thread actions ────────────────────────────────────────────────────────
  const handleDeleteThread = useCallback(async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this thread?')) return;
    try {
      await deleteForumThread(Number(threadId));
      setThreads(prev => prev.filter(t => t.id !== threadId));
      toast.success('Thread deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete thread'));
    }
  }, []);

  const handleCreateThread = async () => {
    if (!newThreadTitle || !newThreadContent || !newThreadCategory) return;
    try {
      const created = await createForumThread({
        title: newThreadTitle, content: newThreadContent,
        categorySlug: newThreadCategory,
        tags: newThreadTitle.toLowerCase().split(' ').slice(0, 3),
      });
      setThreads(prev => [{
        id: String(created.id), title: created.title,
        author: { id: created.author.id, name: created.author.name, avatar: created.author.avatar },
        category: created.category, content: created.content,
        replies: created.replies, views: created.views, upvotes: created.upvotes,
        isPinned: created.pinned, isLocked: created.locked,
        createdAt: formatRelativeTime(created.createdAt),
        lastActivity: formatRelativeTime(created.lastActivity),
        tags: created.tags,
      }, ...prev]);
      setShowNewThread(false);
      setNewThreadTitle(''); setNewThreadContent(''); setNewThreadCategory('');
      toast.success('Thread created');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create thread'));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community</h1>
            <p className="text-gray-500 mt-1">
              Connect, learn, and grow with fellow professionals
            </p>
          </div>
          {activeTab === 'forums' && (
            <button
              onClick={() => setShowNewThread(true)}
              className="flex items-center gap-2 bg-[#009999] hover:bg-[#007777] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="size-4" /> New Thread
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('forums')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'forums'
                ? 'bg-white text-[#009999] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="size-4" /> Forums
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'people'
                ? 'bg-white text-[#009999] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserSearch className="size-4" /> People
          </button>
        </div>

        {/* ── FORUMS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'forums' && (
          <>
            {/* New Thread Modal */}
            {showNewThread && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-5">Create New Thread</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newThreadCategory}
                        onChange={e => setNewThreadCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 text-sm outline-none focus:border-[#009999] focus:ring-2 focus:ring-[#009999]/20"
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="title">Thread Title</Label>
                      <input
                        id="title"
                        value={newThreadTitle}
                        onChange={e => setNewThreadTitle(e.target.value)}
                        placeholder="What's your question or topic?"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 text-sm outline-none focus:border-[#009999] focus:ring-2 focus:ring-[#009999]/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newThreadContent}
                        onChange={e => setNewThreadContent(e.target.value)}
                        placeholder="Provide details about your question or start the discussion..."
                        rows={5}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button onClick={() => setShowNewThread(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateThread}
                        disabled={!newThreadTitle || !newThreadContent || !newThreadCategory}
                        className="px-4 py-2 rounded-xl bg-[#009999] text-white text-sm font-semibold hover:bg-[#007777] transition disabled:opacity-50"
                      >
                        Create Thread
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {forumsLoading ? <LoadingState /> : (
              <>
                {/* ── Category home view ──────────────────────────────────── */}
                {!selectedCategory ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="bg-white rounded-2xl p-5 text-left border border-gray-200 transition hover:shadow-md hover:border-[#009999]/50 group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-white p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: CATEGORY_COLORS[category.color] ?? '#009999' }}>
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#009999] transition">{category.name}</h3>
                            <p className="text-sm text-gray-500 mb-3 leading-snug">{category.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{category.topics.toLocaleString()} topics</span>
                                <span>•</span>
                                <span>{category.posts.toLocaleString()} posts</span>
                              </div>
                              <span className="text-xs text-[#009999] font-semibold opacity-0 group-hover:opacity-100 transition">View →</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* ── Section drill-down view ─────────────────────────── */
                  (() => {
                    const activeCat = categories.find(c => c.id === selectedCategory);
                    return (
                      <>
                        {/* Section header */}
                        <div className="flex items-center gap-3 mb-6">
                          <button
                            onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#009999] transition font-medium"
                          >
                            ← All categories
                          </button>
                          {activeCat && (
                            <>
                              <span className="text-gray-300">/</span>
                              <div className="flex items-center gap-2">
                                <div className="text-white p-1.5 rounded-lg" style={{ backgroundColor: CATEGORY_COLORS[activeCat.color] ?? '#009999' }}>
                                  <span className="size-4 block [&>svg]:size-4">{activeCat.icon}</span>
                                </div>
                                <span className="font-bold text-gray-900">{activeCat.name}</span>
                                <span className="text-sm text-gray-400">— {activeCat.topics} topics · {activeCat.posts} posts</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Search + Sort bar */}
                        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 mb-6 flex flex-col sm:flex-row gap-3 items-center">
                          <div className="flex items-center gap-2 flex-1 w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-2 focus-within:border-[#009999] focus-within:ring-2 focus-within:ring-[#009999]/20 transition">
                            <Search className="size-4 text-gray-400 flex-shrink-0" />
                            <input
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Search threads, topics, or tags..."
                              className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder:text-gray-400 min-w-0"
                            />
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {([
                              { key: 'recent',   label: 'Recent',   icon: <Clock className="size-4" /> },
                              { key: 'popular',  label: 'Popular',  icon: <ThumbsUp className="size-4" /> },
                              { key: 'trending', label: 'Trending', icon: <TrendingUp className="size-4" /> },
                            ] as const).map(({ key, label, icon }) => (
                              <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                                  sortBy === key
                                    ? 'bg-[#009999] text-white'
                                    : 'border border-gray-200 text-gray-600 hover:border-[#009999] hover:text-[#009999]'
                                }`}
                              >
                                {icon}{label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Thread list */}
                        <div className="space-y-3">
                          {threads.map(thread => (
                            <Link
                              key={thread.id}
                              to={`/forums/threads/${thread.id}`}
                              className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-[#009999]/40 transition"
                            >
                              <div className="flex gap-4">
                                <div onClick={e => e.preventDefault()} className="flex-shrink-0">
                                  <Link to={`/profile/${thread.author.id}`}>
                                    <Avatar name={thread.author.name} size={48} className="hover:ring-2 hover:ring-[#009999] transition" />
                                  </Link>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    {thread.isPinned && <Pin className="size-4 text-[#009999] flex-shrink-0" />}
                                    {thread.isLocked && <Lock className="size-4 text-gray-400 flex-shrink-0" />}
                                    <h3 className="font-bold text-gray-900 text-lg leading-snug flex-1">{thread.title}</h3>
                                    {user && String(thread.author.id) === user.id && (
                                      <button
                                        onClick={e => { e.preventDefault(); handleDeleteThread(thread.id, e); }}
                                        className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{thread.content}</p>
                                  {thread.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {thread.tags.map(tag => (
                                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">#{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                                    <span className="font-semibold text-gray-700">{thread.author.name}</span>
                                    <span>•</span>
                                    <span>{thread.createdAt}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><MessageSquare className="size-3.5" />{thread.replies}</span>
                                    <span className="flex items-center gap-1"><Eye className="size-3.5" />{thread.views.toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" />{thread.upvotes}</span>
                                    <span className="ml-auto text-gray-400 text-xs">Last activity {thread.lastActivity}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {threads.length === 0 && (
                          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <MessageSquare className="size-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">No threads yet</h3>
                            <p className="text-sm text-gray-500 mb-5">Be the first to start a discussion in this category!</p>
                            <button onClick={() => setShowNewThread(true)} className="px-5 py-2.5 bg-[#009999] text-white rounded-xl font-semibold text-sm hover:bg-[#007777] transition">
                              Start a Thread
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </>
            )}
          </>
        )}

        {/* ── PEOPLE TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'people' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 pointer-events-none" />
              <input
                value={peopleQuery}
                onChange={e => handlePeopleSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-[#009999] focus:ring-2 focus:ring-[#009999]/20 placeholder:text-gray-400 transition"
              />
            </div>

            {peopleLoading ? (
              <LoadingState />
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <UserSearch className="size-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No users found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">{users.length}</span> professionals found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map(user => {
                    const isFollowing = following.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:border-[#009999]/40 transition"
                      >
                        {/* Avatar */}
                        <Link to={`/profile/${user.id}`} className="mb-3">
                          <Avatar name={user.displayName} size={80} className="hover:ring-2 hover:ring-[#009999] transition" />
                        </Link>

                        {/* Name & role */}
                        <Link to={`/profile/${user.id}`} className="font-bold text-gray-900 text-base leading-tight hover:text-[#009999] transition">
                          {user.displayName}
                        </Link>
                        <span className={`mt-1.5 text-xs font-semibold px-3 py-0.5 rounded-full ${
                          user.role === 'RECRUITER'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {user.role === 'RECRUITER' ? 'Recruiter' : 'Job Seeker'}
                        </span>

                        {/* Follower count */}
                        <p className="text-sm text-gray-400 mt-2">
                          {user.followersCount.toLocaleString()}{' '}
                          {user.followersCount === 1 ? 'follower' : 'followers'}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 w-full">
                          <button
                            onClick={() => handleFollow(user.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition ${
                              isFollowing
                                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                                : 'bg-[#009999] text-white hover:bg-[#007777]'
                            }`}
                          >
                            {isFollowing
                              ? <><UserCheck className="size-4" /> Following</>
                              : <><UserPlus className="size-4" /> Follow</>
                            }
                          </button>
                          <button
                            onClick={() => handleMessage(user.id, user.displayName)}
                            disabled={messaging === user.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-[#009999] hover:text-[#009999] transition disabled:opacity-50"
                          >
                            <MessageSquare className="size-4" />
                            {messaging === user.id ? 'Opening…' : 'Message'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
