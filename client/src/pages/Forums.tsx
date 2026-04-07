import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Clock, 
  TrendingUp,
  Search,
  Plus,
  Pin,
  Lock,
  Users,
  Briefcase,
  Code,
  DollarSign,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { createForumThread, fetchForumCategories, fetchForumThreads } from '../api/app';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  topics: number;
  posts: number;
  color: string;
}

interface ForumThread {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  content: string;
  replies: number;
  views: number;
  upvotes: number;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
}

export function Forums() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const iconMap = useMemo(() => ({
    Target: <Target className="size-6" />,
    Users: <Users className="size-6" />,
    DollarSign: <DollarSign className="size-6" />,
    Briefcase: <Briefcase className="size-6" />,
    Code: <Code className="size-6" />,
    BookOpen: <BookOpen className="size-6" />,
  }), []);

  useEffect(() => {
    Promise.all([
      fetchForumCategories(),
      fetchForumThreads({ category: selectedCategory, query: searchQuery, sortBy }),
    ])
      .then(([categoryData, threadData]) => {
        setCategories(categoryData.map((category) => ({
          id: category.slug,
          name: category.name,
          description: category.description,
          icon: iconMap[category.icon as keyof typeof iconMap] || <MessageSquare className="size-6" />,
          topics: category.topics,
          posts: category.posts,
          color: category.color,
        })));
        setThreads(threadData.map((thread) => ({
          id: String(thread.id),
          title: thread.title,
          author: thread.author,
          category: thread.category,
          content: thread.content,
          replies: thread.replies,
          views: thread.views,
          upvotes: thread.upvotes,
          isPinned: thread.pinned,
          isLocked: thread.locked,
          createdAt: formatRelativeTime(thread.createdAt),
          lastActivity: formatRelativeTime(thread.lastActivity),
          tags: thread.tags,
        })));
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Failed to load forum data')))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery, sortBy, iconMap]);

  const filteredThreads = threads;

  const handleCreateThread = async () => {
    if (newThreadTitle && newThreadContent && newThreadCategory) {
      try {
        const created = await createForumThread({
          title: newThreadTitle,
          content: newThreadContent,
          categorySlug: newThreadCategory,
          tags: newThreadTitle.toLowerCase().split(' ').slice(0, 3),
        });
        setThreads((prev) => [{
          id: String(created.id),
          title: created.title,
          author: created.author,
          category: created.category,
          content: created.content,
          replies: created.replies,
          views: created.views,
          upvotes: created.upvotes,
          isPinned: created.pinned,
          isLocked: created.locked,
          createdAt: formatRelativeTime(created.createdAt),
          lastActivity: formatRelativeTime(created.lastActivity),
          tags: created.tags,
        }, ...prev]);
        setShowNewThread(false);
        setNewThreadTitle('');
        setNewThreadContent('');
        setNewThreadCategory('');
        toast.success('Thread created');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to create thread'));
      }
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Forums</h1>
            <p className="text-gray-600 mt-1">Connect, learn, and grow with fellow professionals</p>
          </div>
          <Button 
            onClick={() => setShowNewThread(true)}
            className="bg-[#009999] hover:bg-[#008080] flex items-center gap-2"
          >
            <Plus className="size-4" />
            New Thread
          </Button>
        </div>

        {/* New Thread Modal */}
        {showNewThread && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-md">
            <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Thread</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newThreadCategory}
                    onChange={(e) => setNewThreadCategory(e.target.value)}
                    className="glass-input soft-ring mt-1 w-full rounded-2xl px-3 py-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Thread Title</Label>
                  <Input
                    id="title"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="What's your question or topic?"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Provide details about your question or start the discussion..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    onClick={() => setShowNewThread(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateThread}
                    className="bg-[#009999] hover:bg-[#008080]"
                    disabled={!newThreadTitle || !newThreadContent || !newThreadCategory}
                  >
                    Create Thread
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className={`glass-panel rounded-[24px] p-6 transition text-left border ${
                selectedCategory === category.id ? 'border-[#009999]/45' : 'border-white/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`${category.color} text-white p-3 rounded-lg`}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{category.topics.toLocaleString()} topics</span>
                    <span>•</span>
                    <span>{category.posts.toLocaleString()} posts</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="glass-panel mb-6 rounded-[24px] p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads, topics, or tags..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSortBy('recent')}
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                className={sortBy === 'recent' ? 'bg-[#009999] hover:bg-[#008080]' : ''}
              >
                <Clock className="size-4 mr-2" />
                Recent
              </Button>
              <Button
                onClick={() => setSortBy('popular')}
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                className={sortBy === 'popular' ? 'bg-[#009999] hover:bg-[#008080]' : ''}
              >
                <ThumbsUp className="size-4 mr-2" />
                Popular
              </Button>
              <Button
                onClick={() => setSortBy('trending')}
                variant={sortBy === 'trending' ? 'default' : 'outline'}
                className={sortBy === 'trending' ? 'bg-[#009999] hover:bg-[#008080]' : ''}
              >
                <TrendingUp className="size-4 mr-2" />
                Trending
              </Button>
            </div>
          </div>

          {selectedCategory && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtered by:</span>
              <span className="flex items-center gap-2 rounded-full bg-[#009999] px-3 py-1 text-sm text-white shadow-[0_12px_30px_rgba(0,153,153,0.18)]">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="hover:bg-[#008080] rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {filteredThreads.map(thread => (
            <div
              key={thread.id}
              className="glass-panel rounded-[24px] p-6 transition hover:bg-white/78"
            >
              <div className="flex gap-4">
                {/* Author Avatar */}
                <img
                  src={thread.author.avatar}
                  alt={thread.author.name}
                  className="size-12 rounded-full object-cover flex-shrink-0"
                />

                {/* Thread Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {thread.isPinned && (
                      <Pin className="size-4 text-[#009999] flex-shrink-0 mt-1" />
                    )}
                    {thread.isLocked && (
                      <Lock className="size-4 text-gray-400 flex-shrink-0 mt-1" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-[#009999] cursor-pointer">
                      {thread.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">{thread.content}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {thread.tags.map(tag => (
                      <span
                        key={tag}
                        className="cursor-pointer rounded-full bg-white/65 px-2 py-1 text-xs text-gray-700 hover:bg-white/85"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{thread.author.name}</span>
                    <span>•</span>
                    <span>{thread.createdAt}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-4" />
                      {thread.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-4" />
                      {thread.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-4" />
                      {thread.upvotes}
                    </span>
                    <span className="ml-auto text-gray-600">
                      Last activity {thread.lastActivity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredThreads.length === 0 && (
          <div className="glass-panel rounded-[28px] p-12 text-center">
            <MessageSquare className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No threads found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Be the first to start a discussion in this category!'}
            </p>
            <Button
              onClick={() => setShowNewThread(true)}
              className="bg-[#009999] hover:bg-[#008080]"
            >
              Create First Thread
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
