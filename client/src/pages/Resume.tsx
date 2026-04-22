import { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import {
  Loader2, Upload,
  PenLine, Edit2, Trash2, Pencil,
} from 'lucide-react';
import { ResumeBuilder, ResumeData, RESUME_STORAGE_KEY, uid } from '../components/ResumeBuilder';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/error';
import { parseResume, ResumeParseResponse } from '../api/app';

/** Convert a parsed resume profile into ResumeBuilder's data shape */
function convertParsedToResumeData(profile: ResumeParseResponse['profile']): ResumeData {
  const allSkills = profile.skills.map(s => s.name);
  return {
    name: profile.name || '',
    phone: '',
    email: '',
    linkedin: '',
    github: '',
    education: [],
    experience: profile.experiences.map(exp => ({
      id: uid(),
      company: exp.company || '',
      location: '',
      title: exp.title || '',
      dates: exp.duration || '',
      bullets: exp.description
        ? exp.description.split(/\n/).filter(Boolean).map(s => s.trim()).filter(Boolean)
        : [''],
    })),
    projects: profile.projects.map(proj => ({
      id: uid(),
      name: proj.name || '',
      technologies: proj.technologies?.join(', ') || '',
      dates: '',
      bullets: proj.description ? [proj.description] : [''],
    })),
    skills: {
      languages: allSkills.join(', '),
      frameworks: '',
      tools: '',
      libraries: '',
    },
  };
}

export function Resume() {

  // ── Resume tab ───────────────────────────────────────────────────────────────
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderInitialData, setBuilderInitialData] = useState<ResumeData | undefined>(undefined);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [scanningResume, setScanningResume] = useState(false);
  const [savedResume, setSavedResume] = useState<ResumeData | null>(null);
  const [renamingResume, setRenamingResume] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Load saved resume from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESUME_STORAGE_KEY);
      if (raw) setSavedResume(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Reload saved resume when builder closes (in case user saved)
  const handleBuilderBack = () => {
    setShowBuilder(false);
    setBuilderInitialData(undefined);
    try {
      const raw = localStorage.getItem(RESUME_STORAGE_KEY);
      if (raw) setSavedResume(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanningResume(true);
    try {
      const data = await parseResume(file);
      toast.success('Resume scanned — opening editor');
      const converted = convertParsedToResumeData(data.profile);
      setBuilderInitialData(converted);
      setShowBuilder(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to scan resume'));
    } finally {
      setScanningResume(false);
    }
  };

  const openNewBuilder = () => {
    setBuilderInitialData(undefined);
    setShowBuilder(true);
  };

  const openSavedBuilder = () => {
    setBuilderInitialData(savedResume ?? undefined);
    setShowBuilder(true);
  };

  const handleDeleteResume = () => {
    if (!confirm('Delete your saved resume? This cannot be undone.')) return;
    localStorage.removeItem(RESUME_STORAGE_KEY);
    setSavedResume(null);
    toast.success('Resume deleted');
  };

  const startRename = () => {
    setRenameValue(savedResume?.name || '');
    setRenamingResume(true);
  };

  const commitRename = () => {
    if (!savedResume) return;
    const updated = { ...savedResume, name: renameValue.trim() || savedResume.name };
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(updated));
    setSavedResume(updated);
    setRenamingResume(false);
    toast.success('Resume renamed');
  };

  if (showBuilder) {
    return (
      <div className="app-shell">
        <Header />
        <ResumeBuilder onBack={handleBuilderBack} initialData={builderInitialData} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
          <p className="text-sm text-gray-500 mt-1">Build and manage your resume</p>
        </div>

        {/* ── Resume ────────────────────────────────────────────────────── */}
        <div className="space-y-4">
            <input ref={resumeInputRef} type="file" accept=".pdf,.txt" onChange={handleResumeUpload} className="hidden" />

            {/* Action cards */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {/* Upload → Edit */}
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={scanningResume}
                className="border-2 border-dashed border-gray-200 hover:border-[#009999] rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:text-[#009999] transition group"
              >
                {scanningResume ? <Loader2 className="size-8 animate-spin text-[#009999]" /> : <Upload className="size-8 group-hover:scale-110 transition" />}
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-600 group-hover:text-[#009999] transition">
                    {scanningResume ? 'Scanning...' : 'Upload & Edit Resume'}
                  </p>
                  <p className="text-xs mt-0.5">AI parses it into an interactive editor</p>
                </div>
              </button>

              {/* Craft new */}
              <button
                onClick={openNewBuilder}
                className="border-2 border-dashed border-gray-200 hover:border-[#009999] rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:text-[#009999] transition group"
              >
                <PenLine className="size-8 group-hover:scale-110 transition" />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-600 group-hover:text-[#009999] transition">Craft New Resume</p>
                  <p className="text-xs mt-0.5">Start from scratch — Jake's template</p>
                </div>
              </button>

            </div>

            {/* Saved resume summary card */}
            {savedResume && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    {renamingResume ? (
                      <form
                        onSubmit={e => { e.preventDefault(); commitRename(); }}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="text-base font-bold text-gray-900 border-b-2 border-[#009999] outline-none bg-transparent w-full max-w-xs"
                          onBlur={commitRename}
                        />
                      </form>
                    ) : (
                      <h2 className="text-base font-bold text-gray-900">{savedResume.name || 'Untitled Resume'}</h2>
                    )}
                    {savedResume.email && <p className="text-sm text-gray-500">{savedResume.email}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={startRename} title="Rename">
                      <Pencil className="size-3.5 mr-1" /> Rename
                    </Button>
                    <Button variant="outline" size="sm" onClick={openSavedBuilder}>
                      <Edit2 className="size-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteResume} className="text-red-500 hover:text-red-600 hover:border-red-300" title="Delete">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Skills */}
                {savedResume.skills.languages && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedResume.skills.languages.split(',').filter(Boolean).slice(0, 12).map(s => (
                        <span key={s} className="bg-teal-50 border border-teal-200 text-teal-800 text-xs px-2.5 py-0.5 rounded-full">{s.trim()}</span>
                      ))}
                      {savedResume.skills.languages.split(',').filter(Boolean).length > 12 && (
                        <span className="text-xs text-gray-400">+{savedResume.skills.languages.split(',').filter(Boolean).length - 12} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {savedResume.experience.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Experience ({savedResume.experience.length})</p>
                    <div className="space-y-1">
                      {savedResume.experience.slice(0, 3).map((exp) => (
                        <div key={exp.id} className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-gray-800">{exp.title}</span>
                          {exp.company && <span className="text-xs text-[#009999]">@ {exp.company}</span>}
                          {exp.dates && <span className="text-xs text-gray-400">{exp.dates}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {savedResume.projects.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Projects ({savedResume.projects.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedResume.projects.slice(0, 5).map(p => (
                        <span key={p.id} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">{p.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

      </main>
    </div>
  );
}
