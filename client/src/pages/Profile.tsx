import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Camera, MapPin, Calendar, Briefcase, Code2, Award, Plus, X, FileText, Loader2, Upload, CheckCircle2, Sparkles, ExternalLink, MessageSquare, ThumbsUp, Eye, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ImageEditorModal } from '../components/ImageEditorModal';
import { fetchProfile, updateProfile, parseResume, ResumeParseResponse, fetchThreadsByUser, fetchRepliesByUser, fetchLikedThreadsByUser, type ForumThreadResponse, type ForumReplyResponse } from '../api/app';
import { formatLongDate, formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

const SKILL_BADGE: Record<string, string> = {
  Expert:       'bg-[#009999] text-white',
  Advanced:     'border border-[#009999] text-[#009999]',
  Intermediate: 'border border-blue-400 text-blue-600',
  Beginner:     'text-gray-500',
};

export function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [joinedAt, setJoinedAt] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [coverUrl, setCoverUrl] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [scanningResume, setScanningResume] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeParseResponse | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [editingType, setEditingType] = useState<'avatar' | 'cover'>('avatar');

  type ActivityTab = 'posts' | 'comments' | 'liked';
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts');
  const [threads, setThreads] = useState<ForumThreadResponse[]>([]);
  const [replies, setReplies] = useState<ForumReplyResponse[]>([]);
  const [liked, setLiked] = useState<ForumThreadResponse[]>([]);

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        setName(profile.name);
        setBio(profile.bio);
        setLocation(profile.location);
        setAvatarUrl(profile.avatarUrl || '');
        setCoverUrl(profile.coverUrl || '');
        setJoinedAt(profile.createdAt);
        setExperiences(profile.experiences.map((item) => ({ ...item, id: String(item.id) })));
        setProjects(profile.projects.map((item) => ({ ...item, id: String(item.id) })));
        setSkills(profile.skills.map((item) => ({ ...item, id: String(item.id) } as Skill)));
        const uid = profile.userId;
        Promise.all([fetchThreadsByUser(uid), fetchRepliesByUser(uid), fetchLikedThreadsByUser(uid)])
          .then(([t, r, l]) => { setThreads(t); setReplies(r); setLiked(l); })
          .catch(() => {});
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Failed to load profile')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name,
        bio,
        location,
        avatarUrl,
        coverUrl,
        experiences: experiences.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          title: item.title,
          company: item.company,
          duration: item.duration,
          description: item.description,
        })),
        projects: projects.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          name: item.name,
          description: item.description,
          technologies: item.technologies,
          link: item.link,
        })),
        skills: skills.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          name: item.name,
          level: item.level,
        })),
      });
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (type: 'avatar' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setEditingType(type);
      setShowImageEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = (editedImageUrl: string) => {
    if (editingType === 'avatar') {
      setAvatarUrl(editedImageUrl);
    } else {
      setCoverUrl(editedImageUrl);
    }
    setShowImageEditor(false);
    setTempImageUrl('');
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanningResume(true);
    setResumeData(null);
    try {
      const data = await parseResume(file);
      setResumeData(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to scan resume'));
      setScanningResume(false);
    } finally {
      setScanningResume(false);
    }
  };

  const handleApplyResume = async () => {
    if (!resumeData) return;
    const { profile } = resumeData;
    const newBio = profile.bio || bio;
    const newSkills = profile.skills.length > 0
      ? profile.skills.map((s) => ({ id: crypto.randomUUID(), name: s.name, level: s.level as Skill['level'] }))
      : skills;
    const newExperiences = profile.experiences.length > 0
      ? profile.experiences.map((e) => ({ id: crypto.randomUUID(), ...e }))
      : experiences;
    const newProjects = profile.projects.length > 0
      ? profile.projects.map((p) => ({ id: crypto.randomUUID(), ...p }))
      : projects;

    setBio(newBio);
    setSkills(newSkills);
    setExperiences(newExperiences);
    setProjects(newProjects);

    setSaving(true);
    try {
      await updateProfile({
        name, bio: newBio, location, avatarUrl, coverUrl,
        experiences: newExperiences.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          title: item.title, company: item.company, duration: item.duration, description: item.description,
        })),
        projects: newProjects.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          name: item.name, description: item.description, technologies: item.technologies, link: item.link,
        })),
        skills: newSkills.map((item) => ({
          id: Number.isNaN(Number(item.id)) ? undefined : Number(item.id),
          name: item.name, level: item.level,
        })),
      });
      await refreshUser();
      setShowResumeModal(false);
      setResumeData(null);
      toast.success('Profile set up from resume!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange('avatar', e)} className="hidden" />
        <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange('cover', e)} className="hidden" />
        <input ref={resumeInputRef} type="file" accept=".pdf,.txt" onChange={handleResumeUpload} className="hidden" />

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Cover */}
          <div
            className="relative h-40"
            style={
              coverUrl
                ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: 'linear-gradient(135deg, #007a7a 0%, #009999 50%, #5ecfcf 100%)' }
            }
          >
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 hover:bg-black/55 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <Camera className="size-4" />
              Change Cover
            </button>
          </div>

          {/* Avatar + Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-end justify-between -mt-16 mb-4 gap-y-2">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="size-32 rounded-full border-4 object-cover shadow-md"
                  style={{ borderColor: '#ffffff' }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow border border-gray-200 hover:bg-gray-50 transition"
                >
                  <Camera className="size-3.5 text-gray-600" />
                </button>
              </div>

              <div className="pb-1 flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#009999] hover:bg-[#008080]">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#009999] hover:bg-[#008080] text-white">
                    Edit Profile
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setShowResumeModal(true); setResumeData(null); }}
                  className="flex items-center gap-2"
                >
                  <FileText className="size-4" />
                  Scan Resume
                </Button>
              </div>
            </div>

            {/* Name + email */}
            {isEditing ? (
              <div className="mb-4 space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 mb-4" />

            {/* Stats */}
            <div className="flex gap-8 mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">{experiences.length + projects.length}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Bio</p>
              {isEditing ? (
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Write something about yourself..." />
              ) : (
                <p className="text-gray-600 text-sm">{bio || 'No bio yet.'}</p>
              )}
            </div>

            {/* Location */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Location</p>
              {isEditing ? (
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className="max-w-xs" />
              ) : (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="size-4" />
                  <span>{location || 'No location added.'}</span>
                </div>
              )}
            </div>

            {/* Joined */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="size-4" />
              <span>Joined {formatLongDate(joinedAt)}</span>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Experience</h2>
            </div>
            <button
              onClick={() => {
                if (!isEditing) setIsEditing(true);
                setExperiences((prev) => [...prev, { id: crypto.randomUUID(), title: '', company: '', duration: '', description: '' }]);
              }}
              className="flex items-center gap-1 text-sm font-medium text-[#009999] hover:text-[#007777] transition"
            >
              <Plus className="size-4" />
              Add Experience
            </button>
          </div>
          <div className="space-y-6">
            {experiences.length === 0 && (
              <p className="text-sm text-gray-400">No experience added yet.</p>
            )}
            {experiences.map((exp, index) => (
              <div key={exp.id} className="border-l-4 border-[#009999] pl-5 pb-2">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setExperiences((prev) => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                        <X className="size-4" />
                      </button>
                    </div>
                    <Input value={exp.title} onChange={(e) => setExperiences((prev) => prev.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Job title" />
                    <Input value={exp.company} onChange={(e) => setExperiences((prev) => prev.map((item, i) => i === index ? { ...item, company: e.target.value } : item))} placeholder="Company" />
                    <Input value={exp.duration} onChange={(e) => setExperiences((prev) => prev.map((item, i) => i === index ? { ...item, duration: e.target.value } : item))} placeholder="Duration (e.g. 2022 - Present)" />
                    <Textarea value={exp.description} onChange={(e) => setExperiences((prev) => prev.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Description" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-900">{exp.title}</h3>
                    <p className="text-[#009999] font-medium text-sm">{exp.company}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{exp.duration}</p>
                    {exp.description && <p className="mt-3 text-gray-600 text-sm leading-relaxed">{exp.description}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Projects</h2>
            </div>
            <button
              onClick={() => {
                if (!isEditing) setIsEditing(true);
                setProjects((prev) => [...prev, { id: crypto.randomUUID(), name: '', description: '', technologies: [], link: '' }]);
              }}
              className="flex items-center gap-1 text-sm font-medium text-[#009999] hover:text-[#007777] transition"
            >
              <Plus className="size-4" />
              Add Project
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 && (
              <p className="text-sm text-gray-400">No projects added yet.</p>
            )}
            {projects.map((proj, index) => (
              <div key={proj.id} className="rounded-xl border border-gray-200 p-4 hover:border-[#009999]/40 transition">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setProjects((prev) => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                        <X className="size-4" />
                      </button>
                    </div>
                    <Input value={proj.name} onChange={(e) => setProjects((prev) => prev.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Project name" />
                    <Textarea value={proj.description} onChange={(e) => setProjects((prev) => prev.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Description" />
                    <Input value={proj.technologies.join(', ')} onChange={(e) => setProjects((prev) => prev.map((item, i) => i === index ? { ...item, technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : item))} placeholder="Technologies (comma separated)" />
                    <Input value={proj.link || ''} onChange={(e) => setProjects((prev) => prev.map((item, i) => i === index ? { ...item, link: e.target.value } : item))} placeholder="Project link (optional)" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-900 mb-2">{proj.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{proj.description}</p>
                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {proj.technologies.map((tech) => (
                          <span key={tech} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{tech}</span>
                        ))}
                      </div>
                    )}
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-[#009999] hover:text-[#007777] text-sm font-medium transition">
                        View Project →
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            </div>
            <button
              onClick={() => {
                if (!isEditing) setIsEditing(true);
                setSkills((prev) => [...prev, { id: crypto.randomUUID(), name: '', level: 'Intermediate' }]);
              }}
              className="flex items-center gap-1 text-sm font-medium text-[#009999] hover:text-[#007777] transition"
            >
              <Plus className="size-4" />
              Add Skill
            </button>
          </div>
          {skills.length === 0 && (
            <p className="text-sm text-gray-400">No skills added yet.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) =>
              isEditing ? (
                <div key={skill.id} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">
                  <Input value={skill.name} onChange={(e) => setSkills((prev) => prev.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Skill" className="h-7 w-24 border-none shadow-none px-0 text-sm" />
                  <select
                    value={skill.level}
                    onChange={(e) => setSkills((prev) => prev.map((item, i) => i === index ? { ...item, level: e.target.value as Skill['level'] } : item))}
                    className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                  <button onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div key={skill.id} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">
                  <span className="font-medium text-gray-900 text-sm">{skill.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${SKILL_BADGE[skill.level] ?? SKILL_BADGE.Beginner}`}>
                    {skill.level}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'posts',    label: 'Posts',    count: threads.length },
              { key: 'comments', label: 'Comments', count: replies.length },
              { key: 'liked',    label: 'Liked',    count: liked.length   },
            ] as { key: ActivityTab; label: string; count: number }[]).map(({ key, label, count }) => (
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

          {activeTab === 'posts' && (
            <div className="divide-y divide-gray-50">
              {threads.length === 0 ? <EmptyActivity label="No posts yet" /> : threads.map(t => (
                <a key={t.id} href={`/forums/threads/${t.id}`}
                  className="flex gap-4 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{t.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(t.createdAt)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="size-3" />{t.replies}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3" />{t.upvotes}</span>
                      <span className="flex items-center gap-1"><Eye className="size-3" />{t.views}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="divide-y divide-gray-50">
              {replies.length === 0 ? <EmptyActivity label="No comments yet" /> : replies.map(r => (
                <a key={r.id} href={r.threadId ? `/forums/threads/${r.threadId}` : '/forums'}
                  className="flex gap-3 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{r.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(r.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3" />{r.upvotes}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {activeTab === 'liked' && (
            <div className="divide-y divide-gray-50">
              {liked.length === 0 ? <EmptyActivity label="No liked posts yet" /> : liked.map(t => (
                <a key={t.id} href={`/forums/threads/${t.id}`}
                  className="flex gap-4 p-5 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>by {t.author.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(t.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="size-3 fill-[#009999] text-[#009999]" />{t.upvotes}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <ImageEditorModal
        isOpen={showImageEditor}
        imageUrl={tempImageUrl}
        imageType={editingType}
        onSave={handleSaveImage}
        onCancel={() => {
          setShowImageEditor(false);
          setTempImageUrl('');
        }}
      />

      {/* Resume Setup Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center">
                  <Sparkles className="size-5 text-[#009999]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Resume Setup</h2>
                  <p className="text-xs text-gray-500">Upload your resume to auto-fill your profile</p>
                </div>
              </div>
              <button
                onClick={() => { setShowResumeModal(false); setResumeData(null); setScanningResume(false); }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Step 1: Upload (always visible unless scanning/done) */}
              {!scanningResume && !resumeData && (
                <div
                  onClick={() => resumeInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-[#009999] rounded-2xl p-10 text-center cursor-pointer transition-colors group"
                >
                  <Upload className="size-10 mx-auto text-gray-300 group-hover:text-[#009999] transition mb-3" />
                  <p className="font-semibold text-gray-700 mb-1">Click to upload your resume</p>
                  <p className="text-sm text-gray-400">PDF or TXT — AI will extract your info automatically</p>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </div>
              )}

              {/* Step 2: Scanning */}
              {scanningResume && (
                <div className="py-16 flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-[#009999]/10 flex items-center justify-center">
                    <Loader2 className="size-8 text-[#009999] animate-spin" />
                  </div>
                  <p className="font-semibold text-gray-800">Scanning your resume…</p>
                  <p className="text-sm text-gray-400">AI is extracting your skills, experience, and projects</p>
                </div>
              )}

              {/* Step 3: Preview */}
              {resumeData && !scanningResume && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#009999]">
                    <CheckCircle2 className="size-5" />
                    <span className="font-semibold text-sm">Resume scanned successfully</span>
                  </div>

                  {/* Bio */}
                  {resumeData.profile.bio && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bio</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{resumeData.profile.bio}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {resumeData.profile.skills.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Skills ({resumeData.profile.skills.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.profile.skills.map((s) => (
                          <span key={s.name} className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                            {s.name}
                            {s.level && <span className="ml-1 text-[#009999]">· {s.level}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.profile.experiences.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Experience ({resumeData.profile.experiences.length})
                      </p>
                      {resumeData.profile.experiences.map((exp, i) => (
                        <div key={i} className="border-l-2 border-[#009999] pl-3">
                          <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                          <p className="text-xs text-[#009999]">{exp.company}{exp.duration && ` · ${exp.duration}`}</p>
                          {exp.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {resumeData.profile.projects.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Projects ({resumeData.profile.projects.length})
                      </p>
                      {resumeData.profile.projects.map((proj, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{proj.name}</p>
                            {proj.technologies.length > 0 && (
                              <p className="text-xs text-gray-400">{proj.technologies.slice(0, 4).join(', ')}</p>
                            )}
                          </div>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-[#009999] hover:text-[#007777] flex-shrink-0">
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched jobs */}
                  {resumeData.suggestedJobs.length > 0 && (
                    <div className="bg-[#009999]/5 border border-[#009999]/20 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-[#009999] uppercase tracking-wide">
                        {resumeData.suggestedJobs.length} Matched Jobs
                      </p>
                      {resumeData.suggestedJobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{job.title}</p>
                            <p className="text-xs text-gray-500">{job.company.name} · {job.location}</p>
                          </div>
                          <button onClick={() => { setShowResumeModal(false); navigate('/jobs'); }}
                            className="text-xs text-[#009999] hover:text-[#007777] font-medium flex-shrink-0">
                            View →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
              {resumeData ? (
                <>
                  <Button
                    onClick={handleApplyResume}
                    disabled={saving}
                    className="flex-1 bg-[#009999] hover:bg-[#008080] text-white"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                    {saving ? 'Saving…' : 'Apply & Save Profile'}
                  </Button>
                  <Button variant="outline" onClick={() => { setResumeData(null); }}>
                    Re-upload
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => { setShowResumeModal(false); setResumeData(null); }} className="ml-auto">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
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
