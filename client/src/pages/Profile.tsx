import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Camera, Mail, Calendar, Briefcase, Code, Award, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ImageEditorModal } from '../components/ImageEditorModal';
import { fetchProfile, updateProfile } from '../api/app';
import { formatLongDate } from '../utils/format';
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

export function Profile() {
  const { user, refreshUser } = useAuth();
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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [editingType, setEditingType] = useState<'avatar' | 'cover'>('avatar');

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

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-[#009999] text-white';
      case 'Advanced':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange('avatar', e)}
          className="hidden"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange('cover', e)}
          className="hidden"
        />

        <div className="glass-panel overflow-hidden rounded-[30px]">
          <div
            className="glass-panel-strong relative h-48"
            style={coverUrl ? {
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            {isEditing && (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="glass-input absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/75 transition"
              >
                <Camera className="size-4" />
                Change Cover
              </button>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-6 -mt-16 sm:-mt-20">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="size-32 sm:size-40 rounded-full border-4 border-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.18)] object-cover"
                />
                {isEditing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="glass-input absolute bottom-2 right-2 rounded-full p-2 hover:bg-white/75 transition"
                  >
                    <Camera className="size-4 text-gray-700" />
                  </button>
                )}
              </div>

              <div className="flex-1 pt-4 sm:pt-20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
                      </div>
                    ) : (
                      <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Mail className="size-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={saving} className="bg-[#009999] hover:bg-[#008080]">
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} className="bg-[#009999] hover:bg-[#008080]">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-6 border-t border-white/50 pt-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{experiences.length}</div>
                    <div className="text-sm text-gray-600">Experiences</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
                    <div className="text-sm text-gray-600">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{skills.length}</div>
                    <div className="text-sm text-gray-600">Skills</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <Label htmlFor="bio" className="text-base font-semibold text-gray-900">Bio</Label>
                {isEditing ? (
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2" rows={3} />
                ) : (
                  <p className="mt-2 text-gray-700">{bio || 'No bio yet.'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location" className="text-base font-semibold text-gray-900">Location</Label>
                {isEditing ? (
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 max-w-xs" />
                ) : (
                  <p className="mt-2 text-gray-700">{location || 'No location added.'}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="size-4" />
                <span>Joined {formatLongDate(joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel mt-8 rounded-[28px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Experience</h2>
            </div>
            {isEditing && (
              <button
                onClick={() => setExperiences((prev) => [...prev, { id: crypto.randomUUID(), title: '', company: '', duration: '', description: '' }])}
                className="text-[#009999] hover:text-[#007777] transition text-sm font-medium flex items-center gap-1"
              >
                <Plus className="size-4" />
                Add Experience
              </button>
            )}
          </div>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="border-l-4 border-[#009999] pl-4 pb-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setExperiences((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-gray-400 hover:text-red-500">
                        <X className="size-4" />
                      </button>
                    </div>
                    <Input value={exp.title} onChange={(e) => setExperiences((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} placeholder="Title" />
                    <Input value={exp.company} onChange={(e) => setExperiences((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, company: e.target.value } : item))} placeholder="Company" />
                    <Input value={exp.duration} onChange={(e) => setExperiences((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, duration: e.target.value } : item))} placeholder="Duration" />
                    <Textarea value={exp.description} onChange={(e) => setExperiences((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} placeholder="Description" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                    <p className="text-[#009999] font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                    <p className="mt-3 text-gray-600 leading-relaxed">{exp.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel mt-8 rounded-[28px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Projects</h2>
            </div>
            {isEditing && (
              <button
                onClick={() => setProjects((prev) => [...prev, { id: crypto.randomUUID(), name: '', description: '', technologies: [], link: '' }])}
                className="text-[#009999] hover:text-[#007777] transition text-sm font-medium flex items-center gap-1"
              >
                <Plus className="size-4" />
                Add Project
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj, index) => (
              <div key={proj.id} className="glass-input rounded-[24px] p-4 hover:border-[#009999]/40 transition">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setProjects((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-gray-400 hover:text-red-500">
                        <X className="size-4" />
                      </button>
                    </div>
                    <Input value={proj.name} onChange={(e) => setProjects((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Project name" />
                    <Textarea value={proj.description} onChange={(e) => setProjects((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} placeholder="Description" />
                    <Input value={proj.technologies.join(', ')} onChange={(e) => setProjects((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: e.target.value.split(',').map((tech) => tech.trim()).filter(Boolean) } : item))} placeholder="Technologies (comma separated)" />
                    <Input value={proj.link || ''} onChange={(e) => setProjects((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, link: e.target.value } : item))} placeholder="Project link" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2">{proj.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{proj.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proj.technologies.map((tech) => (
                        <span key={tech} className="rounded-full bg-white/65 px-2 py-1 text-xs text-gray-700">{tech}</span>
                      ))}
                    </div>
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

        <div className="glass-panel mt-8 rounded-[28px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-[#009999]" />
              <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            </div>
            {isEditing && (
              <button
                onClick={() => setSkills((prev) => [...prev, { id: crypto.randomUUID(), name: '', level: 'Intermediate' }])}
                className="text-[#009999] hover:text-[#007777] transition text-sm font-medium flex items-center gap-1"
              >
                <Plus className="size-4" />
                Add Skill
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              isEditing ? (
                <div key={skill.id} className="glass-input flex items-center gap-2 rounded-full px-4 py-2">
                  <Input value={skill.name} onChange={(e) => setSkills((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Skill" className="h-8 w-28 border-none shadow-none px-0" />
                  <select
                    value={skill.level}
                    onChange={(e) => setSkills((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, level: e.target.value as Skill['level'] } : item))}
                    className="rounded-full border border-white/60 bg-white/65 px-2 py-1 text-xs"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                  <button onClick={() => setSkills((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-gray-400 hover:text-red-500">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div key={skill.id} className="glass-input flex items-center gap-2 rounded-full px-4 py-2 hover:border-[#009999]/40 transition">
                  <span className="font-medium text-gray-900">{skill.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getSkillColor(skill.level)}`}>{skill.level}</span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="glass-panel mt-8 rounded-[28px] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <p>Profile data is now connected. Activity feed can be added next on top of posts/messages.</p>
          </div>
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
    </div>
  );
}
