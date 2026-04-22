import { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { Upload, Loader2, Users, Briefcase, Star, ChevronDown, FileText, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client';
import { parseResume, aiChat } from '../api/app';
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

interface CandidateResult {
  fileName: string;
  name: string;
  fitScore: number;
  summary: string;
  topSkills: string[];
  strengths: string[];
  concerns: string[];
}

interface AIRankingResult {
  candidates: CandidateResult[];
  recommendation: string;
}

function parseRankingResult(raw: string): AIRankingResult {
  const stripped = raw.replace(/```[\w]*\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch { /* try next */ }
  try {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return { candidates: [], recommendation: raw };
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? '#009999' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div
      className="flex-shrink-0 size-14 rounded-full flex items-center justify-center font-bold text-lg text-white"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)` }}
    >
      <div className="size-10 rounded-full bg-white flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export function TalentPool() {
  const [jobs, setJobs] = useState<RecruiterJobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<RecruiterJobPosting | null>(null);
  const [jobDropOpen, setJobDropOpen] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AIRankingResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiRequest<RecruiterJobPosting[]>('/api/recruiter/jobs')
      .then(data => { setJobs(data); if (data.length) setSelectedJob(data[0]); })
      .catch(err => toast.error(getErrorMessage(err, 'Failed to load jobs')))
      .finally(() => setLoadingJobs(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files).filter(f => !files.some(x => x.name === f.name));
      setFiles(prev => [...prev, ...added]);
    }
    e.target.value = '';
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleAnalyze = async () => {
    if (!selectedJob) { toast.error('Please select a job posting first'); return; }
    if (files.length === 0) { toast.error('Please upload at least one resume'); return; }
    setAnalyzing(true);
    setResults(null);
    setSelectedCandidate(null);
    try {
      // Parse all resumes in parallel
      const parsed = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await parseResume(file);
            return { fileName: file.name, profile: res.profile };
          } catch {
            return { fileName: file.name, profile: null };
          }
        })
      );

      const validCandidates = parsed.filter(p => p.profile !== null);
      if (validCandidates.length === 0) {
        toast.error('Could not parse any resumes. Please check the file formats.');
        setAnalyzing(false);
        return;
      }

      const candidateProfiles = validCandidates.map((c, i) =>
        `Candidate ${i + 1} (${c.fileName}):
Name: ${c.profile!.name || 'Unknown'}
Bio: ${c.profile!.bio || 'N/A'}
Skills: ${c.profile!.skills.map(s => `${s.name} (${s.level})`).join(', ') || 'None listed'}
Experience: ${c.profile!.experiences.map(e => `${e.title} at ${e.company} (${e.duration})`).join('; ') || 'None listed'}
Projects: ${c.profile!.projects.map(p => `${p.name}: ${p.description}`).join('; ') || 'None listed'}`
      ).join('\n\n---\n\n');

      const prompt = `You are a technical recruiter AI. Rank the following candidates for this job posting and return a JSON object.

JOB POSTING:
Title: ${selectedJob.title}
Company: ${selectedJob.companyName}
Location: ${selectedJob.location}
Type: ${selectedJob.jobType}
${selectedJob.salary ? `Salary: ${selectedJob.salary}` : ''}
Description: ${selectedJob.description}
Requirements: ${selectedJob.requirements}

CANDIDATES:
${candidateProfiles}

Return a JSON object with this exact structure (no markdown, no extra text):
{
  "candidates": [
    {
      "fileName": "resume_filename.pdf",
      "name": "Candidate Name",
      "fitScore": 85,
      "summary": "2-3 sentence summary of why they are or aren't a fit",
      "topSkills": ["skill1", "skill2", "skill3"],
      "strengths": ["strength 1", "strength 2"],
      "concerns": ["concern 1"]
    }
  ],
  "recommendation": "Overall hiring recommendation paragraph"
}

Sort candidates by fitScore descending. fitScore is 0-100.`;

      const aiResponse = await aiChat(prompt);
      const ranking = parseRankingResult(aiResponse.text);
      setResults(ranking);
      if (ranking.candidates.length > 0) setSelectedCandidate(ranking.candidates[0]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Analysis failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex-shrink-0 px-3 md:px-6 pt-4 pb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Talent Pool</h1>
            <p className="text-xs text-gray-500 mt-0.5">Upload resumes and let AI rank your candidates</p>
          </div>
        </div>

        <div className="flex flex-1 gap-3 px-3 md:px-6 pb-3 overflow-hidden min-h-0">

          {/* Left: Setup panel */}
          <div className="flex flex-col gap-3 w-full md:w-[340px] lg:w-[380px] flex-shrink-0 overflow-y-auto">

            {/* Job selector */}
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Job Posting</p>
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="size-4 animate-spin" /> Loading...</div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-gray-400">No job postings yet. Create one first.</p>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setJobDropOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-[#009999]/50 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="size-4 text-[#009999] flex-shrink-0" />
                      <span className="truncate font-medium">{selectedJob?.title ?? 'Choose a job'}</span>
                    </div>
                    <ChevronDown className={`size-4 text-gray-400 flex-shrink-0 transition-transform ${jobDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {jobDropOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                      {jobs.map(job => (
                        <button
                          key={job.id}
                          onClick={() => { setSelectedJob(job); setJobDropOpen(false); setResults(null); }}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2 ${selectedJob?.id === job.id ? 'text-[#009999] font-medium' : 'text-gray-700'}`}
                        >
                          {selectedJob?.id === job.id && <CheckCircle2 className="size-4 flex-shrink-0" />}
                          <span className="truncate">{job.title} — {job.companyName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resume upload */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload Resumes</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#009999]/50 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:text-[#009999] transition"
              >
                <Upload className="size-7" />
                <span className="text-sm font-medium">Click to upload PDFs</span>
                <span className="text-xs">Multiple files supported</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFileChange} />

              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map(f => (
                    <div key={f.name} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <FileText className="size-4 text-[#009999] flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">{f.name}</span>
                      <button onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-400 transition">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={analyzing || files.length === 0 || !selectedJob}
                className="w-full py-2.5 rounded-xl bg-[#009999] hover:bg-[#007777] text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <><Loader2 className="size-4 animate-spin" /> Analyzing {files.length} resume{files.length !== 1 ? 's' : ''}...</>
                ) : (
                  <><Sparkles className="size-4" /> Rank Candidates with AI</>
                )}
              </button>
            </div>

            {/* Ranked list */}
            {results && results.candidates.length > 0 && (
              <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Ranked Candidates ({results.candidates.length})
                </p>
                {results.candidates.map((c, i) => (
                  <button
                    key={c.fileName}
                    onClick={() => setSelectedCandidate(c)}
                    className={`w-full text-left p-3 rounded-xl transition border ${
                      selectedCandidate?.fileName === c.fileName
                        ? 'border-[#009999]/40 bg-[#009999]/5'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                        i === 0 ? 'bg-[#009999]' : i === 1 ? 'bg-blue-400' : 'bg-gray-400'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.fileName}</p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${
                        c.fitScore >= 75 ? 'text-[#009999]' : c.fitScore >= 50 ? 'text-amber-500' : 'text-red-400'
                      }`}>{c.fitScore}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Candidate detail */}
          <div className="flex-1 overflow-hidden min-w-0">
            {analyzing ? (
              <div className="glass-panel rounded-2xl h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                <Loader2 className="size-10 text-[#009999] animate-spin" />
                <p className="text-sm font-medium">Parsing and ranking candidates...</p>
                <p className="text-xs">Analyzing {files.length} resume{files.length !== 1 ? 's' : ''} against job requirements</p>
              </div>
            ) : selectedCandidate ? (
              <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="glass-panel-strong p-5 md:p-6 text-white flex-shrink-0">
                  <div className="flex items-start gap-4">
                    <ScoreCircle score={selectedCandidate.fitScore} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                      <p className="text-sm opacity-70 mt-0.5">{selectedCandidate.fileName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedCandidate.topSkills.map(skill => (
                          <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/20">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 min-h-0">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Summary</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedCandidate.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-[#009999] uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Star className="size-3" /> Strengths
                      </h3>
                      <ul className="space-y-1.5">
                        {selectedCandidate.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-[#009999] mt-0.5 flex-shrink-0">▸</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Users className="size-3" /> Concerns
                      </h3>
                      {selectedCandidate.concerns.length > 0 ? (
                        <ul className="space-y-1.5">
                          {selectedCandidate.concerns.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>{c}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No major concerns</p>
                      )}
                    </div>
                  </div>

                  {results?.recommendation && (
                    <div className="bg-[#009999]/5 border border-[#009999]/20 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-[#009999] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Sparkles className="size-3" /> Overall Recommendation
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{results.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : results && results.candidates.length === 0 ? (
              <div className="glass-panel rounded-2xl h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                <Users className="size-12 opacity-20" />
                <p className="text-sm font-medium">No candidates could be analyzed</p>
                <p className="text-xs">Try uploading different resume files</p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                <Users className="size-12 opacity-20" />
                <p className="text-sm font-medium">Upload resumes to get started</p>
                <p className="text-xs text-center px-8">Select a job posting, upload PDF resumes,<br />and let AI rank your candidates</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
