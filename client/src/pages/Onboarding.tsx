import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  Briefcase, Code2, MapPin, DollarSign,
  ChevronRight, ChevronLeft, Check, X, Plus,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { savePreferences } from '../api/app';
import { useAuth } from '../contexts/AuthContext';

// ── Config ─────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  { value: 'Entry', label: 'Entry Level', sub: '0 – 2 years', emoji: '🌱' },
  { value: 'Mid',   label: 'Mid Level',   sub: '2 – 5 years', emoji: '⚡' },
  { value: 'Senior',label: 'Senior',      sub: '5 – 8 years', emoji: '🚀' },
  { value: 'Lead',  label: 'Lead / Staff',sub: '8+ years',    emoji: '🏆' },
];

const JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

const REMOTE_OPTIONS = [
  { value: 'On-site', label: 'On-site',      sub: 'In the office every day' },
  { value: 'Hybrid',  label: 'Hybrid',        sub: 'Mix of office & home' },
  { value: 'Remote',  label: 'Remote',        sub: 'Work from anywhere' },
  { value: 'Any',     label: 'No Preference', sub: 'Open to all arrangements' },
];

const POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
  'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
  'GraphQL', 'REST', 'Spring Boot', 'Django', 'Next.js',
];

const SALARY_PRESETS = [
  { label: '<$60k',    min: 0,       max: 60000 },
  { label: '$60–100k', min: 60000,   max: 100000 },
  { label: '$100–150k',min: 100000,  max: 150000 },
  { label: '$150–200k',min: 150000,  max: 200000 },
  { label: '>$200k',   min: 200000,  max: undefined },
];

const STEPS = ['Experience', 'Work Style', 'Skills & Location', 'Salary'];

// ── Component ───────────────────────────────────────────────────────────────

export function Onboarding() {
  const navigate = useNavigate();
  const { setOnboardingComplete } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [experienceLevel, setExperienceLevel] = useState('');
  // Step 2
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [remotePref, setRemotePref] = useState('Any');
  // Step 3
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  // Step 4
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();

  // ── Helpers ─────────────────────────────────────────────────────────────

  const toggleJobType = (t: string) =>
    setJobTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const toggleSkill = (s: string) =>
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills(prev => [...prev, v]);
    setSkillInput('');
  };

  const addLocation = () => {
    const v = locationInput.trim();
    if (v && !locations.includes(v)) setLocations(prev => [...prev, v]);
    setLocationInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); fn(); }
  };

  const canAdvance = () => {
    if (step === 0) return !!experienceLevel;
    if (step === 1) return jobTypes.length > 0;
    return true; // steps 2 & 3 are optional
  };

  const next = () => { if (canAdvance()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await savePreferences({
        experienceLevel,
        jobTypes,
        remotePref,
        preferredLocations: locations,
        preferredSkills: skills,
        salaryMin,
        salaryMax,
      });
      setOnboardingComplete(true);
      toast.success('Preferences saved! Here are your personalised jobs.');
      navigate('/jobs', { replace: true });
    } catch {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="light min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #edf3f4 0%, #f4fafa 100%)' }}>
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div style={{ background: 'radial-gradient(ellipse 80% 50% at 10% -10%, rgba(0,153,153,0.18) 0%, transparent 60%)', position: 'absolute', inset: 0 }} />
        <div style={{ background: 'radial-gradient(ellipse 60% 40% at 90% 5%, rgba(14,143,143,0.14) 0%, transparent 55%)', position: 'absolute', inset: 0 }} />
      </div>

      {/* Header */}
      <header className="glass-header border-b border-white/30 sticky top-0 z-50" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo showTagline />
          <button
            onClick={() => { setOnboardingComplete(true); navigate('/jobs', { replace: true }); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-white/40 h-1">
        <div
          className="h-1 bg-[#009999] transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-[#009999] text-white' :
                  i === step ? 'bg-[#009999] text-white ring-4 ring-[#009999]/20' :
                  'bg-white/60 text-gray-400'
                }`}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${i === step ? 'text-[#009999]' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {/* ── Step 0: Experience ───────────────────────────────────── */}
          {step === 0 && (
            <div className="glass-panel rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center">
                  <Briefcase className="size-5 text-[#009999]" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">Where are you in your career?</h1>
              </div>
              <p className="text-gray-500 mb-6 ml-13">We'll use this to match you with the right roles.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {EXPERIENCE_LEVELS.map(({ value, label, sub, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setExperienceLevel(value)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      experienceLevel === value
                        ? 'border-[#009999] bg-[#009999]/8 shadow-sm'
                        : 'border-transparent glass-input hover:border-[#009999]/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="font-bold text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                    {experienceLevel === value && (
                      <div className="mt-2 size-5 rounded-full bg-[#009999] flex items-center justify-center ml-auto">
                        <Check className="size-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Work Style ───────────────────────────────────── */}
          {step === 1 && (
            <div className="glass-panel rounded-[28px] p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center">
                    <Briefcase className="size-5 text-[#009999]" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">What's your work style?</h1>
                </div>
                <p className="text-gray-500 ml-13 mb-5">Select all the employment types you're open to.</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleJobType(t)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                        jobTypes.includes(t)
                          ? 'bg-[#009999] border-[#009999] text-white'
                          : 'glass-input border-transparent text-gray-600 hover:border-[#009999]/40'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900 mb-3">Remote preference</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {REMOTE_OPTIONS.map(({ value, label, sub }) => (
                    <button
                      key={value}
                      onClick={() => setRemotePref(value)}
                      className={`text-left p-3 rounded-2xl border-2 transition-all ${
                        remotePref === value
                          ? 'border-[#009999] bg-[#009999]/8'
                          : 'border-transparent glass-input hover:border-[#009999]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{label}</div>
                          <div className="text-xs text-gray-500">{sub}</div>
                        </div>
                        {remotePref === value && (
                          <div className="size-5 rounded-full bg-[#009999] flex items-center justify-center flex-shrink-0">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Skills & Location ────────────────────────────── */}
          {step === 2 && (
            <div className="glass-panel rounded-[28px] p-6 sm:p-8 space-y-6">
              {/* Skills */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center">
                    <Code2 className="size-5 text-[#009999]" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">Skills & Location</h1>
                </div>
                <p className="text-gray-500 ml-13 mb-4">Pick technologies you want to work with.</p>

                {/* Custom skill input */}
                <div className="flex gap-2 mb-3">
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, addSkill)}
                    placeholder="Add a skill and press Enter…"
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#009999]/40"
                  />
                  <button
                    onClick={addSkill}
                    className="size-9 rounded-xl bg-[#009999] text-white flex items-center justify-center hover:bg-[#007777] transition"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {/* Selected skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map(s => (
                      <span key={s} className="flex items-center gap-1.5 bg-[#009999] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {s}
                        <button onClick={() => setSkills(prev => prev.filter(x => x !== s))}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Popular chips */}
                <p className="text-xs text-gray-400 mb-2">Popular skills</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 20).map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className="glass-input text-xs font-medium text-gray-600 px-3 py-1 rounded-full hover:border-[#009999]/40 hover:text-[#009999] transition border border-transparent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="size-4 text-[#009999]" />
                  <h2 className="text-base font-bold text-gray-900">Preferred locations</h2>
                  <span className="text-xs text-gray-400">(optional)</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, addLocation)}
                    placeholder="e.g. San Francisco, New York…"
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#009999]/40"
                  />
                  <button
                    onClick={addLocation}
                    className="size-9 rounded-xl bg-[#009999] text-white flex items-center justify-center hover:bg-[#007777] transition"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {locations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {locations.map(loc => (
                      <span key={loc} className="flex items-center gap-1.5 bg-[#009999] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {loc}
                        <button onClick={() => setLocations(prev => prev.filter(x => x !== loc))}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Salary ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="glass-panel rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-2xl bg-[#009999]/10 flex items-center justify-center">
                  <DollarSign className="size-5 text-[#009999]" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">Salary expectations</h1>
              </div>
              <p className="text-gray-500 ml-13 mb-6">This stays private and is only used to surface better matches.</p>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-6">
                {SALARY_PRESETS.map(({ label, min, max }) => {
                  const active = salaryMin === min && salaryMax === max;
                  return (
                    <button
                      key={label}
                      onClick={() => { setSalaryMin(min || undefined); setSalaryMax(max); }}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                        active
                          ? 'bg-[#009999] border-[#009999] text-white'
                          : 'glass-input border-transparent text-gray-600 hover:border-[#009999]/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Manual input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Min salary (USD/yr)</label>
                  <input
                    type="number"
                    value={salaryMin ?? ''}
                    onChange={e => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 80000"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#009999]/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Max salary (USD/yr)</label>
                  <input
                    type="number"
                    value={salaryMax ?? ''}
                    onChange={e => setSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 130000"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#009999]/40"
                  />
                </div>
              </div>

              <button
                onClick={() => { setSalaryMin(undefined); setSalaryMax(undefined); }}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition underline"
              >
                I'd rather not say
              </button>

              {/* Summary card */}
              <div className="mt-8 glass-input rounded-2xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-700 mb-3">Your preferences summary</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-[#009999]">•</span>
                  <span><strong>Experience:</strong> {experienceLevel}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-[#009999]">•</span>
                  <span><strong>Job types:</strong> {jobTypes.join(', ') || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-[#009999]">•</span>
                  <span><strong>Remote:</strong> {remotePref}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-[#009999]">•</span>
                  <span><strong>Skills:</strong> {skills.slice(0, 5).join(', ') || '—'}{skills.length > 5 ? ` +${skills.length - 5} more` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-[#009999]">•</span>
                  <span><strong>Locations:</strong> {locations.join(', ') || 'Anywhere'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={back}
              disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition ${
                step === 0 ? 'invisible' : 'glass-panel text-gray-600 hover:bg-white/80'
              }`}
            >
              <ChevronLeft className="size-4" />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition shadow-sm ${
                  canAdvance()
                    ? 'bg-[#009999] text-white hover:bg-[#007777]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-[#009999] text-white hover:bg-[#007777] transition shadow-sm disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Find my jobs'}
                {!saving && <Check className="size-4" />}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
