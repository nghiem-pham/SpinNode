import { Link } from 'react-router';
import { Briefcase, Code2, Users, MessageSquare, ScrollText, Globe, Star, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Job Feed',
    description: 'Browse curated tech roles, save favourites, and apply in one tap.',
  },
  {
    icon: Code2,
    title: 'Coding Challenges',
    description: 'Sharpen your skills with real-world challenges and let your solve rate speak for you.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with engineers and founders, follow people, and build your professional network.',
  },
  {
    icon: MessageSquare,
    title: 'Forums',
    description: 'Ask questions and discuss industry trends in a developer-first community.',
  },
  {
    icon: ScrollText,
    title: 'AI Applications',
    description: 'Scan your resume, generate tailored cover letters, and get AI writing assistance.',
  },
  {
    icon: Globe,
    title: 'Public Profile',
    description: 'A living profile that showcases your skills, projects, and experience.',
  },
];

export function Landing() {
  return (
    <div className="light min-h-screen text-gray-900 overflow-x-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 10% -10%, rgba(0,153,153,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 5%,  rgba(14,143,143,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(116,224,211,0.10) 0%, transparent 70%),
            linear-gradient(180deg, #edf3f4 0%, #f4fafa 100%)
          `,
        }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,153,153,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,153,153,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-header border-b border-white/30" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo showTagline />
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#009999] transition px-3 py-1.5">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-semibold bg-[#009999] text-white px-4 py-2 rounded-full hover:bg-[#007777] transition shadow-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full text-sm font-medium text-[#009999] mb-8 shadow-sm">
          <Star className="size-3.5 fill-[#009999]" />
          The career platform built for developers
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          <span style={{
            background: 'linear-gradient(135deg, #013B44 0%, #009999 55%, #74E0D3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Your career,
          </span>
          <br />
          <span className="text-gray-900">in motion.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover jobs you'll love, prove your skills with real challenges, and connect with the engineers and companies shaping tech.
        </p>

        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-[#009999] text-white text-base font-semibold px-8 py-3.5 rounded-full hover:bg-[#007777] transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          Get started
          <ArrowRight className="size-4" />
        </Link>

      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Everything in one place</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Jobs, skills, community, and AI tools — built for developers.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="glass-panel rounded-[24px] p-6 hover:shadow-lg transition-shadow group">
              <div className="size-11 rounded-2xl bg-[#009999]/10 flex items-center justify-center mb-4 group-hover:bg-[#009999]/15 transition-colors">
                <Icon className="size-5 text-[#009999]" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-24">
        <div
          className="relative rounded-[32px] overflow-hidden p-10 sm:p-16 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #013B44 0%, #007777 50%, #009999 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">Ready to put your career in motion?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">Join thousands of developers who found their next opportunity on Spin Node.</p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-[#009999] font-bold text-base px-8 py-3.5 rounded-full hover:bg-gray-100 transition shadow-lg"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/40 glass-header py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <BrandLogo compact showTagline={false} />
          <p>© {new Date().getFullYear()} Spin Node. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-[#009999] transition">Log in</Link>
            <Link to="/signup" className="hover:text-[#009999] transition">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
