import { Briefcase, LayoutGrid, Users, ScrollText } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const JOB_SEEKER_NAV = [
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/devhub', icon: LayoutGrid, label: 'Dev Hub' },
  { to: '/forums', icon: Users, label: 'Community' },
  { to: '/resume', icon: ScrollText, label: 'Resume' },
];

const RECRUITER_NAV = [
  { to: '/recruiter/jobs', icon: Briefcase, label: 'Postings' },
  { to: '/recruiter/talent', icon: Users, label: 'Talent' },
  { to: '/forums', icon: ScrollText, label: 'Community' },
];

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = user?.role === 'RECRUITER' ? RECRUITER_NAV : JOB_SEEKER_NAV;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-header border-t border-white/30 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition min-w-0 flex-1 ${
                isActive ? 'text-[#009999]' : 'text-gray-500'
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
