import { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { Bookmark, MapPin, DollarSign, Clock, Building2, Share2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchJobs, toggleSavedJob } from '../api/app';
import { formatRelativeTime } from '../utils/format';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';
import { CompanyLogo } from '../components/CompanyLogo';

interface Job {
  id: number;
  company: {
    name: string;
    logo: string;
    industry: string;
  };
  title: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  description: string;
  requirements: string[];
  isSaved: boolean;
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentJob = jobs[currentJobIndex];

  useEffect(() => {
    fetchJobs()
      .then((data) => {
        setJobs(data.map((job) => ({
          id: job.id,
          company: {
            name: job.company.name,
            logo: job.company.logo,
            industry: job.company.industry,
          },
          title: job.title,
          location: job.location,
          type: job.type,
          salary: job.salary,
          postedTime: formatRelativeTime(job.postedAt),
          description: job.description,
          requirements: job.requirements,
          isSaved: job.saved,
        })));
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Failed to load jobs')))
      .finally(() => setLoading(false));
  }, []);

  const handleScroll = (e: React.WheelEvent) => {
    if (!jobs.length) return;
    if (e.deltaY > 0) {
      setCurrentJobIndex(prev => Math.min(prev + 1, jobs.length - 1));
    } else if (e.deltaY < 0 && currentJobIndex > 0) {
      setCurrentJobIndex(prev => prev - 1);
    }
  };

  const handleSave = async (jobId: number) => {
    try {
      const updated = await toggleSavedJob(jobId);
      setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? { ...job, isSaved: updated.saved } : job));
      toast.success(updated.saved ? 'Job saved' : 'Job removed from saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update saved job'));
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <div className="h-[calc(100vh-64px)]">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="app-shell">
        <Header />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center text-gray-500">
          No jobs available right now.
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />

      <div
        ref={containerRef}
        onWheel={handleScroll}
        className="relative h-[calc(100vh-64px)] overflow-hidden"
      >
        {/* Jobs Container */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `translateY(-${currentJobIndex * 100}%)`,
          }}
        >
          {jobs.map((job) => (
            <div
              key={job.id}
              className="relative h-[calc(100vh-64px)] flex items-center justify-center p-4"
            >
              {/* Job Card */}
              <div className="glass-panel relative max-w-2xl w-full rounded-[30px] overflow-hidden">
                {/* Header */}
                <div className="glass-panel-strong p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <CompanyLogo
                        companyName={job.company.name}
                        logoUrl={job.company.logo}
                        className="size-16"
                      />
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{job.title}</h2>
                        <p className="text-sm opacity-90">{job.company.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-75">{job.company.industry}</p>
                          <span className="text-xs opacity-50">•</span>
                          <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded-full">
                            {job.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-full transition">
                      <MoreVertical className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {/* Job Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-input flex items-center gap-2 rounded-2xl p-3 text-gray-700">
                      <MapPin className="size-5 text-[#009999]" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium">{job.location}</p>
                      </div>
                    </div>
                    <div className="glass-input flex items-center gap-2 rounded-2xl p-3 text-gray-700">
                      <Building2 className="size-5 text-[#009999]" />
                      <div>
                        <p className="text-xs text-gray-500">Job Type</p>
                        <p className="text-sm font-medium">{job.type}</p>
                      </div>
                    </div>
                    <div className="glass-input flex items-center gap-2 rounded-2xl p-3 text-gray-700">
                      <DollarSign className="size-5 text-[#009999]" />
                      <div>
                        <p className="text-xs text-gray-500">Salary</p>
                        <p className="text-sm font-medium">{job.salary}</p>
                      </div>
                    </div>
                    <div className="glass-input flex items-center gap-2 rounded-2xl p-3 text-gray-700">
                      <Clock className="size-5 text-[#009999]" />
                      <div>
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="text-sm font-medium">{job.postedTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About the Role</h3>
                    <p className="text-gray-600 leading-relaxed">{job.description}</p>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-600">
                          <span className="text-[#009999] mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 border-t border-white/50 bg-white/20 p-6 backdrop-blur-sm">
                  <button
                    onClick={() => handleSave(job.id)}
                    className={`flex-shrink-0 p-3 rounded-full transition ${
                      job.isSaved
                        ? 'bg-[#009999] text-white'
                        : 'glass-input text-gray-600 hover:bg-white/75'
                    }`}
                  >
                    <Bookmark className={`size-5 ${job.isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/jobs#${job.id}`);
                      toast.success('Job link copied');
                    }}
                    className="glass-input flex-shrink-0 rounded-full p-3 text-gray-600 hover:bg-white/75 transition"
                  >
                    <Share2 className="size-5" />
                  </button>
                  <button
                    onClick={() => toast.success(`Application started for ${job.title}`)}
                    className="flex-1 py-3 px-6 bg-[#009999] text-white rounded-full font-semibold hover:bg-[#007777] transition"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Indicators */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          {jobs.slice(Math.max(0, currentJobIndex - 5), currentJobIndex + 6).map((_, index) => {
            const actualIndex = Math.max(0, currentJobIndex - 5) + index;
            return (
              <button
                key={actualIndex}
                onClick={() => setCurrentJobIndex(actualIndex)}
                className={`w-1 h-8 rounded-full transition ${
                  actualIndex === currentJobIndex
                    ? 'bg-[#009999]'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>

        {/* Up/Down Navigation Arrows - TikTok Style */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
          {/* Up Arrow */}
          <button
            onClick={() => {
              if (currentJobIndex > 0) {
                setCurrentJobIndex(prev => prev - 1);
              }
            }}
            disabled={currentJobIndex === 0}
            className={`size-12 rounded-full flex items-center justify-center transition shadow-lg ${
              currentJobIndex === 0
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800/80 text-white hover:bg-gray-700 hover:scale-110 active:scale-95'
            }`}
          >
            <ChevronUp className="size-6" />
          </button>

          {/* Down Arrow */}
          <button
            onClick={() => setCurrentJobIndex(prev => Math.min(prev + 1, jobs.length - 1))}
            className="size-12 rounded-full bg-gray-800/80 text-white flex items-center justify-center hover:bg-gray-700 transition hover:scale-110 active:scale-95 shadow-lg"
          >
            <ChevronDown className="size-6" />
          </button>
        </div>

        {/* Job Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-10">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-[#009999]" />
            <span className="font-semibold text-gray-900">Job {currentJobIndex + 1}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{jobs.length}+ available</span>
          </div>
        </div>

        {/* Scroll Hint */}
        {currentJobIndex === 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 text-sm animate-bounce">
            Scroll to see more jobs
          </div>
        )}
      </div>
    </div>
  );
}
