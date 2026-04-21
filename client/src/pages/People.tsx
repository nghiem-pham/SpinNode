import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Search, UserPlus, UserCheck, MessageSquare, Users } from 'lucide-react';
import { fetchUsers, toggleFollow, UserSummary } from '../api/app';
import { useConversations } from '../contexts/ConversationsContext';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/error';
import { LoadingState } from '../components/ui/loading-state';

export function People() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [messaging, setMessaging] = useState<number | null>(null);
  const [following, setFollowing] = useState<Set<number>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { createConversation: createConv } = useConversations();

  const loadUsers = useCallback((q: string) => {
    fetchUsers(q || undefined)
      .then((data) => {
        setUsers(data);
        setFollowing(new Set(data.filter((u) => u.following).map((u) => u.id)));
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load users')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers('');
  }, [loadUsers]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(value), 300);
  };

  const handleFollow = async (userId: number) => {
    try {
      const res = await toggleFollow(userId);
      setFollowing((prev) => {
        const next = new Set(prev);
        res.following ? next.add(userId) : next.delete(userId);
        return next;
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, following: res.following, followersCount: res.followersCount }
            : u
        )
      );
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

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="text-gray-500 mt-1">
            Discover professionals, follow them and start conversations
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-[#009999] focus:ring-2 focus:ring-[#009999]/20 placeholder:text-gray-400 transition"
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const isFollowing = following.has(user.id);
              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md transition"
                >
                  {/* Avatar */}
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="size-20 rounded-full object-cover mb-3"
                  />

                  {/* Name & role */}
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {user.displayName}
                  </h3>
                  <span
                    className={`mt-1 text-xs font-semibold px-3 py-0.5 rounded-full ${
                      user.role === 'RECRUITER'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}
                  >
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
                      {isFollowing ? (
                        <>
                          <UserCheck className="size-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          Follow
                        </>
                      )}
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
        )}
      </main>
    </div>
  );
}
