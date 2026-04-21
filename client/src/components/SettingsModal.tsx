import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { changePassword, fetchProfile, updateVisibility } from '../api/app';
import { getErrorMessage } from '../utils/error';

type Tab = 'security' | 'visibility';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('security');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Visibility state
  const [profileVisible, setProfileVisible] = useState(true);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'visibility') {
      setLoadingVisibility(true);
      fetchProfile()
        .then((p) => setProfileVisible(p.profileVisible ?? true))
        .catch(() => {})
        .finally(() => setLoadingVisibility(false));
    }
  }, [isOpen, tab]);

  // Reset security fields when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setTab('security');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to change password'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveVisibility = async () => {
    setSavingVisibility(true);
    try {
      await updateVisibility(profileVisible);
      toast.success('Visibility updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update visibility'));
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="glass-input rounded-xl p-2 hover:bg-white/75 transition"
          >
            <X className="size-4 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/50 px-6">
          <button
            onClick={() => setTab('security')}
            className={`flex items-center gap-1.5 pb-3 px-1 mr-6 border-b-2 text-sm font-medium transition ${
              tab === 'security'
                ? 'border-[#009999] text-[#009999]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="size-3.5" />
            Security
          </button>
          <button
            onClick={() => setTab('visibility')}
            className={`flex items-center gap-1.5 pb-3 px-1 border-b-2 text-sm font-medium transition ${
              tab === 'visibility'
                ? 'border-[#009999] text-[#009999]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="size-3.5" />
            Visibility
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-sm text-gray-500 mb-1">Update your account password.</p>

              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="glass-input soft-ring w-full rounded-2xl px-4 py-2.5 pr-10 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="glass-input soft-ring w-full rounded-2xl px-4 py-2.5 pr-10 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className={`glass-input soft-ring w-full rounded-2xl px-4 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400 ${
                    !passwordsMatch ? 'border-red-400 focus:border-red-400' : ''
                  }`}
                />
                {!passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  !passwordsMatch
                }
                className="w-full py-2.5 bg-[#009999] hover:bg-[#008080] text-white font-semibold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          )}

          {/* ── Visibility Tab ── */}
          {tab === 'visibility' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Control who can view your profile.</p>

              {loadingVisibility ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
              ) : (
                <>
                  {/* Public option */}
                  <button
                    onClick={() => setProfileVisible(true)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition ${
                      profileVisible
                        ? 'border-[#009999] bg-[#009999]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        profileVisible ? 'bg-[#009999] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Eye className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">Public</p>
                        {profileVisible && <Check className="size-4 text-[#009999]" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Anyone can view your profile, experience, and projects.
                      </p>
                    </div>
                  </button>

                  {/* Private option */}
                  <button
                    onClick={() => setProfileVisible(false)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition ${
                      !profileVisible
                        ? 'border-[#009999] bg-[#009999]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        !profileVisible ? 'bg-[#009999] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <EyeOff className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">Private</p>
                        {!profileVisible && <Check className="size-4 text-[#009999]" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Your profile is hidden from other users. Only you can see it.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleSaveVisibility}
                    disabled={savingVisibility}
                    className="w-full py-2.5 bg-[#009999] hover:bg-[#008080] text-white font-semibold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  >
                    {savingVisibility ? 'Saving…' : 'Save Visibility'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
