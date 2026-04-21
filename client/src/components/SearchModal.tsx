import { useEffect, useRef } from 'react';
import { X, Briefcase, Building2, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { Link } from 'react-router';
import { CompanyLogo } from './CompanyLogo';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { searchResults, searchQuery, isSearching } = useSearch();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const jobResults = searchResults.filter(r => r.type === 'job');
  const companyResults = searchResults.filter(r => r.type === 'company');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 pt-20 backdrop-blur-md">
      <div
        ref={modalRef}
        className="glass-panel mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px]"
      >
        {/* Header */}
        <div className="glass-panel-strong flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2 text-white">
            <TrendingUp className="size-5" />
            <h2 className="font-semibold">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search Results'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full size-12 border-4 border-gray-200 border-t-[#009999]" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Briefcase className="size-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-2">Try searching for job titles, companies, or locations</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Job Results */}
              {jobResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="size-5 text-[#009999]" />
                    <h3 className="font-semibold text-gray-900">
                      Jobs ({jobResults.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {jobResults.map((result) => (
                      <Link
                        key={result.id}
                        to="/"
                        onClick={onClose}
                        className="glass-input block rounded-[24px] p-4 transition group hover:border-[#009999]/40 hover:bg-white/75"
                      >
                        <div className="flex items-start gap-4">
                          <CompanyLogo
                            companyName={result.subtitle}
                            logoUrl={result.logo}
                            className="size-12 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#009999] transition truncate">
                              {result.title}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">
                              {result.subtitle}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {result.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  <span>{result.location}</span>
                                </div>
                              )}
                              {result.salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="size-3" />
                                  <span>{result.salary}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Results */}
              {companyResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="size-5 text-[#009999]" />
                    <h3 className="font-semibold text-gray-900">
                      Companies ({companyResults.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {companyResults.map((result) => (
                      <Link
                        key={result.id}
                        to="/"
                        onClick={onClose}
                        className="glass-input block rounded-[24px] p-4 transition group hover:border-[#009999]/40 hover:bg-white/75"
                      >
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            companyName={result.title}
                            logoUrl={result.logo}
                            className="size-12 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#009999] transition truncate">
                              {result.title}
                            </h4>
                            <p className="text-xs text-gray-600">{result.subtitle}</p>
                            <p className="text-xs text-[#009999] font-medium mt-1">
                              {result.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/50 bg-white/20 p-4 text-center text-sm text-gray-500">
          Press <kbd className="glass-input rounded-lg px-2 py-1 text-xs font-mono">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
}
