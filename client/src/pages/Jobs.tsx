import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '../components/Header';
import {
  Bookmark, MapPin, DollarSign, Clock, Building2,
  Search, X, ArrowLeft, SlidersHorizontal, Briefcase, Calendar,
  FileUp, Loader2, Sparkles, FileText, CheckCircle2, Upload, Star,
} from 'lucide-react';
import { fetchJobs, toggleSavedJob, parseResume, aiChat, type JobResponse } from '../api/app';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';
import { CompanyLogo } from '../components/CompanyLogo';

// ── Filter types ──────────────────────────────────────────────────────────────

type WorkMode       = 'All' | 'Remote' | 'Hybrid' | 'Onsite';
type ExperienceLevel = 'All' | 'Intern' | 'Entry' | 'Mid' | 'Senior' | 'Lead';
type DatePosted     = 'All' | 'Today' | 'Past week' | 'Past month';
type JobTypeFilter  = 'All' | 'Full-time' | 'Part-time' | 'Internship' | 'Contract';

interface Filters {
  search:      string;
  location:    string;
  workMode:    WorkMode;
  experience:  ExperienceLevel;
  datePosted:  DatePosted;
  jobType:     JobTypeFilter;
  savedOnly:   boolean;
}

const DEFAULT_FILTERS: Filters = {
  search: '', location: '', workMode: 'All', experience: 'All',
  datePosted: 'All', jobType: 'All', savedOnly: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveWorkMode(location: string): WorkMode {
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  return 'Onsite';
}

function deriveExperience(title: string): ExperienceLevel {
  const t = title.toLowerCase();
  if (t.includes('intern'))                                             return 'Intern';
  if (t.includes('lead') || t.includes('principal') || t.includes('staff')) return 'Lead';
  if (t.includes('senior') || t.includes(' sr ') || t.includes('sr.')) return 'Senior';
  if (t.includes('junior') || t.includes('entry') || t.includes('associate') || t.includes(' jr ')) return 'Entry';
  if (t.includes('mid') || t.includes(' ii ') || t.includes(' 2 '))  return 'Mid';
  return 'Entry';
}

function withinDateRange(postedAt: string, range: DatePosted): boolean {
  if (range === 'All') return true;
  const diff = Date.now() - new Date(postedAt).getTime();
  const DAY  = 86_400_000;
  if (range === 'Today')      return diff < DAY;
  if (range === 'Past week')  return diff < 7 * DAY;
  if (range === 'Past month') return diff < 30 * DAY;
  return true;
}

const WORK_MODE_STYLE: Record<WorkMode, string> = {
  All:    '',
  Remote: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Hybrid: 'text-blue-700 bg-blue-50 border-blue-200',
  Onsite: 'text-gray-600 bg-gray-100 border-gray-200',
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface TailorResult {
  fitScore: number;           // 0-100
  summary: string;
  matchedRequirements: string[];
  missingSkills: string[];
  skillsToHighlight: string[];
  suggestedSummary: string;
  experienceAdvice: string[];
  bulletImprovements: Array<{ original: string; improved: string }> | string[];
}

function parseTailorResult(raw: string): TailorResult {
  const stripped = raw.replace(/```[\w]*\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch { /* next */ }
  try {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* next */ }
  return { fitScore: 0, summary: raw, matchedRequirements: [], missingSkills: [], skillsToHighlight: [], suggestedSummary: '', experienceAdvice: [], bulletImprovements: [] };
}

export function Jobs() {
  const [allJobs,       setAllJobs]       = useState<JobResponse[]>([]);
  const [selectedId,    setSelectedId]    = useState<number | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [mobileView,    setMobileView]    = useState<'list' | 'detail'>('list');
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [filters,       setFilters]       = useState<Filters>(DEFAULT_FILTERS);
  const [matchedJobs,   setMatchedJobs]   = useState<JobResponse[] | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [tailorJob,     setTailorJob]     = useState<JobResponse | null>(null);
  const [tailorStep,    setTailorStep]    = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [tailorResult,  setTailorResult]  = useState<TailorResult | null>(null);
  const tailorInputRef = useRef<HTMLInputElement>(null);

  const [pendingApplyJob, setPendingApplyJob] = useState<JobResponse | null>(null);
  const [showApplyCheck,  setShowApplyCheck]  = useState(false);
  const [appliedJobs,     setAppliedJobs]     = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('appliedJobs') || '[]')); }
    catch { return new Set(); }
  });

  const handleApply = (job: JobResponse) => {
    setPendingApplyJob(job);
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    const onVisible = () => {
      if (!document.hidden) {
        document.removeEventListener('visibilitychange', onVisible);
        setTimeout(() => setShowApplyCheck(true), 300);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
  };

  const confirmApplied = (didApply: boolean) => {
    if (didApply && pendingApplyJob) {
      setAppliedJobs(prev => {
        const next = new Set(prev).add(pendingApplyJob.id);
        localStorage.setItem('appliedJobs', JSON.stringify([...next]));
        return next;
      });
      toast.success(`Marked as applied — ${pendingApplyJob.title} at ${pendingApplyJob.company.name}`);
    }
    setShowApplyCheck(false);
    setPendingApplyJob(null);
  };

  useEffect(() => {
    fetchJobs()
      .then(data => {
        setAllJobs(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(err => toast.error(getErrorMessage(err, 'Failed to load jobs')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => allJobs.filter(job => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!job.title.toLowerCase().includes(q) && !job.company.name.toLowerCase().includes(q)) return false;
    }
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.workMode !== 'All' && deriveWorkMode(job.location) !== filters.workMode) return false;
    if (filters.experience !== 'All' && deriveExperience(job.title) !== filters.experience) return false;
    if (!withinDateRange(job.postedAt, filters.datePosted)) return false;
    if (filters.jobType !== 'All' && !job.type.toLowerCase().includes(filters.jobType.toLowerCase())) return false;
    if (filters.savedOnly && !job.saved) return false;
    return true;
  }), [allJobs, filters]);

  const displayJobs = matchedJobs ?? filtered;
  const selectedJob = displayJobs.find(j => j.id === selectedId) ?? displayJobs[0] ?? null;

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(prev => ({ ...prev, [key]: val }));

  const clearFilters = () => setFilters(prev => ({ ...DEFAULT_FILTERS, search: prev.search }));

  const activeCount = [
    filters.workMode !== 'All',
    filters.experience !== 'All',
    filters.datePosted !== 'All',
    filters.jobType !== 'All',
    filters.location !== '',
    filters.savedOnly,
  ].filter(Boolean).length;

  const handleSave = async (jobId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await toggleSavedJob(jobId);
      setAllJobs(prev => prev.map(j => j.id === jobId ? { ...j, saved: updated.saved } : j));
      toast.success(updated.saved ? 'Job saved' : 'Job removed from saved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update saved job'));
    }
  };

  const selectJob = (id: number) => { setSelectedId(id); setMobileView('detail'); };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setResumeLoading(true);
    try {
      const result = await parseResume(file);
      if (result.suggestedJobs.length === 0) {
        toast.info('No matching jobs found for your resume');
      } else {
        setMatchedJobs(result.suggestedJobs);
        setSelectedId(result.suggestedJobs[0].id);
        toast.success(`${result.suggestedJobs.length} jobs matched to your resume`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to parse resume'));
    } finally {
      setResumeLoading(false);
    }
  };

  const clearResumeMatch = () => { setMatchedJobs(null); };

  const openTailor = (job: JobResponse) => {
    setTailorJob(job);
    setTailorStep('upload');
    setTailorResult(null);
  };

  const closeTailor = () => { setTailorJob(null); setTailorResult(null); };

  const handleTailorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tailorJob) return;
    e.target.value = '';
    setTailorStep('analyzing');
    try {
      const parsed = await parseResume(file);
      const { profile } = parsed;
      const prompt = `You are an expert ATS-aware career coach. Deeply analyze this candidate's resume against the job posting and return a thorough JSON tailoring report.

JOB POSTING:
Title: ${tailorJob.title}
Company: ${tailorJob.company.name}
Industry: ${tailorJob.company.industry}
Description: ${tailorJob.description}
Requirements: ${tailorJob.requirements.join('; ')}

CANDIDATE PROFILE:
Skills: ${profile.skills.map(s => `${s.name} (${s.level})`).join(', ') || 'None listed'}
Experience: ${profile.experiences.map(e => `${e.title} at ${e.company} (${e.duration}): ${e.description}`).join(' | ') || 'None'}
Projects: ${profile.projects.map(p => `${p.name} [${p.technologies.join(', ')}]: ${p.description}`).join(' | ') || 'None'}
Bio: ${profile.bio || 'None'}

Return ONLY a JSON object with these exact keys — no markdown, no extra text:
{
  "fitScore": <integer 0-100, honest ATS match score>,
  "summary": "<2-3 sentence overall assessment of candidacy strength>",
  "matchedRequirements": ["<requirement the candidate already meets>", ...],
  "missingSkills": ["<skill/keyword required by job but absent from resume>", ...],
  "skillsToHighlight": ["<existing skill that is highly relevant and should be more prominent>", ...],
  "suggestedSummary": "<rewritten 2-3 sentence professional summary optimised for this specific role>",
  "experienceAdvice": ["<specific tip on how to reframe an existing experience bullet for this role>", ...],
  "bulletImprovements": [
    { "original": "<existing weak bullet or missing area>", "improved": "<stronger, metrics-driven, ATS-optimised rewrite>" },
    ...
  ]
}

Be honest: if the candidate is a weak fit, say so and focus advice on closing the gap. Aim for 2-4 items per array.`;

      const { text } = await aiChat(prompt);
      setTailorResult(parseTailorResult(text));
      setTailorStep('result');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to analyze resume'));
      setTailorStep('upload');
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)]"><LoadingState /></div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] flex flex-col overflow-hidden">

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-3 md:px-6 pt-3 pb-2 space-y-2">

          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none z-10" />
              <input
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                placeholder="Search by title or company…"
                className="glass-input w-full pl-9 pr-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40"
              />
              {filters.search && (
                <button onClick={() => setFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Resume match button */}
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleResumeUpload}
            />
            <button
              onClick={() => resumeInputRef.current?.click()}
              disabled={resumeLoading}
              title="Match jobs to your resume"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                matchedJobs
                  ? 'bg-[#009999] text-white shadow-md'
                  : 'glass-input text-gray-600 hover:bg-white/75'
              }`}
            >
              {resumeLoading
                ? <Loader2 className="size-4 animate-spin" />
                : <FileUp className="size-4" />}
              <span className="hidden sm:inline">{matchedJobs ? 'Resume Active' : 'Match Resume'}</span>
            </button>

            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                filtersOpen || activeCount > 0
                  ? 'bg-[#009999] text-white shadow-md'
                  : 'glass-input text-gray-600 hover:bg-white/75'
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span className="size-5 flex items-center justify-center bg-white/30 rounded-full text-xs font-bold">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filter panel */}
          {filtersOpen && (
            <div className="glass-panel rounded-2xl p-3 md:p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <ChipGroup label="Work Mode" icon={<MapPin className="size-3" />}
                  options={['All', 'Remote', 'Hybrid', 'Onsite'] as WorkMode[]}
                  value={filters.workMode} onChange={v => setFilter('workMode', v)} />

                <ChipGroup label="Job Type" icon={<Briefcase className="size-3" />}
                  options={['All', 'Full-time', 'Part-time', 'Internship', 'Contract'] as JobTypeFilter[]}
                  value={filters.jobType} onChange={v => setFilter('jobType', v)} />

                <ChipGroup label="Experience" icon={<Building2 className="size-3" />}
                  options={['All', 'Intern', 'Entry', 'Mid', 'Senior', 'Lead'] as ExperienceLevel[]}
                  value={filters.experience} onChange={v => setFilter('experience', v)} />

                <ChipGroup label="Date Posted" icon={<Calendar className="size-3" />}
                  options={['All', 'Today', 'Past week', 'Past month'] as DatePosted[]}
                  value={filters.datePosted} onChange={v => setFilter('datePosted', v)} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[160px]">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                  <input
                    value={filters.location}
                    onChange={e => setFilter('location', e.target.value)}
                    placeholder="City or region…"
                    className="glass-input w-full pl-8 pr-4 py-1.5 rounded-full text-sm focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer flex-shrink-0 select-none">
                  <input type="checkbox" checked={filters.savedOnly}
                    onChange={e => setFilter('savedOnly', e.target.checked)}
                    className="rounded accent-[#009999] size-3.5" />
                  <Bookmark className="size-3.5 text-[#009999]" />
                  Saved only
                </label>
                {activeCount > 0 && (
                  <button onClick={clearFilters}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 flex-shrink-0 ml-auto">
                    <X className="size-3" /> Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active filter summary chips */}
          {!filtersOpen && activeCount > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {filters.workMode    !== 'All'  && <ActiveChip label={filters.workMode}    onRemove={() => setFilter('workMode', 'All')} />}
              {filters.jobType     !== 'All'  && <ActiveChip label={filters.jobType}     onRemove={() => setFilter('jobType', 'All')} />}
              {filters.experience  !== 'All'  && <ActiveChip label={filters.experience}  onRemove={() => setFilter('experience', 'All')} />}
              {filters.datePosted  !== 'All'  && <ActiveChip label={filters.datePosted}  onRemove={() => setFilter('datePosted', 'All')} />}
              {filters.location                && <ActiveChip label={filters.location}    onRemove={() => setFilter('location', '')} />}
              {filters.savedOnly               && <ActiveChip label="Saved"              onRemove={() => setFilter('savedOnly', false)} />}
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 transition ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Main split layout ─────────────────────────────────────────── */}
        <div className="flex flex-1 gap-3 px-3 md:px-6 pb-3 overflow-hidden min-h-0">

          {/* Left: job list */}
          <div className={`flex flex-col flex-shrink-0 w-full md:w-[340px] lg:w-[380px] overflow-hidden ${
            mobileView === 'detail' ? 'hidden md:flex' : 'flex'
          }`}>

            {/* Resume match banner */}
            {matchedJobs ? (
              <div className="flex items-center justify-between bg-[#009999]/10 border border-[#009999]/25 rounded-2xl px-3 py-2 mb-2 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#009999]">
                  <Sparkles className="size-3.5" />
                  {matchedJobs.length} jobs matched to your resume
                </span>
                <button onClick={clearResumeMatch} className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-0.5">
                  <X className="size-3" /> Clear
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-2 flex-shrink-0">
                <span className="font-semibold text-gray-700">{filtered.length}</span> jobs found
              </p>
            )}

            {(matchedJobs ?? filtered).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Search className="size-10 opacity-25" />
                <p className="text-sm">No jobs match your filters</p>
                {!matchedJobs && (
                  <button onClick={clearFilters} className="text-xs text-[#009999] hover:underline">Clear filters</button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 -mr-0.5">
                {(matchedJobs ?? filtered).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    onClick={() => selectJob(job.id)}
                    onSave={handleSave}
                    isApplied={appliedJobs.has(job.id)}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Right: job detail */}
          <div className={`flex-1 overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          } flex-col min-w-0`}>
            {selectedJob ? (
              <JobDetail
                key={selectedJob.id}
                job={selectedJob}
                onSave={handleSave}
                onBack={() => setMobileView('list')}
                onTailor={() => openTailor(selectedJob)}
                onApply={() => handleApply(selectedJob)}
                isApplied={appliedJobs.has(selectedJob.id)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center glass-panel rounded-2xl text-gray-400">
                <div className="text-center">
                  <Briefcase className="size-12 opacity-20 mx-auto mb-2" />
                  <p className="text-sm">Select a job to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden tailor input */}
      <input ref={tailorInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleTailorUpload} />

      {/* Tailor Resume Modal */}
      {tailorJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="size-5 text-[#009999]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900">Tailor Resume</h2>
                  <p className="text-xs text-gray-500 truncate">{tailorJob.title} · {tailorJob.company.name}</p>
                </div>
              </div>
              <button onClick={closeTailor} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

              {tailorStep === 'upload' && (
                <>
                  <div
                    onClick={() => tailorInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-[#009999] rounded-2xl p-10 text-center cursor-pointer transition-colors group"
                  >
                    <Upload className="size-10 mx-auto text-gray-300 group-hover:text-[#009999] transition mb-3" />
                    <p className="font-semibold text-gray-700 mb-1">Upload your resume</p>
                    <p className="text-sm text-gray-400">PDF or TXT — AI will score your fit and give you specific tailoring advice</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { icon: <Star className="size-4 mx-auto mb-1 text-[#009999]" />, label: 'ATS Fit Score' },
                      { icon: <CheckCircle2 className="size-4 mx-auto mb-1 text-emerald-500" />, label: 'Gap Analysis' },
                      { icon: <FileText className="size-4 mx-auto mb-1 text-blue-500" />, label: 'Bullet Rewrites' },
                    ].map(({ icon, label }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        {icon}
                        <p className="text-xs text-gray-500 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tailorStep === 'analyzing' && (
                <div className="py-14 flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-[#009999]/10 flex items-center justify-center">
                    <Loader2 className="size-8 text-[#009999] animate-spin" />
                  </div>
                  <p className="font-semibold text-gray-800">Analyzing your resume…</p>
                  <p className="text-sm text-gray-400">Scoring ATS fit · identifying gaps · crafting rewrites</p>
                </div>
              )}

              {tailorStep === 'result' && tailorResult && (() => {
                const score = tailorResult.fitScore;
                const scoreColor = score >= 75 ? '#009999' : score >= 50 ? '#f59e0b' : '#ef4444';
                const scoreLabel = score >= 75 ? 'Strong Match' : score >= 50 ? 'Partial Match' : 'Weak Match';
                const circumference = 2 * Math.PI * 28;
                const dash = (score / 100) * circumference;

                return (
                  <div className="space-y-5">

                    {/* Score card */}
                    <div className="rounded-2xl p-5 flex items-center gap-5"
                      style={{ background: `linear-gradient(135deg, ${scoreColor}15, ${scoreColor}08)`, border: `1px solid ${scoreColor}30` }}>
                      {/* Circle meter */}
                      <div className="flex-shrink-0 relative size-[72px]">
                        <svg className="size-[72px] -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                          <circle cx="32" cy="32" r="28" fill="none" stroke={scoreColor} strokeWidth="6"
                            strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-black leading-none" style={{ color: scoreColor }}>{score}</span>
                          <span className="text-[9px] text-gray-400 font-medium">/ 100</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-snug">{tailorResult.summary}</p>
                      </div>
                    </div>

                    {/* Requirements grid: matched vs. missing */}
                    {(tailorResult.matchedRequirements?.length > 0 || tailorResult.missingSkills?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {tailorResult.matchedRequirements?.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" /> Already Meets
                            </p>
                            <ul className="space-y-1">
                              {tailorResult.matchedRequirements.map((r, i) => (
                                <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                                  <span className="mt-0.5 flex-shrink-0">▸</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {tailorResult.missingSkills?.length > 0 && (
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <X className="size-3.5" /> Gaps to Close
                            </p>
                            <ul className="space-y-1">
                              {tailorResult.missingSkills.map((s, i) => (
                                <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                                  <span className="mt-0.5 flex-shrink-0">▸</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills to surface */}
                    {tailorResult.skillsToHighlight?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Star className="size-3.5 text-[#009999]" /> Emphasise These Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tailorResult.skillsToHighlight.map((s, i) => (
                            <span key={i} className="bg-[#009999]/10 text-[#009999] border border-[#009999]/25 text-xs px-3 py-1 rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested summary */}
                    {tailorResult.suggestedSummary && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <FileText className="size-3.5 text-blue-500" /> Rewritten Professional Summary
                        </p>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-900 leading-relaxed italic">
                          "{tailorResult.suggestedSummary}"
                        </div>
                      </div>
                    )}

                    {/* Experience framing tips */}
                    {tailorResult.experienceAdvice?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Briefcase className="size-3.5 text-[#009999]" /> How to Frame Your Experience
                        </p>
                        <ul className="space-y-2">
                          {tailorResult.experienceAdvice.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="size-4 text-[#009999] flex-shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bullet rewrites */}
                    {tailorResult.bulletImprovements?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-[#009999]" /> Bullet Point Rewrites
                        </p>
                        <div className="space-y-3">
                          {tailorResult.bulletImprovements.map((b, i) => {
                            const isObj = typeof b === 'object' && b !== null && 'improved' in b;
                            return (
                              <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                                {isObj && (b as { original: string; improved: string }).original && (
                                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-400 flex items-start gap-1.5 line-through">
                                    <span className="flex-shrink-0 mt-0.5">✕</span>
                                    <span>{(b as { original: string; improved: string }).original}</span>
                                  </div>
                                )}
                                <div className="bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">▸</span>
                                  <span>{isObj ? (b as { original: string; improved: string }).improved : String(b)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
              {tailorStep === 'result' ? (
                <button
                  onClick={() => { setTailorStep('upload'); setTailorResult(null); }}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Try a Different Resume
                </button>
              ) : (
                <button onClick={closeTailor} className="ml-auto text-sm text-gray-400 hover:text-gray-600 transition px-2">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Applied? Confirmation popup ────────────────────────────────── */}
      {showApplyCheck && pendingApplyJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Top accent */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #007777, #009999, #74E0D3)' }} />

            <div className="px-6 pt-6 pb-5">
              {/* Icon */}
              <div className="size-14 rounded-2xl bg-[#009999]/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="size-7 text-[#009999]" />
              </div>

              {/* Text */}
              <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Did you apply?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                Did you submit your application for{' '}
                <span className="font-semibold text-gray-800">{pendingApplyJob.title}</span>{' '}
                at{' '}
                <span className="font-semibold text-gray-800">{pendingApplyJob.company.name}</span>?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => confirmApplied(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Not yet
                </button>
                <button
                  onClick={() => confirmApplied(true)}
                  className="flex-1 py-3 rounded-2xl bg-[#009999] text-white text-sm font-semibold hover:bg-[#007777] transition"
                >
                  Yes, I applied! 🎉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ChipGroup ─────────────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label, icon, options, value, onChange,
}: { label: string; icon: React.ReactNode; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-gray-500 font-medium flex items-center gap-0.5 flex-shrink-0">
        {icon}{label}:
      </span>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`text-xs px-2.5 py-1 rounded-full transition border ${
            value === opt
              ? 'bg-[#009999] text-white border-[#009999]'
              : 'glass-input text-gray-600 border-transparent hover:bg-white/75'
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── ActiveChip ────────────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 text-xs bg-[#009999]/10 text-[#009999] border border-[#009999]/25 px-2.5 py-0.5 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition">
        <X className="size-3" />
      </button>
    </span>
  );
}

// ── JobCard (list item) ───────────────────────────────────────────────────────

function JobCard({ job, isSelected, onClick, onSave, isApplied }: {
  job: JobResponse;
  isSelected: boolean;
  onClick: () => void;
  onSave: (id: number, e: React.MouseEvent) => void;
  isApplied?: boolean;
}) {
  const workMode  = deriveWorkMode(job.location);
  const modeStyle = WORK_MODE_STYLE[workMode];
  const cityOnly  = job.location.split(',')[0].trim();

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
        isSelected
          ? 'glass-panel-strong border-[#009999]/50 shadow-lg shadow-[#009999]/10'
          : 'glass-input border-transparent hover:border-white/60 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo
          companyName={job.company.name}
          logoUrl={job.company.logo}
          className="size-10 flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-semibold text-sm leading-snug truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {job.title}
              </p>
              <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                {job.company.name}
              </p>
            </div>
            <button
              onClick={e => onSave(job.id, e)}
              className={`flex-shrink-0 p-1 rounded-full transition ${
                job.saved
                  ? isSelected ? 'text-white' : 'text-[#009999]'
                  : isSelected ? 'text-white/50 hover:text-white' : 'text-gray-300 hover:text-[#009999]'
              }`}
            >
              <Bookmark className={`size-4 ${job.saved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              isSelected ? 'bg-white/20 text-white border-white/30' : modeStyle
            }`}>
              {workMode}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-white/15 text-white/80' : 'bg-gray-100 text-gray-500'
            }`}>
              {job.type}
            </span>
            {isApplied && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <CheckCircle2 className="size-2.5" /> Applied
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className={`flex items-center gap-3 mt-1.5 text-xs ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
            <span className="flex items-center gap-1"><MapPin className="size-3" />{cityOnly}</span>
            <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(job.postedAt)}</span>
          </div>

          {/* Salary */}
          {job.salary && (
            <p className={`text-xs font-semibold mt-1 flex items-center gap-0.5 ${
              isSelected ? 'text-white/90' : 'text-[#009999]'
            }`}>
              <DollarSign className="size-3" />{job.salary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── JobDetail (right panel) ───────────────────────────────────────────────────

function JobDetail({ job, onSave, onBack, onTailor, onApply, isApplied }: {
  job: JobResponse;
  onSave: (id: number, e: React.MouseEvent) => void;
  onBack: () => void;
  onTailor: () => void;
  onApply: () => void;
  isApplied: boolean;
}) {
  const workMode  = deriveWorkMode(job.location);
  const modeStyle = WORK_MODE_STYLE[workMode];

  return (
    <div className="glass-panel flex-1 rounded-2xl overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="glass-panel-strong p-4 md:p-6 text-white flex-shrink-0">
        {/* Mobile back */}
        <button onClick={onBack}
          className="md:hidden flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-3 transition">
          <ArrowLeft className="size-4" /> Back to jobs
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <CompanyLogo
              companyName={job.company.name}
              logoUrl={job.company.logo}
              className="size-14 md:size-16 flex-shrink-0 rounded-2xl"
            />
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold leading-tight">{job.title}</h2>
              <p className="text-sm opacity-85 mt-0.5">{job.company.name}</p>
              <p className="text-xs opacity-60 mt-0.5">{job.company.industry}</p>
            </div>
          </div>
          <button
            onClick={e => onSave(job.id, e)}
            className={`flex-shrink-0 p-2.5 rounded-full transition ${
              job.saved ? 'bg-white/25 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Bookmark className={`size-5 ${job.saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <MetaChip icon={<MapPin className="size-3" />} label={workMode} extra={modeStyle} />
          <MetaChip icon={<Briefcase className="size-3" />} label={job.type} />
          <MetaChip icon={<MapPin className="size-3" />} label={job.location} />
          {job.salary && <MetaChip icon={<DollarSign className="size-3" />} label={job.salary} />}
          <MetaChip icon={<Clock className="size-3" />} label={formatRelativeTime(job.postedAt)} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">

        {/* About the role */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">About the Role</h3>
          <p className="text-gray-600 leading-relaxed text-sm">{job.description}</p>
        </section>

        {/* Requirements */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Requirements</h3>
          <ul className="space-y-2">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-[#009999] mt-0.5 flex-shrink-0">▸</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* About the company */}
        <section className="glass-input rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="size-4 text-[#009999]" />
            <h3 className="text-sm font-semibold text-gray-900">About {job.company.name}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-1">{job.company.industry}</p>
          {job.company.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{job.company.description}</p>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center gap-3 border-t border-white/40 bg-white/20 p-4 backdrop-blur-sm">
        <button
          onClick={onTailor}
          className="glass-input flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-[#009999] hover:bg-white/75 transition"
        >
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">Tailor Resume</span>
        </button>
        <button
          onClick={onApply}
          className={`flex-1 py-3 px-6 rounded-full font-semibold transition text-sm text-center flex items-center justify-center gap-2 ${
            isApplied
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-[#009999] text-white hover:bg-[#007777]'
          }`}
        >
          {isApplied ? (
            <><CheckCircle2 className="size-4" /> Applied</>
          ) : 'Apply Now'}
        </button>
      </div>
    </div>
  );
}

function MetaChip({ icon, label, extra = '' }: { icon: React.ReactNode; label: string; extra?: string }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${
      extra
        ? `${extra} font-medium`
        : 'bg-white/10 border-white/25 text-white'
    }`}>
      {icon}{label}
    </span>
  );
}
