import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import {
  ArrowLeft, ThumbsUp, MessageSquare, Eye, Clock,
  Pin, Lock, Send, Trash2,
} from 'lucide-react';
import {
  fetchThread, fetchReplies, createReply, toggleThreadUpvote, deleteReply,
  type ForumThreadResponse, type ForumReplyResponse,
} from '../api/app';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/error';
import { LoadingState } from '../components/ui/loading-state';

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [thread,  setThread]  = useState<ForumThreadResponse | null>(null);
  const [replies, setReplies] = useState<ForumReplyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) return;
    const id = Number(threadId);
    Promise.all([fetchThread(id), fetchReplies(id)])
      .then(([t, r]) => { setThread(t); setReplies(r); })
      .catch(err => {
        toast.error(getErrorMessage(err, 'Failed to load thread'));
        navigate('/forums');
      })
      .finally(() => setLoading(false));
  }, [threadId, navigate]);

  const handleUpvote = async () => {
    if (!thread || upvoting) return;
    setUpvoting(true);
    try {
      const prevCount = thread.upvotes;
      const updated = await toggleThreadUpvote(thread.id);
      setThread(updated);
      setHasUpvoted(updated.upvotes > prevCount);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upvote'));
    } finally {
      setUpvoting(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!thread) return;
    try {
      await deleteReply(thread.id, replyId);
      setReplies(prev => prev.filter(r => r.id !== replyId));
      setThread(prev => prev ? { ...prev, replies: Math.max(0, prev.replies - 1) } : prev);
      toast.success('Reply deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete reply'));
    }
  };

  const handleReply = async () => {
    if (!thread || !replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const reply = await createReply(thread.id, replyText.trim());
      setReplies(prev => [...prev, reply]);
      setThread(prev => prev ? { ...prev, replies: prev.replies + 1 } : prev);
      setReplyText('');
      // Scroll to the new reply
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast.success('Reply posted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post reply'));
    } finally {
      setSubmitting(false);
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

  if (!thread) return null;

  const tags = thread.tags.filter(t => t.trim());

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-16">

        {/* Back link */}
        <button
          onClick={() => navigate('/forums')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#009999] transition mb-6 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Community
        </button>

        {/* ── Thread card ──────────────────────────────────────────────── */}
        <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">

          {/* Header band */}
          <div className="bg-gradient-to-r from-[#009999] to-[#00b3b3] px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {thread.pinned && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <Pin className="size-3" /> Pinned
                </span>
              )}
              {thread.locked && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <Lock className="size-3" /> Locked
                </span>
              )}
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                {categoryLabel(thread.category)}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold leading-snug mb-4">{thread.title}</h1>

            {/* Author row */}
            <div className="flex items-center gap-3">
              <Link to={`/profile/${thread.author.id}`} onClick={e => e.stopPropagation()}>
                <Avatar name={thread.author.name} src={thread.author.avatar} size={40} className="border-2 border-white/40 hover:border-white transition" />
              </Link>
              <div>
                <Link
                  to={`/profile/${thread.author.id}`}
                  className="font-semibold text-white hover:text-white/80 transition text-sm"
                >
                  {thread.author.name}
                </Link>
                <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" />
                  {formatRelativeTime(thread.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {thread.content}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1 px-6 py-3 border-t border-gray-100 flex-wrap gap-y-2">
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                hasUpvoted
                  ? 'bg-[#009999]/10 text-[#009999]'
                  : 'text-gray-600 hover:bg-[#009999]/10 hover:text-[#009999]'
              }`}
            >
              <ThumbsUp className={`size-4 ${hasUpvoted ? 'fill-[#009999]' : ''}`} />
              <span>{thread.upvotes}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">upvotes</span>
            </button>

            <button
              onClick={() => replyInputRef.current?.focus()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#009999]/10 hover:text-[#009999] transition"
            >
              <MessageSquare className="size-4" />
              <span>{thread.replies}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">replies</span>
            </button>

            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400">
              <Eye className="size-4" />
              <span>{thread.views.toLocaleString()}</span>
              <span className="text-xs hidden sm:inline">views</span>
            </span>

          </div>
        </article>

        {/* ── Replies ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="size-5 text-[#009999]" />
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {replies.length === 0 && !thread.locked && (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare className="size-8 opacity-30 mx-auto mb-2" />
              <p className="text-sm">No replies yet — be the first to respond!</p>
            </div>
          )}

          <div className="space-y-3">
            {replies.map((reply, idx) => (
              <ReplyCard key={reply.id} reply={reply} index={idx + 1} currentUserId={user?.id} onDelete={handleDeleteReply} />
            ))}
          </div>

          <div ref={repliesEndRef} />
        </section>

        {/* ── Reply box ────────────────────────────────────────────────── */}
        {thread.locked ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
            <Lock className="size-4" />
            This thread is locked. No new replies can be posted.
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              {user && (
                <Avatar name={user.name} src={user.avatar} size={36} className="mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                  }}
                  placeholder="Write a thoughtful reply… (Ctrl+Enter to post)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm resize-none outline-none focus:border-[#009999] focus:ring-2 focus:ring-[#009999]/20 placeholder:text-gray-400 transition"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${replyText.length > 4500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {replyText.length} / 5000
                  </span>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || submitting || replyText.length > 5000}
                    className="flex items-center gap-2 px-4 py-2 bg-[#009999] text-white rounded-xl text-sm font-semibold hover:bg-[#007777] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="size-4" />
                    {submitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── ReplyCard ─────────────────────────────────────────────────────────────────

function ReplyCard({ reply, index, currentUserId, onDelete }: {
  reply: ForumReplyResponse;
  index: number;
  currentUserId?: string;
  onDelete: (replyId: number) => void;
}) {
  const isOwn = currentUserId && String(reply.author.id) === currentUserId;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-[#009999]/30 transition">
      <div className="flex gap-3">
        {/* Avatar + index */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Link to={isOwn ? '/profile' : `/profile/${reply.author.id}`}>
            <Avatar name={reply.author.name} src={reply.author.avatar} size={36} className="hover:ring-2 hover:ring-[#009999] transition" />
          </Link>
          <span className="text-[10px] text-gray-300 font-mono">#{index}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              to={isOwn ? '/profile' : `/profile/${reply.author.id}`}
              className="font-semibold text-sm text-gray-900 hover:text-[#009999] transition"
            >
              {reply.author.name}
            </Link>
            {isOwn && (
              <span className="text-xs bg-[#009999]/10 text-[#009999] px-2 py-0.5 rounded-full font-medium">You</span>
            )}
            <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
              <Clock className="size-3" />
              {formatRelativeTime(reply.createdAt)}
            </span>
            {isOwn && (
              <button
                onClick={() => onDelete(reply.id)}
                className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                title="Delete reply"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
          {reply.upvotes > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <ThumbsUp className="size-3" /> {reply.upvotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

