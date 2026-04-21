import { useAuth } from '../contexts/AuthContext';
import { ScrollText, User, Settings, Briefcase, LayoutGrid, LogOut, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { Avatar } from './Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { BrandLogo } from './BrandLogo';
import { MobileNav } from './MobileNav';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <BrandLogo compact className="flex-shrink-0" />
          </div>

          <nav className="hidden md:flex items-center gap-6 justify-center">
            {user?.role === 'RECRUITER' ? (
              <>
                <Link
                  to="/recruiter/jobs"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname.startsWith('/recruiter/jobs') ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <Briefcase className="size-5" />
                  <span className="hidden group-hover:inline">Job Postings</span>
                </Link>
                <Link
                  to="/recruiter/talent"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname.startsWith('/recruiter/talent') ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <Users className="size-5" />
                  <span className="hidden group-hover:inline">Talent Pool</span>
                </Link>
                <Link
                  to="/forums"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname === '/forums' ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <ScrollText className="size-5" />
                  <span className="hidden group-hover:inline">Community</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/jobs"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname === '/jobs' ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <Briefcase className="size-5" />
                  <span className="hidden group-hover:inline">Jobs</span>
                </Link>
                <Link
                  to="/challenges"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname === '/challenges' ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <LayoutGrid className="size-5" />
                  <span className="hidden group-hover:inline">Dev Hub</span>
                </Link>
                <Link
                  to="/forums"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname === '/forums' ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <Users className="size-5" />
                  <span className="hidden group-hover:inline">Community</span>
                </Link>
                <Link
                  to="/applications"
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 hover:text-[#009999] hover:bg-white/50 transition ${
                    location.pathname.startsWith('/applications') ? 'text-[#009999] bg-white/55' : 'text-gray-700'
                  }`}
                >
                  <ScrollText className="size-5" />
                  <span className="hidden group-hover:inline">Resume</span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="glass-input flex items-center gap-3 rounded-full px-2.5 py-1.5 hover:bg-white/75 transition outline-none">
                {user && <Avatar name={user.name} size={32} />}
                <span className="hidden sm:block font-medium text-gray-900">{user?.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="size-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={logout}>
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
    <MobileNav />
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
