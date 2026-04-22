import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import {
  MapPin, Calendar, Briefcase, Code2, Award,
  MessageSquare, UserPlus, UserMinus, ThumbsUp, Eye, Clock,
} from 'lucide-react';
import {
  fetchPublicProfile, toggleFollow,
  fetchThreadsByUser, fetchRepliesByUser, fetchLikedThreadsByUser,
  type ForumThreadResponse, type ForumReplyResponse,
} from '../api/app';
import { formatLongDate, formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../contexts/ConversationsContext';
import { useMessageWidget } from '../contexts/MessageWidgetContext';

interface Experience { id: number; title: string; company: string; duration: string; description: string; }
interface Project { id: number; name: string; description: string; technologies: string[]; link?: string; }
interface Skill { id: number; name: string; level: string; }

const SKILL_BADGE: Record<string, string> = {
  Expert:       'bg-[#009999] text-white',
  Advanced:     'border border-[#009999] text-[#009999]',
  Intermediate: 'border border-blue-400 text-blue-600',
  Beginner:     'text-gray-500',
};

type ActivityTab = 'posts' | 'comments' | 'liked';

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { conversations, createConversation } = useConversations();
  const { openWithConversation } = useMessageWidget();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [following, setFollowing] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const [activeTab, setActiveTab] = useState<ActivityTab>('posts');
  const [threads, setThreads] = useState<ForumThreadResponse[]>([]);
  const [replies, setReplies] = useState<ForumReplyResponse[]>([]);
  const [liked, setLiked] = useState<ForumThreadResponse[]>([]);


  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const uid = Number(userId);
    Promise.all([
      fetchPublicProfile(uid),
      fetchThreadsByUser(uid),
      fetchRepliesByUser(uid),
      fetchLikedThreadsByUser(uid),
    ])
      .then(([data, t, r, l]) => {
        setName(data.name);
        setBio(data.bio);
        setLocation(data.location);
        setAvatarUrl(data.avatarUrl || '');
        setCoverUrl(data.coverUrl || '');
        setJoinedAt(data.createdAt ? formatLongDate(data.createdAt) : '');
        setExperiences(data.experiences);
        setProjects(data.projects);
        setSkills(data.skills);
        setThreads(t);
        setReplies(r);
        setLiked(l);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load profile')))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      const res = await toggleFollow(Number(userId));
      setFollowing(res.following);
      toast.success(res.following ? `Following ${name}` : `Unfollowed ${name}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update follow status'));
    }
  };

  const handleMessage = async () => {
    if (!userId) return;
    setMessaging(true);
    try {
      const existing = conversations.find(c => c.participantId === userId);
      const conv = existing ?? await createConversation(Number(userId), `Hi ${name}!`);
      openWithConversation(conv.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start conversation'));
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8"><LoadingState /></main>
      </div>
    );
  }

  const tabs: { key: ActivityTab; label: string; count: number }[] = [
    { key: 'posts',    label: 'Posts',    count: threads.length },
    { key: 'comments', label: 'Comments', count: replies.length },
    { key: 'liked',    label: 'Liked',    count: liked.length   },
  ];

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Cover + Avatar */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div
            className="h-40 bg-gradient-to-r from-[#009999] to-[#00cccc]"
            style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-end gap-4 -mt-12 mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="size-24 rounded-full border-4 border-white object-cover bg-white flex-shrink-0"
                />
              ) : (
                <div className="border-4 border-white rounded-full flex-shrink-0 bg-white">
                  <Avatar name={name} size={96} />
                </div>
              )}
              <div className="flex-1 min-w-0 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-4" />{location}
                    </span>
                  )}
                  {joinedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-4" />Joined {joinedAt}
                    </span>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex gap-2 mb-2 flex-shrink-0">
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      following
                        ? 'border border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500'
                        : 'bg-[#009999] text-white hover:bg-[#007777]'
                    }`}
                  >
                    {following ? <UserMinus className="size-4" /> : <UserPlus className="size-4" />}
                    {following ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    disabled={messaging}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[#009999] hover:text-[#009999] transition disabled:opacity-50"
                  >
                    <MessageSquare className="size-4" />
                    Message
                  </button>
                </div>
              )}

              {isOwnProfile && (
                <Link
                  to="/profile"
                  className="mb-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[#009999] hover:text-[#009999] transition flex-shrink-0"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {bio && <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>}
          </div>
        </div>

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="size-5 text-[#009999]" />Experience
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-[#009999]/30 pl-4">
                  <div className="font-semibold text-gray-900">{exp.title}</div>
                  <div className="text-sm text-[#009999] font-medium">{exp.company}</div>
                  <div className="text-xs text-gray-400 mb-1">{exp.duration}</div>
                  {exp.description && <p className="text-sm text-gray-600">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Code2 className="size-5 text-[#009999]" />Projects
            </h2>
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{proj.name}</span>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#009999] hover:underline flex-shrink-0">View →</a>
                    )}
                  </div>
                  {proj.description && <p className="text-sm text-gray-600 mb-2">{proj.description}</p>}
                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies.map((tech) => (
                        <span key={tech} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="size-5 text-[#009999]" />Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${SKILL_BADGE[skill.level] ?? 'text-gray-500'}`}>
                  {skill.name}
                  <span className="ml-1 text-xs opacity-70">· {skill.level}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Activity Tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === key
                    ? 'border-[#009999] text-[#009999]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key ? 'bg-[#009999]/10 text-[#009999]' : 'bg-gray-100 text-gray-400'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className="divide-y divide-gray-50">
              {threads.length === 0 ? (
                <EmptyActivity label="No posts yet" />
              ) : threads.map(t => (
                <Link key={t.id} to={`/forums/threads/${t.id}`}
                  className="flex gap-4 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug hover:text-[#009999] transition line-clamp-2">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{t.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(t.createdAt)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="size-3" />{t.replies}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3" />{t.upvotes}</span>
                      <span className="flex items-center gap-1"><Eye className="size-3" />{t.views}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <div className="divide-y divide-gray-50">
              {replies.length === 0 ? (
                <EmptyActivity label="No comments yet" />
              ) : replies.map(r => (
                <Link key={r.id} to={r.threadId ? `/forums/threads/${r.threadId}` : '/forums'}
                  className="flex gap-3 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{r.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(r.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3" />{r.upvotes}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Liked */}
          {activeTab === 'liked' && (
            <div className="divide-y divide-gray-50">
              {liked.length === 0 ? (
                <EmptyActivity label="No liked posts yet" />
              ) : liked.map(t => (
                <Link key={t.id} to={`/forums/threads/${t.id}`}
                  className="flex gap-4 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug hover:text-[#009999] transition line-clamp-2">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>by {t.author.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(t.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3 fill-[#009999] text-[#009999]" />{t.upvotes}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {experiences.length === 0 && projects.length === 0 && skills.length === 0 && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <p>This user hasn't filled out their profile yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyActivity({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-gray-400">
      <MessageSquare className="size-8 opacity-20 mx-auto mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
