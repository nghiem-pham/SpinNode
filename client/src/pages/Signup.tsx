import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import type { UserRole } from '../api/auth';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('JOB_SEEKER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-[28px] p-8">
          <div className="flex justify-center mb-6">
            <BrandLogo showTagline />
          </div>
          <p className="text-slate-600 text-center mb-8">Start your career journey today</p>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="glass-input w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/80 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700">
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/60"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 py-1 rounded-full bg-white/55 text-slate-500 backdrop-blur-sm">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-red-700 backdrop-blur-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am joining as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('JOB_SEEKER')}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    role === 'JOB_SEEKER'
                      ? 'border-[#009999] bg-[#009999]/10 text-[#007777]'
                      : 'glass-input text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <div className="font-semibold">Job Seeker</div>
                  <div className="mt-1 text-xs text-slate-500">Browse jobs, save roles, and apply.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('RECRUITER')}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    role === 'RECRUITER'
                      ? 'border-[#009999] bg-[#009999]/10 text-[#007777]'
                      : 'glass-input text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <div className="font-semibold">Recruiter</div>
                  <div className="mt-1 text-xs text-slate-500">Post jobs and manage candidates.</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input soft-ring w-full px-4 py-3 rounded-2xl outline-none transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input soft-ring w-full px-4 py-3 rounded-2xl outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input soft-ring w-full px-4 py-3 rounded-2xl outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input soft-ring w-full px-4 py-3 rounded-2xl outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#009999] text-white py-3 rounded-2xl hover:bg-[#007777] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-[0_18px_45px_rgba(0,153,153,0.22)]"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#009999] hover:text-[#007777] font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
