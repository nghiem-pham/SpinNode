import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Plus, Briefcase, MapPin, DollarSign, Clock, X, Loader2, Building2, ExternalLink } from 'lucide-react';
import { apiRequest } from '../api/client';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/error';

interface RecruiterJobPosting {
  id: number;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  salary?: string;
  description: string;
  requirements: string;
  applyUrl?: string;
  postedAt: string;
}

interface JobPostForm {
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  salary: string;
  description: string;
  requirements: string;
  applyUrl: string;
}

const EMPTY_FORM: JobPostForm = {
  title: '', companyName: '', location: '', jobType: 'Full-time',
  salary: '', description: '', requirements: '', applyUrl: '',
};

function fetchMyJobs() {
  return apiRequest<RecruiterJobPosting[]>('/api/recruiter/jobs');
}

function postJob(data: JobPostForm) {
  return apiRequest<RecruiterJobPosting>('/api/recruiter/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function RecruiterJobs() {
  const [jobs, setJobs]           = useState<RecruiterJobPosting[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]           = useState<JobPostForm>(EMPTY_FORM);
  const [selected, setSelected]   = useState<RecruiterJobPosting | null>(null);

  useEffect(() => {
    fetchMyJobs()
      .then(data => { setJobs(data); if (data.length) setSelected(data[0]); })
      .catch(err => toast.error(getErrorMessage(err, 'Failed to load postings')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await postJob(form);
      setJobs(prev => [created, ...prev]);
      setSelected(created);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Job posted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post job'));
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof JobPostForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="app-shell">
      <Header />

      <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex-shrink-0 px-3 md:px-6 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-xs text-gray-500 mt-0.5">{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#009999] hover:bg-[#007777] text-white text-sm font-semibold px-4 py-2.5 rounded-full transition shadow-md"
          >
            <Plus className="size-4" /> Post a Job
          </button>
        </div>

        {/* Split layout */}
        <div className="flex flex-1 gap-3 px-3 md:px-6 pb-3 overflow-hidden min-h-0">

          {/* Left: list */}
          <div className="flex flex-col flex-shrink-0 w-full md:w-[340px] lg:w-[380px] overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 className="size-6 text-[#009999] animate-spin" /></div>
            ) : jobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 text-center px-6">
                <Briefcase className="size-12 opacity-20" />
                <p className="text-sm font-medium">No job postings yet</p>
                <p className="text-xs">Click "Post a Job" to create your first listing</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelected(job)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      selected?.id === job.id
                        ? 'glass-panel-strong border-[#009999]/50 shadow-lg shadow-[#009999]/10'
                        : 'glass-input border-transparent hover:border-white/60 hover:shadow-md'
                    }`}
                  >
                    <p className={`font-semibold text-sm truncate ${selected?.id === job.id ? 'text-white' : 'text-gray-900'}`}>{job.title}</p>
                    <p className={`text-xs truncate mt-0.5 ${selected?.id === job.id ? 'text-white/70' : 'text-gray-500'}`}>{job.companyName}</p>
                    <div className={`flex items-center gap-3 mt-2 text-xs ${selected?.id === job.id ? 'text-white/60' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location.split(',')[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatRelativeTime(job.postedAt)}</span>
                    </div>
                    {job.salary && (
                      <p className={`text-xs font-semibold mt-1 flex items-center gap-0.5 ${selected?.id === job.id ? 'text-white/90' : 'text-[#009999]'}`}>
                        <DollarSign className="size-3" />{job.salary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className="flex-1 overflow-hidden min-w-0">
            {selected ? (
              <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="glass-panel-strong p-5 md:p-6 text-white flex-shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold">{selected.title}</h2>
                      <p className="text-sm opacity-80 mt-0.5 flex items-center gap-1.5"><Building2 className="size-4" />{selected.companyName}</p>
                    </div>
                    {selected.applyUrl && (
                      <a href={selected.applyUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition">
                        <ExternalLink className="size-3.5" /> Apply Link
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { icon: <MapPin className="size-3" />, label: selected.location },
                      { icon: <Briefcase className="size-3" />, label: selected.jobType },
                      ...(selected.salary ? [{ icon: <DollarSign className="size-3" />, label: selected.salary }] : []),
                      { icon: <Clock className="size-3" />, label: formatRelativeTime(selected.postedAt) },
                    ].map(({ icon, label }) => (
                      <span key={label} className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1">{icon}{label}</span>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 min-h-0">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">About the Role</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Requirements</h3>
                    <ul className="space-y-1.5">
                      {selected.requirements.split('\n').filter(Boolean).map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-[#009999] mt-0.5 flex-shrink-0">▸</span>{req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Briefcase className="size-12 opacity-20 mx-auto mb-2" />
                  <p className="text-sm">Select a posting to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Post a New Job</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Job Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Senior Frontend Engineer" required />
                <Field label="Company Name *" value={form.companyName} onChange={v => set('companyName', v)} placeholder="e.g. Acme Inc." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Location *" value={form.location} onChange={v => set('location', v)} placeholder="e.g. San Francisco, CA" required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job Type</label>
                  <select value={form.jobType} onChange={e => set('jobType', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40">
                    {['Full-time','Part-time','Contract','Internship','Remote'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Salary Range" value={form.salary} onChange={v => set('salary', v)} placeholder="e.g. $120k – $160k" />
                <Field label="Apply URL" value={form.applyUrl} onChange={v => set('applyUrl', v)} placeholder="https://..." />
              </div>
              <TextareaField label="Job Description *" value={form.description} onChange={v => set('description', v)} placeholder="Describe the role, responsibilities, and team..." rows={4} required />
              <TextareaField label="Requirements *" value={form.requirements} onChange={v => set('requirements', v)} placeholder={"One requirement per line:\n3+ years React experience\nStrong TypeScript skills"} rows={4} required />

              <div className="flex gap-3 pt-2 pb-1">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl bg-[#009999] text-white text-sm font-semibold hover:bg-[#007777] transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="size-4 animate-spin" /> Posting...</> : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <textarea required={required} rows={rows ?? 3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40 resize-none" />
    </div>
  );
}
